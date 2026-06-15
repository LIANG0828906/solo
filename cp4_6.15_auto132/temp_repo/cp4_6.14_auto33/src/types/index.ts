export interface Building {
  id: string;
  name: string;
  year: number;
  description: string;
  position: [number, number, number];
  height: number;
  color: string;
}

export interface ModelData {
  year: number;
  buildings: Building[];
  modelUrl: string;
}

export interface BuildingInfo {
  id: string;
  name: string;
  year: number;
  description: string;
}
