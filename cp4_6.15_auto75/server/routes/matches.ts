import { Router, type Request, type Response } from 'express'
import { getItems } from '../data/store.js'
import type { MatchResult, LostItem } from '../types.js'

const router = Router()

const stopWords = new Set([
  '的', '是', '在', '了', '和', '与', '及', '或', '一个', '有', '我',
  '你', '他', '她', '它', '这', '那', '个', '只', '把', '被', '给',
  '让', '从', '到', '向', '往', '由', '以', '于', '上', '下',
  '左', '右', '前', '后', '里', '外', '中', '内', '旁',
])

function tokenize(text: string): string[] {
  const tokens: Set<string> = new Set()

  const cleanText = text.toLowerCase().trim()

  const parts = cleanText.split(/[\s，。；：！？、,.;:?!~\-——_/\\|()（）【】\[\]{}'"''""\n\r\t]+/)

  for (const part of parts) {
    if (!part) continue
    if (part.length <= 4 && !stopWords.has(part)) {
      tokens.add(part)
    }

    for (let i = 0; i < part.length - 1; i++) {
      const bigram = part.slice(i, i + 2)
      if (!stopWords.has(bigram)) {
        tokens.add(bigram)
      }
    }

    for (let i = 0; i < part.length; i++) {
      const char = part[i]
      if (char && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(char)) {
        tokens.add(char)
      }
    }
  }

  return Array.from(tokens).filter((t) => t.length > 0)
}

function calculateScore(description: string, item: LostItem): number {
  const queryTokens = tokenize(description)
  const itemText = `${item.title} ${item.description}`
  const itemTokens = tokenize(itemText)

  if (queryTokens.length === 0 || itemTokens.length === 0) {
    return 0
  }

  const itemTokenSet = new Set(itemTokens)

  let matchCount = 0
  for (const token of queryTokens) {
    if (itemTokenSet.has(token)) {
      matchCount++
    }
  }

  const precision = matchCount / queryTokens.length
  const recall = matchCount / itemTokens.length

  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  let titleBoost = 0
  const titleTokens = tokenize(item.title)
  const titleTokenSet = new Set(titleTokens)
  let titleMatchCount = 0
  for (const token of queryTokens) {
    if (titleTokenSet.has(token)) {
      titleMatchCount++
    }
  }
  if (titleTokens.length > 0) {
    titleBoost = (titleMatchCount / titleTokens.length) * 0.2
  }

  const score = Math.min(100, Math.round((f1Score * 0.8 + titleBoost) * 100))

  return score
}

router.post('/', (req: Request, res: Response): void => {
  const { description } = req.body

  if (!description || typeof description !== 'string') {
    res.status(400).json({
      success: false,
      error: '描述是必填项',
    })
    return
  }

  const items = getItems().filter((item) => !item.isClaimed)

  const results: MatchResult[] = items.map((item) => {
    const score = calculateScore(description, item)
    return {
      item,
      score,
      isHighMatch: score > 60,
    }
  })

  results.sort((a, b) => b.score - a.score)

  const topResults = results.slice(0, 5)

  res.json({
    success: true,
    data: topResults,
  })
})

export default router
