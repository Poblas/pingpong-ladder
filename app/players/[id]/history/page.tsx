'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';

type Profile = { id: string; display_name: string | null };
type MatchRow = {
  id: string;
  created_at: string;
  score1: number;
  score2: number;
  winner_id: string | null; // guarda Profiles.id
  player1: Profile | null;
  player2: Profile | null;
};

export default function PlayerHistory({
  params,
}: {
  params: { id: string }; // <-- este ES el Profiles.id del jugador cuya página visitas
}) {
  const supabase = getSupabaseClient();
  const playerId = params.id;

  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      // Traemos el match y los 2 perfiles relacionados
      const { data, error } = await supabase
        .from('Matches')
        .select(
          `
          id,
          created_at,
          score1,
          score2,
          winner_id,
          player1:Profiles!Matches_player1_id_fkey ( id, display_name ),
          player2:Profiles!Matches_player2_id_fkey ( id, display_name )
        `
        )
        // partidos donde el jugador fue player1 O player2
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order('created_at', { ascending: false });

      if (!error && data && mounted) {
        // El tipado del select con relaciones viene como "any". Normalizamos a MatchRow
        const normalized = (data as any[]).map((r) => ({
          id: r.id,
          created_at: r.created_at,
          score1: r.score1,
          score2: r.score2,
          winner_id: r.winner_id ?? null,
          // OJO: con select(...) anterior, player1 / player2 son objetos (no arrays)
          player1: r.player1 ? { id: r.player1.id, display_name: r.player1.display_name } : null,
          player2: r.player2 ? { id: r.player2.id, display_name: r.player2.display_name } : null,
        })) as MatchRow[];

        setRows(normalized);
      }

      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [playerId, supabase]);

  // Helpers para pintar la fila respecto al jugador de la página:
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    });

  const renderRow = (m: MatchRow) => {
    const p1 = m.player1;
    const p2 = m.player2;

    // ¿El jugador de la página fue player1?
    const isP1 = p1 && p1.id === playerId;

    // Oponente y marcador vistos desde este jugador:
    const opponent: Profile | null = isP1 ? p2 : p1;
    const myScore = isP1 ? m.score1 : m.score2;
    const theirScore = isP1 ? m.score2 : m.score1;

    // Resultado relativo al jugador de la página:
    const result =
      m.winner_id && m.winner_id === playerId
        ? 'Ganó'
        : m.winner_id
        ? 'Perdió'
        : '—';

    return (
      <tr key={m.id}>
        <td style={{ padding: '8px 12px' }}>{formatDate(m.created_at)}</td>
        <td style={{ padding: '8px 12px' }}>{p1?.display_name ?? '—'}</td>
        <td style={{ padding: '8px 12px' }}>{p2?.display_name ?? '—'}</td>
        <td style={{ padding: '8px 12px' }}>
          {myScore} — {theirScore}
        </td>
        <td style={{ padding: '8px 12px' }}>{result}</td>
        <td style={{ padding: '8px 12px' }}>
          {/* Enlace al perfil del oponente (si quieres) */}
          {opponent?.id ? (
            <Link href={`/players/${opponent.id}/history`} style={{ textDecoration: 'underline' }}>
              Ver perfil de {opponent.display_name ?? 'jugador'}
            </Link>
          ) : (
            '—'
          )}
        </td>
      </tr>
    );
  };

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24 }}>
        Historial de Partidos
      </h1>

      {loading ? (
        <p>Cargando…</p>
      ) : rows.length === 0 ? (
        <p>No hay partidos registrados para este jugador.</p>
      ) : (
        <table style={{ width: '100%', maxWidth: 980, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Jugador 1</th>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Jugador 2</th>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Marcador</th>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Resultado</th>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>Oponente</th>
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
        </table>
      )}
    </main>
  );
}
