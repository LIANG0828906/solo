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
  barGradient: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f97316', '#fbbf24'],
  waveformColor: 'rgba(255, 255, 255, 0.6)',
  glowColor: 'rgba(236, 72, 153, 0.5)',
  particleColors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f97316', '#06b6d4', '#f472b6', '#fbbf24'],
}

const deepOcean: ThemeConfig = {
  name: 'deep-ocean',
  displayName: '深海幽蓝',
  background: {
    inner: '#0c2d4a',
    outer: '#000a12',
  },
  barGradient: ['#1e3a8a', '#1e40af', '#3b82f6', '#0ea5e9', '#0891b2', '#14b8a6', '#22d3ee', '#7dd3fc'],
  waveformColor: 'rgba(255, 255, 255, 0.6)',
  glowColor: 'rgba(34, 211, 238, 0.5)',
  particleColors: ['#1e3a8a', '#3b82f6', '#0ea5e9', '#0891b2', '#14b8a6', '#22d3ee', '#67e8f9', '#06b6d4', '#38bdf8', '#7dd3fc'],
}

const auroraForest: ThemeConfig = {
  name: 'aurora-forest',
  displayName: '极光森林',
  background: {
    inner: '#0a2e1a',
    outer: '#000d05',
  },
  barGradient: ['#14532d', '#166534', '#15803d', '#10b981', '#14b8a6', '#84cc16', '#bef264', '#fde047'],
  waveformColor: 'rgba(255, 255, 255, 0.6)',
  glowColor: 'rgba(16, 185, 129, 0.5)',
  particleColors: ['#14532d', '#15803d', '#10b981', '#14b8a6', '#22c55e', '#84cc16', '#a3e635', '#34d399', '#bef264', '#fde047'],
}

export const themes: Record<string, ThemeConfig> = {
  'neon-dream': neonDream,
  'deep-ocean': deepOcean,
  'aurora-forest': auroraForest,
}

export const defaultTheme = neonDream
export const themeNames = Object.keys(themes)
