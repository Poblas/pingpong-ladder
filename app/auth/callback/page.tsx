'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function Callback() {
  const supabase = getSupabaseClient();
  const [msg, setMsg] = useState('Procesando login...');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // 1. Intercambiar el code por una sesión
      const { data, error } = await supabase.auth.exchangeCodeForSession({
        redirectTo: window.location.href
      });

      if (error) {
        setMsg(`Error: ${error.message}`);
        setTimeout(() => router.replace('/'), 1500);
        return;
      }

      const uid = data.session?.user?.id;
      if (!uid) {
        setMsg('No se encontró la sesión.');
        setTimeout(() => router.replace('/'), 1500);
        return;
      }

      // 2. Verificar que exista perfil
      const { data: profile } = await supabase
        .from('Profiles')
        .select('user_id, display_name')
        .eq('user_id', uid)
        .maybeSingle();

      if (!profile) {
        await supabase.from('Profiles').insert({
          user_id: uid,
          display_name: null
        });
      }

      setMsg('¡Listo! Iniciaste sesión.');

      const hasName = !!profile?.display_name;
      setTimeout(() => {
        router.replace(hasName ? '/dashboard' : '/onboarding');
      }, 1000);
    })();
  }, [router, supabase]);

  return <p style={{ padding: 24 }}>{msg}</p>;
}
