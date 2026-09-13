import type { SupabaseClient } from "@supabase/supabase-js";
import type { Deck, Digimon, Tier } from "./types";

/**
 * Supabase 테이블을 감싼 CRUD 헬퍼.
 * RLS 정책이 user_id 기준으로 접근을 제한하므로, 매 호출마다 user_id를 함께 넘깁니다.
 */

export async function fetchDigimons(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("digimons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Digimon[];
}

export async function fetchDecks(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Deck[];
}

export async function upsertDigimon(
  supabase: SupabaseClient,
  userId: string,
  digimon: { id?: string; name: string; owned: boolean; image_url?: string | null }
) {
  const payload: Record<string, unknown> = {
    id: digimon.id,
    user_id: userId,
    name: digimon.name,
    owned: digimon.owned,
  };
  // image_url을 명시적으로 넘기지 않으면(기존 값 유지) 컬럼을 건드리지 않습니다.
  if (digimon.image_url !== undefined) payload.image_url = digimon.image_url;

  const { data, error } = await supabase.from("digimons").upsert(payload).select().single();
  if (error) throw error;
  return data as Digimon;
}

/** 디지몬 이미지를 Supabase Storage에 업로드하고 공개 URL을 반환 */
export async function uploadDigimonImage(supabase: SupabaseClient, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("digimon-images")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from("digimon-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function setDigimonOwned(supabase: SupabaseClient, id: string, owned: boolean) {
  const { error } = await supabase.from("digimons").update({ owned }).eq("id", id);
  if (error) throw error;
}

export async function deleteDigimon(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("digimons").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertDeck(
  supabase: SupabaseClient,
  userId: string,
  deck: { id?: string; name: string; tier: Tier; description: string; effect: string; member_ids: string[] }
) {
  const { data, error } = await supabase
    .from("decks")
    .upsert({
      id: deck.id,
      user_id: userId,
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
export async function removeDigimonFromAllDecks(
  supabase: SupabaseClient,
  decks: Deck[],
  digimonId: string
) {
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
