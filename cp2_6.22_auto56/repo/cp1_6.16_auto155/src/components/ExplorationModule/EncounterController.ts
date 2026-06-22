import type { PathPoint, EncounterEvent, EncounterType } from '../../types'
import { EncounterType as ET } from '../../types'
import { v4 as uuidv4 } from 'uuid'

class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed >>> 0
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0
    return this.seed / 0xffffffff
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
}

interface EncounterTemplate {
  type: EncounterType
  titles: string[]
  descriptions: string[]
  actions: string[][]
}

const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  {
    type: ET.COMBAT,
    titles: [
      '遭遇山贼',
      '野兽袭击',
      '亡灵出没',
      '敌对佣兵',
      '巨型蜘蛛',
      '黑暗骑士',
    ],
    descriptions: [
      '一伙山贼从林间冲出，挥舞着生锈的弯刀。他们的眼神中透着绝望与贪婪。',
      '饥饿的猛兽咆哮着从草丛中跃出，尖牙和利爪闪着寒光。',
      '雾气中浮现出模糊的身影，腐烂的气味弥漫开来——不死生物苏醒了。',
      '一群身穿黑色铠甲的佣兵挡住了去路，他们的雇主显然不太友善。',
      '巨大的蛛网悬挂在树梢，八只血红的眼睛在阴影中闪烁。',
      '马蹄声轰鸣，一名全身漆黑的骑士手持长矛，冰冷的面罩下似乎毫无生气。',
    ],
    actions: [
      ['拔剑迎战', '尝试谈判', '快速逃跑'],
      ['正面硬刚', '寻找弱点', '设置陷阱'],
      ['使用道具', '大声呼救', '小心潜行'],
    ],
  },
  {
    type: ET.TRADE,
    titles: [
      '游商路过',
      '神秘商人',
      '冒险者营地',
      '村落市集',
      '魔法商队',
    ],
    descriptions: [
      '一位年长的商人坐在骡车旁，热情地招呼着路人。他的货物似乎颇为丰富。',
      '戴着兜帽的神秘人物从阴影中走出，声称有稀有的宝物出售。',
      '一群友善的冒险者正在休息，他们愿意交换多余的物资。',
      '远处升起炊烟，一个小型村落出现在眼前。村民们正在市集上交易。',
      '被魔法护符环绕的商队缓缓驶来，他们专门经营稀有的魔法物品。',
    ],
    actions: [
      ['查看货物', '讨价还价', '离开此地'],
      ['出售物品', '打探消息', '邀请同行'],
      ['购买补给', '修理装备', '兑换金币'],
    ],
  },
  {
    type: ET.DISCOVERY,
    titles: [
      '古代遗迹',
      '神秘洞穴',
      '宝藏地图',
      '古老神殿',
      '魔法水晶',
      '失踪旅人',
      '奇异植物',
    ],
    descriptions: [
      '藤蔓覆盖的石门从土中露出，上面刻着早已失传的符文。或许里面藏有秘密。',
      '一个黑漆漆的洞口吸引了注意，冷风从深处吹来，夹杂着奇异的气息。',
      '在一具枯骨的手中发现了一张泛黄的羊皮纸，上面绘制着模糊的地图。',
      '宏伟的石柱矗立于林间，诉说着一个被遗忘神灵的传说。',
      '一块散发着柔和光芒的水晶嵌在岩壁中，似乎蕴含着强大的能量。',
      '一位衣衫褴褛的旅人瘫坐在路边，虚弱地请求帮助。他似乎经历了可怕的事情。',
      '从未见过的花朵在草地上绽放，花瓣上流动着不可思议的色彩。',
    ],
    actions: [
      ['深入探索', '谨慎观察', '标记位置稍后再来'],
      ['收集物品', '研究符文', '休息片刻'],
      ['记录发现', '寻找线索', '继续赶路'],
    ],
  },
]

export class EncounterController {
  private rng: SeededRandom

  constructor(seed: number) {
    this.rng = new SeededRandom(seed + 87654)
  }

  private pickEncounterType(): EncounterType {
    const r = this.rng.next()
    if (r < 0.4) return ET.COMBAT
    if (r < 0.75) return ET.TRADE
    return ET.DISCOVERY
  }

  private generateEvent(x: number, y: number): EncounterEvent {
    const type = this.pickEncounterType()
    const template = ENCOUNTER_TEMPLATES.find((t) => t.type === type)!
    const title = this.rng.pick(template.titles)
    const description = this.rng.pick(template.descriptions)
    const actions = this.rng.pick(template.actions)
    return {
      id: uuidv4(),
      x,
      y,
      type,
      title,
      description,
      actions: [...actions],
      note: '',
      timestamp: Date.now(),
    }
  }

  generateEncounters(route: PathPoint[]): EncounterEvent[] {
    if (route.length < 6) return []
    const encounters: EncounterEvent[] = []
    const usedIndices = new Set<number>()
    let idx = this.rng.nextInt(5, 10)
    while (idx < route.length - 1) {
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx)
        const point = route[idx]
        encounters.push(this.generateEvent(point.x, point.y))
      }
      const nextStep = this.rng.nextInt(5, 10)
      idx += nextStep
    }
    return encounters
  }
}

export function generateEncounters(
  route: PathPoint[],
  seed: number
): EncounterEvent[] {
  const controller = new EncounterController(seed)
  return controller.generateEncounters(route)
}
