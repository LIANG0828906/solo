import { RuneType, ItemType, ItemQuality, CraftedItem, Recipe, RecipeDictionary } from './types'

export const RECIPES: RecipeDictionary = [
  {
    runes: [RuneType.FIRE, RuneType.FIRE, RuneType.EARTH],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.RARE,
    name: '炎石战锤',
    baseStats: { attack: 45, elementDamage: 20 }
  },
  {
    runes: [RuneType.FIRE, RuneType.FIRE, RuneType.FIRE],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.EPIC,
    name: '烈焰巨剑',
    baseStats: { attack: 55, elementDamage: 30 }
  },
  {
    runes: [RuneType.ICE, RuneType.ICE, RuneType.EARTH],
    itemType: ItemType.ARMOR,
    quality: ItemQuality.RARE,
    name: '霜岩护甲',
    baseStats: { defense: 35, elementResistance: 25 }
  },
  {
    runes: [RuneType.ICE, RuneType.ICE, RuneType.ICE],
    itemType: ItemType.ARMOR,
    quality: ItemQuality.EPIC,
    name: '极地战袍',
    baseStats: { defense: 42, elementResistance: 35 }
  },
  {
    runes: [RuneType.THUNDER, RuneType.WIND, RuneType.FIRE],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.EPIC,
    name: '风暴长矛',
    baseStats: { attack: 50, elementDamage: 28 }
  },
  {
    runes: [RuneType.SHADOW, RuneType.SHADOW, RuneType.WIND],
    itemType: ItemType.ACCESSORY,
    quality: ItemQuality.EPIC,
    name: '暗影护符',
    baseStats: { cooldownReduction: 18 }
  },
  {
    runes: [RuneType.FIRE, RuneType.ICE],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.UNCOMMON,
    name: '霜火匕首',
    baseStats: { attack: 30, elementDamage: 12 }
  },
  {
    runes: [RuneType.EARTH, RuneType.EARTH],
    itemType: ItemType.ARMOR,
    quality: ItemQuality.UNCOMMON,
    name: '岩石护胸',
    baseStats: { defense: 25, elementResistance: 15 }
  },
  {
    runes: [RuneType.WIND, RuneType.WIND],
    itemType: ItemType.ACCESSORY,
    quality: ItemQuality.UNCOMMON,
    name: '疾风指环',
    baseStats: { cooldownReduction: 10 }
  },
  {
    runes: [RuneType.THUNDER, RuneType.THUNDER],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.RARE,
    name: '雷霆之剑',
    baseStats: { attack: 42, elementDamage: 22 }
  },
  {
    runes: [RuneType.SHADOW, RuneType.SHADOW],
    itemType: ItemType.ACCESSORY,
    quality: ItemQuality.RARE,
    name: '暗月吊坠',
    baseStats: { cooldownReduction: 15 }
  },
  {
    runes: [RuneType.EARTH, RuneType.FIRE, RuneType.ICE],
    itemType: ItemType.ARMOR,
    quality: ItemQuality.RARE,
    name: '元素壁垒',
    baseStats: { defense: 38, elementResistance: 20 }
  },
  {
    runes: [RuneType.WIND, RuneType.FIRE, RuneType.ICE],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.RARE,
    name: '元素之刃',
    baseStats: { attack: 48, elementDamage: 25 }
  },
  {
    runes: [RuneType.THUNDER, RuneType.THUNDER, RuneType.WIND],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.EPIC,
    name: '雷神之锤',
    baseStats: { attack: 58, elementDamage: 32 }
  },
  {
    runes: [RuneType.EARTH, RuneType.EARTH, RuneType.EARTH],
    itemType: ItemType.ARMOR,
    quality: ItemQuality.LEGENDARY,
    name: '大地之心',
    baseStats: { defense: 50, elementResistance: 40 }
  },
  {
    runes: [RuneType.SHADOW, RuneType.FIRE, RuneType.ICE, RuneType.THUNDER],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.LEGENDARY,
    name: '混沌之刃',
    baseStats: { attack: 65, elementDamage: 40 }
  },
  {
    runes: [RuneType.EARTH, RuneType.EARTH, RuneType.ICE, RuneType.FIRE],
    itemType: ItemType.ARMOR,
    quality: ItemQuality.LEGENDARY,
    name: '四象护甲',
    baseStats: { defense: 55, elementResistance: 45 }
  },
  {
    runes: [RuneType.FIRE, RuneType.ICE, RuneType.THUNDER, RuneType.WIND],
    itemType: ItemType.WEAPON,
    quality: ItemQuality.LEGENDARY,
    name: '四元素权杖',
    baseStats: { attack: 60, elementDamage: 38 }
  }
]

export function findMatchingRecipe(runeSequence: RuneType[]): Recipe | null {
  if (runeSequence.length < 2 || runeSequence.length > 5) return null

  for (const recipe of RECIPES) {
    if (recipe.runes.length !== runeSequence.length) continue

    const matches = recipe.runes.every((rune, index) => rune === runeSequence[index])
    if (matches) return recipe

    const sortedRecipe = [...recipe.runes].sort()
    const sortedRunes = [...runeSequence].sort()
    const sortedMatches = sortedRecipe.every((rune, index) => rune === sortedRunes[index])
    if (sortedMatches) return recipe
  }

  return null
}

export function getCraftingHint(runeSequence: RuneType[]): string {
  if (runeSequence.length === 0) {
    return '将符文拖入熔炉开始锻造'
  }
  if (runeSequence.length < 2) {
    return '至少需要2个符文才能锻造'
  }

  const partialMatches = RECIPES.filter((recipe) => {
    if (recipe.runes.length < runeSequence.length) return false
    return runeSequence.every((rune, index) => recipe.runes[index] === rune)
  })

  if (partialMatches.length > 0) {
    const bestMatch = partialMatches.reduce((best, current) =>
      current.runes.length < best.runes.length ? current : best
    )
    return `可能合成：${bestMatch.name}`
  }

  const possibleRecipes = RECIPES.filter(
    (recipe) => recipe.runes.length === runeSequence.length
  )

  if (possibleRecipes.length > 0) {
    const elements = runeSequence.map((r) => {
      const names: Record<RuneType, string> = {
        [RuneType.FIRE]: '火焰',
        [RuneType.ICE]: '冰霜',
        [RuneType.THUNDER]: '雷电',
        [RuneType.EARTH]: '大地',
        [RuneType.WIND]: '风',
        [RuneType.SHADOW]: '暗影'
      }
      return names[r]
    })
    return `当前符文：${elements.join(' + ')}`
  }

  return '继续添加符文探索更多配方'
}

export function craftItem(
  runeSequence: RuneType[],
  temperature: number,
  craftDuration: number
): CraftedItem | null {
  if (runeSequence.length < 2 || runeSequence.length > 5) return null

  const recipe = findMatchingRecipe(runeSequence)

  const primaryElement = runeSequence[0]
  const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const tempFactor = Math.max(0.5, Math.min(1.5, temperature / 1000))
  const timeFactor = Math.max(0.8, Math.min(1.3, craftDuration / 5000))

  const qualityOrder = [
    ItemQuality.COMMON,
    ItemQuality.UNCOMMON,
    ItemQuality.RARE,
    ItemQuality.EPIC,
    ItemQuality.LEGENDARY
  ]

  if (recipe) {
    const baseQualityIndex = qualityOrder.indexOf(recipe.quality)
    let qualityIndex = baseQualityIndex
    if (tempFactor > 1.1 && timeFactor > 1.1) {
      qualityIndex = Math.min(qualityOrder.length - 1, baseQualityIndex + 1)
    } else if (tempFactor < 0.8 || timeFactor < 0.9) {
      qualityIndex = Math.max(0, baseQualityIndex - 1)
    }

    const quality = qualityOrder[qualityIndex]
    const statMultiplier = 0.8 + (qualityIndex * 0.15) * tempFactor * timeFactor

    return {
      id,
      name: recipe.name,
      type: recipe.itemType,
      quality,
      primaryElement,
      attack: recipe.baseStats.attack ? Math.round(recipe.baseStats.attack * statMultiplier) : undefined,
      defense: recipe.baseStats.defense ? Math.round(recipe.baseStats.defense * statMultiplier) : undefined,
      cooldownReduction: recipe.baseStats.cooldownReduction
        ? Math.round(recipe.baseStats.cooldownReduction * statMultiplier * 10) / 10
        : undefined,
      elementDamage: recipe.baseStats.elementDamage
        ? Math.round(recipe.baseStats.elementDamage * statMultiplier)
        : undefined,
      elementResistance: recipe.baseStats.elementResistance
        ? Math.round(recipe.baseStats.elementResistance * statMultiplier)
        : undefined,
      runeSequence: [...runeSequence],
      temperature,
      craftTime: craftDuration
    }
  }

  let itemType: ItemType
  const fireCount = runeSequence.filter((r) => r === RuneType.FIRE).length
  const earthCount = runeSequence.filter((r) => r === RuneType.EARTH).length
  const windCount = runeSequence.filter((r) => r === RuneType.WIND).length
  const shadowCount = runeSequence.filter((r) => r === RuneType.SHADOW).length
  const thunderCount = runeSequence.filter((r) => r === RuneType.THUNDER).length
  const iceCount = runeSequence.filter((r) => r === RuneType.ICE).length

  if (fireCount >= 2 || thunderCount >= 2) {
    itemType = ItemType.WEAPON
  } else if (earthCount >= 2 || iceCount >= 2) {
    itemType = ItemType.ARMOR
  } else if (windCount >= 2 || shadowCount >= 2) {
    itemType = ItemType.ACCESSORY
  } else {
    const rand = Math.random()
    if (rand < 0.4) itemType = ItemType.WEAPON
    else if (rand < 0.7) itemType = ItemType.ARMOR
    else itemType = ItemType.ACCESSORY
  }

  const lengthBonus = runeSequence.length * 0.1
  const baseMultiplier = (0.6 + tempFactor * 0.4) * (0.7 + timeFactor * 0.3) * (1 + lengthBonus)

  const qualityIndex = Math.min(
    qualityOrder.length - 1,
    Math.floor(runeSequence.length * baseMultiplier) - 1
  )
  const quality = qualityOrder[Math.max(0, qualityIndex)]

  const elementNames: Record<RuneType, string> = {
    [RuneType.FIRE]: '焰',
    [RuneType.ICE]: '霜',
    [RuneType.THUNDER]: '雷',
    [RuneType.EARTH]: '岩',
    [RuneType.WIND]: '风',
    [RuneType.SHADOW]: '暗'
  }

  const typeNames: Record<ItemType, string> = {
    [ItemType.WEAPON]: '之剑',
    [ItemType.ARMOR]: '之甲',
    [ItemType.ACCESSORY]: '护符'
  }

  const name = elementNames[primaryElement] + typeNames[itemType]

  const result: CraftedItem = {
    id,
    name,
    type: itemType,
    quality,
    primaryElement,
    runeSequence: [...runeSequence],
    temperature,
    craftTime: craftDuration
  }

  const statFactor = baseMultiplier * (1 + qualityIndex * 0.2)

  switch (itemType) {
    case ItemType.WEAPON:
      result.attack = Math.round(20 + 30 * statFactor)
      result.elementDamage = Math.round(10 + 20 * statFactor)
      break
    case ItemType.ARMOR:
      result.defense = Math.round(15 + 25 * statFactor)
      result.elementResistance = Math.round(8 + 18 * statFactor)
      break
    case ItemType.ACCESSORY:
      result.cooldownReduction = Math.round((5 + 12 * statFactor) * 10) / 10
      break
  }

  return result
}
