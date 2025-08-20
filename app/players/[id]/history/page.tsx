'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Player = {
  id: string;
  display_name: string | null;
};

type MatchRow = {
  id: string;
  created_at: string;
  score1: number;
  score2: number;
  // Estos alias usan el embed por FK:
  player1: Player | null; // viene de player1_id -> Profiles
  player2: Player | null; // viene de player2_id -> Profiles
};

export default function PlayerHistoryPage() {
  const supabase = getSupabaseClient();
  const params = useParams<{ id: string }>();
  const playerId = params?.id as string;

  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    if (!playerId) return;

    let mounted = true;

    const run = async () => {
      setLoading(true);

      // 1) Cargar el nombre del jugador (opcional, para el título)
      const { data: prof, error: profErr } = await supabase
        .from('Profiles')
        .select('display_name')
        .eq('id', playerId)
        .maybeSingle();

      if (!profErr && prof && mounted) {
        setPlayerName(prof.display_name ?? '');
      }

      // 2) Cargar los partidos donde participa (player1 o player2),
      //    trayendo también los datos de ambos jugadores vía FK-embed.
      //
      //    OJO: Esto requiere que existan las FKs:
      //      Matches.player1_id -> Profiles.id
      //      Matches.player2_id -> Profiles.id
      //
      //    y que haya RLS con SELECT permitido en Matches y Profiles.
      const { data, error } = await supabase
        .from('Matches')
        .select(
          `
          id,
          created_at,
          score1,
          score2,
          player1:player1_id ( id, display_name ),
          player2:player2_id ( id, display_name )
        `
        )
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && mounted) {
        setRows(data as MatchRow[]);
      }

      if (mounted) setLoading(false);
    };

    run();
    return () => {
      mounted = false;
    };
  }, [playerId, supabase]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Historial de Partidos {playerName ? `de ${playerName}` : ''}</h1>

      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No hay partidos registrados para este jugador.</p>
      ) : (
        <table style={{ width: '100%', maxWidth: 900, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Jugador 1</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Jugador 2</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Marcador</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const p1 = m.player1?.display_name ?? '—';
              const p2 = m.player2?.display_name ?? '—';
              const meIsP1 = m.player1?.id === playerId;
              const myGoals = meIsP1 ? m.score1 : m.score2;
              const oppGoals = meIsP1 ? m.score2 : m.score1;
              const outcome =
                myGoals > oppGoals ? 'Ganó' : myGoals < oppGoals ? 'Perdió' : 'Empate';

              return (
                <tr key={m.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: 8 }}>{p1}</td>
                  <td style={{ padding: 8 }}>{p2}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>
                    {m.score1} — {m.score2}
                  </td>
                  <td style={{ padding: 8 }}>{outcome}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
