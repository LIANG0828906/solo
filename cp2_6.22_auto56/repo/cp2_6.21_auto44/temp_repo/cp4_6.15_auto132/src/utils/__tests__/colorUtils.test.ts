import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToLab,
  deltaE94,
  colorDifference,
  generateHarmoniousColors,
  lighten,
  darken,
  saturate,
  isValidHex,
  normalizeHex,
  getContrastColor,
} from '../colorUtils'

describe('colorUtils - 色值转换', () => {
  describe('hexToRgb / rgbToHex 往返转换', () => {
    it('转换标准6位HEX到RGB并返回', () => {
      const hex = '#FF5733'
      const rgb = hexToRgb(hex)
      expect(rgb).toEqual({ r: 255, g: 87, b: 51 })
      const backHex = rgbToHex(rgb).toUpperCase()
      expect(backHex).toBe(hex)
    })

    it('转换3位HEX缩写', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#0f0')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 })
    })

    it('边界情况：纯黑纯白', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      const blackHex = rgbToHex({ r: 0, g: 0, b: 0 }).toUpperCase()
      expect(blackHex).toBe('#000000')
      const whiteHex = rgbToHex({ r: 255, g: 255, b: 255 }).toUpperCase()
      expect(whiteHex).toBe('#FFFFFF')
    })

    it('rgbToHex 限制值在0-255范围', () => {
      const clamped = rgbToHex({ r: -10, g: 300, b: 128 }).toUpperCase()
      expect(clamped).toBe('#00FF80')
    })

    it('无效HEX返回默认值', () => {
      expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#GGGGGG')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('rgbToHsl / hslToRgb 往返转换', () => {
    it('转换纯红到HSL并返回', () => {
      const rgb = { r: 255, g: 0, b: 0 }
      const hsl = rgbToHsl(rgb)
      expect(Math.round(hsl.h)).toBe(0)
      expect(Math.round(hsl.s)).toBe(100)
      expect(Math.round(hsl.l)).toBe(50)
      const back = hslToRgb(hsl)
      expect(Math.round(back.r)).toBe(255)
      expect(Math.round(back.g)).toBe(0)
      expect(Math.round(back.b)).toBe(0)
    })

    it('灰色饱和度为0', () => {
      const hsl = rgbToHsl({ r: 128, g: 128, b: 128 })
      expect(hsl.s).toBe(0)
    })

    it('边界HSL值往返精度', () => {
      const cases = [
        { h: 0, s: 50, l: 50, tolH: 2, tolS: 2, tolL: 2 },
        { h: 359, s: 50, l: 50, tolH: 3, tolS: 2, tolL: 2 },
        { h: 180, s: 100, l: 50, tolH: 2, tolS: 2, tolL: 2 },
        { h: 60, s: 80, l: 40, tolH: 2, tolS: 2, tolL: 2 },
        { h: 270, s: 30, l: 70, tolH: 3, tolS: 3, tolL: 2 },
      ]
      for (const c of cases) {
        const rgb = hslToRgb({ h: c.h, s: c.s, l: c.l })
        const back = rgbToHsl(rgb)
        let hDiff = Math.abs(back.h - c.h)
        if (hDiff > 180) hDiff = 360 - hDiff
        expect(hDiff).toBeLessThan(c.tolH)
        expect(Math.abs(back.s - c.s)).toBeLessThan(c.tolS)
        expect(Math.abs(back.l - c.l)).toBeLessThan(c.tolL)
      }
    })

    it('HSL到RGB：纯黑纯白灰色正确处理', () => {
      const black = hslToRgb({ h: 0, s: 0, l: 0 })
      expect(Math.round(black.r)).toBe(0)
      expect(Math.round(black.g)).toBe(0)
      expect(Math.round(black.b)).toBe(0)

      const white = hslToRgb({ h: 0, s: 100, l: 100 })
      expect(Math.round(white.r)).toBe(255)
      expect(Math.round(white.g)).toBe(255)
      expect(Math.round(white.b)).toBe(255)
      const whiteHsl = rgbToHsl(white)
      expect(whiteHsl.l).toBeCloseTo(100, 0)
    })
  })

  describe('rgbToLab 转换', () => {
    it('纯白色LAB值接近 (100, 0, 0)', () => {
      const lab = rgbToLab({ r: 255, g: 255, b: 255 })
      expect(lab.l).toBeGreaterThan(99)
      expect(lab.l).toBeLessThan(101)
      expect(Math.abs(lab.a)).toBeLessThan(1)
      expect(Math.abs(lab.b)).toBeLessThan(1)
    })

    it('纯黑色LAB值约为 (0, 0, 0)', () => {
      const lab = rgbToLab({ r: 0, g: 0, b: 0 })
      expect(lab.l).toBeGreaterThan(-1)
      expect(lab.l).toBeLessThan(1)
    })

    it('中灰色LAB值约为53.5', () => {
      const lab = rgbToLab({ r: 128, g: 128, b: 128 })
      expect(lab.l).toBeGreaterThan(50)
      expect(lab.l).toBeLessThan(57)
    })
  })
})

describe('colorUtils - CIE94 色差计算 (deltaE94)', () => {
  it('相同颜色色差为0', () => {
    const lab = { l: 50, a: 20, b: 30 }
    expect(deltaE94(lab, lab)).toBe(0)
  })

  it('黑白之间有显著色差', () => {
    const white = rgbToLab({ r: 255, g: 255, b: 255 })
    const black = rgbToLab({ r: 0, g: 0, b: 0 })
    const de = deltaE94(white, black)
    expect(de).toBeGreaterThan(50)
    expect(de).toBeLessThan(150)
  })

  it('相同HEX颜色colorDifference为0', () => {
    expect(colorDifference('#FF0000', '#FF0000')).toBe(0)
    expect(colorDifference('#123ABC', '#123ABC')).toBe(0)
  })

  it('相似颜色色差小于明显不同的颜色', () => {
    const similar = colorDifference('#FF0000', '#FF2222')
    const different = colorDifference('#FF0000', '#00FF00')
    expect(similar).toBeLessThan(different)
    expect(similar).toBeGreaterThan(0)
    expect(different).toBeGreaterThan(50)
  })

  it('CIE94 graphic vs textiles 参数差异', () => {
    const a = rgbToLab({ r: 200, g: 100, b: 50 })
    const b = rgbToLab({ r: 180, g: 120, b: 80 })
    const deGraphic = deltaE94(a, b, 'graphic')
    const deTextiles = deltaE94(a, b, 'textiles')
    expect(deGraphic).toBeGreaterThan(0)
    expect(deTextiles).toBeGreaterThan(0)
  })

  it('CIE76 vs CIE94：红色与绿色色差应为显著值', () => {
    const de = colorDifference('#FF0000', '#00FF00')
    expect(de).toBeGreaterThan(60)
    expect(de).toBeLessThan(150)
  })

  it('互补色应有较大色差', () => {
    const de = colorDifference('#0000FF', '#FFFF00')
    expect(de).toBeGreaterThan(50)
  })

  it('接近灰色的两个颜色色差较小', () => {
    const de = colorDifference('#808080', '#888888')
    expect(de).toBeLessThan(10)
    expect(de).toBeGreaterThan(0)
  })
})

describe('colorUtils - 和谐配色生成', () => {
  const BASE = '#6366F1'

  it('生成4种配色模式都返回非空数组', () => {
    const modes = ['complementary', 'analogous', 'triadic', 'split', 'tetradic'] as const
    for (const mode of modes) {
      const result = generateHarmoniousColors(BASE, mode)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThanOrEqual(4)
      result.forEach(c => {
        expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    }
  })

  it('analogous模式：颜色之间色调差异不应超过60度', () => {
    const result = generateHarmoniousColors(BASE, 'analogous')
    const baseHue = rgbToHsl(hexToRgb(BASE)).h
    for (const c of result) {
      const hue = rgbToHsl(hexToRgb(c)).h
      let diff = Math.abs(hue - baseHue)
      if (diff > 180) diff = 360 - diff
      expect(diff).toBeLessThanOrEqual(90)
    }
  })

  it('complementary模式：至少有一个颜色色调约为基础色+180°', () => {
    const result = generateHarmoniousColors(BASE, 'complementary')
    const baseHue = rgbToHsl(hexToRgb(BASE)).h
    const compHue = (baseHue + 180) % 360
    const hasComplementary = result.some(c => {
      const hue = rgbToHsl(hexToRgb(c)).h
      let diff = Math.abs(hue - compHue)
      if (diff > 180) diff = 360 - diff
      return diff < 40
    })
    expect(hasComplementary).toBe(true)
  })

  it('triadic模式：三个颜色色调约相差120°', () => {
    const result = generateHarmoniousColors(BASE, 'triadic')
    const hues = result.slice(0, 3).map(c => rgbToHsl(hexToRgb(c)).h)
    const [h0, h1, h2] = hues
    let d1 = Math.abs(h1 - h0)
    let d2 = Math.abs(h2 - h1)
    let d3 = Math.abs(h0 - h2)
    if (d1 > 180) d1 = 360 - d1
    if (d2 > 180) d2 = 360 - d2
    if (d3 > 180) d3 = 360 - d3
    expect(Math.abs(d1 - 120)).toBeLessThan(60)
    expect(Math.abs(d2 - 120)).toBeLessThan(60)
    expect(Math.abs(d3 - 120)).toBeLessThan(60)
  })

  it('tetradic模式：返回4个颜色', () => {
    const result = generateHarmoniousColors(BASE, 'tetradic')
    expect(result.length).toBe(4)
  })

  it('split互补色模式：返回5个颜色', () => {
    const result = generateHarmoniousColors(BASE, 'split')
    expect(result.length).toBe(5)
  })

  it('每个生成的颜色都是有效HEX格式', () => {
    const modes = ['complementary', 'analogous', 'triadic', 'split', 'tetradic'] as const
    for (const mode of modes) {
      const result = generateHarmoniousColors(BASE, mode)
      for (const color of result) {
        expect(isValidHex(color)).toBe(true)
      }
    }
  })
})

describe('colorUtils - 辅助函数', () => {
  it('lighten增加亮度', () => {
    const base = '#000000'
    const lightened = lighten(base, 50)
    const hsl = rgbToHsl(hexToRgb(lightened))
    expect(hsl.l).toBeCloseTo(50, 0)
  })

  it('darken降低亮度', () => {
    const base = '#FFFFFF'
    const darkened = darken(base, 50)
    const hsl = rgbToHsl(hexToRgb(darkened))
    expect(hsl.l).toBeCloseTo(50, 0)
  })

  it('saturate增加饱和度', () => {
    const base = '#808080'
    const saturated = saturate(base, 50)
    const hsl = rgbToHsl(hexToRgb(saturated))
    expect(hsl.s).toBeGreaterThan(rgbToHsl(hexToRgb(base)).s)
  })

  it('getContrastColor：深色返回白，浅色返回黑', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff')
    expect(getContrastColor('#FFFFFF')).toBe('#000000')
    expect(getContrastColor('#FF0000')).toBe('#ffffff')
  })

  it('isValidHex：正确验证HEX格式', () => {
    expect(isValidHex('#FF0000')).toBe(true)
    expect(isValidHex('FF0000')).toBe(true)
    expect(isValidHex('#f00')).toBe(true)
    expect(isValidHex('f00')).toBe(true)
    expect(isValidHex('')).toBe(false)
    expect(isValidHex('#GGGGGG')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('#1234567')).toBe(false)
  })

  it('normalizeHex：统一为大写6位带#号', () => {
    expect(normalizeHex('ff0000')).toBe('#FF0000')
    expect(normalizeHex('#f00')).toBe('#FF0000')
    expect(normalizeHex('abc')).toBe('#AABBCC')
    expect(normalizeHex('#123456')).toBe('#123456')
  })
})
