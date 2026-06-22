import * as THREE from 'three';

export interface GalaxyParams {
  particleCount: number;
  radius: number;
  arms: number;
  spin: number;
  randomness: number;
  randomnessPower: number;
  hue: number;
}

export interface GalaxyData {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  masses: Float32Array;
  starTypes: Uint8Array;
  corePosition: THREE.Vector3;
  coreVelocity: THREE.Vector3;
  mass: number;
  heatmapCanvas: HTMLCanvasElement;
  heatmapTexture: THREE.CanvasTexture;
  heatmapMesh: THREE.Mesh;
}

const STAR_TYPES = {
  BLUE_GIANT: 0,
  MAIN_SEQUENCE: 1,
  RED_GIANT: 2
};

export function createStarTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function getStarColor(starType: number, _baseHue: number, normalizedSpeed: number): THREE.Color {
  const color = new THREE.Color();
  const speed = normalizedSpeed;

  let hue: number;
  let saturation: number;
  let lightness: number;

  if (speed < 0.5) {
    const t = speed * 2;
    hue = 0.025 + t * 0.125;
    saturation = 0.85 - t * 0.35;
    lightness = 0.35 + t * 0.25;
  } else {
    const t = (speed - 0.5) * 2;
    hue = 0.15 + t * 0.50;
    saturation = 0.5 + t * 0.4;
    lightness = 0.6 + t * 0.15;
  }

  switch (starType) {
    case STAR_TYPES.BLUE_GIANT:
      hue += 0.05;
      lightness += 0.1;
      break;
    case STAR_TYPES.RED_GIANT:
      hue -= 0.03;
      lightness -= 0.05;
      break;
  }

  color.setHSL(hue, saturation, lightness);
  return color;
}

export function updateParticleColors(
  positions: Float32Array,
  velocities: Float32Array,
  colors: Float32Array,
  starTypes: Uint8Array,
  particleCount: number
): void {
  const maxSpeed = 5;
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const speed = Math.sqrt(
      velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
    );
    const normSpeed = Math.min(speed / maxSpeed, 1);
    const color = getStarColor(starTypes[i], 0, normSpeed);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }
}

export function createHeatmap(): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; mesh: THREE.Mesh } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  const geometry = new THREE.PlaneGeometry(150, 150);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  
  return { canvas, texture, mesh };
}

export function updateHeatmap(
  canvas: HTMLCanvasElement,
  texture: THREE.CanvasTexture,
  positions: Float32Array,
  particleCount: number,
  corePos: THREE.Vector3
): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  const gridSize = 48;
  const cellW = w / gridSize;
  const cellH = h / gridSize;
  const densityGrid = new Float32Array(gridSize * gridSize);
  
  const scale = gridSize / 150;
  
  for (let i = 0; i < particleCount; i++) {
    const px = positions[i * 3] - corePos.x;
    const pz = positions[i * 3 + 2] - corePos.z;
    
    const gx = Math.floor((px * scale) + gridSize / 2);
    const gz = Math.floor((pz * scale) + gridSize / 2);
    
    if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
      densityGrid[gz * gridSize + gx] += 1;
    }
  }
  
  let maxDensity = 0;
  for (let i = 0; i < densityGrid.length; i++) {
    if (densityGrid[i] > maxDensity) maxDensity = densityGrid[i];
  }
  
  if (maxDensity === 0) {
    texture.needsUpdate = true;
    return;
  }

  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const density = densityGrid[gz * gridSize + gx] / maxDensity;
      if (density > 0.05) {
        const gradient = ctx.createRadialGradient(
          gx * cellW + cellW / 2, gz * cellH + cellH / 2, 0,
          gx * cellW + cellW / 2, gz * cellH + cellH / 2, cellW * 1.5
        );

        const alpha = Math.min(density * 0.8, 0.6);
        const hue = (1 - density) * 0.7;

        gradient.addColorStop(0, `hsla(${hue * 360}, 100%, 60%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue * 360}, 100%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue * 360}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(gx * cellW, gz * cellH, cellW, cellH);
      }
    }
  }
  
  texture.needsUpdate = true;
}

export function createGalaxy(
  params: GalaxyParams,
  starTexture: THREE.Texture,
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  mass: number
): GalaxyData {
  const { particleCount, radius, arms, spin, randomness, randomnessPower, hue } = params;
  
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const masses = new Float32Array(particleCount);
  const starTypes = new Uint8Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    const r = radius * Math.pow(Math.random(), 0.5);
    const armAngle = (i % arms) / arms * Math.PI * 2;
    const spinAngle = r * spin / radius;
    const angle = armAngle + spinAngle;
    
    const randX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
    const randY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.3;
    const randZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
    
    positions[i3] = Math.cos(angle) * r + randX;
    positions[i3 + 1] = randY;
    positions[i3 + 2] = Math.sin(angle) * r + randZ;
    
    const rand = Math.random();
    let starType: number;
    if (rand < 0.1) {
      starType = STAR_TYPES.BLUE_GIANT;
      masses[i] = 0.02 + Math.random() * 0.03;
    } else if (rand < 0.25) {
      starType = STAR_TYPES.RED_GIANT;
      masses[i] = 0.015 + Math.random() * 0.02;
    } else {
      starType = STAR_TYPES.MAIN_SEQUENCE;
      masses[i] = 0.005 + Math.random() * 0.01;
    }
    starTypes[i] = starType;
    
    const orbitalSpeed = Math.sqrt(mass / Math.max(r, 5)) * 0.8;
    const perpX = -Math.sin(angle);
    const perpZ = Math.cos(angle);
    
    velocities[i3] = velocity.x + perpX * orbitalSpeed;
    velocities[i3 + 1] = velocity.y + (Math.random() - 0.5) * 0.1;
    velocities[i3 + 2] = velocity.z + perpZ * orbitalSpeed;
    
    const speed = Math.sqrt(
      velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2
    );
    const normSpeed = Math.min(speed / 5, 1);
    
    const color = getStarColor(starType, hue, normSpeed);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    map: starTexture,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  
  const points = new THREE.Points(geometry, material);
  
  const heatmap = createHeatmap();
  heatmap.mesh.position.copy(position);
  
  return {
    points,
    positions,
    velocities,
    colors,
    masses,
    starTypes,
    corePosition: position.clone(),
    coreVelocity: velocity.clone(),
    mass,
    heatmapCanvas: heatmap.canvas,
    heatmapTexture: heatmap.texture,
    heatmapMesh: heatmap.mesh
  };
}

export function createCoreGlow(color: number = 0x8866ff): THREE.Points {
  const coreCount = 500;
  const positions = new Float32Array(coreCount * 3);
  const colors = new Float32Array(coreCount * 3);
  const sizes = new Float32Array(coreCount);
  
  const coreColor = new THREE.Color(color);
  
  for (let i = 0; i < coreCount; i++) {
    const i3 = i * 3;
    const r = Math.pow(Math.random(), 2) * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
    
    const intensity = 1 - r / 3;
    colors[i3] = coreColor.r * intensity;
    colors[i3 + 1] = coreColor.g * intensity;
    colors[i3 + 2] = coreColor.b * intensity;
    
    sizes[i] = 2 + intensity * 4;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  return new THREE.Points(geometry, material);
}
