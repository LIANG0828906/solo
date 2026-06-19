import type { Settings } from './types';

export const PROCESS_DEFINITIONS = [
  { name: '待设计', hourlyRate: 30 },
  { name: '裁切中', hourlyRate: 25 },
  { name: '缝合中', hourlyRate: 30 },
  { name: '封边', hourlyRate: 20 },
  { name: '质检', hourlyRate: 25 },
];

export const DEFAULT_SETTINGS: Settings = {
  leatherPrice: 8,
  hardwarePrice: 5,
  edgeOilPrice: 0.5,
  processRates: {
    '待设计': 30,
    '裁切中': 25,
    '缝合中': 30,
    '封边': 20,
    '质检': 25,
  },
};
