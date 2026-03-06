import MyBetsPanel from "@/components/MyBetsPanel";

export default function MyBetsPage() {
  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <h2>My bets</h2>
            <p className="muted">All your open YES/NO positions in one garage.</p>
          </div>
          <MyBetsPanel />
        </section>
      </div>
    </main>
  );
}
