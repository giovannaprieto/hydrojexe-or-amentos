import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
 * Lê/grava a sessão nos cookies da request. `cookies()` é assíncrono no Next 15+.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de dentro de um Server Component: ignorável quando a
            // renovação de sessão é feita em middleware (a ser adicionado na etapa de login).
          }
        },
      },
    },
  );
}
