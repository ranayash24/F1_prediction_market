export type TelemetryDriver = {
  position: number;
  name: string;
  acronym: string;
  team: string;
  teamColour: string;
  gapToLeader: string;
  interval: string;
};

export type TelemetrySnapshot = {
  timestamp: string;
  isLive: boolean;
  sessionName: string;
  circuit: string;
  flag: string;
  leader: string;
  gapToSecond: string;
  top5: TelemetryDriver[];
  raceControlMessages: string[];
  // legacy fields kept for fallback
  tyre: string;
  speed: number;
  sector1: string;
  sector2: string;
  sector3: string;
};

const DRIVERS = ["Verstappen", "Leclerc", "Hamilton", "Norris", "Piastri", "Russell", "Sainz"];
const TYRES = ["Soft", "Medium", "Hard"];
const TEAMS = ["Red Bull Racing", "Ferrari", "Mercedes", "McLaren", "McLaren", "Mercedes", "Ferrari"];
const COLOURS = ["#3671C6", "#E8002D", "#27F4D2", "#FF8000", "#FF8000", "#27F4D2", "#E8002D"];
const ACRONYMS = ["VER", "LEC", "HAM", "NOR", "PIA", "RUS", "SAI"];

export function buildTelemetrySnapshot(): TelemetrySnapshot {
  const leaderIdx = 0;
  const top5: TelemetryDriver[] = DRIVERS.slice(0, 5).map((name, i) => ({
    position: i + 1,
    name,
    acronym: ACRONYMS[i],
    team: TEAMS[i],
    teamColour: COLOURS[i],
    gapToLeader: i === 0 ? "LEADER" : `+${(Math.random() * 15 + i * 3).toFixed(3)}s`,
    interval: i === 0 ? "" : `+${(Math.random() * 2 + 0.4).toFixed(3)}s`,
  }));

  return {
    timestamp: new Date().toISOString(),
    isLive: false,
    sessionName: "Simulated",
    circuit: "Demo Circuit",
    flag: "GREEN",
    leader: DRIVERS[leaderIdx],
    gapToSecond: `+${(Math.random() * 3 + 0.4).toFixed(3)}s`,
    top5,
    raceControlMessages: ["Track is clear", "DRS enabled"],
    tyre: TYRES[Math.floor(Math.random() * TYRES.length)],
    speed: 295 + Math.round(Math.random() * 40),
    sector1: (Math.random() * 30 + 25).toFixed(3),
    sector2: (Math.random() * 35 + 28).toFixed(3),
    sector3: (Math.random() * 32 + 26).toFixed(3),
  };
}
