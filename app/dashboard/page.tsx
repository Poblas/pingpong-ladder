'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Row = {
  profile_id: string;
  display_name: string;
  rating: number;        // ELO
  games_played: number;  // PJ
  last_match_at: string | null;
};

export default function Dashboard() {
  const supabase = getSupabaseClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);

      // 1) Usuario actual (para mostrar el correo)
      const { data: userResp } = await supabase.auth.getUser();
      if (isMounted) {
        setUserEmail(userResp?.user?.email ?? null);
      }

      // 2) Leaderboard (vista)
      const { data, error } = await supabase
        .from('Leaderboard')
        .select('*')
        .order('rating', { ascending: false })
        .limit(200);

      if (!error && data && isMounted) {
        setRows(data as Row[]);
      }

      if (isMounted) setLoading(false);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 36 }}>🏓</span>
        <h1 style={{ margin: 0 }}>Ranking de Jugadores</h1>
      </header>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <a href="/profile">
          <button>Crear / editar mi perfil</button>
        </a>
        <a href="/new-match">
          <button>Registrar partido</button>
        </a>
        <a href="/">
          <button>Volver al inicio</button>
        </a>
      </div>

      {userEmail && (
        <p style={{ marginTop: 0, color: '#444' }}>
          Sesión iniciada como <b>{userEmail}</b>
        </p>
      )}

      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No hay jugadores todavía.</p>
      ) : (
        <table style={{ width: '100%', maxWidth: 980, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>#</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Jugador</th>
              <th style={{ textAlign: 'right', padding: 8 }}>ELO</th>
              <th style={{ textAlign: 'right', padding: 8 }}>PJ</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Último partido</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.profile_id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{i + 1}</td>
                <td style={{ padding: 8 }}>
                  <a
                    href={`/players/${r.profile_id}/history`}
                    style={{ color: 'blue', textDecoration: 'underline' }}
                  >
                    {r.display_name}
                  </a>
                </td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.rating}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{r.games_played}</td>
                <td style={{ padding: 8 }}>
                  {r.last_match_at
                    ? new Date(r.last_match_at).toLocaleString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
