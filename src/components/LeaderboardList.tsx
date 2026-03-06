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

export default function LeaderboardList() {
  const { state } = useMarket();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    const leaderboardQuery = query(collection(db, "leaderboard"), orderBy("balance", "desc"));
    const unsubscribe = onSnapshot(
      leaderboardQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => docSnap.data() as LeaderboardEntry)
          .filter((entry) => entry?.name && Number.isFinite(entry.balance));
        setRemoteEntries(next);
      },
      () => {
        setRemoteEntries([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const entries = useMemo(() => {
    if (isFirebaseConfigured() && remoteEntries.length > 0) return remoteEntries;
    return Object.values(state.users).sort((a, b) => b.balance - a.balance);
  }, [state.users, remoteEntries]);

  return (
    <div className="leaderboard">
      {entries.length === 0 && <p className="muted">No leaderboard entries yet.</p>}
      {entries.map((entry, index) => (
        <div className="leaderboard__row" key={`${entry.name}-${index}`}>
          <span>
            {index + 1}. {entry.name}
          </span>
          <strong>{formatCoins(entry.balance)}</strong>
        </div>
      ))}
    </div>
  );
}
