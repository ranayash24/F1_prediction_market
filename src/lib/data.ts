import type { Market } from "@/lib/types";
import { calendar2026 } from "@/lib/calendar-2026";

export const INITIAL_COINS = 1000;

export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "yashrana240203@gmail.com";

export const MARKET_CATEGORIES = [
  "Quali Winner",
  "Race Winner",
  "Safety Car",
  "Fastest Lap",
  "Driver of the Day",
  "DNF / Retirement",
  "Pit Stop Strategy",
  "Other",
] as const;

export const leaderboardBots = [
  { name: "MonacoJet", balance: 16420 },
  { name: "PitWallPro", balance: 14980 },
  { name: "ApexHunter", balance: 13210 },
  { name: "TelemetryTony", balance: 12190 },
  { name: "SlipstreamLena", balance: 11020 },
];

export function buildMarketsFromCalendar(): Market[] {
  return calendar2026.flatMap((round) => {
    const roundLabel = `Round ${round.round} · ${round.name}`;
    return [
      {
        id: `r${round.round}-quali`,
        round: roundLabel,
        name: "Pole sitter from Red Bull",
        description: "Will a Red Bull lock out P1 in qualifying?",
        category: "Quali Winner",
        yesShares: 60,
        noShares: 60,
        volume: 0,
      },
      {
        id: `r${round.round}-race`,
        round: roundLabel,
        name: "Ferrari wins the race",
        description: "Can the Scuderia take the checkered flag?",
        category: "Race Winner",
        yesShares: 60,
        noShares: 60,
        volume: 0,
      },
      {
        id: `r${round.round}-safety`,
        round: roundLabel,
        name: "Safety car deployed",
        description: "Will race control deploy a safety car?",
        category: "Safety Car",
        yesShares: 60,
        noShares: 60,
        volume: 0,
      },
    ];
  });
}
