export interface Fragment {
  id: string;
  artifactId: string;
  shape: number[][];
  color: string;
  size: number;
  rotation: number;
  targetX: number;
  targetY: number;
  targetRotation: number;
  currentX: number;
  currentY: number;
  isPlaced: boolean;
  isPicked: boolean;
  gridX: number;
  gridY: number;
}

export interface Artifact {
  id: string;
  name: string;
  dynasty: string;
  year: string;
  fragments: Fragment[];
  color: string;
  completedAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  tags: string[];
  imageUrl?: string;
}

export interface GridCell {
  x: number;
  y: number;
  isExcavated: boolean;
  fragment?: Fragment;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export const CERAMIC_COLORS = ['#90A98E', '#F5F0E1', '#C46A4E', '#3A2A1A'];

export const ARTIFACT_PRESETS = [
  { name: '西汉云纹陶罐', dynasty: '西汉', year: '公元前150年', fragmentCount: 4 },
  { name: '唐代青瓷碗', dynasty: '唐代', year: '公元680年', fragmentCount: 5 },
  { name: '宋代白瓷瓶', dynasty: '宋代', year: '公元1120年', fragmentCount: 4 },
  { name: '新石器时代红陶鼎', dynasty: '新石器时代', year: '公元前3000年', fragmentCount: 6 },
  { name: '商代黑陶尊', dynasty: '商代', year: '公元前1200年', fragmentCount: 5 },
  { name: '明清青花瓷盘', dynasty: '明代', year: '公元1450年', fragmentCount: 6 },
  { name: '东汉绿釉陶壶', dynasty: '东汉', year: '公元80年', fragmentCount: 4 },
  { name: '辽代三彩罐', dynasty: '辽代', year: '公元950年', fragmentCount: 5 },
];

export const PRESET_TAGS = ['重要发现', '需要修复', '已完成'];

export const PARTICLE_COLORS = ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E64'];
