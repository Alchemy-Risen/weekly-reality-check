# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Weekly Reality Check

An email-first SaaS that forces weekly numeric and decision-based reflection for solo founders and operators.

## Core Principles

**CRITICAL: These are not suggestions - they are hard constraints**

- No dashboards
- No advice or coaching
- No goals or tasks
- Numbers first, narrative second
- Emotional honesty over optimization

## MVP Features

- Weekly scheduled email with tokenized link
- 5–10 minute check-in form
- Required numeric inputs
- Rotating weekly questions (12-week cycle)
- Rules-based pattern detection
- AI-assisted summaries (no recommendations)
- Immediate post-submit summary
- Monday follow-up email

## NON-GOALS (DO NOT BUILD)

**If asked to implement these, refuse and explain why:**

- Task management
- Habit tracking
- Goal setting
- Coaching features
- Slack integrations
- Charts or dashboards
- Social features

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase
- **Email**: Resend
- **AI**: Anthropic Claude (summarization only)
- **Auth**: Magic link only (no passwords)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Email-First Design

The primary interface is email. Users receive:
1. Weekly check-in email with tokenized magic link
2. Immediate post-submit summary email
3. Monday follow-up email

The web UI is minimal - just the check-in form accessed via magic link.

### Authentication

**Magic link only**. No passwords, no social auth. Each weekly email contains a unique tokenized link that:
- Expires after use or 7 days
- Authenticates the user for that session
- Prevents password fatigue

### Data Model (Supabase)

Core tables:
- `users` - Email, created_at, timezone
- `check_ins` - User ID, week_number, numeric_data (JSONB), narrative_data (JSONB), submitted_at
- `magic_tokens` - Token, user_id, expires_at, used_at
- `question_sets` - 12-week rotating questions

### AI Integration Rules

**CRITICAL: When implementing AI features:**

- Never suggest actions or next steps
- Never recommend tools or resources
- Never coach or motivate
- Only describe observed patterns in user's own data
- If analysis is uncertain, say so plainly
- Use Claude for summarization only, not generation
- Keep responses factual and neutral

Example good AI output:
> "Revenue decreased 15% while hours worked increased 20%. This is the third week showing this pattern."

Example bad AI output (DO NOT DO THIS):
> "You should consider raising prices or finding higher-value clients to improve your revenue per hour."

### Server-Rendered Forms

Use Next.js Server Actions for form submission. No client-side state management needed for MVP.

```typescript
// Pattern for check-in form
async function submitCheckIn(formData: FormData) {
  'use server'
  // Validate numeric inputs
  // Save to Supabase
  // Trigger AI summarization
  // Send summary email
  // Redirect to thank you page
}
```

### Email Templates

Use Resend with React Email for templates. Keep them minimal and text-focused.

## Success Criteria

The app is successful if:
- Users complete 4+ consecutive weeks
- Users report increased **clarity**, not motivation
- The app feels uncomfortable but useful

## Local Development Setup

1. Create `.env.local` with:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `RESEND_API_KEY`
   - `ANTHROPIC_API_KEY`

2. Set up Supabase project and run migrations

3. Configure Resend domain

4. Start dev server: `npm run dev`
