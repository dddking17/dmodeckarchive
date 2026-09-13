-- 디지몬 덱 아카이브 — 보유 덱/디지몬 일괄 등록 스크립트 (자동 생성)
-- scripts/generate-seed.mjs 로 생성됨. 39개 덱, 고유 디지몬 91종.
-- 공용 카탈로그이므로 UID 없이 바로 실행 가능합니다.
-- Supabase 대시보드 → SQL Editor 에서 전체 실행하세요.
-- 이미 등록된 덱/디지몬은 건드리지 않고 새 것만 추가하도록 만들어져 있어
-- 여러 번 실행해도 안전합니다.

do $$
declare
  v_ids uuid[];
begin

  -- 1) 디지몬 91종 등록 (이미 있으면 건너뜀)
  insert into public.digimons (name)
  select v.name
  from unnest(array['아구몬', '그레이몬', '메탈그레이몬', '워그레이몬', '오메가몬', '오메가몬 머시풀모드', '파피몬', '가루몬', '워가루몬', '메탈가루몬', '샤우트몬', '오메가샤우트몬', '샤우트몬X2', '샤우트몬X3', '샤우트몬X4', '샤우트몬X5', '샤우트몬DX', '샤우트몬X7', '샤우트몬X7 슈페리올모드', '도사몬', '샤크라몬', '샤크라몬*(각성)', '쿠즈하몬', '쿠즈하몬 무녀모드', '길몬', '그라우몬', '메가로그라우몬', '듀크몬', '듀크몬*(각성)', '듀크몬 크림존모드*(각성)', '듀크몬 크림존모드', '에오스몬(성숙기)', '에오스몬(완전체)', '에오스몬(궁극체)', '시리우스몬', '암피몬', '디어비트몬', '블룸로드몬', '릴리몬', '로터스몬', '로제몬', '라플레시몬', '페어리몬', '워그레이몬*(각성)', '메탈가루몬*(각성)', '지드밀레니엄몬*(각성)', '황제드라몬 팔라딘모드*(각성)', '디아블로몬', '아마게몬[합성체]', '황제드라몬 파이터모드*(각성)', '알파몬 왕룡검[극의]', '아그니몬', '차크몬', '알볼몬', '그로트몬', '볼프몬', '브리츠몬', '라나몬', '레베몬', '머큐레몬', '루체몬 사탄모드[극의]', '라스트 에볼루션 : 인연', '밀레니엄몬', '갓드라몬', '홀리드라몬', '브리트라몬', '슈트몬', '블리자몬', '페탈드라몬', '기가스몬', '가룸몬', '볼그몬', '칼마라몬', '카이저레오몬', '세피로트몬', '스사노오몬[극의]', '리리스몬X [각성]', '파워드라몬', '던데블몬', '세라피몬', '바이킹몬', '헤라클레스캅테리몬', '페닉스몬', '아바도몬', '오파니몬', '아바도몬 코어', '알파몬 왕룡검*(각성)', '오메가몬X [극의]', '퀀타몬', '아폴로몬', '다크네스바그라몬']) as v(name)
  where not exists (
    select 1 from public.digimons d where d.name = v.name
  );

  -- 2) 덱 39개 등록 (전부 C티어, 설명/효과는 비워둠 — 앱에서 나중에 수정)
  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['아구몬', '그레이몬', '메탈그레이몬', '워그레이몬', '오메가몬', '오메가몬 머시풀모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '하얀 날개 : 용기의 우령도') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('하얀 날개 : 용기의 우령도', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['파피몬', '가루몬', '워가루몬', '메탈가루몬', '오메가몬', '오메가몬 머시풀모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '하얀 날개 : 우정의 아류류포') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('하얀 날개 : 우정의 아류류포', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['샤우트몬', '오메가샤우트몬', '샤우트몬X2', '샤우트몬X3', '샤우트몬X4', '샤우트몬X5', '샤우트몬DX', '샤우트몬X7', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '내가! 미래의! 디지몬 킹이다!') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('내가! 미래의! 디지몬 킹이다!', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['도사몬', '샤크라몬', '샤크라몬*(각성)', '쿠즈하몬', '쿠즈하몬 무녀모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '신의 의지') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('신의 의지', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['길몬', '그라우몬', '메가로그라우몬', '듀크몬', '듀크몬*(각성)', '듀크몬 크림존모드*(각성)', '듀크몬 크림존모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '빛의 신창과 신검') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('빛의 신창과 신검', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['듀크몬 크림존모드*(각성)', '오메가몬 머시풀모드', '쿠즈하몬 무녀모드', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '디지털 월드 수호자 4U') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('디지털 월드 수호자 4U', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['에오스몬(성숙기)', '에오스몬(완전체)', '에오스몬(궁극체)']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '거짓된 네버랜드의 여신') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('거짓된 네버랜드의 여신', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['시리우스몬', '암피몬', '디어비트몬', '블룸로드몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '파멸의 칠흑룡을 저지하라') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('파멸의 칠흑룡을 저지하라', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['릴리몬', '로터스몬', '로제몬', '라플레시몬', '블룸로드몬', '페어리몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '자연, 그리고 요정') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('자연, 그리고 요정', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['워그레이몬*(각성)', '메탈가루몬*(각성)', '지드밀레니엄몬*(각성)']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '종결, 궁극의 성전!') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('종결, 궁극의 성전!', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['오메가몬', '황제드라몬 팔라딘모드*(각성)']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '강림! 고대의 용전사') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('강림! 고대의 용전사', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['디아블로몬', '아마게몬[합성체]', '황제드라몬 파이터모드*(각성)', '황제드라몬 팔라딘모드*(각성)']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '디아블로몬을 저지하라!') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('디아블로몬을 저지하라!', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['오메가몬 머시풀모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '하얀 날개 : 슬픔과 결의') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('하얀 날개 : 슬픔과 결의', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['쿠즈하몬 무녀모드', '블룸로드몬', '지드밀레니엄몬*(각성)', '에오스몬(궁극체)']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '어둠이 드리운 정의') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('어둠이 드리운 정의', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['듀크몬 크림존모드*(각성)', '오메가몬 머시풀모드', '황제드라몬 팔라딘모드*(각성)', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '평화를 수호하는 구원자 4U') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('평화를 수호하는 구원자 4U', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['시리우스몬', '쿠즈하몬', '쿠즈하몬 무녀모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '잘못된 정화의 의식') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('잘못된 정화의 의식', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['오메가몬', '알파몬 왕룡검[극의]']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '재회') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('재회', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['아그니몬', '페어리몬', '차크몬', '알볼몬', '그로트몬', '볼프몬', '브리츠몬', '라나몬', '레베몬', '머큐레몬', '루체몬 사탄모드[극의]']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '현실세계 침공!') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('현실세계 침공!', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['오메가몬', '라스트 에볼루션 : 인연', '에오스몬(궁극체)']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '라스트 에볼루션 : 인연') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('라스트 에볼루션 : 인연', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['워그레이몬*(각성)', '메탈가루몬*(각성)', '밀레니엄몬', '지드밀레니엄몬*(각성)', '갓드라몬', '홀리드라몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '우리들의 희망, 우리들의 빛') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('우리들의 희망, 우리들의 빛', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['브리트라몬', '슈트몬', '블리자몬', '페탈드라몬', '기가스몬', '가룸몬', '볼그몬', '칼마라몬', '카이저레오몬', '세피로트몬', '스사노오몬[극의]']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '시간을 뛰어 넘어, 전설의 시작!') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('시간을 뛰어 넘어, 전설의 시작!', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['듀크몬 크림존모드*(각성)', '오메가몬 머시풀모드', '쿠즈하몬 무녀모드', '스사노오몬[극의]', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '디지털 월드 수호자 5U') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('디지털 월드 수호자 5U', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['듀크몬 크림존모드*(각성)', '오메가몬 머시풀모드', '황제드라몬 팔라딘모드*(각성)', '스사노오몬[극의]', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '평화를 수호하는 구원자 5U') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('평화를 수호하는 구원자 5U', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['알파몬 왕룡검[극의]', '리리스몬X [각성]']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '매혹적인 날개와 정의의 날개') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('매혹적인 날개와 정의의 날개', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['메탈그레이몬', '워가루몬', '파워드라몬', '던데블몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '종극의 악마') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('종극의 악마', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['듀크몬 크림존모드*(각성)', '지드밀레니엄몬*(각성)', '루체몬 사탄모드[극의]', '리리스몬X [각성]', '던데블몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '이상 상태 발생 : 바이러스') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('이상 상태 발생 : 바이러스', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['오메가몬 머시풀모드', '블룸로드몬', '황제드라몬 팔라딘모드*(각성)', '알파몬 왕룡검[극의]', '갓드라몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '바이러스에 대항하라!') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('바이러스에 대항하라!', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['세라피몬', '바이킹몬', '헤라클레스캅테리몬', '페닉스몬', '로제몬', '워그레이몬*(각성)', '메탈가루몬*(각성)', '아바도몬', '오파니몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '거대한 파멸의 위기') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('거대한 파멸의 위기', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['아바도몬', '아바도몬 코어']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '심연의 공포') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('심연의 공포', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['아바도몬', '쿠즈하몬 무녀모드', '라스트 에볼루션 : 인연', '아바도몬 코어', '에오스몬(궁극체)', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '온전한 데이터, 그리고 정체 불명의 데이터') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('온전한 데이터, 그리고 정체 불명의 데이터', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['세라피몬', '바이킹몬', '헤라클레스캅테리몬', '페닉스몬', '로제몬', '워그레이몬*(각성)', '메탈가루몬*(각성)', '오파니몬', '오메가몬', '아바도몬 코어']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '진정한 모습의 파멸자') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('진정한 모습의 파멸자', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['알파몬 왕룡검*(각성)', '오메가몬X [극의]']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '정의를 지키는 날개') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('정의를 지키는 날개', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['오메가몬X [극의]', '리리스몬X [각성]']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '정의를 유혹하는 날개짓') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('정의를 유혹하는 날개짓', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['지드밀레니엄몬*(각성)', '알파몬 왕룡검[극의]', '루체몬 사탄모드[극의]', '오메가몬X [극의]', '홀리드라몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '무력화 시키는 자들') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('무력화 시키는 자들', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['퀀타몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '라크에 진좌하는 자') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('라크에 진좌하는 자', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['블룸로드몬', '퀀타몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '디지몬을 인간 세계로 보내는 존재') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('디지몬을 인간 세계로 보내는 존재', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['쿠즈하몬 무녀모드', '퀀타몬', '샤우트몬X7 슈페리올모드']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '중립 성향의 디지몬') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('중립 성향의 디지몬', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['아폴로몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '광채와 함께 내려온 자') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('광채와 함께 내려온 자', 'C', '', '', v_ids);
  end if;

  select array_agg(d.id order by u.ord)
  into v_ids
  from unnest(array['아바도몬', '오메가몬 머시풀모드', '다크네스바그라몬', '루체몬 사탄모드[극의]', '스사노오몬[극의]', '아바도몬 코어', '아폴로몬']) with ordinality as u(name, ord)
  join public.digimons d on d.name = u.name;
  if not exists (select 1 from public.decks where name = '절망에 맞서는 광채') then
    insert into public.decks (name, tier, description, effect, member_ids)
    values ('절망에 맞서는 광채', 'C', '', '', v_ids);
  end if;

end $$;
