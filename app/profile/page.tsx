'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
};

export default function ProfilePage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');

  // 1) Cargar sesión y, si existe, traer/crear el perfil
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user ?? null;

      if (!mounted) return;

      if (!user) {
        setLoading(false);
        return; // no logueado -> mostramos el formulario de login de la home
      }

      setSessionEmail(user.email ?? null);
      setUserId(user.id);

      // Buscar perfil existente
      const { data, error } = await supabase
        .from('Profiles')
        .select('id, user_id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setDisplayName((data as Profile).display_name || '');
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // 2) Guardar (insert/update) el perfil
  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    if (profile?.id) {
      // update
      const { error } = await supabase
        .from('Profiles')
        .update({ display_name: displayName })
        .eq('id', profile.id);

      setLoading(false);

      if (error) {
        alert(`Error al actualizar: ${error.message}`);
        return;
      }

      router.push('/dashboard');
      return;
    }

    // insert
    const { error } = await supabase
      .from('Profiles')
      .insert({
        user_id: userId,
        display_name: displayName,
      });

    setLoading(false);

    if (error) {
      alert(`Error al crear: ${error.message}`);
      return;
    }

    router.push('/dashboard');
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
        <h1>Crear / editar mi perfil</h1>
        <p>Cargando…</p>
      </main>
    );
  }

  if (!sessionEmail) {
    // Usuario no logueado: avisamos y damos link a home para pedir magic link
    return (
      <main style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
        <h1>Crear / editar mi perfil</h1>
        <p>Primero inicia sesión desde la página principal.</p>
        <a href="/" style={{ textDecoration: 'underline' }}>Ir al inicio</a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1>Crear / editar mi perfil</h1>
      <p style={{ margin: '8px 0 24px' }}>
        Sesión iniciada como <b>{sessionEmail}</b>
      </p>

      <form onSubmit={onSave} style={{ display: 'grid', gap: 12 }}>
        <label>
          Nombre para mostrar
          <input
            type="text"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ej. Poblas"
            style={{ width: '100%', padding: 8, marginTop: 6 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            style={{ padding: '8px 12px' }}
          >
            Guardar
          </button>
          <a href="/dashboard" style={{ padding: '8px 12px', border: '1px solid #ccc' }}>
            Cancelar
          </a>
        </div>
      </form>
    </main>
  );
}
