import { v4 as uuidv4 } from 'uuid'

export interface FlavorProfile {
  spicy: number
  sweet: number
  fresh: number
  warm: number
  woody: number
}

export interface Spice {
  id: string
  name: string
  categoryId: string
  flavor: FlavorProfile
  angle: number
}

export interface SpiceCategory {
  id: string
  name: string
  hue: number
  saturation: number
  lightness: number
  description: string
  spices: Spice[]
}

export interface Recipe {
  id: string
  name: string
  description: string
  spices: string[]
  flavor: FlavorProfile
  primaryHue: number
}

export const CATEGORY_COUNT = 8
const HUE_STEP = 45
const SAT = 70
const LIGHT = 80

const spiceNamesByCategory: { name: string; flavor: FlavorProfile }[][] = [
  [
    { name: '小茴香', flavor: { spicy: 72, sweet: 35, fresh: 25, warm: 80, woody: 45 } },
    { name: '肉桂', flavor: { spicy: 65, sweet: 78, fresh: 10, warm: 92, woody: 55 } },
    { name: '丁香', flavor: { spicy: 88, sweet: 45, fresh: 15, warm: 75, woody: 50 } },
    { name: '黑胡椒', flavor: { spicy: 95, sweet: 5, fresh: 40, warm: 60, woody: 40 } },
    { name: '辣椒', flavor: { spicy: 100, sweet: 10, fresh: 20, warm: 85, woody: 15 } },
    { name: '五香粉', flavor: { spicy: 70, sweet: 40, fresh: 20, warm: 85, woody: 60 } },
  ],
  [
    { name: '八角', flavor: { spicy: 30, sweet: 75, fresh: 15, warm: 88, woody: 70 } },
    { name: '甘草', flavor: { spicy: 10, sweet: 95, fresh: 25, warm: 40, woody: 30 } },
    { name: '香草', flavor: { spicy: 5, sweet: 100, fresh: 20, warm: 70, woody: 15 } },
    { name: '蜂蜜花', flavor: { spicy: 8, sweet: 90, fresh: 45, warm: 30, woody: 10 } },
    { name: '红糖', flavor: { spicy: 15, sweet: 92, fresh: 5, warm: 65, woody: 25 } },
    { name: '枣子', flavor: { spicy: 5, sweet: 85, fresh: 30, warm: 50, woody: 20 } },
  ],
  [
    { name: '玫瑰', flavor: { spicy: 5, sweet: 65, fresh: 75, warm: 30, woody: 10 } },
    { name: '茉莉', flavor: { spicy: 3, sweet: 55, fresh: 90, warm: 20, woody: 5 } },
    { name: '薰衣草', flavor: { spicy: 8, sweet: 45, fresh: 85, warm: 35, woody: 30 } },
    { name: '洋甘菊', flavor: { spicy: 2, sweet: 60, fresh: 70, warm: 40, woody: 15 } },
    { name: '橙花', flavor: { spicy: 5, sweet: 70, fresh: 80, warm: 25, woody: 8 } },
    { name: '接骨木花', flavor: { spicy: 2, sweet: 50, fresh: 95, warm: 15, woody: 5 } },
  ],
  [
    { name: '薄荷', flavor: { spicy: 35, sweet: 25, fresh: 100, warm: 10, woody: 15 } },
    { name: '罗勒', flavor: { spicy: 40, sweet: 30, fresh: 85, warm: 35, woody: 20 } },
    { name: '迷迭香', flavor: { spicy: 55, sweet: 20, fresh: 75, warm: 50, woody: 60 } },
    { name: '百里香', flavor: { spicy: 50, sweet: 25, fresh: 70, warm: 55, woody: 50 } },
    { name: '牛至', flavor: { spicy: 60, sweet: 15, fresh: 65, warm: 45, woody: 40 } },
    { name: '鼠尾草', flavor: { spicy: 45, sweet: 20, fresh: 70, warm: 40, woody: 65 } },
  ],
  [
    { name: '檀香', flavor: { spicy: 15, sweet: 45, fresh: 20, warm: 70, woody: 100 } },
    { name: '雪松', flavor: { spicy: 20, sweet: 25, fresh: 45, warm: 55, woody: 95 } },
    { name: '广藿香', flavor: { spicy: 35, sweet: 30, fresh: 30, warm: 65, woody: 90 } },
    { name: '香根草', flavor: { spicy: 25, sweet: 35, fresh: 40, warm: 60, woody: 92 } },
    { name: '柏树', flavor: { spicy: 30, sweet: 15, fresh: 60, warm: 45, woody: 85 } },
    { name: '松木', flavor: { spicy: 28, sweet: 18, fresh: 70, warm: 40, woody: 88 } },
  ],
  [
    { name: '柠檬', flavor: { spicy: 15, sweet: 55, fresh: 95, warm: 20, woody: 10 } },
    { name: '橙子', flavor: { spicy: 10, sweet: 70, fresh: 85, warm: 35, woody: 15 } },
    { name: '葡萄柚', flavor: { spicy: 20, sweet: 50, fresh: 90, warm: 25, woody: 18 } },
    { name: '佛手柑', flavor: { spicy: 12, sweet: 65, fresh: 92, warm: 30, woody: 22 } },
    { name: '青柠', flavor: { spicy: 25, sweet: 45, fresh: 98, warm: 15, woody: 8 } },
    { name: '柑橘皮', flavor: { spicy: 30, sweet: 60, fresh: 80, warm: 45, woody: 30 } },
  ],
  [
    { name: '杏仁', flavor: { spicy: 8, sweet: 70, fresh: 20, warm: 55, woody: 75 } },
    { name: '核桃', flavor: { spicy: 5, sweet: 50, fresh: 25, warm: 50, woody: 85 } },
    { name: '榛子', flavor: { spicy: 6, sweet: 65, fresh: 15, warm: 60, woody: 80 } },
    { name: '开心果', flavor: { spicy: 10, sweet: 55, fresh: 40, warm: 45, woody: 70 } },
    { name: '腰果', flavor: { spicy: 3, sweet: 60, fresh: 18, warm: 48, woody: 65 } },
    { name: '花生', flavor: { spicy: 12, sweet: 45, fresh: 20, warm: 55, woody: 72 } },
  ],
  [
    { name: '香根', flavor: { spicy: 40, sweet: 25, fresh: 35, warm: 70, woody: 75 } },
    { name: '姜黄', flavor: { spicy: 55, sweet: 30, fresh: 25, warm: 75, woody: 60 } },
    { name: '生姜', flavor: { spicy: 70, sweet: 25, fresh: 45, warm: 80, woody: 35 } },
    { name: '高良姜', flavor: { spicy: 65, sweet: 20, fresh: 40, warm: 72, woody: 40 } },
    { name: '土茯苓', flavor: { spicy: 25, sweet: 40, fresh: 30, warm: 55, woody: 70 } },
    { name: '当归', flavor: { spicy: 35, sweet: 45, fresh: 20, warm: 68, woody: 55 } },
  ],
]

const categoryInfo = [
  { name: '辛香', description: '辛辣刺激，温暖热烈，为料理注入灵魂火花' },
  { name: '甜香', description: '醇厚甜美，温润舒心，带来甜蜜的味觉享受' },
  { name: '花香', description: '芬芳馥郁，雅致迷人，似置身春日花园' },
  { name: '草本', description: '清新自然，绿意盎然，田野山间的气息' },
  { name: '木质', description: '沉稳深厚，悠远绵长，森林深处的宁静' },
  { name: '柑橘', description: '酸爽明快，活力四射，阳光般的清新感' },
  { name: '坚果', description: '香浓饱满，细腻醇厚，大地的馈赠' },
  { name: '土香', description: '质朴醇厚，扎根大地，东方草本的智慧' },
]

export const spiceCategories: SpiceCategory[] = categoryInfo.map((info, i) => {
  const hue = i * HUE_STEP
  const spicesData = spiceNamesByCategory[i]
  const spices: Spice[] = spicesData.map((s, j) => {
    const spiceCount = spicesData.length
    const sectorStart = i * (360 / CATEGORY_COUNT)
    const sectorEnd = sectorStart + (360 / CATEGORY_COUNT)
    const angle = sectorStart + ((j + 0.5) / spiceCount) * (sectorEnd - sectorStart)
    return {
      id: uuidv4(),
      name: s.name,
      categoryId: `cat-${i}`,
      flavor: s.flavor,
      angle,
    }
  })
  return {
    id: `cat-${i}`,
    name: info.name,
    hue,
    saturation: SAT,
    lightness: LIGHT,
    description: info.description,
    spices,
  }
})

export const allSpices: Spice[] = spiceCategories.flatMap(c => c.spices)

export const getSpiceById = (id: string): Spice | undefined => {
  return allSpices.find(s => s.id === id)
}

export const getCategoryById = (id: string): SpiceCategory | undefined => {
  return spiceCategories.find(c => c.id === id)
}

export const hsl = (h: number, s: number, l: number, alpha = 1): string =>
  `hsla(${h}, ${s}%, ${l}%, ${alpha})`

export const classicRecipes: Recipe[] = [
  { id: uuidv4(), name: '五香粉', description: '中式经典，五味调和', spices: [], flavor: { spicy: 72, sweet: 42, fresh: 18, warm: 88, woody: 62 }, primaryHue: 0 },
  { id: uuidv4(), name: '咖喱粉', description: '印度风情，浓郁醇厚', spices: [], flavor: { spicy: 78, sweet: 38, fresh: 35, warm: 72, woody: 55 }, primaryHue: 45 },
  { id: uuidv4(), name: '香料茶', description: '印度玛莎拉茶，温暖治愈', spices: [], flavor: { spicy: 58, sweet: 68, fresh: 22, warm: 90, woody: 45 }, primaryHue: 22 },
  { id: uuidv4(), name: '十三香', description: '中式秘方，层次丰富', spices: [], flavor: { spicy: 65, sweet: 35, fresh: 25, warm: 82, woody: 68 }, primaryHue: 15 },
  { id: uuidv4(), name: '普罗旺斯香草', description: '法式浪漫，地中海气息', spices: [], flavor: { spicy: 42, sweet: 28, fresh: 78, warm: 45, woody: 52 }, primaryHue: 135 },
  { id: uuidv4(), name: '圣诞热红酒', description: '冬日暖意，节日必备', spices: [], flavor: { spicy: 55, sweet: 82, fresh: 35, warm: 92, woody: 40 }, primaryHue: 340 },
  { id: uuidv4(), name: '墨西哥辣调味', description: '热烈奔放，辣味十足', spices: [], flavor: { spicy: 92, sweet: 25, fresh: 42, warm: 70, woody: 28 }, primaryHue: 10 },
  { id: uuidv4(), name: '摩洛哥拉塞', description: '北非风情，甜辣交织', spices: [], flavor: { spicy: 62, sweet: 65, fresh: 30, warm: 78, woody: 55 }, primaryHue: 30 },
  { id: uuidv4(), name: '法式四重奏', description: '法餐经典，优雅平衡', spices: [], flavor: { spicy: 45, sweet: 32, fresh: 72, warm: 40, woody: 48 }, primaryHue: 120 },
  { id: uuidv4(), name: '黎巴嫩七香', description: '中东风情，神秘芬芳', spices: [], flavor: { spicy: 58, sweet: 42, fresh: 38, warm: 68, woody: 62 }, primaryHue: 50 },
  { id: uuidv4(), name: '匈牙利红椒', description: '东欧风味，色彩艳丽', spices: [], flavor: { spicy: 75, sweet: 45, fresh: 22, warm: 65, woody: 35 }, primaryHue: 5 },
  { id: uuidv4(), name: '埃塞俄比亚BERBERE', description: '非洲之魂，火热浓郁', spices: [], flavor: { spicy: 88, sweet: 35, fresh: 28, warm: 75, woody: 45 }, primaryHue: 8 },
  { id: uuidv4(), name: '泰国咖喱酱', description: '东南亚风味，椰香与辣', spices: [], flavor: { spicy: 82, sweet: 50, fresh: 55, warm: 58, woody: 38 }, primaryHue: 90 },
  { id: uuidv4(), name: '日式七味粉', description: '东瀛风味，麻香辣鲜', spices: [], flavor: { spicy: 70, sweet: 22, fresh: 48, warm: 55, woody: 42 }, primaryHue: 150 },
  { id: uuidv4(), name: '爪哇咖喱', description: '印尼风味，椰奶浓香', spices: [], flavor: { spicy: 68, sweet: 55, fresh: 42, warm: 70, woody: 58 }, primaryHue: 65 },
  { id: uuidv4(), name: '比利时炖肉香料', description: '欧洲家常，醇厚暖心', spices: [], flavor: { spicy: 48, sweet: 58, fresh: 25, warm: 80, woody: 55 }, primaryHue: 20 },
  { id: uuidv4(), name: '德式酸菜香料', description: '巴伐利亚传统，酸香开胃', spices: [], flavor: { spicy: 42, sweet: 30, fresh: 65, warm: 50, woody: 40 }, primaryHue: 100 },
  { id: uuidv4(), name: '英式烤鸡调味', description: '英伦经典，家常质朴', spices: [], flavor: { spicy: 35, sweet: 28, fresh: 75, warm: 55, woody: 45 }, primaryHue: 110 },
  { id: uuidv4(), name: '西班牙海鲜饭', description: '地中海阳光，藏红花香', spices: [], flavor: { spicy: 45, sweet: 48, fresh: 55, warm: 68, woody: 40 }, primaryHue: 55 },
  { id: uuidv4(), name: '意大利托斯卡纳', description: '橄榄与阳光，田园诗意', spices: [], flavor: { spicy: 38, sweet: 35, fresh: 80, warm: 45, woody: 52 }, primaryHue: 125 },
  { id: uuidv4(), name: '希腊柠檬香草', description: '爱琴海海风，清爽明亮', spices: [], flavor: { spicy: 22, sweet: 40, fresh: 88, warm: 35, woody: 28 }, primaryHue: 175 },
  { id: uuidv4(), name: '土耳其烤肉香料', description: '丝绸之路交汇，辛香浓郁', spices: [], flavor: { spicy: 72, sweet: 38, fresh: 35, warm: 75, woody: 58 }, primaryHue: 40 },
  { id: uuidv4(), name: '伊朗烤肉粉', description: '波斯风味，坚果芳香', spices: [], flavor: { spicy: 55, sweet: 52, fresh: 32, warm: 62, woody: 72 }, primaryHue: 295 },
  { id: uuidv4(), name: '埃及DUKKA', description: '坚果与香料的混合', spices: [], flavor: { spicy: 40, sweet: 50, fresh: 45, warm: 58, woody: 82 }, primaryHue: 310 },
  { id: uuidv4(), name: '突尼斯哈里萨', description: '北非辣酱，火热开胃', spices: [], flavor: { spicy: 90, sweet: 30, fresh: 48, warm: 65, woody: 32 }, primaryHue: 12 },
  { id: uuidv4(), name: '韩式泡菜香料', description: '韩式发酵，辣爽过瘾', spices: [], flavor: { spicy: 80, sweet: 35, fresh: 58, warm: 42, woody: 25 }, primaryHue: 160 },
  { id: uuidv4(), name: '印度CHAAT MASALA', description: '街头小吃灵魂，酸甜咸辣', spices: [], flavor: { spicy: 65, sweet: 55, fresh: 52, warm: 48, woody: 30 }, primaryHue: 330 },
  { id: uuidv4(), name: '中式卤料包', description: '老汤基底，醇厚绵长', spices: [], flavor: { spicy: 55, sweet: 48, fresh: 20, warm: 85, woody: 70 }, primaryHue: 25 },
  { id: uuidv4(), name: '四川麻辣', description: '天府之国，麻辣鲜香', spices: [], flavor: { spicy: 95, sweet: 15, fresh: 35, warm: 72, woody: 45 }, primaryHue: 18 },
  { id: uuidv4(), name: '新疆孜然烤', description: '西域风情，大漠烟香', spices: [], flavor: { spicy: 68, sweet: 22, fresh: 40, warm: 85, woody: 55 }, primaryHue: 52 },
  { id: uuidv4(), name: '云南香草火锅', description: '西南秘境，菌香草香', spices: [], flavor: { spicy: 45, sweet: 35, fresh: 68, warm: 50, woody: 60 }, primaryHue: 130 },
  { id: uuidv4(), name: '潮州卤水', description: '潮汕精髓，回甘悠长', spices: [], flavor: { spicy: 40, sweet: 62, fresh: 25, warm: 78, woody: 68 }, primaryHue: 35 },
  { id: uuidv4(), name: '台式三杯鸡', description: '宝岛风味，九层塔香', spices: [], flavor: { spicy: 38, sweet: 55, fresh: 62, warm: 60, woody: 42 }, primaryHue: 140 },
  { id: uuidv4(), name: '港式煲仔饭', description: '粤式精致，腊味飘香', spices: [], flavor: { spicy: 25, sweet: 58, fresh: 30, warm: 75, woody: 52 }, primaryHue: 42 },
  { id: uuidv4(), name: '新加坡肉骨茶', description: '南洋风味，药香浓郁', spices: [], flavor: { spicy: 42, sweet: 45, fresh: 35, warm: 72, woody: 68 }, primaryHue: 320 },
  { id: uuidv4(), name: '马来西亚LASKA', description: '娘惹风情，酸辣椰香', spices: [], flavor: { spicy: 75, sweet: 52, fresh: 65, warm: 52, woody: 38 }, primaryHue: 180 },
  { id: uuidv4(), name: '越南河粉香草', description: '法式殖民地，清新淡雅', spices: [], flavor: { spicy: 30, sweet: 35, fresh: 85, warm: 38, woody: 28 }, primaryHue: 155 },
  { id: uuidv4(), name: '印度奶茶MASALA', description: '清晨一杯，元气满满', spices: [], flavor: { spicy: 48, sweet: 75, fresh: 28, warm: 88, woody: 40 }, primaryHue: 28 },
  { id: uuidv4(), name: '摩洛哥薄荷茶', description: '北非国民饮品，清爽甜蜜', spices: [], flavor: { spicy: 25, sweet: 80, fresh: 92, warm: 20, woody: 15 }, primaryHue: 145 },
  { id: uuidv4(), name: '中东小豆蔻咖啡', description: '阿拉伯风情，神秘醇厚', spices: [], flavor: { spicy: 42, sweet: 38, fresh: 22, warm: 80, woody: 65 }, primaryHue: 60 },
  { id: uuidv4(), name: '墨西哥热巧克力', description: '阿兹特克风味，辣与甜的碰撞', spices: [], flavor: { spicy: 55, sweet: 88, fresh: 15, warm: 78, woody: 48 }, primaryHue: 350 },
  { id: uuidv4(), name: '法式焦糖布丁', description: '甜点经典，香草焦糖', spices: [], flavor: { spicy: 8, sweet: 95, fresh: 18, warm: 65, woody: 20 }, primaryHue: 38 },
  { id: uuidv4(), name: '土耳其软糖', description: '奥斯曼帝国遗韵，玫瑰芳香', spices: [], flavor: { spicy: 5, sweet: 88, fresh: 72, warm: 28, woody: 12 }, primaryHue: 325 },
  { id: uuidv4(), name: '印度拉杜甜点', description: '节庆必备，豆蔻与坚果', spices: [], flavor: { spicy: 32, sweet: 90, fresh: 25, warm: 72, woody: 55 }, primaryHue: 58 },
  { id: uuidv4(), name: '中式月饼五仁', description: '中秋传统，坚果满堂', spices: [], flavor: { spicy: 18, sweet: 78, fresh: 22, warm: 55, woody: 80 }, primaryHue: 305 },
  { id: uuidv4(), name: '北欧热饮GLOEGG', description: '斯堪的纳维亚冬日', spices: [], flavor: { spicy: 50, sweet: 78, fresh: 30, warm: 85, woody: 48 }, primaryHue: 345 },
  { id: uuidv4(), name: '德国姜饼LEBKUCHEN', description: '圣诞传统，肉桂蜂蜜', spices: [], flavor: { spicy: 45, sweet: 85, fresh: 18, warm: 82, woody: 52 }, primaryHue: 18 },
  { id: uuidv4(), name: '法式可丽饼香料', description: '布列塔尼风味，橙花柠檬', spices: [], flavor: { spicy: 12, sweet: 75, fresh: 72, warm: 35, woody: 18 }, primaryHue: 200 },
  { id: uuidv4(), name: '意式杏仁饼干', description: '意式经典，杏仁果香', spices: [], flavor: { spicy: 10, sweet: 82, fresh: 22, warm: 48, woody: 78 }, primaryHue: 290 },
  { id: uuidv4(), name: '泰式冬阴功', description: '泰国国汤，酸辣鲜香', spices: [], flavor: { spicy: 88, sweet: 38, fresh: 78, warm: 45, woody: 30 }, primaryHue: 168 },
]

export const FLAVOR_DIMENSIONS = [
  { key: 'spicy', label: '辛辣度', angle: -90 },
  { key: 'sweet', label: '甜度', angle: -18 },
  { key: 'fresh', label: '清新度', angle: 54 },
  { key: 'warm', label: '温暖度', angle: 126 },
  { key: 'woody', label: '木质度', angle: 198 },
] as const

export type FlavorKey = (typeof FLAVOR_DIMENSIONS)[number]['key']

export const calculateBlendedFlavor = (spices: Spice[]): FlavorProfile => {
  if (spices.length === 0) {
    return { spicy: 0, sweet: 0, fresh: 0, warm: 0, woody: 0 }
  }
  const sum = spices.reduce(
    (acc, s) => ({
      spicy: acc.spicy + s.flavor.spicy,
      sweet: acc.sweet + s.flavor.sweet,
      fresh: acc.fresh + s.flavor.fresh,
      warm: acc.warm + s.flavor.warm,
      woody: acc.woody + s.flavor.woody,
    }),
    { spicy: 0, sweet: 0, fresh: 0, warm: 0, woody: 0 }
  )
  const n = spices.length
  return {
    spicy: Math.round(sum.spicy / n),
    sweet: Math.round(sum.sweet / n),
    fresh: Math.round(sum.fresh / n),
    warm: Math.round(sum.warm / n),
    woody: Math.round(sum.woody / n),
  }
}

export const cosineSimilarity = (a: FlavorProfile, b: FlavorProfile): number => {
  const keys: FlavorKey[] = ['spicy', 'sweet', 'fresh', 'warm', 'woody']
  let dot = 0
  let normA = 0
  let normB = 0
  for (const k of keys) {
    dot += a[k] * b[k]
    normA += a[k] * a[k]
    normB += b[k] * b[k]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 0
  return dot / denom
}
