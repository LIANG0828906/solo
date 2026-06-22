import * as THREE from 'three';

const STAR_COUNT = 3000;
const SPHERE_RADIUS = 60;

export function createStarField(): { points: THREE.Points; update: (time: number) => void } {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const baseSizes = new Float32Array(STAR_COUNT);
  const phases = new Float32Array(STAR_COUNT);
  const frequencies = new Float32Array(STAR_COUNT);

  const colorStart = new THREE.Color(0xaaccff);
  const colorEnd = new THREE.Color(0xffffff);

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = SPHERE_RADIUS * (0.7 + Math.random() * 0.3);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const t = Math.random();
    const color = colorStart.clone().lerp(colorEnd, t);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    const size = 0.05 + Math.random() * 0.25;
    sizes[i] = size;
    baseSizes[i] = size;

    phases[i] = Math.random() * Math.PI * 2;
    frequencies[i] = 0.5 + Math.random() * 1.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);

  const update = (time: number): void => {
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;
    for (let i = 0; i < STAR_COUNT; i++) {
      const phase = phases[i];
      const freq = frequencies[i];
      const flicker = 0.6 + 0.4 * Math.sin(time * freq + phase);
      (sizeAttr.array as Float32Array)[i] = baseSizes[i] * flicker;
    }
    sizeAttr.needsUpdate = true;
  };

  return { points, update };
}
