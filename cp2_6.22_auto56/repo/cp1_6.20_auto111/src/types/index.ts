export type ThemeType = 'default' | 'ink' | 'starry' | 'forest' | 'aurora'

export interface LineStyle {
  fontFamily: string
  fontSize: number
  color: string
  lineHeight: number
  textAlign: 'left' | 'center' | 'right'
  background?: string
}

export interface PoemLine {
  id: string
  text: string
  style: LineStyle
}

export interface PoemParagraph {
  id: string
  lines: PoemLine[]
}

export interface Poem {
  id: string
  title: string
  author: string
  theme: ThemeType
  paragraphs: PoemParagraph[]
  likes: number
  createdAt: string
  firstLine: string
}

export interface Comment {
  id: string
  poemId: string
  author: string
  content: string
  mentions: string[]
  createdAt: string
}

export interface ThemeConfig {
  name: ThemeType
  displayName: string
  cssVariables: Record<string, string>
  backgroundGradient: string
  fontFamily: string
  particles: ParticleConfig
}

export interface ParticleConfig {
  enabled: boolean
  color: string
  count: number
  speed: number
  size: number
}

export interface AnimationOptions {
  delay?: number
  duration?: number
  stagger?: number
}
