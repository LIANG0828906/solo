export type AtomType = 'H' | 'O' | 'C' | 'N';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Atom {
  id: string;
  type: AtomType;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  bondedTo: Set<string>;
  moleculeId: string | null;
  isSelected: boolean;
  spawnTime: number;
  isDragging: boolean;
  lastDragPosition: Vector2 | null;
}

export interface Molecule {
  id: string;
  atomIds: Set<string>;
  bonds: Bond[];
}

export interface Bond {
  atom1Id: string;
  atom2Id: string;
  type: 'single' | 'double' | 'triple';
  energy: number;
  formationTime: number;
}

export interface CollisionEvent {
  type: 'collision';
  atom1Id: string;
  atom2Id: string;
  point: Vector2;
  timestamp: number;
}

export interface BondFormedEvent {
  type: 'bond_formed';
  atom1Id: string;
  atom2Id: string;
  point: Vector2;
  energy: number;
  bondType: 'single' | 'double' | 'triple';
  timestamp: number;
}

export type PhysicsEvent = CollisionEvent | BondFormedEvent;

export interface CollisionParticle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  size: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface EnergyRipple {
  id: string;
  position: Vector2;
  maxRadius: number;
  currentRadius: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export interface BondLine {
  atom1Id: string;
  atom2Id: string;
  formationTime: number;
  bondType: 'single' | 'double' | 'triple';
}

export const ATOM_CONFIG: Record<AtomType, { radius: number; color: string; name: string }> = {
  H: { radius: 4, color: '#87CEEB', name: '氢' },
  O: { radius: 6, color: '#FF4444', name: '氧' },
  C: { radius: 7, color: '#4A4A4A', name: '碳' },
  N: { radius: 5, color: '#9B59B6', name: '氮' },
};
