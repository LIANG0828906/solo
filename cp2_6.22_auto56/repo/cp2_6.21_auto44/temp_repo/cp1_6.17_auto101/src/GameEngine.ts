export interface HSLColor {
  h: number
  s: number
  l: number
}

export interface Material {
  id: string
  name: string
  icon: string
  color: HSLColor
  property: string
}

export interface Recipe {
  id: string
  name: string
  description: string
  materials: string[]
  themeColor: HSLColor
}

export type LogLevel = 'success' | 'error' | 'info'

export interface ReactionResult {
  description: string
  level: LogLevel
  matchedRecipe: Recipe | null
}

export const MATERIALS: Material[] = [
  { id: 'red_crystal', name: '红色水晶', icon: '💎', color: { h: 0, s: 90, l: 55 }, property: '蕴含生命能量，增强药剂效力' },
  { id: 'golden_flame', name: '金色火焰', icon: '🔥', color: { h: 45, s: 100, l: 55 }, property: '燃烧属性，易挥发' },
  { id: 'green_leaf', name: '绿色草叶', icon: '🌿', color: { h: 120, s: 70, l: 40 }, property: '自然属性，富含叶绿素' },
  { id: 'water_drop', name: '纯净水滴', icon: '💧', color: { h: 200, s: 80, l: 60 }, property: '溶剂属性，中和反应' },
  { id: 'sulfur', name: '硫磺石', icon: '🟡', color: { h: 55, s: 95, l: 50 }, property: '臭鸡蛋味，易爆' },
  { id: 'saltpeter', name: '硝石粉', icon: '⬜', color: { h: 0, s: 0, l: 85 }, property: '氧化剂，催化燃烧' },
  { id: 'moonstone', name: '月光石', icon: '🌙', color: { h: 240, s: 30, l: 75 }, property: '神秘属性，提升魔力' },
  { id: 'dragon_scale', name: '龙鳞片', icon: '🐉', color: { h: 280, s: 60, l: 45 }, property: '稀有材料，强防御属性' },
  { id: 'shadow_essence', name: '暗影精华', icon: '🌑', color: { h: 270, s: 40, l: 20 }, property: '黑暗属性，隐匿身形' },
  { id: 'phoenix_feather', name: '凤凰羽', icon: '🪶', color: { h: 15, s: 95, l: 55 }, property: '不死鸟之力，恢复生命' },
  { id: 'mandrake_root', name: '曼德拉根', icon: '🌱', color: { h: 90, s: 60, l: 35 }, property: '尖叫植物，强效魔法' },
  { id: 'quicksilver', name: '水银珠', icon: '⚗️', color: { h: 200, s: 10, l: 65 }, property: '流动金属，转换形态' },
  { id: 'star_dust', name: '星尘粉', icon: '✨', color: { h: 50, s: 70, l: 80 }, property: '天外之物，许愿成真' },
  { id: 'unicorn_hair', name: '独角兽鬃', icon: '🦄', color: { h: 330, s: 40, l: 85 }, property: '纯洁之力，净化毒素' },
  { id: 'obsidian', name: '黑曜石', icon: '🖤', color: { h: 0, s: 0, l: 10 }, property: '火山玻璃，吸收能量' },
  { id: 'amber_resin', name: '琥珀树脂', icon: '🟠', color: { h: 35, s: 90, l: 50 }, property: '远古树脂，凝固时间' },
]

export const RECIPES: Recipe[] = [
  {
    id: 'life_potion',
    name: '生命药剂',
    description: '蕴含强大生命力的红色药剂，可治愈伤病并恢复活力',
    materials: ['red_crystal', 'water_drop', 'green_leaf'],
    themeColor: { h: 0, s: 85, l: 55 },
  },
  {
    id: 'explosive_powder',
    name: '爆炸粉',
    description: '危险的炼金产物，遇火即爆，威力惊人',
    materials: ['golden_flame', 'sulfur', 'saltpeter'],
    themeColor: { h: 30, s: 100, l: 55 },
  },
  {
    id: 'invisibility_elixir',
    name: '隐身药水',
    description: '饮下后可暂时隐身于阴影之中，无人可见',
    materials: ['shadow_essence', 'moonstone', 'quicksilver'],
    themeColor: { h: 260, s: 50, l: 45 },
  },
  {
    id: 'phoenix_tear',
    name: '凤凰之泪',
    description: '传说中能起死回生的神药，散发永恒光芒',
    materials: ['phoenix_feather', 'unicorn_hair', 'star_dust'],
    themeColor: { h: 45, s: 90, l: 65 },
  },
  {
    id: 'time_freeze',
    name: '时间凝固剂',
    description: '古老的禁忌配方，可短暂冻结周围时间流动',
    materials: ['amber_resin', 'obsidian', 'mandrake_root'],
    themeColor: { h: 25, s: 80, l: 40 },
  },
]

export const TOTAL_RECIPES = RECIPES.length

function hslToString(c: HSLColor, alpha = 1): string {
  return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${alpha})`
}

export function mixHSLColors(colors: HSLColor[]): HSLColor {
  if (colors.length === 0) {
    return { h: 0, s: 0, l: 30 }
  }

  let sumSin = 0
  let sumCos = 0
  let sumS = 0
  let sumL = 0

  for (const c of colors) {
    const rad = (c.h * Math.PI) / 180
    sumSin += Math.sin(rad)
    sumCos += Math.cos(rad)
    sumS += c.s
    sumL += c.l
  }

  const n = colors.length
  const avgSin = sumSin / n
  const avgCos = sumCos / n
  let h = (Math.atan2(avgSin, avgCos) * 180) / Math.PI
  if (h < 0) h += 360

  return {
    h: Math.round(h),
    s: Math.round(sumS / n),
    l: Math.round(sumL / n),
  }
}

export function getComplementaryColor(c: HSLColor): HSLColor {
  return {
    h: (c.h + 180) % 360,
    s: c.s,
    l: Math.min(80, c.l + 20),
  }
}

export function checkRecipe(selectedMaterialIds: string[]): Recipe | null {
  if (selectedMaterialIds.length === 0) return null

  const sortedSelected = [...selectedMaterialIds].sort()

  for (const recipe of RECIPES) {
    const sortedRecipe = [...recipe.materials].sort()
    if (
      sortedSelected.length === sortedRecipe.length &&
      sortedSelected.every((id, idx) => id === sortedRecipe[idx])
    ) {
      return recipe
    }
  }

  return null
}

export function getMaterialById(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id)
}

export function generateReactionDescription(
  material: Material,
  currentColors: HSLColor[],
  matched: boolean,
  level: LogLevel,
  recipeName?: string,
): string {
  const colorAfter = mixHSLColors([...currentColors, material.color])
  const hueName = getHueName(colorAfter.h)

  if (matched && recipeName) {
    return `✨ 完美！将${material.name}加入坩埚，瞬间迸发强光——成功合成【${recipeName}】！`
  }

  const effects = [
    `将${material.name}加入坩埚，溶液变为${hueName}色`,
    `投入${material.name}，坩埚中泛起${hueName}色漩涡`,
    `${material.name}缓缓溶解，液体呈现${hueName}色调`,
  ]

  const suffixes = level === 'error'
    ? '，产生刺鼻浓烟！'
    : level === 'info' && currentColors.length >= 2
    ? '，开始冒泡沸腾'
    : ''

  return effects[Math.floor(Math.random() * effects.length)] + suffixes
}

function getHueName(h: number): string {
  if (h < 15 || h >= 345) return '红'
  if (h < 45) return '橙红'
  if (h < 65) return '橙黄'
  if (h < 90) return '黄绿'
  if (h < 150) return '翠绿'
  if (h < 180) return '青'
  if (h < 210) return '天蓝'
  if (h < 255) return '宝蓝'
  if (h < 285) return '紫'
  if (h < 320) return '品红'
  return '玫红'
}

export function applyMaterial(
  materialId: string,
  existingMaterialIds: string[],
): ReactionResult {
  const material = getMaterialById(materialId)
  if (!material) {
    return {
      description: '未知材料，坩埚无反应',
      level: 'error',
      matchedRecipe: null,
    }
  }

  const newIds = [...existingMaterialIds, materialId]
  const existingColors = existingMaterialIds
    .map((id) => getMaterialById(id))
    .filter((m): m is Material => !!m)
    .map((m) => m.color)

  const matchedRecipe = checkRecipe(newIds)
  let level: LogLevel = 'info'

  if (matchedRecipe) {
    level = 'success'
  } else if (newIds.length > 5) {
    level = 'error'
  }

  const description = generateReactionDescription(
    material,
    existingColors,
    !!matchedRecipe,
    level,
    matchedRecipe?.name,
  )

  return {
    description,
    level,
    matchedRecipe,
  }
}

export { hslToString }
