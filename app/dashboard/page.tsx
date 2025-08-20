'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function Dashboard() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
  }, []);

  if (!email) return <p>Necesitas iniciar sesión.</p>;
  return (
    <main style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2>Dashboard</h2>
      <p>Hola, <b>{email}</b>. Aquí pondremos: crear match, confirmar, leaderboard…</p>
    </main>
  );
}
