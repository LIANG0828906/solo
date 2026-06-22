export type BuildingFunction = 'residential' | 'commercial' | 'leisure' | 'transport';

export interface BuildingData {
  id: string;
  x: number;
  z: number;
  height: number;
  function: BuildingFunction;
  audioFile: string;
  name: string;
  roofType: 'spire' | 'flat';
  roofRotation: number;
}

export const BUILDING_COLORS: Record<BuildingFunction, number> = {
  residential: 0xe67e22,
  commercial: 0x2980b9,
  leisure: 0x27ae60,
  transport: 0x8e44ad,
};

export const BUILDING_NAMES: Record<BuildingFunction, string[]> = {
  residential: ['阳光公寓', '绿城家园', '幸福里', '安居苑', '锦绣花园', '和谐家园'],
  commercial: ['星河商场', '时尚广场', '财富中心', '万象城', '银泰百货', '金街商区'],
  leisure: ['中央公园', '城市绿地', '音乐广场', '艺术中心', '湖畔公园', '科技馆'],
  transport: ['中央车站', '地铁枢纽', '公交总站', '换乘中心', '空港快轨', '城际站'],
};

export const AUDIO_TRACKS: Record<BuildingFunction, string[]> = {
  residential: ['街道车流声', '社区人声', '庭院鸟鸣', '孩童嬉闹'],
  commercial: ['商场背景音乐', '咖啡店人声', '步行街喧闹', '餐厅环境音'],
  leisure: ['公园鸟鸣', '树叶沙沙声', '喷泉流水声', '小提琴演奏'],
  transport: ['地铁轰鸣', '公交报站', '人流嘈杂声', '列车进站声'],
};

const GRID_SIZE = 9;
const BUILDING_SPACING = 20;
const STREET_WIDTH = 6;
const MIN_HEIGHT = 15;
const MAX_HEIGHT = 80;

function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateBuildings(): BuildingData[] {
  const random = seededRandom(42);
  const buildings: BuildingData[] = [];
  const offset = -(GRID_SIZE * (BUILDING_SPACING + STREET_WIDTH)) / 2 + BUILDING_SPACING / 2;

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      const centerX = GRID_SIZE / 2;
      const centerZ = GRID_SIZE / 2;
      const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2));
      
      let func: BuildingFunction;
      const rand = random();
      
      if (distFromCenter < 2) {
        func = 'commercial';
      } else if (distFromCenter < 3.5) {
        func = rand < 0.6 ? 'commercial' : 'residential';
      } else if (x === 0 || z === 0 || x === GRID_SIZE - 1 || z === GRID_SIZE - 1) {
        func = rand < 0.3 ? 'transport' : 'leisure';
      } else {
        if (rand < 0.45) func = 'residential';
        else if (rand < 0.7) func = 'commercial';
        else if (rand < 0.9) func = 'leisure';
        else func = 'transport';
      }

      const heightBase = func === 'commercial' ? 40 : func === 'residential' ? 25 : 20;
      const heightVariation = (random() - 0.5) * (MAX_HEIGHT - MIN_HEIGHT) * 0.6;
      let height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, heightBase + heightVariation));
      
      if (distFromCenter < 2 && func === 'commercial') {
        height = Math.max(height, 50 + random() * 30);
      }

      const nameList = BUILDING_NAMES[func];
      const name = nameList[Math.floor(random() * nameList.length)] + ` ${x + 1}-${z + 1}`;
      
      const audioList = AUDIO_TRACKS[func];
      const audioFile = audioList[Math.floor(random() * audioList.length)];

      const roofType: 'spire' | 'flat' = random() > 0.5 ? 'spire' : 'flat';
      const roofRotation = random() * Math.PI * 2;

      buildings.push({
        id: `building_${x}_${z}`,
        x: offset + x * (BUILDING_SPACING + STREET_WIDTH),
        z: offset + z * (BUILDING_SPACING + STREET_WIDTH),
        height,
        function: func,
        audioFile,
        name,
        roofType,
        roofRotation,
      });
    }
  }

  return buildings;
}

export const buildingData: BuildingData[] = generateBuildings();

export const gridConfig = {
  size: GRID_SIZE,
  buildingSpacing: BUILDING_SPACING,
  streetWidth: STREET_WIDTH,
  totalSize: GRID_SIZE * BUILDING_SPACING + (GRID_SIZE + 1) * STREET_WIDTH,
};

export function getBuildingById(id: string): BuildingData | undefined {
  return buildingData.find(b => b.id === id);
}
