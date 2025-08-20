'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function ProfileSetupPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/'); // No logueado -> home
        return;
      }
      setEmail(user.email ?? '');

      // Si ya tiene perfil, precarga y deja editar
      const { data: existing } = await supabase
        .from('Profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing?.display_name) setDisplayName(existing.display_name);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setErr(null);
    if (!displayName.trim()) {
      setErr('Escribe un nombre visible.');
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErr('Sesión inválida.');
      setSaving(false);
      return;
    }

    // ¿ya existe?
    const { data: existing } = await supabase
      .from('Profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('Profiles')
        .update({ display_name: displayName })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('Profiles')
        .insert({ user_id: user.id, display_name: displayName });
    }

    setSaving(false);
    router.replace('/dashboard');
  };

  if (loading) return <main style={{ padding: 24 }}>Cargando…</main>;

  return (
    <main style={{ padding: 24, maxWidth: 560 }}>
      <h1>Completa tu perfil</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Sesión iniciada como <b>{email}</b>
      </p>

      <label style={{ display: 'block', marginBottom: 8 }}>Nombre para mostrar</label>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Ej. Juan P."
        style={{ padding: 10, width: '100%', maxWidth: 420 }}
      />

      {err && <p style={{ color: 'crimson', marginTop: 10 }}>{err}</p>}

      <div style={{ marginTop: 16 }}>
        <button onClick={save} disabled={saving} style={{ padding: '10px 16px' }}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </main>
  );
}
