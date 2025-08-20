'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Profile = { id: string; display_name: string | null; created_at: string };

export default function Dashboard() {
  const supabase = getSupabaseClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('Profiles') // usa exactamente el mismo nombre de tu tabla
        .select('id, display_name, created_at')
        .not('display_name', 'is', null)
        .order('created_at', { ascending: true });

      if (!error && data) setProfiles(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>🏓 Ranking de Jugadores</h1>
      {loading ? (
        <p>Cargando…</p>
      ) : profiles.length === 0 ? (
        <p>No hay jugadores todavía.</p>
      ) : (
        <table style={{ width: '100%', maxWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Posición</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Jugador</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p, i) => (
              <tr key={p.id}>
                <td style={{ padding: 8 }}>{i + 1}</td>
                <td style={{ padding: 8 }}>{p.display_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
