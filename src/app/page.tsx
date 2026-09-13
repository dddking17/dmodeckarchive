import { createClient } from "@/lib/supabase/server";
import DeckApp from "@/components/DeckApp";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "";
  const userAvatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  return (
    <DeckApp
      userId={user?.id ?? null}
      userName={userName}
      userEmail={user?.email ?? ""}
      userAvatarUrl={userAvatarUrl}
    />
  );
}
