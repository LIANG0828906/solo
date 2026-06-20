export interface Building {
  id: string;
  position: { x: number; y: number; z: number };
  width: number;
  height: number;
  depth: number;
  color: string;
  selected: boolean;
}

export type ViewMode = 'freeroam' | 'overhead' | 'orbit';
