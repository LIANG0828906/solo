import { create } from 'zustand'

export type Theme = 'stardust' | 'aurora' | 'lava'

export interface ParticleData {
  id: number
  basePosition: [number, number, number]
  color: string
  size: number
  opacity: number
  phase: number
  period: number
  description: string
}

export const THEME_COLORS: Record<Theme, { particles: string[]; bgTop: string; bgBottom: string }> = {
  stardust: {
    particles: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'],
    bgTop: '#0A0A1A',
    bgBottom: '#1A1A3E'
  },
  aurora: {
    particles: ['#00F5D4', '#00BBF9', '#9B5DE5', '#F15BB5', '#FEE440'],
    bgTop: '#0A1A2E',
    bgBottom: '#1A3A5E'
  },
  lava: {
    particles: ['#FF4500', '#FF6347', '#FFA500', '#FFD700', '#DC143C'],
    bgTop: '#1A0A0A',
    bgBottom: '#3E1A1A'
  }
}

const STAR_DESCRIPTIONS = [
  '一颗处于主序星阶段的蓝巨星，表面温度高达28000开尔文',
  '围绕双星系统运转的气态巨行星，大气中闪烁着紫色极光',
  '年轻的疏散星团成员，周围仍包裹着淡淡的原行星盘',
  '一颗毫秒脉冲星，每秒自转386次，发射稳定的射电脉冲',
  '位于旋臂边缘的橙矮星，拥有五颗已知的岩质行星',
  '行星状星云中央的白矮星，正将最后一层恒星物质抛向太空',
  '一颗被尘埃环包围的T型变星，亮度在数日内不规则起伏',
  '球状星团核心的红巨星，已进入氦融合的晚期演化阶段',
  '正在接近超新星爆发临界质量的沃尔夫-拉叶星',
  '一颗拥有环系统的冰巨星，卫星上可能存在地下液态海洋',
  '质量约为太阳8倍的蓝离散星，疑似经历过恒星合并事件',
  '位于暗星云内部的原恒星，仍在通过吸积盘积累质量',
  '一颗潮汐锁定的超级地球，向阳面熔岩横流背阳面冰封万里',
  '古老的球状星团成员星，金属丰度极低几乎由纯氢氦构成',
  '高速自转的Be型恒星，赤道周围环绕着炽热的气体盘',
  '距离最近的褐矮星，质量介于行星和恒星之间散发着微弱红外光',
  '一对正在渐进合并过程中的相接双星，共享着同一个对流包层',
  '一颗被强烈星风塑造的弓形激波前导的速逃星',
  '拥有浓厚硫酸云大气的类金星行星，地表大气压超过90巴',
  '年轻的炽热O型星，强烈的紫外辐射正在电离周围的星际物质',
  '位于银心超大质量黑洞吸积盘外边缘的快速公转恒星',
  '一颗正在被母星潮汐撕裂的热木星，大气正在缓缓蒸发',
  '富含锂元素的奇异恒星，锂丰度远超同类恒星的平均值',
  '处于氦闪阶段的水平分支星，核心正在发生剧烈的氦聚变反应',
  '一颗拥有三颗恒星的三体系统，行星轨道呈现复杂的李萨如图形',
  '被自身爆发抛出的物质壳层包围的沃尔夫-拉叶星候选体',
  '一颗碳星，大气中碳元素丰度超过氧元素呈现独特的橙红色调',
  '位于宜居带边缘的海洋行星，表面95%被液态水覆盖',
  '古老的白矮星，已冷却至表面温度仅4000开尔文几乎不可见',
  '一颗正在经历X射线闪耀的中子星，正在从伴星吸积物质',
  '拥有巨大磁场的磁星，表面磁场强度达10^15高斯',
  '一颗逆行轨道的热木星，公转方向与恒星自转方向相反',
  '位于银河系旋臂交汇处的年轻疏散星团成员',
  '正在穿越奥尔特云区域的星际访客小行星',
  '一颗拥有钻石核心的白矮星，碳元素在极端压力下结晶',
  '处于共生双星系统中的红巨星，正被致密的白矮星伴星吸积',
  '一颗轨道高度偏心的彗星型行星，近日点被烤出长长的尾迹',
  '位于大麦哲伦云中的超新星遗迹，中心可能隐藏着一颗中子星',
  '富含稀土元素的金属丰度异常恒星，可能吞噬过数颗岩质行星',
  '一颗正在形成中的褐矮星，周围原行星盘中已出现行星胚胎缝隙'
]

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateParticle(id: number, colors: string[]): ParticleData {
  const phi = Math.acos(2 * Math.random() - 1)
  const theta = 2 * Math.PI * Math.random()
  const r = Math.pow(Math.random(), 1 / 3) * 5
  const x = r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.sin(phi) * Math.sin(theta)
  const z = r * Math.cos(phi)
  return {
    id,
    basePosition: [x, y, z],
    color: colors[Math.floor(Math.random() * colors.length)],
    size: randomInRange(0.08, 0.25),
    opacity: randomInRange(0.5, 1.0),
    phase: Math.random() * Math.PI * 2,
    period: randomInRange(0.5, 1.5),
    description: STAR_DESCRIPTIONS[Math.floor(Math.random() * STAR_DESCRIPTIONS.length)]
  }
}

interface StarDustState {
  particles: ParticleData[]
  theme: Theme
  particleSizeScale: number
  discoveredCount: number
  discoveredIds: Set<number>
  selectedParticleId: number | null
  hoveredParticleId: number | null
  isCelebrating: boolean
  cameraResetSignal: number
  setTheme: (t: Theme) => void
  setParticleSizeScale: (s: number) => void
  discoverParticle: (id: number) => void
  selectParticle: (id: number | null) => void
  hoverParticle: (id: number | null) => void
  triggerCelebration: () => void
  endCelebration: () => void
  resetCamera: () => void
}

export const useStore = create<StarDustState>((set, get) => ({
  particles: Array.from({ length: 200 }, (_, i) =>
    generateParticle(i, THEME_COLORS.stardust.particles)
  ),
  theme: 'stardust',
  particleSizeScale: 0.15,
  discoveredCount: 0,
  discoveredIds: new Set(),
  selectedParticleId: null,
  hoveredParticleId: null,
  isCelebrating: false,
  cameraResetSignal: 0,
  setTheme: (t) => {
    const colors = THEME_COLORS[t].particles
    set((state) => ({
      theme: t,
      particles: state.particles.map((p) => ({
        ...p,
        color: colors[Math.floor(Math.random() * colors.length)]
      }))
    }))
  },
  setParticleSizeScale: (s) => set({ particleSizeScale: s }),
  discoverParticle: (id) => {
    const state = get()
    if (state.discoveredIds.has(id)) return
    const newSet = new Set(state.discoveredIds)
    newSet.add(id)
    const newCount = newSet.size
    if (newCount >= 200) {
      set({
        discoveredIds: newSet,
        discoveredCount: newCount,
        isCelebrating: true
      })
    } else {
      set({
        discoveredIds: newSet,
        discoveredCount: newCount
      })
    }
  },
  selectParticle: (id) => set({ selectedParticleId: id }),
  hoverParticle: (id) => set({ hoveredParticleId: id }),
  triggerCelebration: () => set({ isCelebrating: true }),
  endCelebration: () => set({ isCelebrating: false }),
  resetCamera: () => set((s) => ({ cameraResetSignal: s.cameraResetSignal + 1 }))
}))
