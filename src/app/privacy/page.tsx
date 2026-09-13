export const metadata = { title: "개인정보처리방침 — 디지몬 덱 아카이브" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px", lineHeight: 1.7, fontSize: 14, color: "#1a2130" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>개인정보처리방침</h1>
      <p style={{ color: "#5b6478", marginBottom: 32 }}>최종 수정일: 2026년 9월</p>

      <h2 style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>1. 수집하는 정보</h2>
      <p>디지몬 덱 아카이브(이하 "서비스")는 구글 로그인을 통해 아래 정보만 수집합니다.</p>
      <ul>
        <li>구글 계정의 이름, 이메일 주소, 프로필 사진</li>
        <li>서비스 이용 중 사용자가 직접 입력한 정보 (보유 디지몬 체크 여부)</li>
      </ul>
      <p>비밀번호, 결제 정보 등은 전혀 수집하지 않으며, 수집할 방법도 없습니다 (구글 로그인은 비밀번호를 서비스에 전달하지 않습니다).</p>

      <h2 style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>2. 정보 이용 목적</h2>
      <ul>
        <li>로그인한 사용자 식별 및 세션 유지</li>
        <li>사용자별 "보유 디지몬" 상태 저장 및 여러 기기 간 동기화</li>
        <li>화면에 사용자 이름/프로필 사진 표시</li>
      </ul>

      <h2 style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>3. 정보 저장 및 제3자 제공</h2>
      <p>수집된 정보는 Supabase(데이터베이스 서비스)에 저장되며, 광고, 마케팅, 통계 목적으로 제3자에게 판매하거나 제공하지 않습니다. 덱/디지몬 카탈로그 정보는 모든 로그인 사용자에게 공통으로 표시되지만, "보유 디지몬" 여부는 본인만 조회·수정할 수 있습니다.</p>

      <h2 style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>4. 정보 보관 및 삭제</h2>
      <p>계정 정보 삭제를 원하시면 아래 문의처로 연락해 주세요. 요청 확인 후 관련 데이터를 삭제해 드립니다.</p>

      <h2 style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>5. 문의</h2>
      <p>본 서비스는 개인이 운영하는 비상업적 팬 프로젝트입니다. 문의사항은 서비스 관리자에게 연락해 주세요.</p>
    </main>
  );
}
