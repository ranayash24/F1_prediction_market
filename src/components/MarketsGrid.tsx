"use client";

import { useMemo, useState } from "react";
import { useMarket } from "@/lib/market-context";
import MarketCard from "@/components/MarketCard";
import CreateMarketForm from "@/components/CreateMarketForm";
import { calendar2026 } from "@/lib/calendar-2026";

export default function MarketsGrid() {
  const { state } = useMarket();

  const today = new Date().toISOString().slice(0, 10);

  const defaultRound = useMemo(() => {
    const next = calendar2026.find((r) => r.date >= today);
    return next ? next.round : calendar2026[calendar2026.length - 1].round;
  }, []);

  const [selectedRound, setSelectedRound] = useState(defaultRound);
  const [showCreate, setShowCreate] = useState(false);

  const roundMarkets = useMemo(() => {
    return state.markets.filter((m) => {
      const match = m.round.match(/Round (\d+)/i);
      if (!match) return false;
      return parseInt(match[1]) === selectedRound;
    });
  }, [state.markets, selectedRound]);

  const selectedRace = calendar2026.find((r) => r.round === selectedRound);

  return (
    <div>
      {showCreate && (
        <CreateMarketForm
          defaultRound={selectedRound}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Round selector + create button */}
      <div className="markets-toolbar">
        <div className="round-tabs" role="tablist" aria-label="Race rounds">
        {calendar2026.map((race) => {
          const isPast = race.date < today;
          const isActive = selectedRound === race.round;
          return (
            <button
              key={race.round}
              role="tab"
              aria-selected={isActive}
              className={[
                "round-tab",
                isActive ? "round-tab--active" : "",
                isPast ? "round-tab--past" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedRound(race.round)}
              title={race.name}
            >
              R{String(race.round).padStart(2, "0")}
            </button>
          );
        })}
        </div>
        {state.user && (
          <button
            className="btn btn--primary create-market-trigger"
            onClick={() => setShowCreate(true)}
          >
            + Create Market
          </button>
        )}
      </div>

      {/* Selected race name */}
      {selectedRace && (
        <div className="round-info">
          <h3 className="round-info__name">{selectedRace.name}</h3>
          <p className="round-info__meta muted small">
            {selectedRace.location} &nbsp;·&nbsp; {selectedRace.date}
            {selectedRace.date < today && (
              <span className="round-info__past"> &nbsp;· Past</span>
            )}
          </p>
        </div>
      )}

      {/* Market cards */}
      <div className="grid market-grid">
        {roundMarkets.map((market, index) => (
          <MarketCard key={market.id} market={market} index={index} />
        ))}
        {roundMarkets.length === 0 && (
          <p className="muted">No markets found for this round.</p>
        )}
      </div>
    </div>
  );
}
