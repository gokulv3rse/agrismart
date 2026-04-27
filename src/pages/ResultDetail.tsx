import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { GlassCard } from '@/components/GlassCard'
import { supabase } from '@/lib/supabaseClient'
import { normalizeRoboflowPredictions } from '@/lib/roboflow'
import { generateDiagnosisReport } from '@/lib/reportGenerator'
import type { Diagnosis } from '@/lib/types'
import { ArrowLeft, Download, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function ResultDetail() {
  const { id } = useParams<{ id: string }>()
  const [row, setRow] = useState<Diagnosis | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!id) return
      setBusy(true)
      setError(null)
      setRow(null)
      setImageUrl(null)

      const res = await supabase.from('diagnoses').select('*').eq('id', id).single()
      if (res.error) {
        setError(res.error.message)
        setBusy(false)
        return
      }

      const data = res.data as unknown as Diagnosis
      setRow(data)

      const signed = await supabase.storage
        .from(data.image_bucket)
        .createSignedUrl(data.image_path, 60 * 10)
      if (!signed.error && signed.data?.signedUrl) setImageUrl(signed.data.signedUrl)
      setBusy(false)
    }

    void run()
  }, [id])

  const topPreds = useMemo(() => {
    if (!row?.raw_inference) return []
    return normalizeRoboflowPredictions(row.raw_inference)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8)
  }, [row])

  const handleDownloadReport = async () => {
    if (!row) return
    setDownloading(true)
    try {
      await generateDiagnosisReport(row, imageUrl)
    } catch {
      // Silently fail
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/history"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 bg-white text-ink-600 transition-colors hover:bg-neutral-100 hover:text-ink-900 dark:border-ink-600/50 dark:bg-ink-900 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Diagnosis Report</h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-500 font-mono tracking-tight dark:text-ink-400">{id}</p>
          </div>
        </div>
        {row && (
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={downloading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-900 px-6 font-semibold text-white transition-all shadow-sm hover:bg-ink-950 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </button>
        )}
      </div>

      {busy && (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white/50 dark:border-ink-600/30 dark:bg-ink-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          <span className="text-sm font-medium text-ink-600">Loading report...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-semantic-danger/20 bg-semantic-danger/5 px-4 py-3 text-sm font-medium text-semantic-danger dark:border-semantic-dangerDark/30 dark:text-semantic-dangerDark">
          {error}
        </div>
      )}

      {row && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <GlassCard className="overflow-hidden flex flex-col">
            {imageUrl ? (
              <div className="relative bg-neutral-100 dark:bg-ink-950/50 flex items-center justify-center min-h-[300px] border-b border-neutral-200 dark:border-ink-600/50">
                <img src={imageUrl} alt="Uploaded Leaf" className="max-h-[460px] w-full object-contain p-4" />
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center bg-neutral-100 text-sm font-medium text-ink-500 dark:bg-ink-950/50 dark:text-ink-500">Image unavailable</div>
            )}
            
            <div className="p-6 md:p-8 flex-1 flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">Final Analysis</h3>
                  <div className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50 capitalize">
                      {row.decision.label.includes('___')
                        ? row.decision.label.split('___').map((s: string) => s.replace(/_/g, ' ')).join(' — ')
                        : row.decision.label.replace(/_/g, ' ')}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-400">
                        Model: {row.decision.ruleVersion}
                    </span>
                  </div>
                </div>
                
                {row.decision.spray ? (
                  <div className="flex items-center gap-2 rounded-full bg-semantic-danger/10 px-4 py-2 font-bold text-semantic-danger">
                    <ShieldAlert className="h-5 w-5" />
                    Action Required
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-semantic-success/10 px-4 py-2 font-bold text-semantic-success">
                    <ShieldCheck className="h-5 w-5" />
                    Healthy
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-ink-600 dark:text-ink-400 mb-2">
                  <span>Confidence Score</span>
                  <span className="text-brand-600 dark:text-brand-400">{Math.round(row.decision.confidence * 100)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-ink-600/50">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(2, Math.min(100, Math.round(row.decision.confidence * 100)))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 dark:border-brand-500/20 dark:bg-brand-500/5 mt-auto">
                <h4 className="text-sm font-bold uppercase tracking-wider text-brand-800/80 dark:text-brand-300/80 mb-4">Treatment Plan</h4>
                
                <div className="space-y-4 text-sm font-medium">
                  <div>
                    <span className="block font-semibold text-lg text-brand-900 dark:text-brand-100">{row.decision.recommendation}</span>
                  </div>
                  
                  {row.decision.actionType !== 'none' && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-200/50 dark:border-brand-500/10">
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700/60 dark:text-brand-300/60 mb-1">Dosage</span>
                        <span className="block text-brand-900 dark:text-brand-100">{row.decision.dosage}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700/60 dark:text-brand-300/60 mb-1">Treatment Type</span>
                        <span className="inline-flex rounded-md bg-brand-200/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">
                           {row.decision.actionType}
                        </span>
                      </div>
                    </div>
                  )}

                  {(row.decision.notes || row.decision.reason) && (
                     <div className="pt-4 border-t border-brand-200/50 dark:border-brand-500/10 space-y-3">
                         {row.decision.reason && (
                             <div>
                               <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700/60 dark:text-brand-300/60 mb-1">Reason</span>
                               <span className="block text-brand-900 dark:text-brand-100">{row.decision.reason}</span>
                             </div>
                         )}
                         {row.decision.notes && (
                            <div>
                              <span className="block text-xs font-semibold uppercase tracking-wider text-brand-700/60 dark:text-brand-300/60 mb-1">Notes</span>
                              <span className="block text-brand-900 dark:text-brand-100">{row.decision.notes}</span>
                            </div>
                         )}
                     </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs font-medium text-ink-500 flex items-center justify-between">
                <span>Date: {new Date(row.created_at).toLocaleString()}</span>
                <span>Engine: {row.model_id}</span>
              </div>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-6">
            <GlassCard className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100 mb-1">Raw Model Output</h2>
              <p className="text-xs font-medium text-ink-500 mb-6">Top probability classes calculated before rules engine application.</p>

              <div className="grid gap-3">
                {topPreds.length === 0 ? (
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 p-5 text-center text-sm font-medium text-ink-500 dark:border-ink-600/30 dark:bg-ink-900/50 dark:text-ink-400">
                    No confidence scores stored.
                  </div>
                ) : (
                  topPreds.map((p, idx) => (
                    <div
                      key={`${p.label}-${p.confidence}`}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-ink-600/50 dark:bg-ink-900/50"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="text-sm font-semibold capitalize text-ink-900 dark:text-ink-100 line-clamp-1">
                          {p.label.includes('___')
                            ? p.label.split('___').map((s: string) => s.replace(/_/g, ' ')).join(' — ')
                            : p.label.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs font-bold text-ink-600 dark:text-ink-400 whitespace-nowrap">{Math.round(p.confidence * 100)}%</div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-ink-800">
                        <div className="h-full rounded-full bg-brand-400 opacity-80" style={{ width: `${Math.max(2, Math.min(100, Math.round(p.confidence * 100)))}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
            
            {/* Can add another card here if needed later */}
          </div>
        </div>
      )}
    </AppShell>
  )
}
