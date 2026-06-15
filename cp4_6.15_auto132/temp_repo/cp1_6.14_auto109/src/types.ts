export type SiteType = 'desert' | 'jungle' | 'ocean';
export type ToolType = 'brush' | 'shovel' | 'vacuum';
export type RegionType = 'egypt' | 'greek' | 'china' | 'maya' | 'roman' | 'mesopotamia';

export interface EdgeSignature {
  north?: { matchId: string; angle: number };
  south?: { matchId: string; angle: number };
  east?: { matchId: string; angle: number };
  west?: { matchId: string; angle: number };
}

export interface FragmentData {
  id: string;
  artifactId: string;
  index: number;
  shape: number[][];
  color: string;
  edgeSignature: EdgeSignature;
  initialRotation: number;
  initialFlipped: boolean;
}

export interface ArtifactData {
  id: string;
  name: string;
  region: RegionType;
  era: string;
  fragmentCount: number;
  fragments: FragmentData[];
  thumbnail: string;
  backgroundType: string;
  site: SiteType;
}

export interface RestorationRecord {
  id: string;
  artifactId: string;
  artifactName: string;
  site: SiteType;
  tool: ToolType;
  integrity: number;
  stars: number;
  digTime: number;
  restorationAccuracy: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PlacedFragment {
  id: string;
  x: number;
  y: number;
  rotation: number;
  flipped: boolean;
  matched: boolean;
}

export interface GridCell {
  row: number;
  col: number;
  excavated: boolean;
  hasFragment: boolean;
  fragmentId?: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FlareCell {
  row: number;
  col: number;
  time: number;
}
