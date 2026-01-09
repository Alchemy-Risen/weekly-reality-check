'use server'

import { Resend } from 'resend'
import { render } from '@react-email/render'
import MagicLinkEmail from '@/emails/magic-link'
import PostSubmitEmail from '@/emails/post-submit'
import MondayFollowupEmail from '@/emails/monday-followup'
import { getSupabaseAdmin } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

// Email sending configuration
const FROM_EMAIL = 'Weekly Reality Check <hello@weeklyrealitycheck.com>'
const REPLY_TO = 'hello@weeklyrealitycheck.com'

/**
 * Send magic link email for check-in
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  isNewUser = false
): Promise<{ success: boolean; error?: string }> {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder') {
    console.log('⚠️  Resend API key not configured. Email would be sent to:', email)
    console.log('📧 Magic link:', magicLink)
    return { success: false, error: 'Resend API key not configured' }
  }

  try {
    const html = await render(MagicLinkEmail({ magicLink, isNewUser }))

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO,
      subject: isNewUser
        ? 'Welcome to Weekly Reality Check'
        : 'Your Weekly Check-In',
      html,
    })

    if (error) {
      console.error('Failed to send magic link email:', error)
      return { success: false, error: error.message }
    }

    // Log email send to database
    await logEmail(email, 'weekly_checkin', { isNewUser })

    return { success: true }
  } catch (error) {
    console.error('Error sending magic link email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send post-submit summary email
 */
export async function sendPostSubmitEmail(
  email: string,
  checkInId: string,
  weekNumber: number,
  numericData: {
    revenue: number
    hours: number
    satisfaction: number
    energy: number
  },
  aiSummary?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await render(
      PostSubmitEmail({
        weekNumber,
        numericData,
        aiSummary,
      })
    )

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO,
      subject: `Week ${weekNumber} Check-In Submitted`,
      html,
    })

    if (error) {
      console.error('Failed to send post-submit email:', error)
      return { success: false, error: error.message }
    }

    // Log email send to database
    await logEmail(email, 'post_submit', { checkInId })

    return { success: true }
  } catch (error) {
    console.error('Error sending post-submit email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send Monday follow-up email
 */
export async function sendMondayFollowupEmail(
  email: string,
  checkInId: string,
  weekNumber: number,
  numericData: {
    revenue: number
    hours: number
    satisfaction: number
    energy: number
  },
  narrativeHighlight?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = await render(
      MondayFollowupEmail({
        weekNumber,
        numericData,
        narrativeHighlight,
      })
    )

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      replyTo: REPLY_TO,
      subject: `Week ${weekNumber} Recap`,
      html,
    })

    if (error) {
      console.error('Failed to send Monday followup email:', error)
      return { success: false, error: error.message }
    }

    // Log email send to database
    await logEmail(email, 'monday_followup', { checkInId })

    return { success: true }
  } catch (error) {
    console.error('Error sending Monday followup email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Log email send to database for tracking
 */
async function logEmail(
  email: string,
  emailType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Get user ID from email
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) {
    console.warn('Could not log email - user not found:', email)
    return
  }

  await supabase.from('email_logs').insert({
    user_id: user.id,
    email_type: emailType,
    metadata,
  })
}
