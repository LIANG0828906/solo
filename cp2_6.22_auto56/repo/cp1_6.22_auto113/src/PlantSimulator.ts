import { v4 as uuidv4 } from 'uuid';
import {
  SeedType,
  Plant,
  Point,
  BranchNode,
  MushroomStructure,
  GlowMossStructure,
  AABB,
  SEED_COLORS,
  CELL_WIDTH,
  CELL_HEIGHT
} from './types';

const VINE_MAX_DEPTH = 4;
const VINE_BRANCH_MIN = 30;
const VINE_BRANCH_MAX = 60;
const VINE_ANGLE_RANGE = Math.PI / 4;
const VINE_GROWTH_TIME = 3;
const MUSHROOM_GROWTH_TIME = 5;
const MUSHROOM_CAP_RADIUS = 30;
const GLOWMOSS_GROWTH_TIME = 2;
const GLOWMOSS_RADIUS = 50;
const SEED_SCALE_TIME = 0.2;
const CLEAR_TIME = 0.5;

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function generateVineBranches(
  start: Point,
  angle: number,
  depth: number,
  thickness: number
): BranchNode[] {
  const branches: BranchNode[] = [];

  if (depth > VINE_MAX_DEPTH) return branches;

  const length = randomRange(VINE_BRANCH_MIN, VINE_BRANCH_MAX);
  const end: Point = {
    x: start.x + Math.cos(angle) * length,
    y: start.y + Math.sin(angle) * length
  };

  const startThreshold = depth * 0.15;
  const hasLeaf = depth > 0 && length >= 40;

  const branch: BranchNode = {
    start: { ...start },
    end,
    angle,
    length,
    thickness,
    hasLeaf,
    leafAngle: angle + randomRange(-0.3, 0.3),
    growthProgress: 0,
    startThreshold
  };

  branches.push(branch);

  const childCount = depth === 0 ? 2 : Math.floor(randomRange(1, 3));
  for (let i = 0; i < childCount; i++) {
    const childAngle = angle + randomRange(-VINE_ANGLE_RANGE, VINE_ANGLE_RANGE);
    const childBranches = generateVineBranches(
      end,
      childAngle,
      depth + 1,
      thickness * 0.7
    );
    branches.push(...childBranches);
  }

  return branches;
}

function generateMushroomDots(center: Point, radius: number): Point[] {
  const dots: Point[] = [];
  const count = Math.floor(randomRange(6, 10));
  for (let i = 0; i < count; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const dist = randomRange(0, radius * 0.7);
    dots.push({
      x: center.x + Math.cos(angle) * dist,
      y: center.y + Math.sin(angle) * dist * 0.6
    });
  }
  return dots;
}

export function createPlant(
  type: SeedType,
  gridX: number,
  gridY: number
): Plant {
  const position: Point = {
    x: gridX * CELL_WIDTH + CELL_WIDTH / 2,
    y: gridY * CELL_HEIGHT + CELL_HEIGHT / 2
  };

  const plant: Plant = {
    id: uuidv4(),
    type,
    gridX,
    gridY,
    position,
    state: 'growing',
    growthTime: 0,
    maxGrowthTime: type === 'vine' ? VINE_GROWTH_TIME : type === 'mushroom' ? MUSHROOM_GROWTH_TIME : GLOWMOSS_GROWTH_TIME,
    opacity: 0,
    scale: 0.5,
    interactedWith: new Set(),
    stateTimer: 0,
    leafOffsets: new Map()
  };

  if (type === 'vine') {
    plant.vineBranches = generateVineBranches(
      position,
      -Math.PI / 2 + randomRange(-0.5, 0.5),
      0,
      4
    );
  } else if (type === 'mushroom') {
    plant.mushroom = {
      center: { x: position.x, y: position.y - 10 },
      capRadius: MUSHROOM_CAP_RADIUS,
      stemHeight: 20,
      brightness: 1,
      dots: generateMushroomDots({ x: position.x, y: position.y - 10 }, MUSHROOM_CAP_RADIUS)
    };
  } else if (type === 'glowmoss') {
    const color = SEED_COLORS.glowmoss;
    plant.glowmoss = {
      center: position,
      radius: GLOWMOSS_RADIUS,
      opacity: 0.4,
      color: { r: color.r, g: color.g, b: color.b },
      expansion: 1
    };
  }

  return plant;
}

export function updatePlant(plant: Plant, deltaTime: number): void {
  if (plant.state === 'clearing') {
    plant.reverseProgress = (plant.reverseProgress ?? 1) - deltaTime / CLEAR_TIME;
    if (plant.reverseProgress <= 0) {
      plant.reverseProgress = 0;
    }
    return;
  }

  if (plant.growthTime < SEED_SCALE_TIME) {
    const t = plant.growthTime / SEED_SCALE_TIME;
    plant.scale = 0.5 + 0.5 * easeOut(t);
  } else {
    plant.scale = 1;
  }

  plant.growthTime += deltaTime;
  const growthProgress = Math.min(plant.growthTime / plant.maxGrowthTime, 1);
  plant.opacity = growthProgress;

  if (plant.type === 'vine' && plant.vineBranches) {
    for (const branch of plant.vineBranches) {
      const adjustedProgress = Math.max(0, (growthProgress - branch.startThreshold) / (1 - branch.startThreshold));
      branch.growthProgress = Math.min(adjustedProgress, 1);
    }
    plant.vineBranches.forEach((_, idx) => {
      if (!plant.leafOffsets.has(idx)) {
        plant.leafOffsets.set(idx, { x: 0, y: 0 });
      }
      const offset = plant.leafOffsets.get(idx)!;
      offset.x = randomRange(-1, 1);
      offset.y = randomRange(-1, 1);
    });
  }

  if (plant.type === 'mushroom' && plant.mushroom) {
    if (plant.state === 'parasitized') {
      plant.stateTimer -= deltaTime;
      if (plant.stateTimer <= 0) {
        plant.mushroom.brightness = Math.min(1, plant.mushroom.brightness + deltaTime * 0.5);
        if (plant.mushroom.brightness >= 1) {
          plant.state = plant.growthTime >= plant.maxGrowthTime ? 'mature' : 'growing';
        }
      }
    }
  }

  if (plant.growthTime >= plant.maxGrowthTime && plant.state === 'growing') {
    plant.state = 'mature';
  }
}

export function getPlantAABB(plant: Plant): AABB {
  let minX = plant.position.x;
  let minY = plant.position.y;
  let maxX = plant.position.x;
  let maxY = plant.position.y;

  if (plant.type === 'vine' && plant.vineBranches) {
    for (const branch of plant.vineBranches) {
      if (branch.growthProgress <= 0) continue;
      minX = Math.min(minX, branch.start.x, branch.end.x);
      minY = Math.min(minY, branch.start.y, branch.end.y);
      maxX = Math.max(maxX, branch.start.x, branch.end.x);
      maxY = Math.max(maxY, branch.start.y, branch.end.y);
    }
  } else if (plant.type === 'mushroom' && plant.mushroom) {
    const r = plant.mushroom.capRadius;
    minX = plant.mushroom.center.x - r;
    minY = plant.mushroom.center.y - r * 0.6;
    maxX = plant.mushroom.center.x + r;
    maxY = plant.position.y + 5;
  } else if (plant.type === 'glowmoss' && plant.glowmoss) {
    const r = plant.glowmoss.radius * plant.glowmoss.expansion;
    minX = plant.glowmoss.center.x - r;
    minY = plant.glowmoss.center.y - r * 0.5;
    maxX = plant.glowmoss.center.x + r;
    maxY = plant.glowmoss.center.y + r * 0.5;
  }

  const padding = 10;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding
  };
}

function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export function checkCollision(plantA: Plant, plantB: Plant): boolean {
  if (plantA.id === plantB.id) return false;
  if (plantA.interactedWith.has(plantB.id)) return false;

  const aabbA = getPlantAABB(plantA);
  const aabbB = getPlantAABB(plantB);

  if (!aabbOverlap(aabbA, aabbB)) return false;

  const threshold = 8;

  if (plantA.type === 'vine' && plantB.type === 'vine') {
    return checkVineVineCollision(plantA, plantB, threshold);
  } else if (plantA.type === 'vine' && plantB.type === 'mushroom') {
    return checkVineMushroomCollision(plantA, plantB, threshold);
  } else if (plantA.type === 'mushroom' && plantB.type === 'vine') {
    return checkVineMushroomCollision(plantB, plantA, threshold);
  } else if (plantA.type === 'vine' && plantB.type === 'glowmoss') {
    return checkVineGlowmossCollision(plantA, plantB, threshold);
  } else if (plantA.type === 'glowmoss' && plantB.type === 'vine') {
    return checkVineGlowmossCollision(plantB, plantA, threshold);
  } else if (plantA.type === 'mushroom' && plantB.type === 'glowmoss') {
    return checkMushroomGlowmossCollision(plantA, plantB);
  } else if (plantA.type === 'glowmoss' && plantB.type === 'mushroom') {
    return checkMushroomGlowmossCollision(plantB, plantA);
  } else if (plantA.type === 'mushroom' && plantB.type === 'mushroom') {
    return checkMushroomMushroomCollision(plantA, plantB);
  } else if (plantA.type === 'glowmoss' && plantB.type === 'glowmoss') {
    return checkGlowmossGlowmossCollision(plantA, plantB);
  }

  return false;
}

function checkVineVineCollision(a: Plant, b: Plant, threshold: number): boolean {
  if (!a.vineBranches || !b.vineBranches) return false;
  for (const branchA of a.vineBranches) {
    if (branchA.growthProgress < 0.3) continue;
    for (const branchB of b.vineBranches) {
      if (branchB.growthProgress < 0.3) continue;
      const dist = pointToSegmentDistance(
        branchA.start.x,
        branchA.start.y,
        branchB.start.x,
        branchB.start.y,
        branchB.end.x,
        branchB.end.y
      );
      if (dist < threshold) return true;
    }
  }
  return false;
}

function checkVineMushroomCollision(vine: Plant, mushroom: Plant, threshold: number): boolean {
  if (!vine.vineBranches || !mushroom.mushroom) return false;
  const center = mushroom.mushroom.center;
  const r = mushroom.mushroom.capRadius;
  for (const branch of vine.vineBranches) {
    if (branch.growthProgress < 0.3) continue;
    const dist = pointToSegmentDistance(
      center.x,
      center.y,
      branch.start.x,
      branch.start.y,
      branch.end.x,
      branch.end.y
    );
    if (dist < r + threshold) return true;
  }
  return false;
}

function checkVineGlowmossCollision(vine: Plant, glowmoss: Plant, threshold: number): boolean {
  if (!vine.vineBranches || !glowmoss.glowmoss) return false;
  const center = glowmoss.glowmoss.center;
  const r = glowmoss.glowmoss.radius * glowmoss.glowmoss.expansion;
  for (const branch of vine.vineBranches) {
    if (branch.growthProgress < 0.3) continue;
    const dist = pointToSegmentDistance(
      center.x,
      center.y,
      branch.start.x,
      branch.start.y,
      branch.end.x,
      branch.end.y
    );
    if (dist < r + threshold) return true;
  }
  return false;
}

function checkMushroomGlowmossCollision(mushroom: Plant, glowmoss: Plant): boolean {
  if (!mushroom.mushroom || !glowmoss.glowmoss) return false;
  const dist = Math.hypot(
    mushroom.mushroom.center.x - glowmoss.glowmoss.center.x,
    mushroom.mushroom.center.y - glowmoss.glowmoss.center.y
  );
  return dist < mushroom.mushroom.capRadius + glowmoss.glowmoss.radius * glowmoss.glowmoss.expansion;
}

function checkMushroomMushroomCollision(a: Plant, b: Plant): boolean {
  if (!a.mushroom || !b.mushroom) return false;
  const dist = Math.hypot(
    a.mushroom.center.x - b.mushroom.center.x,
    a.mushroom.center.y - b.mushroom.center.y
  );
  return dist < a.mushroom.capRadius + b.mushroom.capRadius;
}

function checkGlowmossGlowmossCollision(a: Plant, b: Plant): boolean {
  if (!a.glowmoss || !b.glowmoss) return false;
  const dist = Math.hypot(
    a.glowmoss.center.x - b.glowmoss.center.x,
    a.glowmoss.center.y - b.glowmoss.center.y
  );
  const rA = a.glowmoss.radius * a.glowmoss.expansion;
  const rB = b.glowmoss.radius * b.glowmoss.expansion;
  return dist < rA + rB;
}

export interface CollisionEvent {
  plantA: Plant;
  plantB: Plant;
  mixedColor: { r: number; g: number; b: number };
  centerPoint: Point;
}

export function processCollision(event: CollisionEvent): void {
  const { plantA, plantB } = event;

  plantA.interactedWith.add(plantB.id);
  plantB.interactedWith.add(plantA.id);

  if (
    (plantA.type === 'vine' && plantB.type === 'mushroom') ||
    (plantA.type === 'mushroom' && plantB.type === 'vine')
  ) {
    const vine = plantA.type === 'vine' ? plantA : plantB;
    const mushroom = plantA.type === 'mushroom' ? plantA : plantB;
    vine.state = 'wrapped';
    mushroom.state = 'wrapped';
    if (mushroom.mushroom) {
      mushroom.mushroom.capRadius *= 0.9;
    }
  } else if (
    (plantA.type === 'mushroom' && plantB.type === 'glowmoss') ||
    (plantA.type === 'glowmoss' && plantB.type === 'mushroom')
  ) {
    const mushroom = plantA.type === 'mushroom' ? plantA : plantB;
    const glowmoss = plantA.type === 'glowmoss' ? plantA : plantB;
    mushroom.state = 'parasitized';
    glowmoss.state = 'parasitized';
    if (mushroom.mushroom) {
      mushroom.mushroom.brightness = 0.7;
      mushroom.stateTimer = 2;
    }
  } else if (
    (plantA.type === 'vine' && plantB.type === 'glowmoss') ||
    (plantA.type === 'glowmoss' && plantB.type === 'vine')
  ) {
    const vine = plantA.type === 'vine' ? plantA : plantB;
    const glowmoss = plantA.type === 'glowmoss' ? plantA : plantB;
    vine.state = 'symbiotic';
    glowmoss.state = 'symbiotic';
    if (glowmoss.glowmoss) {
      glowmoss.glowmoss.expansion = 1.2;
      glowmoss.glowmoss.color = { r: 180, g: 100, b: 220 };
    }
  }
}

export function getCollisionCenter(plantA: Plant, plantB: Plant): Point {
  return {
    x: (plantA.position.x + plantB.position.x) / 2,
    y: (plantA.position.y + plantB.position.y) / 2
  };
}

export function mixColors(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  return {
    r: Math.floor((a.r + b.r) / 2),
    g: Math.floor((a.g + b.g) / 2),
    b: Math.floor((a.b + b.b) / 2)
  };
}
