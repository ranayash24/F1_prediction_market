import LeaderboardList from "@/components/LeaderboardList";

export default function LeaderboardPage() {
  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <div>
              <h2>Leaderboard</h2>
              <p className="muted">Top GP Coin traders this season.</p>
            </div>
          </div>
          <LeaderboardList />
        </section>
      </div>
    </main>
  );
}
