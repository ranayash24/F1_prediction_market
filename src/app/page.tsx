import Link from "next/link";
import AuthPanel from "@/components/AuthPanel";
import TelemetryPanel from "@/components/TelemetryPanel";
import NextRaceBanner from "@/components/NextRaceBanner";

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero-v2">
        <div className="hero-v2__bg" aria-hidden>
          <div className="hero-v2__speed-lines" />
          <div className="hero-v2__glow" />
          <div className="hero-v2__checker" />
        </div>
        <div className="container hero-v2__inner">
          <div className="hero-v2__text">
            <p className="hero-v2__eyebrow">
              <span className="hero-live-pill">● LIVE</span>
              F1 PREDICTION MARKET · 2026 SEASON
            </p>
            <h1 className="hero-v2__title">
              TRADE<br />
              <span className="hero-v2__title--accent">THE GRID.</span>
            </h1>
            <p className="hero-v2__desc">
              Redline Markets brings Polymarket energy to Formula 1. Buy YES/NO
              shares on qualifying, race winners, and safety car drama with GP Coins.
            </p>
            <div className="hero-v2__cta">
              <Link href="/markets" className="btn btn--primary btn--xl">
                Start Trading →
              </Link>
              <Link href="/leaderboard" className="btn btn--ghost btn--xl">
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="hero-v2__auth">
            <AuthPanel />
          </div>
        </div>
      </section>

      {/* ── Race ticker ──────────────────────────────── */}
      <NextRaceBanner />

      {/* ── Stats strip ──────────────────────────────── */}
      <section className="stats-strip">
        <div className="container stats-strip__inner">
          {(
            [
              { value: "24", label: "Race Rounds" },
              { value: "1K", label: "Starter Coins" },
              { value: "YES/NO", label: "Share Types" },
              { value: "LIVE", label: "Markets" },
            ] as const
          ).map((stat) => (
            <div key={stat.label} className="stats-strip__item">
              <span className="stats-strip__value">{stat.value}</span>
              <span className="stats-strip__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="container">
        {/* ── Why Redline ───────────────────────────── */}
        <section className="section">
          <div className="section__title">
            <div>
              <p className="section__eyebrow">FEATURES</p>
              <h2>Why Redline?</h2>
            </div>
            <p className="muted">A fast, social market for every race weekend.</p>
          </div>
          <div className="f1-features">
            <div className="f1-feature">
              <span className="f1-feature__num">01</span>
              <h3>GP Coins Economy</h3>
              <p className="muted">
                Every new trader gets 1,000 GP Coins. Top up anytime with real money.
              </p>
            </div>
            <div className="f1-feature">
              <span className="f1-feature__num">02</span>
              <h3>Probability Bars</h3>
              <p className="muted">
                Instantly see how the paddock is leaning with live market splits.
              </p>
            </div>
            <div className="f1-feature">
              <span className="f1-feature__num">03</span>
              <h3>Social Leaderboard</h3>
              <p className="muted">
                Track who is climbing the grid before the lights go out.
              </p>
            </div>
            <div className="f1-feature f1-feature--highlight">
              <span className="f1-feature__num">04</span>
              <h3>Live Telemetry</h3>
              <p className="muted">
                Streaming race data signals powering every market decision.
              </p>
            </div>
          </div>
        </section>

        {/* ── Telemetry ─────────────────────────────── */}
        <section className="section">
          <div className="section__title">
            <div>
              <p className="section__eyebrow">DATA FEED</p>
              <h2>Live Telemetry</h2>
            </div>
            <p className="muted">Streaming signal behind the market.</p>
          </div>
          <TelemetryPanel />
        </section>

        {/* ── How it works ──────────────────────────── */}
        <section className="section">
          <div className="section__title">
            <div>
              <p className="section__eyebrow">GET STARTED</p>
              <h2>How it works</h2>
            </div>
            <p className="muted">Three steps to a podium finish.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-card__stripe step-card__stripe--1" aria-hidden />
              <div className="step-card__content">
                <span className="step-card__num">01</span>
                <h3>Sign in</h3>
                <p className="muted">Use email, Google, Apple, or Facebook to join.</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-card__stripe step-card__stripe--2" aria-hidden />
              <div className="step-card__content">
                <span className="step-card__num">02</span>
                <h3>Buy Shares</h3>
                <p className="muted">Pick YES or NO shares on every race outcome.</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-card__stripe step-card__stripe--3" aria-hidden />
              <div className="step-card__content">
                <span className="step-card__num">03</span>
                <h3>Track Results</h3>
                <p className="muted">Watch your GP Coins grow and climb the leaderboard.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="footer">
        Play money only. Redline Markets is a demo experience.
      </footer>
    </main>
  );
}
