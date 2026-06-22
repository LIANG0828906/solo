export interface DataPoint {
  time: string;
  value: number;
  category: string;
  index: number;
}

export interface VisualConfig {
  baseHeight: number;
  heightScale: number;
  gridSize: number;
  geometryType: 'box' | 'sphere';
}

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface SelectedDataDetail {
  point: DataPoint;
  rank: number;
  screenPosition: { x: number; y: number };
}

export type DataSourceType = 'mock' | 'csv';

export interface LoadingState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  progress: number;
  message?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  '科技': '#2AF5FF',
  '金融': '#A855F7',
  '医疗': '#22D3EE',
  '能源': '#F472B6',
  '消费': '#34D399',
  '工业': '#FBBF24',
  'default1': '#2AF5FF',
  'default2': '#A855F7',
  'default3': '#22D3EE',
  'default4': '#F472B6',
  'default5': '#34D399',
};

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: '俯视45°',
    position: [12, 12, 12],
    target: [0, 0, 0],
  },
  {
    name: '正面',
    position: [0, 4, 18],
    target: [0, 2, 0],
  },
  {
    name: '侧面',
    position: [18, 4, 0],
    target: [0, 2, 0],
  },
];
