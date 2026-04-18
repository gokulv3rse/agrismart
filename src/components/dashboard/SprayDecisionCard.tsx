import { CheckCircle2, Info } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import type { Diagnosis } from '@/lib/types'
import { percent, splitSafetyNotes } from '@/lib/dashboardFormat'

export function SprayDecisionCard(props: {
  latest: Diagnosis | null
  showWhy: boolean
  onToggleWhy: () => void
}) {
  return (
    <GlassCard className="p-5">
      <div className="text-sm font-semibold">Spray Decision</div>

      {!props.latest ? (
        <div className="mt-5 rounded-2xl border border-black/5 bg-white/55 p-4 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
          Run an analysis to see the decision.
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-white/10 dark:text-brand-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#1d2a1f] dark:text-ink-100">
                {props.latest.decision.spray ? 'Yes – Action Required' : 'No – No Action Required'}
              </div>
              <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">
                {props.latest.decision.spray ? 'Application recommended based on analysis.' : 'No application recommended based on analysis.'}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div>
              <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Recommended Product</div>
              <div className="mt-1 text-sm font-semibold text-[#1d2a1f] dark:text-ink-100">{props.latest.decision.recommendation}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Dosage</div>
              <div className="mt-1 text-sm font-medium text-[#1d2a1f] dark:text-ink-100">{props.latest.decision.dosage}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Safety Notes</div>
              <div className="mt-2 rounded-2xl border border-black/5 bg-white/55 p-3 text-sm text-ink-700 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-200">
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {splitSafetyNotes(props.latest.decision.notes || 'Wear protective gear. Avoid spraying during rain or strong wind.').map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={props.onToggleWhy}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <Info className="h-4 w-4" />
            Why this decision?
          </button>

          {props.showWhy ? (
            <div className="mt-3 rounded-2xl border border-black/5 bg-white/55 p-4 text-sm text-ink-700 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-200">
              <div className="text-xs font-medium">Reason</div>
              <div className="mt-1 text-xs">{props.latest.decision.reason}</div>
              <div className="mt-3 text-xs text-ink-600 dark:text-ink-400">Rule: {props.latest.decision.ruleVersion}</div>
              <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">
                Top class: {props.latest.decision.label} ({percent(props.latest.decision.confidence)}%)
              </div>
            </div>
          ) : null}
        </div>
      )}
    </GlassCard>
  )
}

