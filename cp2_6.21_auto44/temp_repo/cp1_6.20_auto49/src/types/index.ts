export interface BuildingTemplate {
  id: string;
  name: string;
  defaultHeight: number;
  color: string;
  type: 'residential' | 'office' | 'commercial' | 'hotel';
}

export interface Building {
  id: string;
  templateId: string;
  position: { x: number; y: number; z: number };
  height: number;
  rotation: number;
  color: string;
}

export interface CityLayout {
  buildings: Building[];
  timestamp: number;
  version: string;
}

export type CameraMode = 'orbit' | 'firstPerson';
