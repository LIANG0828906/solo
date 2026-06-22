import * as THREE from 'three';
import type { StarParams } from './store';

export interface PlanetInfo {
  id: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  mass: string;
  atmosphere: string;
  angle: number;
}

export interface PlanetSystem {
  group: THREE.Group;
  planets: Array<{ mesh: THREE.Mesh; info: PlanetInfo }>;
  orbits: THREE.Line[];
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const lerpColor = (c1: string, c2: string, t: number): string => {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t)
  );
};

const ATMOSPHERES = [
  'H₂/He',
  'CO₂/N₂',
  'N₂/O₂',
  'CH₄/NH₃',
  'H₂O/CO₂',
  'Ar/N₂',
  'CO/H₂',
  'O₃/O₂'
];

const MASS_PREFIX = [
  '0.05 M⊕',
  '0.3 M⊕',
  '1.2 M⊕',
  '3.8 M⊕',
  '12 M⊕',
  '35 M⊕',
  '80 M⊕',
  '200 M⊕'
];

export const generatePlanetSystem = (starParams: StarParams): PlanetSystem => {
  const group = new THREE.Group();
  group.name = 'planetSystem';

  const numPlanets = Math.floor(Math.random() * 8) + 1;
  const planets: Array<{ mesh: THREE.Mesh; info: PlanetInfo }> = [];
  const orbits: THREE.Line[] = [];

  const hasLife = starParams.mass >= 0.8 && starParams.mass <= 2;
  const actualPlanets = hasLife ? numPlanets : Math.max(1, Math.floor(numPlanets * 0.6));

  for (let i = 0; i < actualPlanets; i++) {
    const orbitRadius = 3 + (i + 1) * (12 / actualPlanets) + (Math.random() - 0.5) * 0.8;
    const t = i / Math.max(1, actualPlanets - 1);
    const color = lerpColor('#E67E22', '#2ECC71', t);
    const radius = 0.05 + Math.random() * 0.15;
    const orbitSpeed = (0.2 + Math.random() * 0.6) / (orbitRadius * 0.3);
    const angle = Math.random() * Math.PI * 2;

    const info: PlanetInfo = {
      id: `planet-${i}-${Date.now()}`,
      radius,
      orbitRadius,
      orbitSpeed,
      color,
      mass: MASS_PREFIX[Math.floor(Math.random() * MASS_PREFIX.length)],
      atmosphere: ATMOSPHERES[Math.floor(Math.random() * ATMOSPHERES.length)],
      angle
    };

    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints: THREE.Vector3[] = [];
    const segments = 128;
    for (let j = 0; j <= segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x7F8C8D, transparent: true, opacity: 0.6 });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    group.add(orbit);
    orbits.push(orbit);

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.8,
      metalness: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { planetInfo: info };
    const px = Math.cos(angle) * orbitRadius;
    const pz = Math.sin(angle) * orbitRadius;
    mesh.position.set(px, 0, pz);
    group.add(mesh);
    planets.push({ mesh, info });
  }

  return { group, planets, orbits };
};

export const updatePlanetAnimation = (
  system: PlanetSystem,
  delta: number
): void => {
  for (const { mesh, info } of system.planets) {
    info.angle += info.orbitSpeed * delta;
    const x = Math.cos(info.angle) * info.orbitRadius;
    const z = Math.sin(info.angle) * info.orbitRadius;
    mesh.position.set(x, 0, z);
  }
  for (const orbit of system.orbits) {
    orbit.rotation.y += delta * 0.02;
  }
};
