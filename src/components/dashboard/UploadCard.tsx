import { Camera, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'

export function UploadCard(props: {
  previewUrl: string | null
  onOpenPicker: () => void
  onClear: () => void
}) {
  return (
    <GlassCard className="p-5">
      <div className="text-sm font-semibold">Upload Plant Image</div>
      <div className="mt-1 text-xs text-ink-600 dark:text-ink-400">Drag and drop or click to select an image</div>

      <div className="mt-4">
        <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-glass backdrop-blur dark:border-white/10 dark:bg-white/10">
          {props.previewUrl ? (
            <img src={props.previewUrl} alt="Selected" className="h-[230px] w-full object-cover" />
          ) : (
            <div className="flex h-[230px] items-center justify-center text-sm text-ink-600 dark:text-ink-400">
              No image selected
            </div>
          )}

          {props.previewUrl ? (
            <button
              type="button"
              onClick={props.onClear}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-700 shadow-glass transition hover:bg-white dark:bg-white/10 dark:text-ink-200"
              aria-label="Remove image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={props.onOpenPicker}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 text-sm font-medium text-ink-700 shadow-glass backdrop-blur transition hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-ink-200 dark:hover:bg-white/15"
        >
          <Camera className="h-4 w-4" />
          {props.previewUrl ? 'Replace Image' : 'Select Image'}
        </button>
      </div>
    </GlassCard>
  )
}

