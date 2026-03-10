"use client";

import { useMemo } from "react";
import { useMarket } from "@/lib/market-context";
import { ADMIN_EMAIL } from "@/lib/data";
import type { PendingMarket } from "@/lib/types";

function StatusBadge({ status }: { status: PendingMarket["status"] }) {
  const cls =
    status === "pending"
      ? "admin-badge admin-badge--pending"
      : status === "approved"
      ? "admin-badge admin-badge--approved"
      : "admin-badge admin-badge--rejected";
  return <span className={cls}>{status.toUpperCase()}</span>;
}

export default function AdminPage() {
  const { state, approveMarket, rejectMarket } = useMarket();

  const isAdmin = state.user?.email === ADMIN_EMAIL;

  const pending = useMemo(
    () => state.pendingMarkets.filter((m) => m.status === "pending"),
    [state.pendingMarkets]
  );
  const reviewed = useMemo(
    () =>
      [...state.pendingMarkets]
        .filter((m) => m.status !== "pending")
        .sort((a, b) => (a.status < b.status ? -1 : 1)),
    [state.pendingMarkets]
  );

  if (!state.user) {
    return (
      <main>
        <div className="container section">
          <p className="muted">You must be signed in to access this page.</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <div className="container section">
          <div className="admin-denied">
            <p className="section__eyebrow">ACCESS DENIED</p>
            <h2>Admin Only</h2>
            <p className="muted">This page is restricted to the admin account.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <section className="section">
          <div className="section__title">
            <div>
              <p className="section__eyebrow">ADMIN</p>
              <h2>Market Approvals</h2>
            </div>
            <span className="admin-badge admin-badge--pending">{pending.length} PENDING</span>
          </div>

          {/* Pending queue */}
          {pending.length === 0 ? (
            <div className="admin-empty">
              <p className="muted">No markets waiting for review.</p>
            </div>
          ) : (
            <div className="admin-list">
              {pending.map((market) => (
                <div key={market.id} className="admin-card admin-card--pending">
                  <div className="admin-card__top">
                    <div className="admin-card__meta">
                      <span className="admin-card__round">{market.round}</span>
                      <span className="admin-card__cat">{market.category}</span>
                    </div>
                    <StatusBadge status={market.status} />
                  </div>
                  <h4 className="admin-card__question">{market.name}</h4>
                  {market.description && (
                    <p className="admin-card__desc muted small">{market.description}</p>
                  )}
                  <div className="admin-card__submitter">
                    Submitted by <strong>{market.submittedByName}</strong>{" "}
                    <span className="muted small">({market.submittedBy})</span>
                  </div>
                  <div className="admin-card__actions">
                    <button
                      className="btn btn--yes"
                      onClick={() => approveMarket(market.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn btn--no"
                      onClick={() => rejectMarket(market.id)}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <>
              <div className="section__title" style={{ marginTop: "2.5rem" }}>
                <h3>Reviewed</h3>
              </div>
              <div className="admin-list">
                {reviewed.map((market) => (
                  <div key={market.id} className={`admin-card admin-card--${market.status}`}>
                    <div className="admin-card__top">
                      <div className="admin-card__meta">
                        <span className="admin-card__round">{market.round}</span>
                        <span className="admin-card__cat">{market.category}</span>
                      </div>
                      <StatusBadge status={market.status} />
                    </div>
                    <h4 className="admin-card__question">{market.name}</h4>
                    <div className="admin-card__submitter">
                      Submitted by <strong>{market.submittedByName}</strong>{" "}
                      <span className="muted small">({market.submittedBy})</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
