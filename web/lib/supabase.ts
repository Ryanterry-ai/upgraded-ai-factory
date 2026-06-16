import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "./env";

export function getSupabase() {
  const env = validateEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAnon() {
  const env = validateEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
