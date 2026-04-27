/**
 * Weather API proxy route.
 * Proxies requests to OpenWeatherMap and adds spray advisability logic.
 */
import { Router, type Response } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const lat = req.query.lat as string
  const lon = req.query.lon as string

  if (!lat || !lon) {
    res.status(400).json({ success: false, error: 'lat and lon query params are required' })
    return
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    res.status(500).json({ success: false, error: 'Missing OPENWEATHERMAP_API_KEY' })
    return
  }

  try {
    // Current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    const currentRes = await fetch(currentUrl)
    const currentData = await currentRes.json()

    if (!currentRes.ok) {
      res.status(502).json({ success: false, error: 'Weather API error', details: currentData })
      return
    }

    // 3-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=24`
    const forecastRes = await fetch(forecastUrl)
    const forecastData = await forecastRes.json()

    // Determine spray advisability
    const windSpeed = currentData.wind?.speed ?? 0
    const humidity = currentData.main?.humidity ?? 0
    const temp = currentData.main?.temp ?? 0
    const weatherMain = (currentData.weather?.[0]?.main ?? '').toLowerCase()
    const isRaining = ['rain', 'drizzle', 'thunderstorm'].includes(weatherMain)

    // Check forecast for upcoming rain
    const forecastList = forecastData.list ?? []
    const rainInForecast = forecastList.some((item: { weather?: Array<{ main?: string }> }) =>
      ['Rain', 'Drizzle', 'Thunderstorm'].includes(item.weather?.[0]?.main ?? '')
    )

    let sprayAdvisable = true
    const reasons: string[] = []

    if (isRaining) {
      sprayAdvisable = false
      reasons.push('Currently raining — spray will wash off')
    }
    if (windSpeed > 15) {
      sprayAdvisable = false
      reasons.push(`High wind speed (${windSpeed.toFixed(1)} km/h) — spray drift risk`)
    }
    if (temp > 35) {
      sprayAdvisable = false
      reasons.push(`High temperature (${temp.toFixed(1)}°C) — spray evaporation risk`)
    }
    if (temp < 5) {
      sprayAdvisable = false
      reasons.push(`Low temperature (${temp.toFixed(1)}°C) — reduced efficacy`)
    }
    if (rainInForecast) {
      reasons.push('Rain expected in the next 24 hours — consider timing')
    }

    if (sprayAdvisable && reasons.length === 0) {
      reasons.push('Conditions are suitable for spraying')
    }

    res.status(200).json({
      success: true,
      current: {
        temp: currentData.main?.temp,
        feelsLike: currentData.main?.feels_like,
        humidity,
        windSpeed,
        description: currentData.weather?.[0]?.description ?? 'Unknown',
        icon: currentData.weather?.[0]?.icon ?? '01d',
        main: currentData.weather?.[0]?.main ?? 'Clear',
      },
      sprayAdvisory: {
        advisable: sprayAdvisable,
        reasons,
        rainInForecast,
      },
      forecast: forecastList.slice(0, 8).map((item: {
        dt?: number
        main?: { temp?: number; humidity?: number }
        weather?: Array<{ main?: string; description?: string; icon?: string }>
        wind?: { speed?: number }
      }) => ({
        time: item.dt ? new Date(item.dt * 1000).toISOString() : '',
        temp: item.main?.temp,
        humidity: item.main?.humidity,
        weather: item.weather?.[0]?.main,
        description: item.weather?.[0]?.description,
        icon: item.weather?.[0]?.icon,
        windSpeed: item.wind?.speed,
      })),
    })
  } catch (err) {
    res.status(502).json({ success: false, error: 'Failed to fetch weather data' })
  }
})

export default router
