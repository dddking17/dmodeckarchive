// 덱 목록 텍스트를 실제 Supabase seed SQL로 변환하는 1회성 스크립트.
// 실행: node scripts/generate-seed.mjs  →  supabase/seed_decks.sql 생성
//
// 사용자 UID는 실제 값을 모르는 상태로 생성하며, 생성된 SQL 맨 위 한 줄만
// 본인 UID로 바꿔 넣으면 됩니다.

import { writeFileSync } from "node:fs";

/** @type {{name: string, members: string[]}[]} */
const decks = [
  { name: "하얀 날개 : 용기의 우령도", members: ["아구몬", "그레이몬", "메탈그레이몬", "워그레이몬", "오메가몬", "오메가몬 머시풀모드"] },
  { name: "하얀 날개 : 우정의 아류류포", members: ["파피몬", "가루몬", "워가루몬", "메탈가루몬", "오메가몬", "오메가몬 머시풀모드"] },
  { name: "내가! 미래의! 디지몬 킹이다!", members: ["샤우트몬", "오메가샤우트몬", "샤우트몬X2", "샤우트몬X3", "샤우트몬X4", "샤우트몬X5", "샤우트몬DX", "샤우트몬X7", "샤우트몬X7 슈페리올모드"] },
  { name: "신의 의지", members: ["도사몬", "샤크라몬", "샤크라몬*(각성)", "쿠즈하몬", "쿠즈하몬 무녀모드"] },
  { name: "빛의 신창과 신검", members: ["길몬", "그라우몬", "메가로그라우몬", "듀크몬", "듀크몬*(각성)", "듀크몬 크림존모드*(각성)", "듀크몬 크림존모드"] },
  { name: "디지털 월드 수호자(4U)", members: ["듀크몬 크림존모드*(각성)", "오메가몬 머시풀모드", "쿠즈하몬 무녀모드", "샤우트몬X7 슈페리올모드"] },
  { name: "거짓된 네버랜드의 여신", members: ["에오스몬(성숙기)", "에오스몬(완전체)", "에오스몬(궁극체)"] },
  { name: "파멸의 칠흑룡을 저지하라", members: ["시리우스몬", "암피몬", "디어비트몬", "블룸로드몬"] },
  { name: "자연, 그리고 요정", members: ["릴리몬", "로터스몬", "로제몬", "라플레시몬", "블룸로드몬", "페어리몬"] },
  { name: "종결, 궁극의 성전!", members: ["워그레이몬*(각성)", "메탈가루몬*(각성)", "지드밀레니엄몬*(각성)"] },
  { name: "강림! 고대의 용전사", members: ["오메가몬", "황제드라몬 팔라딘모드*(각성)"] },
  { name: "디아블로몬을 저지하라!", members: ["디아블로몬", "아마게몬[합성체]", "황제드라몬 파이터모드*(각성)", "황제드라몬 팔라딘모드*(각성)"] },
  { name: "하얀 날개 : 슬픔과 결의", members: ["오메가몬 머시풀모드"] },
  { name: "어둠이 드리운 정의", members: ["쿠즈하몬 무녀모드", "블룸로드몬", "지드밀레니엄몬*(각성)", "에오스몬(궁극체)"] },
  { name: "평화를 수호하는 구원자(4U)", members: ["듀크몬 크림존모드*(각성)", "오메가몬 머시풀모드", "황제드라몬 팔라딘모드*(각성)", "샤우트몬X7 슈페리올모드"] },
  { name: "잘못된 정화의 의식", members: ["시리우스몬", "쿠즈하몬", "쿠즈하몬 무녀모드"] },
  { name: "재회", members: ["오메가몬", "알파몬 왕룡검[극의]"] },
  { name: "현실세계 침공!", members: ["아그니몬", "페어리몬", "차크몬", "알볼몬", "그로트몬", "볼프몬", "브리츠몬", "라나몬", "레베몬", "머큐레몬", "루체몬 사탄모드[극의]"] },
  { name: "라스트 에볼루션 : 인연", members: ["오메가몬", "라스트 에볼루션 : 인연", "에오스몬(궁극체)"] },
  { name: "우리들의 희망, 우리들의 빛", members: ["워그레이몬*(각성)", "메탈가루몬*(각성)", "밀레니엄몬", "지드밀레니엄몬*(각성)", "갓드라몬", "홀리드라몬"] },
  { name: "시간을 뛰어 넘어, 전설의 시작!", members: ["브리트라몬", "슈트몬", "블리자몬", "페탈드라몬", "기가스몬", "가룸몬", "볼그몬", "칼마라몬", "카이저레오몬", "세피로트몬", "스사노오몬[극의]"] },
  { name: "디지털 월드 수호자(5U)", members: ["듀크몬 크림존모드*(각성)", "오메가몬 머시풀모드", "쿠즈하몬 무녀모드", "스사노오몬[극의]", "샤우트몬X7 슈페리올모드"] },
  { name: "평화를 수호하는 구원자(5U)", members: ["듀크몬 크림존모드*(각성)", "오메가몬 머시풀모드", "황제드라몬 팔라딘모드*(각성)", "스사노오몬[극의]", "샤우트몬X7 슈페리올모드"] },
  { name: "매혹적인 날개와 정의의 날개", members: ["알파몬 왕룡검[극의]", "리리스몬X [각성]"] },
  { name: "종극의 악마", members: ["메탈그레이몬", "워가루몬", "파워드라몬", "던데블몬"] },
  { name: "이상 상태 발생 : 바이러스", members: ["듀크몬 크림존모드*(각성)", "지드밀레니엄몬*(각성)", "루체몬 사탄모드[극의]", "리리스몬X [각성]", "던데블몬"] },
  { name: "바이러스에 대항하라!", members: ["오메가몬 머시풀모드", "블룸로드몬", "황제드라몬 팔라딘모드*(각성)", "알파몬 왕룡검[극의]", "갓드라몬"] },
  { name: "거대한 파멸의 위기", members: ["세라피몬", "바이킹몬", "헤라클레스캅테리몬", "페닉스몬", "로제몬", "워그레이몬*(각성)", "메탈가루몬*(각성)", "아바도몬", "오파니몬"] },
  { name: "심연의 공포", members: ["아바도몬", "아바도몬 코어"] },
  { name: "온전한 데이터, 그리고 정체 불명의 데이터", members: ["아바도몬", "쿠즈하몬 무녀모드", "라스트 에볼루션 : 인연", "아바도몬 코어", "에오스몬(궁극체)", "샤우트몬X7 슈페리올모드"] },
  { name: "진정한 모습의 파멸자", members: ["세라피몬", "바이킹몬", "헤라클레스캅테리몬", "페닉스몬", "로제몬", "워그레이몬*(각성)", "메탈가루몬*(각성)", "오파니몬", "오메가몬", "아바도몬 코어"] },
  { name: "정의를 지키는 날개", members: ["알파몬 왕룡검*(각성)", "오메가몬X [극의]"] },
  { name: "정의를 유혹하는 날개짓", members: ["오메가몬X [극의]", "리리스몬X [각성]"] },
  { name: "무력화 시키는 자들", members: ["지드밀레니엄몬*(각성)", "알파몬 왕룡검[극의]", "루체몬 사탄모드[극의]", "오메가몬X [극의]", "홀리드라몬"] },
  { name: "라크에 진좌하는 자", members: ["퀀타몬"] },
  { name: "디지몬을 인간 세계로 보내는 존재", members: ["블룸로드몬", "퀀타몬"] },
  { name: "중립 성향의 디지몬", members: ["쿠즈하몬 무녀모드", "퀀타몬", "샤우트몬X7 슈페리올모드"] },
  { name: "광채와 함께 내려온 자", members: ["아폴로몬"] },
  { name: "절망에 맞서는 광채", members: ["아바도몬", "오메가몬 머시풀모드", "다크네스바그라몬", "루체몬 사탄모드[극의]", "스사노오몬[극의]", "아바도몬 코어", "아폴로몬"] },
];

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

function sqlArrayLiteral(names) {
  return "array[" + names.map((n) => `'${sqlEscape(n)}'`).join(", ") + "]";
}

const uniqueNames = [...new Set(decks.flatMap((d) => d.members))];

let out = "";
out += "-- 디지몬 덱 아카이브 — 보유 덱/디지몬 일괄 등록 스크립트 (자동 생성)\n";
out += "-- scripts/generate-seed.mjs 로 생성됨. 39개 덱, 고유 디지몬 " + uniqueNames.length + "종.\n";
out += "-- 공용 카탈로그이므로 UID 없이 바로 실행 가능합니다.\n";
out += "-- Supabase 대시보드 → SQL Editor 에서 전체 실행하세요.\n";
out += "-- 이미 등록된 덱/디지몬은 건드리지 않고 새 것만 추가하도록 만들어져 있어\n";
out += "-- 여러 번 실행해도 안전합니다.\n\n";
out += "do $$\n";
out += "declare\n";
out += "  v_ids uuid[];\n";
out += "begin\n\n";

out += "  -- 1) 디지몬 " + uniqueNames.length + "종 등록 (이미 있으면 건너뜀)\n";
out += "  insert into public.digimons (name)\n";
out += "  select v.name\n";
out += "  from unnest(" + sqlArrayLiteral(uniqueNames) + ") as v(name)\n";
out += "  where not exists (\n";
out += "    select 1 from public.digimons d where d.name = v.name\n";
out += "  );\n\n";

out += "  -- 2) 덱 " + decks.length + "개 등록 (전부 C티어, 설명/효과는 비워둠 — 앱에서 나중에 수정)\n";
for (const deck of decks) {
  out += "  select array_agg(d.id order by u.ord)\n";
  out += "  into v_ids\n";
  out += "  from unnest(" + sqlArrayLiteral(deck.members) + ") with ordinality as u(name, ord)\n";
  out += "  join public.digimons d on d.name = u.name;\n";
  out += "  if not exists (select 1 from public.decks where name = '" + sqlEscape(deck.name) + "') then\n";
  out += "    insert into public.decks (name, tier, description, effect, member_ids)\n";
  out += "    values ('" + sqlEscape(deck.name) + "', 'C', '', '', v_ids);\n";
  out += "  end if;\n\n";
}

out += "end $$;\n";

writeFileSync(new URL("../supabase/seed_decks.sql", import.meta.url), out, "utf-8");
console.log(`생성 완료: 덱 ${decks.length}개, 고유 디지몬 ${uniqueNames.length}종 → supabase/seed_decks.sql`);
