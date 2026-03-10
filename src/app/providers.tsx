"use client";

import { MarketProvider } from "@/lib/market-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <MarketProvider>{children}</MarketProvider>;
}
