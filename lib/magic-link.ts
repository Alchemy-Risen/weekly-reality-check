'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { generateToken, getTokenExpiration } from '@/lib/utils'

/**
 * Generate a magic link for a user
 * Creates or finds user, generates token, returns magic link URL
 */
export async function generateMagicLink(email: string): Promise<{
  success: boolean
  magicLink?: string
  error?: string
}> {
  const supabase = getSupabaseAdmin()

  // Validate email
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // Get or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (userError || !user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email: normalizedEmail })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create user:', createError)
        return { success: false, error: 'Failed to create account' }
      }

      user = newUser
    }

    // Generate token
    const token = generateToken()
    const expiresAt = getTokenExpiration()

    // Save token to database
    const { error: tokenError } = await supabase
      .from('magic_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) {
      console.error('Failed to create token:', tokenError)
      return { success: false, error: 'Failed to generate magic link' }
    }

    // Build magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/check-in/${token}`

    return { success: true, magicLink }
  } catch (error) {
    console.error('Magic link generation error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Validate a magic link token
 * Returns user if valid, null if invalid/expired/used
 */
export async function validateToken(token: string): Promise<{
  valid: boolean
  userId?: string
  email?: string
  error?: string
}> {
  const supabase = getSupabaseAdmin()

  try {
    // Fetch token from database
    const { data: magicToken, error: tokenError } = await supabase
      .from('magic_tokens')
      .select('*, users(*)')
      .eq('token', token)
      .single()

    if (tokenError || !magicToken) {
      return { valid: false, error: 'Invalid token' }
    }

    // Check if already used
    if (magicToken.used_at) {
      return { valid: false, error: 'Token already used' }
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(magicToken.expires_at)

    if (now > expiresAt) {
      return { valid: false, error: 'Token expired' }
    }

    // Mark token as used
    await supabase
      .from('magic_tokens')
      .update({ used_at: now.toISOString() })
      .eq('token', token)

    // Return user info
    const user = magicToken.users as any

    return {
      valid: true,
      userId: user.id,
      email: user.email,
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return { valid: false, error: 'Token validation failed' }
  }
}

/**
 * Check if user has already submitted a check-in this week
 */
export async function hasSubmittedThisWeek(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const now = new Date()
  const year = now.getFullYear()

  // ISO week calculation
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)

  const { data, error } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('week_number', weekNumber)
    .single()

  return !!data && !error
}
