'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Row = {
  id: string;
  created_at: string;
  p1_name: string | null;
  p2_name: string | null;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
};

export default function Matches() {
  const supabase = getSupabaseClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Trae partidos + nombres (joins)
      const { data, error } = await supabase
        .from('Matches')
        .select(
          `
          id, created_at, score1, score2, winner_id,
          player1:player1_id ( display_name ),
          player2:player2_id ( display_name )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const mapped: Row[] = (data as any[]).map((r) => ({
          id: r.id,
          created_at: r.created_at,
          p1_name: r.player1?.display_name ?? null,
          p2_name: r.player2?.display_name ?? null,
          score1: r.score1,
          score2: r.score2,
          winner_id: r.winner_id,
        }));
        setRows(mapped);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Partidos recientes</h1>
      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>Sin partidos aún.</p>
      ) : (
        <table style={{ width: '100%', maxWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Jugador 1</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Jugador 2</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Marcador</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 8 }}>
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td style={{ padding: 8 }}>{r.p1_name}</td>
                <td style={{ padding: 8 }}>{r.p2_name}</td>
                <td style={{ padding: 8 }}>
                  {r.score1} – {r.score2}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 16 }}>
        <a href="/matches/new">➕ Registrar nuevo partido</a>
      </p>
    </main>
  );
}
