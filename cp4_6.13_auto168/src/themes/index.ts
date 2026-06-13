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
    lineNumBg: '#f6f8fa',
    lineNumColor: '#6a737d'
  },
  {
    name: 'Dark',
    labelColor: '#24292e',
    bgColor: '#24292e',
    textColor: '#e1e4e8',
    lineNumBg: '#1b1f23',
    lineNumColor: '#6a737d'
  },
  {
    name: 'Monokai',
    labelColor: '#272822',
    bgColor: '#272822',
    textColor: '#f8f8f2',
    lineNumBg: '#1e1f1c',
    lineNumColor: '#90908a'
  },
  {
    name: 'Dracula',
    labelColor: '#282a36',
    bgColor: '#282a36',
    textColor: '#f8f8f2',
    lineNumBg: '#21222c',
    lineNumColor: '#6272a4'
  },
  {
    name: 'GitHub',
    labelColor: '#0366d6',
    bgColor: '#ffffff',
    textColor: '#24292e',
    lineNumBg: '#f6f8fa',
    lineNumColor: '#6a737d'
  }
]
