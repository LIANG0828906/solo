export type ResourceType = 'stone' | 'wood' | 'gold' | 'food';
export type WorkerType = 'miner' | 'woodcutter' | 'goldPanner' | 'farmer';
export type PhaseStatus = 'locked' | 'available' | 'building' | 'completed';
export type TaskStatus = 'pending' | 'building' | 'done';

export interface Resources {
  stone: number;
  wood: number;
  gold: number;
  food: number;
}

export interface WorkerAssignment {
  miners: number;
  woodcutters: number;
  goldPanners: number;
  farmers: number;
  idle: number;
  total: number;
}

export interface BuildPhase {
  id: string;
  index: number;
  name: string;
  description: string;
  status: PhaseStatus;
  requiredResources: Partial<Resources>;
  requiredWorkers: number;
  complexity: number;
  materials: ('stone' | 'wood' | 'gold')[];
}

export interface BuildTask {
  taskId: string;
  phaseId: string;
  phaseName: string;
  phaseIndex: number;
  startTime: number | null;
  estimatedTime: number;
  remainingSeconds: number;
  progress: number;
  status: TaskStatus;
}

export interface WorkerResourceRate {
  stone: number;
  wood: number;
  gold: number;
  food: number;
}

export const RESOURCE_CAP: Resources = {
  stone: 10000,
  wood: 10000,
  gold: 5000,
  food: 8000,
};

export const WORKER_RATES: WorkerResourceRate = {
  stone: 1.5,
  wood: 1.2,
  gold: 0.4,
  food: 2.0,
};

export const WORKER_FOOD_COST = 20;

export const BUILD_PHASES: Omit<BuildPhase, 'status'>[] = [
  {
    id: 'phase-1',
    index: 0,
    name: '地基勘测',
    description: '在沙漠中寻找稳固的岩床作为金字塔地基',
    requiredResources: { stone: 50, wood: 20 },
    requiredWorkers: 5,
    complexity: 1.0,
    materials: ['stone'],
  },
  {
    id: 'phase-2',
    index: 1,
    name: '第一层石块',
    description: '铺设金字塔最底层的巨型石灰岩基座',
    requiredResources: { stone: 200, wood: 50, food: 30 },
    requiredWorkers: 10,
    complexity: 1.2,
    materials: ['stone', 'wood'],
  },
  {
    id: 'phase-3',
    index: 2,
    name: '内部通道',
    description: '建造通往国王墓室的下行通道',
    requiredResources: { stone: 150, wood: 80, gold: 10 },
    requiredWorkers: 8,
    complexity: 1.5,
    materials: ['stone', 'wood'],
  },
  {
    id: 'phase-4',
    index: 3,
    name: '国王墓室',
    description: '用花岗岩砌筑法老的永恒安息之所',
    requiredResources: { stone: 300, wood: 100, gold: 50 },
    requiredWorkers: 15,
    complexity: 2.0,
    materials: ['stone', 'wood', 'gold'],
  },
  {
    id: 'phase-5',
    index: 4,
    name: '第三层砌体',
    description: '继续向上砌筑主体结构',
    requiredResources: { stone: 400, wood: 60, food: 50 },
    requiredWorkers: 18,
    complexity: 1.8,
    materials: ['stone'],
  },
  {
    id: 'phase-6',
    index: 5,
    name: '通风系统',
    description: '为墓室建造精密的南北通风井',
    requiredResources: { stone: 200, wood: 120, gold: 20 },
    requiredWorkers: 12,
    complexity: 2.2,
    materials: ['stone', 'wood'],
  },
  {
    id: 'phase-7',
    index: 6,
    name: '第六层台阶',
    description: '金字塔中层的主体砌筑工程',
    requiredResources: { stone: 500, wood: 80, food: 60 },
    requiredWorkers: 22,
    complexity: 2.0,
    materials: ['stone', 'wood'],
  },
  {
    id: 'phase-8',
    index: 7,
    name: '大画廊',
    description: '建造壮观的高耸通道连接各墓室',
    requiredResources: { stone: 350, wood: 150, gold: 40 },
    requiredWorkers: 16,
    complexity: 2.8,
    materials: ['stone', 'wood', 'gold'],
  },
  {
    id: 'phase-9',
    index: 8,
    name: '外层包石',
    description: '用精细打磨的白色图拉石灰石覆盖外表面',
    requiredResources: { stone: 600, wood: 100, food: 80 },
    requiredWorkers: 25,
    complexity: 2.5,
    materials: ['stone'],
  },
  {
    id: 'phase-10',
    index: 9,
    name: '装饰浮雕',
    description: '在外墙上雕刻象形文字与神祇图案',
    requiredResources: { stone: 200, gold: 100, wood: 50 },
    requiredWorkers: 20,
    complexity: 3.0,
    materials: ['stone', 'gold'],
  },
  {
    id: 'phase-11',
    index: 10,
    name: '封顶工程',
    description: '将金字塔收窄至顶端的方形平台',
    requiredResources: { stone: 400, wood: 120, food: 100 },
    requiredWorkers: 28,
    complexity: 3.2,
    materials: ['stone', 'wood'],
  },
  {
    id: 'phase-12',
    index: 11,
    name: '黄金顶石',
    description: '安设纯金包裹的金字塔顶石贝尼本特',
    requiredResources: { gold: 300, stone: 100, wood: 80 },
    requiredWorkers: 35,
    complexity: 4.0,
    materials: ['gold', 'stone', 'wood'],
  },
];
