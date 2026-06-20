export interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

export interface UVCoord {
  u: number;
  v: number;
}

export interface Face {
  vertexIndices: [number, number, number];
  uvIndices: [number, number, number];
  area: number;
  color: string;
  normal?: Vertex3D;
}

export interface ModelData {
  vertices: Vertex3D[];
  uvs: UVCoord[];
  faces: Face[];
  faceCount: number;
  vertexCount: number;
}

export interface UIParams {
  checkerboardDensity: number;
  borderWidth: number;
  showWireframe: boolean;
}

export interface SelectionState {
  selectedFaceIndices: number[];
  selectedVertexIndex: number | null;
  isDragging: boolean;
}

export interface ValidationResult {
  valid: boolean;
  invalidFaces: number[];
  message: string;
}

export interface DragInfo {
  vertexIndex: number;
  originalUV: UVCoord;
  currentUV: UVCoord;
  adjacentFaces: number[];
}
