import { NextResponse } from "next/server";
import { buildTelemetrySnapshot } from "@/lib/telemetry";

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

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const externalUrl = process.env.TELEMETRY_API_URL;
  if (externalUrl) {
    try {
      const response = await fetch(externalUrl, { next: { revalidate: 5 } });
      if (!response.ok) {
        throw new Error("Telemetry fetch failed");
      }
      const data = await response.json();
      return NextResponse.json({ source: "external", data });
    } catch (error) {
      return NextResponse.json({ source: "fallback", data: buildTelemetrySnapshot() });
    }
  }

  return NextResponse.json({ source: "simulated", data: buildTelemetrySnapshot() });
}
