import * as THREE from 'three';
import { eventBus } from './eventBus';

export interface PlantGenes {
  colorMutation: boolean;
  shapeMutation: boolean;
  speedMutation: boolean;
}

export interface PlantState {
  light: number;
  water: number;
  nutrient: number;
  genes: PlantGenes;
}

interface PlantData {
  group: THREE.Group;
  stem: THREE.Mesh;
  branches: THREE.Mesh[];
  leaves: THREE.Mesh[];
  particles: THREE.Points;
  growthTime: number;
  currentHeight: number;
  targetHeight: number;
  currentLeafSize: number;
  targetLeafSize: number;
  currentColor: THREE.Color;
  targetColor: THREE.Color;
  isWilting: boolean;
  baseStemRotation: THREE.Euler;
}

let plantData: PlantData | null = null;
let sceneRef: THREE.Scene | null = null;

const GROWTH_CYCLE = 30000;
const BASE_COLOR = new THREE.Color('#7CCD7C');
const WILT_COLOR = new THREE.Color('#B8860B');
const MAX_HEIGHT = 8;
const MIN_HEIGHT = 2;
const INITIAL_LEAVES = 5;
const MAX_LEAVES = 20;
const PARTICLE_COUNT = 200;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpColor(from: THREE.Color, to: THREE.Color, t: number, out: THREE.Color): void {
  out.r = from.r + (to.r - from.r) * t;
  out.g = from.g + (to.g - from.g) * t;
  out.b = from.b + (to.b - from.b) * t;
}

function createLeafGeometry(shapeMutation: boolean, variant: number): THREE.BufferGeometry {
  if (shapeMutation) {
    if (variant % 2 === 0) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.5);
      shape.lineTo(0.35, 0);
      shape.lineTo(0, -0.5);
      shape.lineTo(-0.35, 0);
      shape.lineTo(0, 0.5);
      return new THREE.ShapeGeometry(shape);
    } else {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.5);
      shape.lineTo(0.4, -0.4);
      shape.lineTo(-0.4, -0.4);
      shape.lineTo(0, 0.5);
      return new THREE.ShapeGeometry(shape);
    }
  }
  return new THREE.CircleGeometry(0.3, 16);
}

function createParticles(color: THREE.Color): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * 2.5 + 0.5;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) + 1;
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    sizes[i] = Math.random() * 2 + 1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  (geometry as any)._basePositions = basePositions;
  (geometry as any)._offsets = new Float32Array(PARTICLE_COUNT).map(() => Math.random() * Math.PI * 2);

  const material = new THREE.PointsMaterial({
    color: color.clone(),
    size: 0.08,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  return points;
}

function createLeaf(heightRatio: number, index: number, shapeMutation: boolean, color: THREE.Color): THREE.Mesh {
  const geometry = createLeafGeometry(shapeMutation, index);
  const material = new THREE.MeshLambertMaterial({
    color: color.clone(),
    side: THREE.DoubleSide
  });
  const leaf = new THREE.Mesh(geometry, material);

  const angle = (index * Math.PI * 2) / INITIAL_LEAVES + Math.random() * 0.5;
  const yPos = heightRatio * (MIN_HEIGHT - 0.5) + 0.3 + Math.random() * 0.5;
  const radius = 0.15 + 0.1 + Math.random() * 0.1;

  leaf.position.set(
    Math.cos(angle) * radius,
    yPos,
    Math.sin(angle) * radius
  );
  leaf.rotation.set(
    Math.random() * Math.PI,
    angle,
    (Math.random() - 0.5) * 0.5
  );
  (leaf as any)._baseAngle = angle;
  (leaf as any)._baseY = yPos;
  (leaf as any)._baseRadius = radius;
  (leaf as any)._baseRotation = leaf.rotation.clone();
  (leaf as any)._variant = index;

  return leaf;
}

export function createPlant(scene: THREE.Scene): THREE.Group {
  sceneRef = scene;

  const group = new THREE.Group();

  const stemGeometry = new THREE.CylinderGeometry(0.12, 0.15, MIN_HEIGHT, 8);
  const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x5D8A3A });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = MIN_HEIGHT / 2;
  group.add(stem);

  const branches: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const branchGeometry = new THREE.CylinderGeometry(0.05, 0.07, 2, 6);
    const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x5D8A3A });
    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
    branch.visible = false;
    branches.push(branch);
    group.add(branch);
  }

  const leaves: THREE.Mesh[] = [];
  for (let i = 0; i < MAX_LEAVES; i++) {
    const heightRatio = i < INITIAL_LEAVES ? (i / INITIAL_LEAVES) : (i / MAX_LEAVES);
    const leaf = createLeaf(heightRatio, i, false, BASE_COLOR);
    leaf.visible = i < INITIAL_LEAVES;
    leaves.push(leaf);
    group.add(leaf);
  }

  const particles = createParticles(BASE_COLOR);
  group.add(particles);

  plantData = {
    group,
    stem,
    branches,
    leaves,
    particles,
    growthTime: 0,
    currentHeight: MIN_HEIGHT,
    targetHeight: MIN_HEIGHT,
    currentLeafSize: 1,
    targetLeafSize: 1,
    currentColor: BASE_COLOR.clone(),
    targetColor: BASE_COLOR.clone(),
    isWilting: false,
    baseStemRotation: new THREE.Euler(0, 0, 0)
  };

  scene.add(group);
  return group;
}

function updateParticleColor(color: THREE.Color): void {
  if (!plantData) return;
  const mat = plantData.particles.material as THREE.PointsMaterial;
  mat.color.copy(color);
}

function updateLeafColors(color: THREE.Color): void {
  if (!plantData) return;
  for (const leaf of plantData.leaves) {
    const mat = leaf.material as THREE.MeshLambertMaterial;
    mat.color.copy(color);
  }
}

function rebuildLeaves(shapeMutation: boolean): void {
  if (!plantData) return;
  for (let i = 0; i < plantData.leaves.length; i++) {
    const oldLeaf = plantData.leaves[i];
    const variant = (oldLeaf as any)._variant ?? i;
    const newGeometry = createLeafGeometry(shapeMutation, variant);
    oldLeaf.geometry.dispose();
    oldLeaf.geometry = newGeometry;
  }
}

function getEnvironmentFactor(state: PlantState): number {
  const avg = (state.light + state.water + state.nutrient) / 3;
  return avg / 100;
}

function isWilting(state: PlantState): boolean {
  return state.light < 20 || state.water < 20 || state.nutrient < 20;
}

function computeTargetColor(state: PlantState): THREE.Color {
  const result = new THREE.Color();

  if (isWilting(state)) {
    result.copy(WILT_COLOR);
    return result;
  }

  if (state.genes.colorMutation) {
    const warmPalette = [
      new THREE.Color('#E74C3C'),
      new THREE.Color('#E67E22'),
      new THREE.Color('#F39C12'),
      new THREE.Color('#FF6B9D')
    ];
    const coolPalette = [
      new THREE.Color('#3498DB'),
      new THREE.Color('#9B59B6'),
      new THREE.Color('#1ABC9C'),
      new THREE.Color('#00CEC9')
    ];
    const palette = Math.random() > 0.5 ? warmPalette : coolPalette;
    const idx = Math.floor(Math.random() * palette.length);
    result.copy(palette[idx]);
    return result;
  }

  const factor = getEnvironmentFactor(state);
  const lightFactor = state.light / 100;
  const waterFactor = state.water / 100;

  result.r = 0.45 + (lightFactor - 0.5) * 0.15;
  result.g = 0.75 + (factor - 0.5) * 0.2;
  result.b = 0.45 + (waterFactor - 0.5) * 0.15;

  return result;
}

function getState(): PlantState {
  return {
    light: 50,
    water: 50,
    nutrient: 50,
    genes: { colorMutation: false, shapeMutation: false, speedMutation: false }
  };
}

export function updatePlant(deltaTime: number, state: PlantState): void {
  if (!plantData || !sceneRef) return;

  const speedMul = state.genes.speedMutation ? 2 : 1;
  plantData.growthTime = (plantData.growthTime + deltaTime * speedMul) % GROWTH_CYCLE;
  const growthT = plantData.growthTime / GROWTH_CYCLE;
  const growthProgress = easeInOutCubic(growthT);

  const envFactor = getEnvironmentFactor(state);
  const heightTarget = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * growthProgress * Math.max(0.3, envFactor);
  plantData.targetHeight = heightTarget;

  const heightDiff = plantData.targetHeight - plantData.currentHeight;
  plantData.currentHeight += heightDiff * Math.min(1, deltaTime * 0.5);

  const stemGeo = plantData.stem.geometry as THREE.CylinderGeometry;
  const stemHeight = plantData.currentHeight;
  stemGeo.dispose();
  plantData.stem.geometry = new THREE.CylinderGeometry(0.12, 0.15, stemHeight, 8);
  plantData.stem.position.y = stemHeight / 2;

  plantData.targetLeafSize = 0.7 + envFactor * 0.8;
  const leafSizeDiff = plantData.targetLeafSize - plantData.currentLeafSize;
  plantData.currentLeafSize += leafSizeDiff * Math.min(1, deltaTime * 0.5);

  const visibleLeaves = Math.floor(INITIAL_LEAVES + (MAX_LEAVES - INITIAL_LEAVES) * growthProgress);
  for (let i = 0; i < plantData.leaves.length; i++) {
    const leaf = plantData.leaves[i];
    leaf.visible = i < visibleLeaves;

    if (leaf.visible) {
      const baseAngle = (leaf as any)._baseAngle;
      const baseY = (leaf as any)._baseY;
      const baseRadius = (leaf as any)._baseRadius;

      const leafYRatio = (i + 1) / visibleLeaves;
      const newY = stemHeight * leafYRatio * 0.9 + 0.2;
      const newRadius = 0.15 + plantData.currentLeafSize * 0.15 + leafYRatio * 0.1;

      leaf.position.y = baseY + (newY - baseY) * growthProgress;
      leaf.position.x = Math.cos(baseAngle) * (baseRadius + (newRadius - baseRadius) * growthProgress);
      leaf.position.z = Math.sin(baseAngle) * (baseRadius + (newRadius - baseRadius) * growthProgress);

      leaf.scale.setScalar(plantData.currentLeafSize);
    }
  }

  if (growthProgress > 0.5) {
    const branchT = easeInOutCubic((growthProgress - 0.5) * 2);
    for (let i = 0; i < plantData.branches.length; i++) {
      const branch = plantData.branches[i];
      branch.visible = true;
      const branchAngle = i * Math.PI + Math.PI / 4;
      const branchHeight = stemHeight * 0.55;
      const branchLength = 2 * branchT;

      const geo = branch.geometry as THREE.CylinderGeometry;
      geo.dispose();
      branch.geometry = new THREE.CylinderGeometry(0.04, 0.07, branchLength, 6);

      branch.position.set(
        Math.cos(branchAngle) * 0.15,
        branchHeight,
        Math.sin(branchAngle) * 0.15
      );
      branch.rotation.set(
        Math.PI / 4,
        0,
        branchAngle
      );
    }
  } else {
    for (const branch of plantData.branches) {
      branch.visible = false;
    }
  }

  plantData.targetColor = computeTargetColor(state);
  lerpColor(plantData.currentColor, plantData.targetColor, Math.min(1, deltaTime * 0.5), plantData.currentColor);
  updateLeafColors(plantData.currentColor);
  updateParticleColor(plantData.currentColor);

  plantData.isWilting = isWilting(state);
  if (plantData.isWilting) {
    const wiltAngle = ((Math.random() - 0.5) * 10) * Math.PI / 180;
    const wiltAngleZ = ((Math.random() - 0.5) * 10) * Math.PI / 180;
    plantData.stem.rotation.x = wiltAngle;
    plantData.stem.rotation.z = wiltAngleZ;

    for (const leaf of plantData.leaves) {
      if (leaf.visible) {
        const baseRot = (leaf as any)._baseRotation as THREE.Euler;
        leaf.rotation.x = baseRot.x + (Math.random() - 0.5) * 0.3;
        leaf.rotation.z = baseRot.z + (Math.random() - 0.5) * 0.3;
      }
    }
  } else {
    plantData.stem.rotation.set(0, 0, 0);
    for (const leaf of plantData.leaves) {
      if (leaf.visible) {
        const baseRot = (leaf as any)._baseRotation as THREE.Euler;
        leaf.rotation.copy(baseRot);
      }
    }
  }

  const positions = plantData.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
  const basePositions = (plantData.particles.geometry as any)._basePositions as Float32Array;
  const offsets = (plantData.particles.geometry as any)._offsets as Float32Array;
  const arr = positions.array as Float32Array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    offsets[i] += deltaTime * 0.3;
    const t = (offsets[i] % (Math.PI * 4)) / (Math.PI * 4);
    const floatY = basePositions[i * 3 + 1] + t * 2;
    const rotAngle = t * Math.PI * 2;
    const bx = basePositions[i * 3];
    const bz = basePositions[i * 3 + 2];

    arr[i * 3] = bx * Math.cos(rotAngle * 0.2) - bz * Math.sin(rotAngle * 0.2);
    arr[i * 3 + 1] = floatY;
    arr[i * 3 + 2] = bx * Math.sin(rotAngle * 0.2) + bz * Math.cos(rotAngle * 0.2);

    if (t > 0.9) {
      offsets[i] = Math.random() * Math.PI;
    }
  }
  positions.needsUpdate = true;
}

eventBus.on('gene:shapeMutation', (active: boolean) => {
  rebuildLeaves(active);
});

export { getState };
