export type StorageType = 'cabinet' | 'drawer' | 'box';

export interface Item {
  id: string;
  name: string;
  category: string;
  quantity: number;
  estimatedVolume: number;
}

export interface StorageUnit {
  id: string;
  name: string;
  type: StorageType;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  items: Item[];
}

export type TabType = 'editor' | 'preview' | 'analysis';

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  cabinet: '柜子',
  drawer: '抽屉',
  box: '储物盒',
};

export const STORAGE_TYPE_COLORS: Record<StorageType, string> = {
  cabinet: '#4A90D9',
  drawer: '#50C878',
  box: '#DDA0DD',
};
