"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMarket } from "@/lib/market-context";
import { ADMIN_EMAIL } from "@/lib/data";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

const links = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/my-bets", label: "My Bets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/docs", label: "Docs" },
];

type LeaderboardEntry = {
  name: string;
  balance: number;
  email?: string;
};

export default function TopNav() {
  const pathname = usePathname();
  const { state, signOut } = useMarket();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const balance = state.user
    ? state.user.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : "0";

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

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const leaderboardEntries = useMemo<LeaderboardEntry[]>(() => {
    if (isFirebaseConfigured()) {
      return [...remoteEntries].sort((a, b) => b.balance - a.balance);
    }
    return Object.values(state.users)
      .map((user) => ({ name: user.name, balance: user.balance, email: user.email }))
      .sort((a, b) => b.balance - a.balance);
  }, [state.users, remoteEntries]);

  const rank = useMemo(() => {
    if (!state.user || leaderboardEntries.length === 0) return null;
    const sorted = [...leaderboardEntries].sort((a, b) => b.balance - a.balance);
    const index = sorted.findIndex((entry) =>
      entry.email ? entry.email === state.user?.email : entry.name === state.user?.name
    );
    return index === -1 ? null : index + 1;
  }, [leaderboardEntries, state.user]);

  const initials = useMemo(() => {
    if (!state.user) return "GP";
    const name = state.user.name?.trim();
    if (name) {
      return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase())
        .join("");
    }
    return state.user.email?.[0]?.toUpperCase() ?? "GP";
  }, [state.user]);

  return (
    <header className="top-nav">
      <div className="container nav__inner">
        <Link href="/" className="logo">
          <span>Redline</span> Markets
        </Link>
        <nav className="nav__links">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "nav__link nav__link--active" : "nav__link"}
              >
                {link.label}
              </Link>
            );
          })}
          {state.user?.email === ADMIN_EMAIL && (
            <Link
              href="/admin"
              className={pathname === "/admin" ? "nav__link nav__link--active nav__link--admin" : "nav__link nav__link--admin"}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="nav__actions">
          <div className="wallet-pill">
            <div className="wallet-pill__label">
              <span>GP Coins</span>
            </div>
            <strong>
              {balance}
              <span className="coin-logo coin-logo--mini" aria-hidden>
                GP
              </span>
            </strong>
          </div>
          {state.user ? (
            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-button"
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar" aria-hidden>
                  {initials}
                </span>
              </button>
              {profileOpen && (
                <div className="profile-panel" role="menu">
                  <div className="profile-panel__name">{state.user.name}</div>
                  <div className="profile-panel__email">{state.user.email}</div>
                  <div className="profile-panel__row">
                    <span className="muted small">Leaderboard</span>
                    <strong>{rank ? `#${rank}` : "Unranked"}</strong>
                  </div>
                  <button
                    className="btn btn--ghost profile-panel__signout"
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/#auth" className="btn btn--ghost">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
