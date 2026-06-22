export interface ExhibitInfo {
  id: string
  name: string
  category: string
  thumbnail: string
  modelPath: string
  description: string
  material: string
  productionDate: string
}

export interface PointInfo {
  material: string
  productionDate: string
  description: string
  position: { x: number; y: number; z: number }
}

export const exhibits: ExhibitInfo[] = [
  {
    id: 'vase-1',
    name: '青花瓷瓶',
    category: '陶瓷',
    thumbnail: 'vase',
    modelPath: 'vase',
    description: '清代乾隆年间官窑青花瓷瓶，器型端庄典雅，通体绘缠枝莲纹，青花发色纯正明艳，为宫廷御用瓷器之精品。',
    material: '高岭土 钴料',
    productionDate: '清乾隆 1760年'
  },
  {
    id: 'gear-1',
    name: '精密齿轮组',
    category: '机械',
    thumbnail: 'gear',
    modelPath: 'gear',
    description: '高精度工业齿轮组件，采用航空级铝合金锻造，表面经过硬质阳极氧化处理，适用于精密仪器传动系统。',
    material: '航空铝合金 7075-T6',
    productionDate: '2024年3月'
  },
  {
    id: 'chair-1',
    name: '北欧实木椅',
    category: '家具',
    thumbnail: 'chair',
    modelPath: 'chair',
    description: '北欧风格实木休闲椅，选用北美黑胡桃木整体制作，线条简洁流畅，符合人体工学设计，兼具美观与实用。',
    material: '北美黑胡桃木',
    productionDate: '2023年11月'
  }
]
