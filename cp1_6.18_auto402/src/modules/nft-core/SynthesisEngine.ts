import { v4 as uuidv4 } from 'uuid'
import type { Fragment, Artwork, Rarity } from '../../types'

const ARTWORK_DESCRIPTIONS: Record<string, string[]> = {
  g_cosmic: ['浩瀚星河在指尖流淌，每一粒星尘都诉说着宇宙的起源与秘密。'],
  g_ocean: ['深海之下，万籁俱寂，唯有你的心跳与远古的共鸣交织成永恒。'],
  g_forest: ['千年古树撑起一片天空，精灵在叶间起舞，时光在此凝固。'],
  g_city: ['霓虹闪烁如星辰，科技与梦想在此交汇，未来触手可及。'],
  g_ancient: ['符文闪烁着远古的光辉，先贤的智慧穿越时空与你对话。'],
  g_tech: ['量子纠缠的涟漪在你掌心绽放，AI的意识如星辰般觉醒。'],
  g_dream: ['梦境的边界在此消融，你是自己宇宙的创世者。'],
  g_crystal: ['千万道光芒在晶体间折射，映照出无限可能的平行世界。'],
}

const ARTWORK_NAMES: Record<string, string[]> = {
  g_cosmic: ['宇宙交响曲', '星辰之海', '创世星河'],
  g_ocean: ['深蓝之心', '深渊咏叹', '海神乐章'],
  g_forest: ['翡翠秘境', '生命之树', '精灵圣殿'],
  g_city: ['赛博之都', '未来天际', '霓虹之城'],
  g_ancient: ['远古遗章', '失落文明', '先知之眼'],
  g_tech: ['奇点黎明', '意识觉醒', '量子花园'],
  g_dream: ['幻境之旅', '织梦者', '梦之边界'],
  g_crystal: ['棱镜之塔', '光辉圣殿', '水晶之心'],
}

export interface SynthesisResult {
  success: boolean
  artwork?: Artwork
  error?: string
}

export class SynthesisEngine {
  static canSynthesize(fragments: Fragment[]): boolean {
    if (fragments.length !== 4) return false
    const groupId = fragments[0].groupId
    return fragments.every((f) => f.groupId === groupId)
  }

  static synthesize(fragments: Fragment[]): SynthesisResult {
    if (!this.canSynthesize(fragments)) {
      return { success: false, error: '需要4个同组碎片才能合成' }
    }

    const groupId = fragments[0].groupId
    const highestRarity = this.getHighestRarity(fragments.map((f) => f.rarity))

    const names = ARTWORK_NAMES[groupId] || ['数字奇境杰作']
    const descriptions = ARTWORK_DESCRIPTIONS[groupId] || ['一件独一无二的数字艺术品。']

    const artwork: Artwork = {
      id: uuidv4(),
      name: names[Math.floor(Math.random() * names.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      rarity: highestRarity,
      groupId,
      imageUrl: `https://picsum.photos/id/${fragments[0].imageId + 100}/400/600`,
      createdAt: Date.now(),
    }

    return { success: true, artwork }
  }

  private static getHighestRarity(rarities: Rarity[]): Rarity {
    const order: Rarity[] = ['common', 'rare', 'epic', 'legendary']
    let highestIndex = 0
    for (const r of rarities) {
      const idx = order.indexOf(r)
      if (idx > highestIndex) highestIndex = idx
    }
    return order[highestIndex]
  }

  static getProgressByGroup(fragments: Fragment[]): Map<string, number> {
    const progress = new Map<string, number>()
    for (const f of fragments) {
      progress.set(f.groupId, (progress.get(f.groupId) || 0) + 1)
    }
    return progress
  }
}
