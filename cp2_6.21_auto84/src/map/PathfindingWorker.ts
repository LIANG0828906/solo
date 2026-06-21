import type { WorkerMessageType, WorkerResultType, HexCoord, GridConfig } from '../types';
import { hexDistance, getHexNeighbors, isInBounds, hexKey } from './GridEngine';

interface PathNode {
  coord: HexCoord;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

function findPath(
  start: HexCoord,
  end: HexCoord,
  obstacles: HexCoord[],
  gridConfig: GridConfig
): HexCoord[] {
  const obstacleSet = new Set(obstacles.map(c => hexKey(c)));

  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    coord: start,
    g: 0,
    h: hexDistance(start, end),
    f: hexDistance(start, end),
    parent: null,
  };

  openSet.push(startNode);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = hexKey(current.coord);

    if (current.coord.q === end.q && current.coord.r === end.r) {
      const path: HexCoord[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift(node.coord);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    const neighbors = getHexNeighbors(current.coord);
    for (const neighbor of neighbors) {
      const neighborKey = hexKey(neighbor);

      if (!isInBounds(neighbor, gridConfig)) continue;
      if (closedSet.has(neighborKey)) continue;
      if (obstacleSet.has(neighborKey)) continue;

      const g = current.g + 1;
      const h = hexDistance(neighbor, end);
      const f = g + h;

      const existingNode = openSet.find(n => hexKey(n.coord) === neighborKey);
      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          coord: neighbor,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  return [];
}

function getReachable(
  start: HexCoord,
  range: number,
  obstacles: HexCoord[],
  gridConfig: GridConfig
): HexCoord[] {
  const obstacleSet = new Set(obstacles.map(c => hexKey(c)));
  const visited = new Set<string>();
  const reachable: HexCoord[] = [];

  interface BFSNode {
    coord: HexCoord;
    distance: number;
  }

  const queue: BFSNode[] = [{ coord: start, distance: 0 }];
  visited.add(hexKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.distance > 0) {
      reachable.push(current.coord);
    }

    if (current.distance < range) {
      const neighbors = getHexNeighbors(current.coord);
      for (const neighbor of neighbors) {
        const neighborKey = hexKey(neighbor);
        if (!isInBounds(neighbor, gridConfig)) continue;
        if (visited.has(neighborKey)) continue;
        if (obstacleSet.has(neighborKey)) continue;

        visited.add(neighborKey);
        queue.push({ coord: neighbor, distance: current.distance + 1 });
      }
    }
  }

  return reachable;
}

self.onmessage = (e: MessageEvent<WorkerMessageType>) => {
  const message = e.data;

  switch (message.type) {
    case 'findPath': {
      const path = findPath(message.start, message.end, message.obstacles, message.gridConfig);
      const result: WorkerResultType = { type: 'path_result', path };
      self.postMessage(result);
      break;
    }
    case 'getReachable': {
      const cells = getReachable(message.start, message.range, message.obstacles, message.gridConfig);
      const result: WorkerResultType = { type: 'reachable_result', cells };
      self.postMessage(result);
      break;
    }
  }
};

export {};
