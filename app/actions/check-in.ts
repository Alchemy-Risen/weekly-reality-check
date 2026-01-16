'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { getCurrentWeek, getRotatingWeekNumber } from '@/lib/utils'
import { sendPostSubmitEmail } from '@/lib/email'
import { markTokenAsUsed } from '@/lib/magic-link'
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

  // Validate userId and token
  if (!userId || !token) {
    throw new Error('Invalid session')
  }

  // Validate numeric inputs
  if (
    isNaN(revenue) ||
    isNaN(hours) ||
    isNaN(satisfaction) ||
    isNaN(energy) ||
    satisfaction < 1 ||
    satisfaction > 10 ||
    energy < 1 ||
    energy > 10
  ) {
    throw new Error('Invalid numeric inputs')
  }

  // Validate text inputs
  if (!q1.trim() || !q2.trim()) {
    throw new Error('Please answer both questions')
  }

  // Get current week info
  const { weekNumber, year } = getCurrentWeek()

  // Save check-in
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

  // Mark magic link token as used (check-in successfully submitted)
  await markTokenAsUsed(token)

  // Generate AI summary and send email before redirecting
  // Must await - Vercel serverless functions terminate after response is sent
  await generateAndSendSummary(
    supabase,
    userId,
    checkIn.id,
    weekNumber,
    { revenue, hours, satisfaction, energy },
    { q1, q2, context }
  )

  // Redirect to completion page
  redirect(`/complete/${checkIn.id}`)
}

/**
 * Generate AI summary and send post-submit email
 * Errors are logged but don't throw to avoid blocking the redirect
 */
async function generateAndSendSummary(
  supabase: any,
  userId: string,
  checkInId: string,
  weekNumber: number,
  numericData: { revenue: number; hours: number; satisfaction: number; energy: number },
  narrativeData: { q1: string; q2: string; context?: string }
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

    // Get current year for CheckInData
    const { year } = getCurrentWeek()

    // Construct CheckInData for AI summary
    const currentCheckIn = {
      week_number: weekNumber,
      year,
      numeric_data: numericData,
      narrative_data: narrativeData,
      submitted_at: new Date().toISOString(),
    }

    // Generate AI summary
    const aiSummary = await generateSummary(userId, currentCheckIn)

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
