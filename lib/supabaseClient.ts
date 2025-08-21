'use client';
import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(url, anon, {
    auth: {
      persistSession: true,        // guarda la sesión en localStorage
      autoRefreshToken: true,      // refresca el token antes de expirar
      detectSessionInUrl: true,    // procesa el ?code= de los magic links
    },
  });
}
