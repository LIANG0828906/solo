import type { ImageItem } from '@/types'

const placeholderColors = [
  '#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5',
  '#e0f7fa', '#fbe9e7', '#f1f8e9', '#ede7f6', '#e1f5fe',
]

function generateImageUrl(_id: string, width: number, height: number, seed: number): string {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

function generateThumbnailUrl(_id: string, width: number, height: number, seed: number): string {
  const thumbWidth = 400
  const thumbHeight = Math.round((height / width) * thumbWidth)
  return `https://picsum.photos/seed/${seed}/${thumbWidth}/${thumbHeight}`
}

export const mockImages: ImageItem[] = [
  {
    id: '1',
    title: '山间晨雾',
    width: 800,
    height: 1200,
    tags: ['nature', 'mountain', 'landscape'],
    url: generateImageUrl('1', 800, 1200, 101),
    thumbnailUrl: generateThumbnailUrl('1', 800, 1200, 101),
  },
  {
    id: '2',
    title: '城市夜景',
    width: 1200,
    height: 800,
    tags: ['city', 'night', 'architecture'],
    url: generateImageUrl('2', 1200, 800, 102),
    thumbnailUrl: generateThumbnailUrl('2', 1200, 800, 102),
  },
  {
    id: '3',
    title: '人像摄影',
    width: 600,
    height: 900,
    tags: ['portrait', 'people'],
    url: generateImageUrl('3', 600, 900, 103),
    thumbnailUrl: generateThumbnailUrl('3', 600, 900, 103),
  },
  {
    id: '4',
    title: '现代建筑',
    width: 1000,
    height: 800,
    tags: ['architecture', 'city', 'abstract'],
    url: generateImageUrl('4', 1000, 800, 104),
    thumbnailUrl: generateThumbnailUrl('4', 1000, 800, 104),
  },
  {
    id: '5',
    title: '抽象艺术',
    width: 800,
    height: 800,
    tags: ['abstract', 'art'],
    url: generateImageUrl('5', 800, 800, 105),
    thumbnailUrl: generateThumbnailUrl('5', 800, 800, 105),
  },
  {
    id: '6',
    title: '野生动物',
    width: 900,
    height: 600,
    tags: ['animals', 'nature'],
    url: generateImageUrl('6', 900, 600, 106),
    thumbnailUrl: generateThumbnailUrl('6', 900, 600, 106),
  },
  {
    id: '7',
    title: '旅行风景',
    width: 1200,
    height: 700,
    tags: ['travel', 'landscape', 'nature'],
    url: generateImageUrl('7', 1200, 700, 107),
    thumbnailUrl: generateThumbnailUrl('7', 1200, 700, 107),
  },
  {
    id: '8',
    title: '美食摄影',
    width: 700,
    height: 700,
    tags: ['food', 'art'],
    url: generateImageUrl('8', 700, 700, 108),
    thumbnailUrl: generateThumbnailUrl('8', 700, 700, 108),
  },
  {
    id: '9',
    title: '海边日落',
    width: 1200,
    height: 800,
    tags: ['nature', 'travel', 'landscape'],
    url: generateImageUrl('9', 1200, 800, 109),
    thumbnailUrl: generateThumbnailUrl('9', 1200, 800, 109),
  },
  {
    id: '10',
    title: '街头艺术',
    width: 800,
    height: 1000,
    tags: ['art', 'city', 'abstract'],
    url: generateImageUrl('10', 800, 1000, 110),
    thumbnailUrl: generateThumbnailUrl('10', 800, 1000, 110),
  },
  {
    id: '11',
    title: '森林小径',
    width: 900,
    height: 1200,
    tags: ['nature', 'landscape', 'travel'],
    url: generateImageUrl('11', 900, 1200, 111),
    thumbnailUrl: generateThumbnailUrl('11', 900, 1200, 111),
  },
  {
    id: '12',
    title: '都市天际线',
    width: 1200,
    height: 600,
    tags: ['city', 'architecture', 'night'],
    url: generateImageUrl('12', 1200, 600, 112),
    thumbnailUrl: generateThumbnailUrl('12', 1200, 600, 112),
  },
  {
    id: '13',
    title: '时尚人像',
    width: 600,
    height: 900,
    tags: ['portrait', 'people', 'art'],
    url: generateImageUrl('13', 600, 900, 113),
    thumbnailUrl: generateThumbnailUrl('13', 600, 900, 113),
  },
  {
    id: '14',
    title: '几何建筑',
    width: 1000,
    height: 1000,
    tags: ['architecture', 'abstract', 'city'],
    url: generateImageUrl('14', 1000, 1000, 114),
    thumbnailUrl: generateThumbnailUrl('14', 1000, 1000, 114),
  },
  {
    id: '15',
    title: '色彩泼墨',
    width: 800,
    height: 800,
    tags: ['abstract', 'art'],
    url: generateImageUrl('15', 800, 800, 115),
    thumbnailUrl: generateThumbnailUrl('15', 800, 800, 115),
  },
  {
    id: '16',
    title: '宠物萌照',
    width: 700,
    height: 900,
    tags: ['animals', 'people'],
    url: generateImageUrl('16', 700, 900, 116),
    thumbnailUrl: generateThumbnailUrl('16', 700, 900, 116),
  },
  {
    id: '17',
    title: '古城风韵',
    width: 1100,
    height: 800,
    tags: ['travel', 'architecture', 'landscape'],
    url: generateImageUrl('17', 1100, 800, 117),
    thumbnailUrl: generateThumbnailUrl('17', 1100, 800, 117),
  },
  {
    id: '18',
    title: '精致料理',
    width: 800,
    height: 600,
    tags: ['food', 'art', 'travel'],
    url: generateImageUrl('18', 800, 600, 118),
    thumbnailUrl: generateThumbnailUrl('18', 800, 600, 118),
  },
  {
    id: '19',
    title: '星空银河',
    width: 1200,
    height: 800,
    tags: ['nature', 'night', 'landscape'],
    url: generateImageUrl('19', 1200, 800, 119),
    thumbnailUrl: generateThumbnailUrl('19', 1200, 800, 119),
  },
  {
    id: '20',
    title: '城市涂鸦',
    width: 900,
    height: 1100,
    tags: ['art', 'city', 'abstract'],
    url: generateImageUrl('20', 900, 1100, 120),
    thumbnailUrl: generateThumbnailUrl('20', 900, 1100, 120),
  },
]

export function getPlaceholderColor(id: string): string {
  const index = parseInt(id) % placeholderColors.length
  return placeholderColors[index]
}
