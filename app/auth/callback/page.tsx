'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function Callback() {
  const supabase = getSupabaseClient();
  const [msg, setMsg] = useState('Procesando login...');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 0) Revisa si viene algún error en la URL (link expirado, etc.)
        const url = new URL(window.location.href);
        const err = url.searchParams.get('error') || url.searchParams.get('error_code');
        if (err) {
          setMsg(`Error en el enlace: ${err}`);
          setTimeout(() => !cancelled && router.replace('/'), 1500);
          return;
        }

        // 1) Intercambia el code por sesión
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          setMsg(`Error: ${error.message}`);
          setTimeout(() => !cancelled && router.replace('/'), 1500);
          return;
        }

        // 2) Verifica que la sesión quedó realmente almacenada
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id;
        if (!uid) {
          setMsg('No se encontró la sesión después del intercambio.');
          setTimeout(() => !cancelled && router.replace('/'), 1500);
          return;
        }

        // 3) Asegura fila en Profiles
        const { data: profile } = await supabase
          .from('Profiles')
          .select('user_id, display_name')
          .eq('user_id', uid)
          .maybeSingle();

        if (!profile) {
          await supabase.from('Profiles').insert({ user_id: uid, display_name: null });
        }

        setMsg('¡Listo! Iniciaste sesión.');

        const hasName = !!profile?.display_name;

        // 4) Hard redirect (evita rarezas de navegación donde la cookie aún no está lista)
        setTimeout(() => {
          window.location.replace(hasName ? '/dashboard' : '/onboarding');
        }, 700);
      } catch (e: any) {
        setMsg(`Error inesperado: ${e?.message ?? 'desconocido'}`);
        setTimeout(() => !cancelled && router.replace('/'), 1500);
      }
    })();

    return () => { cancelled = true; };
  }, [router, supabase]);

  return <p style={{ padding: 24 }}>{msg}</p>;
}
