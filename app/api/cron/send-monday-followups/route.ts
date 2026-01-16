import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendMondayFollowupEmail } from '@/lib/email'
import { getRotatingWeekNumber } from '@/lib/utils'

/**
 * Cron job to send Monday follow-up emails
 * Should run every Monday morning (e.g., 9am)
 * Sends recap of last week's check-in
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron or has the correct auth header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // SECURITY: Fail closed - if secret is not configured, reject all requests
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  try {
    // Get the previous week's check-ins (from last 7-10 days to be safe)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select('id, user_id, week_number, year, numeric_data, narrative_data, users(email)')
      .gte('submitted_at', tenDaysAgo.toISOString())
      .lte('submitted_at', sevenDaysAgo.toISOString())
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch check-ins:', error)
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500 }
      )
    }

    if (!checkIns || checkIns.length === 0) {
      return NextResponse.json({
        message: 'No check-ins from last week to follow up on',
        sent: 0,
      })
    }

    console.log(`Sending Monday follow-ups for ${checkIns.length} check-ins...`)

    let sent = 0
    let failed = 0

    // Group by user (in case someone submitted multiple times)
    // Send only the most recent check-in per user
    const checkInsByUser = new Map()
    for (const checkIn of checkIns) {
      // Supabase join returns user data in the nested select
      const user = checkIn.users as unknown as { email: string } | null
      if (!user || !user.email) continue

      if (!checkInsByUser.has(user.email)) {
        checkInsByUser.set(user.email, checkIn)
      }
    }

    // Send follow-up email to each user
    for (const [email, checkIn] of checkInsByUser) {
      try {
        const rotatingWeek = getRotatingWeekNumber(checkIn.week_number)

        // Get a narrative highlight (one of their answers)
        const narrativeHighlight = checkIn.narrative_data.q1 || checkIn.narrative_data.q2

        const emailResult = await sendMondayFollowupEmail(
          email,
          checkIn.id,
          rotatingWeek,
          checkIn.numeric_data,
          narrativeHighlight
        )

        if (emailResult.success) {
          sent++
          console.log(`✓ Sent to ${email}`)
        } else {
          failed++
          console.error(`✗ Failed to send to ${email}:`, emailResult.error)
        }

        // Add a small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error sending to ${email}:`, error)
        failed++
      }
    }

    console.log(`Monday follow-ups complete: ${sent} sent, ${failed} failed`)

    return NextResponse.json({
      message: 'Monday follow-ups sent',
      total: checkInsByUser.size,
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
