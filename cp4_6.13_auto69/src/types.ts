export interface ImageData {
  id: string;
  name: string;
  url: string;
  dominantColors: RGB[];
  averageColor: RGB;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ClusterGroup {
  groupId: string;
  color: RGB;
  colorHex: string;
  images: ImageData[];
  position: Position;
  radius: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface AppState {
  images: ImageData[];
  clusters: ClusterGroup[];
  threshold: number;
  isProcessing: boolean;
  selectedCluster: ClusterGroup | null;
  fps: number;
  resetCamera: () => void;
  setImages: (images: ImageData[]) => void;
  setClusters: (clusters: ClusterGroup[]) => void;
  setThreshold: (threshold: number) => void;
  setIsProcessing: (processing: boolean) => void;
  setSelectedCluster: (cluster: ClusterGroup | null) => void;
  setFps: (fps: number) => void;
  resetAll: () => void;
}
