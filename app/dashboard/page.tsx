'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function Dashboard() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setEmail(user?.email ?? null);
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();
        setName(prof?.display_name ?? null);
      }
    })();
  }, []);

  if (!email) return <p>Necesitas iniciar sesión.</p>;
  return (
    <main style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2>Dashboard</h2>
      <p>Hola, <b>{name ?? email}</b>.</p>
      <a href="/onboarding">Cambiar nombre</a>
    </main>
  );
}
