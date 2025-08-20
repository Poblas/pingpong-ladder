'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabaseClient'

type Match = {
  id: string
  created_at: string
  winner_id: string
  loser_id: string
  winner_score: number
  loser_score: number
}

export default function PlayerHistoryPage() {
  const { id } = useParams()
  const supabase = getSupabaseClient()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const loadMatches = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`winner_id.eq.${id},loser_id.eq.${id}`)
        .order('created_at', { ascending: false })

      if (!error && data) setMatches(data as Match[])
      setLoading(false)
    }

    loadMatches()
  }, [id, supabase])

  return (
    <main style={{ padding: 24 }}>
      <h1>Historial de Partidos</h1>
      {loading ? (
        <p>Cargando…</p>
      ) : matches.length === 0 ? (
        <p>No hay partidos registrados para este jugador.</p>
      ) : (
        <table style={{ width: '100%', maxWidth: 720 }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ganador</th>
              <th>Marcador</th>
              <th>Perdedor</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id}>
                <td>{new Date(match.created_at).toLocaleDateString()}</td>
                <td>{match.winner_id}</td>
                <td>{match.winner_score} - {match.loser_score}</td>
                <td>{match.loser_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
