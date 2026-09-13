import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deck, Digimon, Tier } from "./types";

/**
 * Supabase 테이블을 감싼 CRUD 헬퍼.
 * digimons/decks는 모든 로그인 사용자에게 공통인 "카탈로그"이며, 카탈로그를
 * 추가/수정/삭제하는 건 RLS 정책상 관리자 계정만 가능합니다(일반 사용자가 호출하면
 * 실패합니다). 보유 여부(user_digimon_ownership)만 사용자마다 따로 저장됩니다.
 */

export async function fetchDigimons(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("digimons").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Digimon[];
}

export async function fetchDecks(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("decks").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Deck[];
}

/** 로그인한 사용자의 보유 여부만 모아 Map(digimon_id -> owned)으로 반환 */
export async function fetchOwnership(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_digimon_ownership")
    .select("digimon_id, owned")
    .eq("user_id", userId);
  if (error) throw error;
  const map: Record<string, boolean> = {};
  for (const row of data ?? []) {
    map[row.digimon_id as string] = row.owned as boolean;
  }
  return map;
}

export async function setDigimonOwned(supabase: SupabaseClient, userId: string, digimonId: string, owned: boolean) {
  const { error } = await supabase
    .from("user_digimon_ownership")
    .upsert({ user_id: userId, digimon_id: digimonId, owned, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** 카탈로그 등록/수정 — 관리자만 성공합니다 */
export async function upsertDigimon(
  supabase: SupabaseClient,
  digimon: { id?: string; name: string; image_url?: string | null; is_u_grade?: boolean }
) {
  const payload: Record<string, unknown> = { id: digimon.id, name: digimon.name };
  if (digimon.image_url !== undefined) payload.image_url = digimon.image_url;
  if (digimon.is_u_grade !== undefined) payload.is_u_grade = digimon.is_u_grade;

  const { data, error } = await supabase.from("digimons").upsert(payload).select().single();
  if (error) throw error;
  return data as Digimon;
}

/** 디지몬 이미지를 Supabase Storage에 업로드하고 공개 URL을 반환 (관리자만 성공) */
export async function uploadDigimonImage(supabase: SupabaseClient, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `catalog/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("digimon-images")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("digimon-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteDigimon(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("digimons").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertDeck(
  supabase: SupabaseClient,
  deck: { id?: string; name: string; tier: Tier; description: string; effect: string; member_ids: string[] }
) {
  const { data, error } = await supabase
    .from("decks")
    .upsert({
      id: deck.id,
      name: deck.name,
      tier: deck.tier,
      description: deck.description,
      effect: deck.effect,
      member_ids: deck.member_ids,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Deck;
}

export async function deleteDeck(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw error;
}

/** 디지몬 삭제 시 그 디지몬을 참조하던 모든 덱의 member_ids에서 제거 */
export async function removeDigimonFromAllDecks(supabase: SupabaseClient, decks: Deck[], digimonId: string) {
  const affected = decks.filter((d) => d.member_ids.includes(digimonId));
  await Promise.all(
    affected.map((d) =>
      supabase
        .from("decks")
        .update({ member_ids: d.member_ids.filter((id) => id !== digimonId) })
        .eq("id", d.id)
    )
  );
}
