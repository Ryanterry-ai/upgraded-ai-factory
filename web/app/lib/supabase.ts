import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "./env";

export function getSupabase() {
  const env = validateEnv();
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAnon() {
  const env = validateEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
