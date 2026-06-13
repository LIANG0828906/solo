export interface ThemeConfig {
  name: string
  labelColor: string
  bgColor: string
  textColor: string
  lineNumBg: string
  lineNumColor: string
}

export const themesConfig: ThemeConfig[] = [
  {
    name: 'Light',
    labelColor: '#f5f5f5',
    bgColor: '#ffffff',
    textColor: '#24292e',
    lineNumBg: '#eaeef2',
    lineNumColor: '#6a737d'
  },
  {
    name: 'Dark',
    labelColor: '#24292e',
    bgColor: '#24292e',
    textColor: '#e1e4e8',
    lineNumBg: '#14181c',
    lineNumColor: '#8b949e'
  },
  {
    name: 'Monokai',
    labelColor: '#272822',
    bgColor: '#272822',
    textColor: '#f8f8f2',
    lineNumBg: '#171815',
    lineNumColor: '#90908a'
  },
  {
    name: 'Dracula',
    labelColor: '#282a36',
    bgColor: '#282a36',
    textColor: '#f8f8f2',
    lineNumBg: '#1a1b23',
    lineNumColor: '#6272a4'
  },
  {
    name: 'GitHub',
    labelColor: '#0366d6',
    bgColor: '#ffffff',
    textColor: '#24292e',
    lineNumBg: '#eaeef2',
    lineNumColor: '#6a737d'
  }
]
