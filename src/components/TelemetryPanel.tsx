"use client";

import { useEffect, useState } from "react";
import type { TelemetrySnapshot } from "@/lib/telemetry";

export default function TelemetryPanel() {
  const telemetryEnabled = false;
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [source, setSource] = useState("simulated");

  useEffect(() => {
    if (!telemetryEnabled) return;
    let timer: NodeJS.Timeout;

    const loadTelemetry = async () => {
      try {
        const response = await fetch("/api/telemetry", { cache: "no-store" });
        const payload = await response.json();
        setSnapshot(payload.data ?? payload);
        setSource(payload.source ?? "simulated");
      } catch (error) {
        setSnapshot(null);
        setSource("offline");
      }
    };

    loadTelemetry();
    timer = setInterval(loadTelemetry, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!telemetryEnabled) {
    return (
      <div className="card">
        <h3>Live telemetry</h3>
        <p className="muted">Telemetry feed paused.</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="card">
        <h3>Live telemetry</h3>
        <p className="muted">Telemetry feed unavailable.</p>
      </div>
    );
  }

  return (
    <div className="card telemetry">
      <div className="telemetry__header">
        <h3>Live telemetry</h3>
        <span className="pill">{source}</span>
      </div>
      <div className="telemetry__grid">
        <div>
          <span className="meta">Leader</span>
          <strong>{snapshot.leader}</strong>
        </div>
        <div>
          <span className="meta">Gap</span>
          <strong>{snapshot.gapToSecond}</strong>
        </div>
        <div>
          <span className="meta">Tyre</span>
          <strong>{snapshot.tyre}</strong>
        </div>
        <div>
          <span className="meta">Speed</span>
          <strong>{snapshot.speed} km/h</strong>
        </div>
        <div>
          <span className="meta">S1</span>
          <strong>{snapshot.sector1}s</strong>
        </div>
        <div>
          <span className="meta">S2</span>
          <strong>{snapshot.sector2}s</strong>
        </div>
        <div>
          <span className="meta">S3</span>
          <strong>{snapshot.sector3}s</strong>
        </div>
      </div>
      <p className="muted small">Demo feed updates every 5 seconds.</p>
    </div>
  );
}
