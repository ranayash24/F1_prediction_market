"use client";

import { useState } from "react";
import { useMarket } from "@/lib/market-context";
import { formatCoins } from "@/lib/utils";

export default function WalletPanel() {
  const { state, purchaseCoins } = useMarket();
  const [amount, setAmount] = useState(500);
  const [status, setStatus] = useState("");

  if (!state.user) {
    return <p className="muted">Sign in to manage your GP Coins wallet.</p>;
  }

  const usdCost = (amount / 100).toFixed(2);

  const handlePurchase = () => {
    purchaseCoins(amount);
  };

  const handleCheckout = async () => {
    setStatus("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus(data.error || "Stripe not configured.");
      }
    } catch (error) {
      setStatus("Checkout failed.");
    }
  };

  return (
    <div className="wallet__grid">
      <div className="card">
        <h3>Current balance</h3>
        <p className="status">{formatCoins(state.user.balance)}</p>
        <p className="muted small">Provider: {state.user.provider}</p>
      </div>
      <div className="card">
        <h3>Buy GP Coins</h3>
        <p className="muted small">$1 = 100 GP Coins</p>
        <div className="wallet__form">
          <label>
            Amount
            <input
              type="number"
              min={100}
              step={100}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <button className="btn btn--primary" type="button" onClick={handleCheckout}>
            Checkout for ${usdCost}
          </button>
          <button className="btn btn--ghost" type="button" onClick={handlePurchase}>
            Demo top-up
          </button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
}
