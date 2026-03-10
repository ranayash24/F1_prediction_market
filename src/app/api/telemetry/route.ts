import { NextResponse } from "next/server";
import { buildTelemetrySnapshot } from "@/lib/telemetry";
import type { TelemetryDriver, TelemetrySnapshot } from "@/lib/telemetry";

const OPENF1 = "https://api.openf1.org/v1";

const memoryRateLimit = new Map<string, { count: number; timestamp: number }>();

function rateLimit(ip: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const entry = memoryRateLimit.get(ip);
  if (!entry || now - entry.timestamp > windowMs) {
    memoryRateLimit.set(ip, { count: 1, timestamp: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

async function openf1<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${OPENF1}${path}`, {
      signal: controller.signal,
      next: { revalidate: 5 },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type OF1Session = {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string | null;
  circuit_short_name: string;
  country_name: string;
};

type OF1Position = { driver_number: number; position: number; date: string };
type OF1Interval = { driver_number: number; gap_to_leader: string | number | null; interval: string | number | null; date: string };
type OF1Driver = { driver_number: number; full_name: string; name_acronym: string; team_name: string; team_colour: string };
type OF1RaceControl = { message: string; flag: string | null; category: string; date: string };

function latestPerDriver<T extends { driver_number: number; date: string }>(items: T[]): Map<number, T> {
  const map = new Map<number, T>();
  for (const item of items) {
    const existing = map.get(item.driver_number);
    if (!existing || item.date > existing.date) map.set(item.driver_number, item);
  }
  return map;
}

function formatGap(raw: string | number | null | undefined, isLeader: boolean): string {
  if (isLeader) return "LEADER";
  if (!raw && raw !== 0) return "—";
  const n = parseFloat(String(raw));
  if (isNaN(n)) return String(raw);
  return `+${n.toFixed(3)}s`;
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Allow override via env
  const externalUrl = process.env.TELEMETRY_API_URL;
  if (externalUrl) {
    try {
      const res = await fetch(externalUrl, { next: { revalidate: 5 } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return NextResponse.json({ source: "external", data });
    } catch {
      return NextResponse.json({ source: "simulated", data: buildTelemetrySnapshot() });
    }
  }

  try {
    // 1. Get latest session — OpenF1 restricts free access during live sessions
    const sessionsRaw = await fetch(`${OPENF1}/sessions?session_key=latest`, {
      next: { revalidate: 5 },
    }).catch(() => null);

    if (sessionsRaw) {
      const sessionsBody = await sessionsRaw.json().catch(() => null);
      // OpenF1 returns a detail string when access is restricted during a live session
      if (sessionsBody?.detail && typeof sessionsBody.detail === "string" && sessionsBody.detail.includes("Live F1 session")) {
        return NextResponse.json({
          source: "openf1-restricted",
          data: {
            ...buildTelemetrySnapshot(),
            isLive: true,
            sessionName: "LIVE SESSION",
            circuit: "Access restricted during live sessions",
            flag: "GREEN",
            top5: [],
            raceControlMessages: ["OpenF1 free tier is restricted during live sessions. Data resumes after the session ends."],
          },
        });
      }
    }

    const sessions = (sessionsRaw?.ok ? await sessionsRaw.json().catch(() => []) : []) as OF1Session[];
    if (!sessions?.length) throw new Error("no session");
    const session = sessions[sessions.length - 1];

    // Determine if session is currently live (within 3 hours of end or no end time)
    const now = Date.now();
    const endTime = session.date_end ? new Date(session.date_end).getTime() : Infinity;
    const startTime = new Date(session.date_start).getTime();
    const isLive = now >= startTime && (now <= endTime || endTime === Infinity);

    // Fetch recent data — last 15 minutes for live, otherwise last-known
    const cutoff = new Date(Math.max(startTime, now - 15 * 60 * 1000)).toISOString().slice(0, 19);
    const dateParam = isLive ? `&date>${cutoff}` : "";

    const [positionData, intervalData, driverData, raceControlData] = await Promise.all([
      openf1<OF1Position[]>(`/position?session_key=${session.session_key}${dateParam}`),
      openf1<OF1Interval[]>(`/intervals?session_key=${session.session_key}${dateParam}`),
      openf1<OF1Driver[]>(`/drivers?session_key=${session.session_key}`),
      openf1<OF1RaceControl[]>(`/race_control?session_key=${session.session_key}${dateParam}`),
    ]);

    if (!positionData?.length || !driverData?.length) throw new Error("no data");

    const driverMap = new Map(driverData.map((d) => [d.driver_number, d]));
    const latestPositions = latestPerDriver(positionData);
    const latestIntervals = intervalData?.length ? latestPerDriver(intervalData) : new Map<number, OF1Interval>();

    const sorted = [...latestPositions.values()].sort((a, b) => a.position - b.position);

    const top5: TelemetryDriver[] = sorted.slice(0, 5).map((p) => {
      const driver = driverMap.get(p.driver_number);
      const intv = latestIntervals.get(p.driver_number);
      const isLeader = p.position === 1;
      return {
        position: p.position,
        name: driver?.full_name ?? `#${p.driver_number}`,
        acronym: driver?.name_acronym ?? "---",
        team: driver?.team_name ?? "",
        teamColour: driver ? `#${driver.team_colour}` : "#888",
        gapToLeader: formatGap(intv?.gap_to_leader, isLeader),
        interval: isLeader ? "" : formatGap(intv?.interval, false),
      };
    });

    // Race control: latest flag + last 3 messages
    const rcSorted = raceControlData ? [...raceControlData].sort((a, b) => b.date.localeCompare(a.date)) : [];
    const latestFlag = rcSorted.find((rc) => rc.flag)?.flag ?? "GREEN";
    const messages = rcSorted.slice(0, 3).map((rc) => rc.message);

    const leader = top5[0];
    const second = top5[1];

    const snapshot: TelemetrySnapshot = {
      timestamp: new Date().toISOString(),
      isLive,
      sessionName: session.session_name ?? "Session",
      circuit: session.circuit_short_name ?? session.country_name ?? "",
      flag: latestFlag,
      leader: leader?.acronym ?? "—",
      gapToSecond: second?.gapToLeader ?? "—",
      top5,
      raceControlMessages: messages,
      tyre: "—",
      speed: 0,
      sector1: "—",
      sector2: "—",
      sector3: "—",
    };

    const source = isLive ? "openf1-live" : "openf1-recent";
    return NextResponse.json({ source, data: snapshot });
  } catch {
    return NextResponse.json({ source: "simulated", data: buildTelemetrySnapshot() });
  }
}
