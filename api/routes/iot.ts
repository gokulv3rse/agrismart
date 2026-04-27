/**
 * IoT simulation routes.
 * Simulates a sprinkler control system for demo/presentation purposes.
 * In a real system, this would interface with MQTT/CoAP IoT protocols.
 */
import { Router, type Response } from 'express'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

// In-memory simulated sprinkler state (per user)
const sprinklerState: Record<string, {
  isOn: boolean
  zone: string
  flowRate: number
  startedAt: string | null
  tankLevelPesticide: number
  tankLevelFertilizer: number
  lastUpdated: string
}> = {}

function getState(userId: string) {
  if (!sprinklerState[userId]) {
    sprinklerState[userId] = {
      isOn: false,
      zone: 'Zone A',
      flowRate: 0,
      startedAt: null,
      tankLevelPesticide: 85,
      tankLevelFertilizer: 72,
      lastUpdated: new Date().toISOString(),
    }
  }
  return sprinklerState[userId]
}

router.get('/sprinkler/status', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const state = getState(req.userId!)
  // Simulate tank drain if sprinkler is running
  if (state.isOn && state.startedAt) {
    const elapsed = (Date.now() - new Date(state.startedAt).getTime()) / 60000 // minutes
    state.tankLevelPesticide = Math.max(0, 85 - elapsed * 0.5)
    state.tankLevelFertilizer = Math.max(0, 72 - elapsed * 0.3)
  }
  res.status(200).json({ success: true, sprinkler: state })
})

router.post('/sprinkler/start', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { zone, flowRate } = req.body ?? {}
  const state = getState(req.userId!)
  state.isOn = true
  state.zone = zone || 'Zone A'
  state.flowRate = flowRate || 2.5
  state.startedAt = new Date().toISOString()
  state.lastUpdated = new Date().toISOString()
  res.status(200).json({ success: true, sprinkler: state })
})

router.post('/sprinkler/stop', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const state = getState(req.userId!)
  state.isOn = false
  state.flowRate = 0
  state.startedAt = null
  state.lastUpdated = new Date().toISOString()
  res.status(200).json({ success: true, sprinkler: state })
})

export default router
