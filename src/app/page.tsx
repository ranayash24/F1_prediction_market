import Link from "next/link";
import AuthPanel from "@/components/AuthPanel";
import TelemetryPanel from "@/components/TelemetryPanel";
import NextRaceBanner from "@/components/NextRaceBanner";

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <section className="hero">
          <div>
            <p className="muted small">F1 PLAY-MONEY PREDICTION MARKET</p>
            <h1>Trade the grid. Own the narrative.</h1>
            <p>
              Redline Markets brings Polymarket energy to Formula 1. Buy YES/NO
              shares on qualifying, race winners, and safety car drama with GP Coins.
            </p>
            <div className="hero__cta">
              <Link href="/markets" className="btn btn--primary">
                Start trading now
              </Link>
              <Link href="/leaderboard" className="btn btn--ghost">
                View leaderboard
              </Link>
            </div>
          </div>
          <AuthPanel />
        </section>

        <section className="section">
          <div className="section__title">
            <h2>Why Redline?</h2>
            <p className="muted">A fast, social market for every race weekend.</p>
          </div>
          <div className="grid">
            <NextRaceBanner />
            <div className="card feature">
              <h3>GP Coins economy</h3>
              <p className="muted">
                Every new trader gets 1,000 GP Coins. Top up anytime with real money.
              </p>
            </div>
            <div className="card feature">
              <h3>Yes/No probability bars</h3>
              <p className="muted">
                Instantly see how the paddock is leaning with live market splits.
              </p>
            </div>
            <div className="card feature">
              <h3>Social leaderboard</h3>
              <p className="muted">
                Track who is climbing the grid before the lights go out.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__title">
            <h2>Live telemetry</h2>
            <p className="muted">Streaming signal behind the market.</p>
          </div>
          <TelemetryPanel />
        </section>

        <section className="section">
          <div className="section__title">
            <h2>How it works</h2>
            <p className="muted">Three steps to a podium finish.</p>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>1. Sign in</h3>
              <p className="muted">Use email, Google, Apple, or Facebook to join.</p>
            </div>
            <div className="card feature">
              <h3>2. Buy shares</h3>
              <p className="muted">Pick YES or NO shares on every race outcome.</p>
            </div>
            <div className="card feature">
              <h3>3. Track results</h3>
              <p className="muted">Watch your GP Coins and climb the leaderboard.</p>
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
