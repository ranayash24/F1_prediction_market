"use client";

import { useEffect, useState } from "react";
import type { TelemetrySnapshot } from "@/lib/telemetry";

const FLAG_LABELS: Record<string, { label: string; cls: string }> = {
  GREEN:  { label: "GREEN FLAG",  cls: "flag-badge flag-badge--green" },
  YELLOW: { label: "YELLOW FLAG", cls: "flag-badge flag-badge--yellow" },
  RED:    { label: "RED FLAG",    cls: "flag-badge flag-badge--red" },
  SC:     { label: "SAFETY CAR", cls: "flag-badge flag-badge--sc" },
  VSC:    { label: "VIRTUAL SC",  cls: "flag-badge flag-badge--sc" },
  CHEQUERED: { label: "CHEQUERED", cls: "flag-badge flag-badge--green" },
};

export default function TelemetryPanel() {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [source, setSource] = useState<string>("loading");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const load = async () => {
      try {
        const res = await fetch("/api/telemetry", { cache: "no-store" });
        const payload = await res.json();
        setSnapshot(payload.data ?? payload);
        setSource(payload.source ?? "unknown");
        setLastUpdated(new Date().toLocaleTimeString());
      } catch {
        setSource("offline");
      }
    };

    load();
    timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  if (source === "loading") {
    return (
      <div className="card telemetry-v2">
        <div className="telemetry-v2__shimmer">
          {[1, 2, 3].map((i) => (
            <div key={i} className="telemetry-v2__shimmer-row" />
          ))}
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="card telemetry-v2">
        <p className="muted">Telemetry feed unavailable.</p>
      </div>
    );
  }

  if (source === "openf1-restricted") {
    return (
      <div className="card telemetry-v2 telemetry-v2--restricted">
        <div className="telemetry-v2__header">
          <div className="telemetry-v2__session">
            <span className="telemetry-v2__live-dot telemetry-v2__live-dot--on">● LIVE NOW</span>
            <span className="telemetry-v2__session-name">Australian Grand Prix — Qualifying</span>
          </div>
          <span className="flag-badge flag-badge--green">GREEN FLAG</span>
        </div>
        <div className="telemetry-restricted-banner">
          <div className="telemetry-restricted-banner__icon">🏁</div>
          <div>
            <p className="telemetry-restricted-banner__title">Live session in progress</p>
            <p className="muted small">
              OpenF1 restricts free API access during live sessions to reduce load.
              Full telemetry data — positions, gaps, race control — will appear automatically once qualifying ends.
            </p>
          </div>
        </div>
        <p className="telemetry-v2__footer muted small">Via OpenF1 · Free tier · Resumes after session</p>
      </div>
    );
  }

  const flagInfo = FLAG_LABELS[snapshot.flag?.toUpperCase()] ?? FLAG_LABELS.GREEN;

  return (
    <div className="card telemetry-v2">
      {/* Header */}
      <div className="telemetry-v2__header">
        <div className="telemetry-v2__session">
          <span className={`telemetry-v2__live-dot ${snapshot.isLive ? "telemetry-v2__live-dot--on" : ""}`}>
            {snapshot.isLive ? "● LIVE" : "● RECENT"}
          </span>
          <span className="telemetry-v2__session-name">{snapshot.sessionName}</span>
          {snapshot.circuit && (
            <span className="telemetry-v2__circuit">{snapshot.circuit}</span>
          )}
        </div>
        <div className="telemetry-v2__right">
          <span className={flagInfo.cls}>{flagInfo.label}</span>
          <span className="telemetry-v2__source">{source}</span>
        </div>
      </div>

      {/* Timing tower */}
      {snapshot.top5.length > 0 ? (
        <div className="timing-tower">
          <div className="timing-tower__head">
            <span>POS</span>
            <span>DRIVER</span>
            <span>TEAM</span>
            <span>GAP</span>
            <span>INTERVAL</span>
          </div>
          {snapshot.top5.map((driver) => (
            <div
              key={driver.position}
              className={`timing-row ${driver.position === 1 ? "timing-row--leader" : ""}`}
            >
              <span className="timing-row__pos">{driver.position}</span>
              <span className="timing-row__driver">
                <span
                  className="timing-row__colour"
                  style={{ background: driver.teamColour }}
                />
                <strong>{driver.acronym}</strong>
                <span className="timing-row__name muted">{driver.name}</span>
              </span>
              <span className="timing-row__team muted">{driver.team}</span>
              <span className="timing-row__gap">
                {driver.gapToLeader === "LEADER" ? (
                  <span className="timing-row__leader-badge">LEADER</span>
                ) : (
                  driver.gapToLeader
                )}
              </span>
              <span className="timing-row__interval muted">{driver.interval}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback for simulated / legacy data */
        <div className="telemetry-v2__legacy">
          <div>
            <span className="meta">Leader</span>
            <strong>{snapshot.leader}</strong>
          </div>
          <div>
            <span className="meta">Gap P2</span>
            <strong>{snapshot.gapToSecond}</strong>
          </div>
          {snapshot.speed > 0 && (
            <div>
              <span className="meta">Speed</span>
              <strong>{snapshot.speed} km/h</strong>
            </div>
          )}
        </div>
      )}

      {/* Race control messages */}
      {snapshot.raceControlMessages.length > 0 && (
        <div className="telemetry-v2__rc">
          <p className="telemetry-v2__rc-title">RACE CONTROL</p>
          {snapshot.raceControlMessages.map((msg, i) => (
            <p key={i} className="telemetry-v2__rc-msg">{msg}</p>
          ))}
        </div>
      )}

      <p className="telemetry-v2__footer muted small">
        Via OpenF1 · Updates every 10s
        {lastUpdated && <> · {lastUpdated}</>}
      </p>
    </div>
  );
}
