export interface Artifact {
  id: string;
  name: string;
  dynasty: string;
  era: string;
  origin: string;
  rating: number;
  eraColor: string;
  modelType: 'ding' | 'vase' | 'sword' | 'jade' | 'pot' | 'mirror';
  description: string;
  narration: string;
  height: number;
  relatedIds: string[];
}

export interface ArtifactListItem {
  id: string;
  name: string;
  dynasty: string;
  era: string;
}

export interface ViewerState {
  currentArtifactId: string | null;
  zoomLevel: number;
  cameraAngle: number;
  isCompareMode: boolean;
  compareArtifactIds: string[];
}

export interface NarrationState {
  isPlaying: boolean;
  text: string;
  scrollPosition: number;
}
