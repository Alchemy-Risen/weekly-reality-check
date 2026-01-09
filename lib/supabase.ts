import { createClient } from '@supabase/supabase-js'

// Client for browser/client components
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Admin client for server actions with elevated privileges
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types (we'll expand this as needed)
export type User = {
  id: string
  email: string
  timezone: string
  created_at: string
  updated_at: string
}

export type CheckIn = {
  id: string
  user_id: string
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
  ai_summary: string | null
  patterns_detected: Record<string, unknown> | null
  submitted_at: string
  created_at: string
}

export type QuestionSet = {
  id: string
  week_number: number
  questions: {
    q1: string
    q2: string
  }
  created_at: string
  updated_at: string
}

export type MagicToken = {
  id: string
  user_id: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
}
