'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentWeek, generateViewToken } from '@/lib/utils'
import { sendPostSubmitEmail } from '@/lib/email'
import { generateSummary } from '@/lib/ai-summary'
import { redirect } from 'next/navigation'

export async function submitCheckIn(formData: FormData) {
  const supabase = getSupabaseAdmin()

  // Extract form data
  const userId = formData.get('userId') as string
  const token = formData.get('token') as string
  const revenue = parseFloat(formData.get('revenue') as string)
  const hours = parseFloat(formData.get('hours') as string)
  const satisfaction = parseInt(formData.get('satisfaction') as string)
  const energy = parseInt(formData.get('energy') as string)
  const q1 = formData.get('q1') as string
  const q2 = formData.get('q2') as string
  const context = formData.get('context') as string

  // Validate userId and token presence
  if (!userId || !token) {
    throw new Error('Invalid session')
  }

  // SECURITY: Atomically validate token AND mark as used in single operation
  // This prevents race conditions and validates token ownership
  const { data: tokenData, error: tokenError } = await supabase
    .from('magic_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .eq('user_id', userId) // SECURITY: Verify token belongs to claimed user
    .is('used_at', null) // Only if not already used
    .gt('expires_at', new Date().toISOString()) // Only if not expired
    .select('user_id')
    .single()

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired session. Please request a new check-in link.')
  }

  // Validate numeric inputs with bounds checking
  if (
    isNaN(revenue) ||
    isNaN(hours) ||
    isNaN(satisfaction) ||
    isNaN(energy) ||
    !Number.isFinite(revenue) ||
    !Number.isFinite(hours) ||
    revenue < 0 ||
    revenue > 100_000_000 ||
    hours < 0 ||
    hours > 168 || // Max hours in a week
    satisfaction < 1 ||
    satisfaction > 10 ||
    energy < 1 ||
    energy > 10
  ) {
    throw new Error('Invalid numeric inputs')
  }

  // Validate text inputs with length limits
  if (!q1.trim() || !q2.trim()) {
    throw new Error('Please answer both questions')
  }

  // Limit text input length to prevent abuse
  const maxTextLength = 10000
  if (q1.length > maxTextLength || q2.length > maxTextLength || (context && context.length > maxTextLength)) {
    throw new Error('Response text is too long')
  }

  // Get current week info
  const { weekNumber, year } = getCurrentWeek()

  // Save check-in (token already validated and marked as used)
  const { data: checkIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      user_id: userId,
      week_number: weekNumber,
      year,
      numeric_data: {
        revenue,
        hours,
        satisfaction,
        energy,
      },
      narrative_data: {
        q1,
        q2,
        context: context || undefined,
      },
    })
    .select()
    .single()

  if (checkInError) {
    // Check if it's a duplicate (user already submitted this week)
    if (checkInError.code === '23505') {
      throw new Error('You already submitted a check-in this week')
    }
    throw new Error('Failed to save check-in: ' + checkInError.message)
  }

  // Generate AI summary and send email before redirecting
  // Must await - Vercel serverless functions terminate after response is sent
  await generateAndSendSummary(
    supabase,
    userId,
    checkIn.id,
    weekNumber,
    { revenue, hours, satisfaction, energy }
  )

  // Generate view token to prevent IDOR on completion page
  const viewToken = await generateViewToken(checkIn.id, userId)

  // Redirect to completion page with verification token
  redirect(`/complete/${checkIn.id}?vt=${viewToken}`)
}

/**
 * Generate AI summary and send post-submit email
 * Errors are logged but don't throw to avoid blocking the redirect
 */
async function generateAndSendSummary(
  supabase: SupabaseClient,
  userId: string,
  checkInId: string,
  weekNumber: number,
  numericData: { revenue: number; hours: number; satisfaction: number; energy: number }
) {
  try {
    // Fetch user email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!user?.email) {
      console.error('User email not found for AI summary')
      return
    }

    // Generate AI summary
    const aiSummary = await generateSummary(userId)

    // Update check-in with AI summary if generated
    if (aiSummary) {
      await supabase
        .from('check_ins')
        .update({ ai_summary: aiSummary })
        .eq('id', checkInId)
    }

    // Send post-submit email with summary
    await sendPostSubmitEmail(
      user.email,
      checkInId,
      weekNumber,
      numericData,
      aiSummary ?? undefined
    )

    console.log(`✅ AI summary generated and email sent for check-in ${checkInId}`)
  } catch (error) {
    console.error('Error in generateAndSendSummary:', error)
    // Don't throw - this runs in background and shouldn't affect user experience
  }
}
