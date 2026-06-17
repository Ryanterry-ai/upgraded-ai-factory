import { createBrowserClient } from "@supabase/ssr";
import { validateEnv } from "@/lib/env";

export function createClient() {
  const env = validateEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
