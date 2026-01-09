'use server'

import { generateMagicLink } from '@/lib/magic-link'
import { redirect } from 'next/navigation'

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address')
  }

  // Generate magic link
  const result = await generateMagicLink(email)

  if (!result.success) {
    throw new Error(result.error || 'Failed to create account')
  }

  // TODO: Send email with magic link via Resend
  // For now, just log it (we'll implement email sending next)
  console.log('Magic link generated:', result.magicLink)
  console.log('Email would be sent to:', email)

  // Redirect to confirmation page
  redirect('/signup/check-email')
}
