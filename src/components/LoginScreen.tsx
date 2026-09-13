"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginScreen() {
  const supabase = createClient();

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand-mark" style={{ width: 56, height: 56, fontSize: 28, margin: "0 auto 18px" }} aria-hidden>
          👾
        </div>
        <h1>디지몬 덱 아카이브</h1>
        <p className="login-lead">
          디지몬 마스터즈의 전체 덱 목록을 정리해서 보여주는 팬 제작 참고 도구입니다.
          39개 덱의 구성 디지몬, 설명, 발동 효과를 누구나 무료로 열람할 수 있어요.
        </p>

        <ul className="feature-list">
          <li>전체 덱 목록과 구성 디지몬, 발동 효과를 한눈에 확인</li>
          <li>로그인하면 내가 보유한 디지몬을 체크해서 편성 가능한 덱을 바로 확인</li>
          <li>보유 여부는 계정별로 저장되어 어떤 기기에서 열어도 동일하게 유지</li>
        </ul>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <GoogleIcon />
          구글로 로그인하고 내 보유 디지몬 체크하기
        </button>
        <p className="login-note">로그인은 "내가 보유한 디지몬"을 저장하기 위한 용도로만 사용되며, 비밀번호 등 민감한 정보는 수집하지 않습니다.</p>
      </div>

      <footer className="login-footer">
        <span>개인이 운영하는 비상업적 팬 프로젝트입니다.</span>
        <a href="/privacy">개인정보처리방침</a>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
