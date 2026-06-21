export interface ThemeConfig {
  name: string
  displayName: string
  background: {
    inner: string
    outer: string
  }
  barGradient: string[]
  waveformColor: string
  glowColor: string
  particleColors: string[]
}

const neonDream: ThemeConfig = {
  name: 'neon-dream',
  displayName: '霓虹幻彩',
  background: {
    inner: '#2a0a3a',
    outer: '#0a0015',
  },
  barGradient: ['#8b5cf6', '#ec4899', '#f97316', '#fbbf24'],
  waveformColor: 'rgba(255, 255, 255, 0.6)',
  glowColor: 'rgba(236, 72, 153, 0.4)',
  particleColors: ['#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#a855f7', '#f472b6'],
}

const deepOcean: ThemeConfig = {
  name: 'deep-ocean',
  displayName: '深海幽蓝',
  background: {
    inner: '#0c2d4a',
    outer: '#000a12',
  },
  barGradient: ['#1e3a5f', '#0891b2', '#22d3ee', '#7dd3fc'],
  waveformColor: 'rgba(255, 255, 255, 0.6)',
  glowColor: 'rgba(34, 211, 238, 0.4)',
  particleColors: ['#0891b2', '#22d3ee', '#7dd3fc', '#0ea5e9', '#06b6d4', '#38bdf8'],
}

const auroraForest: ThemeConfig = {
  name: 'aurora-forest',
  displayName: '极光森林',
  background: {
    inner: '#0a2e1a',
    outer: '#000d05',
  },
  barGradient: ['#166534', '#10b981', '#84cc16', '#fde047'],
  waveformColor: 'rgba(255, 255, 255, 0.6)',
  glowColor: 'rgba(16, 185, 129, 0.4)',
  particleColors: ['#10b981', '#84cc16', '#fde047', '#34d399', '#a3e635', '#22c55e'],
}

export const themes: Record<string, ThemeConfig> = {
  'neon-dream': neonDream,
  'deep-ocean': deepOcean,
  'aurora-forest': auroraForest,
}

export const defaultTheme = neonDream
export const themeNames = Object.keys(themes)
