import { TagCategory } from './types'
import type { Inspiration, TagType } from './types'

const STORAGE_KEY_INSPIRATIONS = 'inspiration_companion_inspirations'
const STORAGE_KEY_PLANS = 'inspiration_companion_plans'
const STORAGE_CHUNK_SIZE = 50
const LOAD_TIMEOUT_MS = 180

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    const parsed = JSON.parse(json)
    if (parsed === null || parsed === undefined) {
      return defaultValue
    }
    return parsed as T
  } catch (e) {
    console.warn('JSON 解析失败，返回默认值:', e)
    return defaultValue
  }
}

const safeJsonStringify = <T>(data: T): string | null => {
  try {
    return JSON.stringify(data)
  } catch (e) {
    console.error('JSON 序列化失败:', e)
    return null
  }
}

export const saveToLocalStorage = <T>(key: string, data: T): boolean => {
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }

    const serialized = safeJsonStringify(data)
    if (serialized === null) {
      return false
    }

    if (serialized.length > 5 * 1024 * 1024) {
      console.warn('数据过大（超过 5MB），可能导致存储失败')
    }

    localStorage.setItem(key, serialized)
    return true
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'QuotaExceededError') {
        console.error('localStorage 存储空间已满')
      } else if (e.name === 'SecurityError') {
        console.error('localStorage 访问被安全策略阻止')
      } else {
        console.error('保存到 localStorage 失败:', e.message)
      }
    }
    return false
  }
}

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof localStorage === 'undefined') {
      return defaultValue
    }

    const serialized = localStorage.getItem(key)
    if (serialized === null) {
      return defaultValue
    }

    return safeJsonParse<T>(serialized, defaultValue)
  } catch (e) {
    console.error('从 localStorage 加载失败:', e)
    return defaultValue
  }
}

const saveChunkedData = <T>(key: string, data: T[]): boolean => {
  const totalChunks = Math.ceil(data.length / STORAGE_CHUNK_SIZE)
  const metadata = { totalChunks, totalItems: data.length, savedAt: Date.now() }

  const metaSuccess = saveToLocalStorage(`${key}_meta`, metadata)
  if (!metaSuccess) return false

  for (let i = 0; i < totalChunks; i++) {
    const chunk = data.slice(i * STORAGE_CHUNK_SIZE, (i + 1) * STORAGE_CHUNK_SIZE)
    const chunkSuccess = saveToLocalStorage(`${key}_chunk_${i}`, chunk)
    if (!chunkSuccess) return false
  }

  return true
}

const loadChunkedData = <T>(key: string, defaultValue: T[]): T[] => {
  const start = performance.now()
  const metadata = loadFromLocalStorage<{ totalChunks: number } | null>(`${key}_meta`, null)

  if (metadata === null) {
    const legacyData = loadFromLocalStorage<T[]>(key, defaultValue)
    const duration = performance.now() - start
    if (duration > LOAD_TIMEOUT_MS) {
      console.warn(`加载耗时: ${duration.toFixed(2)}ms，接近阈值`)
    }
    return legacyData
  }

  const result: T[] = []

  for (let i = 0; i < metadata.totalChunks; i++) {
    const chunk = loadFromLocalStorage<T[]>(`${key}_chunk_${i}`, [])
    result.push(...chunk)

    const elapsed = performance.now() - start
    if (elapsed > LOAD_TIMEOUT_MS) {
      console.warn(`分片加载超时，已加载 ${i + 1}/${metadata.totalChunks} 片，耗时 ${elapsed.toFixed(2)}ms`)
      break
    }
  }

  const duration = performance.now() - start
  if (duration > LOAD_TIMEOUT_MS) {
    console.warn(`分片加载总耗时: ${duration.toFixed(2)}ms，超过 ${LOAD_TIMEOUT_MS}ms 阈值`)
  }

  return result.length > 0 ? result : defaultValue
}

export const saveInspirations = (inspirations: Inspiration[]): boolean => {
  if (inspirations.length > STORAGE_CHUNK_SIZE) {
    return saveChunkedData(STORAGE_KEY_INSPIRATIONS, inspirations)
  }
  return saveToLocalStorage(STORAGE_KEY_INSPIRATIONS, inspirations)
}

export const loadInspirations = (): Inspiration[] => {
  const start = performance.now()

  const data = loadChunkedData<Inspiration>(STORAGE_KEY_INSPIRATIONS, [])

  const duration = performance.now() - start
  if (duration > 200) {
    console.warn(`localStorage 加载耗时: ${duration.toFixed(2)}ms，超过 200ms 阈值`)
  }

  return data.sort((a, b) => a.order - b.order)
}

export const savePlans = (plans: unknown[]): boolean => {
  if (plans.length > STORAGE_CHUNK_SIZE) {
    return saveChunkedData(STORAGE_KEY_PLANS, plans)
  }
  return saveToLocalStorage(STORAGE_KEY_PLANS, plans)
}

export const loadPlans = <T>(): T[] => {
  return loadChunkedData<T>(STORAGE_KEY_PLANS, [])
}

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_INSPIRATIONS)
    localStorage.removeItem(STORAGE_KEY_PLANS)

    let i = 0
    while (localStorage.getItem(`${STORAGE_KEY_INSPIRATIONS}_chunk_${i}`)) {
      localStorage.removeItem(`${STORAGE_KEY_INSPIRATIONS}_chunk_${i}`)
      localStorage.removeItem(`${STORAGE_KEY_PLANS}_chunk_${i}`)
      i++
    }

    localStorage.removeItem(`${STORAGE_KEY_INSPIRATIONS}_meta`)
    localStorage.removeItem(`${STORAGE_KEY_PLANS}_meta`)
  } catch (e) {
    console.error('清除存储失败:', e)
  }
}

export const getStorageSize = (): { used: number; available: number } => {
  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        total += key.length + value.length
      }
    }
    return {
      used: Math.round(total / 1024),
      available: 5120 - Math.round(total / 1024),
    }
  } catch (e) {
    return { used: 0, available: 5120 }
  }
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
    tags.push(TagCategory.WRITING)
  }
  if (designKeywords.some(kw => text.includes(kw))) {
    tags.push(TagCategory.DESIGN)
  }
  if (programmingKeywords.some(kw => text.includes(kw))) {
    tags.push(TagCategory.CODING)
  }

  if (tags.length === 0) {
    tags.push(TagCategory.OTHER)
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
