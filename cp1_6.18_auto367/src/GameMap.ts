import { v4 as uuidv4 } from 'uuid';

export interface StarNode {
  id: string;
  x: number;
  y: number;
  type: 'normal' | 'start' | 'end';
  radius: number;
  hasCrystal: boolean;
  isAsteroid: boolean;
  starMass: number;
  pulsePhase: number;
  connections: string[];
}

export interface PathSegment {
  fromId: string;
  toId: string;
  distance: number;
  shieldCost: number;
  hasAsteroid: boolean;
}

export interface FireworkParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MIN_DISTANCE = 80;
const MIN_NODES = 15;
const MAX_NODES = 25;
const STAR_RADIUS = 16;
const CONNECTION_RADIUS = 200;
const PIXELS_PER_LIGHTYEAR = 20;
const DAYS_PER_LIGHTYEAR = 12;

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateStarMap(): {
  nodes: StarNode[];
  startNodeId: string;
  endNodeId: string;
  adjacencyMatrix: Record<string, Record<string, number>>;
  shortestPathDistance: number;
} {
  const cellSize = MIN_DISTANCE / Math.sqrt(2);
  const gridCols = Math.ceil(CANVAS_WIDTH / cellSize);
  const gridRows = Math.ceil(CANVAS_HEIGHT / cellSize);
  const grid: (string | null)[][] = Array(gridRows).fill(null).map(() => Array(gridCols).fill(null));
  const nodesMap: Record<string, StarNode> = {};
  const nodes: StarNode[] = [];
  const activeList: StarNode[] = [];

  const targetCount = Math.floor(randomRange(MIN_NODES, MAX_NODES + 1));

  function getGridCell(x: number, y: number): { col: number; row: number } {
    return {
      col: Math.floor(x / cellSize),
      row: Math.floor(y / cellSize),
    };
  }

  function isValidPoint(x: number, y: number): boolean {
    if (x < STAR_RADIUS + 10 || x > CANVAS_WIDTH - STAR_RADIUS - 10) return false;
    if (y < STAR_RADIUS + 10 || y > CANVAS_HEIGHT - STAR_RADIUS - 10) return false;
    const { col, row } = getGridCell(x, y);
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
          const existingId = grid[nr][nc];
          if (existingId && nodesMap[existingId]) {
            const existing = nodesMap[existingId];
            if (distance(x, y, existing.x, existing.y) < MIN_DISTANCE) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  function addNode(x: number, y: number, type: 'normal' | 'start' | 'end' = 'normal'): StarNode {
    const node: StarNode = {
      id: uuidv4(),
      x,
      y,
      type,
      radius: STAR_RADIUS,
      hasCrystal: type === 'normal' && Math.random() < 0.25,
      isAsteroid: type === 'normal' && Math.random() < 0.15,
      starMass: type === 'normal' ? randomRange(1.0, 2.0) : 1.0,
      pulsePhase: Math.random() * Math.PI * 2,
      connections: [],
    };
    nodes.push(node);
    nodesMap[node.id] = node;
    activeList.push(node);
    const { col, row } = getGridCell(x, y);
    grid[row][col] = node.id;
    return node;
  }

  const firstX = randomRange(100, CANVAS_WIDTH - 100);
  const firstY = randomRange(100, CANVAS_HEIGHT - 100);
  addNode(firstX, firstY);

  let attempts = 0;
  const maxAttempts = 500;

  while (nodes.length < targetCount && activeList.length > 0 && attempts < maxAttempts) {
    attempts++;
    const randomIndex = Math.floor(Math.random() * activeList.length);
    const anchor = activeList[randomIndex];
    let found = false;

    for (let k = 0; k < 30; k++) {
      const angle = Math.random() * Math.PI * 2;
      const r = randomRange(MIN_DISTANCE, MIN_DISTANCE * 2);
      const nx = anchor.x + Math.cos(angle) * r;
      const ny = anchor.y + Math.sin(angle) * r;
      if (isValidPoint(nx, ny)) {
        addNode(nx, ny);
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(randomIndex, 1);
    }
  }

  let startNode: StarNode | null = null;
  let endNode: StarNode | null = null;
  let minStartDist = Infinity;
  let minEndDist = Infinity;

  for (const node of nodes) {
    const dStart = distance(node.x, node.y, 40, CANVAS_HEIGHT / 2);
    const dEnd = distance(node.x, node.y, CANVAS_WIDTH - 40, CANVAS_HEIGHT / 2);
    if (dStart < minStartDist) {
      minStartDist = dStart;
      startNode = node;
    }
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      endNode = node;
    }
  }

  if (!startNode) {
    startNode = addNode(60, CANVAS_HEIGHT / 2, 'start');
  } else {
    startNode.type = 'start';
    startNode.x = 80;
    startNode.hasCrystal = false;
    startNode.isAsteroid = false;
  }

  if (!endNode || endNode.id === startNode.id) {
    endNode = addNode(CANVAS_WIDTH - 80, CANVAS_HEIGHT / 2, 'end');
  } else {
    endNode.type = 'end';
    endNode.x = CANVAS_WIDTH - 80;
    endNode.hasCrystal = false;
    endNode.isAsteroid = false;
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = distance(a.x, a.y, b.x, b.y);
      if (dist <= CONNECTION_RADIUS) {
        if (!a.connections.includes(b.id)) a.connections.push(b.id);
        if (!b.connections.includes(a.id)) b.connections.push(a.id);
      }
    }
  }

  ensureConnectivity(nodes, startNode, endNode);

  const adjacencyMatrix: Record<string, Record<string, number>> = {};
  for (const node of nodes) {
    adjacencyMatrix[node.id] = {};
    for (const connId of node.connections) {
      const conn = nodesMap[connId];
      if (conn) {
        adjacencyMatrix[node.id][connId] = distance(node.x, node.y, conn.x, conn.y);
      }
    }
  }

  const shortestPath = findShortestPathAStar(nodes, startNode.id, endNode.id, adjacencyMatrix);
  const shortestPathDistance = calculatePathTotalDistance(shortestPath, adjacencyMatrix);

  return {
    nodes,
    startNodeId: startNode.id,
    endNodeId: endNode.id,
    adjacencyMatrix,
    shortestPathDistance,
  };
}

function ensureConnectivity(nodes: StarNode[], startNode: StarNode, endNode: StarNode): void {
  const visited = new Set<string>();
  const queue = [startNode.id];
  visited.add(startNode.id);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = nodes.find(n => n.id === currentId);
    if (!current) continue;
    for (const connId of current.connections) {
      if (!visited.has(connId)) {
        visited.add(connId);
        queue.push(connId);
      }
    }
  }

  if (visited.has(endNode.id)) return;

  const unvisited = nodes.filter(n => !visited.has(n.id));
  for (const isolated of unvisited) {
    let nearest: StarNode | null = null;
    let minDist = Infinity;
    for (const connected of nodes.filter(n => visited.has(n.id))) {
      const d = distance(isolated.x, isolated.y, connected.x, connected.y);
      if (d < minDist) {
        minDist = d;
        nearest = connected;
      }
    }
    if (nearest && minDist < CONNECTION_RADIUS * 1.5) {
      if (!isolated.connections.includes(nearest.id)) isolated.connections.push(nearest.id);
      if (!nearest.connections.includes(isolated.id)) nearest.connections.push(isolated.id);
      visited.add(isolated.id);
    }
  }
}

interface AStarState {
  id: string;
  g: number;
  f: number;
  parent: string | null;
}

export function findShortestPathAStar(
  nodes: StarNode[],
  startId: string,
  endId: string,
  adjacencyMatrix: Record<string, Record<string, number>>,
): string[] {
  const nodesMap: Record<string, StarNode> = {};
  for (const n of nodes) nodesMap[n.id] = n;

  const start = nodesMap[startId];
  const end = nodesMap[endId];
  if (!start || !end) return [];

  const heuristic = (a: StarNode, b: StarNode): number => distance(a.x, a.y, b.x, b.y);

  const allStates: Record<string, AStarState> = {};
  const closed = new Set<string>();
  const openList: AStarState[] = [];

  const startState: AStarState = { id: startId, g: 0, f: heuristic(start, end), parent: null };
  allStates[startId] = startState;
  openList.push(startState);

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;

    if (current.id === endId) {
      const path: string[] = [];
      let currId: string | null = current.id;
      while (currId !== null) {
        path.unshift(currId);
        const st = allStates[currId];
        currId = st ? st.parent : null;
      }
      return path;
    }

    closed.add(current.id);
    const currentNode = nodesMap[current.id];
    if (!currentNode) continue;

    for (const neighborId of currentNode.connections) {
      if (closed.has(neighborId)) continue;
      const edgeCost = adjacencyMatrix[current.id]?.[neighborId] ?? 0;
      const tentativeG = current.g + edgeCost;

      const existing = allStates[neighborId];
      if (!existing || tentativeG < existing.g) {
        const neighborNode = nodesMap[neighborId];
        const newState: AStarState = {
          id: neighborId,
          g: tentativeG,
          f: tentativeG + (neighborNode ? heuristic(neighborNode, end) : 0),
          parent: current.id,
        };
        allStates[neighborId] = newState;
        const idx = openList.findIndex(s => s.id === neighborId);
        if (idx >= 0) {
          openList[idx] = newState;
        } else {
          openList.push(newState);
        }
      }
    }
  }

  return [];
}

function calculatePathTotalDistance(
  path: string[],
  adjacencyMatrix: Record<string, Record<string, number>>,
): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += adjacencyMatrix[path[i]]?.[path[i + 1]] ?? 0;
  }
  return total;
}

export function calculatePathSegments(
  path: string[],
  nodes: StarNode[],
  adjacencyMatrix: Record<string, Record<string, number>>,
): PathSegment[] {
  const nodesMap: Record<string, StarNode> = {};
  for (const n of nodes) nodesMap[n.id] = n;

  const segments: PathSegment[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const fromId = path[i];
    const toId = path[i + 1];
    const dist = adjacencyMatrix[fromId]?.[toId] ?? 0;
    const fromNode = nodesMap[fromId];
    const toNode = nodesMap[toId];
    const hasAsteroid = (fromNode?.isAsteroid || toNode?.isAsteroid) && !!(fromNode && toNode);
    const massBonus = fromNode ? (fromNode.starMass - 1.0) : 0;

    let shieldCost = dist * 0.05;
    if (hasAsteroid) shieldCost += dist * 0.15;
    shieldCost -= dist * 0.08 * massBonus;
    if (shieldCost < 0) shieldCost = 0;

    segments.push({ fromId, toId, distance: dist, shieldCost, hasAsteroid });
  }
  return segments;
}

export function calculateShieldFromSegments(
  segments: PathSegment[],
  path: string[],
  nodes: StarNode[],
): { totalShieldCost: number; remainingShield: number; totalDistance: number } {
  const nodesMap: Record<string, StarNode> = {};
  for (const n of nodes) nodesMap[n.id] = n;

  let totalShieldCost = 0;
  let totalDistance = 0;
  for (const seg of segments) {
    totalShieldCost += seg.shieldCost;
    totalDistance += seg.distance;
  }

  let crystalBonus = 0;
  for (const id of path) {
    if (nodesMap[id]?.hasCrystal) crystalBonus += 15;
  }

  totalShieldCost = Math.max(0, totalShieldCost - crystalBonus);
  const remainingShield = Math.max(0, Math.min(100, 100 - totalShieldCost));

  return { totalShieldCost, remainingShield, totalDistance };
}

export function pixelsToLightYears(pixels: number): number {
  return pixels / PIXELS_PER_LIGHTYEAR;
}

export function lightYearsToDays(lightYears: number): number {
  return Math.round(lightYears * DAYS_PER_LIGHTYEAR);
}

export function getShieldColor(percent: number): string {
  if (percent >= 70) return '#4CAF50';
  if (percent >= 40) return '#FF9800';
  return '#F44336';
}

export function createFireworkParticles(centerX: number, centerY: number): FireworkParticle[] {
  const particles: FireworkParticle[] = [];
  const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#66FCF1', '#FFD700'];
  for (let i = 0; i < 60; i++) {
    const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.3;
    const speed = randomRange(60, 180);
    particles.push({
      id: uuidv4(),
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 2000,
      maxLife: 2000,
      size: randomRange(2, 5),
    });
  }
  return particles;
}

export function getCanvasSize(): { width: number; height: number } {
  return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
}
