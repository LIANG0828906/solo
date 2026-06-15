import type {
  PlantConfig,
  PlantBase,
  PlantInfo,
  StageMorphology,
  EvolutionGraph,
  GrowthStage,
  GrowthActionRequest,
  GrowthActionResponse,
  FrondShapeType
} from '../src/types.js';
import { GROWTH_STAGES, STAGE_ORDER } from '../src/types.js';

interface FullPlantData extends PlantConfig {
  info: {
    habitat: {
      temperatureRange: [number, number];
      humidityRequirement: string;
      typicalEnvironment: string;
    };
    evolutionDescription: string;
    interestingFacts: string[];
  };
}

interface StageParams {
  stemScale: number;
  frondUnfurl: number;
  frondScale: number;
  hasSporangia: boolean;
  sporangiaDensity: number;
}

const PLANTS: FullPlantData[] = [
  {
    id: 'psilotum',
    scientificName: 'Psilotum nudum',
    commonName: '松叶蕨',
    orderInEvolution: 1,
    ancestorId: null,
    frondShape: {
      type: 'dichotomous' as FrondShapeType,
      length: 0.8,
      width: 0.15,
      curvature: 0.1,
      segmentation: 3
    },
    stem: {
      height: 1.2,
      thickness: 0.04,
      branchingAngle: 35
    },
    colors: {
      sprout: '#D4E88C',
      unfolding: '#8BC34A',
      mature: '#2E7D32',
      spore: '#33691E',
      sporangium: '#795548'
    },
    growthPeriodDays: 60,
    info: {
      habitat: {
        temperatureRange: [18, 28],
        humidityRequirement: '高湿 (70%-90%)',
        typicalEnvironment: '热带、亚热带林下，附生于树干或岩石缝隙'
      },
      evolutionDescription: '最原始的维管植物之一，被认为是最早登陆的植物后代。没有真正的根和叶，只有二叉分枝的茎，代表了植物从水生到陆生过渡的关键阶段。',
      interestingFacts: [
        '松叶蕨没有真正的根，依靠共生真菌吸收养分',
        '其化石可追溯到4亿年前的泥盆纪',
        '孢子囊生于叶腋，呈金黄色，三个融合在一起'
      ]
    }
  },
  {
    id: 'lycopodium',
    scientificName: 'Lycopodium clavatum',
    commonName: '石松',
    orderInEvolution: 2,
    ancestorId: 'psilotum',
    frondShape: {
      type: 'pinnate' as FrondShapeType,
      length: 1.0,
      width: 0.25,
      curvature: 0.15,
      segmentation: 6
    },
    stem: {
      height: 1.8,
      thickness: 0.06,
      branchingAngle: 40
    },
    colors: {
      sprout: '#C5E1A5',
      unfolding: '#7CB342',
      mature: '#1B5E20',
      spore: '#2E4A1F',
      sporangium: '#8D6E63'
    },
    growthPeriodDays: 90,
    info: {
      habitat: {
        temperatureRange: [10, 22],
        humidityRequirement: '中高湿 (60%-85%)',
        typicalEnvironment: '温带针叶林、针阔混交林下酸性土壤'
      },
      evolutionDescription: '石松类是最早出现微型叶的植物类群，在石炭纪曾形成高大的鳞木森林。现代石松保留了原始的孢子叶穗结构，是研究植物叶片起源的关键类群。',
      interestingFacts: [
        '石松孢子易燃，古代用于烟花和舞台效果',
        '匍匐茎可长达数米，不断分叉延伸',
        '孢子叶球位于枝顶，形如狼牙棒'
      ]
    }
  },
  {
    id: 'selaginella',
    scientificName: 'Selaginella',
    commonName: '卷柏',
    orderInEvolution: 3,
    ancestorId: 'lycopodium',
    frondShape: {
      type: 'palmate' as FrondShapeType,
      length: 0.6,
      width: 0.5,
      curvature: 0.3,
      segmentation: 4
    },
    stem: {
      height: 0.4,
      thickness: 0.03,
      branchingAngle: 55
    },
    colors: {
      sprout: '#E6EE9C',
      unfolding: '#9CCC65',
      mature: '#388E3C',
      spore: '#3D5A2B',
      sporangium: '#A1887F'
    },
    growthPeriodDays: 45,
    info: {
      habitat: {
        temperatureRange: [15, 30],
        humidityRequirement: '多变 (耐旱可复苏)',
        typicalEnvironment: '干燥岩石坡、向阳山坡，极度耐旱'
      },
      evolutionDescription: '卷柏是石松类中进化程度最高的类群，出现了异型孢子（大孢子和小孢子），这是种子植物胚珠和花粉的雏形，代表了植物繁殖策略的重大革新。',
      interestingFacts: [
        '又名"九死还魂草"，干旱时卷缩成团，遇水重新展开',
        '可休眠数十年，遇水即复苏',
        '异型孢子的出现是种子演化的关键前奏'
      ]
    }
  },
  {
    id: 'equisetum',
    scientificName: 'Equisetum',
    commonName: '问荆',
    orderInEvolution: 4,
    ancestorId: 'selaginella',
    frondShape: {
      type: 'pinnate' as FrondShapeType,
      length: 0.5,
      width: 0.8,
      curvature: 0.05,
      segmentation: 8
    },
    stem: {
      height: 2.5,
      thickness: 0.1,
      branchingAngle: 70
    },
    colors: {
      sprout: '#DCEDC8',
      unfolding: '#AED581',
      mature: '#4CAF50',
      spore: '#456B3F',
      sporangium: '#6D4C41'
    },
    growthPeriodDays: 75,
    info: {
      habitat: {
        temperatureRange: [5, 25],
        humidityRequirement: '喜湿 (75%-95%)',
        typicalEnvironment: '河岸、沟渠、沼泽地等湿润环境'
      },
      evolutionDescription: '木贼类是蕨类植物中独特的一支，茎中空有节，叶退化为鞘状。在石炭纪曾高达30米形成芦木森林，现代种类虽小但保留了独特的茎结构。',
      interestingFacts: [
        '茎含硅质，古时用于打磨金属和木器',
        '孢子具有弹丝，干湿变化时弹射帮助传播',
        '营养枝和生殖枝分开，形态完全不同'
      ]
    }
  },
  {
    id: 'osmunda',
    scientificName: 'Osmunda',
    commonName: '紫萁',
    orderInEvolution: 5,
    ancestorId: 'equisetum',
    frondShape: {
      type: 'bipinnate' as FrondShapeType,
      length: 1.5,
      width: 0.9,
      curvature: 0.2,
      segmentation: 10
    },
    stem: {
      height: 1.5,
      thickness: 0.08,
      branchingAngle: 50
    },
    colors: {
      sprout: '#C8E6C9',
      unfolding: '#81C784',
      mature: '#2E7D32',
      spore: '#2C5228',
      sporangium: '#5D4037'
    },
    growthPeriodDays: 120,
    info: {
      habitat: {
        temperatureRange: [8, 26],
        humidityRequirement: '喜湿 (65%-90%)',
        typicalEnvironment: '山地林缘、溪边、湿地灌丛'
      },
      evolutionDescription: '紫萁是真蕨类中较原始的类群，代表了大型叶（真叶）的首次出现。其孢子叶与营养叶分离，孢子囊壁薄无环带，显示出原始真蕨的特征。',
      interestingFacts: [
        '幼叶拳卷如小提琴头，称为"提琴头"',
        '根茎可入药，名为"紫萁贯众"',
        '孢子囊成熟时呈金黄色，布满叶背'
      ]
    }
  },
  {
    id: 'adiantum',
    scientificName: 'Adiantum',
    commonName: '铁线蕨',
    orderInEvolution: 6,
    ancestorId: 'osmunda',
    frondShape: {
      type: 'bipinnate' as FrondShapeType,
      length: 1.2,
      width: 0.7,
      curvature: 0.25,
      segmentation: 12
    },
    stem: {
      height: 0.6,
      thickness: 0.02,
      branchingAngle: 45
    },
    colors: {
      sprout: '#DCE775',
      unfolding: '#AED581',
      mature: '#43A047',
      spore: '#336B37',
      sporangium: '#4E342E'
    },
    growthPeriodDays: 80,
    info: {
      habitat: {
        temperatureRange: [12, 28],
        humidityRequirement: '高湿 (80%-95%)',
        typicalEnvironment: '林下阴湿处、石灰岩缝隙、瀑布旁'
      },
      evolutionDescription: '铁线蕨代表了真蕨类中叶片高度分化的类群，具有纤细的黑色叶柄（如铁丝）和精致的扇形小羽片。孢子囊群生于叶缘反折的囊群盖下，是水龙骨类演化的先声。',
      interestingFacts: [
        '叶柄乌黑发亮如铁丝，故得名',
        '叶片有疏水性，水珠滚落不留痕迹',
        '钙质土指示植物，可探测石灰岩'
      ]
    }
  },
  {
    id: 'pteris',
    scientificName: 'Pteris',
    commonName: '凤尾蕨',
    orderInEvolution: 7,
    ancestorId: 'adiantum',
    frondShape: {
      type: 'bipinnate' as FrondShapeType,
      length: 2.0,
      width: 1.2,
      curvature: 0.18,
      segmentation: 14
    },
    stem: {
      height: 1.0,
      thickness: 0.05,
      branchingAngle: 42
    },
    colors: {
      sprout: '#C5E1A5',
      unfolding: '#66BB6A',
      mature: '#1B5E20',
      spore: '#264A22',
      sporangium: '#5D4037'
    },
    growthPeriodDays: 100,
    info: {
      habitat: {
        temperatureRange: [10, 30],
        humidityRequirement: '中湿 (55%-85%)',
        typicalEnvironment: '林缘、路边、石缝，适应性较强'
      },
      evolutionDescription: '凤尾蕨是真蕨类中高度进化的代表，具有典型的水龙骨目特征：孢子囊群沿叶脉分布，具杯状或线形囊群盖，环带纵行。体现了蕨类植物形态和生态适应的多样性。',
      interestingFacts: [
        '对砷有超强富集能力，可用于土壤修复',
        '某些品种叶片具银白或金黄条纹',
        '耐阴耐旱，是常见的园艺蕨类'
      ]
    }
  },
  {
    id: 'dicksonia',
    scientificName: 'Dicksonia',
    commonName: '软树蕨',
    orderInEvolution: 8,
    ancestorId: 'pteris',
    frondShape: {
      type: 'bipinnate' as FrondShapeType,
      length: 4.0,
      width: 2.5,
      curvature: 0.22,
      segmentation: 20
    },
    stem: {
      height: 8.0,
      thickness: 0.4,
      branchingAngle: 60
    },
    colors: {
      sprout: '#B9F6CA',
      unfolding: '#69F0AE',
      mature: '#00C853',
      spore: '#1B8A4C',
      sporangium: '#3E2723'
    },
    growthPeriodDays: 240,
    info: {
      habitat: {
        temperatureRange: [5, 20],
        humidityRequirement: '高湿 (75%-98%)',
        typicalEnvironment: '温带雨林、云雾林、南半球山地森林'
      },
      evolutionDescription: '软树蕨代表了蕨类植物体型演化的顶峰——树状蕨类。虽然与石炭纪的高大乔木蕨无直接亲缘，但通过趋同进化，再次演化出树干形态，重现了蕨类时代的壮观景象。',
      interestingFacts: [
        '茎可高达15米，是最大的蕨类之一',
        '树干由无数不定根缠绕叶柄基部形成',
        '原生地受保护，伐取树干属于违法行为'
      ]
    }
  }
];

const EVOLUTION_GRAPH: EvolutionGraph = {
  nodes: [
    { plantId: 'psilotum', position: { x: 0.3, y: 0.05 } },
    { plantId: 'lycopodium', position: { x: 0.7, y: 0.18 } },
    { plantId: 'selaginella', position: { x: 0.3, y: 0.31 } },
    { plantId: 'equisetum', position: { x: 0.7, y: 0.44 } },
    { plantId: 'osmunda', position: { x: 0.3, y: 0.57 } },
    { plantId: 'adiantum', position: { x: 0.7, y: 0.69 } },
    { plantId: 'pteris', position: { x: 0.3, y: 0.81 } },
    { plantId: 'dicksonia', position: { x: 0.7, y: 0.92 } }
  ],
  links: [
    { from: 'psilotum', to: 'lycopodium' },
    { from: 'lycopodium', to: 'selaginella' },
    { from: 'selaginella', to: 'equisetum' },
    { from: 'equisetum', to: 'osmunda' },
    { from: 'osmunda', to: 'adiantum' },
    { from: 'adiantum', to: 'pteris' },
    { from: 'pteris', to: 'dicksonia' }
  ]
};

const STAGE_PARAMS: Record<GrowthStage, StageParams> = {
  sprout: {
    stemScale: 0.15,
    frondUnfurl: 0.05,
    frondScale: 0.1,
    hasSporangia: false,
    sporangiaDensity: 0
  },
  unfolding: {
    stemScale: 0.5,
    frondUnfurl: 0.55,
    frondScale: 0.45,
    hasSporangia: false,
    sporangiaDensity: 0
  },
  mature: {
    stemScale: 1.0,
    frondUnfurl: 1.0,
    frondScale: 1.0,
    hasSporangia: false,
    sporangiaDensity: 0
  },
  spore: {
    stemScale: 1.0,
    frondUnfurl: 1.0,
    frondScale: 1.0,
    hasSporangia: true,
    sporangiaDensity: 0.85
  }
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const clampedT = Math.max(0, Math.min(1, t));
  return rgbToHex(
    c1.r + (c2.r - c1.r) * clampedT,
    c1.g + (c2.g - c1.g) * clampedT,
    c1.b + (c2.b - c1.b) * clampedT
  );
}

function getPlantById(id: string): FullPlantData | undefined {
  return PLANTS.find(p => p.id === id);
}

function queryPlants(): PlantBase[] {
  return PLANTS.map(({ id, scientificName, commonName, orderInEvolution, ancestorId }) => ({
    id,
    scientificName,
    commonName,
    orderInEvolution,
    ancestorId
  }));
}

function queryPlantConfig(id: string): PlantConfig | null {
  const plant = getPlantById(id);
  if (!plant) return null;
  const { info, ...config } = plant;
  return config;
}

function calculateStageMorphology(id: string, stage: GrowthStage): StageMorphology | null {
  const plant = getPlantById(id);
  if (!plant) return null;

  const order = STAGE_ORDER[stage];
  const nextOrder = Math.min(order + 1, GROWTH_STAGES.length - 1);
  const currentStage = GROWTH_STAGES[order];
  const nextStage = GROWTH_STAGES[nextOrder];

  const currentParams = STAGE_PARAMS[currentStage];
  const nextParams = STAGE_PARAMS[nextStage];

  const stageColors: GrowthStage[] = ['sprout', 'unfolding', 'mature', 'spore'];
  const colorOrder = stageColors.indexOf(stage);
  const nextColorOrder = Math.min(colorOrder + 1, stageColors.length - 1);

  const colorKeys = ['sprout', 'unfolding', 'mature', 'spore'] as const;
  const colorFrom = plant.colors[colorKeys[colorOrder]];
  const colorTo = plant.colors[colorKeys[nextColorOrder]];

  return {
    stemScale: currentParams.stemScale,
    frondUnfurl: currentParams.frondUnfurl,
    frondScale: currentParams.frondScale,
    colorBlend: order === nextOrder ? colorFrom : lerpColor(colorFrom, colorTo, 0.5),
    hasSporangia: currentParams.hasSporangia,
    sporangiaDensity: currentParams.sporangiaDensity
  };
}

function queryEvolutionGraph(): EvolutionGraph {
  return EVOLUTION_GRAPH;
}

function simulateGrowth(req: GrowthActionRequest): GrowthActionResponse | null {
  const { plantId, fromStage, action } = req;
  const plant = getPlantById(plantId);
  if (!plant) return null;

  let currentStage: GrowthStage;
  let message: string;

  if (action === 'reset') {
    currentStage = 'sprout';
    message = `${plant.commonName} 已重置到幼芽期`;
  } else {
    const currentOrder = STAGE_ORDER[fromStage];
    if (currentOrder >= GROWTH_STAGES.length - 1) {
      currentStage = 'spore';
      message = `${plant.commonName} 已处于孢子期，成长完成`;
    } else {
      currentStage = GROWTH_STAGES[currentOrder + 1];
      const stageNames: Record<GrowthStage, string> = {
        sprout: '幼芽期',
        unfolding: '展开期',
        mature: '成熟期',
        spore: '孢子期'
      };
      message = `${plant.commonName} 成长到${stageNames[currentStage]}`;
    }
  }

  const morphology = calculateStageMorphology(plantId, currentStage);
  if (!morphology) return null;

  return {
    plantId,
    currentStage,
    morphology,
    message
  };
}

function queryPlantInfo(id: string): PlantInfo | null {
  const plant = getPlantById(id);
  if (!plant) return null;

  return {
    id: plant.id,
    scientificName: plant.scientificName,
    commonName: plant.commonName,
    orderInEvolution: plant.orderInEvolution,
    ancestorId: plant.ancestorId,
    habitat: plant.info.habitat,
    evolutionDescription: plant.info.evolutionDescription,
    interestingFacts: plant.info.interestingFacts
  };
}

export {
  PLANTS,
  EVOLUTION_GRAPH,
  STAGE_PARAMS,
  hexToRgb,
  rgbToHex,
  lerpColor,
  queryPlants,
  queryPlantConfig,
  calculateStageMorphology,
  queryEvolutionGraph,
  simulateGrowth,
  queryPlantInfo
};

export type {
  FullPlantData,
  StageParams
};
