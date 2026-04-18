import { GlassCard } from '@/components/GlassCard'

export type DashboardModelOption = {
  id: string
  label: string
  helper: string
}

export function ModelSelectCard(props: {
  models: DashboardModelOption[]
  selectedId: string
  onSelect: (id: string) => void
  error: string | null
  canRun: boolean
  busy: boolean
  onRun: () => void
}) {
  return (
    <GlassCard className="p-5">
      <div className="text-sm font-semibold">Select Model</div>
      <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Choose the analysis type for your plant image</div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {props.models.map((m) => {
          const active = m.id === props.selectedId
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => props.onSelect(m.id)}
              className={
                active
                  ? 'rounded-2xl border border-brand-700/30 bg-brand-100/60 p-4 text-left shadow-glass dark:border-white/10 dark:bg-white/10'
                  : 'rounded-2xl border border-black/5 bg-white/70 p-4 text-left shadow-glass backdrop-blur transition hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15'
              }
            >
              <div className="text-sm font-semibold text-[#1d2a1f] dark:text-ink-100">{m.label}</div>
              <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">{m.helper}</div>
            </button>
          )
        })}
      </div>

      {props.error ? (
        <div className="mt-4 rounded-2xl border border-semantic-danger/20 bg-white/70 px-4 py-3 text-sm text-semantic-danger shadow-glass backdrop-blur dark:border-semantic-dangerDark/30 dark:bg-white/10 dark:text-semantic-dangerDark">
          {props.error}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!props.canRun || props.busy}
        onClick={props.onRun}
        className={
          !props.canRun || props.busy
            ? 'mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-700/40 text-sm font-semibold text-white/80'
            : 'mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-700 text-sm font-semibold text-white transition hover:bg-brand-900'
        }
      >
        {props.busy ? 'Running…' : 'Get Prediction'}
      </button>
    </GlassCard>
  )
}

