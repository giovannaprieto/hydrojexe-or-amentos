import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso em Client Components ("use client").
 * Usa a anon key pública (NEXT_PUBLIC_*).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
