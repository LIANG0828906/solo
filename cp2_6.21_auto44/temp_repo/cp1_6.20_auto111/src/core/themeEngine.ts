import type { ThemeType, ThemeConfig, ParticleConfig } from '@/types'

const particleConfigs: Record<ThemeType, ParticleConfig> = {
  default: {
    enabled: false,
    color: '#2D5A4B',
    count: 0,
    speed: 0,
    size: 0
  },
  ink: {
    enabled: true,
    color: 'rgba(44, 44, 44, 0.3)',
    count: 15,
    speed: 0.3,
    size: 60
  },
  starry: {
    enabled: true,
    color: '#FFD700',
    count: 100,
    speed: 0.5,
    size: 3
  },
  forest: {
    enabled: true,
    color: 'rgba(45, 90, 75, 0.4)',
    count: 25,
    speed: 0.2,
    size: 40
  },
  aurora: {
    enabled: true,
    color: '#4ECDC4',
    count: 50,
    speed: 0.8,
    size: 8
  }
}

const themeConfigs: Record<ThemeType, ThemeConfig> = {
  default: {
    name: 'default',
    displayName: '素雅',
    cssVariables: {
      '--bg-primary': '#F8F5F0',
      '--bg-secondary': '#FFFFFF',
      '--text-primary': '#2C2C2C',
      '--text-secondary': '#5A5A5A',
      '--accent': '#2D5A4B',
      '--border': 'rgba(44, 44, 44, 0.1)'
    },
    backgroundGradient: 'linear-gradient(135deg, #F8F5F0 0%, #EDE8E0 100%)',
    fontFamily: "'Noto Serif SC', serif",
    particles: particleConfigs.default
  },
  ink: {
    name: 'ink',
    displayName: '水墨',
    cssVariables: {
      '--bg-primary': '#F5F0E6',
      '--bg-secondary': '#FAF7F0',
      '--text-primary': '#1A1A1A',
      '--text-secondary': '#4A4A4A',
      '--accent': '#333333',
      '--border': 'rgba(26, 26, 26, 0.15)'
    },
    backgroundGradient: 'linear-gradient(180deg, #F5F0E6 0%, #E8E0D0 50%, #F0E8D8 100%)',
    fontFamily: "'Ma Shan Zheng', 'Noto Serif SC', serif",
    particles: particleConfigs.ink
  },
  starry: {
    name: 'starry',
    displayName: '星空',
    cssVariables: {
      '--bg-primary': '#0A1628',
      '--bg-secondary': '#0F1D35',
      '--text-primary': '#FFD700',
      '--text-secondary': '#B8B8B8',
      '--accent': '#4A90D9',
      '--border': 'rgba(255, 215, 0, 0.2)'
    },
    backgroundGradient: 'linear-gradient(180deg, #0A1628 0%, #1A2A4A 50%, #0D1B2A 100%)',
    fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
    particles: particleConfigs.starry
  },
  forest: {
    name: 'forest',
    displayName: '森林',
    cssVariables: {
      '--bg-primary': '#E8F0E8',
      '--bg-secondary': '#F0F8F0',
      '--text-primary': '#1A3A2A',
      '--text-secondary': '#3A5A4A',
      '--accent': '#2D6A4F',
      '--border': 'rgba(45, 106, 79, 0.2)'
    },
    backgroundGradient: 'linear-gradient(135deg, #E8F0E8 0%, #D0E0D0 50%, #E0F0E0 100%)',
    fontFamily: "'Noto Serif SC', serif",
    particles: particleConfigs.forest
  },
  aurora: {
    name: 'aurora',
    displayName: '极光',
    cssVariables: {
      '--bg-primary': '#0D1B2A',
      '--bg-secondary': '#1B263B',
      '--text-primary': '#E0E1DD',
      '--text-secondary': '#778DA9',
      '--accent': '#4ECDC4',
      '--border': 'rgba(78, 205, 196, 0.3)'
    },
    backgroundGradient: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 30%, #415A77 60%, #0D1B2A 100%)',
    fontFamily: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
    particles: particleConfigs.aurora
  }
}

export function getThemeStyles(themeName: ThemeType): ThemeConfig {
  return themeConfigs[themeName] || themeConfigs.default
}

export function applyTheme(themeName: ThemeType): void {
  const config = getThemeStyles(themeName)
  const root = document.documentElement

  Object.entries(config.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  root.style.setProperty('--font-family', config.fontFamily)
  root.style.setProperty('--background-gradient', config.backgroundGradient)
  root.dataset.theme = themeName
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(themeConfigs)
}
