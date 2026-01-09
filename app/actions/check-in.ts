'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { getCurrentWeek, getRotatingWeekNumber } from '@/lib/utils'
import { sendPostSubmitEmail } from '@/lib/email'
import { markTokenAsUsed } from '@/lib/magic-link'
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

  // Get user email for sending summary
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (user) {
    // Send post-submit summary email (don't await - let it happen in background)
    // TODO: Generate AI summary first
    sendPostSubmitEmail(
      user.email,
      checkIn.id,
      getRotatingWeekNumber(weekNumber),
      { revenue, hours, satisfaction, energy }
    ).catch((error) => {
      console.error('Failed to send post-submit email:', error)
      // Don't block the user experience if email fails
    })
  }

  // Redirect to completion page
  redirect(`/complete/${checkIn.id}`)
}
