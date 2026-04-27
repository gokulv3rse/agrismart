/**
 * Server-side Supabase client for backend operations.
 * Uses the same project URL and anon key but runs in Node.js context.
 *
 * NOTE: dotenv is loaded here (not in app.ts) because ES module imports
 * are hoisted — so this file runs before dotenv.config() in app.ts.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

// Load .env before reading process.env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
}

/**
 * Creates a Supabase client authenticated with a user's JWT token.
 * This allows server-side queries to respect RLS policies.
 */
export function createSupabaseClient(accessToken?: string) {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  })
}

/**
 * Anon client for public/non-user-specific queries (e.g. spray_recipes read).
 */
export const supabaseAnon = createClient(supabaseUrl!, supabaseAnonKey!)
