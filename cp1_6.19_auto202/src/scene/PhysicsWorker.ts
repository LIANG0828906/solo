import type { Block, CenterOfMass, FragmentData, CollapseResult } from '@/types';
import { GRAVITY, RESTITUTION, MAX_FRAGMENTS, COLLAPSE_THRESHOLD, GRID_STEP } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CalculateMessage {
  type: 'calculate';
  blocks: Block[];
}

interface SimulateMessage {
  type: 'simulate';
  blocks: Block[];
  dt: number;
}

type WorkerMessage = CalculateMessage | SimulateMessage;

function getBlockVolume(type: string): number {
  switch (type) {
    case 'cube':
      return 1;
    case 'sphere':
      return (4 / 3) * Math.PI * 0.125;
    case 'prism':
      return (3 * Math.sqrt(3) / 2) * 0.25 * 1;
    default:
      return 1;
  }
}

function getBlockHalfSize(type: string): { x: number; y: number; z: number } {
  switch (type) {
    case 'cube':
      return { x: 0.5, y: 0.5, z: 0.5 };
    case 'sphere':
      return { x: 0.5, y: 0.5, z: 0.5 };
    case 'prism':
      return { x: 0.5, y: 0.5, z: 0.5 };
    default:
      return { x: 0.5, y: 0.5, z: 0.5 };
  }
}

function calculateCenterOfMass(blocks: Block[]): CenterOfMass {
  if (blocks.length === 0) {
    return {
      position: [0, 0, 0],
      offsetPercent: 0,
      isOutOfBounds: false,
      totalMass: 0,
      supportRadius: 0,
    };
  }

  const density = 1.0;
  let totalMass = 0;
  let comX = 0;
  let comY = 0;
  let comZ = 0;

  for (const block of blocks) {
    const volume = getBlockVolume(block.type);
    const mass = volume * density;
    totalMass += mass;
    comX += block.position[0] * mass;
    comY += block.position[1] * mass;
    comZ += block.position[2] * mass;
  }

  comX /= totalMass;
  comY /= totalMass;
  comZ /= totalMass;

  const groundBlocks = blocks.filter((b) => Math.abs(b.position[1] - getBlockHalfSize(b.type).y) < 0.1);
  
  let supportRadius = 0;
  if (groundBlocks.length > 0) {
    let maxDist = 0;
    for (const b of groundBlocks) {
      const dist = Math.sqrt(b.position[0] ** 2 + b.position[2] ** 2);
      if (dist > maxDist) maxDist = dist;
    }
    supportRadius = maxDist;
  } else {
    for (const b of blocks) {
      const dist = Math.sqrt(b.position[0] ** 2 + b.position[2] ** 2);
      if (dist > supportRadius) supportRadius = dist;
    }
  }

  if (supportRadius < GRID_STEP) supportRadius = GRID_STEP;

  const horizontalOffset = Math.sqrt(comX ** 2 + comZ ** 2);
  const thresholdRadius = supportRadius * (1 + COLLAPSE_THRESHOLD);
  const offsetPercent = supportRadius > 0 ? (horizontalOffset / supportRadius) * 100 : 0;
  const isOutOfBounds = horizontalOffset > thresholdRadius;

  return {
    position: [comX, comY, comZ],
    offsetPercent: Math.round(offsetPercent * 100) / 100,
    isOutOfBounds,
    totalMass: Math.round(totalMass * 100) / 100,
    supportRadius: Math.round(supportRadius * 100) / 100,
  };
}

function findContactPairs(blocks: Block[]): { blockA: Block; blockB: Block; contactPoint: [number, number, number] }[] {
  const pairs: { blockA: Block; blockB: Block; contactPoint: [number, number, number] }[] = [];
  const threshold = 1.05;

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      const dist = Math.sqrt(
        (a.position[0] - b.position[0]) ** 2 +
        (a.position[1] - b.position[1]) ** 2 +
        (a.position[2] - b.position[2]) ** 2
      );
      if (dist < threshold) {
        const contactPoint: [number, number, number] = [
          (a.position[0] + b.position[0]) / 2,
          (a.position[1] + b.position[1]) / 2,
          (a.position[2] + b.position[2]) / 2,
        ];
        pairs.push({ blockA: a, blockB: b, contactPoint });
      }
    }
  }
  return pairs;
}

function generateFragments(
  contactPoint: [number, number, number],
  color: string,
  count: number
): FragmentData[] {
  const fragments: FragmentData[] = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 3 + Math.random() * 5;
    fragments.push({
      id: uuidv4(),
      position: [...contactPoint] as [number, number, number],
      velocity: [
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed * 0.5,
        Math.sin(phi) * Math.sin(theta) * speed,
      ],
      size: 0.05 + Math.random() * 0.05,
      color,
    });
  }
  return fragments;
}

function simulatePhysics(blocks: Block[], dt: number): { blocks: Block[]; fragments: FragmentData[] } {
  const updatedBlocks = blocks.map((b) => ({ ...b, position: [...b.position] as [number, number, number] }));
  const allFragments: FragmentData[] = [];

  for (const block of updatedBlocks) {
    if (!block.isCollapsed) continue;

    let vel = block.velocity || [0, 0, 0];
    vel = [vel[0], vel[1] + GRAVITY * dt, vel[2]];

    let pos = block.position;
    pos = [
      pos[0] + vel[0] * dt,
      pos[1] + vel[1] * dt,
      pos[2] + vel[2] * dt,
    ];

    const halfSize = getBlockHalfSize(block.type);
    if (pos[1] - halfSize.y < 0) {
      pos[1] = halfSize.y;
      if (vel[1] < 0) {
        vel[1] = -vel[1] * RESTITUTION;
        if (Math.abs(vel[1]) < 0.5) {
          vel[1] = 0;
        }
      }
    }

    block.position = pos;
    block.velocity = vel;
  }

  return { blocks: updatedBlocks, fragments: allFragments };
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  if (msg.type === 'calculate') {
    const startTime = performance.now();

    const com = calculateCenterOfMass(msg.blocks);

    let fragments: FragmentData[] = [];
    let blockVelocities: { id: string; velocity: [number, number, number] }[] = [];

    if (com.isOutOfBounds && msg.blocks.length > 0) {
      const contactPairs = findContactPairs(msg.blocks);

      for (const pair of contactPairs) {
        const count = 30 + Math.floor(Math.random() * 21);
        if (fragments.length + count <= MAX_FRAGMENTS) {
          fragments.push(...generateFragments(pair.contactPoint, pair.blockA.color, count));
        }
      }

      if (fragments.length === 0 && msg.blocks.length > 0) {
        const count = 30 + Math.floor(Math.random() * 21);
        fragments.push(...generateFragments(com.position, msg.blocks[0].color, count));
      }

      blockVelocities = msg.blocks.map((block) => {
        const offsetX = block.position[0] - com.position[0];
        const offsetZ = block.position[2] - com.position[2];
        const dist = Math.sqrt(offsetX ** 2 + offsetZ ** 2) || 1;
        return {
          id: block.id,
          velocity: [
            (offsetX / dist) * 2 + (Math.random() - 0.5) * 3,
            2 + Math.random() * 2,
            (offsetZ / dist) * 2 + (Math.random() - 0.5) * 3,
          ] as [number, number, number],
        };
      });
    }

    const elapsed = performance.now() - startTime;

    const result: CollapseResult = {
      shouldCollapse: com.isOutOfBounds,
      fragments,
      blockVelocities,
      centerOfMass: com,
    };

    self.postMessage({ type: 'result', result, computeTime: elapsed });
  }

  if (msg.type === 'simulate') {
    const result = simulatePhysics(msg.blocks, msg.dt);
    self.postMessage({ type: 'simulateResult', ...result });
  }
};

export {};
