import { create } from 'zustand'

export interface Marking {
  angle: number
  label: string
  value: string
}

export interface RingData {
  id: string
  name: string
  chineseName: string
  radius: number
  rotation: [number, number, number]
  color: string
  description: string
  markings: Marking[]
}

export interface AppState {
  currentMonth: number
  selectedRing: string | null
  showInfo: boolean
  hoveredMarking: Marking | null
  hoveredRing: string | null
  autoRotate: boolean
  setCurrentMonth: (month: number) => void
  setSelectedRing: (ringId: string | null) => void
  setShowInfo: (show: boolean) => void
  setHoveredMarking: (marking: Marking | null) => void
  setHoveredRing: (ringId: string | null) => void
  setAutoRotate: (auto: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentMonth: 0,
  selectedRing: null,
  showInfo: false,
  hoveredMarking: null,
  hoveredRing: null,
  autoRotate: true,
  setCurrentMonth: (month) => set({ currentMonth: month }),
  setSelectedRing: (ringId) => set({ selectedRing: ringId, showInfo: ringId !== null }),
  setShowInfo: (show) => set({ showInfo: show }),
  setHoveredMarking: (marking) => set({ hoveredMarking: marking }),
  setHoveredRing: (ringId) => set({ hoveredRing: ringId }),
  setAutoRotate: (auto) => set({ autoRotate: auto }),
}))

export const RING_DATA: RingData[] = [
  {
    id: 'horizon',
    name: 'Horizon Ring',
    chineseName: '地平环',
    radius: 3.5,
    rotation: [Math.PI / 2, 0, 0],
    color: '#6b8e23',
    description: '地平环是璇玑玉衡的底座环圈，固定不动，代表观测者所在的地平面。环上刻有二十四方位，用以测定天体的方位角。古代天文学家通过地平环确定日出日落的方位，以及观测天体的出没时刻。',
    markings: Array.from({ length: 24 }, (_, i) => ({
      angle: (i * 15 * Math.PI) / 180,
      label: ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'][i],
      value: `${i * 15}°`,
    })),
  },
  {
    id: 'meridian',
    name: 'Meridian Ring',
    chineseName: '子午环',
    radius: 3.2,
    rotation: [0, 0, 0],
    color: '#7a9e33',
    description: '子午环垂直于地平环，贯穿南北两极，代表观测地的子午圈。环上刻有周天度数，用以测量天体的赤纬和中天时刻。北宋司天监通过子午环测定恒星的上中天位置，制定精确的历法。',
    markings: Array.from({ length: 12 }, (_, i) => ({
      angle: (i * 30 * Math.PI) / 180,
      label: i === 0 ? '北' : i === 6 ? '南' : `${i * 30}°`,
      value: `${i * 30}°`,
    })),
  },
  {
    id: 'equator',
    name: 'Equator Ring',
    chineseName: '赤道环',
    radius: 2.8,
    rotation: [23.5 * Math.PI / 180, 0, 0],
    color: '#8ba843',
    description: '赤道环代表天赤道，与地球赤道平面平行。环上刻有二十八宿和二十四节气，是璇玑玉衡的核心测量环圈。通过旋转赤道环，可以直接读取天体的赤经坐标，是中国古代赤道坐标系的精髓。',
    markings: Array.from({ length: 28 }, (_, i) => ({
      angle: (i * 360 / 28 * Math.PI) / 180,
      label: ['角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁', '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸'][i],
      value: `宿${i + 1}`,
    })),
  },
  {
    id: 'ecliptic',
    name: 'Ecliptic Ring',
    chineseName: '黄道环',
    radius: 2.5,
    rotation: [23.5 * Math.PI / 180, Math.PI / 2, 0],
    color: '#9cb853',
    description: '黄道环代表太阳在天球上的运行轨迹，与赤道环相交于春分点和秋分点，交角约23.5度。环上刻有二十四节气，用以推算太阳的视运动位置，制定节气和历法。',
    markings: Array.from({ length: 24 }, (_, i) => ({
      angle: (i * 15 * Math.PI) / 180,
      label: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'][i],
      value: `节${i + 1}`,
    })),
  },
  {
    id: 'sight',
    name: 'Sighting Tube',
    chineseName: '窥管',
    radius: 0.3,
    rotation: [0, 0, 0],
    color: '#ffd700',
    description: '窥管是璇玑玉衡的观测部件，为一根细长的铜管，可以绕中心自由旋转指向任意方位。观测者通过窥管对准天体，配合各环圈的刻度读数，即可精确测定天体的坐标位置。',
    markings: [
      { angle: 0, label: '天', value: '+90°' },
      { angle: Math.PI, label: '地', value: '-90°' },
    ],
  },
]

export const MONTHS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
]
