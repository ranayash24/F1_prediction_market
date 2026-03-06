"use client";

import { useMarket } from "@/lib/market-context";
import MarketCard from "@/components/MarketCard";

export default function MarketsGrid() {
  const { state } = useMarket();

  return (
    <div className="grid market-grid">
      {state.markets.map((market, index) => (
        <MarketCard key={market.id} market={market} index={index} />
      ))}
    </div>
  );
}
