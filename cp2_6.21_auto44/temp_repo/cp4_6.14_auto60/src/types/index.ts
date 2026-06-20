export type Vec3 = [number, number, number];

export interface Road {
  id: string;
  name: string;
  start: Vec3;
  end: Vec3;
  baseFlow: number;
  peakHours: number[];
}

export interface Intersection {
  id: string;
  position: Vec3;
  connectedRoads: string[];
}

export interface RoadTraffic {
  roadId: string;
  flow: number;
  width: number;
  color: string;
}

export interface TrafficSnapshot {
  timestamp: number;
  averageFlow: number;
  roads: RoadTraffic[];
}

export interface RoadNetworkData {
  roads: Road[];
  intersections: Intersection[];
}

export type RGB = { r: number; g: number; b: number };
