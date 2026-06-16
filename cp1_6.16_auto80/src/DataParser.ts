export type AnimationType = 'glow' | 'tentacle' | 'float';

export interface CreatureData {
  id: string;
  name: string;
  depthRange: [number, number];
  displayDepth: number;
  color: string;
  scale: number;
  features: string;
  animation: AnimationType;
  shownInScene: boolean;
}

const RAW_DATA: Omit<CreatureData, 'shownInScene'>[] = [
  {
    id: 'phytoplankton',
    name: '浮游植物',
    depthRange: [0, 200],
    displayDepth: 100,
    color: '#5eead4',
    scale: 0.6,
    features: '表层海域主要生产者，通过光合作用提供海洋食物链基础能量。',
    animation: 'float'
  },
  {
    id: 'jellyfish',
    name: '管水母',
    depthRange: [200, 1000],
    displayDepth: 600,
    color: '#c084fc',
    scale: 1.1,
    features: '由多个水螅体群体组成，触手最长可达40米，发出蓝紫色生物荧光。',
    animation: 'tentacle'
  },
  {
    id: 'lanternfish',
    name: '灯笼鱼',
    depthRange: [200, 1500],
    displayDepth: 1000,
    color: '#60a5fa',
    scale: 0.8,
    features: '全球最丰富的脊椎动物，腹部发光器用于伪装和通讯，夜间进行昼夜垂直洄游。',
    animation: 'glow'
  },
  {
    id: 'giant-squid',
    name: '巨型鱿鱼',
    depthRange: [300, 3000],
    displayDepth: 2000,
    color: '#fb7185',
    scale: 1.6,
    features: '最大的无脊椎动物之一，体长可达13米，拥有动物界最大的眼睛。',
    animation: 'tentacle'
  },
  {
    id: 'vampire-squid',
    name: '吸血乌贼',
    depthRange: [600, 3000],
    displayDepth: 2800,
    color: '#f472b6',
    scale: 0.9,
    features: '介于章鱼和鱿鱼之间的古老物种，触手间有薄膜连接，受刺激时可翻转。',
    animation: 'float'
  },
  {
    id: 'gulper-eel',
    name: '宽咽鱼',
    depthRange: [1000, 4000],
    displayDepth: 4000,
    color: '#38bdf8',
    scale: 1.2,
    features: '拥有极长可扩张的下颌，能吞下比自身更大的猎物，尾端有发光器官。',
    animation: 'glow'
  },
  {
    id: 'anglerfish',
    name: '鮟鱇鱼',
    depthRange: [2000, 5000],
    displayDepth: 5000,
    color: '#f59e0b',
    scale: 1.0,
    features: '头顶有发光诱饵吸引猎物，雄性体型极小，寄生在雌性身上完成繁殖。',
    animation: 'glow'
  },
  {
    id: 'giant-isopod',
    name: '大王具足虫',
    depthRange: [170, 7000],
    displayDepth: 6000,
    color: '#94a3b8',
    scale: 1.1,
    features: '陆地潮虫的深海近亲，体长可达36厘米，食腐为生，可绝食数年。',
    animation: 'float'
  },
  {
    id: 'snailfish',
    name: '蜗牛鱼',
    depthRange: [6000, 11000],
    displayDepth: 8000,
    color: '#e879f9',
    scale: 0.9,
    features: '深海最深处的脊椎动物，身体透明胶质，缺乏鱼鳞，骨骼柔韧抗压。',
    animation: 'float'
  },
  {
    id: 'amphipod',
    name: '端足类',
    depthRange: [4000, 11000],
    displayDepth: 10000,
    color: '#fbbf24',
    scale: 0.7,
    features: '超深渊带最常见的甲壳类，体长数厘米，食腐能力极强，聚集于海底营养沉降。',
    animation: 'glow'
  }
];

export class DataParser {
  private static readonly SCENE_DISPLAY_DEPTHS = [0, 2000, 4000, 6000, 8000, 10000];

  static parse(): CreatureData[] {
    return RAW_DATA.map((c) => ({
      ...c,
      shownInScene: DataParser.SCENE_DISPLAY_DEPTHS.some(
        (d) => Math.abs(c.displayDepth - d) < 600
      )
    })).sort((a, b) => a.displayDepth - b.displayDepth);
  }

  static pressure(depth: number): number {
    return 1 + depth / 10;
  }

  static temperature(depth: number): number {
    return +(22 * Math.exp(-depth / 1500) + 2).toFixed(2);
  }
}
