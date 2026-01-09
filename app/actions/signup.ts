'use server'

import { generateMagicLink } from '@/lib/magic-link'
import { sendMagicLinkEmail } from '@/lib/email'
import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address')
  }

  // Check if user already exists
  const supabase = getSupabaseAdmin()
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  const isNewUser = !existingUser

  // Generate magic link
  const result = await generateMagicLink(email)

  if (!result.success) {
    throw new Error(result.error || 'Failed to create account')
  }

  // Send magic link email
  const emailResult = await sendMagicLinkEmail(email, result.magicLink!, isNewUser)

  if (!emailResult.success) {
    console.error('Failed to send email:', emailResult.error)
    // Don't throw error - user can try again later
    // Still redirect to check-email page
  }

  // Redirect to confirmation page
  redirect('/signup/check-email')
}
