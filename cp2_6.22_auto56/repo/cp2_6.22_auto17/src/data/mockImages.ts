import type { ImageItem } from '@/types'

const palette = [
  '#e8d5c4',
  '#d5dbe5',
  '#c9dbd1',
  '#f2d7c6',
  '#d8cfe4',
  '#e6e2d3',
  '#d3e4e3',
  '#ecd5d9',
  '#e0e8d2',
  '#e4d8ca',
  '#d0d9db',
  '#e8e0d0',
]

const titles = [
  '晨雾中的山脉',
  '城市天际线夜景',
  '静谧森林小径',
  '海边日出时刻',
  '古典建筑之美',
  '秋日落叶公园',
  '人物肖像·思考',
  '现代艺术展览',
  '沙漠与星空',
  '咖啡馆的午后',
  '雪山倒影湖泊',
  '港口的灯塔',
  '雨后石板街道',
  '热带植物园',
  '抽象几何构图',
  '老旧书架与光',
  '海浪拍岸',
  '北欧风格家居',
  '复古汽车特写',
  '樱花飘落小路',
  '田野的麦浪',
  '图书馆的角落',
  '山川与云海',
  '都市霓虹夜色',
]

const tagPool = [
  'nature',
  'city',
  'portrait',
  'architecture',
  'art',
  'landscape',
  'animal',
  'food',
  'travel',
  'technology',
  'ocean',
  'mountain',
]

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function pickTags(seed: number): string[] {
  const result: string[] = []
  const count = 2 + Math.floor(seededRandom(seed) * 3)
  const used = new Set<number>()
  while (result.length < count && used.size < tagPool.length) {
    const idx = Math.floor(seededRandom(seed + used.size * 13) * tagPool.length)
    if (!used.has(idx)) {
      used.add(idx)
      result.push(tagPool[idx])
    }
  }
  return result.sort()
}

export const mockImages: ImageItem[] = Array.from({ length: 24 }, (_, i) => {
  const id = `img-${String(i + 1).padStart(3, '0')}`
  const baseSeed = i + 1
  const widthRatio = 400
  const heights = [300, 450, 500, 350, 550, 400, 600, 380, 480, 520, 420, 360]
  const heightRatio = heights[i % heights.length]
  return {
    id,
    title: titles[i % titles.length],
    url: `https://picsum.photos/seed/${id}/1200/${Math.round(
      1200 * (heightRatio / widthRatio),
    )}`,
    thumbnailUrl: `https://picsum.photos/seed/${id}/600/${Math.round(
      600 * (heightRatio / widthRatio),
    )}`,
    width: widthRatio,
    height: heightRatio,
    placeholderColor: palette[i % palette.length],
    tags: pickTags(baseSeed),
  }
})
