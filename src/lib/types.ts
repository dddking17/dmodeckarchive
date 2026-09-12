export type Tier = "S" | "A" | "B" | "C" | "D";

export type Digimon = {
  id: string;
  user_id: string;
  name: string;
  owned: boolean;
  created_at: string;
};

export type Deck = {
  id: string;
  user_id: string;
  name: string;
  tier: Tier;
  effect: string;
  member_ids: string[];
  created_at: string;
};

export type DeckStatus = {
  owned: number;
  total: number;
  ready: boolean;
};
