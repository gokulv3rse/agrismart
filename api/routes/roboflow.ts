import { Router, type Request, type Response } from 'express'
import type { RoboflowRawResponse } from '../lib/decision.js'

const router = Router()

type InferBody = {
  modelId?: string
  imageUrl?: string
  confidence?: number
}

router.post('/infer', async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as InferBody
  const modelId = String(body.modelId ?? '')
  const imageUrl = String(body.imageUrl ?? '')
  const confidence = typeof body.confidence === 'number' ? body.confidence : undefined

  const allowedModels = new Set(['insect-pesticide/1', 'fertilizer-sprinkling/2'])
  if (!allowedModels.has(modelId)) {
    res.status(400).json({ success: false, error: 'Unsupported modelId' })
    return
  }

  if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
    res.status(400).json({ success: false, error: 'Invalid imageUrl' })
    return
  }

  const apiKey = process.env.ROBOFLOW_API_KEY
  if (!apiKey) {
    res.status(500).json({ success: false, error: 'Missing ROBOFLOW_API_KEY' })
    return
  }

  const base = 'https://detect.roboflow.com'
  const params = new URLSearchParams({
    api_key: apiKey,
    image: imageUrl,
  })
  if (confidence !== undefined) params.set('confidence', String(confidence))

  const url = `${base}/${encodeURIComponent(modelId)}?${params.toString()}`

  const rfRes = await fetch(url, { method: 'POST' })
  const text = await rfRes.text()
  if (!rfRes.ok) {
    res.status(502).json({ success: false, error: 'Roboflow request failed', details: text })
    return
  }

  let raw: RoboflowRawResponse
  try {
    raw = JSON.parse(text) as RoboflowRawResponse
  } catch {
    res.status(502).json({ success: false, error: 'Invalid Roboflow response', details: text })
    return
  }

  res.status(200).json({ success: true, raw })
})

export default router
