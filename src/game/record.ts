// Lógica pura del récord: 0 significa "sin récord" y 0 puntos nunca es récord.
export function isNewRecord(best: number, score: number): boolean {
  return score > best && score > 0;
}
