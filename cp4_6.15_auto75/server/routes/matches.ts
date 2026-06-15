import { Router, type Request, type Response } from 'express'
import { getItems } from '../data/store.js'
import type { MatchResult, LostItem } from '../types.js'

const router = Router()

const stopWords = new Set([
  '的', '是', '在', '了', '和', '与', '及', '或', '一个', '有', '我',
  '你', '他', '她', '它', '这', '那', '个', '只', '把', '被', '给',
  '让', '从', '到', '向', '往', '由', '以', '于', '上', '下',
  '左', '右', '前', '后', '里', '外', '中', '内', '旁', '之',
  '其', '等', '些', '每', '各', '某', '该', '此', '彼', '什么',
  '怎么', '怎样', '如何', '为什么', '因为', '所以', '但是', '可是',
  '然而', '不过', '就是', '都', '也', '还', '又', '再', '已经',
  '正在', '将要', '会', '能', '可以', '应该', '必须', '需要',
  '把', '被', '给', '让', '向', '对', '为', '以', '用', '拿',
  '按照', '根据', '通过', '由于', '因此', '于是', '所以', '而且',
  '并且', '或者', '还是', '不是', '没有', '不', '没', '无',
  '非', '未', '别', '莫', '勿', '休', '免', '罢了', '而已',
])

function tokenize(text: string): string[] {
  const tokens: Set<string> = new Set()

  const cleanText = text.toLowerCase().trim()

  const parts = cleanText.split(/[\s，。；：！？、,.;:?!~\-——_/\\|()（）【】\[\]{}'"''""\n\r\t]+/)

  for (const part of parts) {
    if (!part) continue

    if (part.length > 0 && part.length <= 4 && !stopWords.has(part)) {
      tokens.add(part)
    }

    for (let i = 0; i < part.length - 1; i++) {
      const bigram = part.slice(i, i + 2)
      if (!stopWords.has(bigram) && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(bigram)) {
        tokens.add(bigram)
      }
    }

    for (let i = 0; i < part.length; i++) {
      const char = part[i]
      if (char && /[\u4e00-\u9fa5a-zA-Z0-9]/.test(char) && !stopWords.has(char)) {
        tokens.add(char)
      }
    }
  }

  return Array.from(tokens).filter((t) => t.length > 0)
}

type TFMap = Map<string, number>
type IDFMap = Map<string, number>

interface DocumentVectors {
  tf: TFMap
  titleTf: TFMap
  descTf: TFMap
}

let cachedIdf: IDFMap | null = null
let cachedItemVectors: Map<string, DocumentVectors> | null = null
let cachedItemsHash: string = ''

function getItemsHash(items: LostItem[]): string {
  return items.map((item) => `${item.id}-${item.title}-${item.description}`).join('|')
}

function computeTF(tokens: string[]): TFMap {
  const tf = new Map<string, number>()
  const total = tokens.length

  if (total === 0) return tf

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }

  for (const [token, count] of tf) {
    tf.set(token, count / total)
  }

  return tf
}

function computeIDF(items: LostItem[]): IDFMap {
  const idf = new Map<string, number>()
  const docCount = items.length

  const tokenDocCount = new Map<string, number>()

  for (const item of items) {
    const text = `${item.title} ${item.description}`
    const tokens = tokenize(text)
    const uniqueTokens = new Set(tokens)

    for (const token of uniqueTokens) {
      tokenDocCount.set(token, (tokenDocCount.get(token) || 0) + 1)
    }
  }

  for (const [token, count] of tokenDocCount) {
    idf.set(token, Math.log((docCount + 1) / (count + 1)) + 1)
  }

  return idf
}

function computeDocumentVectors(items: LostItem[], idf: IDFMap): Map<string, DocumentVectors> {
  const vectors = new Map<string, DocumentVectors>()

  for (const item of items) {
    const titleTokens = tokenize(item.title)
    const descTokens = tokenize(item.description)
    const allTokens = tokenize(`${item.title} ${item.description}`)

    const titleTf = computeTF(titleTokens)
    const descTf = computeTF(descTokens)
    const tf = computeTF(allTokens)

    vectors.set(item.id, { tf, titleTf, descTf })
  }

  return vectors
}

function ensureCache(): void {
  const items = getItems()
  const currentHash = getItemsHash(items)

  if (cachedIdf && cachedItemVectors && cachedItemsHash === currentHash) {
    return
  }

  cachedIdf = computeIDF(items)
  cachedItemVectors = computeDocumentVectors(items, cachedIdf)
  cachedItemsHash = currentHash
}

export function refreshTFIDFCache(): void {
  cachedIdf = null
  cachedItemVectors = null
  cachedItemsHash = ''
  ensureCache()
}

function computeTFIDFVector(tf: TFMap, idf: IDFMap, titleTf?: TFMap, titleWeight: number = 1.5): Map<string, number> {
  const vector = new Map<string, number>()

  for (const [token, tfValue] of tf) {
    const idfValue = idf.get(token) || 0
    let weight = tfValue * idfValue

    if (titleTf && titleTf.has(token)) {
      weight *= titleWeight
    }

    if (weight > 0) {
      vector.set(token, weight)
    }
  }

  return vector
}

function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const [token, weight] of vecA) {
    normA += weight * weight
    const bWeight = vecB.get(token) || 0
    dotProduct += weight * bWeight
  }

  for (const [, weight] of vecB) {
    normB += weight * weight
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

function calculateScore(description: string, item: LostItem, itemVectors: DocumentVectors, idf: IDFMap): number {
  const queryTokens = tokenize(description)
  const queryTf = computeTF(queryTokens)
  const queryVector = computeTFIDFVector(queryTf, idf)

  const itemVector = computeTFIDFVector(itemVectors.tf, idf, itemVectors.titleTf, 1.5)

  const similarity = computeCosineSimilarity(queryVector, itemVector)

  const score = Math.round(Math.min(100, similarity * 100))

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

  ensureCache()

  if (!cachedIdf || !cachedItemVectors) {
    res.status(500).json({
      success: false,
      error: '匹配系统初始化失败',
    })
    return
  }

  const items = getItems().filter((item) => !item.isClaimed)

  const results: MatchResult[] = items.map((item) => {
    const vectors = cachedItemVectors!.get(item.id)
    let score = 0

    if (vectors) {
      score = calculateScore(description, item, vectors, cachedIdf!)
    }

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
