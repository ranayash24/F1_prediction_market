"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useMarket } from "@/lib/market-context";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import { formatCoins } from "@/lib/utils";

type LeaderboardEntry = {
  name: string;
  balance: number;
  email?: string;
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_COLORS = [
  { border: "rgba(255,186,8,0.5)", glow: "rgba(255,186,8,0.15)", label: "#ffba08" },
  { border: "rgba(192,192,192,0.4)", glow: "rgba(192,192,192,0.1)", label: "#c0c0c0" },
  { border: "rgba(205,127,50,0.4)", glow: "rgba(205,127,50,0.1)", label: "#cd7f32" },
];

export default function LeaderboardList() {
  const { state } = useMarket();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    const q = query(collection(db, "leaderboard"), orderBy("balance", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => docSnap.data() as LeaderboardEntry)
          .filter((entry) => entry?.name && Number.isFinite(entry.balance));
        setRemoteEntries(next);
        setLoading(false);
      },
      (err) => {
        console.error("Leaderboard snapshot error:", err);
        setError("Could not load leaderboard. Check Firestore rules.");
        setRemoteEntries([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const entries = useMemo<LeaderboardEntry[]>(() => {
    if (isFirebaseConfigured()) {
      return [...remoteEntries].sort((a, b) => b.balance - a.balance);
    }
    return Object.values(state.users)
      .map((u) => ({ name: u.name, balance: u.balance, email: u.email }))
      .sort((a, b) => b.balance - a.balance);
  }, [state.users, remoteEntries]);

  const currentEmail = state.user?.email ?? null;

  if (loading) {
    return (
      <div className="lb-loading">
        <div className="lb-loading__bar" />
        <div className="lb-loading__bar" style={{ width: "70%" }} />
        <div className="lb-loading__bar" style={{ width: "55%" }} />
      </div>
    );
  }

  if (error) {
    return <p className="muted small" style={{ color: "var(--danger)" }}>{error}</p>;
  }

  if (entries.length === 0) {
    return <p className="muted">No entries yet. Sign in and start trading to appear here.</p>;
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Podium order: 2nd · 1st · 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumRanks = [1, 0, 2]; // index into top3 for display order

  return (
    <div className="lb">
      {/* Podium */}
      {top3.length >= 1 && (
        <div className="lb-podium">
          {podiumOrder.map((entry, displayIdx) => {
            const rank = podiumRanks[displayIdx];
            const colors = PODIUM_COLORS[rank];
            const isCenter = rank === 0;
            const isCurrentUser = !!currentEmail && entry.email === currentEmail;
            return (
              <div
                key={entry.name}
                className={`lb-podium__slot ${isCenter ? "lb-podium__slot--first" : ""} ${isCurrentUser ? "lb-podium__slot--you" : ""}`}
                style={{
                  borderColor: colors.border,
                  background: `radial-gradient(ellipse at top, ${colors.glow}, transparent 70%), var(--charcoal)`,
                }}
              >
                <div className="lb-podium__medal">{MEDALS[rank]}</div>
                <div
                  className="lb-podium__avatar"
                  style={{ borderColor: colors.label, color: colors.label }}
                >
                  {getInitials(entry.name) || "?"}
                </div>
                <div className="lb-podium__name">
                  {entry.name}
                  {isCurrentUser && <span className="lb-you-badge">You</span>}
                </div>
                <div className="lb-podium__balance" style={{ color: colors.label }}>
                  {formatCoins(entry.balance)}
                </div>
                <div
                  className="lb-podium__plinth"
                  style={{ background: colors.border, height: isCenter ? "2.8rem" : rank === 1 ? "2rem" : "1.4rem" }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="lb-list">
          {rest.map((entry, idx) => {
            const rank = idx + 4;
            const isCurrentUser = !!currentEmail && entry.email === currentEmail;
            return (
              <div
                key={`${entry.name}-${rank}`}
                className={`lb-row ${isCurrentUser ? "lb-row--you" : ""}`}
              >
                <span className="lb-row__rank">#{rank}</span>
                <div className="lb-row__avatar">{getInitials(entry.name) || "?"}</div>
                <span className="lb-row__name">
                  {entry.name}
                  {isCurrentUser && <span className="lb-you-badge">You</span>}
                </span>
                <span className="lb-row__balance">{formatCoins(entry.balance)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
