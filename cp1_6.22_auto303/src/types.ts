export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  isExit?: boolean;
  isEntrance?: boolean;
}

export type MarkerType = 'minecart' | 'chest' | 'exit';

export interface PathMarker {
  position: Position;
  type: MarkerType;
  createdAt: number;
}

export interface CompassState {
  currentPosition: Position;
  pathStack: Position[];
  markers: PathMarker[];
  exploredCells: Set<string>;
  isBacktracking: boolean;
  steps: number;
}
