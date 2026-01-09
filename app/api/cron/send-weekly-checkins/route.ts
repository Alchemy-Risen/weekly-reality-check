import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateMagicLink } from '@/lib/magic-link'
import { sendMagicLinkEmail } from '@/lib/email'

/**
 * Cron job to send weekly check-in emails to all users
 * Should run once per week (e.g., every Friday at 9am)
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron or has the correct auth header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    // Get all active users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: 'No users to send check-ins to',
        sent: 0,
      })
    }

    console.log(`Sending weekly check-ins to ${users.length} users...`)

    let sent = 0
    let failed = 0

    // Send magic link to each user
    for (const user of users) {
      try {
        // Generate magic link
        const linkResult = await generateMagicLink(user.email)

        if (!linkResult.success || !linkResult.magicLink) {
          console.error(`Failed to generate link for ${user.email}:`, linkResult.error)
          failed++
          continue
        }

        // Send email
        const emailResult = await sendMagicLinkEmail(
          user.email,
          linkResult.magicLink,
          false // Not a new user
        )

        if (emailResult.success) {
          sent++
          console.log(`✓ Sent to ${user.email}`)
        } else {
          failed++
          console.error(`✗ Failed to send to ${user.email}:`, emailResult.error)
        }

        // Add a small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error sending to ${user.email}:`, error)
        failed++
      }
    }

    console.log(`Weekly check-ins complete: ${sent} sent, ${failed} failed`)

    return NextResponse.json({
      message: 'Weekly check-ins sent',
      total: users.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
