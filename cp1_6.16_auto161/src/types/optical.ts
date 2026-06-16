export type LensType = 'convex' | 'concave' | 'doublet';

export interface LensSurface {
  radius: number;
  thickness: number;
  refractiveIndex: number;
}

export interface Lens {
  id: string;
  type: LensType;
  positionZ: number;
  aperture: number;
  surfaces: LensSurface[];
}

export interface LightSource {
  position: { x: number; y: number; z: number };
  wavelengths: number[];
  rayCount: number;
}

export interface RaySegment {
  start: [number, number, number];
  end: [number, number, number];
  wavelength: number;
}

export interface TraceResult {
  raySegments: RaySegment[];
  focalPoints: { wavelength: number; x: number; y: number; z: number }[];
  screenHits: { wavelength: number; x: number; y: number; intensity: number }[];
}

export interface OpticalSurface {
  z: number;
  radius: number;
  curvature: number;
  aperture: number;
  n1: number;
  n2: number;
  cauchyA: number;
  cauchyB: number;
  cauchyC: number;
}

export interface InitialRay {
  origin: [number, number, number];
  direction: [number, number, number];
  wavelength: number;
  fieldAngle: number;
}
