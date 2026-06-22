export interface RootNode {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  length: number;
  depth: number;
  generation: number;
  isTip: boolean;
  growthRate: number;
  age: number;
  parentId: string | null;
}

export interface GrowthParams {
  humidity: number;
  nutrition: number;
  branchProbability: number;
  growthSpeed: number;
}

const MAX_NODES = 800;
const BRANCH_LENGTH_DECAY = 0.8;
const BROWNIAN_STRENGTH = 0.03;
const GROWTH_BASE_RATE = 0.8;
const MAX_GENERATION = 5;
const BOUNDARY_BOTTOM = -10;
const BOUNDARY_RADIUS = 8;

let nodeIdCounter = 0;

function generateId(): string {
  return `root_${++nodeIdCounter}`;
}

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, -1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function addVectors(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scaleVector(v: [number, number, number], s: number): [number, number, number] {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function createInitialRoots(): RootNode[] {
  nodeIdCounter = 0;
  const initialLength = 5;
  const segments = 8;
  const segmentLength = initialLength / segments;
  const nodes: RootNode[] = [];

  for (let i = 0; i < segments; i++) {
    const y = -i * segmentLength;
    nodes.push({
      id: generateId(),
      position: [0, y, 0],
      direction: [0, -1, 0],
      length: segmentLength,
      depth: -y,
      generation: 0,
      isTip: i === segments - 1,
      growthRate: GROWTH_BASE_RATE,
      age: i * 0.1,
      parentId: i === 0 ? null : nodes[i - 1].id,
    });
  }

  return nodes;
}

function applyBrownian(direction: [number, number, number], strength: number): [number, number, number] {
  const noise: [number, number, number] = [
    (Math.random() - 0.5) * 2 * strength,
    (Math.random() - 0.5) * 2 * strength * 0.5,
    (Math.random() - 0.5) * 2 * strength,
  ];
  const result = addVectors(direction, noise);
  return normalize(result);
}

function createBranch(parent: RootNode, params: GrowthParams): RootNode | null {
  if (parent.generation >= MAX_GENERATION) return null;
  if (Math.random() > params.branchProbability * (1 - parent.generation * 0.15)) return null;

  const branchLength = parent.length * BRANCH_LENGTH_DECAY * (0.7 + Math.random() * 0.6);
  const angle = randomRange(30, 70) * (Math.PI / 180);
  const rotation = Math.random() * Math.PI * 2;

  const baseDir = parent.direction;
  const perpendicular1 = normalize([baseDir[2], 0, -baseDir[0]]);
  if (perpendicular1[0] === 0 && perpendicular1[2] === 0) {
    perpendicular1[0] = 1;
    perpendicular1[2] = 0;
  }
  const perpendicular2: [number, number, number] = [
    baseDir[1] * perpendicular1[2] - baseDir[2] * perpendicular1[1],
    baseDir[2] * perpendicular1[0] - baseDir[0] * perpendicular1[2],
    baseDir[0] * perpendicular1[1] - baseDir[1] * perpendicular1[0],
  ];

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  const branchDir: [number, number, number] = [
    baseDir[0] * cosA + perpendicular1[0] * sinA * cosR + perpendicular2[0] * sinA * sinR,
    baseDir[1] * cosA + perpendicular1[1] * sinA * cosR + perpendicular2[1] * sinA * sinR,
    baseDir[2] * cosA + perpendicular1[2] * sinA * cosR + perpendicular2[2] * sinA * sinR,
  ];

  const normalizedDir = normalize(branchDir);
  const newPos = addVectors(parent.position, scaleVector(normalizedDir, branchLength * 0.3));

  if (newPos[1] < BOUNDARY_BOTTOM) return null;
  const horizDist = Math.sqrt(newPos[0] * newPos[0] + newPos[2] * newPos[2]);
  if (horizDist > BOUNDARY_RADIUS) return null;

  return {
    id: generateId(),
    position: newPos,
    direction: normalizedDir,
    length: branchLength,
    depth: -newPos[1],
    generation: parent.generation + 1,
    isTip: true,
    growthRate: GROWTH_BASE_RATE * params.nutrition * (1 - parent.generation * 0.1),
    age: 0,
    parentId: parent.id,
  };
}

export function updateRootGrowth(
  nodes: RootNode[],
  params: GrowthParams,
  deltaTime: number,
  humidityField: number | null = null
): { nodes: RootNode[]; newBranchCount: number; reachedBottom: boolean } {
  if (nodes.length === 0) {
    return { nodes: createInitialRoots(), newBranchCount: 0, reachedBottom: false };
  }

  const speedFactor = params.growthSpeed;
  const humidityFactor = humidityField !== null ? 0.5 + humidityField * 0.5 : params.humidity / 100;
  const effectiveGrowthRate = GROWTH_BASE_RATE * humidityFactor * params.nutrition * speedFactor;

  const updatedNodes: RootNode[] = [];
  const newBranches: RootNode[] = [];
  let reachedBottom = false;
  let newBranchCount = 0;

  for (const node of nodes) {
    let updatedNode = { ...node };
    updatedNode.age += deltaTime;

    if (node.isTip && node.position[1] > BOUNDARY_BOTTOM) {
      const growthAmount = effectiveGrowthRate * deltaTime * (1 - node.generation * 0.15);
      
      let newDir = applyBrownian(node.direction, BROWNIAN_STRENGTH * speedFactor);
      
      if (node.generation === 0) {
        newDir = normalize([
          newDir[0] * 0.3,
          newDir[1] - 0.5,
          newDir[2] * 0.3,
        ]);
      }

      const newPos = addVectors(node.position, scaleVector(newDir, growthAmount));

      if (newPos[1] <= BOUNDARY_BOTTOM) {
        newPos[1] = BOUNDARY_BOTTOM;
        reachedBottom = true;
        updatedNode.isTip = false;
      }

      const horizDist = Math.sqrt(newPos[0] * newPos[0] + newPos[2] * newPos[2]);
      if (horizDist > BOUNDARY_RADIUS) {
        const scale = BOUNDARY_RADIUS / horizDist;
        newPos[0] *= scale;
        newPos[2] *= scale;
        updatedNode.isTip = false;
      }

      updatedNode.position = newPos;
      updatedNode.direction = newDir;
      updatedNode.length += growthAmount;
      updatedNode.depth = -newPos[1];

      if (updatedNode.isTip && nodes.length + newBranches.length < MAX_NODES) {
        const branchChance = params.branchProbability * deltaTime * 2 * humidityFactor;
        if (Math.random() < branchChance && node.generation < MAX_GENERATION) {
          const branch = createBranch(updatedNode, params);
          if (branch) {
            newBranches.push(branch);
            newBranchCount++;
          }
        }
      }
    }

    updatedNodes.push(updatedNode);
  }

  return {
    nodes: [...updatedNodes, ...newBranches].slice(0, MAX_NODES),
    newBranchCount,
    reachedBottom,
  };
}

export function getTotalRootLength(nodes: RootNode[]): number {
  return nodes.reduce((sum, node) => sum + node.length, 0);
}

export function getBranchCount(nodes: RootNode[]): number {
  return nodes.filter(n => n.generation > 0).length;
}

export function getMaxDepth(nodes: RootNode[]): number {
  if (nodes.length === 0) return 0;
  return Math.max(...nodes.map(n => n.depth));
}

export function getWaterAbsorptionRate(nodes: RootNode[], params: GrowthParams): number {
  const tipNodes = nodes.filter(n => n.isTip);
  const absorption = tipNodes.length * 0.1 * params.humidity * 0.01 * params.nutrition;
  return absorption;
}
