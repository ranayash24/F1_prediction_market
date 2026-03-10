import MarketsGrid from "@/components/MarketsGrid";

export default function MarketsPage() {
  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <h2>Markets</h2>
            <p className="muted">Select a round, then trade YES or NO on each outcome.</p>
          </div>
          <MarketsGrid />
        </section>
      </div>
    </main>
  );
}
