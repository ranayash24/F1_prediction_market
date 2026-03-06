import LeaderboardList from "@/components/LeaderboardList";

export default function LeaderboardPage() {
  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <h2>Leaderboard</h2>
            <p className="muted">Top traders sorted by GP Coin balance.</p>
          </div>
          <div className="card">
            <LeaderboardList />
          </div>
        </section>
      </div>
    </main>
  );
}
