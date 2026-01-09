'use server'

import { getSupabaseAdmin } from '@/lib/supabase'
import { getCurrentWeek, getRotatingWeekNumber } from '@/lib/utils'
import { redirect } from 'next/navigation'

export async function submitCheckIn(formData: FormData) {
  const supabase = getSupabaseAdmin()

  // Extract form data
  const revenue = parseFloat(formData.get('revenue') as string)
  const hours = parseFloat(formData.get('hours') as string)
  const satisfaction = parseInt(formData.get('satisfaction') as string)
  const energy = parseInt(formData.get('energy') as string)
  const q1 = formData.get('q1') as string
  const q2 = formData.get('q2') as string
  const context = formData.get('context') as string

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

  // TODO: Get user from token validation
  // For now, we'll create a test user
  const testEmail = 'test@example.com'

  // Get or create user
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single()

  if (userError || !user) {
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ email: testEmail })
      .select()
      .single()

    if (createError) {
      throw new Error('Failed to create user: ' + createError.message)
    }

    user = newUser
  }

  // Save check-in
  const { data: checkIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      user_id: user.id,
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

  // TODO: Generate AI summary
  // TODO: Send post-submit email

  // Redirect to thank you page
  redirect(`/check-in/${checkIn.id}/complete`)
}
