export interface PlantSpeciesInfo {
  name: string;
  emoji: string;
  wateringInterval: number;
  lightRequirement: string;
  description: string;
}

export const PLANT_SPECIES: Record<string, PlantSpeciesInfo> = {
  '绿萝': {
    name: '绿萝',
    emoji: '🌿',
    wateringInterval: 7,
    lightRequirement: '散射光',
    description: '耐阴植物，适合室内种植'
  },
  '多肉': {
    name: '多肉',
    emoji: '🌵',
    wateringInterval: 14,
    lightRequirement: '充足阳光',
    description: '耐旱植物，浇水宁少勿多'
  },
  '龟背竹': {
    name: '龟背竹',
    emoji: '🍃',
    wateringInterval: 10,
    lightRequirement: '散射光',
    description: '喜湿润环境，叶片美观'
  },
  '琴叶榕': {
    name: '琴叶榕',
    emoji: '🌳',
    wateringInterval: 7,
    lightRequirement: '明亮散射光',
    description: '大型观叶植物，需要稳定环境'
  },
  '吊兰': {
    name: '吊兰',
    emoji: '🌱',
    wateringInterval: 5,
    lightRequirement: '半阴',
    description: '净化空气，易养护'
  },
  '发财树': {
    name: '发财树',
    emoji: '🌲',
    wateringInterval: 10,
    lightRequirement: '散射光',
    description: '寓意吉祥，耐旱'
  },
  '虎皮兰': {
    name: '虎皮兰',
    emoji: '🪴',
    wateringInterval: 14,
    lightRequirement: '适应性强',
    description: '夜间释放氧气，适合卧室'
  },
  '常春藤': {
    name: '常春藤',
    emoji: '🍀',
    wateringInterval: 5,
    lightRequirement: '半阴',
    description: '攀援植物，可垂吊养护'
  },
  '文竹': {
    name: '文竹',
    emoji: '🎋',
    wateringInterval: 7,
    lightRequirement: '散射光',
    description: '喜湿润，叶片纤细雅致'
  },
  '君子兰': {
    name: '君子兰',
    emoji: '🌸',
    wateringInterval: 7,
    lightRequirement: '散射光',
    description: '观花观叶皆宜，忌强光'
  }
};

export const getPlantInfo = (species: string): PlantSpeciesInfo => {
  return PLANT_SPECIES[species] || {
    name: species,
    emoji: '🌱',
    wateringInterval: 7,
    lightRequirement: '散射光',
    description: '通用养护建议'
  };
};

export const getWateringInterval = (species: string): number => {
  return getPlantInfo(species).wateringInterval;
};

export const getLightRequirement = (species: string): string => {
  return getPlantInfo(species).lightRequirement;
};

export const getPlantEmoji = (species: string): string => {
  return getPlantInfo(species).emoji;
};

export const getDaysSinceLastWatering = (lastWateringDate: string | null): number => {
  if (!lastWateringDate) return 999;
  const now = new Date();
  const last = new Date(lastWateringDate);
  const diffTime = Math.abs(now.getTime() - last.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getWateringStatus = (days: number, interval: number): 'good' | 'warning' | 'danger' => {
  if (days <= 3) return 'good';
  if (days <= 7) return 'warning';
  return 'danger';
};

export const getStatusColor = (status: 'good' | 'warning' | 'danger'): string => {
  switch (status) {
    case 'good':
      return 'var(--status-green)';
    case 'warning':
      return 'var(--status-yellow)';
    case 'danger':
      return 'var(--status-red)';
  }
};

export const getSpeciesList = (): string[] => {
  return Object.keys(PLANT_SPECIES);
};
