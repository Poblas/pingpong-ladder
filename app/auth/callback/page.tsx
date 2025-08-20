'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Callback() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [msg, setMsg] = useState('Verificando enlace...');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) setMsg(`Error: ${error.message}`);
      else setMsg('¡Listo! Iniciaste sesión.');
      setTimeout(() => router.replace('/'), 800);
    })();
  }, []);

  return <p>{msg}</p>;
}
