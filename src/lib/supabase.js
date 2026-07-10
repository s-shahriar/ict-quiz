import { createClient } from '@supabase/supabase-js'

// Single shared browser client. Config comes from Vite env (.env).
// The key here is the *publishable* key — safe to ship; Row-Level Security
// is what actually protects user data.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// `isSupabaseConfigured` lets the app degrade gracefully (offline / local JSON)
// when env is missing, instead of crashing at import time.
export const isSupabaseConfigured = Boolean(url && key)

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,       // keep the session across reloads
        autoRefreshToken: true,
        detectSessionInUrl: true,   // handle the magic-link redirect
      },
    })
  : null
