
export type ElementType = 'C' | 'H' | 'O' | 'N' | 'S';
export type BondType = 'single' | 'double' | 'triple';

export interface ElementConfig {
  color: string;
  radius: number;
  name: string;
  atomicWeight: number;
  atomicNumber: number;
}

export const ELEMENT_CONFIG: Record<ElementType, ElementConfig> = {
  C: { color: '#404040', radius: 0.7, name: '碳', atomicWeight: 12.011, atomicNumber: 6 },
  H: { color: '#ffffff', radius: 0.35, name: '氢', atomicWeight: 1.008, atomicNumber: 1 },
  O: { color: '#ff4444', radius: 0.6, name: '氧', atomicWeight: 15.999, atomicNumber: 8 },
  N: { color: '#4488ff', radius: 0.65, name: '氮', atomicWeight: 14.007, atomicNumber: 7 },
  S: { color: '#ffdd44', radius: 0.8, name: '硫', atomicWeight: 32.06, atomicNumber: 16 },
};

export const ELEMENT_LIST: ElementType[] = ['C', 'H', 'O', 'N', 'S'];

export const BOND_CONFIG: Record<BondType, { name: string; color: string; count: number }> = {
  single: { name: '单键', color: '#888888', count: 1 },
  double: { name: '双键', color: '#66aaff', count: 2 },
  triple: { name: '三键', color: '#ff8866', count: 3 },
};
