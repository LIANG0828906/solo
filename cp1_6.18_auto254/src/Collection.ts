import { CraftedItem, ItemType, ItemQuality, RuneType } from './types'
import { RUNE_DATA } from './Rune'

export const QUALITY_COLORS: Record<ItemQuality, string> = {
  [ItemQuality.COMMON]: '#9E9E9E',
  [ItemQuality.UNCOMMON]: '#4CAF50',
  [ItemQuality.RARE]: '#2196F3',
  [ItemQuality.EPIC]: '#9C27B0',
  [ItemQuality.LEGENDARY]: '#FF9800'
}

export const QUALITY_NAMES: Record<ItemQuality, string> = {
  [ItemQuality.COMMON]: '普通',
  [ItemQuality.UNCOMMON]: '优秀',
  [ItemQuality.RARE]: '稀有',
  [ItemQuality.EPIC]: '史诗',
  [ItemQuality.LEGENDARY]: '传说'
}

export const ITEM_TYPE_NAMES: Record<ItemType, string> = {
  [ItemType.WEAPON]: '武器',
  [ItemType.ARMOR]: '护甲',
  [ItemType.ACCESSORY]: '饰品'
}

export class CollectionManager {
  private items: CraftedItem[] = []
  private visibleCount: number = 6
  private scrollOffset: number = 0

  constructor() {}

  public setItems(items: CraftedItem[]): void {
    this.items = items
  }

  public getVisibleItems(): CraftedItem[] {
    const start = this.scrollOffset
    const end = Math.min(this.scrollOffset + this.visibleCount, this.items.length)
    return this.items.slice(start, end)
  }

  public getTotalCount(): number {
    return this.items.length
  }

  public needsVirtualScroll(): boolean {
    return this.items.length > 12
  }

  public setScrollOffset(offset: number): void {
    const maxOffset = Math.max(0, this.items.length - this.visibleCount)
    this.scrollOffset = Math.max(0, Math.min(maxOffset, offset))
  }

  public getScrollOffset(): number {
    return this.scrollOffset
  }

  public getItemStats(item: CraftedItem): string[] {
    const stats: string[] = []

    if (item.attack !== undefined) {
      stats.push(`攻击力: ${item.attack}`)
    }
    if (item.defense !== undefined) {
      stats.push(`防御力: ${item.defense}`)
    }
    if (item.elementDamage !== undefined) {
      const elementName = RUNE_DATA[item.primaryElement]?.name || '元素'
      stats.push(`${elementName}伤害: ${item.elementDamage}`)
    }
    if (item.elementResistance !== undefined) {
      const elementName = RUNE_DATA[item.primaryElement]?.name || '元素'
      stats.push(`${elementName}抗性: ${item.elementResistance}`)
    }
    if (item.cooldownReduction !== undefined) {
      stats.push(`冷却缩减: ${item.cooldownReduction}%`)
    }

    return stats
  }
}

export function generateItemIconSVG(item: CraftedItem): string {
  const qualityColor = QUALITY_COLORS[item.quality]
  const elementColor = RUNE_DATA[item.primaryElement]?.color || '#FFF'

  let shapeSVG = ''

  switch (item.type) {
    case ItemType.WEAPON:
      shapeSVG = `
        <polygon points="50,10 60,40 90,45 65,60 75,90 50,75 25,90 35,60 10,45 40,40"
                 fill="${elementColor}" stroke="${qualityColor}" stroke-width="2"/>
      `
      break
    case ItemType.ARMOR:
      shapeSVG = `
        <path d="M50,15 L80,30 L80,60 Q80,80 L50,95 L20,80 Q20,60 L20,30 Z"
              fill="${elementColor}" stroke="${qualityColor}" stroke-width="2"/>
      `
      break
    case ItemType.ACCESSORY:
      shapeSVG = `
        <circle cx="50" cy="50" r="35" fill="none" stroke="${qualityColor}" stroke-width="3"/>
        <circle cx="50" cy="50" r="25" fill="${elementColor}" opacity="0.6"/>
        <circle cx="50" cy="50" r="12" fill="${qualityColor}"/>
      `
      break
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      ${shapeSVG}
    </svg>
  `
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
