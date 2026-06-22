import type { AnnotationMockData, EraPreset } from '@/types';

export const mockAnnotations: AnnotationMockData[] = [
  {
    id: 'wall-north',
    componentName: '北城墙',
    eraRange: '公元100年 - 公元300年',
    description: '遗址北部防御工事，采用石灰岩砌筑，厚度达3.5米，公元4世纪战乱中严重损毁。墙基保留了原始砌筑工艺的痕迹，可见多层错缝结构。',
    meshNamePattern: 'Wall_North|wall_north|北墙|城墙.*北',
  },
  {
    id: 'dome-main',
    componentName: '中央穹顶',
    eraRange: '公元120年建造',
    description: '采用十字拱技术建造的标志性穹顶建筑，直径24米，顶部饰有太阳纹浮雕，是当时建筑技艺的巅峰代表。穹顶内部分布有12根放射状肋拱，体现了精湛的力学结构设计。',
    meshNamePattern: 'Dome_Main|dome|穹顶|中央',
  },
  {
    id: 'columns-east',
    componentName: '东侧柱廊',
    eraRange: '公元80年 - 公元150年',
    description: '科林斯式柱廊，共12根立柱支撑上层回廊，柱身刻有献祭铭文，柱础保留完整。柱头采用典型的茛苕叶装饰，部分柱身仍可见彩绘痕迹。',
    meshNamePattern: 'Column_East|column.*east|柱廊|立柱',
  },
  {
    id: 'gate-south',
    componentName: '南门入口',
    eraRange: '公元前50年 - 公元200年',
    description: '遗址主要出入口，采用三拱式设计，中央主拱高8米供车辆通行，两侧次拱高5米供行人使用。门楣上方刻有建城纪年铭文。',
    meshNamePattern: 'Gate_South|gate.*south|南门|入口',
  },
  {
    id: 'temple-west',
    componentName: '西翼神庙',
    eraRange: '公元150年建造',
    description: '供奉太阳神的小型神庙，采用前柱式设计，内殿保存有祭坛遗迹。墙面残留的壁画碎片描绘了祭祀仪式的场景。',
    meshNamePattern: 'Temple_West|temple|神庙|西翼',
  },
];

export const eraPresets: EraPreset[] = [
  {
    year: -200,
    label: 'BC 200',
    cameraPosition: [18, 14, 18],
    cameraTarget: [0, 1, 0],
  },
  {
    year: -100,
    label: 'BC 100',
    cameraPosition: [16, 12, 16],
    cameraTarget: [0, 2, 0],
  },
  {
    year: 0,
    label: 'AD 0',
    cameraPosition: [14, 10, 14],
    cameraTarget: [0, 2, 0],
  },
  {
    year: 100,
    label: 'AD 100',
    cameraPosition: [10, 8, 10],
    cameraTarget: [0, 3, 0],
  },
  {
    year: 200,
    label: 'AD 200',
    cameraPosition: [9, 7, 9],
    cameraTarget: [0, 3, 0],
  },
  {
    year: 300,
    label: 'AD 300',
    cameraPosition: [8, 6, 8],
    cameraTarget: [0, 2, 0],
  },
  {
    year: 400,
    label: 'AD 400',
    cameraPosition: [10, 7, 10],
    cameraTarget: [0, 2, 0],
  },
  {
    year: 500,
    label: 'AD 500',
    cameraPosition: [12, 10, 12],
    cameraTarget: [0, 1, 0],
  },
  {
    year: 600,
    label: 'AD 600',
    cameraPosition: [15, 12, 15],
    cameraTarget: [0, 0, 0],
  },
];

export const yearToLabel = (year: number): string => {
  if (year < 0) return `BC ${Math.abs(year)}`;
  return `AD ${year}`;
};

export const lerpCameraPreset = (year: number): { position: [number, number, number]; target: [number, number, number] } => {
  for (let i = 0; i < eraPresets.length - 1; i++) {
    const curr = eraPresets[i];
    const next = eraPresets[i + 1];
    if (year >= curr.year && year <= next.year) {
      const t = (year - curr.year) / (next.year - curr.year);
      const easeT = t * t * (3 - 2 * t);
      return {
        position: [
          curr.cameraPosition[0] + (next.cameraPosition[0] - curr.cameraPosition[0]) * easeT,
          curr.cameraPosition[1] + (next.cameraPosition[1] - curr.cameraPosition[1]) * easeT,
          curr.cameraPosition[2] + (next.cameraPosition[2] - curr.cameraPosition[2]) * easeT,
        ],
        target: [
          curr.cameraTarget[0] + (next.cameraTarget[0] - curr.cameraTarget[0]) * easeT,
          curr.cameraTarget[1] + (next.cameraTarget[1] - curr.cameraTarget[1]) * easeT,
          curr.cameraTarget[2] + (next.cameraTarget[2] - curr.cameraTarget[2]) * easeT,
        ],
      };
    }
  }
  if (year <= eraPresets[0].year) {
    return { position: eraPresets[0].cameraPosition, target: eraPresets[0].cameraTarget };
  }
  const last = eraPresets[eraPresets.length - 1];
  return { position: last.cameraPosition, target: last.cameraTarget };
};
