/**
 * Get current ISO week number and year
 * Returns week 1-52 and the year
 */
export function getCurrentWeek(): { weekNumber: number; year: number } {
  const now = new Date()
  const year = now.getFullYear()

  // ISO week date calculation
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)

  return { weekNumber, year }
}

/**
 * Get the rotating question set for current week
 * Uses a 12-week cycle, so week 13 uses questions from week 1, etc.
 */
export function getRotatingWeekNumber(weekNumber: number): number {
  return ((weekNumber - 1) % 12) + 1
}

/**
 * Generate a secure random token for magic links
 */
export function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Calculate token expiration (7 days from now)
 */
export function getTokenExpiration(): Date {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + 7)
  return expiration
}
