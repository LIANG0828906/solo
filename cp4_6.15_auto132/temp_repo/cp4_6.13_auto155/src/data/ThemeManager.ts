export interface ThemeConfig {
  id: string
  name: string
  groundColor: string
  groundPattern: string
  obstacleColors: { spike: string; bar: string; robot: string }
  fragmentColor: string
  skyColors: { top: string; bottom: string }
  parallaxElements: {
    foreground: Array<{ type: string; color: string }>
    middle: Array<{ type: string; color: string }>
    background: Array<{ type: string; color: string }>
  }
  bgm: { tempo: number; notes: number[]; wave: string }
  icon: string
}

export const THEMES: Record<string, ThemeConfig> = {
  stone: {
    id: 'stone',
    name: '石器时代',
    groundColor: '#8B7355',
    groundPattern: 'earth',
    obstacleColors: { spike: '#FF4444', bar: '#8B4513', robot: '#CD853F' },
    fragmentColor: '#FFA500',
    skyColors: { top: '#87CEEB', bottom: '#F4A460' },
    parallaxElements: {
      foreground: [{ type: 'dinosaur', color: '#6B8E23' }, { type: 'tree', color: '#228B22' }],
      middle: [{ type: 'mountain', color: '#A0522D' }, { type: 'volcano', color: '#8B0000' }],
      background: [{ type: 'cloud', color: '#FFFFFF' }]
    },
    bgm: { tempo: 80, notes: [16, 20, 24, 28], wave: 'triangle' },
    icon: '🦖'
  },
  steam: {
    id: 'steam',
    name: '蒸汽纪元',
    groundColor: '#B87333',
    groundPattern: 'metal',
    obstacleColors: { spike: '#FF6347', bar: '#CD7F32', robot: '#DAA520' },
    fragmentColor: '#FFD700',
    skyColors: { top: '#696969', bottom: '#2F4F4F' },
    parallaxElements: {
      foreground: [{ type: 'gear', color: '#8B4513' }, { type: 'smoke', color: '#A9A9A9' }],
      middle: [{ type: 'factory', color: '#555555' }, { type: 'chimney', color: '#333333' }],
      background: [{ type: 'cloud', color: '#444444' }]
    },
    bgm: { tempo: 100, notes: [60, 62, 64, 65, 67, 69], wave: 'sine' },
    icon: '⚙️'
  },
  cyber: {
    id: 'cyber',
    name: '赛博朋克',
    groundColor: '#1a1a2e',
    groundPattern: 'neon',
    obstacleColors: { spike: '#FF00FF', bar: '#00FFFF', robot: '#FF69B4' },
    fragmentColor: '#9400D3',
    skyColors: { top: '#0f0f23', bottom: '#1a1a3e' },
    parallaxElements: {
      foreground: [{ type: 'billboard', color: '#FF00FF' }, { type: 'neon', color: '#00FFFF' }],
      middle: [{ type: 'building', color: '#1a1a2e' }, { type: 'hologram', color: '#FF69B4' }],
      background: [{ type: 'star', color: '#FFFFFF' }]
    },
    bgm: { tempo: 120, notes: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00], wave: 'square' },
    icon: '🌃'
  },
  space: {
    id: 'space',
    name: '星际未来',
    groundColor: '#2a2a4a',
    groundPattern: 'honeycomb',
    obstacleColors: { spike: '#00CED1', bar: '#E0FFFF', robot: '#B0E0E6' },
    fragmentColor: '#00FFFF',
    skyColors: { top: '#000011', bottom: '#000033' },
    parallaxElements: {
      foreground: [{ type: 'planet', color: '#4169E1' }, { type: 'satellite', color: '#C0C0C0' }],
      middle: [{ type: 'asteroid', color: '#696969' }, { type: 'nebula', color: '#4B0082' }],
      background: [{ type: 'star', color: '#FFFFFF' }]
    },
    bgm: { tempo: 90, notes: [100, 200, 300, 400, 500], wave: 'sawtooth' },
    icon: '🚀'
  }
}

export class ThemeManager {
  private currentTheme: string = 'stone'
  private transitionProgress: number = 0
  private isTransitioning: boolean = false

  getThemeById(id: string): ThemeConfig {
    return THEMES[id] || THEMES.stone
  }

  getCurrentTheme(): ThemeConfig {
    return THEMES[this.currentTheme]
  }

  getThemeByScore(score: number): string {
    const eraScore = Math.floor(score / 100)
    const themes = Object.keys(THEMES)
    return themes[Math.min(eraScore, themes.length - 1)]
  }

  setTheme(themeId: string): void {
    if (this.currentTheme !== themeId) {
      this.isTransitioning = true
      this.transitionProgress = 0
      this.currentTheme = themeId
    }
  }

  updateTransition(deltaTime: number): boolean {
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime * 2
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1
        this.isTransitioning = false
      }
    }
    return this.isTransitioning
  }

  getTransitionProgress(): number {
    return this.transitionProgress
  }

  isInTransition(): boolean {
    return this.isTransitioning
  }

  interpolateColor(color1: string, color2: string, progress: number): string {
    const hex = (c: string) => parseInt(c, 16)
    const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7))
    const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(5, 5)), b2 = hex(color2.slice(7, 7))
    
    const r = Math.round(r1 + (r2 - r1) * progress)
    const g = Math.round(g1 + (g2 - g1) * progress)
    const b = Math.round(b1 + (b2 - b1) * progress)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  getUnlockedThemes(score: number): ThemeConfig[] {
    const eraScore = Math.floor(score / 100) + 1
    const themes = Object.values(THEMES)
    return themes.slice(0, Math.min(eraScore, themes.length))
  }
}
