import { useMemo, useState } from 'react'
import { Leaf, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/GlassCard'

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
    <div className="flex min-h-screen bg-neutral-200 dark:bg-ink-900 text-ink-900 dark:text-ink-100 font-sans items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <GlassCard className="p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink-900 dark:text-ink-50">AgriSmart AI</h1>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Intelligent Crop Diagnostic Platform</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-neutral-200/50 p-1 dark:bg-ink-900/50">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition-all",
                mode === 'signin'
                  ? "bg-white text-brand-700 shadow-sm dark:bg-ink-600 dark:text-brand-400"
                  : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition-all",
                mode === 'signup'
                  ? "bg-white text-brand-700 shadow-sm dark:bg-ink-600 dark:text-brand-400"
                  : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100"
              )}
            >
              Sign up
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Email Address</label>
              <input
                id="auth-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-ink-900 dark:text-ink-100">Password</label>
              <input
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Minimum 6 characters"
                className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-ink-600/50 dark:bg-ink-900"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm font-medium text-ink-900 dark:border-ink-600/50 dark:bg-ink-800 dark:text-ink-100">
                {notice}
              </div>
            )}

            {resendInfo && (
              <div className="rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm font-medium text-ink-900 dark:border-ink-600/50 dark:bg-ink-800 dark:text-ink-100">
                {resendInfo}
              </div>
            )}

            <button
              type="button"
              disabled={!canSubmit || busy}
              onClick={() => void submit()}
              className={cn(
                "mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all shadow-sm",
                !canSubmit || busy
                  ? "bg-brand-500/50 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600 hover:shadow"
              )}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            {mode === 'signin' && (
              <button
                type="button"
                disabled={resendBusy || !email.includes('@')}
                onClick={() => void resendConfirmation()}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-ink-900 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-ink-600/50 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800"
              >
                {resendBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Resend confirmation email
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
