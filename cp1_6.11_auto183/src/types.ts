export type WallType = 'front' | 'back' | 'left' | 'right';

export interface Painting {
  id: string;
  fileName: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  position: [number, number, number];
  rotation: number;
  wall: WallType;
  uploadTime: string;
}

export interface SceneLight {
  id: string;
  position: [number, number, number];
  intensity: number;
  colorTemperature: number;
}

export interface TextLabel {
  id: string;
  text: string;
  position: [number, number, number];
  wall: WallType;
}

export interface Exhibition {
  id?: string;
  paintings: Painting[];
  lights: SceneLight[];
  labels: TextLabel[];
}

export const WALL_BOUNDS = {
  front: { minX: -2.8, maxX: 2.8, minY: 0.3, maxY: 2.7 },
  back: { minX: -2.8, maxX: 2.8, minY: 0.3, maxY: 2.7 },
  left: { minX: -2.8, maxX: 2.8, minY: 0.3, maxY: 2.7 },
  right: { minX: -2.8, maxX: 2.8, minY: 0.3, maxY: 2.7 },
};

export function getWallPosition(wall: WallType, localX: number, localY: number): [number, number, number] {
  switch (wall) {
    case 'front': return [localX, localY, -2.95];
    case 'back': return [localX, localY, 2.95];
    case 'left': return [-2.95, localY, localX];
    case 'right': return [2.95, localY, localX];
  }
}

export function getWallRotation(wall: WallType): [number, number, number] {
  switch (wall) {
    case 'front': return [0, 0, 0];
    case 'back': return [0, Math.PI, 0];
    case 'left': return [0, Math.PI / 2, 0];
    case 'right': return [0, -Math.PI / 2, 0];
  }
}

export function getWallPlane(wall: WallType): { normal: [number, number, number]; constant: number } {
  switch (wall) {
    case 'front': return { normal: [0, 0, 1], constant: 3 };
    case 'back': return { normal: [0, 0, -1], constant: 3 };
    case 'left': return { normal: [1, 0, 0], constant: 3 };
    case 'right': return { normal: [-1, 0, 0], constant: 3 };
  }
}

export function colorTemperatureToHex(t: number): string {
  const r = 255;
  const g = Math.round(255 - t * 63);
  const b = Math.round(255 - t * 127);
  return `rgb(${r},${g},${b})`;
}
