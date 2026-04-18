import { Link } from 'react-router-dom'
import { Save } from 'lucide-react'

export function BottomActionBar(props: { latestId: string | null }) {
  return (
    <div className="mt-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-black/5 bg-white/70 p-3 shadow-glass backdrop-blur sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/10">
      {props.latestId ? (
        <Link
          to={`/results/${props.latestId}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/80 px-5 text-sm font-semibold text-ink-700 shadow-glass transition hover:bg-white dark:bg-white/10 dark:text-ink-200 dark:hover:bg-white/15"
        >
          <Save className="h-4 w-4" />
          Save Result
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black/5 px-5 text-sm font-semibold text-ink-600/60 dark:bg-white/10 dark:text-ink-400/60"
        >
          <Save className="h-4 w-4" />
          Save Result
        </button>
      )}

      <Link
        to="/history"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-900"
      >
        View in History
      </Link>
    </div>
  )
}

