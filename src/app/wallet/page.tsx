import WalletPanel from "@/components/WalletPanel";

export default function WalletPage() {
  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <h2>Wallet</h2>
            <p className="muted">Manage GP Coins and top up anytime.</p>
          </div>
          <WalletPanel />
        </section>
      </div>
    </main>
  );
}
