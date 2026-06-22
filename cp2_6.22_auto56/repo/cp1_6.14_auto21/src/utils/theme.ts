export interface ThemeConfig {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgColor: string
  textColor: string
  headingFont: string
  bodyFont: string
  radarGradient: [string, string]
  tagBg: string
  tagText: string
  timelineColor: string
  cardShadow: string
  cardHoverShadow: string
}

export const themes: ThemeConfig[] = [
  {
    id: 'haze-blue',
    name: '雾霾蓝·专业',
    primaryColor: '#6B7B8D',
    secondaryColor: '#8797b8',
    accentColor: '#43566a',
    bgColor: '#ffffff',
    textColor: '#1d2e45',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Noto Sans SC', sans-serif",
    radarGradient: ['#6B7B8D', '#8797b8'],
    tagBg: '#e1e5eb',
    tagText: '#43566a',
    timelineColor: '#6B7B8D',
    cardShadow: '0 2px 12px rgba(107,123,141,0.08)',
    cardHoverShadow: '0 4px 20px rgba(107,123,141,0.15)',
  },
  {
    id: 'warm-orange',
    name: '暖橙·创意',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B',
    accentColor: '#92400E',
    bgColor: '#FFFBF5',
    textColor: '#3D2E1F',
    headingFont: "'Crimson Pro', serif",
    bodyFont: "'DM Sans', sans-serif",
    radarGradient: ['#D97706', '#F59E0B'],
    tagBg: '#FEF3C7',
    tagText: '#92400E',
    timelineColor: '#D97706',
    cardShadow: '0 2px 12px rgba(217,119,6,0.08)',
    cardHoverShadow: '0 4px 20px rgba(217,119,6,0.16)',
  },
  {
    id: 'forest-green',
    name: '墨绿·学术',
    primaryColor: '#2D6A4F',
    secondaryColor: '#52B788',
    accentColor: '#1B4332',
    bgColor: '#F6FAF8',
    textColor: '#1B3A2D',
    headingFont: "'Merriweather', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    radarGradient: ['#2D6A4F', '#52B788'],
    tagBg: '#D8F3DC',
    tagText: '#1B4332',
    timelineColor: '#2D6A4F',
    cardShadow: '0 2px 12px rgba(45,106,79,0.08)',
    cardHoverShadow: '0 4px 20px rgba(45,106,79,0.15)',
  },
]

export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--theme-primary', theme.primaryColor)
  root.style.setProperty('--theme-secondary', theme.secondaryColor)
  root.style.setProperty('--theme-accent', theme.accentColor)
  root.style.setProperty('--theme-bg', theme.bgColor)
  root.style.setProperty('--theme-text', theme.textColor)
  root.style.setProperty('--theme-heading-font', theme.headingFont)
  root.style.setProperty('--theme-body-font', theme.bodyFont)
  root.style.setProperty('--theme-radar-start', theme.radarGradient[0])
  root.style.setProperty('--theme-radar-end', theme.radarGradient[1])
}
