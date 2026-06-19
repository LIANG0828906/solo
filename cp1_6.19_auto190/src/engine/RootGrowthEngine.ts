import { RootNode, SimulationParams } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const BOUNDARY = 4;
const MIN_RADIUS = 0.08;
const MAX_RADIUS = 0.3;

const normalize = (v: [number, number, number]): [number, number, number] => {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, -1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
};

const add = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

const scale = (v: [number, number, number], s: number): [number, number, number] => [
  v[0] * s,
  v[1] * s,
  v[2] * s,
];

const cross = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const rotateAroundAxis = (
  v: [number, number, number],
  axis: [number, number, number],
  angle: number
): [number, number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dot = v[0] * axis[0] + v[1] * axis[1] + v[2] * axis[2];
  const crossProduct = cross(v, axis);
  return [
    v[0] * cos + crossProduct[0] * sin + axis[0] * dot * (1 - cos),
    v[1] * cos + crossProduct[1] * sin + axis[1] * dot * (1 - cos),
    v[2] * cos + crossProduct[2] * sin + axis[2] * dot * (1 - cos),
  ];
};

export const getGrowthSpeed = (lightIntensity: number): number => {
  const minSpeed = 0.05;
  const maxSpeed = 0.15;
  return minSpeed + (maxSpeed - minSpeed) * (lightIntensity / 100);
};

export const getBranchingProbability = (waterContent: number, order: number): number => {
  const baseProb = 0.02 + (waterContent / 100) * 0.04;
  const orderFactor = Math.pow(0.65, order);
  return baseProb * orderFactor;
};

const getRandomPerpendicular = (dir: [number, number, number]): [number, number, number] => {
  let perp: [number, number, number];
  if (Math.abs(dir[0]) < Math.abs(dir[1])) {
    perp = [1, 0, 0];
  } else {
    perp = [0, 1, 0];
  }
  perp = normalize(cross(dir, perp));
  const angle = Math.random() * Math.PI * 2;
  return normalize(rotateAroundAxis(perp, dir, angle));
};

export const isInBounds = (pos: [number, number, number]): boolean => {
  return (
    pos[0] > -BOUNDARY + 0.1 &&
    pos[0] < BOUNDARY - 0.1 &&
    pos[1] > -BOUNDARY + 0.1 &&
    pos[1] < BOUNDARY - 0.1 &&
    pos[2] > -BOUNDARY + 0.1 &&
    pos[2] < BOUNDARY - 0.1
  );
};

export interface GrowthResult {
  updatedNodes: RootNode[];
  newNodes: RootNode[];
}

export const stepRootGrowth = (
  rootNodes: RootNode[],
  params: SimulationParams,
  timeStep: number,
  getNutrientAtPos: (pos: [number, number, number]) => number
): GrowthResult => {
  const speed = getGrowthSpeed(params.lightIntensity);
  const newNodes: RootNode[] = [];
  const tipUpdates: Map<string, Partial<RootNode>> = new Map();

  const tipNodes = rootNodes.filter((n) => n.isTip);

  for (const tipNode of tipNodes) {
    let direction = [...tipNode.direction] as [number, number, number];

    const nutrientConc = getNutrientAtPos(tipNode.position);

    if (nutrientConc < 0.05) {
      const deflectionAngle = (Math.random() - 0.5) * (Math.PI / 3);
      const perp = getRandomPerpendicular(direction);
      direction = normalize(
        add(scale(direction, Math.cos(deflectionAngle)), scale(perp, Math.sin(deflectionAngle)))
      );
    }

    const gravityFactor = 0.25;
    direction = normalize([
      direction[0],
      direction[1] - gravityFactor,
      direction[2],
    ]);

    const newPos = add(tipNode.position, scale(direction, speed));

    if (!isInBounds(newPos)) {
      tipUpdates.set(tipNode.id, { isTip: false });
      continue;
    }

    const newDepth = tipNode.depth + speed;
    const newRadius = Math.max(MIN_RADIUS, MAX_RADIUS * (1 - newDepth / 10));

    const newTipNode: RootNode = {
      id: generateId(),
      position: [...newPos] as [number, number, number],
      radius: newRadius,
      depth: newDepth,
      isTip: true,
      direction,
      parentId: tipNode.id,
      order: tipNode.order,
      age: timeStep,
    };

    newNodes.push(newTipNode);
    tipUpdates.set(tipNode.id, { isTip: false });

    const branchProb = getBranchingProbability(params.waterContent, tipNode.order);
    const shouldBranch =
      Math.random() < branchProb && tipNode.order < 3 && newDepth > 0.5;

    if (shouldBranch) {
      const branchCount = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < branchCount; i++) {
        const angleDeg = 30 + Math.random() * 30;
        const angleRad = (angleDeg * Math.PI) / 180;
        const perp = getRandomPerpendicular(direction);
        const branchDir = normalize(
          add(scale(direction, Math.cos(angleRad)), scale(perp, Math.sin(angleRad)))
        );
        const branchRadius = Math.max(MIN_RADIUS, newRadius * 0.7);

        const branchNode: RootNode = {
          id: generateId(),
          position: [...newPos] as [number, number, number],
          radius: branchRadius,
          depth: newDepth,
          isTip: true,
          direction: branchDir,
          parentId: tipNode.id,
          order: tipNode.order + 1,
          age: timeStep,
        };
        newNodes.push(branchNode);
      }
    }
  }

  const updatedNodes = rootNodes.map((node) => {
    const update = tipUpdates.get(node.id);
    if (update) {
      return { ...node, ...update };
    }
    return node;
  });

  return { updatedNodes, newNodes };
};
