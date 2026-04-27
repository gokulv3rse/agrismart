/**
 * JWT authentication middleware for Express routes.
 * Verifies the caller has a valid Supabase session before allowing access.
 */
import type { Request, Response, NextFunction } from 'express'
import { createSupabaseClient } from '../lib/supabaseAdmin.js'

export interface AuthenticatedRequest extends Request {
  userId?: string
  accessToken?: string
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' })
    return
  }

  const token = authHeader.slice(7)

  // Verify the token by calling Supabase getUser
  const supabase = createSupabaseClient(token)
  supabase.auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
      return
    }
    req.userId = data.user.id
    req.accessToken = token
    next()
  }).catch(() => {
    res.status(401).json({ success: false, error: 'Authentication failed' })
  })
}
