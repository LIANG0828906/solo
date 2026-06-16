import * as THREE from 'three';

export interface CloudParticle {
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  baseSize: number;
  baseOpacity: number;
  opacityPhase: number;
  tempOffset: THREE.Vector3;
}

export interface CloudCluster {
  particles: CloudParticle[];
  points: THREE.Points;
  center: THREE.Vector3;
  driftVelocity: THREE.Vector3;
  rotationSpeed: number;
  rotationY: number;
  color: THREE.Color;
  targetColor: THREE.Color;
  baseColor: THREE.Color;
  colorTransitionProgress: number;
  colorTransitionDuration: number;
  animationState: 'idle' | 'diffusing' | 'gathering';
  animationProgress: number;
  animationDirection: THREE.Vector3[];
  boundingRadius: number;
  gatherFlashIntensity: number;
}

export interface SceneState {
  densityMultiplier: number;
  driftSpeed: number;
  colorSpeed: number;
}

interface GroundData {
  mesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  originalPositions: Float32Array;
  time: number;
}

const CLOUD_COLORS = [
  new THREE.Color('#E8D5B7'),
  new THREE.Color('#A8D8EA'),
  new THREE.Color('#D4A5A5'),
  new THREE.Color('#B8D4B8'),
];

const MAX_PARTICLES = 10000;
const DIFFUSION_DURATION = 0.6;
const GATHERING_DURATION = 0.8;
const GROUND_Y = -10;

let scene: THREE.Scene;
let clusters: CloudCluster[] = [];
let groundData: GroundData | null = null;
let totalParticles = 0;

const tempColor = new THREE.Color();
const tempVec3 = new THREE.Vector3();
const tempVec3_2 = new THREE.Vector3();

export function createScene(): THREE.Scene {
  scene = new THREE.Scene();

  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0B1A3A');
  gradient.addColorStop(1, '#2B1A4A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  scene.background = texture;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  createGround();
  createCloudClusters();

  return scene;
}

function createGround(): void {
  const geometry = new THREE.PlaneGeometry(100, 100, 128, 128);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position.array as Float32Array;
  const originalPositions = new Float32Array(positions.length);
  originalPositions.set(positions);

  const material = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a,
    transparent: true,
    opacity: 0.6,
    metalness: 0.3,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = GROUND_Y;
  mesh.receiveShadow = true;
  scene.add(mesh);

  groundData = {
    mesh,
    geometry,
    originalPositions,
    time: 0,
  };
}

export function createCloudClusters(): void {
  clusters.forEach((c) => {
    scene.remove(c.points);
    c.points.geometry.dispose();
    (c.points.material as THREE.Material).dispose();
  });
  clusters = [];
  totalParticles = 0;

  const clusterCount = Math.floor(Math.random() * 21) + 20;

  for (let i = 0; i < clusterCount; i++) {
    if (totalParticles >= MAX_PARTICLES) break;

    const baseParticleCount = Math.floor(Math.random() * 101) + 50;
    const particleCount = Math.min(baseParticleCount, MAX_PARTICLES - totalParticles);

    const cluster = createCloudCluster(particleCount, i);
    clusters.push(cluster);
    scene.add(cluster.points);
    totalParticles += particleCount;
  }
}

function createCloudCluster(particleCount: number, _index: number): CloudCluster {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const particles: CloudParticle[] = [];
  const animationDirections: THREE.Vector3[] = [];

  const centerX = (Math.random() - 0.5) * 30;
  const centerY = Math.random() * 15 - 5;
  const centerZ = (Math.random() - 0.5) * 30;
  const center = new THREE.Vector3(centerX, centerY, centerZ);

  const clusterRadius = 1.5 + Math.random() * 2;

  const colorIndex = Math.floor(Math.random() * CLOUD_COLORS.length);
  const baseColor = CLOUD_COLORS[colorIndex].clone();
  const color = baseColor.clone();
  const targetColor = getNextColor(colorIndex).clone();

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 0.5) * clusterRadius;

    const x = centerX + r * Math.sin(phi) * Math.cos(theta);
    const y = centerY + r * Math.sin(phi) * Math.sin(theta);
    const z = centerZ + r * Math.cos(phi);

    const position = new THREE.Vector3(x, y, z);
    const originalPosition = new THREE.Vector3(x, y, z);
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    );

    const baseSize = 2 + Math.random() * 4;
    const baseOpacity = 0.1 + Math.random() * 0.5;

    particles.push({
      position,
      originalPosition,
      velocity,
      baseSize,
      baseOpacity,
      opacityPhase: Math.random() * Math.PI * 2,
      tempOffset: new THREE.Vector3(),
    });

    animationDirections.push(
      new THREE.Vector3(
        x - centerX,
        y - centerY,
        z - centerZ
      ).normalize()
    );

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = baseSize;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.position.set(0, 0, 0);

  const driftVelocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.3,
    (Math.random() - 0.5) * 0.1,
    (Math.random() - 0.5) * 0.3
  );

  const rotationSpeed = 0.01 + Math.random() * 0.02;

  return {
    particles,
    points,
    center,
    driftVelocity,
    rotationSpeed,
    rotationY: Math.random() * Math.PI * 2,
    color,
    targetColor,
    baseColor: baseColor.clone(),
    colorTransitionProgress: 0,
    colorTransitionDuration: 15 + Math.random() * 10,
    animationState: 'idle',
    animationProgress: 0,
    animationDirection: animationDirections,
    boundingRadius: clusterRadius + 0.5,
    gatherFlashIntensity: 0,
  };
}

function getNextColor(currentIndex: number): THREE.Color {
  const nextIndex = (currentIndex + 1 + Math.floor(Math.random() * 3)) % CLOUD_COLORS.length;
  return CLOUD_COLORS[nextIndex];
}

export function updateClouds(deltaTime: number, state: SceneState, elapsed: number): void {
  const driftMultiplier = state.driftSpeed;
  const colorMultiplier = state.colorSpeed;

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];

    cluster.rotationY += cluster.rotationSpeed * deltaTime;
    cluster.points.rotation.y = cluster.rotationY;

    cluster.center.add(
      tempVec3.copy(cluster.driftVelocity).multiplyScalar(deltaTime * driftMultiplier)
    );

    if (cluster.center.x > 25) cluster.center.x = -25;
    if (cluster.center.x < -25) cluster.center.x = 25;
    if (cluster.center.z > 25) cluster.center.z = -25;
    if (cluster.center.z < -25) cluster.center.z = 25;
    cluster.center.y = THREE.MathUtils.clamp(cluster.center.y, -5, 10);

    cluster.colorTransitionProgress += (deltaTime / cluster.colorTransitionDuration) * colorMultiplier;
    if (cluster.colorTransitionProgress >= 1) {
      cluster.colorTransitionProgress = 0;
      const currentColorIndex = CLOUD_COLORS.findIndex((c) =>
        Math.abs(c.r - cluster.targetColor.r) < 0.001 &&
        Math.abs(c.g - cluster.targetColor.g) < 0.001 &&
        Math.abs(c.b - cluster.targetColor.b) < 0.001
      );
      cluster.baseColor.copy(cluster.targetColor);
      cluster.targetColor.copy(getNextColor(currentColorIndex >= 0 ? currentColorIndex : 0));
      cluster.colorTransitionDuration = 15 + Math.random() * 10;
    }

    tempColor.copy(cluster.baseColor).lerp(cluster.targetColor, cluster.colorTransitionProgress);
    cluster.color.copy(tempColor);

    updateDiffusionAnimation(cluster, deltaTime, elapsed);
    updateClusterParticles(cluster, state, elapsed);
  }

  applyChainEffect(deltaTime);
}

function updateDiffusionAnimation(cluster: CloudCluster, deltaTime: number, _elapsed: number): void {
  if (cluster.animationState === 'idle') return;

  if (cluster.animationState === 'diffusing') {
    cluster.animationProgress += deltaTime / DIFFUSION_DURATION;
    if (cluster.animationProgress >= 1) {
      cluster.animationProgress = 1;
      cluster.animationState = 'gathering';
    }
  } else if (cluster.animationState === 'gathering') {
    cluster.animationProgress -= deltaTime / GATHERING_DURATION;
    if (cluster.animationProgress <= 0) {
      cluster.animationProgress = 0;
      cluster.animationState = 'idle';
      cluster.gatherFlashIntensity = 1;
    }
  }

  if (cluster.animationState === 'gathering') {
    cluster.gatherFlashIntensity = Math.max(0, cluster.gatherFlashIntensity - deltaTime * 2);
  }

  const positions = cluster.points.geometry.attributes.position.array as Float32Array;
  const colors = cluster.points.geometry.attributes.color.array as Float32Array;

  const isDiffusing = cluster.animationState === 'diffusing';
  const progress = cluster.animationProgress;

  for (let i = 0; i < cluster.particles.length; i++) {
    const particle = cluster.particles[i];
    const direction = cluster.animationDirection[i];
    const distFromCenter = particle.originalPosition.distanceTo(cluster.center);
    const decayFactor = Math.max(0, 1 - distFromCenter / cluster.boundingRadius);
    const diffusionAmount = progress * decayFactor * 3;

    particle.position.x = particle.originalPosition.x + direction.x * diffusionAmount + particle.tempOffset.x;
    particle.position.y = particle.originalPosition.y + direction.y * diffusionAmount + particle.tempOffset.y;
    particle.position.z = particle.originalPosition.z + direction.z * diffusionAmount + particle.tempOffset.z;

    positions[i * 3] = particle.position.x;
    positions[i * 3 + 1] = particle.position.y;
    positions[i * 3 + 2] = particle.position.z;

    let brightnessMultiplier = 1;
    if (isDiffusing) {
      brightnessMultiplier = 1 + 0.2 * progress;
    } else if (cluster.animationState === 'gathering') {
      brightnessMultiplier = 1 + 0.2 * progress;
    }
    brightnessMultiplier += cluster.gatherFlashIntensity * 0.5;

    colors[i * 3] = Math.min(1, cluster.color.r * brightnessMultiplier);
    colors[i * 3 + 1] = Math.min(1, cluster.color.g * brightnessMultiplier);
    colors[i * 3 + 2] = Math.min(1, cluster.color.b * brightnessMultiplier);
  }

  cluster.points.geometry.attributes.position.needsUpdate = true;
  cluster.points.geometry.attributes.color.needsUpdate = true;
}

function updateClusterParticles(cluster: CloudCluster, state: SceneState, elapsed: number): void {
  const positions = cluster.points.geometry.attributes.position.array as Float32Array;
  const colors = cluster.points.geometry.attributes.color.array as Float32Array;
  const sizes = cluster.points.geometry.attributes.size.array as Float32Array;

  const isAnimating = cluster.animationState !== 'idle';

  for (let i = 0; i < cluster.particles.length; i++) {
    const particle = cluster.particles[i];

    particle.tempOffset.multiplyScalar(0.95);

    if (!isAnimating) {
      particle.position.x = particle.originalPosition.x + particle.tempOffset.x;
      particle.position.y = particle.originalPosition.y + particle.tempOffset.y;
      particle.position.z = particle.originalPosition.z + particle.tempOffset.z;

      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;

      colors[i * 3] = cluster.color.r;
      colors[i * 3 + 1] = cluster.color.g;
      colors[i * 3 + 2] = cluster.color.b;
    }

    const opacityOscillation = 0.5 + 0.5 * Math.sin(elapsed * 0.5 + particle.opacityPhase);
    const dynamicOpacity = particle.baseOpacity * (0.7 + 0.3 * opacityOscillation);

    sizes[i] = particle.baseSize * dynamicOpacity * state.densityMultiplier;
  }

  if (!isAnimating) {
    cluster.points.geometry.attributes.position.needsUpdate = true;
    cluster.points.geometry.attributes.color.needsUpdate = true;
  }
  cluster.points.geometry.attributes.size.needsUpdate = true;
}

function applyChainEffect(deltaTime: number): void {
  for (let i = 0; i < clusters.length; i++) {
    const clusterA = clusters[i];
    if (clusterA.animationState === 'idle') continue;

    for (let j = 0; j < clusters.length; j++) {
      if (i === j) continue;
      const clusterB = clusters[j];

      const dist = clusterA.center.distanceTo(clusterB.center);
      const effectRadius = clusterA.boundingRadius + clusterB.boundingRadius + 2;

      if (dist < effectRadius) {
        const pushStrength = (1 - dist / effectRadius) * clusterA.animationProgress * 0.3;
        tempVec3.subVectors(clusterB.center, clusterA.center).normalize();

        for (let k = 0; k < clusterB.particles.length; k++) {
          const particle = clusterB.particles[k];
          const particleDist = particle.originalPosition.distanceTo(clusterA.center);
          if (particleDist < effectRadius) {
            const particlePush = (1 - particleDist / effectRadius) * pushStrength;
            particle.tempOffset.add(
              tempVec3_2.copy(tempVec3).multiplyScalar(particlePush * deltaTime * 60)
            );
          }
        }
      }
    }
  }
}

export function updateGround(deltaTime: number, elapsed: number): void {
  if (!groundData) return;

  groundData.time += deltaTime;

  const positions = groundData.geometry.attributes.position.array as Float32Array;
  const original = groundData.originalPositions;

  const baseFrequency = 0.5;
  const frequencyModulation = 0.2 * Math.sin((groundData.time / 5) * Math.PI * 2);
  const frequency = baseFrequency + frequencyModulation;
  const amplitude = 0.01;

  for (let i = 0; i < positions.length; i += 3) {
    const x = original[i];
    const z = original[i + 2];

    const wave1 = Math.sin(x * frequency + elapsed * 0.3) * Math.cos(z * frequency + elapsed * 0.2);
    const wave2 = Math.sin(x * frequency * 1.5 + elapsed * 0.4) * Math.cos(z * frequency * 0.7 + elapsed * 0.5);
    const wave3 = Math.cos(x * frequency * 0.8 + elapsed * 0.25) * Math.sin(z * frequency * 1.2 + elapsed * 0.35);

    const displacement = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * amplitude;

    positions[i + 1] = original[i + 1] + displacement;
  }

  groundData.geometry.attributes.position.needsUpdate = true;
  groundData.geometry.computeVertexNormals();
}

export function triggerDiffusion(clusterIndex: number): void {
  if (clusterIndex < 0 || clusterIndex >= clusters.length) return;

  const cluster = clusters[clusterIndex];
  if (cluster.animationState !== 'idle') return;

  cluster.animationState = 'diffusing';
  cluster.animationProgress = 0;
}

export function getCloudClusters(): CloudCluster[] {
  return clusters;
}

export function getClusterBoundingSphere(clusterIndex: number): THREE.Sphere | null {
  if (clusterIndex < 0 || clusterIndex >= clusters.length) return null;
  const cluster = clusters[clusterIndex];
  return new THREE.Sphere(cluster.center, cluster.boundingRadius);
}
