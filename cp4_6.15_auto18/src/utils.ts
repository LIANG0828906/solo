import type { Inspiration, TagType } from './types'

const STORAGE_KEY_INSPIRATIONS = 'inspiration_companion_inspirations'
const STORAGE_KEY_PLANS = 'inspiration_companion_plans'

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(key, serialized)
  } catch (e) {
    console.error('保存到 localStorage 失败:', e)
  }
}

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key)
    if (serialized === null) {
      return defaultValue
    }
    return JSON.parse(serialized) as T
  } catch (e) {
    console.error('从 localStorage 加载失败:', e)
    return defaultValue
  }
}

export const saveInspirations = (inspirations: Inspiration[]): void => {
  saveToLocalStorage(STORAGE_KEY_INSPIRATIONS, inspirations)
}

export const loadInspirations = (): Inspiration[] => {
  const start = performance.now()
  const data = loadFromLocalStorage<Inspiration[]>(STORAGE_KEY_INSPIRATIONS, [])
  const duration = performance.now() - start
  if (duration > 200) {
    console.warn(`localStorage 加载耗时: ${duration.toFixed(2)}ms，超过 200ms 阈值`)
  }
  return data
}

export const savePlans = (plans: unknown[]): void => {
  saveToLocalStorage(STORAGE_KEY_PLANS, plans)
}

export const extractKeywords = (text: string): string[] => {
  const stopWords = new Set(['的', '是', '在', '和', '了', '有', '我', '你', '他', '她', '它', '这', '那', '个', '一', '不', '也', '就', '都', '要', '会', '可以', '一个', '一些'])
  const words = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.has(word))
  
  const uniqueWords = [...new Set(words)]
  return uniqueWords.slice(0, 10)
}

export const autoDetectTags = (title: string, description: string): TagType[] => {
  const text = `${title} ${description}`.toLowerCase()
  const tags: TagType[] = []
  
  const writingKeywords = ['写', '文章', '小说', '故事', '文案', '博客', '日记', '诗', '创作', '内容', '写作']
  const designKeywords = ['设计', 'ui', 'ux', '界面', '视觉', '海报', 'logo', '图标', '配色', '排版', '原型', '交互']
  const programmingKeywords = ['代码', '编程', '开发', '算法', '功能', 'bug', '优化', '重构', '架构', '技术', 'api', '数据库']
  
  if (writingKeywords.some(kw => text.includes(kw))) {
    tags.push('写作')
  }
  if (designKeywords.some(kw => text.includes(kw))) {
    tags.push('设计')
  }
  if (programmingKeywords.some(kw => text.includes(kw))) {
    tags.push('编程')
  }
  
  if (tags.length === 0) {
    tags.push('其他')
  }
  
  return tags
}

export const calculateRelevance = (a: Inspiration, b: Inspiration): number => {
  let score = 0
  
  const commonTags = a.tags.filter(tag => b.tags.includes(tag))
  score += commonTags.length * 30
  
  const commonKeywords = a.keywords.filter(kw => b.keywords.includes(kw))
  score += commonKeywords.length * 15
  
  const aText = `${a.title} ${a.description}`.toLowerCase()
  const bText = `${b.title} ${b.description}`.toLowerCase()
  const allWords = new Set([...aText.split(/\s+/), ...bText.split(/\s+/)])
  const sharedWords = [...allWords].filter(word => aText.includes(word) && bText.includes(word))
  score += sharedWords.length * 5
  
  return Math.min(score, 100)
}

export const sortInspirationsByRelevance = (
  inspirations: Inspiration[],
  baseInspiration: Inspiration
): Inspiration[] => {
  return [...inspirations]
    .filter(i => i.id !== baseInspiration.id)
    .sort((a, b) => calculateRelevance(baseInspiration, b) - calculateRelevance(baseInspiration, a))
}
