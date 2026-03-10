export type TelemetrySnapshot = {
  timestamp: string;
  leader: string;
  gapToSecond: string;
  tyre: string;
  speed: number;
  sector1: string;
  sector2: string;
  sector3: string;
};

const drivers = [
  "Verstappen",
  "Leclerc",
  "Hamilton",
  "Norris",
  "Piastri",
  "Russell",
  "Sainz",
];

const tyres = ["Soft", "Medium", "Hard"];

export function buildTelemetrySnapshot(): TelemetrySnapshot {
  const leader = drivers[Math.floor(Math.random() * drivers.length)];
  const tyre = tyres[Math.floor(Math.random() * tyres.length)];
  const speed = 295 + Math.round(Math.random() * 40);
  const gap = (Math.random() * 3 + 0.4).toFixed(3);

  return {
    timestamp: new Date().toISOString(),
    leader,
    gapToSecond: `+${gap}s`,
    tyre,
    speed,
    sector1: (Math.random() * 30 + 25).toFixed(3),
    sector2: (Math.random() * 35 + 28).toFixed(3),
    sector3: (Math.random() * 32 + 26).toFixed(3),
  };
}
