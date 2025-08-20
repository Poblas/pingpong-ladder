'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Profile = { id: string; display_name: string };

export default function NewMatch() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [me, setMe] = useState<Profile | null>(null);
  const [opponents, setOpponents] = useState<Profile[]>([]);
  const [opponentId, setOpponentId] = useState('');
  const [myScore, setMyScore] = useState<number>(0);
  const [oppScore, setOppScore] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Debe estar logueado
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        router.replace('/');
        return;
      }

      // Mi perfil
      const { data: myProf, error: meErr } = await supabase
        .from('Profiles')
        .select('id, display_name')
        .eq('user_id', uid)
        .single();

      if (meErr || !myProf) {
        setMsg('No se encontró tu perfil. Ve a /onboarding primero.');
        return;
      }
      setMe(myProf);

      // Oponentes (todos con nombre excepto yo)
      const { data: opps } = await supabase
        .from('Profiles')
        .select('id, display_name')
        .neq('id', myProf.id)
        .not('display_name', 'is', null)
        .order('display_name', { ascending: true });

      setOpponents(opps ?? []);
    })();
  }, []);

  function validateScores(a: number, b: number) {
    // A 7 puntos: uno debe ser 7 y el otro 0..6
    return (
      ((a === 7 && b >= 0 && b <= 6) || (b === 7 && a >= 0 && a <= 6)) &&
      !(a === 7 && b === 7)
    );
  }

  async function saveMatch(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!me) return;

    if (!opponentId) {
      setMsg('Elige un oponente.');
      return;
    }

    if (!validateScores(myScore, oppScore)) {
      setMsg('Marcador inválido. A 7: uno debe ser 7 y el otro 0–6.');
      return;
    }

    setSaving(true);

    // Ganador según marcador
    const myWin = myScore === 7;
    const winnerId = myWin ? me.id : opponentId;

    const { error } = await supabase.from('Matches').insert({
      player1_id: me.id,
      player2_id: opponentId,
      score1: myScore,
      score2: oppScore,
      winner_id: winnerId,
    });

    setSaving(false);

    if (error) setMsg(error.message);
    else {
      setMsg('Partido guardado ✅');
      // El trigger en Supabase actualizará ELO automáticamente
      setTimeout(() => router.replace('/matches'), 600);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1>Nuevo partido (a 7 puntos)</h1>

      {!me ? (
        <p>Cargando…</p>
      ) : (
        <form onSubmit={saveMatch} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label>Yo:</label>
            <div><b>{me.display_name}</b></div>
          </div>

          <div>
            <label>Oponente:</label>
            <select
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
              style={{ width: '100%', padding: 8 }}
              required
            >
              <option value="">-- Elige oponente --</option>
              {opponents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Mis puntos</label>
              <input
                type="number"
                min={0}
                max={7}
                value={myScore}
                onChange={(e) => setMyScore(Number(e.target.value))}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Puntos rival</label>
              <input
                type="number"
                min={0}
                max={7}
                value={oppScore}
                onChange={(e) => setOppScore(Number(e.target.value))}
                style={{ width: '100%', padding: 8 }}
              />
            </div>
          </div>

          <button disabled={saving} style={{ padding: 10 }}>
            {saving ? 'Guardando…' : 'Guardar partido'}
          </button>

          {msg && <p style={{ color: msg.includes('✅') ? 'green' : 'crimson' }}>{msg}</p>}
        </form>
      )}
    </main>
  );
}
