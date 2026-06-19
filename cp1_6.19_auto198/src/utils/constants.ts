import type { OrderStatus, Settings } from '../types';

interface StatusConfig {
  label: string;
  color: string;
  borderColor: string;
}

interface ProcessDefinition {
  name: string;
  hourlyRate: number;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  design: {
    label: '设计',
    color: '#3B82F6',
    borderColor: '#2563EB',
  },
  cutting: {
    label: '裁切',
    color: '#F59E0B',
    borderColor: '#D97706',
  },
  stitching: {
    label: '缝合',
    color: '#10B981',
    borderColor: '#059669',
  },
  edge: {
    label: '封边',
    color: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  quality: {
    label: '质检',
    color: '#EC4899',
    borderColor: '#DB2777',
  },
  done: {
    label: '完成',
    color: '#6B7280',
    borderColor: '#4B5563',
  },
};

export const PROCESS_DEFINITIONS: ProcessDefinition[] = [
  { name: '设计', hourlyRate: 20 },
  { name: '裁切', hourlyRate: 25 },
  { name: '缝合', hourlyRate: 30 },
  { name: '封边', hourlyRate: 28 },
  { name: '质检', hourlyRate: 15 },
];

export const DEFAULT_SETTINGS: Settings = {
  leatherPrice: 8,
  hardwarePrice: 3,
  edgeOilPrice: 0.5,
  processRates: {
    '设计': 20,
    '裁切': 25,
    '缝合': 30,
    '封边': 28,
    '质检': 15,
  },
};
