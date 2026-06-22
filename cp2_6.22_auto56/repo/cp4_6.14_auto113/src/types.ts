import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

export interface FragmentData {
  id: string;
  mesh: THREE.Group;
  boundingBox: THREE.Box3;
  edgeVertices: THREE.Vector3[];
  averageNormal: THREE.Vector3;
  vertexCount: number;
  hasTexture: boolean;
  textureData: ImageData | null;
  highlightWire: THREE.LineSegments | null;
  groupId: number | null;
}

export interface MatchPair {
  fragmentA: string;
  fragmentB: string;
  distance: number;
  normalAngle: number;
  score: number;
  textureScore: number;
  line: THREE.Line | null;
}

export class AppEvents extends EventEmitter {
  static FRAGMENT_SELECTED = 'fragment:selected';
  static FRAGMENT_TRANSFORMED = 'fragment:transformed';
  static FRAGMENT_ADDED = 'fragment:added';
  static MATCH_UPDATED = 'match:updated';
  static SPLIT_GROUP = 'group:split';
}

export const globalEvents = new AppEvents();
