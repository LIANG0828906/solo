export type LayerType = 'rect' | 'circle' | 'text' | 'image';

export interface PosterLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity: number;
  zIndex: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
}

export interface PosterTemplate {
  layers: PosterLayer[];
  palette: string[];
  width: number;
  height: number;
  bgColor: string;
}

export interface BehaviorParams {
  dwellTime: number;
  mouseX: number;
  mouseY: number;
  hueShift: number;
  compositionWeight: number;
  particleCount: number;
}

export interface DerivedVersion {
  uuid: string;
  savedAt: string;
  thumbnail: string;
  behaviorSnapshot: BehaviorParams;
}

export interface Poster {
  id: string;
  name: string;
  author: string;
  createdAt: string;
  previewImage: string;
  template: PosterTemplate;
  derivedVersions: DerivedVersion[];
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface UploadFormData {
  name: string;
  author: string;
  templateFile: File | null;
  previewFile: File | null;
}
