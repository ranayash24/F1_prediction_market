"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { INITIAL_COINS, buildMarketsFromCalendar } from "@/lib/data";
import type { Market, Position, User } from "@/lib/types";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

const STORAGE_KEY = "gp-market-state-v1";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081";

type MarketState = {
  markets: Market[];
  users: Record<string, User>;
  currentEmail: string | null;
};

type MarketContextState = MarketState & {
  user: User | null;
};

type AuthPayload = {
  name: string;
  email: string;
  provider: string;
};

type MarketContextValue = {
  state: MarketContextState;
  signIn: (payload: AuthPayload) => void;
  signOut: () => void;
  buyShares: (marketId: string, side: "yes" | "no", shares: number) => boolean;
  purchaseCoins: (amount: number) => void;
  getMarketPrice: (market: Market) => { yes: number; no: number };
};

const MarketContext = createContext<MarketContextValue | null>(null);

const defaultState: MarketState = {
  markets: buildMarketsFromCalendar(),
  users: {},
  currentEmail: null,
};

function parseState(raw: string | null): MarketState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MarketState>;
    if (!parsed || !Array.isArray(parsed.markets)) return null;
    return {
      markets: parsed.markets,
      users: parsed.users || {},
      currentEmail: parsed.currentEmail || null,
    };
  } catch {
    return null;
  }
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MarketState>(defaultState);

  useEffect(() => {
    const saved = parseState(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      setState(saved);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadMarkets = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/markets`);
        if (!response.ok) return;
        const data = (await response.json()) as Market[];
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setState((prev) => ({ ...prev, markets: data }));
      } catch {
        return;
      }
    };
    loadMarkets();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getMarketPrice = (market: Market) => {
    const total = market.yesShares + market.noShares;
    if (total === 0) return { yes: 0.5, no: 0.5 };
    const yes = market.yesShares / total;
    return { yes, no: 1 - yes };
  };

  const signIn = useCallback((payload: AuthPayload) => {
    setState((prev) => {
      const existing = prev.users[payload.email];
      const user: User = existing
        ? { ...existing, name: payload.name, provider: payload.provider }
        : {
            name: payload.name,
            email: payload.email,
            provider: payload.provider,
            balance: INITIAL_COINS,
            positions: {},
          };

      return {
        ...prev,
        users: { ...prev.users, [payload.email]: user },
        currentEmail: payload.email,
      };
    });
  }, []);

  const signOut = useCallback(() => {
    setState((prev) => ({ ...prev, currentEmail: null }));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        signIn({
          name: user.displayName || "GP Racer",
          email: user.email,
          provider: user.providerData[0]?.providerId || "firebase",
        });
      } else {
        signOut();
      }
    });
    return () => unsubscribe();
  }, [signIn, signOut]);

  const buyShares = (marketId: string, side: "yes" | "no", shares: number) => {
    if (!Number.isFinite(shares) || shares <= 0) return false;

    let success = false;
    setState((prev) => {
      if (!prev.currentEmail) return prev;
      const currentUser = prev.users[prev.currentEmail];
      if (!currentUser) return prev;
      const marketIndex = prev.markets.findIndex((item) => item.id === marketId);
      if (marketIndex === -1) return prev;

      const market = prev.markets[marketIndex];
      const prices = getMarketPrice(market);
      const price = side === "yes" ? prices.yes : prices.no;
      const cost = Math.round(price * 100) * shares;

      if (currentUser.balance < cost) return prev;

      const updatedMarkets = [...prev.markets];
      const updatedMarket = { ...market };
      updatedMarket.volume += cost;
      if (side === "yes") {
        updatedMarket.yesShares += shares;
      } else {
        updatedMarket.noShares += shares;
      }
      updatedMarkets[marketIndex] = updatedMarket;

      const positions: Record<string, Position> = { ...currentUser.positions };
      const existingPosition = positions[marketId] || { yes: 0, no: 0 };
      positions[marketId] = {
        ...existingPosition,
        [side]: existingPosition[side] + shares,
      };

      success = true;

      return {
        ...prev,
        markets: updatedMarkets,
        users: {
          ...prev.users,
          [currentUser.email]: {
            ...currentUser,
            balance: currentUser.balance - cost,
            positions,
          },
        },
      };
    });

    return success;
  };

  const purchaseCoins = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setState((prev) => {
      if (!prev.currentEmail) return prev;
      const currentUser = prev.users[prev.currentEmail];
      if (!currentUser) return prev;
      return {
        ...prev,
        users: {
          ...prev.users,
          [currentUser.email]: {
            ...currentUser,
            balance: currentUser.balance + amount,
          },
        },
      };
    });
  };

  const value = useMemo(() => {
    const user = state.currentEmail ? state.users[state.currentEmail] || null : null;
    return { state: { ...state, user }, signIn, signOut, buyShares, purchaseCoins, getMarketPrice };
  }, [state]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !state.user) return;
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const db = getFirestoreDb();
    setDoc(
      doc(db, "leaderboard", uid),
      {
        name: state.user.name,
        email: state.user.email,
        balance: state.user.balance,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {
      return;
    });
  }, [state.user?.name, state.user?.email, state.user?.balance]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return context;
}
