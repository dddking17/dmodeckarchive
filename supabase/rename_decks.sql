-- 덱 이름 표기 변경: "이름 4U" → "이름(4U)" 형식으로 통일
-- 공용 카탈로그이므로 UID 없이 바로 실행 가능합니다.

update public.decks set name = '디지털 월드 수호자(4U)' where name = '디지털 월드 수호자 4U';
update public.decks set name = '디지털 월드 수호자(5U)' where name = '디지털 월드 수호자 5U';
update public.decks set name = '평화를 수호하는 구원자(4U)' where name = '평화를 수호하는 구원자 4U';
update public.decks set name = '평화를 수호하는 구원자(5U)' where name = '평화를 수호하는 구원자 5U';
