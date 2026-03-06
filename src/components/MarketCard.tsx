"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Market } from "@/lib/types";
import { useMarket } from "@/lib/market-context";
import { formatCoins } from "@/lib/utils";
import MarketChat from "@/components/MarketChat";

export default function MarketCard({ market, index }: { market: Market; index: number }) {
  const { buyShares, getMarketPrice, state } = useMarket();
  const [shares, setShares] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  const prices = getMarketPrice(market);
  const yesPercent = Math.round(prices.yes * 100);
  const noPercent = 100 - yesPercent;
  const yesPrice = Math.round(prices.yes * 100);
  const noPrice = Math.round(prices.no * 100);
  const totalShares = market.yesShares + market.noShares;
  const cardStyle = { "--market-index": index } as CSSProperties;

  const handleBuy = async (side: "yes" | "no") => {
    if (!state.user) {
      setMessage("Sign in to trade.");
      return;
    }

    const success = await buyShares(market.id, side, shares);
    if (!success) {
      setMessage("Not enough GP Coins for this trade.");
      return;
    }
    setMessage(`Bought ${side.toUpperCase()} x${shares}.`);
  };

  return (
    <article className="card market" style={cardStyle}>
      <div className="market__header">
        <div>
          <p className="market__round">{market.round}</p>
          <h3>{market.name}</h3>
        </div>
        <span className="pill">{market.category}</span>
      </div>
      <div className="market__body">
        <div className="market__summary">
          <p className="muted">{market.description}</p>
          <div className="market__stats">
            <div>
              <span className="meta">Volume</span>
              <strong>{formatCoins(market.volume)}</strong>
            </div>
            <div>
              <span className="meta">Liquidity</span>
              <strong>{totalShares} shares</strong>
            </div>
            <div>
              <span className="meta">Sentiment</span>
              <strong>{yesPercent}% YES</strong>
            </div>
          </div>
        </div>
        <div className="market__meter">
          <span className="meta">Prediction meter</span>
          <div className="market__bar" role="img" aria-label="YES/NO probability split">
            <div className="bar bar--yes" style={{ width: `${yesPercent}%` }}>
              <span>{yesPercent}%</span>
            </div>
            <div className="bar bar--no" style={{ width: `${noPercent}%` }}>
              <span>{noPercent}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="market__prices">
        <div className="market__price-card market__price-card--yes">
          <span className="meta">YES price</span>
          <strong>{formatCoins(yesPrice)}</strong>
        </div>
        <div className="market__price-card market__price-card--no">
          <span className="meta">NO price</span>
          <strong>{formatCoins(noPrice)}</strong>
        </div>
      </div>
      <div className="market__trade">
        <label>
          Shares
          <input
            type="number"
            min={1}
            value={shares}
            onChange={(event) => setShares(Number(event.target.value))}
          />
        </label>
        <div className="market__buttons">
          <button className="btn btn--yes" type="button" onClick={() => void handleBuy("yes")}>
            Buy YES
          </button>
          <button className="btn btn--no" type="button" onClick={() => void handleBuy("no")}>
            Buy NO
          </button>
        </div>
      </div>
      {message && <p className="status">{message}</p>}
      <MarketChat marketId={market.id} />
    </article>
  );
}
