export interface BuildingData {
  id: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  color: string;
  sunHours: number;
}

export const buildingsData: BuildingData[] = [
  {
    id: 'building-1',
    position: { x: -15, y: 0, z: -10 },
    size: { width: 8, height: 12, depth: 8 },
    color: '#c0c0c0',
    sunHours: 10.5,
  },
  {
    id: 'building-2',
    position: { x: 5, y: 0, z: -12 },
    size: { width: 6, height: 8, depth: 6 },
    color: '#b8b8b8',
    sunHours: 9.2,
  },
  {
    id: 'building-3',
    position: { x: -8, y: 0, z: 8 },
    size: { width: 10, height: 15, depth: 10 },
    color: '#a8a8a8',
    sunHours: 8.7,
  },
  {
    id: 'building-4',
    position: { x: 12, y: 0, z: 5 },
    size: { width: 7, height: 6, depth: 7 },
    color: '#a0a0a0',
    sunHours: 11.3,
  },
  {
    id: 'building-5',
    position: { x: 0, y: 0, z: 0 },
    size: { width: 9, height: 10, depth: 9 },
    color: '#b0b0b0',
    sunHours: 9.8,
  },
  {
    id: 'building-6',
    position: { x: -20, y: 0, z: 15 },
    size: { width: 5, height: 5, depth: 5 },
    color: '#bcbcbc',
    sunHours: 12.0,
  },
];
