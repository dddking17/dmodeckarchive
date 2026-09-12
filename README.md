# 디지몬 덱 아카이브 (웹앱 버전)

구글 로그인으로 내 덱/보유 디지몬 목록을 저장하고, 어떤 기기에서 열어도 같은 데이터를 보는 버전입니다.
아래 순서대로 딱 한 번만 설정하면 이후로는 계속 무료로 쓸 수 있습니다.

---

## 0. 준비물 설치 (한 번만)

1. **Node.js 설치**: https://nodejs.org 에서 **LTS 버전**을 내려받아 설치하세요. (설치 후 컴퓨터를 재시작하면 더 안전합니다)
2. 설치가 끝나면 터미널에서 확인:
   ```bash
   node -v
   npm -v
   ```
   버전 번호가 뜨면 성공입니다.

---

## 1. 이 프로젝트 의존성 설치

이 폴더(`Deck`)에서:

```bash
npm install
```

---

## 2. Supabase 프로젝트 만들기 (데이터베이스 + 로그인)

1. https://supabase.com 접속 → 회원가입(무료) → **New project** 생성
   - 이름은 자유롭게 (예: `digimon-deck-archive`)
   - 데이터베이스 비밀번호는 안전한 곳에 따로 저장해 두세요
2. 프로젝트가 생성되면 왼쪽 메뉴 **SQL Editor** 클릭
3. 이 프로젝트의 [`supabase/schema.sql`](supabase/schema.sql) 파일을 열어 **전체 내용을 복사** → SQL Editor에 붙여넣기 → **Run** 실행
   - 이 SQL이 `digimons`, `decks` 테이블과 "본인 데이터만 보고 수정 가능" 규칙(RLS), 실시간 동기화 설정을 모두 만들어 줍니다.
4. 왼쪽 메뉴 **Project Settings → API**로 이동해서 다음 두 값을 복사해 둡니다 (곧 사용합니다):
   - `Project URL`
   - `anon public` 키

---

## 3. 구글 로그인 연동

### 3-1. Google Cloud Console에서 OAuth 클라이언트 만들기
1. https://console.cloud.google.com/apis/credentials 접속 (구글 계정 로그인)
2. 새 프로젝트를 만들거나 기존 프로젝트 선택
3. **사용자 인증 정보 만들기 → OAuth 클라이언트 ID** 클릭
   - 아직 "OAuth 동의 화면"을 설정한 적이 없다면 먼저 설정하라는 안내가 나옵니다. User Type은 **외부(External)**로, 앱 이름/이메일 등 필수 항목만 채우고 저장하면 됩니다.
4. 애플리케이션 유형: **웹 애플리케이션**
5. **승인된 리디렉션 URI**에 아래 주소를 추가 (Supabase Project URL의 `xxxx` 부분을 실제 값으로 교체):
   ```
   https://xxxx.supabase.co/auth/v1/callback
   ```
6. 생성 후 나오는 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사해 둡니다.

### 3-2. Supabase에 구글 로그인 연결하기
1. Supabase 대시보드 → **Authentication → Providers → Google**
2. 토글을 켜고, 방금 복사한 **Client ID**, **Client Secret**을 붙여넣기 → 저장
3. **Authentication → URL Configuration**에서:
   - `Site URL`: 나중에 배포할 주소 (일단 `http://localhost:3000` 로 두고 배포 후 수정 가능)
   - `Redirect URLs`에 다음 두 줄 추가:
     ```
     http://localhost:3000/auth/callback
     https://<배포될 도메인>/auth/callback
     ```
     (배포 도메인은 4단계에서 Vercel이 만들어준 뒤 다시 와서 채워도 됩니다)

---

## 4. 환경 변수 설정

이 폴더에 있는 `.env.local.example`을 복사해서 `.env.local` 파일을 만들고, 2단계에서 복사해 둔 값을 채워 넣으세요.

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=여기에 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에 anon public 키
```

`.env.local`은 `.gitignore`에 포함되어 있어 깃허브에는 올라가지 않습니다 (안전).

---

## 5. 로컬에서 실행해보기

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속 → "구글로 로그인" 버튼이 보이면 성공입니다.

---

## 6. 배포하기 (Vercel)

1. 이 프로젝트를 GitHub 저장소에 올리기 (README 요청 시 git 명령도 도와드릴 수 있습니다)
2. https://vercel.com 가입(무료) → **Add New → Project** → 방금 만든 GitHub 저장소 선택
3. **Environment Variables**에 4단계와 동일한 두 값(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) 입력
4. **Deploy** 클릭 → 몇 분 뒤 `https://프로젝트이름.vercel.app` 주소 발급
5. 다시 Supabase **Authentication → URL Configuration**으로 돌아가서:
   - `Site URL`을 실제 배포 주소로 변경
   - `Redirect URLs`에 `https://프로젝트이름.vercel.app/auth/callback` 추가
6. Google Cloud Console의 **승인된 리디렉션 URI**는 이미 Supabase 콜백 주소 하나만 있으면 되므로 추가 작업은 필요 없습니다.

---

## 이후 사용

- 커뮤니티에 `https://프로젝트이름.vercel.app` 링크만 공유하면, 각자 자기 구글 계정으로 로그인해서 자신만의 덱/디지몬 목록을 관리합니다.
- 한 사람이 폰에서 만든 덱이 PC에서 열어도 실시간으로 그대로 보입니다.
- 비용: Vercel + Supabase 모두 무료 플랜 범위 안에서는 0원입니다 (자세한 한도는 대화 중 안내받은 내용 참고).
