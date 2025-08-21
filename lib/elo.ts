// lib/elo.ts

/**
 * Calcula el nuevo rating ELO de un jugador con reglas antifarmeo.
 *
 * @param playerRating - Rating actual del jugador
 * @param opponentRating - Rating del oponente
 * @param result - 1 si gana, 0 si pierde
 * @param kFactor - Factor K, controla la velocidad de cambio (default 32)
 * @returns Nuevo rating del jugador
 */
export function calculateEloWithAntiFarm(
  playerRating: number,
  opponentRating: number,
  result: 0 | 1,
  kFactor = 32
): number {
  // Fórmula base de ELO
  const expectedScore =
    1 / (1 + 10 ** ((opponentRating - playerRating) / 400));

  let scoreChange = kFactor * (result - expectedScore);

  // ⚠️ Reglas antifarmeo
  const ratingDiff = Math.abs(playerRating - opponentRating);

  // Si el rival tiene 300+ puntos menos → reducción drástica (25%)
  if (ratingDiff > 300) {
    scoreChange *= 0.25;
  }
  // Si la diferencia es entre 200 y 300 → reducción media (50%)
  else if (ratingDiff > 200) {
    scoreChange *= 0.5;
  }

  // Rating final redondeado
  return Math.round(playerRating + scoreChange);
}

/**
 * Calcula el nuevo rating del oponente (espejo del cálculo del jugador).
 *
 * @param opponentRating - Rating actual del oponente
 * @param playerRating - Rating del jugador
 * @param result - 1 si gana el jugador, 0 si pierde
 * @param kFactor - Factor K
 * @returns Nuevo rating del oponente
 */
export function calculateOpponentEloWithAntiFarm(
  opponentRating: number,
  playerRating: number,
  result: 0 | 1,
  kFactor = 32
): number {
  // El resultado del oponente es el inverso del jugador
  const opponentResult = result === 1 ? 0 : 1;
  return calculateEloWithAntiFarm(
    opponentRating,
    playerRating,
    opponentResult,
    kFactor
  );
}
