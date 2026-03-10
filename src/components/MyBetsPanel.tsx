"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useMarket } from "@/lib/market-context";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import { formatCoins } from "@/lib/utils";

type TradeRecord = {
  id: string;
  marketId: string;
  marketName: string;
  marketRound: string;
  category: string;
  side: "yes" | "no";
  shares: number;
  price: number;
  total: number;
  type: "buy" | "sell";
  createdAt: number;
};

function formatDate(millis: number): string {
  if (!millis) return "";
  return new Date(millis).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MyBetsPanel() {
  const { state, getMarketPrice, sellShares } = useMarket();
  const user = state.user;

  const [tab, setTab] = useState<"current" | "history">("current");
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sellInputs, setSellInputs] = useState<Record<string, { side: "yes" | "no"; shares: number }>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isFirebaseConfigured() || !user) return;
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;

    setHistoryLoading(true);
    const db = getFirestoreDb();
    const q = query(
      collection(db, "users", uid, "trades"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            marketId: data.marketId || "",
            marketName: data.marketName || "",
            marketRound: data.marketRound || "",
            category: data.category || "",
            side: data.side as "yes" | "no",
            shares: data.shares || 0,
            price: data.price || 0,
            total: data.total || 0,
            type: data.type as "buy" | "sell",
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          };
        });
        setTradeHistory(records);
        setHistoryLoading(false);
      },
      () => setHistoryLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="mybets-empty">
        <p className="muted">Sign in to see your bets.</p>
      </div>
    );
  }

  const showMessage = (marketId: string, msg: string) => {
    setMessages((prev) => ({ ...prev, [marketId]: msg }));
    setTimeout(() =>
      setMessages((prev) => { const next = { ...prev }; delete next[marketId]; return next; }),
      3000
    );
  };

  const entries = Object.entries(user.positions).filter(
    ([, pos]) => pos.yes > 0 || pos.no > 0
  );

  let totalValue = 0;
  let totalSpent = 0;
  const enriched = entries.map(([marketId, position]) => {
    const market = state.markets.find((m) => m.id === marketId);
    if (!market) return null;
    const price = getMarketPrice(market);
    const yesValue = Math.round(price.yes * 100) * position.yes;
    const noValue = Math.round(price.no * 100) * position.no;
    const totalPositionValue = yesValue + noValue;
    const yesCost = position.yesCost ?? 0;
    const noCost = position.noCost ?? 0;
    const totalCost = yesCost + noCost;
    const pnl = totalPositionValue - totalCost;
    totalValue += totalPositionValue;
    totalSpent += totalCost;
    return { marketId, position, market, price, yesValue, noValue, totalPositionValue, yesCost, noCost, totalCost, pnl };
  }).filter(Boolean) as NonNullable<(typeof enriched)[number]>[];

  const handleSell = async (marketId: string) => {
    const input = sellInputs[marketId];
    if (!input || input.shares <= 0) return;
    const position = user.positions[marketId];
    if (!position || position[input.side] < input.shares) {
      showMessage(marketId, `Only ${position?.[input.side] ?? 0} shares available.`);
      return;
    }
    const market = state.markets.find((m) => m.id === marketId);
    if (!market) return;
    const price = getMarketPrice(market);
    const proceeds = Math.round((input.side === "yes" ? price.yes : price.no) * 100) * input.shares;
    const success = await sellShares(marketId, input.side, input.shares);
    if (!success) showMessage(marketId, "Sell failed. Try again.");
    else showMessage(marketId, `Sold ${input.side.toUpperCase()} ×${input.shares} · +${formatCoins(proceeds)}`);
  };

  return (
    <div className="mybets">
      {/* Summary */}
      <div className="mybets-summary">
        <div className="mybets-summary__item">
          <span className="mybets-summary__label">Open positions</span>
          <span className="mybets-summary__value">{enriched.length}</span>
        </div>
        <div className="mybets-summary__item">
          <span className="mybets-summary__label">Total spent</span>
          <span className="mybets-summary__value">{formatCoins(totalSpent)}</span>
        </div>
        <div className="mybets-summary__item">
          <span className="mybets-summary__label">Est. value</span>
          <span className="mybets-summary__value mybets-summary__value--gold">{formatCoins(totalValue)}</span>
        </div>
        <div className="mybets-summary__item">
          <span className="mybets-summary__label">Overall P&amp;L</span>
          <span className={`mybets-summary__value ${totalValue - totalSpent >= 0 ? "mybets-summary__value--up" : "mybets-summary__value--down"}`}>
            {totalValue - totalSpent >= 0 ? "+" : ""}{formatCoins(totalValue - totalSpent)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mybets-tabs">
        <button
          className={`mybets-tab ${tab === "current" ? "mybets-tab--active" : ""}`}
          type="button"
          onClick={() => setTab("current")}
        >
          Current Bets
          {enriched.length > 0 && <span className="mybets-tab__badge">{enriched.length}</span>}
        </button>
        <button
          className={`mybets-tab ${tab === "history" ? "mybets-tab--active" : ""}`}
          type="button"
          onClick={() => setTab("history")}
        >
          Trade History
          {tradeHistory.length > 0 && <span className="mybets-tab__badge">{tradeHistory.length}</span>}
        </button>
      </div>

      {/* Current Bets */}
      {tab === "current" && (
        enriched.length === 0 ? (
          <div className="mybets-empty">
            <p className="muted">No open positions yet.</p>
            <p className="muted small">Head to Markets to place your first trade.</p>
          </div>
        ) : (
          <div className="mybets-grid">
            {enriched.map(({ marketId, position, market, price, yesValue, noValue, totalPositionValue, yesCost, noCost, totalCost, pnl }) => {
              const input = sellInputs[marketId] ?? { side: position.yes > 0 ? "yes" : "no", shares: 1 };
              const maxShares = position[input.side] ?? 0;
              const sellProceeds = Math.round((input.side === "yes" ? price.yes : price.no) * 100) * input.shares;
              const yesPercent = Math.round(price.yes * 100);
              const noPercent = 100 - yesPercent;
              const pnlPositive = pnl >= 0;

              return (
                <div className="mybets-card" key={marketId}>
                  <div className="mybets-card__head">
                    <div>
                      <p className="mybets-card__round">{market.round}</p>
                      <h3 className="mybets-card__question">{market.name}</h3>
                    </div>
                    <span className="pm-card__category">{market.category}</span>
                  </div>

                  <div className="pm-prob">
                    <div className="pm-prob__bar">
                      <div className="pm-prob__fill" style={{ width: `${yesPercent}%` }} />
                    </div>
                    <div className="pm-prob__row">
                      <span className="pm-prob__yes">{yesPercent}% YES</span>
                      <span className="pm-prob__no">{noPercent}% NO</span>
                    </div>
                  </div>

                  <div className="mybets-holdings">
                    {position.yes > 0 && (
                      <div className="mybets-holding mybets-holding--yes">
                        <div className="mybets-holding__top">
                          <span className="mybets-holding__label">YES shares</span>
                          <span className="mybets-holding__shares">{position.yes}</span>
                        </div>
                        <div className="mybets-holding__bottom">
                          <span className="mybets-holding__price">{yesPercent}¢ each</span>
                          <span className="mybets-holding__value">{formatCoins(yesValue)}</span>
                        </div>
                        {yesCost > 0 && (
                          <div className="mybets-holding__spent">
                            <span>Spent</span>
                            <span>{formatCoins(yesCost)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {position.no > 0 && (
                      <div className="mybets-holding mybets-holding--no">
                        <div className="mybets-holding__top">
                          <span className="mybets-holding__label">NO shares</span>
                          <span className="mybets-holding__shares">{position.no}</span>
                        </div>
                        <div className="mybets-holding__bottom">
                          <span className="mybets-holding__price">{noPercent}¢ each</span>
                          <span className="mybets-holding__value">{formatCoins(noValue)}</span>
                        </div>
                        {noCost > 0 && (
                          <div className="mybets-holding__spent">
                            <span>Spent</span>
                            <span>{formatCoins(noCost)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mybets-card__total">
                    <div className="mybets-card__total-row">
                      <span className="muted small">Spent</span>
                      <span className="mybets-card__spent">{formatCoins(totalCost)}</span>
                    </div>
                    <div className="mybets-card__total-row">
                      <span className="muted small">Est. value</span>
                      <span className="mybets-card__total-value">{formatCoins(totalPositionValue)}</span>
                    </div>
                    <div className="mybets-card__total-row">
                      <span className="muted small">P&amp;L</span>
                      <span className={pnlPositive ? "mybets-pnl mybets-pnl--up" : "mybets-pnl mybets-pnl--down"}>
                        {pnlPositive ? "+" : ""}{formatCoins(pnl)}
                      </span>
                    </div>
                  </div>

                  <div className="mybets-sell">
                    <p className="mybets-sell__label">Sell shares</p>
                    <div className="mybets-sell__row">
                      <div className="pm-sell__side">
                        {position.yes > 0 && (
                          <button
                            className={`pm-side-btn pm-side-btn--yes ${input.side === "yes" ? "pm-side-btn--active" : ""}`}
                            type="button"
                            onClick={() => setSellInputs((prev) => ({ ...prev, [marketId]: { ...input, side: "yes", shares: Math.min(input.shares, position.yes) } }))}
                          >YES</button>
                        )}
                        {position.no > 0 && (
                          <button
                            className={`pm-side-btn pm-side-btn--no ${input.side === "no" ? "pm-side-btn--active" : ""}`}
                            type="button"
                            onClick={() => setSellInputs((prev) => ({ ...prev, [marketId]: { ...input, side: "no", shares: Math.min(input.shares, position.no) } }))}
                          >NO</button>
                        )}
                      </div>
                      <div className="pm-trade__qty">
                        <input
                          type="number"
                          min={1}
                          max={maxShares}
                          value={input.shares}
                          onChange={(e) =>
                            setSellInputs((prev) => ({
                              ...prev,
                              [marketId]: { ...input, shares: Math.min(maxShares, Math.max(1, Number(e.target.value))) },
                            }))
                          }
                        />
                        <span className="muted small">/ {maxShares}</span>
                      </div>
                      <button className="pm-btn pm-btn--sell" type="button" onClick={() => void handleSell(marketId)}>
                        Sell
                      </button>
                    </div>
                    <div className="pm-sell__preview">
                      <span className="muted small">You will receive</span>
                      <span className="pm-sell__proceeds">{formatCoins(sellProceeds)}</span>
                    </div>
                  </div>

                  {messages[marketId] && <p className="pm-status">{messages[marketId]}</p>}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Trade History */}
      {tab === "history" && (
        historyLoading ? (
          <div className="mybets-empty"><p className="muted">Loading history...</p></div>
        ) : tradeHistory.length === 0 ? (
          <div className="mybets-empty">
            <p className="muted">No trades yet.</p>
            <p className="muted small">Every buy and sell will appear here.</p>
          </div>
        ) : (
          <div className="trade-history">
            {tradeHistory.map((trade) => (
              <div className="trade-row" key={trade.id}>
                <div className="trade-row__left">
                  <span className={`trade-badge trade-badge--${trade.type}`}>
                    {trade.type === "buy" ? "BUY" : "SELL"}
                  </span>
                  <div className="trade-row__info">
                    <p className="trade-row__name">{trade.marketName}</p>
                    <p className="trade-row__meta muted small">{trade.marketRound} · {trade.category}</p>
                  </div>
                </div>
                <div className="trade-row__right">
                  <div className="trade-row__detail">
                    <span className={`trade-side trade-side--${trade.side}`}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className="trade-row__shares muted small">×{trade.shares} @ {trade.price}¢</span>
                  </div>
                  <div className="trade-row__amounts">
                    <span className={trade.type === "buy" ? "trade-row__cost" : "trade-row__proceeds"}>
                      {trade.type === "buy" ? "−" : "+"}{formatCoins(trade.total)}
                    </span>
                    <span className="trade-row__date muted small">{formatDate(trade.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
