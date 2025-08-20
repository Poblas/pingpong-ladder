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
      // Intercambia el code del magic link por una sesión
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );
      if (error) {
        setMsg(`Error: ${error.message}`);
        setTimeout(() => router.replace('/'), 1200);
        return;
      }

      const uid = data.session?.user?.id;
      if (!uid) {
        setMsg('No se encontró la sesión.');
        setTimeout(() => router.replace('/'), 1200);
        return;
      }

      // Asegurar que exista fila en Profiles
      const { data: profile, error: selErr } = await supabase
        .from('Profiles') // usa exactamente el mismo nombre de tu tabla
        .select('user_id, display_name')
        .eq('user_id', uid)
        .maybeSingle();

      if (!profile) {
        await supabase.from('Profiles').insert({ user_id: uid, display_name: null });
      }

      setMsg('¡Listo! Iniciaste sesión.');

      const hasName = !!profile?.display_name;
      setTimeout(
        () => router.replace(hasName ? '/dashboard' : '/onboarding'),
        700
      );
    })();
  }, []);

  return <p style={{ padding: 24 }}>{msg}</p>;
}

