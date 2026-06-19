export interface SpeechItem {
  id: string
  speaker: string
  timestamp: number
  text: string
}

export interface KeywordItem {
  word: string
  count: number
}

const STOPWORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '这个', '那个', '他', '她', '它', '们', '我们', '你们', '他们',
  '因为', '所以', '但是', '然后', '还是', '或者', '如果', '什么', '怎么', '可以',
  '能', '能够', '应该', '必须', '其实', '现在', '这样', '那样', '如何', '为什么',
  'which', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
  'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
  'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'if', 'because', 'until', 'while', 'about', 'against', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'when', 'where', 'why', 'how'
])

function tokenizeChinese(text: string): string[] {
  const tokens: string[] = []
  const cleanedText = text.toLowerCase()
  
  const chineseRegex = /[\u4e00-\u9fa5]+/g
  const englishRegex = /[a-zA-Z][a-zA-Z0-9]{1,}/g
  
  let match: RegExpExecArray | null
  
  while ((match = chineseRegex.exec(cleanedText)) !== null) {
    const segment = match[0]
    const len = segment.length
    for (let i = 0; i < len; i++) {
      if (i + 2 <= len) {
        tokens.push(segment.substring(i, i + 2))
      }
      if (i + 3 <= len) {
        tokens.push(segment.substring(i, i + 3))
      }
      if (i + 4 <= len) {
        tokens.push(segment.substring(i, i + 4))
      }
      tokens.push(segment[i])
    }
  }
  
  while ((match = englishRegex.exec(cleanedText)) !== null) {
    tokens.push(match[0])
  }
  
  return tokens
}

export function extractKeywords(speeches: SpeechItem[]): KeywordItem[] {
  const allText = speeches.map(s => s.text).join(' ')
  if (!allText.trim()) return []
  
  const tokens = tokenizeChinese(allText)
  const freqMap = new Map<string, number>()
  
  for (const token of tokens) {
    const trimmed = token.trim()
    if (
      trimmed.length < 2 ||
      STOPWORDS.has(trimmed) ||
      STOPWORDS.has(trimmed.toLowerCase())
    ) {
      continue
    }
    freqMap.set(trimmed, (freqMap.get(trimmed) || 0) + 1)
  }
  
  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }))
  
  return sorted
}

export function getGradientColor(index: number, total: number): string {
  if (total <= 1) return '#FF6B6B'
  
  const ratio = index / (total - 1)
  const start = { r: 0xFF, g: 0x6B, b: 0x6B }
  const end = { r: 0x4E, g: 0xCD, b: 0xC4 }
  
  const r = Math.round(start.r + (end.r - start.r) * ratio)
  const g = Math.round(start.g + (end.g - start.g) * ratio)
  const b = Math.round(start.b + (end.b - start.b) * ratio)
  
  return `rgb(${r}, ${g}, ${b})`
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export const THEME_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7'
]

export function randomThemeColor(): string {
  return THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)]
}
