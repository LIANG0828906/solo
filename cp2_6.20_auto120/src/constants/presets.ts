import type { CellType, Organelle } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function createOrganelle(
  type: Organelle['type'],
  position: [number, number, number],
  scale: number = 1
): Organelle {
  return {
    id: uuidv4(),
    type,
    position,
    scale,
  };
}

export const defaultOrganelles: Organelle[] = [
  createOrganelle('nucleus', [0, 0, 0], 1),
  createOrganelle('mitochondria', [2, 1, 0], 1),
  createOrganelle('er', [-1.5, 1.5, 1], 1),
];

export const liverOrganelles: Organelle[] = [
  createOrganelle('nucleus', [0, 0, 0], 1.2),
  createOrganelle('mitochondria', [2.5, 0.5, 0.5], 1.3),
  createOrganelle('mitochondria', [-2, -1, 1], 1.2),
  createOrganelle('er', [-1.5, 1.5, -1], 1.4),
  createOrganelle('er', [1, -1.5, 1.5], 1.1),
];

export const neuronOrganelles: Organelle[] = [
  createOrganelle('nucleus', [0, 0, 0], 0.9),
  createOrganelle('mitochondria', [3, 0, 0], 0.8),
  createOrganelle('mitochondria', [-3, 0.2, 0.5], 0.8),
  createOrganelle('mitochondria', [0, 2.5, -0.3], 0.7),
  createOrganelle('er', [-1, 1, 0.5], 0.9),
  createOrganelle('er', [1, -0.8, -0.5], 0.9),
];

export const muscleOrganelles: Organelle[] = [
  createOrganelle('nucleus', [-2.5, 0, 0], 0.8),
  createOrganelle('nucleus', [2.5, 0, 0], 0.8),
  createOrganelle('mitochondria', [0, 1.5, 0], 1.5),
  createOrganelle('mitochondria', [0, -1.5, 0], 1.5),
  createOrganelle('mitochondria', [1.5, 0, 1.5], 1.3),
  createOrganelle('er', [0, 0, 2], 0.8),
  createOrganelle('er', [0, 0, -2], 0.8),
];

export const organellePresets: Record<CellType, Organelle[]> = {
  default: defaultOrganelles,
  liver: liverOrganelles,
  neuron: neuronOrganelles,
  muscle: muscleOrganelles,
};

export const cellTypeLabels: Record<CellType, string> = {
  default: '标准细胞',
  liver: '肝细胞',
  neuron: '神经细胞',
  muscle: '肌肉细胞',
};

export const cellTypeDescriptions: Record<CellType, string> = {
  default: '基础细胞模型，包含细胞核、线粒体和内质网各一个',
  liver: '肝细胞特征：较大的内质网和多个线粒体',
  neuron: '神经细胞特征：细长形态，多个线粒体分布在轴突区域',
  muscle: '肌肉细胞特征：多核，大量线粒体供能',
};
