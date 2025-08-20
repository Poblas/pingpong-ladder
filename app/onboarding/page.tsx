'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../lib/supabaseClient';

export default function Onboarding() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) { router.replace('/'); return; }
      setEmail(u.email ?? null);
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', u.id)
        .maybeSingle();
      if (!error && prof?.display_name) {
        router.replace('/dashboard');
      } else {
        setChecking(false);
      }
    })();
  }, []);

  async function save() {
    setError(null);
    const name = displayName.trim();
    if (name.length < 3) { setError('Elige un nombre de al menos 3 caracteres.'); return; }

    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) { setError('Sesión no encontrada'); setSaving(false); return; }

    const { data: clash } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('display_name', name)
      .maybeSingle();
    if (clash) { setError('Ese nombre ya está en uso.'); setSaving(false); return; }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('user_id', uid);

    setSaving(false);
    if (error) setError(error.message);
    else router.replace('/dashboard');
  }

  if (checking) return <p>Cargando…</p>;

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 12 }}>
      <h1>Elige tu nombre de jugador</h1>
      <p>Correo: <b>{email}</b></p>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Ej. JuanPong"
        style={{ padding: 8 }}
      />
      <button onClick={save} disabled={saving} style={{ padding: 8 }}>
        {saving ? 'Guardando…' : 'Guardar y continuar'}
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <small>Podrás cambiarlo después en tu perfil.</small>
    </main>
  );
}
