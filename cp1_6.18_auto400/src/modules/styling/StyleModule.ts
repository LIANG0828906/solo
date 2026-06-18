export type FontType = 'kaiti' | 'xingshu' | 'lishu'
export type BgTextureType = 'xuanzhi' | 'juanbo' | 'zhujian'
export type DecorationType = 'seal' | 'petals' | 'birds' | 'none'

export interface StyleConfig {
  font: FontType
  background: BgTextureType
  decoration: DecorationType
}

export interface CSSVariables {
  '--poem-font-family': string
  '--bg-color': string
  '--bg-texture': string
  '--decoration-type': string
}

export const fontOptions: Record<FontType, { label: string; family: string }> = {
  kaiti: {
    label: '楷体',
    family: '"Ma Shan Zheng", "KaiTi", "楷体", "STKaiti", serif'
  },
  xingshu: {
    label: '行书',
    family: '"ZCOOL XiaoWei", "XingKai", "华文行楷", cursive'
  },
  lishu: {
    label: '隶书',
    family: '"Noto Serif SC", "LiSu", "隶书", "STLiti", serif'
  }
}

export const bgOptions: Record<BgTextureType, { label: string; color: string; pattern: string }> = {
  xuanzhi: {
    label: '宣纸黄',
    color: '#F5E6C8',
    pattern: `radial-gradient(ellipse at center, rgba(210,180,140,0.1) 0%, rgba(210,180,140,0.05) 50%, transparent 100%),
      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,90,43,0.02) 2px, rgba(139,90,43,0.02) 4px)`
  },
  juanbo: {
    label: '绢帛米',
    color: '#E8D5B7',
    pattern: `radial-gradient(ellipse at 30% 20%, rgba(180,150,100,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(200,170,120,0.1) 0%, transparent 40%),
      repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(139,90,43,0.015) 3px, rgba(139,90,43,0.015) 6px)`
  },
  zhujian: {
    label: '竹简青',
    color: '#C4B49C',
    pattern: `repeating-linear-gradient(90deg, rgba(100,80,50,0.08) 0px, rgba(100,80,50,0.08) 1px, transparent 1px, transparent 40px),
      linear-gradient(180deg, rgba(80,60,30,0.05) 0%, transparent 20%, transparent 80%, rgba(80,60,30,0.05) 100%)`
  }
}

export const decorationOptions: Record<DecorationType, { label: string; icon: string }> = {
  none: { label: '无装饰', icon: '' },
  seal: { label: '水墨印章', icon: '印' },
  petals: { label: '飘落花瓣', icon: '✿' },
  birds: { label: '飞鸟剪影', icon: '☰' }
}

export const defaultStyle: StyleConfig = {
  font: 'kaiti',
  background: 'xuanzhi',
  decoration: 'none'
}

export function applyStyleConfig(config: StyleConfig): CSSVariables {
  const fontOption = fontOptions[config.font]
  const bgOption = bgOptions[config.background]

  return {
    '--poem-font-family': fontOption.family,
    '--bg-color': bgOption.color,
    '--bg-texture': bgOption.pattern,
    '--decoration-type': config.decoration
  }
}

export function encodeStyleToQuery(config: StyleConfig): string {
  const params = new URLSearchParams({
    f: config.font,
    b: config.background,
    d: config.decoration
  })
  return params.toString()
}

export function decodeStyleFromQuery(query: string): StyleConfig {
  const params = new URLSearchParams(query)
  const font = (params.get('f') as FontType) || defaultStyle.font
  const background = (params.get('b') as BgTextureType) || defaultStyle.background
  const decoration = (params.get('d') as DecorationType) || defaultStyle.decoration

  return {
    font: font in fontOptions ? font : defaultStyle.font,
    background: background in bgOptions ? background : defaultStyle.background,
    decoration: decoration in decorationOptions ? decoration : defaultStyle.decoration
  }
}
