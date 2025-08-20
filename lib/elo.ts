// lib/elo.ts
export type Match = {
  winnerId: string;
  loserId: string;
  date: Date;
};

export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  matchesTodayAgainstSame: number,
  streakWins: number
) {
  // K base
  let K = 32;

  // Escala por repeticiones contra el mismo rival
  if (matchesTodayAgainstSame > 20) {
    return { winnerDelta: +1, loserDelta: -1 };
  } else if (matchesTodayAgainstSame > 10) {
    K *= 0.5;
  } else if (matchesTodayAgainstSame > 5) {
    K *= 0.8;
  }

  // Racha de 10 victorias seguidas contra el mismo rival
  if (streakWins >= 10) {
    return { winnerDelta: 0, loserDelta: 0 };
  }

  // Fórmula estándar de ELO
  const expectedWin =
    1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(K * (1 - expectedWin));

  return { winnerDelta: change, loserDelta: -change };
}
