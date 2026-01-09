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
    console.log('⚠️  Anthropic API key not configured. Skipping AI summary.')
    return null
  }

  try {
    const supabase = getSupabaseAdmin()

    // Fetch user's historical check-ins (last 12 weeks)
    const { data: previousCheckIns } = await supabase
      .from('check_ins')
      .select('week_number, year, numeric_data, narrative_data, submitted_at')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(12)

    const allCheckIns = previousCheckIns || []

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

    // Call Claude API with strict "no advice" system prompt
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more factual, less creative
      system: `You are analyzing weekly check-in data for a solo founder/operator.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. NEVER suggest actions, next steps, or recommendations
2. NEVER use phrases like "you should", "consider", "try", "might want to"
3. NEVER give advice, coaching, or motivation
4. ONLY describe observable patterns in the data
5. Use factual, neutral language
6. If you're uncertain about a pattern, say so plainly
7. Focus on what IS happening, not what SHOULD happen
8. Keep it brief (2-4 sentences maximum)

Good examples:
- "Revenue decreased 15% while hours worked increased 20%. This is the third week showing this pattern."
- "Satisfaction scores have ranged between 4-6 for five consecutive weeks."
- "Energy levels dropped from 8 to 4 over the past three weeks. Revenue remained stable during this period."

Bad examples (DO NOT DO THIS):
- "You should consider raising your prices."
- "Try working fewer hours to improve your energy."
- "It might help to take a break."

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

    // Extra safety check: reject if it contains advice-giving phrases
    const adviceWords = [
      'should',
      'consider',
      'try',
      'might want',
      'recommend',
      'suggest',
      'could help',
      'would benefit',
    ]

    const containsAdvice = adviceWords.some((word) =>
      summary.toLowerCase().includes(word)
    )

    if (containsAdvice) {
      console.warn('AI summary contained advice words, rejecting:', summary)
      return 'Unable to generate pattern summary at this time.'
    }

    return summary
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return null
  }
}
