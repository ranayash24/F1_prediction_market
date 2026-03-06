export type Market = {
  id: string;
  round: string;
  name: string;
  description: string;
  category: string;
  yesShares: number;
  noShares: number;
  volume: number;
};

export type Position = {
  yes: number;
  no: number;
  yesCost: number;
  noCost: number;
};

export type User = {
  name: string;
  email: string;
  provider: string;
  balance: number;
  positions: Record<string, Position>;
};
