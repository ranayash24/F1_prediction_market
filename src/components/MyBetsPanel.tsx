"use client";

import { useMarket } from "@/lib/market-context";
import { formatCoins } from "@/lib/utils";

export default function MyBetsPanel() {
  const { state, getMarketPrice } = useMarket();
  const user = state.user;

  if (!user) {
    return <p className="muted">Sign in to see your open positions.</p>;
  }

  const entries = Object.entries(user.positions);
  if (entries.length === 0) {
    return <p className="muted">No open positions yet.</p>;
  }

  return (
    <div className="grid">
      {entries.map(([marketId, position]) => {
        const market = state.markets.find((item) => item.id === marketId);
        if (!market) return null;
        const price = getMarketPrice(market);
        const yesValue = Math.round(price.yes * 100) * position.yes;
        const noValue = Math.round(price.no * 100) * position.no;
        const totalValue = yesValue + noValue;

        return (
          <div className="card" key={marketId}>
            <p className="market__round">{market.round}</p>
            <h3>{market.name}</h3>
            <p className="muted small">YES x{position.yes} · NO x{position.no}</p>
            <p className="status">Estimated value {formatCoins(totalValue)}</p>
          </div>
        );
      })}
    </div>
  );
}
