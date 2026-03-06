import { calendar2026 } from "@/lib/calendar-2026";

export default function NextRaceBanner() {
  const nextRace = calendar2026[0];

  return (
    <div className="card">
      <p className="market__round">Next race week</p>
      <h3>{nextRace.name}</h3>
      <p className="muted small">
        {nextRace.location} · {nextRace.date}
      </p>
    </div>
  );
}
