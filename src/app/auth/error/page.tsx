export default function AuthErrorPage() {
  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: "0 20px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>로그인에 실패했어요</h1>
      <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
        구글 로그인 과정에서 문제가 발생했습니다. Supabase의 Google 로그인 설정(리디렉션 URL, 클라이언트 ID/보안 비밀번호)을 확인한 뒤 다시 시도해 주세요.
      </p>
      <a href="/" style={{ display: "inline-block", marginTop: 20, color: "#ff6a3d", fontWeight: 700 }}>홈으로 돌아가기</a>
    </main>
  );
}
