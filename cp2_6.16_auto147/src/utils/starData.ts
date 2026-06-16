import { StarData, StarType } from '../types';

export const STAR_TYPES: StarType[] = ['red_dwarf', 'yellow_dwarf', 'blue_giant', 'white_dwarf', 'red_supergiant'];

export const STAR_DATA: Record<StarType, StarData> = {
  red_dwarf: {
    id: 'red_dwarf',
    name: '红矮星',
    type: 'red_dwarf',
    color: '#FF6B4A',
    gradient: ['#FF8C69', '#C44536'],
    radius: 0.15,
    mass: 0.12,
    temperature: 3000,
    spectralType: 'M',
    lifespan: '数千亿年',
    rotationPeriod: 20,
    description: '红矮星是宇宙中最常见的恒星类型，质量小、温度低、寿命极长。它们通过缓慢的氢聚变持续发光，寿命可能超过宇宙当前的年龄。',
    layers: [
      {
        name: '核心',
        color: '#FF8C00',
        opacity: 0.9,
        radiusRatio: 0.25,
        temperature: '~500万 K',
        density: '~50 g/cm³',
        percentage: '25%',
        description: '氢聚变反应发生的区域，将氢原子核融合成氦，释放出巨大能量。'
      },
      {
        name: '辐射层',
        color: '#FFD700',
        opacity: 0.6,
        radiusRatio: 0.6,
        temperature: '500万-200万 K',
        density: '50-1 g/cm³',
        percentage: '35%',
        description: '能量以光子形式通过辐射向外传递，光子需要数百万年才能穿过这一层。'
      },
      {
        name: '对流层',
        color: '#FFA500',
        opacity: 0.4,
        radiusRatio: 0.95,
        temperature: '200万-3000 K',
        density: '1-0.0001 g/cm³',
        percentage: '35%',
        description: '能量通过对流运动向外传递，热等离子体上升，冷却后下沉，形成循环。'
      },
      {
        name: '表面',
        color: '#FF6B4A',
        opacity: 0.8,
        radiusRatio: 1.0,
        temperature: '3000 K',
        density: '极低',
        percentage: '5%',
        description: '恒星的可见表面，也是光球层，我们观测到的光从这里发出。'
      }
    ]
  },
  yellow_dwarf: {
    id: 'yellow_dwarf',
    name: '黄矮星',
    type: 'yellow_dwarf',
    color: '#FFD700',
    gradient: ['#FFE066', '#FDB813'],
    radius: 1.0,
    mass: 1.0,
    temperature: 5778,
    spectralType: 'G',
    lifespan: '约100亿年',
    rotationPeriod: 10,
    description: '黄矮星是中等大小的主序星，我们的太阳就是典型的黄矮星。它们稳定地燃烧氢，寿命约为100亿年。',
    layers: [
      {
        name: '核心',
        color: '#FF8C00',
        opacity: 0.9,
        radiusRatio: 0.2,
        temperature: '~1500万 K',
        density: '~150 g/cm³',
        percentage: '20%',
        description: '太阳的能量来源，每秒将约6亿吨氢融合成氦，释放相当于3.8×10²⁶焦耳的能量。'
      },
      {
        name: '辐射层',
        color: '#FFD700',
        opacity: 0.6,
        radiusRatio: 0.7,
        temperature: '1500万-200万 K',
        density: '150-0.2 g/cm³',
        percentage: '50%',
        description: '能量以辐射形式缓慢传递，光子在粒子间反复散射，需要约17万年才能到达辐射层顶部。'
      },
      {
        name: '对流层',
        color: '#FFA500',
        opacity: 0.4,
        radiusRatio: 0.98,
        temperature: '200万-5778 K',
        density: '0.2-0.0001 g/cm³',
        percentage: '28%',
        description: '热等离子体上升到表面冷却后下沉，形成对流循环，类似于沸腾的水。'
      },
      {
        name: '表面',
        color: '#FFD700',
        opacity: 0.8,
        radiusRatio: 1.0,
        temperature: '5778 K',
        density: '极低',
        percentage: '2%',
        description: '太阳光球层，我们看到的太阳表面，常有太阳黑子活动。'
      }
    ]
  },
  blue_giant: {
    id: 'blue_giant',
    name: '蓝巨星',
    type: 'blue_giant',
    color: '#00BFFF',
    gradient: ['#87CEEB', '#1E90FF'],
    radius: 20,
    mass: 20,
    temperature: 30000,
    spectralType: 'O/B',
    lifespan: '约1000万年',
    rotationPeriod: 3,
    description: '蓝巨星是极其炽热、明亮的大质量恒星，质量可达太阳的20倍以上。它们燃烧燃料的速度极快，因此寿命相对较短。',
    layers: [
      {
        name: '核心',
        color: '#0000FF',
        opacity: 0.9,
        radiusRatio: 0.15,
        temperature: '~4000万 K',
        density: '~500 g/cm³',
        percentage: '15%',
        description: '极其炽热的核心，氢聚变以极快的速度进行，温度和压力远高于太阳。'
      },
      {
        name: '辐射层',
        color: '#00BFFF',
        opacity: 0.6,
        radiusRatio: 0.5,
        temperature: '4000万-800万 K',
        density: '500-10 g/cm³',
        percentage: '35%',
        description: '能量以辐射形式快速传递，由于高温高密，辐射效率很高。'
      },
      {
        name: '对流层',
        color: '#87CEEB',
        opacity: 0.4,
        radiusRatio: 0.95,
        temperature: '800万-30000 K',
        density: '10-0.00001 g/cm³',
        percentage: '45%',
        description: '强烈的对流运动将能量快速带到表面，常伴有剧烈的恒星风。'
      },
      {
        name: '表面',
        color: '#00BFFF',
        opacity: 0.8,
        radiusRatio: 1.0,
        temperature: '30000 K',
        density: '极低',
        percentage: '5%',
        description: '呈现明亮的蓝白色，温度极高，释放大量紫外线辐射。'
      }
    ]
  },
  white_dwarf: {
    id: 'white_dwarf',
    name: '白矮星',
    type: 'white_dwarf',
    color: '#FFFFFF',
    gradient: ['#F0F8FF', '#E6E6FA'],
    radius: 0.01,
    mass: 1.0,
    temperature: 10000,
    spectralType: 'D',
    lifespan: '数万亿年',
    rotationPeriod: 15,
    description: '白矮星是恒星演化的终点之一，是中等质量恒星耗尽燃料后坍缩形成的致密天体。体积与地球相当，但质量接近太阳。',
    layers: [
      {
        name: '核心',
        color: '#4169E1',
        opacity: 0.95,
        radiusRatio: 0.8,
        temperature: '~1亿 K',
        density: '~10⁶ g/cm³',
        percentage: '80%',
        description: '由电子简并压力支撑的碳氧核心，不再进行核聚变反应，温度极高但逐渐冷却。'
      },
      {
        name: '过渡层',
        color: '#6495ED',
        opacity: 0.7,
        radiusRatio: 0.95,
        temperature: '1亿-100万 K',
        density: '10⁶-10³ g/cm³',
        percentage: '15%',
        description: '核心与外层大气之间的过渡区域，密度和温度快速变化。'
      },
      {
        name: '大气层',
        color: '#F0F8FF',
        opacity: 0.3,
        radiusRatio: 0.99,
        temperature: '100万-10000 K',
        density: '10³-0.0001 g/cm³',
        percentage: '4%',
        description: '主要由氢和氦组成的稀薄大气层，由于引力极强，大气非常扁平。'
      },
      {
        name: '表面',
        color: '#FFFFFF',
        opacity: 0.8,
        radiusRatio: 1.0,
        temperature: '10000 K',
        density: '极低',
        percentage: '1%',
        description: '白矮星的可见表面，呈现白色，随着时间推移会逐渐冷却变成黑矮星。'
      }
    ]
  },
  red_supergiant: {
    id: 'red_supergiant',
    name: '红超巨星',
    type: 'red_supergiant',
    color: '#FF4500',
    gradient: ['#FF6347', '#B22222'],
    radius: 1000,
    mass: 20,
    temperature: 3500,
    spectralType: 'M',
    lifespan: '约100万年',
    rotationPeriod: 12,
    description: '红超巨星是大质量恒星在生命末期膨胀形成的超巨星，体积极其巨大。如果参宿四在太阳的位置，它的表面将超过木星轨道。',
    layers: [
      {
        name: '核心',
        color: '#FFD700',
        opacity: 0.9,
        radiusRatio: 0.01,
        temperature: '~3亿 K',
        density: '~10⁴ g/cm³',
        percentage: '1%',
        description: '正在进行多重核聚变的致密核心，依次燃烧氢、氦、碳、氖、氧、硅，最终产生铁。'
      },
      {
        name: '辐射壳层',
        color: '#FF8C00',
        opacity: 0.6,
        radiusRatio: 0.05,
        temperature: '3亿-5000万 K',
        density: '10⁴-100 g/cm³',
        percentage: '4%',
        description: '围绕核心的多层壳层，每一层进行着不同元素的核聚变。'
      },
      {
        name: '对流包层',
        color: '#FF6347',
        opacity: 0.4,
        radiusRatio: 0.98,
        temperature: '5000万-3500 K',
        density: '100-0.000001 g/cm³',
        percentage: '93%',
        description: '极其巨大的对流包层，物质密度极低，恒星的大部分体积由这一层占据。'
      },
      {
        name: '表面',
        color: '#FF4500',
        opacity: 0.8,
        radiusRatio: 1.0,
        temperature: '3500 K',
        density: '极低',
        percentage: '2%',
        description: '恒星的可见表面，温度相对较低，呈现红色，常有巨大的恒星活动。'
      }
    ]
  }
};

export function getStarData(type: StarType): StarData {
  return STAR_DATA[type];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}
