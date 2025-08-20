'use client';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function Home() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setUserEmail(sess?.user?.email ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Enviando enlace...');
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });
    setStatus(error ? `Error: ${error.message}` : 'Revisa tu correo y abre el enlace.');
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1>PingPong Ladder</h1>
      {!userEmail ? (
        <form onSubmit={sendMagicLink} style={{ display: 'grid', gap: 12 }}>
          <label>
            Tu email:
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@escuela.mx"
              style={{ width: '100%', padding: 8 }}
            />
          </label>
          <button type="submit" style={{ padding: '8px 12px' }}>Enviar magic link</button>
          <p>{status}</p>
        </form>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <p>Sesión iniciada como <b>{userEmail}</b></p>
          <a href="/dashboard">Ir al dashboard</a>
          <button onClick={signOut} style={{ width: 140, padding: 8 }}>Salir</button>
        </div>
      )}
    </main>
  );
}
