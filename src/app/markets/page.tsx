import MarketsGrid from "@/components/MarketsGrid";
import TelemetryPanel from "@/components/TelemetryPanel";

export default function MarketsPage() {
  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <h2>Upcoming markets</h2>
            <p className="muted">Quali winners, race winners, and safety car calls.</p>
          </div>
          <MarketsGrid />
        </section>
        <section className="section">
          <div className="section__title">
            <h2>Race control</h2>
            <p className="muted">Live telemetry stream powering market sentiment.</p>
          </div>
          <TelemetryPanel />
        </section>
      </div>
    </main>
  );
}
