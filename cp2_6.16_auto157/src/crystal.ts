import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export interface CrystalData {
  id: string;
  type: 'red' | 'blue' | 'green' | 'purple' | 'gold';
  shape: 'octahedron' | 'tetrahedron' | 'dodecahedron' | 'hexahedron' | 'star';
  position: THREE.Vector3;
  collected: boolean;
  mesh: THREE.Group;
  glowMesh: THREE.Mesh;
  hovered: boolean;
}

const CRYSTAL_CONFIG = [
  { type: 'red' as const, shape: 'octahedron' as const, color: 0xff3355 },
  { type: 'blue' as const, shape: 'tetrahedron' as const, color: 0x3388ff },
  { type: 'green' as const, shape: 'dodecahedron' as const, color: 0x33ff88 },
  { type: 'purple' as const, shape: 'hexahedron' as const, color: 0xaa44ff },
  { type: 'gold' as const, shape: 'star' as const, color: 0xffcc33 },
];

function createCrystalGeometry(shape: string): THREE.BufferGeometry {
  switch (shape) {
    case 'octahedron':
      return new THREE.OctahedronGeometry(0.2, 0);
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(0.2, 0);
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(0.18, 0);
    case 'hexahedron':
      return new THREE.BoxGeometry(0.28, 0.28, 0.28);
    case 'star': {
      const shape2 = new THREE.Shape();
      const outerR = 0.22;
      const innerR = 0.1;
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        if (i === 0) {
          shape2.moveTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
        } else {
          shape2.lineTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
        }
        shape2.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
      }
      shape2.closePath();
      const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 };
      return new THREE.ExtrudeGeometry(shape2, extrudeSettings);
    }
    default:
      return new THREE.OctahedronGeometry(0.2, 0);
  }
}

export function createCrystals(pathPositions: { x: number; z: number }[]): CrystalData[] {
  const crystals: CrystalData[] = [];
  const usedIndices = new Set<number>();

  const validPositions = pathPositions.filter(
    (p) => !(p.x === 0 && p.z === 0)
  );

  for (let i = 0; i < CRYSTAL_CONFIG.length; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * validPositions.length);
    } while (usedIndices.has(idx) && usedIndices.size < validPositions.length);
    usedIndices.add(idx);

    const pos = validPositions[idx];
    const config = CRYSTAL_CONFIG[i];

    const group = new THREE.Group();
    group.position.set(pos.x, 0.5, pos.z);

    const geometry = createCrystalGeometry(config.shape);
    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glowMesh);

    const pointLight = new THREE.PointLight(config.color, 0.5, 3);
    pointLight.position.set(0, 0, 0);
    group.add(pointLight);

    crystals.push({
      id: uuidv4(),
      type: config.type,
      shape: config.shape,
      position: new THREE.Vector3(pos.x, 0.5, pos.z),
      collected: false,
      mesh: group,
      glowMesh,
      hovered: false,
    });
  }

  return crystals;
}

export function updateCrystals(crystals: CrystalData[], time: number): void {
  for (const crystal of crystals) {
    if (crystal.collected) continue;

    crystal.mesh.rotation.y = time * (Math.PI / 2);
    crystal.mesh.position.y = 0.5 + Math.sin(time * 1.5) * 0.1;

    const targetScale = crystal.hovered ? 1.3 : 1.0;
    const currentScale = crystal.mesh.scale.x;
    const newScale = currentScale + (targetScale - currentScale) * 0.1;
    crystal.mesh.scale.set(newScale, newScale, newScale);

    const glowMaterial = crystal.glowMesh.material as THREE.MeshBasicMaterial;
    const targetGlowRadius = crystal.hovered ? 1.0 : 0.5;
    const currentGlowRadius = crystal.glowMesh.geometry.parameters.radius;
    const newGlowRadius = currentGlowRadius + (targetGlowRadius - currentGlowRadius) * 0.1;
    crystal.glowMesh.geometry.dispose();
    crystal.glowMesh.geometry = new THREE.SphereGeometry(newGlowRadius, 16, 16);
    glowMaterial.opacity = crystal.hovered ? 0.25 : 0.15;
  }
}

export interface ParticleBurst {
  particles: THREE.Points;
  velocities: THREE.Vector3[];
  startTime: number;
  duration: number;
  alive: boolean;
}

export function createParticleBurst(
  position: THREE.Vector3,
  color: number
): ParticleBurst {
  const count = 40;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const velocities: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;

    sizes[i] = 0.05 + Math.random() * 0.1;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 1.5 + Math.random() * 2.0;
    velocities.push(
      new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed * 0.5 + 1.0,
        Math.cos(phi) * speed
      )
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color,
    size: 0.1,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);

  return {
    particles,
    velocities,
    startTime: performance.now() / 1000,
    duration: 0.8,
    alive: true,
  };
}

export function updateParticleBursts(bursts: ParticleBurst[], time: number): void {
  for (const burst of bursts) {
    if (!burst.alive) continue;

    const elapsed = time - burst.startTime;
    if (elapsed >= burst.duration) {
      burst.alive = false;
      continue;
    }

    const progress = elapsed / burst.duration;
    const positions = burst.particles.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < burst.velocities.length; i++) {
      positions.array[i * 3] += burst.velocities[i].x * 0.016;
      positions.array[i * 3 + 1] += burst.velocities[i].y * 0.016;
      positions.array[i * 3 + 2] += burst.velocities[i].z * 0.016;
      burst.velocities[i].y -= 3.0 * 0.016;
    }

    positions.needsUpdate = true;

    const material = burst.particles.material as THREE.PointsMaterial;
    material.opacity = 1.0 - progress;
  }
}
