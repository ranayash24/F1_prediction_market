"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMarket } from "@/lib/market-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/my-bets", label: "My Bets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/wallet", label: "Wallet" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { state, signOut } = useMarket();
  const balance = state.user
    ? state.user.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : "0";

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
            <button className="btn btn--ghost" type="button" onClick={signOut}>
              Sign out
            </button>
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
