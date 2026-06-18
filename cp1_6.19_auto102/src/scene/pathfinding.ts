import * as THREE from 'three';
import { Obstacle } from '../store/sceneStore';

interface GridNode {
  x: number;
  z: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export function findPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  obstacles: Obstacle[],
  gridResolution: number = 40,
  terrainSize: number = 20
): THREE.Vector3[] {
  const halfTerrain = terrainSize / 2;
  const cellSize = terrainSize / gridResolution;

  const obstacleGrid: boolean[][] = [];
  for (let x = 0; x < gridResolution; x++) {
    obstacleGrid[x] = [];
    for (let z = 0; z < gridResolution; z++) {
      obstacleGrid[x][z] = false;
    }
  }

  for (const obstacle of obstacles) {
    const gridX = Math.floor(((obstacle.position.x + halfTerrain) / terrainSize) * gridResolution);
    const gridZ = Math.floor(((obstacle.position.z + halfTerrain) / terrainSize) * gridResolution);
    const radius = Math.max(1, Math.ceil(obstacle.radius / cellSize));

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const nx = gridX + dx;
        const nz = gridZ + dz;
        if (nx >= 0 && nx < gridResolution && nz >= 0 && nz < gridResolution) {
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= radius) {
            obstacleGrid[nx][nz] = true;
          }
        }
      }
    }
  }

  const startX = Math.max(0, Math.min(gridResolution - 1, Math.floor(((start.x + halfTerrain) / terrainSize) * gridResolution)));
  const startZ = Math.max(0, Math.min(gridResolution - 1, Math.floor(((start.z + halfTerrain) / terrainSize) * gridResolution)));
  const endX = Math.max(0, Math.min(gridResolution - 1, Math.floor(((end.x + halfTerrain) / terrainSize) * gridResolution)));
  const endZ = Math.max(0, Math.min(gridResolution - 1, Math.floor(((end.z + halfTerrain) / terrainSize) * gridResolution)));

  if (obstacleGrid[endX]?.[endZ]) {
    return [end.clone()];
  }

  const openSet: Map<string, GridNode> = new Map();
  const closedSet: Set<string> = new Set();

  const startNode: GridNode = {
    x: startX,
    z: startZ,
    g: 0,
    h: heuristic(startX, startZ, endX, endZ),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openSet.set(`${startX},${startZ}`, startNode);

  while (openSet.size > 0) {
    let current: GridNode | null = null;
    for (const node of openSet.values()) {
      if (!current || node.f < current.f) {
        current = node;
      }
    }

    if (!current) break;

    if (current.x === endX && current.z === endZ) {
      const path: THREE.Vector3[] = [];
      let node: GridNode | null = current;
      while (node) {
        const worldX = (node.x / gridResolution) * terrainSize - halfTerrain + cellSize / 2;
        const worldZ = (node.z / gridResolution) * terrainSize - halfTerrain + cellSize / 2;
        path.unshift(new THREE.Vector3(worldX, 0, worldZ));
        node = node.parent;
      }
      return simplifyPath(path);
    }

    openSet.delete(`${current.x},${current.z}`);
    closedSet.add(`${current.x},${current.z}`);

    const neighbors = getNeighbors(current.x, current.z, gridResolution);
    for (const [nx, nz, isDiagonal] of neighbors) {
      if (closedSet.has(`${nx},${nz}`)) continue;
      if (obstacleGrid[nx]?.[nz]) continue;

      let tentativeG = current.g + (isDiagonal ? 1.414 : 1);
      const existing = openSet.get(`${nx},${nz}`);

      if (!existing || tentativeG < existing.g) {
        const neighbor: GridNode = {
          x: nx,
          z: nz,
          g: tentativeG,
          h: heuristic(nx, nz, endX, endZ),
          f: 0,
          parent: current,
        };
        neighbor.f = neighbor.g + neighbor.h;
        openSet.set(`${nx},${nz}`, neighbor);
      }
    }
  }

  return [end.clone()];
}

function heuristic(x1: number, z1: number, x2: number, z2: number): number {
  const dx = Math.abs(x1 - x2);
  const dz = Math.abs(z1 - z2);
  return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz);
}

function getNeighbors(x: number, z: number, size: number): [number, number, boolean][] {
  const result: [number, number, boolean][] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      const nx = x + dx;
      const nz = z + dz;
      if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
        result.push([nx, nz, dx !== 0 && dz !== 0]);
      }
    }
  }
  return result;
}

function simplifyPath(path: THREE.Vector3[]): THREE.Vector3[] {
  if (path.length <= 2) return path;
  const simplified: THREE.Vector3[] = [path[0]];
  let lastDirection = new THREE.Vector3().subVectors(path[1], path[0]).normalize();

  for (let i = 2; i < path.length; i++) {
    const direction = new THREE.Vector3().subVectors(path[i], path[i - 1]).normalize();
    if (Math.abs(direction.dot(lastDirection)) < 0.99) {
      simplified.push(path[i - 1]);
      lastDirection = direction;
    }
  }
  simplified.push(path[path.length - 1]);
  return simplified;
}
