import * as THREE from 'three';
import { SoundSource, Obstacle } from '../store';
import { ReflectionPath } from '../simulation/wavePhysics';

interface WaveRing {
  mesh: THREE.Mesh;
  birthTime: number;
  maxRadius: number;
  speed: number;
  sourceId: string;
}

interface ReflectionLine {
  line: THREE.Line;
  birthTime: number;
  duration: number;
}

const WAVE_RING_LIFETIME = 4000;
const WAVE_RING_INTERVAL = 600;
const REFLECTION_LINE_DURATION = 500;

let waveRings: WaveRing[] = [];
let reflectionLines: ReflectionLine[] = [];
let animationActive = false;
let lastRingTime = 0;
let sceneRef: THREE.Scene | null = null;

const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 64);
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFA726,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function createWaveRing(source: SoundSource): THREE.Mesh {
  const mesh = new THREE.Mesh(ringGeometry.clone(), ringMaterial.clone());
  mesh.position.set(source.x, 0.05, source.z);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function createReflectionLine(path: ReflectionPath): THREE.Line {
  const points: THREE.Vector3[] = [
    new THREE.Vector3(path.startX, 0.1, path.startZ),
    new THREE.Vector3(path.endX, 0.1, path.endZ),
    new THREE.Vector3(path.reflectX, 0.1, path.reflectZ),
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: 0xFFD54F,
    dashSize: 0.3,
    gapSize: 0.15,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

export function startAnimation(
  scene: THREE.Scene,
  sources: SoundSource[],
  obstacles: Obstacle[],
  reflectionPaths: ReflectionPath[]
): void {
  sceneRef = scene;
  animationActive = true;
  lastRingTime = 0;

  for (const path of reflectionPaths) {
    const line = createReflectionLine(path);
    scene.add(line);
    reflectionLines.push({
      line,
      birthTime: performance.now(),
      duration: REFLECTION_LINE_DURATION,
    });
  }
}

export function stopAnimation(): void {
  animationActive = false;

  if (sceneRef) {
    for (const ring of waveRings) {
      sceneRef.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      (ring.mesh.material as THREE.Material).dispose();
    }
    for (const ref of reflectionLines) {
      sceneRef.remove(ref.line);
      ref.line.geometry.dispose();
      (ref.line.material as THREE.Material).dispose();
    }
  }

  waveRings = [];
  reflectionLines = [];
  sceneRef = null;
}

export function updateWaveAnimation(
  scene: THREE.Scene,
  sources: SoundSource[],
  now: number
): void {
  if (!animationActive) return;

  if (now - lastRingTime > WAVE_RING_INTERVAL) {
    lastRingTime = now;
    for (const src of sources) {
      const mesh = createWaveRing(src);
      scene.add(mesh);
      waveRings.push({
        mesh,
        birthTime: now,
        maxRadius: 15,
        speed: 3,
        sourceId: src.id,
      });
    }
  }

  const deadRings: number[] = [];
  for (let i = 0; i < waveRings.length; i++) {
    const ring = waveRings[i];
    const age = now - ring.birthTime;
    const radius = (age / 1000) * ring.speed;

    if (radius > ring.maxRadius || age > WAVE_RING_LIFETIME) {
      deadRings.push(i);
      continue;
    }

    const scale = radius;
    ring.mesh.scale.set(scale, scale, 1);
    const mat = ring.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.5 * (1 - radius / ring.maxRadius);
  }

  for (let i = deadRings.length - 1; i >= 0; i--) {
    const idx = deadRings[i];
    const ring = waveRings[idx];
    scene.remove(ring.mesh);
    ring.mesh.geometry.dispose();
    (ring.mesh.material as THREE.Material).dispose();
    waveRings.splice(idx, 1);
  }

  const deadLines: number[] = [];
  for (let i = 0; i < reflectionLines.length; i++) {
    const ref = reflectionLines[i];
    const age = now - ref.birthTime;
    if (age > ref.duration) {
      deadLines.push(i);
      continue;
    }
    const mat = ref.line.material as THREE.LineDashedMaterial;
    mat.opacity = 0.8 * (1 - age / ref.duration);
  }

  for (let i = deadLines.length - 1; i >= 0; i--) {
    const idx = deadLines[i];
    const ref = reflectionLines[idx];
    scene.remove(ref.line);
    ref.line.geometry.dispose();
    (ref.line.material as THREE.Material).dispose();
    reflectionLines.splice(idx, 1);
  }
}

export function isAnimationActive(): boolean {
  return animationActive;
}
