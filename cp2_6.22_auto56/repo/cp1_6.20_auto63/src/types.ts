export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  area: number;
  floor: number;
  temperature: number;
  temperatures: number[];
}

export interface BuildingData {
  rooms: Room[];
}

export interface FilterRange {
  min: number;
  max: number;
}

export interface AnimationState {
  isPlaying: boolean;
  currentHour: number;
  speed: number;
}
