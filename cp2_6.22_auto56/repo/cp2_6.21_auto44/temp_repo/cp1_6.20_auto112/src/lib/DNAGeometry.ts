import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export interface BasePairData {
  id: string;
  type: 'AT' | 'GC';
  index: number;
  position: 'major' | 'minor';
  center: [number, number, number];
  rotation: [number, number, number];
  pointA: [number, number, number];
  pointB: [number, number, number];
}

export interface DNAGeometryResult {
  backbone1Points: THREE.Vector3[];
  backbone2Points: THREE.Vector3[];
  basePairs: BasePairData[];
  totalHeight: number;
}

const HELIX_RADIUS = 1.0;
const BASE_PAIRS_PER_TURN = 10;
const ANGLE_PER_PAIR = (2 * Math.PI) / BASE_PAIRS_PER_TURN;
const MAJOR_GROOVE_OFFSET = ANGLE_PER_PAIR * 0.6;

function generateBasePairType(index: number): 'AT' | 'GC' {
  return index % 3 === 0 ? 'GC' : 'AT';
}

function determineGroovePosition(angle: number): 'major' | 'minor' {
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return normalized < Math.PI ? 'major' : 'minor';
}

export function generateDNAGeometry(
  turns: number,
  basePairSpacing: number,
  backboneWidth: number,
): DNAGeometryResult {
  void backboneWidth;
  const totalBasePairs = Math.round(turns * BASE_PAIRS_PER_TURN);
  const totalHeight = totalBasePairs * basePairSpacing;

  const backbone1Points: THREE.Vector3[] = [];
  const backbone2Points: THREE.Vector3[] = [];
  const basePairs: BasePairData[] = [];

  for (let i = 0; i <= totalBasePairs; i++) {
    const progress = i / totalBasePairs;
    const angle = i * ANGLE_PER_PAIR;
    const y = (progress - 0.5) * totalHeight;

    const x1 = HELIX_RADIUS * Math.cos(angle);
    const z1 = HELIX_RADIUS * Math.sin(angle);
    backbone1Points.push(new THREE.Vector3(x1, y, z1));

    const x2 = HELIX_RADIUS * Math.cos(angle + Math.PI);
    const z2 = HELIX_RADIUS * Math.sin(angle + Math.PI);
    backbone2Points.push(new THREE.Vector3(x2, y, z2));
  }

  for (let i = 0; i < totalBasePairs; i++) {
    const baseIndex = i + 1;
    const angle = i * ANGLE_PER_PAIR + MAJOR_GROOVE_OFFSET;
    const progress = (i + 0.5) / totalBasePairs - 0.5;
    const yPos = progress * totalHeight;

    const pointA: [number, number, number] = [
      HELIX_RADIUS * Math.cos(angle),
      yPos,
      HELIX_RADIUS * Math.sin(angle),
    ];

    const pointB: [number, number, number] = [
      HELIX_RADIUS * Math.cos(angle + Math.PI),
      yPos,
      HELIX_RADIUS * Math.sin(angle + Math.PI),
    ];

    const center: [number, number, number] = [
      (pointA[0] + pointB[0]) / 2,
      yPos,
      (pointA[2] + pointB[2]) / 2,
    ];

    const rotation: [number, number, number] = [0, -angle, Math.PI / 2];

    basePairs.push({
      id: uuidv4(),
      type: generateBasePairType(i),
      index: baseIndex,
      position: determineGroovePosition(angle),
      center,
      rotation,
      pointA,
      pointB,
    });
  }

  return { backbone1Points, backbone2Points, basePairs, totalHeight };
}

export function createBackboneTube(
  points: THREE.Vector3[],
  tubularSegments = 200,
  radiusSegments = 12,
  radius = 0.12,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radiusSegments, false);
}

export function getArrowPositions(
  points: THREE.Vector3[],
  count: number,
): Array<{ position: THREE.Vector3; direction: THREE.Vector3 }> {
  const arrows: Array<{ position: THREE.Vector3; direction: THREE.Vector3 }> = [];
  if (count <= 0 || points.length < 2) return arrows;
  const step = Math.floor(points.length / count);
  for (let i = 0; i < points.length - 1; i += step) {
    const p0 = points[i];
    const p1 = points[Math.min(i + 1, points.length - 1)];
    const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
    arrows.push({ position: p0.clone(), direction: dir });
  }
  return arrows;
}
