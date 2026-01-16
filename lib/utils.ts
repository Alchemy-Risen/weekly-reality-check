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

/**
 * Generate a verification token for check-in completion page
 * Uses HMAC with check-in ID and user ID to prevent IDOR
 */
export async function generateViewToken(checkInId: string, userId: string): Promise<string> {
  const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_KEY || 'fallback-secret'
  const encoder = new TextEncoder()
  const data = encoder.encode(`${checkInId}:${userId}`)
  const keyData = encoder.encode(secret)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, data)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

/**
 * Verify a view token for check-in completion page
 */
export async function verifyViewToken(checkInId: string, userId: string, token: string): Promise<boolean> {
  const expectedToken = await generateViewToken(checkInId, userId)
  return token === expectedToken
}

/**
 * Sanitize AI-generated text for display
 * Defense in depth: strips HTML tags and limits length
 * Note: React JSX already escapes text, but this adds extra protection
 */
export function sanitizeAIOutput(text: string | null | undefined): string {
  if (!text) return ''

  return text
    // Remove any HTML-like tags
    .replace(/<[^>]*>/g, '')
    // Remove potential script injection patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Limit length to prevent rendering abuse
    .substring(0, 2000)
}
