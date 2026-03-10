"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { ADMIN_EMAIL, INITIAL_COINS, buildMarketsFromCalendar } from "@/lib/data";
import type { Market, PendingMarket, Position, User } from "@/lib/types";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

const STORAGE_KEY = "gp-market-state-v1";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081";

type MarketState = {
  markets: Market[];
  users: Record<string, User>;
  currentEmail: string | null;
  pendingMarkets: PendingMarket[];
};

type MarketContextState = MarketState & {
  user: User | null;
};

type AuthPayload = {
  name: string;
  email: string;
  provider: string;
};

type CreateMarketData = {
  round: string;
  name: string;
  description: string;
  category: string;
};

type MarketContextValue = {
  state: MarketContextState;
  signIn: (payload: AuthPayload) => void;
  signOut: () => void;
  buyShares: (marketId: string, side: "yes" | "no", shares: number) => Promise<boolean>;
  sellShares: (marketId: string, side: "yes" | "no", shares: number) => Promise<boolean>;
  purchaseCoins: (amount: number) => void;
  getMarketPrice: (market: Market) => { yes: number; no: number };
  createMarket: (data: CreateMarketData) => Promise<{ success: boolean; error?: string }>;
  approveMarket: (pendingId: string) => Promise<boolean>;
  rejectMarket: (pendingId: string) => Promise<boolean>;
};

const MarketContext = createContext<MarketContextValue | null>(null);

const marketSignature = (market: Pick<Market, "round" | "name" | "category">) =>
  `${market.round.trim().toLowerCase()}|${market.name.trim().toLowerCase()}|${market.category
    .trim()
    .toLowerCase()}`;

const seedMarkets = buildMarketsFromCalendar();
const marketOrder = new Map(seedMarkets.map((market, index) => [market.id, index]));

const defaultState: MarketState = {
  markets: seedMarkets,
  users: {},
  currentEmail: null,
  pendingMarkets: [],
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
      pendingMarkets: (parsed.pendingMarkets as PendingMarket[]) || [],
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
    if (!isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    const marketsRef = collection(db, "markets");
    let active = true;
    let unsubscribe = () => {};

    const seedAndSubscribe = async () => {
      try {
        const snapshot = await getDocs(marketsRef);
        if (!active) return;
        const existingIds = new Set(snapshot.docs.map((docSnap) => docSnap.id));
        const missing = seedMarkets.filter((market) => !existingIds.has(market.id));
        if (snapshot.empty || missing.length > 0) {
          const batch = writeBatch(db);
          const targets = snapshot.empty ? seedMarkets : missing;
          targets.forEach((market) => {
            batch.set(doc(db, "markets", market.id), { ...market });
          });
          await batch.commit();
        }

        unsubscribe = onSnapshot(
          marketsRef,
          (snap) => {
            const nextMarkets = snap.docs
              .map((docSnap) => {
                const data = docSnap.data() as Partial<Market>;
                return {
                  id: docSnap.id,
                  round: data.round || "",
                  name: data.name || "",
                  description: data.description || "",
                  category: data.category || "",
                  yesShares: Number.isFinite(data.yesShares) ? data.yesShares : 0,
                  noShares: Number.isFinite(data.noShares) ? data.noShares : 0,
                  volume: Number.isFinite(data.volume) ? data.volume : 0,
                };
              })
              .filter((market) => market.round && market.name);
            nextMarkets.sort((a, b) => (marketOrder.get(a.id) ?? 9999) - (marketOrder.get(b.id) ?? 9999));
            setState((prev) => ({ ...prev, markets: nextMarkets }));
          },
          () => {
            setState((prev) => ({ ...prev, markets: seedMarkets }));
          }
        );
      } catch {
        return;
      }
    };

    seedAndSubscribe();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Subscribe to pending markets
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const db = getFirestoreDb();
    const unsubscribe = onSnapshot(
      collection(db, "pending_markets"),
      (snap) => {
        const next = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PendingMarket, "id">),
        })) as PendingMarket[];
        setState((prev) => ({ ...prev, pendingMarkets: next }));
      },
      () => {}
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured()) return;
    let active = true;
    const loadMarkets = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/markets`);
        if (!response.ok) return;
        const data = (await response.json()) as Market[];
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setState((prev) => {
          const nextMarkets = data;
          const signatureToId = new Map<string, string>();
          nextMarkets.forEach((market) => {
            signatureToId.set(marketSignature(market), market.id);
          });

          const idRemap = new Map<string, string>();
          prev.markets.forEach((market) => {
            const nextId = signatureToId.get(marketSignature(market));
            if (nextId && nextId !== market.id) {
              idRemap.set(market.id, nextId);
            }
          });

          if (idRemap.size === 0) {
            return { ...prev, markets: nextMarkets };
          }

          const remappedUsers: Record<string, User> = {};
          Object.entries(prev.users).forEach(([email, user]) => {
            const nextPositions: Record<string, Position> = {};
            Object.entries(user.positions).forEach(([marketId, position]) => {
              const targetId = idRemap.get(marketId) ?? marketId;
              const existing = nextPositions[targetId];
              nextPositions[targetId] = existing
                ? { yes: existing.yes + position.yes, no: existing.no + position.no }
                : { ...position };
            });
            remappedUsers[email] = { ...user, positions: nextPositions };
          });

          return { ...prev, markets: nextMarkets, users: remappedUsers };
        });
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
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      firebaseSignOut(auth).catch(() => {
        return;
      });
    }
    setState((prev) => ({ ...prev, currentEmail: null }));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    let unsubscribeUser = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeUser();
      if (!user?.uid || !user.email) {
        setState((prev) => ({ ...prev, currentEmail: null }));
        return;
      }
      const db = getFirestoreDb();
      const userRef = doc(db, "users", user.uid);
      unsubscribeUser = onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
          const payload: User = {
            name: user.displayName || "GP Racer",
            email: user.email,
            provider: user.providerData[0]?.providerId || "firebase",
            balance: INITIAL_COINS,
            positions: {},
          };
          setDoc(userRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {
            return;
          });
          setState((prev) => ({
            ...prev,
            currentEmail: payload.email,
            users: { ...prev.users, [payload.email]: payload },
          }));
          return;
        }
        const data = snap.data() as Partial<User>;
        const hydrated: User = {
          name: data.name || user.displayName || "GP Racer",
          email: data.email || user.email,
          provider: data.provider || user.providerData[0]?.providerId || "firebase",
          balance: Number.isFinite(data.balance) ? data.balance : INITIAL_COINS,
          positions: data.positions || {},
        };
        setState((prev) => ({
          ...prev,
          currentEmail: hydrated.email,
          users: { ...prev.users, [hydrated.email]: hydrated },
        }));

        // Write leaderboard entry here — uid is guaranteed from the outer closure
        setDoc(
          doc(db, "leaderboard", user.uid),
          {
            name: hydrated.name,
            email: hydrated.email,
            balance: hydrated.balance,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {
          return;
        });
      });
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  const buyShares = async (marketId: string, side: "yes" | "no", shares: number) => {
    if (!Number.isFinite(shares) || shares <= 0) return false;

    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return false;
      const db = getFirestoreDb();
      let success = false;
      try {
        await runTransaction(db, async (transaction) => {
          const marketRef = doc(db, "markets", marketId);
          const userRef = doc(db, "users", uid);
          const marketSnap = await transaction.get(marketRef);
          const userSnap = await transaction.get(userRef);
          if (!marketSnap.exists() || !userSnap.exists()) return;
          const market = marketSnap.data() as Market;
          const user = userSnap.data() as User;
          const normalizedMarket: Market = {
            id: marketId,
            round: market.round || "",
            name: market.name || "",
            description: market.description || "",
            category: market.category || "",
            yesShares: Number.isFinite(market.yesShares) ? market.yesShares : 0,
            noShares: Number.isFinite(market.noShares) ? market.noShares : 0,
            volume: Number.isFinite(market.volume) ? market.volume : 0,
          };
          const prices = getMarketPrice(normalizedMarket);
          const price = side === "yes" ? prices.yes : prices.no;
          const cost = Math.round(price * 100) * shares;
          const balance = Number.isFinite(user.balance) ? user.balance : 0;
          if (balance < cost) return;

          const nextYesShares = normalizedMarket.yesShares + (side === "yes" ? shares : 0);
          const nextNoShares = normalizedMarket.noShares + (side === "no" ? shares : 0);
          const nextVolume = normalizedMarket.volume + cost;
          transaction.update(marketRef, {
            yesShares: nextYesShares,
            noShares: nextNoShares,
            volume: nextVolume,
          });

          const positions: Record<string, Position> = { ...(user.positions || {}) };
          const existingPosition = positions[marketId] || { yes: 0, no: 0, yesCost: 0, noCost: 0 };
          const costKey = side === "yes" ? "yesCost" : "noCost";
          positions[marketId] = {
            ...existingPosition,
            [side]: existingPosition[side] + shares,
            [costKey]: (existingPosition[costKey] ?? 0) + cost,
          };

          transaction.set(
            userRef,
            {
              balance: balance - cost,
              positions,
              name: user.name || auth.currentUser?.displayName || "GP Racer",
              email: user.email || auth.currentUser?.email,
              provider: user.provider || auth.currentUser?.providerData[0]?.providerId || "firebase",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          const tradeRef = doc(collection(db, "users", uid, "trades"));
          transaction.set(tradeRef, {
            marketId,
            marketName: normalizedMarket.name,
            marketRound: normalizedMarket.round,
            category: normalizedMarket.category,
            side,
            shares,
            price,
            total: cost,
            type: "buy",
            createdAt: serverTimestamp(),
          });

          success = true;
        });
      } catch {
        return false;
      }
      return success;
    }

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
      const existingPosition = positions[marketId] || { yes: 0, no: 0, yesCost: 0, noCost: 0 };
      const costKey = side === "yes" ? "yesCost" : "noCost";
      positions[marketId] = {
        ...existingPosition,
        [side]: existingPosition[side] + shares,
        [costKey]: (existingPosition[costKey] ?? 0) + cost,
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
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const db = getFirestoreDb();
      setDoc(
        doc(db, "users", uid),
        { balance: increment(amount), updatedAt: serverTimestamp() },
        { merge: true }
      ).catch(() => {
        return;
      });
      return;
    }
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

  const createMarket = async (data: CreateMarketData): Promise<{ success: boolean; error?: string }> => {
    const dupKey = (round: string, name: string) =>
      `${round.trim().toLowerCase()}|${name.trim().toLowerCase()}`;
    const key = dupKey(data.round, data.name);

    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user?.email) return { success: false, error: "Not signed in." };
      const db = getFirestoreDb();
      try {
        const [marketsSnap, pendingSnap] = await Promise.all([
          getDocs(collection(db, "markets")),
          getDocs(collection(db, "pending_markets")),
        ]);
        const hasDup =
          marketsSnap.docs.some((d) => {
            const m = d.data() as Market;
            return dupKey(m.round, m.name) === key;
          }) ||
          pendingSnap.docs.some((d) => {
            const m = d.data() as PendingMarket;
            return m.status !== "rejected" && dupKey(m.round, m.name) === key;
          });
        if (hasDup) return { success: false, error: "A market with this question already exists for this round." };
        const ref = doc(collection(db, "pending_markets"));
        await setDoc(ref, {
          ...data,
          submittedBy: user.email,
          submittedByName: user.displayName || "GP Racer",
          status: "pending",
          createdAt: serverTimestamp(),
        });
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[createMarket]", msg);
        if (msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
          return { success: false, error: "Permission denied. Ask admin to update Firestore rules." };
        }
        return { success: false, error: `Failed to submit: ${msg}` };
      }
    }

    // Local mode
    let result: { success: boolean; error?: string } = { success: false, error: "Not signed in." };
    setState((prev) => {
      if (!prev.currentEmail) return prev;
      const user = prev.users[prev.currentEmail];
      if (!user) return prev;
      const hasDup =
        prev.markets.some((m) => dupKey(m.round, m.name) === key) ||
        prev.pendingMarkets.some((m) => m.status !== "rejected" && dupKey(m.round, m.name) === key);
      if (hasDup) {
        result = { success: false, error: "A market with this question already exists for this round." };
        return prev;
      }
      result = { success: true };
      return {
        ...prev,
        pendingMarkets: [
          ...prev.pendingMarkets,
          {
            id: `pending-${Date.now()}`,
            ...data,
            submittedBy: user.email,
            submittedByName: user.name,
            status: "pending" as const,
          },
        ],
      };
    });
    return result;
  };

  const approveMarket = async (pendingId: string): Promise<boolean> => {
    if (isFirebaseConfigured()) {
      const db = getFirestoreDb();
      try {
        const pendingSnap = await getDocs(collection(db, "pending_markets"));
        const pendingDoc = pendingSnap.docs.find((d) => d.id === pendingId);
        if (!pendingDoc) return false;
        const pending = pendingDoc.data() as PendingMarket;
        const newMarket: Market = {
          id: `custom-${pendingId}`,
          round: pending.round,
          name: pending.name,
          description: pending.description,
          category: pending.category,
          yesShares: 60,
          noShares: 60,
          volume: 0,
        };
        await setDoc(doc(db, "markets", newMarket.id), newMarket);
        await setDoc(doc(db, "pending_markets", pendingId), { status: "approved" }, { merge: true });
        return true;
      } catch {
        return false;
      }
    }
    // Local mode
    let found = false;
    setState((prev) => {
      const pending = prev.pendingMarkets.find((m) => m.id === pendingId);
      if (!pending) return prev;
      found = true;
      const newMarket: Market = {
        id: `custom-${pendingId}`,
        round: pending.round,
        name: pending.name,
        description: pending.description,
        category: pending.category,
        yesShares: 60,
        noShares: 60,
        volume: 0,
      };
      return {
        ...prev,
        markets: [...prev.markets, newMarket],
        pendingMarkets: prev.pendingMarkets.map((m) =>
          m.id === pendingId ? { ...m, status: "approved" as const } : m
        ),
      };
    });
    return found;
  };

  const rejectMarket = async (pendingId: string): Promise<boolean> => {
    if (isFirebaseConfigured()) {
      const db = getFirestoreDb();
      try {
        await setDoc(doc(db, "pending_markets", pendingId), { status: "rejected" }, { merge: true });
        return true;
      } catch {
        return false;
      }
    }
    setState((prev) => ({
      ...prev,
      pendingMarkets: prev.pendingMarkets.map((m) =>
        m.id === pendingId ? { ...m, status: "rejected" as const } : m
      ),
    }));
    return true;
  };

  const sellShares = async (marketId: string, side: "yes" | "no", shares: number) => {
    if (!Number.isFinite(shares) || shares <= 0) return false;

    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return false;
      const db = getFirestoreDb();
      let success = false;
      try {
        await runTransaction(db, async (transaction) => {
          const marketRef = doc(db, "markets", marketId);
          const userRef = doc(db, "users", uid);
          const marketSnap = await transaction.get(marketRef);
          const userSnap = await transaction.get(userRef);
          if (!marketSnap.exists() || !userSnap.exists()) return;
          const market = marketSnap.data() as Market;
          const user = userSnap.data() as User;

          const positions: Record<string, Position> = { ...(user.positions || {}) };
          const position = positions[marketId] || { yes: 0, no: 0, yesCost: 0, noCost: 0 };
          if (position[side] < shares) return;

          const normalizedMarket: Market = {
            id: marketId,
            round: market.round || "",
            name: market.name || "",
            description: market.description || "",
            category: market.category || "",
            yesShares: Number.isFinite(market.yesShares) ? market.yesShares : 0,
            noShares: Number.isFinite(market.noShares) ? market.noShares : 0,
            volume: Number.isFinite(market.volume) ? market.volume : 0,
          };
          const prices = getMarketPrice(normalizedMarket);
          const price = side === "yes" ? prices.yes : prices.no;
          const proceeds = Math.round(price * 100) * shares;
          const balance = Number.isFinite(user.balance) ? user.balance : 0;

          transaction.update(marketRef, {
            yesShares: Math.max(0, normalizedMarket.yesShares - (side === "yes" ? shares : 0)),
            noShares: Math.max(0, normalizedMarket.noShares - (side === "no" ? shares : 0)),
          });

          const costKey = side === "yes" ? "yesCost" : "noCost";
          const existingCost = position[costKey] ?? 0;
          const costReduction = position[side] > 0 ? (existingCost / position[side]) * shares : 0;
          const newPosition = {
            ...position,
            [side]: position[side] - shares,
            [costKey]: Math.max(0, existingCost - costReduction),
          };
          if (newPosition.yes === 0 && newPosition.no === 0) {
            delete positions[marketId];
          } else {
            positions[marketId] = newPosition;
          }

          transaction.set(
            userRef,
            {
              balance: balance + proceeds,
              positions,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          const tradeRef = doc(collection(db, "users", uid, "trades"));
          transaction.set(tradeRef, {
            marketId,
            marketName: normalizedMarket.name,
            marketRound: normalizedMarket.round,
            category: normalizedMarket.category,
            side,
            shares,
            price,
            total: proceeds,
            type: "sell",
            createdAt: serverTimestamp(),
          });

          success = true;
        });
      } catch {
        return false;
      }
      return success;
    }

    let success = false;
    setState((prev) => {
      if (!prev.currentEmail) return prev;
      const currentUser = prev.users[prev.currentEmail];
      if (!currentUser) return prev;
      const marketIndex = prev.markets.findIndex((m) => m.id === marketId);
      if (marketIndex === -1) return prev;

      const market = prev.markets[marketIndex];
      const position = currentUser.positions[marketId] || { yes: 0, no: 0, yesCost: 0, noCost: 0 };
      if (position[side] < shares) return prev;

      const prices = getMarketPrice(market);
      const price = side === "yes" ? prices.yes : prices.no;
      const proceeds = Math.round(price * 100) * shares;

      const updatedMarket = { ...market };
      if (side === "yes") updatedMarket.yesShares = Math.max(0, updatedMarket.yesShares - shares);
      else updatedMarket.noShares = Math.max(0, updatedMarket.noShares - shares);

      const updatedMarkets = [...prev.markets];
      updatedMarkets[marketIndex] = updatedMarket;

      const costKey = side === "yes" ? "yesCost" : "noCost";
      const existingCost = position[costKey] ?? 0;
      const costReduction = position[side] > 0 ? (existingCost / position[side]) * shares : 0;
      const positions = { ...currentUser.positions };
      const newPosition = {
        ...position,
        [side]: position[side] - shares,
        [costKey]: Math.max(0, existingCost - costReduction),
      };
      if (newPosition.yes === 0 && newPosition.no === 0) {
        delete positions[marketId];
      } else {
        positions[marketId] = newPosition;
      }

      success = true;
      return {
        ...prev,
        markets: updatedMarkets,
        users: {
          ...prev.users,
          [currentUser.email]: { ...currentUser, balance: currentUser.balance + proceeds, positions },
        },
      };
    });
    return success;
  };

  const value = useMemo(() => {
    const user = state.currentEmail ? state.users[state.currentEmail] || null : null;
    return { state: { ...state, user }, signIn, signOut, buyShares, sellShares, purchaseCoins, getMarketPrice, createMarket, approveMarket, rejectMarket };
  }, [state]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return context;
}
