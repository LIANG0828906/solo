import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export type BuildingStyle = 'box' | 'prism' | 'coneTop';

export interface BuildingParams {
  id: string;
  position: THREE.Vector3;
  targetHeight: number;
  currentHeight: number;
  width: number;
  depth: number;
  color: THREE.Color;
  style: BuildingStyle;
  floors: number;
  isGrowing: boolean;
  isRemoving: boolean;
  mesh: THREE.Group | null;
  highlightMesh: THREE.Mesh | null;
  glowLight: THREE.PointLight | null;
  particleSystem: THREE.Points | null;
}

interface BuildingFactoryOptions {
  position: THREE.Vector3;
  targetHeight: number;
  width: number;
  depth: number;
  color: THREE.Color;
  style: BuildingStyle;
}

const sharedEdgeMaterial = new THREE.LineBasicMaterial({
  color: 0x4a6cf7,
  transparent: true,
  opacity: 0.3,
});

const sharedHighlightMaterial = new THREE.MeshBasicMaterial({
  color: 0x4a6cf7,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
  depthTest: true,
});

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getMaterial(color: THREE.Color): THREE.MeshStandardMaterial {
  const key = `#${color.getHexString()}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: color.clone(),
      roughness: 0.7,
      metalness: 0.2,
      emissive: color.clone().multiplyScalar(0.08),
    });
    materialCache.set(key, mat);
  }
  return mat;
}

function createWindowTexture(width: number, height: number, color: THREE.Color): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = Math.max(64, Math.floor(64 * (height / width)));
  const ctx = canvas.getContext('2d')!;

  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  const baseR = Math.floor(color.r * 40);
  const baseG = Math.floor(color.g * 40);
  const baseB = Math.floor(color.b * 40);
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cols = 6;
  const rows = Math.floor(canvas.height / 10);
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;
  const winW = cellW * 0.5;
  const winH = cellH * 0.55;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.35) {
        const lit = Math.random();
        const wr = Math.floor(200 + lit * 55);
        const wg = Math.floor(180 + lit * 55);
        const wb = Math.floor(80 + lit * 80);
        ctx.fillStyle = `rgba(${wr},${wg},${wb},${0.6 + lit * 0.4})`;
      } else {
        ctx.fillStyle = `rgba(20,20,40,0.8)`;
      }
      const x = c * cellW + (cellW - winW) / 2;
      const y = r * cellH + (cellH - winH) / 2;
      ctx.fillRect(x, y, winW, winH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function createBuildingGeometry(
  style: BuildingStyle,
  width: number,
  depth: number,
  height: number
): THREE.BufferGeometry {
  switch (style) {
    case 'prism': {
      const shape = new THREE.Shape();
      const hw = width / 2;
      const hd = depth / 2;
      shape.moveTo(-hw, -hd);
      shape.lineTo(hw, -hd);
      shape.lineTo(0, hd);
      shape.closePath();
      const extrudeSettings = { depth: height, bevelEnabled: false };
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.rotateX(-Math.PI / 2);
      geom.translate(0, 0, 0);
      return geom;
    }
    case 'coneTop': {
      const baseGeom = new THREE.BoxGeometry(width, height * 0.75, depth);
      baseGeom.translate(0, height * 0.75 / 2, 0);
      const coneGeom = new THREE.ConeGeometry(
        Math.max(0.01, Math.min(width, depth) * 0.5),
        height * 0.25,
        4
      );
      coneGeom.rotateY(Math.PI / 4);
      coneGeom.translate(0, height * 0.75 + height * 0.25 / 2, 0);
      return mergeGeometries(baseGeom, coneGeom);
    }
    default: {
      const geom = new THREE.BoxGeometry(width, height, depth);
      geom.translate(0, height / 2, 0);
      return geom;
    }
  }
}

function mergeGeometries(a: THREE.BufferGeometry, b: THREE.BufferGeometry): THREE.BufferGeometry {
  const aPos = a.getAttribute('position') as THREE.BufferAttribute;
  const bPos = b.getAttribute('position') as THREE.BufferAttribute;
  const aNorm = a.getAttribute('normal') as THREE.BufferAttribute;
  const bNorm = b.getAttribute('normal') as THREE.BufferAttribute;
  const aUv = a.getAttribute('uv') as THREE.BufferAttribute | null;
  const bUv = b.getAttribute('uv') as THREE.BufferAttribute | null;

  const positions = new Float32Array(aPos.count * 3 + bPos.count * 3);
  const normals = new Float32Array(aNorm.count * 3 + bNorm.count * 3);
  const uvs = new Float32Array(
    (aUv ? aUv.count : 0) * 2 + (bUv ? bUv.count : 0) * 2
  );

  positions.set(new Float32Array(aPos.array), 0);
  positions.set(new Float32Array(bPos.array), aPos.count * 3);
  normals.set(new Float32Array(aNorm.array), 0);
  normals.set(new Float32Array(bNorm.array), aNorm.count * 3);

  let uvOffset = 0;
  if (aUv) {
    uvs.set(new Float32Array(aUv.array), 0);
    uvOffset = aUv.count * 2;
  }
  if (bUv) {
    uvs.set(new Float32Array(bUv.array), uvOffset);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  if (aUv || bUv) {
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  a.dispose();
  b.dispose();
  return geom;
}

function createEdgeGeometry(geometry: THREE.BufferGeometry): THREE.EdgesGeometry {
  return new THREE.EdgesGeometry(geometry, 15);
}

function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(200,220,255,0.6)');
  gradient.addColorStop(1, 'rgba(100,150,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

const sharedParticleTexture = createParticleTexture();

export function createBuildingMesh(params: BuildingFactoryOptions): BuildingParams {
  const { position, targetHeight, width, depth, color, style } = params;
  const id = uuidv4();
  const floors = Math.max(1, Math.round(targetHeight / 3));

  const group = new THREE.Group();
  group.position.copy(position);

  const geometry = createBuildingGeometry(style, width, depth, targetHeight);

  const material = getMaterial(color);
  const windowTex = createWindowTexture(width, targetHeight, color);
  const buildingMat = material.clone();
  buildingMat.emissiveMap = windowTex;
  buildingMat.emissive = new THREE.Color(0xffffff);
  buildingMat.emissiveIntensity = 0.3;
  buildingMat.map = windowTex;

  const mesh = new THREE.Mesh(geometry, buildingMat);
  group.add(mesh);

  const edgeGeom = createEdgeGeometry(geometry);
  const edgeMesh = new THREE.LineSegments(edgeGeom, sharedEdgeMaterial);
  group.add(edgeMesh);

  const highlightGeom = geometry.clone();
  const highlightMesh = new THREE.Mesh(highlightGeom, sharedHighlightMaterial);
  highlightMesh.visible = false;
  group.add(highlightMesh);

  const glowLight = new THREE.PointLight(color.clone(), 0, 8);
  glowLight.position.set(0, targetHeight + 1, 0);
  group.add(glowLight);

  const particleCount = 30;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * width * 1.5;
    particlePositions[i * 3 + 1] = Math.random() * targetHeight;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * depth * 1.5;
    particleSpeeds[i] = 0.5 + Math.random() * 1.5;
  }
  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    map: sharedParticleTexture,
    size: 0.3,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: color.clone(),
  });
  const particleSystem = new THREE.Points(particleGeom, particleMat);
  group.add(particleSystem);

  group.scale.y = 0.001;

  const building: BuildingParams = {
    id,
    position: position.clone(),
    targetHeight,
    currentHeight: 0,
    width,
    depth,
    color: color.clone(),
    style,
    floors,
    isGrowing: false,
    isRemoving: false,
    mesh: group,
    highlightMesh,
    glowLight,
    particleSystem,
  };

  (building as any)._particleSpeeds = particleSpeeds;
  (building as any)._particleMat = particleMat;

  return building;
}

export function updateBuildingHeight(building: BuildingParams, heightFraction: number): void {
  if (!building.mesh) return;
  const s = Math.max(0.001, heightFraction);
  building.mesh.scale.y = s;
  building.currentHeight = building.targetHeight * s;
}

export function setBuildingGlow(building: BuildingParams, active: boolean, intensity: number = 0): void {
  if (building.glowLight) {
    building.glowLight.intensity = active ? intensity : 0;
  }
  if (building.highlightMesh) {
    building.highlightMesh.visible = active;
  }
  const pMat = (building as any)._particleMat as THREE.PointsMaterial | undefined;
  if (pMat) {
    pMat.opacity = active ? 0.6 * intensity : 0;
  }
}

export function updateParticles(building: BuildingParams, deltaTime: number): void {
  if (!building.particleSystem) return;
  const positions = building.particleSystem.geometry.getAttribute('position') as THREE.BufferAttribute;
  const speeds = (building as any)._particleSpeeds as Float32Array;
  if (!speeds) return;

  for (let i = 0; i < positions.count; i++) {
    let y = positions.getY(i);
    y += speeds[i] * deltaTime;
    if (y > building.targetHeight) {
      y = 0;
    }
    positions.setY(i, y);
  }
  positions.needsUpdate = true;
}

export function disposeBuilding(building: BuildingParams): void {
  if (building.mesh) {
    building.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          if ((child.material as any).map) (child.material as any).map.dispose();
          if ((child.material as any).emissiveMap) (child.material as any).emissiveMap.dispose();
          child.material.dispose();
        }
      }
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
      }
      if (child instanceof THREE.Points) {
        child.geometry.dispose();
        if (child.material instanceof THREE.PointsMaterial) {
          child.material.dispose();
        }
      }
    });
  }
}

export function getHeightColor(normalizedHeight: number): THREE.Color {
  if (normalizedHeight < 0.33) {
    const t = normalizedHeight / 0.33;
    return new THREE.Color().setHSL(0.12 - t * 0.06, 0.8, 0.55);
  } else if (normalizedHeight < 0.66) {
    const t = (normalizedHeight - 0.33) / 0.33;
    return new THREE.Color().setHSL(0.06 - t * 0.04, 0.75, 0.5);
  } else {
    const t = (normalizedHeight - 0.66) / 0.34;
    return new THREE.Color().setHSL(0.65 + t * 0.1, 0.7, 0.45);
  }
}

export function randomStyle(): BuildingStyle {
  const r = Math.random();
  if (r < 0.55) return 'box';
  if (r < 0.8) return 'prism';
  return 'coneTop';
}
