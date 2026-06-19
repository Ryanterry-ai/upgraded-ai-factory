import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "./env";

function getWebSocketTransport() {
  try {
    // For Node.js < 22, use ws package as WebSocket transport
    const ws = require("ws");
    return ws;
  } catch {
    return undefined; // Browser or Node.js 22+ (native WebSocket)
  }
}

export function getSupabase() {
  const env = validateEnv();
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const transport = getWebSocketTransport();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false },
    ...(transport ? { realtime: { transport } } : {}),
  });
}

export function getSupabaseAnon() {
  const env = validateEnv();
  const transport = getWebSocketTransport();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    ...(transport ? { realtime: { transport } } : {}),
  });
}
