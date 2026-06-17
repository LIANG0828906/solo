import { v4 as uuidv4 } from 'uuid';
import type { StarData, SpectralType } from '@/types/star';

const starTemplates: Array<{
  name: string;
  spectralType: SpectralType;
  tempRange: [number, number];
  radiusRange: [number, number];
  description: string;
}> = [
  { name: '参宿一', spectralType: 'O', tempRange: [30000, 50000], radiusRange: [8, 12], description: '蓝超巨星，位于猎户座腰带，是夜空中最亮的恒星之一。' },
  { name: '天枢', spectralType: 'O', tempRange: [28000, 35000], radiusRange: [7, 10], description: '大熊座α星，北斗七星之首，蓝色高温恒星。' },
  { name: '参宿七', spectralType: 'B', tempRange: [12000, 20000], radiusRange: [5, 8], description: '猎户座β星，蓝白色超巨星，光度极高。' },
  { name: '角宿一', spectralType: 'B', tempRange: [20000, 25000], radiusRange: [6, 9], description: '室女座α星，蓝白色主序星，双星系统。' },
  { name: '织女星', spectralType: 'A', tempRange: [8000, 10000], radiusRange: [2.5, 3.5], description: '天琴座α星，夏季大三角之一，蓝白色恒星。' },
  { name: '天狼星', spectralType: 'A', tempRange: [9000, 11000], radiusRange: [1.7, 2.2], description: '夜空中最亮的恒星，大犬座α星，双星系统。' },
  { name: '牛郎星', spectralType: 'A', tempRange: [7000, 8500], radiusRange: [1.5, 2.0], description: '天鹰座α星，夏季大三角成员，与织女星隔银河相望。' },
  { name: '南河三', spectralType: 'F', tempRange: [6000, 7500], radiusRange: [1.8, 2.5], description: '小犬座α星，冬季大三角成员，黄白色恒星。' },
  { name: '老人星', spectralType: 'F', tempRange: [6500, 7800], radiusRange: [4, 6], description: '船底座α星，南天极附近最亮的恒星。' },
  { name: '五车二', spectralType: 'F', tempRange: [5800, 7200], radiusRange: [3, 5], description: '御夫座α星，黄色巨星，双星系统。' },
  { name: '太阳', spectralType: 'G', tempRange: [5500, 6000], radiusRange: [1.0, 1.2], description: '我们的母星，G型主序星，生命的摇篮。' },
  { name: '南门二', spectralType: 'G', tempRange: [5000, 5800], radiusRange: [1.1, 1.5], description: '半人马座α星，距离太阳系最近的恒星系统。' },
  { name: '御夫座ε', spectralType: 'G', tempRange: [4800, 5500], radiusRange: [2, 3], description: '食双星系统，又称柱一，黄色恒星。' },
  { name: '大角星', spectralType: 'K', tempRange: [3800, 4800], radiusRange: [20, 28], description: '牧夫座α星，北天最亮的红巨星。' },
  { name: '五车五', spectralType: 'K', tempRange: [4000, 5000], radiusRange: [10, 16], description: '金牛座β星，橙色巨星，冬季六边形成员。' },
  { name: '河鼓二', spectralType: 'K', tempRange: [4200, 4900], radiusRange: [8, 14], description: '天鹰座的橙色巨星，距离地球约200光年。' },
  { name: '参宿四', spectralType: 'M', tempRange: [2800, 3600], radiusRange: [60, 80], description: '猎户座α星，红超巨星，即将发生超新星爆发。' },
  { name: '心宿二', spectralType: 'M', tempRange: [3000, 3800], radiusRange: [50, 70], description: '天蝎座α星，又称「大火」，红超巨星。' },
  { name: '毕宿五', spectralType: 'M', tempRange: [3200, 4000], radiusRange: [35, 50], description: '金牛座α星，红巨星，冬季六边形成员。' },
  { name: '天关客星遗迹', spectralType: 'M', tempRange: [2600, 3400], radiusRange: [40, 60], description: '巨蟹座内的红色恒星，古代曾记录为超新星。' },
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateStarPosition(index: number): { x: number; y: number; z: number } {
  const angle = (index / 20) * Math.PI * 2;
  const radius = 15 + Math.random() * 15;
  const height = (Math.random() - 0.5) * 20;
  return {
    x: Math.cos(angle) * radius + (Math.random() - 0.5) * 8,
    y: height,
    z: Math.sin(angle) * radius + (Math.random() - 0.5) * 8,
  };
}

export function generateMockStars(): StarData[] {
  return starTemplates.map((template, index) => {
    const temperature = Math.round(randomInRange(template.tempRange[0], template.tempRange[1]));
    const radius = randomInRange(template.radiusRange[0], template.radiusRange[1]);
    return {
      id: uuidv4(),
      name: template.name,
      temperature,
      spectralType: template.spectralType,
      radius,
      position: generateStarPosition(index),
      description: template.description,
    };
  });
}

export async function fetchStars(): Promise<StarData[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateMockStars());
    }, 300);
  });
}
