import { useMemo, useState } from 'react'
import { Leaf, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

type Mode = 'signin' | 'signup'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendInfo, setResendInfo] = useState<string | null>(null)
  const navigate = useNavigate()

  const canSubmit = useMemo(() => email.includes('@') && password.length >= 6, [email, password])

  const normalizeAuthError = (message: string) => {
    const m = message.toLowerCase()
    if (m.includes('email rate limit exceeded') || (m.includes('rate limit') && m.includes('email'))) {
      return 'Email rate limit exceeded. In Supabase: Authentication → Providers → Email, disable email confirmations for development or wait and try again.'
    }
    if (m.includes('email not confirmed') || m.includes('confirm your email')) {
      return 'Email not confirmed. Check your inbox for the confirmation link, or disable email confirmations for development in Supabase.'
    }
    return message
  }

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    setNotice(null)
    setResendInfo(null)

    try {
      if (mode === 'signin') {
        const res = await supabase.auth.signInWithPassword({ email, password })
        if (res.error) throw new Error(normalizeAuthError(res.error.message))
      } else {
        const res = await supabase.auth.signUp({ email, password })
        if (res.error) throw new Error(normalizeAuthError(res.error.message))
        if (!res.data.session) {
          setNotice('Account created. Check your email to confirm your account, then sign in.')
          setMode('signin')
          return
        }
      }
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setBusy(false)
    }
  }

  const resendConfirmation = async () => {
    if (!email.includes('@')) return
    setResendBusy(true)
    setError(null)
    setResendInfo(null)

    try {
      const res = await supabase.auth.resend({ type: 'signup', email })
      if (res.error) throw new Error(normalizeAuthError(res.error.message))
      setResendInfo('Confirmation email sent. Check your inbox and spam folder.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-app-light text-ink-900 dark:bg-app-dark dark:text-ink-100">
      <div className="mx-auto flex min-h-full max-w-[1200px] items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px] rounded-xl2 border border-black/5 bg-white/85 p-6 shadow-glass backdrop-blur dark:border-white/10 dark:bg-[rgba(36,41,31,0.85)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-500 dark:bg-white/10 dark:text-brand-400">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium">Automatic Sprinkling System</div>
              <div className="text-xs text-ink-600 dark:text-ink-400">Upload • Predict • Decide • Track</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-black/5 bg-white/60 p-1 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={
                mode === 'signin'
                  ? 'h-9 rounded-lg bg-brand-500 text-sm font-medium text-white'
                  : 'h-9 rounded-lg text-sm font-medium text-ink-600 hover:bg-black/5 dark:text-ink-400 dark:hover:bg-white/10'
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={
                mode === 'signup'
                  ? 'h-9 rounded-lg bg-brand-500 text-sm font-medium text-white'
                  : 'h-9 rounded-lg text-sm font-medium text-ink-600 hover:bg-black/5 dark:text-ink-400 dark:hover:bg-white/10'
              }
            >
              Sign up
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            <div>
              <label htmlFor="auth-email" className="text-xs font-medium text-ink-600 dark:text-ink-400">Email</label>
              <input
                id="auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="text-xs font-medium text-ink-600 dark:text-ink-400">Password</label>
              <input
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Minimum 6 characters"
                className="mt-2 h-10 w-full rounded-xl border border-black/5 bg-white/70 px-3 text-sm outline-none ring-brand-100 focus:ring-4 dark:border-white/10 dark:bg-white/10"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-semantic-danger/20 bg-white/70 px-3 py-2 text-sm text-semantic-danger shadow-glass backdrop-blur dark:border-semantic-dangerDark/30 dark:bg-white/10 dark:text-semantic-dangerDark">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-ink-700 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-200">
                {notice}
              </div>
            )}

            {resendInfo && (
              <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-ink-700 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-200">
                {resendInfo}
              </div>
            )}

            <button
              type="button"
              disabled={!canSubmit || busy}
              onClick={() => void submit()}
              className={
                !canSubmit || busy
                  ? 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-500/40 text-sm font-medium text-white/70'
                  : 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-medium text-white transition hover:bg-brand-700'
              }
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            {mode === 'signin' ? (
              <button
                type="button"
                disabled={resendBusy || !email.includes('@')}
                onClick={() => void resendConfirmation()}
                className={
                  resendBusy || !email.includes('@')
                    ? 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/5 bg-white/40 text-sm font-medium text-ink-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-400'
                    : 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/5 bg-white/70 text-sm font-medium text-ink-700 shadow-glass backdrop-blur transition hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:text-ink-200 dark:hover:bg-white/15'
                }
              >
                {resendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Resend confirmation email
              </button>
            ) : null}

            <div className="text-xs text-ink-600 dark:text-ink-400">
              By continuing you agree to use this as a demo system. No IoT control is executed.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
