// Game year is always 1926
export const GAME_YEAR = 1926;

/**
 * Calculate character age based on game year (1926)
 */
export function calculateGameAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const gameDate = new Date(GAME_YEAR, new Date().getMonth(), new Date().getDate());
  
  let age = gameDate.getFullYear() - birth.getFullYear();
  const monthDiff = gameDate.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && gameDate.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get current game date string
 */
export function getCurrentGameDate(): string {
  const currentDate = new Date();
  return `${currentDate.getDate()}. ${currentDate.toLocaleDateString('cs-CZ', { month: 'long' })} ${GAME_YEAR}`;
}

/**
 * Format game date for display
 */
export function formatGameDate(date: Date): string {
  return `${date.getDate()}. ${date.toLocaleDateString('cs-CZ', { month: 'long' })} ${GAME_YEAR}`;
}