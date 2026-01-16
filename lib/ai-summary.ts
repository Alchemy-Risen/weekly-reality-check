'use server'

import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from './supabase'
import { getRotatingWeekNumber } from './utils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
})

interface CheckInData {
  week_number: number
  year: number
  numeric_data: {
    revenue: number
    hours: number
    satisfaction: number
    energy: number
  }
  narrative_data: {
    q1: string
    q2: string
    context?: string
  }
  submitted_at: string
}

/**
 * Generate AI summary of user's check-in patterns
 * CRITICAL: Never give advice, never coach, only describe patterns
 */
export async function generateSummary(
  userId: string,
  currentCheckIn: CheckInData
): Promise<string | null> {
  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'placeholder') {
    console.log('[AI Summary] Skipped - API key not configured')
    return null
  }

  console.log('[AI Summary] Starting generation for user:', userId)

  try {
    const supabase = getSupabaseAdmin()

    // Fetch user's historical check-ins (last 12 weeks)
    const { data: previousCheckIns, error: fetchError } = await supabase
      .from('check_ins')
      .select('week_number, year, numeric_data, narrative_data, submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(12)

    if (fetchError) {
      console.error('[AI Summary] Failed to fetch check-ins:', fetchError)
      return null
    }

    const allCheckIns = previousCheckIns || []
    console.log(`[AI Summary] Found ${allCheckIns.length} historical check-ins`)

    // Build context for Claude
    const checkInHistory = allCheckIns
      .map((checkIn, index) => {
        const rotatingWeek = getRotatingWeekNumber(checkIn.week_number)
        return `
Week ${rotatingWeek} (${index === 0 ? 'current' : `${index} weeks ago`}):
- Revenue: $${checkIn.numeric_data.revenue}
- Hours: ${checkIn.numeric_data.hours}
- Satisfaction: ${checkIn.numeric_data.satisfaction}/10
- Energy: ${checkIn.numeric_data.energy}/10
- Q1: ${checkIn.narrative_data.q1}
- Q2: ${checkIn.narrative_data.q2}${checkIn.narrative_data.context ? `\n- Context: ${checkIn.narrative_data.context}` : ''}
`.trim()
      })
      .join('\n\n')

    // Determine if this is a first check-in (only 1 record)
    const isFirstCheckIn = allCheckIns.length <= 1

    // Call Claude API with strict "no advice" system prompt
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more factual, less creative
      system: `You are analyzing weekly check-in data for a solo founder/operator.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. NEVER suggest actions, next steps, or recommendations
2. NEVER use phrases like "you should", "consider", "try", "might want to", "you could", "you might"
3. NEVER give advice, coaching, or motivation
4. ONLY describe observable patterns in the data
5. Use factual, neutral language
6. If you're uncertain about a pattern, say so plainly
7. Focus on what IS happening, not what SHOULD happen
8. Keep it brief (2-4 sentences maximum)
${isFirstCheckIn ? `
IMPORTANT: This is the user's FIRST check-in. There are no patterns to compare yet.
- Acknowledge this is week 1 of tracking
- Summarize the current state factually
- Do NOT say things like "patterns will emerge" or "more data needed"
- Simply state what this week's numbers and responses show` : ''}

Good examples:
- "Revenue decreased 15% while hours worked increased 20%. This is the third week showing this pattern."
- "Satisfaction scores have ranged between 4-6 for five consecutive weeks."
- "Energy levels dropped from 8 to 4 over the past three weeks. Revenue remained stable during this period."
${isFirstCheckIn ? '- "First recorded week: $5,000 revenue on 40 hours with high satisfaction (8/10) and moderate energy (6/10)."' : ''}

Bad examples (DO NOT DO THIS):
- "You should consider raising your prices."
- "Try working fewer hours to improve your energy."
- "It might help to take a break."
- "Patterns will become clearer over time."

Remember: Describe patterns. Never prescribe actions.`,
      messages: [
        {
          role: 'user',
          content: `Analyze these check-ins and describe any observable patterns. Remember: only describe what you see in the data, never suggest what to do about it.

${checkInHistory}

Provide a brief (2-4 sentences) factual summary of patterns you observe.`,
        },
      ],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : null

    if (!summary) {
      return null
    }

    // Extra safety check: reject if it contains direct advice-giving phrases
    // Use phrase patterns that indicate advice, not just individual words
    const advicePhrases = [
      'you should',
      'you could',
      'you might',
      'consider ',  // with space to avoid "considerable"
      'try to',
      'try ',
      'i recommend',
      'i suggest',
      'would recommend',
      'would suggest',
      'might want to',
      'could help you',
      'would benefit from',
      'take action',
      'next step',
    ]

    const lowerSummary = summary.toLowerCase()
    const containsAdvice = advicePhrases.some((phrase) =>
      lowerSummary.includes(phrase)
    )

    if (containsAdvice) {
      const matchedPhrase = advicePhrases.find(p => lowerSummary.includes(p))
      console.warn(`[AI Summary] Rejected - contained advice phrase "${matchedPhrase}":`, summary)
      return 'Unable to generate pattern summary at this time.'
    }

    console.log('[AI Summary] Generated successfully:', summary.substring(0, 100) + '...')

    return summary
  } catch (error) {
    console.error('[AI Summary] Error generating summary:', error)
    return null
  }
}
