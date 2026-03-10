import Link from "next/link";

type Section = {
  id: string;
  title: string;
  eyebrow: string;
};

const SECTIONS: Section[] = [
  { id: "overview",     eyebrow: "01", title: "Overview" },
  { id: "getting-started", eyebrow: "02", title: "Getting Started" },
  { id: "markets",     eyebrow: "03", title: "How Markets Work" },
  { id: "gp-coins",    eyebrow: "04", title: "GP Coins Economy" },
  { id: "trading",     eyebrow: "05", title: "Buying & Selling Shares" },
  { id: "create",      eyebrow: "06", title: "Creating Your Own Market" },
  { id: "leaderboard", eyebrow: "07", title: "Leaderboard" },
  { id: "telemetry",   eyebrow: "08", title: "Live Telemetry" },
  { id: "ai",          eyebrow: "09", title: "Redline AI Assistant" },
  { id: "admin",       eyebrow: "10", title: "Admin Panel" },
  { id: "tech",        eyebrow: "11", title: "Tech Stack" },
];

export default function DocsPage() {
  return (
    <main>
      <div className="docs-layout">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          <p className="docs-sidebar__title">Documentation</p>
          <nav className="docs-nav">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="docs-nav__link">
                <span className="docs-nav__num">{s.eyebrow}</span>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="docs-content">
          {/* Hero */}
          <div className="docs-hero">
            <p className="section__eyebrow">REDLINE MARKETS</p>
            <h1 className="docs-hero__title">Documentation</h1>
            <p className="muted">
              Everything you need to trade, build, and understand the Redline
              Markets F1 prediction platform.
            </p>
          </div>

          {/* ── 01 Overview ───────────────────────────── */}
          <section className="docs-section" id="overview">
            <div className="docs-section__head">
              <span className="docs-section__num">01</span>
              <h2>Overview</h2>
            </div>
            <p>
              <strong>Redline Markets</strong> is a play-money prediction market
              built around the 2026 Formula 1 season. Inspired by platforms like
              Polymarket, it lets users trade YES/NO shares on race outcomes using
              virtual <strong>GP Coins</strong> — no real money, pure F1 strategy.
            </p>
            <div className="docs-grid">
              <div className="docs-card">
                <h4>Play-money only</h4>
                <p className="muted small">
                  GP Coins are virtual currency. No real money is involved at any
                  point. This is a skill and fun platform.
                </p>
              </div>
              <div className="docs-card">
                <h4>F1 2026 season</h4>
                <p className="muted small">
                  24 rounds from Australia to Abu Dhabi. Markets open for every
                  race weekend — qualifying, race, safety car, and more.
                </p>
              </div>
              <div className="docs-card">
                <h4>Community driven</h4>
                <p className="muted small">
                  Users can propose their own markets. Approved markets go live
                  for everyone to trade.
                </p>
              </div>
            </div>
          </section>

          {/* ── 02 Getting Started ────────────────────── */}
          <section className="docs-section" id="getting-started">
            <div className="docs-section__head">
              <span className="docs-section__num">02</span>
              <h2>Getting Started</h2>
            </div>
            <ol className="docs-steps">
              <li>
                <strong>Sign in</strong> — use your Google account, email/password,
                Apple, or Facebook via Firebase Authentication.
              </li>
              <li>
                <strong>Receive GP Coins</strong> — every new account gets{" "}
                <span className="docs-badge">1,000 GP Coins</span> automatically.
              </li>
              <li>
                <strong>Browse markets</strong> — go to{" "}
                <Link href="/markets" className="docs-link">Markets</Link> and
                select a race round using the round tabs (R01 – R24).
              </li>
              <li>
                <strong>Place a trade</strong> — pick YES or NO, enter the number
                of shares, and confirm your trade.
              </li>
              <li>
                <strong>Watch the leaderboard</strong> — your rank updates in
                real time as your balance grows.
              </li>
            </ol>

            <div className="docs-callout docs-callout--info">
              <strong>Session isolation:</strong> Each browser tab maintains its own
              login session. You can be signed into different accounts in
              different tabs simultaneously.
            </div>
          </section>

          {/* ── 03 How Markets Work ───────────────────── */}
          <section className="docs-section" id="markets">
            <div className="docs-section__head">
              <span className="docs-section__num">03</span>
              <h2>How Markets Work</h2>
            </div>
            <p>
              Each market is a binary YES/NO question tied to a specific race
              weekend and outcome category. The market price represents the
              probability the crowd assigns to each outcome.
            </p>

            <h3>Price formula</h3>
            <div className="docs-formula">
              <code>YES price = yesShares ÷ (yesShares + noShares)</code>
              <code>NO price  = noShares  ÷ (yesShares + noShares)</code>
            </div>
            <p className="muted small">
              Example: 60 YES shares and 40 NO shares → YES price = 0.60 (60%),
              NO price = 0.40 (40%).
            </p>

            <h3>Market categories</h3>
            <div className="docs-grid docs-grid--4">
              {[
                { label: "Quali Winner",     desc: "Who takes pole position?" },
                { label: "Race Winner",      desc: "Who takes the chequered flag?" },
                { label: "Safety Car",       desc: "Will a safety car be deployed?" },
                { label: "Fastest Lap",      desc: "Which driver sets the fastest lap?" },
                { label: "Driver of the Day", desc: "Fan-voted DOTD." },
                { label: "DNF / Retirement", desc: "Will a specific driver retire?" },
                { label: "Pit Stop Strategy", desc: "One-stop vs two-stop strategies." },
                { label: "Other",            desc: "User-created custom markets." },
              ].map((c) => (
                <div key={c.label} className="docs-cat">
                  <span className="docs-cat__label">{c.label}</span>
                  <p className="muted small">{c.desc}</p>
                </div>
              ))}
            </div>

            <h3>Seed shares</h3>
            <p>
              Every new market starts with 60 YES shares and 60 NO shares, giving
              an equal 50/50 probability at launch. As users trade, the price
              shifts to reflect crowd sentiment.
            </p>
          </section>

          {/* ── 04 GP Coins ───────────────────────────── */}
          <section className="docs-section" id="gp-coins">
            <div className="docs-section__head">
              <span className="docs-section__num">04</span>
              <h2>GP Coins Economy</h2>
            </div>
            <p>
              GP Coins (GPC) are the platform's play-money currency. They are
              purely virtual and have no monetary value.
            </p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>GP Coins effect</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Sign up</td><td>+1,000 GPC (one-time bonus)</td></tr>
                <tr><td>Buy YES/NO shares</td><td>−(price × 100 × shares)</td></tr>
                <tr><td>Sell shares back</td><td>+(current price × 100 × shares)</td></tr>
                <tr><td>Top up via Wallet page</td><td>+amount purchased</td></tr>
              </tbody>
            </table>
            <div className="docs-callout docs-callout--warning">
              GP Coins cannot be converted to real money. Top-ups via the Wallet
              page are for demonstration purposes in the demo environment.
            </div>
          </section>

          {/* ── 05 Buying & Selling ───────────────────── */}
          <section className="docs-section" id="trading">
            <div className="docs-section__head">
              <span className="docs-section__num">05</span>
              <h2>Buying & Selling Shares</h2>
            </div>

            <h3>Buying</h3>
            <ol className="docs-steps">
              <li>Navigate to <Link href="/markets" className="docs-link">Markets</Link> and select a round.</li>
              <li>Find a market card and choose the <strong>Buy</strong> tab.</li>
              <li>Enter the number of shares you want.</li>
              <li>Click <strong>Buy YES</strong> or <strong>Buy NO</strong>.</li>
              <li>The cost (shown in GPC) is deducted from your balance instantly.</li>
            </ol>

            <h3>Selling</h3>
            <ol className="docs-steps">
              <li>Switch to the <strong>Sell</strong> tab on any market card.</li>
              <li>Choose which side (YES or NO) to sell from your holdings.</li>
              <li>Enter how many shares to sell.</li>
              <li>The proceeds are credited to your balance at the current market price.</li>
            </ol>

            <div className="docs-callout docs-callout--info">
              <strong>Price impact:</strong> Every buy/sell moves the price slightly.
              Buying YES increases the YES price; selling YES decreases it. Large
              trades have more impact on price than small ones.
            </div>

            <h3>Cost calculation</h3>
            <div className="docs-formula">
              <code>Cost = price × 100 × shares</code>
              <code>{"Example: 0.65 × 100 × 10 shares = 650 GPC"}</code>
            </div>

            <h3>Viewing your positions</h3>
            <p>
              Go to <Link href="/my-bets" className="docs-link">My Bets</Link> to see
              all your open positions, their current value, your total spent, and
              unrealised P&L across all markets.
            </p>
          </section>

          {/* ── 06 Creating Markets ───────────────────── */}
          <section className="docs-section" id="create">
            <div className="docs-section__head">
              <span className="docs-section__num">06</span>
              <h2>Creating Your Own Market</h2>
            </div>
            <p>
              Any signed-in user can propose a new market. Submissions are reviewed
              by the admin before going live.
            </p>

            <h3>How to submit</h3>
            <ol className="docs-steps">
              <li>Go to <Link href="/markets" className="docs-link">Markets</Link> and sign in.</li>
              <li>Click the red <strong>+ Create Market</strong> button (top-right of round tabs).</li>
              <li>
                Fill in the form:
                <ul className="docs-list">
                  <li><strong>Race Round</strong> — which of the 24 rounds it applies to.</li>
                  <li><strong>Category</strong> — choose from the preset list.</li>
                  <li><strong>Market Question</strong> — your YES/NO question (max 120 chars).</li>
                  <li><strong>Description</strong> — optional extra context for traders.</li>
                </ul>
              </li>
              <li>Click <strong>Submit for Review</strong>.</li>
            </ol>

            <div className="docs-callout docs-callout--warning">
              <strong>Duplicate check:</strong> You cannot submit a market with the
              same round and question as one that already exists (live or pending).
              The check is case-insensitive.
            </div>

            <h3>After submission</h3>
            <p>
              Your market enters a <span className="docs-badge docs-badge--pending">PENDING</span> state.
              Once the admin approves it, it appears in the markets grid with
              60 YES / 60 NO seed shares and is immediately tradeable.
              If rejected, the submission is archived with a{" "}
              <span className="docs-badge docs-badge--rejected">REJECTED</span> status.
            </p>
          </section>

          {/* ── 07 Leaderboard ────────────────────────── */}
          <section className="docs-section" id="leaderboard">
            <div className="docs-section__head">
              <span className="docs-section__num">07</span>
              <h2>Leaderboard</h2>
            </div>
            <p>
              The <Link href="/leaderboard" className="docs-link">Leaderboard</Link>{" "}
              ranks all users by their current GP Coin balance in real time.
            </p>
            <ul className="docs-list">
              <li>Top 3 users are displayed on a podium (gold / silver / bronze).</li>
              <li>Positions 4 and below appear in a ranked list below the podium.</li>
              <li>Your own entry is highlighted in red so you can find your rank instantly.</li>
              <li>Leaderboard data is synced live via Firestore — no refresh needed.</li>
              <li>Your rank is also shown in the profile dropdown in the top navigation.</li>
            </ul>
          </section>

          {/* ── 08 Telemetry ──────────────────────────── */}
          <section className="docs-section" id="telemetry">
            <div className="docs-section__head">
              <span className="docs-section__num">08</span>
              <h2>Live Telemetry</h2>
            </div>
            <p>
              The telemetry panel fetches real Formula 1 session data from the{" "}
              <strong>OpenF1 API</strong> — a free, open-source F1 data feed.
            </p>

            <div className="docs-grid">
              <div className="docs-card">
                <h4>During a race weekend</h4>
                <p className="muted small">
                  Fetches live driver positions, gaps to leader, interval times,
                  race control messages, and current flag status. Updates every
                  10 seconds. Shows a green <strong>● LIVE</strong> badge.
                </p>
              </div>
              <div className="docs-card">
                <h4>Between race weekends</h4>
                <p className="muted small">
                  Shows data from the most recently completed session with a
                  grey <strong>● RECENT</strong> badge. Falls back to simulated
                  data if OpenF1 is unreachable.
                </p>
              </div>
            </div>

            <h3>Data fields</h3>
            <table className="docs-table">
              <thead>
                <tr><th>Field</th><th>Source</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td>Session name</td><td>OpenF1 /sessions</td><td>FP1, FP2, FP3, Q, Race, Sprint</td></tr>
                <tr><td>Circuit</td><td>OpenF1 /sessions</td><td>Short circuit name</td></tr>
                <tr><td>Top 5 drivers</td><td>OpenF1 /position</td><td>Latest position per driver</td></tr>
                <tr><td>Gaps</td><td>OpenF1 /intervals</td><td>Gap to leader &amp; interval</td></tr>
                <tr><td>Team colour</td><td>OpenF1 /drivers</td><td>Official team hex colour</td></tr>
                <tr><td>Race control</td><td>OpenF1 /race_control</td><td>Last 3 messages + flag status</td></tr>
              </tbody>
            </table>

            <div className="docs-callout docs-callout--info">
              <strong>API:</strong> <code>https://api.openf1.org/v1</code> — completely
              free, no API key required, maintained by the open-source community.
            </div>
          </section>

          {/* ── 09 AI Assistant ───────────────────────── */}
          <section className="docs-section" id="ai">
            <div className="docs-section__head">
              <span className="docs-section__num">09</span>
              <h2>Redline AI Assistant</h2>
            </div>
            <p>
              The floating <strong>Redline AI</strong> button (bottom-right corner)
              opens an AI chatbot that can answer questions about F1 and the platform.
            </p>

            <h3>Powered by</h3>
            <p>
              The chatbot uses <strong>Google Gemini 2.0 Flash</strong> via the
              Gemini REST API — completely free for up to 1,500 requests per day.
            </p>

            <h3>What it knows</h3>
            <ul className="docs-list">
              <li>Full Redline Markets platform rules and mechanics</li>
              <li>GP Coins economy, share pricing, buying/selling</li>
              <li>F1 rules: tyre compounds, DRS, safety car, qualifying format, fastest lap point</li>
              <li>2026 F1 calendar (24 rounds)</li>
              <li>Market strategy — reading probability bars, when to buy/sell</li>
              <li>General F1 trivia and history</li>
            </ul>

            <h3>Setup (self-hosted)</h3>
            <ol className="docs-steps">
              <li>
                Get a free API key at{" "}
                <code>aistudio.google.com/app/apikey</code>
              </li>
              <li>
                Add it to <code>.env.local</code>:
                <div className="docs-code-block">
                  <code>GEMINI_API_KEY=your_key_here</code>
                </div>
              </li>
              <li>Restart the dev server — the chatbot will activate automatically.</li>
            </ol>

            <h3>Rate limiting</h3>
            <p>
              The API route enforces 20 requests per minute per IP address server-side.
              Gemini free tier allows 15 requests/minute and 1,500 requests/day.
            </p>
          </section>

          {/* ── 10 Admin Panel ────────────────────────── */}
          <section className="docs-section" id="admin">
            <div className="docs-section__head">
              <span className="docs-section__num">10</span>
              <h2>Admin Panel</h2>
            </div>
            <p>
              The <Link href="/admin" className="docs-link">/admin</Link> page is
              accessible only to the configured admin account.
            </p>

            <h3>Admin account</h3>
            <p>
              The admin email is set in <code>src/lib/data.ts</code> via the{" "}
              <code>ADMIN_EMAIL</code> constant (or overridden with the{" "}
              <code>NEXT_PUBLIC_ADMIN_EMAIL</code> environment variable).
              When signed in as the admin, an <strong className="docs-red">Admin</strong>{" "}
              link appears in the top navigation.
            </p>

            <h3>Approving markets</h3>
            <ol className="docs-steps">
              <li>Sign in as the admin account.</li>
              <li>Click <strong>Admin</strong> in the nav bar.</li>
              <li>Review pending market submissions — each shows the round, category, question, description, and submitter details.</li>
              <li>
                Click <strong>✓ Approve</strong> to make the market live — it
                immediately appears in the markets grid with seed shares.
              </li>
              <li>
                Click <strong>✕ Reject</strong> to decline — the submission moves
                to the Reviewed section with a rejected status.
              </li>
            </ol>

            <h3>Firestore rules</h3>
            <p>
              The <code>pending_markets</code> Firestore collection enforces:
            </p>
            <ul className="docs-list">
              <li>Any authenticated user can <strong>create</strong> a pending market (their email must match <code>submittedBy</code>).</li>
              <li>Only the admin email can <strong>update</strong> a pending market (approve/reject).</li>
              <li>All authenticated users can <strong>read</strong> pending markets.</li>
            </ul>
          </section>

          {/* ── 11 Tech Stack ─────────────────────────── */}
          <section className="docs-section" id="tech">
            <div className="docs-section__head">
              <span className="docs-section__num">11</span>
              <h2>Tech Stack</h2>
            </div>
            <div className="docs-grid docs-grid--3">
              {[
                { name: "Next.js 15",         role: "Framework (App Router, API routes)" },
                { name: "TypeScript",         role: "Type safety throughout" },
                { name: "Firebase Auth",      role: "Authentication (Google, email, Apple, Facebook)" },
                { name: "Firestore",          role: "Real-time database for markets, users, leaderboard, chats, pending markets" },
                { name: "OpenF1 API",         role: "Live F1 telemetry data (free, no key)" },
                { name: "Google Gemini 2.0",  role: "AI chatbot — free tier (1,500 req/day)" },
                { name: "CSS (custom)",       role: "No UI framework — hand-crafted F1 theme" },
                { name: "Vercel (optional)",  role: "Recommended deployment platform" },
                { name: "Firebase Hosting",   role: "Alternative deployment via firebase.json" },
              ].map((t) => (
                <div key={t.name} className="docs-card">
                  <h4>{t.name}</h4>
                  <p className="muted small">{t.role}</p>
                </div>
              ))}
            </div>

            <h3>Key environment variables</h3>
            <table className="docs-table">
              <thead>
                <tr><th>Variable</th><th>Required</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>NEXT_PUBLIC_FIREBASE_API_KEY</code></td><td>Yes</td><td>Firebase project API key</td></tr>
                <tr><td><code>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code></td><td>Yes</td><td>Firebase auth domain</td></tr>
                <tr><td><code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code></td><td>Yes</td><td>Firebase project ID</td></tr>
                <tr><td><code>NEXT_PUBLIC_FIREBASE_APP_ID</code></td><td>Yes</td><td>Firebase app ID</td></tr>
                <tr><td><code>GEMINI_API_KEY</code></td><td>For AI chat</td><td>Google Gemini free API key</td></tr>
                <tr><td><code>NEXT_PUBLIC_ADMIN_EMAIL</code></td><td>Optional</td><td>Override admin account email</td></tr>
              </tbody>
            </table>

            <h3>Running locally</h3>
            <div className="docs-code-block">
              <code>npm install</code>
              <code>npm run dev</code>
            </div>

            <h3>Deploying Firestore rules</h3>
            <div className="docs-code-block">
              <code>npx firebase deploy --only firestore:rules</code>
            </div>
          </section>

          <div className="docs-footer">
            <p className="muted small">
              Redline Markets — Play money only. Built for F1 fans.
            </p>
            <Link href="/" className="btn btn--ghost" style={{ marginTop: "1rem", display: "inline-block" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
