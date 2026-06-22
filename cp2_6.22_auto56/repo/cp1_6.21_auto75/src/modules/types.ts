import * as THREE from 'three';

export interface CityBlock {
  id: string;
  x: number;
  z: number;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  buildingHeight: number;
  density: number;
  avgSpeed: number;
  pedestrianCount: number;
}

export interface RoadSegment {
  id: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  direction: 'ns' | 'ew';
  lanes: number;
}

export interface TrafficParticle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  currentRoad: string;
  trail: { position: THREE.Vector3; timestamp: number }[];
  turnTimer: number;
}

export interface HeatmapPoint {
  x: number;
  z: number;
  density: number;
  color: THREE.Color;
}

export interface CityData {
  blocks: CityBlock[];
  roads: RoadSegment[];
  gridWidth: number;
  gridDepth: number;
  blockSize: number;
  streetWidth: number;
}

export interface BlockInfoPanel {
  blockId: string;
  pedestrianCount: number;
  avgSpeed: number;
  position: { x: number; z: number };
}
