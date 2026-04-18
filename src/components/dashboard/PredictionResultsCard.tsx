import { GlassCard } from '@/components/GlassCard'
import type { NormalizedPrediction } from '@/lib/roboflow'
import type { Diagnosis } from '@/lib/types'
import { percent } from '@/lib/dashboardFormat'
import { ProgressBar } from './ProgressBar'

export function PredictionResultsCard(props: {
  badge: string
  latest: Diagnosis | null
  predictions: NormalizedPrediction[]
}) {
  const top = props.predictions.length ? props.predictions[0] : { label: 'unknown', confidence: 0 }

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Prediction Results</div>
          <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Top prediction and all scores.</div>
        </div>
        <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-white/10 dark:text-brand-400">
          {props.badge}
        </div>
      </div>

      {!props.latest ? (
        <div className="mt-5 rounded-2xl border border-black/5 bg-white/55 p-4 text-sm text-ink-600 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-400">
          Upload an image and click “Get Prediction” to see results.
        </div>
      ) : (
        <div className="mt-5">
          <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Top Prediction</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="text-base font-semibold text-[#1d2a1f] dark:text-ink-100">{top.label}</div>
            <div className="text-sm font-semibold text-[#1d2a1f] dark:text-ink-100">{percent(top.confidence)}%</div>
          </div>
          <div className="mt-2">
            <ProgressBar value={top.confidence} />
          </div>

          <div className="mt-5 text-xs font-medium text-ink-600 dark:text-ink-400">All Predictions</div>
          <div className="mt-3 grid gap-2">
            {props.predictions.slice(0, 6).map((p) => (
              <div key={`${p.label}-${p.confidence}`} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="font-medium text-[#1d2a1f] dark:text-ink-100">{p.label}</div>
                  <div className="text-ink-600 dark:text-ink-400">{percent(p.confidence)}%</div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-brand-700/80"
                    style={{ width: `${Math.max(2, Math.min(100, Math.round(p.confidence * 100)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-ink-600 dark:text-ink-400">Analyzed at {new Date(props.latest.created_at).toLocaleString()}</div>
        </div>
      )}
    </GlassCard>
  )
}

