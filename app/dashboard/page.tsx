'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Row = {
  profile_id: string;
  display_name: string;
  rating: number;
  games_played: number;
  last_match_at: string | null;
};

export default function Dashboard() {
  const supabase = getSupabaseClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Quien está logueado (solo para mostrar su email arriba)
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);

      // Trae el ranking desde la vista Leaderboard
      setLoading(true);
      const { data, error } = await supabase
        .from('Leaderboard')
        .select('*')
        .order('rating', { ascending: false })
        .limit(100);

      if (!error && data) setRows(data as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 8 }}>🏓 Ranking de Jugadores</h1>

      {/* Barra de acciones */}
      <div style={{ display: 'flex', gap: 12, margin: '12px 0 20px' }}>
        <Link href="/profile-setup">
          <button style={{ padding: '8px 12px' }}>Crear / editar mi perfil</button>
        </Link>
        <Link href="/new-match">
          <button style={{ padding: '8px 12px' }}>Registrar partido</button>
        </Link>
        <Link href="/">
          <button style={{ padding: '8px 12px' }}>Volver al inicio</button>
        </Link>
      </div>

      {/* Info de sesión */}
      {email && (
        <p style={{ color: '#666', marginBottom: 12 }}>
          Sesión iniciada como <b>{email}</b>
        </p>
      )}

      {/* Tabla / estados */}
      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No hay jugadores todavía.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>#</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Jugador</th>
              <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>ELO</th>
              <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>PJ</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Último partido</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.profile_id}>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{i + 1}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{r.display_name}</td>
                <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #f2f2f2' }}>{r.rating}</td>
                <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #f2f2f2' }}>{r.games_played}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>
                  {r.last_match_at ? new Date(r.last_match_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
