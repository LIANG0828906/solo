import * as THREE from 'three';
import type { Intersection, RoadSegment, RoadNetwork } from '@/types';

export function createDefaultRoadNetwork(): RoadNetwork {
  const gridSize = 3;
  const spacing = 60;
  const offset = ((gridSize - 1) * spacing) / 2;

  const intersections: Intersection[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const id = `int_${row}_${col}`;
      intersections.push({
        id,
        x: col * spacing - offset,
        z: row * spacing - offset,
        signalState: (row + col) % 2 === 0 ? 'green' : 'red',
        signalTimer: (row + col) % 2 === 0 ? 20 : 15,
      });
    }
  }

  const segments: RoadSegment[] = [];
  let segmentId = 0;

  const getIntersectionId = (row: number, col: number): string => {
    return `int_${row}_${col}`;
  };

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize - 1; col++) {
      const isMainRow = row === Math.floor(gridSize / 2);
      segments.push({
        id: `seg_h_${segmentId++}`,
        from: getIntersectionId(row, col),
        to: getIntersectionId(row, col + 1),
        type: isMainRow ? 'main' : 'branch',
        lanes: isMainRow ? 4 : 2,
        speedLimit: isMainRow ? 60 : 40,
        allowUTurn: false,
      });
    }
  }

  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row < gridSize - 1; row++) {
      const isMainCol = col === Math.floor(gridSize / 2);
      segments.push({
        id: `seg_v_${segmentId++}`,
        from: getIntersectionId(row, col),
        to: getIntersectionId(row + 1, col),
        type: isMainCol ? 'main' : 'branch',
        lanes: isMainCol ? 4 : 2,
        speedLimit: isMainCol ? 60 : 40,
        allowUTurn: false,
      });
    }
  }

  return {
    intersections,
    segments,
    signalCycle: { red: 15, green: 20 },
  };
}

export function getIntersectionPosition(intersection: Intersection): { x: number; y: number; z: number } {
  return { x: intersection.x, y: 0, z: intersection.z };
}

export function getRoadColor(type: 'main' | 'branch'): string {
  return type === 'main' ? '#ff8c00' : '#888888';
}

export function getRoadWidth(type: 'main' | 'branch', lanes: number): number {
  const laneWidth = 3.5;
  return type === 'main' ? lanes * laneWidth + 2 : lanes * laneWidth;
}

export function buildRoadGeometry(
  segments: RoadSegment[],
  intersections: Intersection[]
) {
  const intersectionMap = new Map<string, Intersection>();
  intersections.forEach((int) => intersectionMap.set(int.id, int));

  const mainRoadMeshes: Array<{
    geometry: THREE.BufferGeometry;
    material: THREE.MeshBasicMaterial;
  }> = [];

  const branchRoadLines: Array<{
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
  }> = [];

  const intersectionPoints: Array<{ position: THREE.Vector3 }> = [];

  segments.forEach((segment) => {
    const fromInt = intersectionMap.get(segment.from);
    const toInt = intersectionMap.get(segment.to);
    if (!fromInt || !toInt) return;

    const start = new THREE.Vector3(fromInt.x, 0.01, fromInt.z);
    const end = new THREE.Vector3(toInt.x, 0.01, toInt.z);

    if (segment.type === 'main') {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      direction.normalize();

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      const width = getRoadWidth('main', segment.lanes);
      const geometry = new THREE.PlaneGeometry(length, width);
      geometry.rotateX(-Math.PI / 2);

      const material = new THREE.MeshBasicMaterial({
        color: getRoadColor('main'),
        side: THREE.DoubleSide,
      });

      const meshObj = new THREE.Mesh(geometry, material);
      meshObj.position.copy(mid);
      const angle = Math.atan2(direction.x, direction.z);
      meshObj.rotation.y = angle;

      const finalGeometry = meshObj.geometry.clone();
      finalGeometry.translate(meshObj.position.x, meshObj.position.y, meshObj.position.z);
      finalGeometry.rotateY(angle);

      mainRoadMeshes.push({ geometry: finalGeometry, material });
    } else {
      const points = [start, end];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: getRoadColor('branch'),
        linewidth: 2,
      });
      branchRoadLines.push({ geometry, material });
    }
  });

  intersections.forEach((int) => {
    intersectionPoints.push({
      position: new THREE.Vector3(int.x, 0.05, int.z),
    });
  });

  return { mainRoadMeshes, branchRoadLines, intersectionPoints };
}

export function updateSignalStates(
  intersections: Intersection[],
  deltaTime: number,
  signalCycle: { red: number; green: number }
): Intersection[] {
  return intersections.map((int) => {
    const newTimer = int.signalTimer - deltaTime;
    if (newTimer <= 0) {
      const newState = int.signalState === 'red' ? 'green' : 'red';
      const cycleDuration = newState === 'red' ? signalCycle.red : signalCycle.green;
      return {
        ...int,
        signalState: newState,
        signalTimer: cycleDuration + newTimer,
      };
    }
    return { ...int, signalTimer: newTimer };
  });
}

interface AStarNode {
  id: string;
  g: number;
  h: number;
  f: number;
  parent: string | null;
}

function heuristic(
  a: Intersection,
  b: Intersection
): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function getNeighbors(
  nodeId: string,
  network: RoadNetwork,
  congestionWeights?: Map<string, number>
): Array<{ id: string; cost: number }> {
  const neighbors: Array<{ id: string; cost: number }> = [];

  network.segments.forEach((seg) => {
    if (seg.from === nodeId) {
      const fromInt = network.intersections.find((i) => i.id === seg.from);
      const toInt = network.intersections.find((i) => i.id === seg.to);
      if (fromInt && toInt) {
        const dx = fromInt.x - toInt.x;
        const dz = fromInt.z - toInt.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const congestionWeight = congestionWeights?.get(seg.id) ?? 1;
        neighbors.push({ id: seg.to, cost: distance * congestionWeight });
      }
    }
    if (seg.to === nodeId) {
      const fromInt = network.intersections.find((i) => i.id === seg.to);
      const toInt = network.intersections.find((i) => i.id === seg.from);
      if (fromInt && toInt) {
        const dx = fromInt.x - toInt.x;
        const dz = fromInt.z - toInt.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const congestionWeight = congestionWeights?.get(seg.id) ?? 1;
        neighbors.push({ id: seg.from, cost: distance * congestionWeight });
      }
    }
  });

  return neighbors;
}

function reconstructPath(
  cameFrom: Map<string, string>,
  endId: string
): string[] {
  const path: string[] = [endId];
  let current = endId;
  while (cameFrom.has(current)) {
    const prev = cameFrom.get(current);
    if (!prev) break;
    current = prev;
    path.unshift(current);
  }
  return path;
}

export function aStarSearch(
  network: RoadNetwork,
  startId: string,
  endId: string,
  congestionWeights?: Map<string, number>
): string[] {
  if (startId === endId) return [startId];

  const startInt = network.intersections.find((i) => i.id === startId);
  const endInt = network.intersections.find((i) => i.id === endId);
  if (!startInt || !endInt) return [];

  const openSet = new Map<string, AStarNode>();
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, string>();

  const startNode: AStarNode = {
    id: startId,
    g: 0,
    h: heuristic(startInt, endInt),
    f: heuristic(startInt, endInt),
    parent: null,
  };
  openSet.set(startId, startNode);

  while (openSet.size > 0) {
    let currentId: string | null = null;
    let currentF = Infinity;
    openSet.forEach((node, nodeId) => {
      if (node.f < currentF) {
        currentF = node.f;
        currentId = nodeId;
      }
    });

    if (currentId === null) break;

    if (currentId === endId) {
      return reconstructPath(cameFrom, endId);
    }

    const current = openSet.get(currentId);
    if (!current) break;

    openSet.delete(currentId);
    closedSet.add(currentId);

    const neighbors = getNeighbors(currentId, network, congestionWeights);

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.id)) continue;

      const tentativeG = current.g + neighbor.cost;
      const neighborInt = network.intersections.find((i) => i.id === neighbor.id);
      if (!neighborInt) continue;

      const existingNode = openSet.get(neighbor.id);
      if (!existingNode || tentativeG < existingNode.g) {
        cameFrom.set(neighbor.id, currentId);
        const newNode: AStarNode = {
          id: neighbor.id,
          g: tentativeG,
          h: heuristic(neighborInt, endInt),
          f: tentativeG + heuristic(neighborInt, endInt),
          parent: currentId,
        };
        openSet.set(neighbor.id, newNode);
      }
    }
  }

  return [];
}
