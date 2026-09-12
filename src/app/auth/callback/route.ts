import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 구글 로그인 완료 후 Supabase가 이 경로로 되돌려보냅니다.
// 전달받은 code를 실제 로그인 세션으로 교환한 뒤 홈으로 리다이렉트합니다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
