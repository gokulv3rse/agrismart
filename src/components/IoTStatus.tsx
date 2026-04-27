import { useEffect, useState, useCallback } from 'react'
import { Droplets, Power, Gauge } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { apiFetch } from '@/lib/apiFetch'
import type { SprinklerStatus } from '@/lib/types'

export function IoTStatus() {
  const [status, setStatus] = useState<SprinklerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/iot/sprinkler/status')
      const data = await res.json()
      if (data.success) setStatus(data.sprinkler)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const toggle = async () => {
    if (!status || toggling) return
    setToggling(true)
    try {
      const endpoint = status.isOn ? '/api/iot/sprinkler/stop' : '/api/iot/sprinkler/start'
      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ zone: 'Zone A', flowRate: 2.5 }) })
      const data = await res.json()
      if (data.success) setStatus(data.sprinkler)
    } catch {
      // Silently fail
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
          <Droplets className="h-4 w-4 animate-pulse" />
          Loading sprinkler status…
        </div>
      </GlassCard>
    )
  }

  if (!status) return null

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-ink-600 dark:text-ink-400">IoT Sprinkler Control</div>
          <div className="mt-2 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              status.isOn
                ? 'bg-semantic-success/15 text-semantic-success'
                : 'bg-black/5 text-ink-600 dark:bg-white/10 dark:text-ink-400'
            }`}>
              <Droplets className={`h-5 w-5 ${status.isOn ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="text-sm font-medium">{status.isOn ? 'Sprinkler Active' : 'Sprinkler Off'}</div>
              <div className="text-xs text-ink-600 dark:text-ink-400">{status.zone}</div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={toggling}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
            status.isOn
              ? 'bg-semantic-danger/15 text-semantic-danger hover:bg-semantic-danger/25 dark:text-semantic-dangerDark'
              : 'bg-semantic-success/15 text-semantic-success hover:bg-semantic-success/25'
          } ${toggling ? 'opacity-50' : ''}`}
        >
          <Power className="h-3 w-3" />
          {status.isOn ? 'Stop' : 'Start'}
        </button>
      </div>

      {status.isOn && (
        <div className="mt-3 flex items-center gap-2 text-xs text-ink-600 dark:text-ink-400">
          <Gauge className="h-3 w-3" />
          Flow: {status.flowRate} L/min
          {status.startedAt && (
            <span>• Running since {new Date(status.startedAt).toLocaleTimeString()}</span>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-neutral-200/50 p-2 dark:bg-ink-600/30">
          <div className="text-[10px] font-medium text-ink-600 dark:text-ink-400">Pesticide Tank</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-300 dark:bg-ink-600/50">
            <div
              className="h-full rounded-full bg-semantic-warning transition-all duration-500"
              style={{ width: `${Math.max(2, Math.round(status.tankLevelPesticide))}%` }}
            />
          </div>
          <div className="mt-0.5 text-[10px] text-ink-600 dark:text-ink-400">{Math.round(status.tankLevelPesticide)}%</div>
        </div>
        <div className="rounded-lg bg-neutral-200/50 p-2 dark:bg-ink-600/30">
          <div className="text-[10px] font-medium text-ink-600 dark:text-ink-400">Fertilizer Tank</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-300 dark:bg-ink-600/50">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${Math.max(2, Math.round(status.tankLevelFertilizer))}%` }}
            />
          </div>
          <div className="mt-0.5 text-[10px] text-ink-600 dark:text-ink-400">{Math.round(status.tankLevelFertilizer)}%</div>
        </div>
      </div>
    </GlassCard>
  )
}
