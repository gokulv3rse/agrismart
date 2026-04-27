/**
 * API helper — adds the Supabase access token to all API calls.
 */
import { supabase } from './supabaseClient'

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')
  return fetch(url, { ...options, headers })
}
