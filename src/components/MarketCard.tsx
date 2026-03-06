"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Market } from "@/lib/types";
import { useMarket } from "@/lib/market-context";
import { formatCoins } from "@/lib/utils";
import MarketChat from "@/components/MarketChat";

export default function MarketCard({ market, index }: { market: Market; index: number }) {
  const { buyShares, sellShares, getMarketPrice, state } = useMarket();
  const [shares, setShares] = useState(5);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [sellSide, setSellSide] = useState<"yes" | "no">("yes");
  const [message, setMessage] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const prices = getMarketPrice(market);
  const yesPercent = Math.round(prices.yes * 100);
  const noPercent = 100 - yesPercent;
  const totalShares = market.yesShares + market.noShares;
  const cardStyle = { "--market-index": index } as CSSProperties;

  const position = state.user?.positions[market.id];
  const hasPosition = position && (position.yes > 0 || position.no > 0);

  const maxSellShares = position ? position[sellSide] : 0;
  const sellProceeds = Math.round((sellSide === "yes" ? prices.yes : prices.no) * 100) * shares;
  const buyCost = Math.round((mode === "buy" ? (shares > 0 ? 1 : 0) : 0));

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleBuy = async (side: "yes" | "no") => {
    if (!state.user) { showMessage("Sign in to trade."); return; }
    const success = await buyShares(market.id, side, shares);
    if (!success) showMessage("Not enough GP Coins.");
    else showMessage(`Bought ${side.toUpperCase()} ×${shares}`);
  };

  const handleSell = async () => {
    if (!state.user) { showMessage("Sign in to trade."); return; }
    if (shares > maxSellShares) { showMessage(`You only have ${maxSellShares} ${sellSide.toUpperCase()} shares.`); return; }
    const success = await sellShares(market.id, sellSide, shares);
    if (!success) showMessage("Sell failed. Try again.");
    else showMessage(`Sold ${sellSide.toUpperCase()} ×${shares} · +${formatCoins(sellProceeds)}`);
  };

  return (
    <article className="pm-card" style={cardStyle}>
      {/* Header */}
      <div className="pm-card__head">
        <span className="pm-card__category">{market.category}</span>
        <span className="pm-card__vol muted small">Vol {formatCoins(market.volume)}</span>
      </div>

      {/* Question */}
      <h3 className="pm-card__question">{market.name}</h3>
      <p className="pm-card__desc muted small">{market.description}</p>

      {/* Probability bar */}
      <div className="pm-prob">
        <div className="pm-prob__bar" role="img" aria-label={`${yesPercent}% YES probability`}>
          <div className="pm-prob__fill" style={{ width: `${yesPercent}%` }} />
        </div>
        <div className="pm-prob__row">
          <span className="pm-prob__yes">{yesPercent}% YES</span>
          <span className="pm-prob__no">{noPercent}% NO</span>
        </div>
      </div>

      {/* Stats */}
      <div className="pm-stats">
        <div className="pm-stat">
          <span className="pm-stat__label">Volume</span>
          <span className="pm-stat__value">{formatCoins(market.volume)}</span>
        </div>
        <div className="pm-stat">
          <span className="pm-stat__label">Shares</span>
          <span className="pm-stat__value">{totalShares}</span>
        </div>
        <div className="pm-stat">
          <span className="pm-stat__label">Yes price</span>
          <span className="pm-stat__value pm-stat__value--yes">{yesPercent}¢</span>
        </div>
        <div className="pm-stat">
          <span className="pm-stat__label">No price</span>
          <span className="pm-stat__value pm-stat__value--no">{noPercent}¢</span>
        </div>
      </div>

      {/* Buy / Sell toggle */}
      {hasPosition && (
        <div className="pm-mode-toggle">
          <button
            className={`pm-mode-btn ${mode === "buy" ? "pm-mode-btn--active" : ""}`}
            type="button"
            onClick={() => setMode("buy")}
          >
            Buy
          </button>
          <button
            className={`pm-mode-btn ${mode === "sell" ? "pm-mode-btn--active" : ""}`}
            type="button"
            onClick={() => setMode("sell")}
          >
            Sell
          </button>
        </div>
      )}

      {/* BUY mode */}
      {mode === "buy" && (
        <div className="pm-trade">
          <div className="pm-trade__qty">
            <input
              type="number"
              min={1}
              value={shares}
              onChange={(e) => setShares(Math.max(1, Number(e.target.value)))}
              aria-label="Shares"
            />
            <span className="muted small">shares</span>
          </div>
          <button className="pm-btn pm-btn--yes" type="button" onClick={() => void handleBuy("yes")}>
            Buy YES · {yesPercent}¢
          </button>
          <button className="pm-btn pm-btn--no" type="button" onClick={() => void handleBuy("no")}>
            Buy NO · {noPercent}¢
          </button>
        </div>
      )}

      {/* SELL mode */}
      {mode === "sell" && hasPosition && (
        <div className="pm-sell">
          <div className="pm-sell__position">
            {position!.yes > 0 && (
              <span className="pm-sell__holding pm-sell__holding--yes">
                {position!.yes} YES shares
              </span>
            )}
            {position!.no > 0 && (
              <span className="pm-sell__holding pm-sell__holding--no">
                {position!.no} NO shares
              </span>
            )}
          </div>

          <div className="pm-sell__row">
            {/* Side selector */}
            <div className="pm-sell__side">
              {position!.yes > 0 && (
                <button
                  className={`pm-side-btn pm-side-btn--yes ${sellSide === "yes" ? "pm-side-btn--active" : ""}`}
                  type="button"
                  onClick={() => setSellSide("yes")}
                >
                  YES
                </button>
              )}
              {position!.no > 0 && (
                <button
                  className={`pm-side-btn pm-side-btn--no ${sellSide === "no" ? "pm-side-btn--active" : ""}`}
                  type="button"
                  onClick={() => setSellSide("no")}
                >
                  NO
                </button>
              )}
            </div>

            {/* Quantity */}
            <div className="pm-trade__qty">
              <input
                type="number"
                min={1}
                max={maxSellShares}
                value={shares}
                onChange={(e) => setShares(Math.min(maxSellShares, Math.max(1, Number(e.target.value))))}
                aria-label="Shares to sell"
              />
              <span className="muted small">/ {maxSellShares}</span>
            </div>

            <button className="pm-btn pm-btn--sell" type="button" onClick={() => void handleSell()}>
              Sell
            </button>
          </div>

          {/* Proceeds preview */}
          <div className="pm-sell__preview">
            <span className="muted small">You will receive</span>
            <span className="pm-sell__proceeds">{formatCoins(sellProceeds)}</span>
          </div>
        </div>
      )}

      {message && <p className="pm-status">{message}</p>}

      {/* Chat toggle */}
      <button
        className="pm-chat-toggle"
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        aria-expanded={chatOpen}
      >
        <span className="pm-chat-toggle__icon">{chatOpen ? "▲" : "▼"}</span>
        Race chat
      </button>

      {chatOpen && <MarketChat marketId={market.id} />}
    </article>
  );
}
