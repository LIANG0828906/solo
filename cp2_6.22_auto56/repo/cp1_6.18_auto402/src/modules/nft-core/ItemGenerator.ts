import { v4 as uuidv4 } from 'uuid'
import type { Fragment, Rarity, ActivityType } from '../../types'

const GROUPS = [
  { id: 'g_cosmic', name: '宇宙星辰', imageId: 1 },
  { id: 'g_ocean', name: '深海秘境', imageId: 10 },
  { id: 'g_forest', name: '远古森林', imageId: 20 },
  { id: 'g_city', name: '未来都市', imageId: 30 },
  { id: 'g_ancient', name: '上古遗迹', imageId: 40 },
  { id: 'g_tech', name: '科技奇点', imageId: 50 },
  { id: 'g_dream', name: '梦境幻境', imageId: 60 },
  { id: 'g_crystal', name: '水晶宫殿', imageId: 70 },
]

const FRAGMENT_NAMES: Record<string, string[]> = {
  g_cosmic: ['星核碎片', '银河之尘', '黑洞边缘', '星云精华'],
  g_ocean: ['深渊之鳞', '珊瑚之泪', '海妖之歌', '珍珠碎片'],
  g_forest: ['古树年轮', '精灵之叶', '翡翠藤条', '晨露结晶'],
  g_city: ['霓虹芯片', '悬浮引擎', '量子核心', '能量电池'],
  g_ancient: ['符文石板', '青铜碎片', '神秘卷轴', '祭司令牌'],
  g_tech: ['AI意识芯片', '纳米组件', '能源核心', '时空锚点'],
  g_dream: ['迷雾碎片', '幻影水晶', '记忆残片', '愿望之星'],
  g_crystal: ['棱镜晶体', '光辉碎片', '折射宝石', '能量晶核'],
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#AAAAAA',
  rare: '#FFD700',
  epic: '#9B59B6',
  legendary: '#E74C3C',
}

export function getRarityColor(rarity: Rarity): string {
  return RARITY_COLORS[rarity]
}

export function getRarityName(rarity: Rarity): string {
  const names: Record<Rarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  }
  return names[rarity]
}

export class ItemGenerator {
  static generateFragmentByPuzzle(difficulty: number, timeSpent: number): Fragment {
    let rarity: Rarity
    if (timeSpent < 30) {
      rarity = 'legendary'
    } else if (timeSpent < 60) {
      rarity = 'epic'
    } else {
      rarity = 'rare'
    }
    return this.createFragment(rarity)
  }

  static generateFragmentByQuiz(correctCount: number, totalQuestions: number): Fragment {
    const ratio = correctCount / totalQuestions
    let rarity: Rarity
    if (ratio >= 1) {
      rarity = Math.random() > 0.3 ? 'epic' : 'legendary'
    } else if (ratio >= 0.66) {
      rarity = Math.random() > 0.5 ? 'rare' : 'epic'
    } else if (ratio >= 0.33) {
      rarity = Math.random() > 0.3 ? 'common' : 'rare'
    } else {
      rarity = 'common'
    }
    return this.createFragment(rarity)
  }

  static generateFragmentByRarity(rarity: Rarity): Fragment {
    return this.createFragment(rarity)
  }

  private static createFragment(rarity: Rarity): Fragment {
    const group = GROUPS[Math.floor(Math.random() * GROUPS.length)]
    const names = FRAGMENT_NAMES[group.id]
    const name = names[Math.floor(Math.random() * names.length)]
    return {
      id: uuidv4(),
      name,
      rarity,
      groupId: group.id,
      groupName: group.name,
      imageId: group.imageId + Math.floor(Math.random() * 8),
    }
  }

  static generateInitialFragments(count: number): Fragment[] {
    const fragments: Fragment[] = []
    for (let i = 0; i < count; i++) {
      fragments.push(this.createFragment('common'))
    }
    return fragments
  }

  static getGroups(): typeof GROUPS {
    return GROUPS
  }
}
