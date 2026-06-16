export interface StarTemplate {
  name: string;
  nameEn: string;
  position: [number, number, number];
  magnitude?: number;
  distance?: number;
  spectralType?: string;
}

export interface ConstellationTemplate {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  accentColor: string;
  bestMonth: string;
  latitudeRange: string;
  mythology: string;
  stars: StarTemplate[];
  connections: [number, number][];
}

export interface DrawnStar {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  halo?: THREE.Mesh;
}

export interface ConnectionLine {
  id: string;
  from: string;
  to: string;
  mesh: THREE.Line | THREE.Mesh;
}

export interface MatchedConstellation {
  template: ConstellationTemplate;
  stars: DrawnStar[];
  connections: ConnectionLine[];
  labelElement?: HTMLElement;
  group: THREE.Group;
  pulsePhase: number;
}
