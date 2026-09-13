export type Tier = "S" | "A" | "B" | "C" | "D";

/** 디지몬 카탈로그 항목 — 모든 사용자에게 공통 (보유 여부는 별도 테이블) */
export type Digimon = {
  id: string;
  name: string;
  image_url: string | null;
  is_u_grade: boolean;
  created_at: string;
};

/** 화면에서 쓰는, 보유 여부가 합쳐진 형태 */
export type DigimonWithOwnership = Digimon & { owned: boolean };

/** 덱 카탈로그 항목 — 모든 사용자에게 공통 */
export type Deck = {
  id: string;
  name: string;
  tier: Tier;
  description: string;
  effect: string;
  member_ids: string[];
  created_at: string;
};

export type DeckStatus = {
  owned: number;
  total: number;
  ready: boolean;
  percent: number;
};
