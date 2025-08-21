'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Player = { id: string; display_name: string };

export default function NewMatchPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [me, setMe] = useState<Player | null>(null);

  const [p1, setP1] = useState(''); // jugador 1
  const [p2, setP2] = useState(''); // jugador 2
  const [s1, setS1] = useState('7');
  const [s2, setS2] = useState('0');

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Debe haber sesión
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      // Mi perfil (para preseleccionarme)
      const { data: myProf } = await supabase
        .from('Profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (myProf) {
        setMe(myProf as Player);
        setP1((myProf as Player).id);
      }

      // Todos los perfiles (¡sin pedir "rating"!)
      const { data, error } = await supabase
        .from('Profiles')
        .select('id, display_name')
        .order('display_name');

      if (error) {
        console.error(error);
        setErr(error.message);
      } else {
        setPlayers((data ?? []) as Player[]);
      }

      setLoading(false);
    })();
  }, [router, supabase]);

  const haveTwoPlayers = players.length >= 2;

  // El marcador debe ser 7–0..6
  const validScores = useMemo(() => {
    const a = Number(s1), b = Number(s2);
    const isInt = Number.isInteger(a) && Number.isInteger(b);
    const ok = isInt && ((a === 7 && b >= 0 && b <= 6) || (b === 7 && a >= 0 && a <= 6));
    return ok;
  }, [s1, s2]);

  const save = async () => {
    setErr(null);

    if (!p1 || !p2) { setErr('Elige los dos jugadores.'); return; }
    if (p1 === p2) { setErr('No puedes elegir al mismo jugador dos veces.'); return; }
    if (!validScores) { setErr('Marcador inválido. Debe ser 7–0..6.'); return; }

    const a = Number(s1), b = Number(s2);
    const winner = a > b ? p1 : p2;

    setSaving(true);
    const { error } = await supabase.from('Matches').insert({
      player1_id: p1,
      player2_id: p2,
      score1: a,
      score2: b,
      winner_id: winner,
    });
    setSaving(false);

    if (error) { setErr(error.message); return; }

    // El trigger en la base recalcula ELO/Ratings/Leaderboard
    router.replace('/dashboard');
  };

  if (loading) return <main style={{ padding: 24 }}>Cargando…</main>;

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Registrar Partido</h1>

      {!haveTwoPlayers ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: '#444' }}>
            Necesitas al menos <b>2 jugadores</b> para registrar un partido.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, maxWidth: 420, marginTop: 12 }}>
          <label>Jugador 1 {me ? <span style={{ color: '#666' }}>(tú)</span> : null}</label>
          <select value={p1} onChange={(e) => setP1(e.target.value)}>
            <option value="">— Elegir —</option>
            {players.map(pl => (
              <option key={pl.id} value={pl.id}>{pl.display_name}</option>
            ))}
          </select>

          <label>Jugador 2</label>
          <select value={p2} onChange={(e) => setP2(e.target.value)}>
            <option value="">— Elegir —</option>
            {players
              .filter(pl => pl.id !== p1)
              .map(pl => (
                <option key={pl.id} value={pl.id}>{pl.display_name}</option>
              ))}
          </select>

          <label>Marcador (a 7)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" min={0} max={7} value={s1} onChange={(e) => setS1(e.target.value)} style={{ width: 80 }} />
            <span>—</span>
            <input type="number" min={0} max={7} value={s2} onChange={(e) => setS2(e.target.value)} style={{ width: 80 }} />
          </div>

          {!validScores && <p style={{ color: 'crimson' }}>Debe ganar uno con 7 y el otro 0..6.</p>}
          {err && <p style={{ color: 'crimson' }}>{err}</p>}

          <div style={{ marginTop: 8 }}>
            <button onClick={save} disabled={saving || !validScores}>
              {saving ? 'Guardando…' : 'Guardar partido'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
