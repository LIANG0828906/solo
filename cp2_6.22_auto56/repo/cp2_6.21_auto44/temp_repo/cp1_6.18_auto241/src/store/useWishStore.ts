import { create } from 'zustand'

export interface Wish {
  id: string
  content: string
  timestamp: number
}

interface WishState {
  wishes: Wish[]
  totalBottles: number
  hotWords: Map<string, number>
  addWish: (content: string) => void
  incrementBottle: () => void
}

const STOP_WORDS = new Set([
  '的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看',
  '好', '自己', '这', '那', '什么', '怎么', '可以', '能', '想', '希望', '愿',
  '啊', '吧', '呢', '吗', '哦', '哈', '呀', '哦', '嗯',
])

function extractWords(text: string): string[] {
  const words: string[] = []
  const regex = /[\u4e00-\u9fa5]+/g
  const matches = text.match(regex)
  if (!matches) return words

  for (const match of matches) {
    for (let len = 4; len >= 2; len--) {
      for (let i = 0; i + len <= match.length; i++) {
        const word = match.slice(i, i + len)
        if (!STOP_WORDS.has(word) && word.length >= 2) {
          words.push(word)
        }
      }
    }
  }
  return words
}

export const useWishStore = create<WishState>((set, get) => ({
  wishes: [],
  totalBottles: 0,
  hotWords: new Map(),

  incrementBottle: () => {
    set((state) => ({ totalBottles: state.totalBottles + 1 }))
  },

  addWish: (content: string) => {
    const wish: Wish = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      content,
      timestamp: Date.now(),
    }

    const words = extractWords(content)
    const hotWords = new Map(get().hotWords)
    for (const word of words) {
      hotWords.set(word, (hotWords.get(word) || 0) + 1)
    }

    set((state) => ({
      wishes: [...state.wishes, wish],
      totalBottles: state.totalBottles + 1,
      hotWords,
    }))
  },
}))

export function getTopHotWords(hotWords: Map<string, number>, top = 5): { word: string; count: number }[] {
  return Array.from(hotWords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word, count]) => ({ word, count }))
}
