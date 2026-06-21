export type ExhibitType = 'cube' | 'sphere' | 'cylinder' | 'torus';

export interface Exhibit {
  id: string;
  name: string;
  type: ExhibitType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  opacity: number;
}

export interface PathPoint {
  id: string;
  position: [number, number, number];
}

export interface Scene {
  id: string;
  name: string;
  exhibits: Exhibit[];
  path: PathPoint[];
  createdAt: number;
  updatedAt: number;
}

export interface AnalysisResult {
  exhibitId: string;
  exhibitName: string;
  isOccluded: boolean;
  occlusionPercentage: number;
  occlusionDuration: number;
}

export type GetScenesResponse = Scene[];

export interface SaveSceneRequest {
  name: string;
  exhibits: Exhibit[];
  path: PathPoint[];
}

export interface SaveSceneResponse {
  id: string;
  shareUrl: string;
}

export interface GetAnalysisResponse {
  timestamp: number;
  results: AnalysisResult[];
  cameraPosition: [number, number, number];
}

export interface ExhibitTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export type EditorMode = 'select' | 'pan' | 'drawPath' | 'playPath';
