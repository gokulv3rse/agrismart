import { describe, expect, it } from 'vitest'
import { decide } from './decision'

describe('decide', () => {
  it('returns no-spray when confidence is low', () => {
    const d = decide('insect-pesticide/1', {
      predictions: [{ class: 'aphids', confidence: 0.12 }],
    })
    expect(d.spray).toBe(false)
    expect(d.actionType).toBe('none')
  })

  it('supports Roboflow classification-style prediction objects', () => {
    const d = decide('insect-pesticide/1', {
      predictions: {
        aphids: { confidence: 0.91, class_id: 1 },
        healthy: { confidence: 0.12, class_id: 2 },
      },
    })
    expect(d.spray).toBe(true)
    expect(d.actionType).toBe('pesticide')
    expect(d.label).toBe('aphids')
  })

  it('returns pesticide action for pesticide model', () => {
    const d = decide('insect-pesticide/1', {
      predictions: [{ class: 'aphids', confidence: 0.92 }],
    })
    expect(d.spray).toBe(true)
    expect(d.actionType).toBe('pesticide')
  })

  it('returns fertilizer action for fertilizer model', () => {
    const d = decide('fertilizer-sprinkling/2', {
      predictions: [{ class: 'nitrogen_deficiency', confidence: 0.88 }],
    })
    expect(d.spray).toBe(true)
    expect(d.actionType).toBe('fertilizer')
  })
})
