import { describe, it, expect } from 'vitest'
import { recommendPalettes, paletteToGradientStops, type Palette } from '../paletteRecommender'
import type { GradientStop } from '../../types'

const makeStops = (count: number): GradientStop[] => {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
  return Array.from({ length: count }, (_, i) => ({
    id: `stop-${i}`,
    color: colors[i % colors.length],
    position: Math.round((i / Math.max(1, count - 1)) * 100),
  }))
}

describe('paletteRecommender - recommendPalettes 性能', () => {
  it('5个色标时计算时间不超过100ms', () => {
    const stops = makeStops(5)
    const t0 = performance.now()
    const result = recommendPalettes(stops, 5)
    const t1 = performance.now()
    const elapsed = t1 - t0
    expect(elapsed).toBeLessThanOrEqual(100)
    console.log(`[perf] 5个色标耗时: ${elapsed.toFixed(2)}ms`)
  })

  it('8个色标时计算时间不超过100ms', () => {
    const stops = makeStops(8)
    const t0 = performance.now()
    const result = recommendPalettes(stops, 5)
    const t1 = performance.now()
    const elapsed = t1 - t0
    expect(elapsed).toBeLessThanOrEqual(100)
    console.log(`[perf] 8个色标耗时: ${elapsed.toFixed(2)}ms`)
  })

  it('连续调用相同输入使用memoization，第二次更快', () => {
    const stops = makeStops(6)
    recommendPalettes(stops, 5)
    const t0 = performance.now()
    recommendPalettes(stops, 5)
    const t1 = performance.now()
    const elapsed = t1 - t0
    expect(elapsed).toBeLessThan(10)
    console.log(`[perf] memoized耗时: ${elapsed.toFixed(2)}ms`)
  })
})

describe('paletteRecommender - recommendPalettes 正确性', () => {
  it('返回指定数量的推荐方案', () => {
    const stops = makeStops(4)
    const result = recommendPalettes(stops, 3)
    expect(result.length).toBe(3)
  })

  it('默认返回最多5种方案', () => {
    const stops = makeStops(3)
    const result = recommendPalettes(stops)
    expect(result.length).toBeLessThanOrEqual(5)
    expect(result.length).toBeGreaterThanOrEqual(3)
  })

  it('每个方案都有id、name和三个颜色', () => {
    const stops = makeStops(3)
    const result = recommendPalettes(stops, 5)
    for (const palette of result) {
      expect(typeof palette.id).toBe('string')
      expect(palette.id.length).toBeGreaterThan(0)
      expect(typeof palette.name).toBe('string')
      expect(palette.name.length).toBeGreaterThan(0)
      expect(palette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(palette.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(palette.accent).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('不同渐变输入返回不同配色（主色应不同）', () => {
    const stopsA: GradientStop[] = [
      { id: '1', color: '#FF0000', position: 0 },
      { id: '2', color: '#FF8000', position: 100 },
    ]
    const stopsB: GradientStop[] = [
      { id: '1', color: '#0000FF', position: 0 },
      { id: '2', color: '#00FFFF', position: 100 },
    ]
    const palA = recommendPalettes(stopsA, 1)[0]
    const palB = recommendPalettes(stopsB, 1)[0]
    expect(palA.primary).not.toBe(palB.primary)
  })

  it('空色标仍然能返回结果', () => {
    const result = recommendPalettes([], 3)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('单个色标返回非空结果', () => {
    const stops = makeStops(1)
    const result = recommendPalettes(stops, 3)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('paletteRecommender - paletteToGradientStops', () => {
  const palette: Palette = {
    id: 'test',
    name: '测试',
    primary: '#FF0000',
    secondary: '#00FF00',
    accent: '#0000FF',
  }

  it('现有2个色标时返回2个结果', () => {
    const result = paletteToGradientStops(palette, 2)
    expect(result.length).toBe(2)
  })

  it('现有3个色标时返回3个结果', () => {
    const result = paletteToGradientStops(palette, 3)
    expect(result.length).toBe(3)
  })

  it('现有5个色标时返回5个结果，位置均匀分布', () => {
    const result = paletteToGradientStops(palette, 5)
    expect(result.length).toBe(5)
    expect(result[0].position).toBe(0)
    expect(result[4].position).toBe(100)
    result.forEach(s => {
      expect(s.position).toBeGreaterThanOrEqual(0)
      expect(s.position).toBeLessThanOrEqual(100)
    })
  })

  it('每个色标都包含有效颜色', () => {
    for (const count of [2, 3, 4, 5, 6, 8]) {
      const result = paletteToGradientStops(palette, count)
      expect(result.length).toBe(count)
      result.forEach(s => {
        expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(typeof s.position).toBe('number')
      })
    }
  })

  it('色标位置单调递增或相等', () => {
    const result = paletteToGradientStops(palette, 6)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].position).toBeGreaterThanOrEqual(result[i - 1].position)
    }
  })
})
