import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateEnv } from "@/lib/env";

export async function getSession() {
  const env = validateEnv();
  const cookieStore = cookies();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  return supabase.auth.getSession();
}

export async function getUser() {
  const { data: { session } } = await getSession();
  return session?.user ?? null;
}
