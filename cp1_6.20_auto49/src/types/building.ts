export interface Building {
  id: string;
  name: string;
  defaultHeight: number;
  color: string;
  type: string;
  height?: number;
  position?: { x: number; z: number };
}
