"use client";

import { useState } from "react";
import { useMarket } from "@/lib/market-context";
import { MARKET_CATEGORIES } from "@/lib/data";
import { calendar2026 } from "@/lib/calendar-2026";

type Props = {
  onClose: () => void;
  defaultRound: number;
};

export default function CreateMarketForm({ onClose, defaultRound }: Props) {
  const { state, createMarket } = useMarket();

  const [round, setRound] = useState(
    calendar2026.find((r) => r.round === defaultRound)
      ? `Round ${defaultRound} · ${calendar2026.find((r) => r.round === defaultRound)!.name}`
      : ""
  );
  const [category, setCategory] = useState<string>(MARKET_CATEGORIES[0]);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round || !category || !question.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    const result = await createMarket({
      round,
      name: question.trim(),
      description: description.trim(),
      category,
    });
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Something went wrong.");
    }
  };

  if (!state.user) {
    return (
      <div className="create-market-modal">
        <div className="create-market__box">
          <p className="muted">You must be signed in to create a market.</p>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-market-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-market__box">
        {/* Header */}
        <div className="create-market__head">
          <div>
            <p className="section__eyebrow">PROPOSE A MARKET</p>
            <h3>Create Market</h3>
          </div>
          <button className="create-market__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {status === "success" ? (
          <div className="create-market__success">
            <div className="create-market__success-icon">✓</div>
            <h4>Submitted for review!</h4>
            <p className="muted small">
              Your market has been sent to admin for approval. It will appear once approved.
            </p>
            <button className="btn btn--primary" style={{ marginTop: "1rem" }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="create-market__form" onSubmit={handleSubmit}>
            {/* Round */}
            <label className="create-market__label">
              <span>Race Round</span>
              <select
                className="create-market__select"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                required
              >
                <option value="" disabled>Select a round…</option>
                {calendar2026.map((race) => {
                  const val = `Round ${race.round} · ${race.name}`;
                  return (
                    <option key={race.round} value={val}>
                      R{String(race.round).padStart(2, "0")} — {race.name}
                    </option>
                  );
                })}
              </select>
            </label>

            {/* Category */}
            <label className="create-market__label">
              <span>Category</span>
              <div className="create-market__cat-grid">
                {MARKET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`create-market__cat-btn${category === cat ? " create-market__cat-btn--active" : ""}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </label>

            {/* Question */}
            <label className="create-market__label">
              <span>Market Question</span>
              <input
                className="create-market__input"
                type="text"
                placeholder="e.g. Will Verstappen win qualifying?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={120}
                required
              />
              <span className="create-market__hint">{question.length}/120</span>
            </label>

            {/* Description */}
            <label className="create-market__label">
              <span>Description <span className="muted">(optional)</span></span>
              <textarea
                className="create-market__textarea"
                placeholder="Add more context for traders…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={3}
              />
            </label>

            {status === "error" && (
              <p className="create-market__error">{errorMsg}</p>
            )}

            <div className="create-market__actions">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={status === "loading" || !round || !question.trim()}
              >
                {status === "loading" ? "Submitting…" : "Submit for Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
