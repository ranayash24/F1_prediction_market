import { calendar2026 } from "@/lib/calendar-2026";

export default function NextRaceBanner() {
  const today = new Date().toISOString().slice(0, 10);
  const nextRace =
    calendar2026.find((race) => race.date >= today) ??
    calendar2026[calendar2026.length - 1];

  const msUntil = new Date(nextRace.date).getTime() - Date.now();
  const daysUntil = Math.max(0, Math.ceil(msUntil / (1000 * 60 * 60 * 24)));
  const countdownLabel =
    daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "1 DAY" : `${daysUntil} DAYS`;

  return (
    <div className="race-ticker">
      <div className="race-ticker__scanline" aria-hidden />
      <div className="container race-ticker__inner">
        <div className="race-ticker__left">
          <span className="race-ticker__badge">NEXT RACE</span>
          <span className="race-ticker__name">{nextRace.name}</span>
        </div>
        <div className="race-ticker__right">
          <span className="race-ticker__loc">{nextRace.location}</span>
          <span className="race-ticker__sep">·</span>
          <span className="race-ticker__date">{nextRace.date}</span>
          <span className="race-ticker__sep">·</span>
          <span className="race-ticker__countdown">{countdownLabel}</span>
        </div>
      </div>
    </div>
  );
}
