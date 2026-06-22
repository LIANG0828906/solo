import { PhysicsNode, Constraint, WorldState, Vec2 } from './types';

let nodeIdCounter = 0;
let constraintIdCounter = 0;
let particleIdCounter = 0;

export const generateNodeId = (): string => `node_${++nodeIdCounter}`;
export const generateConstraintId = (): string => `constraint_${++constraintIdCounter}`;
export const generateParticleId = (): string => `particle_${++particleIdCounter}`;

export const createWorld = (gravity = 0.5, damping = 0.999, iterations = 5): WorldState => ({
  nodes: new Map(),
  constraints: new Map(),
  particles: [],
  gravity,
  damping,
  iterations,
});

export const createNode = (
  x: number,
  y: number,
  radius = 8,
  pinned = false
): PhysicsNode => {
  return {
    id: generateNodeId(),
    pos: { x, y },
    prevPos: { x, y },
    radius,
    pinned,
    createdAt: performance.now(),
  };
};

export const createConstraint = (
  nodeAId: string,
  nodeBId: string,
  restLength?: number,
  stiffness = 1,
  tearThreshold?: number
): Constraint | null => {
  if (nodeAId === nodeBId) return null;
  return {
    id: generateConstraintId(),
    nodeAId,
    nodeBId,
    restLength: restLength ?? 0,
    stiffness,
    tearThreshold,
  };
};

export const distance = (a: Vec2, b: Vec2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const spawnParticles = (
  world: WorldState,
  pos: Vec2,
  count: number,
  color: string
): void => {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    world.particles.push({
      id: generateParticleId(),
      pos: { x: pos.x, y: pos.y },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      life: 0.3,
      maxLife: 0.3,
      color,
      size: 2 + Math.random() * 3,
    });
  }
};

export const addNode = (world: WorldState, node: PhysicsNode): void => {
  world.nodes.set(node.id, node);
};

export const addConstraint = (
  world: WorldState,
  constraint: Constraint,
  nodeA: PhysicsNode,
  nodeB: PhysicsNode
): void => {
  if (constraint.restLength === 0) {
    constraint.restLength = distance(nodeA.pos, nodeB.pos);
  }
  world.constraints.set(constraint.id, constraint);
};

export const removeNode = (world: WorldState, nodeId: string): void => {
  const node = world.nodes.get(nodeId);
  if (!node) return;

  spawnParticles(world, node.pos, 12, '#d0d0d0');

  const constraintsToRemove: string[] = [];
  world.constraints.forEach((c, id) => {
    if (c.nodeAId === nodeId || c.nodeBId === nodeId) {
      constraintsToRemove.push(id);
    }
  });
  constraintsToRemove.forEach((id) => {
    const c = world.constraints.get(id);
    if (c) {
      const a = world.nodes.get(c.nodeAId);
      const b = world.nodes.get(c.nodeBId);
      if (a && b) {
        const mid = {
          x: (a.pos.x + b.pos.x) / 2,
          y: (a.pos.y + b.pos.y) / 2,
        };
        spawnParticles(world, mid, 6, '#ffffff');
      }
    }
    world.constraints.delete(id);
  });

  world.nodes.delete(nodeId);
};

export const removeConstraint = (world: WorldState, constraintId: string): void => {
  const c = world.constraints.get(constraintId);
  if (!c) return;

  const a = world.nodes.get(c.nodeAId);
  const b = world.nodes.get(c.nodeBId);
  if (a && b) {
    const mid = {
      x: (a.pos.x + b.pos.x) / 2,
      y: (a.pos.y + b.pos.y) / 2,
    };
    spawnParticles(world, mid, 8, '#ffffff');
  }

  world.constraints.delete(constraintId);
};

export const clearWorld = (world: WorldState): void => {
  world.nodes.forEach((node) => {
    spawnParticles(world, node.pos, 6, '#d0d0d0');
  });
  world.nodes.clear();
  world.constraints.clear();
};

const applyVerlet = (world: WorldState, dt: number, canvasWidth: number, canvasHeight: number): void => {
  const g = world.gravity;
  const d = world.damping;

  world.nodes.forEach((node) => {
    if (node.pinned) return;

    const vx = (node.pos.x - node.prevPos.x) * d;
    const vy = (node.pos.y - node.prevPos.y) * d;

    node.prevPos.x = node.pos.x;
    node.prevPos.y = node.pos.y;

    node.pos.x += vx;
    node.pos.y += vy + g * dt * dt;

    if (node.pos.x < node.radius) {
      node.pos.x = node.radius;
      node.prevPos.x = node.pos.x + vx * 0.5;
    }
    if (node.pos.x > canvasWidth - node.radius) {
      node.pos.x = canvasWidth - node.radius;
      node.prevPos.x = node.pos.x + vx * 0.5;
    }
    if (node.pos.y < node.radius) {
      node.pos.y = node.radius;
      node.prevPos.y = node.pos.y + vy * 0.5;
    }
    if (node.pos.y > canvasHeight - node.radius) {
      node.pos.y = canvasHeight - node.radius;
      node.prevPos.y = node.pos.y + vy * 0.5;
    }
  });
};

const satisfyConstraints = (world: WorldState): void => {
  for (let iter = 0; iter < world.iterations; iter++) {
    const constraintsToRemove: string[] = [];

    world.constraints.forEach((constraint, id) => {
      const nodeA = world.nodes.get(constraint.nodeAId);
      const nodeB = world.nodes.get(constraint.nodeBId);

      if (!nodeA || !nodeB) {
        constraintsToRemove.push(id);
        return;
      }

      const dx = nodeB.pos.x - nodeA.pos.x;
      const dy = nodeB.pos.y - nodeA.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) return;

      if (constraint.tearThreshold && dist > constraint.restLength * constraint.tearThreshold) {
        constraintsToRemove.push(id);
        const mid = {
          x: (nodeA.pos.x + nodeB.pos.x) / 2,
          y: (nodeA.pos.y + nodeB.pos.y) / 2,
        };
        spawnParticles(world, mid, 6, '#ff4444');
        return;
      }

      const diff = (dist - constraint.restLength) / dist;
      const stiffness = constraint.stiffness;

      const offsetX = dx * diff * 0.5 * stiffness;
      const offsetY = dy * diff * 0.5 * stiffness;

      if (!nodeA.pinned) {
        nodeA.pos.x += offsetX;
        nodeA.pos.y += offsetY;
      }
      if (!nodeB.pinned) {
        nodeB.pos.x -= offsetX;
        nodeB.pos.y -= offsetY;
      }
    });

    constraintsToRemove.forEach((id) => world.constraints.delete(id));

    const nodeArray = Array.from(world.nodes.values());
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        const a = nodeArray[i];
        const b = nodeArray[j];
        const ddx = b.pos.x - a.pos.x;
        const ddy = b.pos.y - a.pos.y;
        const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
        const minDist = a.radius + b.radius;

        if (ddist < minDist && ddist > 0) {
          const overlap = (minDist - ddist) / ddist / 2;
          const ox = ddx * overlap;
          const oy = ddy * overlap;

          if (!a.pinned) {
            a.pos.x -= ox;
            a.pos.y -= oy;
          }
          if (!b.pinned) {
            b.pos.x += ox;
            b.pos.y += oy;
          }
        }
      }
    }
  }
};

const updateParticles = (world: WorldState, dt: number): void => {
  world.particles = world.particles.filter((p) => {
    p.life -= dt / 1000;
    if (p.life <= 0) return false;

    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.vel.y += 0.2;
    p.vel.x *= 0.98;
    p.vel.y *= 0.98;

    return true;
  });
};

export const updatePhysics = (
  world: WorldState,
  dt: number,
  canvasWidth: number,
  canvasHeight: number
): void => {
  const substeps = 2;
  const subDt = dt / substeps;

  for (let s = 0; s < substeps; s++) {
    applyVerlet(world, subDt, canvasWidth, canvasHeight);
    satisfyConstraints(world);
  }

  updateParticles(world, dt);
};

export const findNodeAtPosition = (
  world: WorldState,
  pos: Vec2,
  threshold = 15
): PhysicsNode | null => {
  let closest: PhysicsNode | null = null;
  let closestDist = threshold;

  world.nodes.forEach((node) => {
    const d = distance(node.pos, pos);
    if (d < closestDist) {
      closestDist = d;
      closest = node;
    }
  });

  return closest;
};

export const getStretchRatio = (
  world: WorldState,
  constraint: Constraint
): number => {
  const a = world.nodes.get(constraint.nodeAId);
  const b = world.nodes.get(constraint.nodeBId);
  if (!a || !b) return 1;
  const dist = distance(a.pos, b.pos);
  return dist / constraint.restLength;
};

export const createRopePreset = (
  world: WorldState,
  centerX: number,
  startY: number,
  segmentCount = 12,
  segmentLength = 30
): string[] => {
  const nodeIds: string[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const node = createNode(
      centerX + (Math.random() - 0.5) * 2,
      startY + i * segmentLength,
      8,
      i === 0
    );
    addNode(world, node);
    nodeIds.push(node.id);
  }

  for (let i = 0; i < nodeIds.length - 1; i++) {
    const c = createConstraint(nodeIds[i], nodeIds[i + 1], segmentLength, 1, 3);
    if (c) {
      const a = world.nodes.get(c.nodeAId)!;
      const b = world.nodes.get(c.nodeBId)!;
      addConstraint(world, c, a, b);
    }
  }

  return nodeIds;
};

export const createClothPreset = (
  world: WorldState,
  centerX: number,
  startY: number,
  cols = 8,
  rows = 8,
  spacing = 30
): string[] => {
  const nodeIds: string[] = [];
  const grid: string[][] = [];
  const offsetX = centerX - (cols - 1) * spacing * 0.5;

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const node = createNode(
        offsetX + c * spacing + (Math.random() - 0.5) * 2,
        startY + r * spacing,
        7,
        r === 0
      );
      addNode(world, node);
      grid[r][c] = node.id;
      nodeIds.push(node.id);
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1) {
        const cn = createConstraint(grid[r][c], grid[r][c + 1], spacing, 0.95);
        if (cn) {
          const a = world.nodes.get(cn.nodeAId)!;
          const b = world.nodes.get(cn.nodeBId)!;
          addConstraint(world, cn, a, b);
        }
      }
      if (r < rows - 1) {
        const cn = createConstraint(grid[r][c], grid[r + 1][c], spacing, 0.95);
        if (cn) {
          const a = world.nodes.get(cn.nodeAId)!;
          const b = world.nodes.get(cn.nodeBId)!;
          addConstraint(world, cn, a, b);
        }
      }
    }
  }

  return nodeIds;
};

export const createSoftBodyPreset = (
  world: WorldState,
  centerX: number,
  centerY: number,
  radius = 80,
  nodesOnRadius = 16
): string[] => {
  const nodeIds: string[] = [];
  const radiusIds: string[] = [];

  const centerNode = createNode(centerX, centerY, 10, false);
  addNode(world, centerNode);
  nodeIds.push(centerNode.id);

  for (let i = 0; i < nodesOnRadius; i++) {
    const angle = (Math.PI * 2 * i) / nodesOnRadius;
    const node = createNode(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
      7,
      false
    );
    addNode(world, node);
    radiusIds.push(node.id);
    nodeIds.push(node.id);
  }

  for (let i = 0; i < radiusIds.length; i++) {
    const next = (i + 1) % radiusIds.length;
    const angle = (Math.PI * 2) / nodesOnRadius;
    const chordLen = 2 * radius * Math.sin(angle / 2);
    const c1 = createConstraint(radiusIds[i], radiusIds[next], chordLen, 0.9);
    if (c1) {
      const a = world.nodes.get(c1.nodeAId)!;
      const b = world.nodes.get(c1.nodeBId)!;
      addConstraint(world, c1, a, b);
    }

    const c2 = createConstraint(radiusIds[i], centerNode.id, radius, 0.85);
    if (c2) {
      const a = world.nodes.get(c2.nodeAId)!;
      const b = world.nodes.get(c2.nodeBId)!;
      addConstraint(world, c2, a, b);
    }

    const skip = 2;
    const skipIdx = (i + skip) % radiusIds.length;
    const skipAngle = (Math.PI * 2 * skip) / nodesOnRadius;
    const skipLen = 2 * radius * Math.sin(skipAngle / 2);
    const c3 = createConstraint(radiusIds[i], radiusIds[skipIdx], skipLen, 0.5);
    if (c3) {
      const a = world.nodes.get(c3.nodeAId)!;
      const b = world.nodes.get(c3.nodeBId)!;
      addConstraint(world, c3, a, b);
    }
  }

  return nodeIds;
};
