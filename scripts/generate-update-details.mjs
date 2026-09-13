// deck-details.json의 설명/효과를 이미 등록된 덱에 채워 넣는 UPDATE SQL 생성.
// 실행: node scripts/generate-update-details.mjs → supabase/update_deck_details.sql 생성

import { readFileSync, writeFileSync } from "node:fs";

const { decks } = JSON.parse(readFileSync(new URL("./deck-details.json", import.meta.url), "utf-8"));

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

let out = "";
out += "-- 덱 설명/효과 일괄 업데이트 (자동 생성, deck-details.json 기준)\n";
out += "-- 공용 카탈로그이므로 UID 없이 바로 실행 가능합니다.\n\n";

for (const deck of decks) {
  out += "update public.decks set\n";
  out += "  description = '" + sqlEscape(deck.description) + "',\n";
  out += "  effect = '" + sqlEscape(deck.effect) + "'\n";
  out += "where name = '" + sqlEscape(deck.name) + "';\n\n";
}

writeFileSync(new URL("../supabase/update_deck_details.sql", import.meta.url), out, "utf-8");
console.log(`생성 완료: 덱 ${decks.length}개 → supabase/update_deck_details.sql`);
