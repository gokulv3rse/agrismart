import { useEffect, useState } from 'react'
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, CheckCircle } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { apiFetch } from '@/lib/apiFetch'
import type { WeatherData } from '@/lib/types'

const WEATHER_ICONS: Record<string, typeof Sun> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Thunderstorm: CloudRain,
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true)
      try {
        // Try to get user location, fallback to Delhi
        let lat = 28.6139
        let lon = 77.209

        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          lat = pos.coords.latitude
          lon = pos.coords.longitude
        } catch {
          // Use default location
        }

        const savedLat = localStorage.getItem('weather_lat')
        const savedLon = localStorage.getItem('weather_lon')
        if (savedLat && savedLon) {
          lat = Number(savedLat)
          lon = Number(savedLon)
        }

        const res = await apiFetch(`/api/weather?lat=${lat}&lon=${lon}`)
        const data = await res.json()
        if (data.success) {
          setWeather(data as WeatherData)
          setError(null)
        } else {
          setError(data.error || 'Failed to load weather')
        }
      } catch {
        setError('Weather unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 15 * 60 * 1000) // Refresh every 15 min
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
          <Cloud className="h-4 w-4 animate-pulse" />
          Loading weather…
        </div>
      </GlassCard>
    )
  }

  if (error || !weather) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
          <Cloud className="h-4 w-4" />
          {error || 'Weather unavailable'}
        </div>
      </GlassCard>
    )
  }

  const WeatherIcon = WEATHER_ICONS[weather.current.main] || Cloud
  const advisable = weather.sprayAdvisory.advisable

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-ink-600 dark:text-ink-400">Weather & Spray Advisory</div>
          <div className="mt-2 flex items-center gap-3">
            <WeatherIcon className="h-8 w-8 text-brand-500 dark:text-brand-400" />
            <div>
              <div className="text-2xl font-semibold">{Math.round(weather.current.temp)}°C</div>
              <div className="text-xs text-ink-600 dark:text-ink-400 capitalize">{weather.current.description}</div>
            </div>
          </div>
        </div>
        <div className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
          advisable
            ? 'bg-semantic-success/15 text-semantic-success'
            : 'bg-semantic-danger/15 text-semantic-danger dark:text-semantic-dangerDark'
        }`}>
          {advisable ? (
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Spray OK</span>
          ) : (
            <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Don't Spray</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-ink-600 dark:text-ink-400">
        <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather.current.windSpeed} km/h</span>
        <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {weather.current.humidity}%</span>
        <span>Feels {Math.round(weather.current.feelsLike)}°C</span>
      </div>

      {weather.sprayAdvisory.reasons.length > 0 && (
        <div className="mt-3 space-y-1">
          {weather.sprayAdvisory.reasons.map((reason, i) => (
            <div key={i} className="text-xs text-ink-600 dark:text-ink-400">
              {advisable ? '✓' : '⚠'} {reason}
            </div>
          ))}
        </div>
      )}

      {weather.forecast.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {weather.forecast.slice(0, 6).map((f, i) => (
            <div key={i} className="flex min-w-[52px] flex-col items-center rounded-lg bg-neutral-200/50 px-2 py-1.5 dark:bg-ink-600/30">
              <div className="text-[10px] text-ink-600 dark:text-ink-400">
                {new Date(f.time).getHours()}:00
              </div>
              <div className="text-xs font-medium mt-0.5">{Math.round(f.temp)}°</div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}
