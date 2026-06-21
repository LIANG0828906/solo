import * as THREE from 'three';
import { scene } from './scene';

type TimeUpdateCallback = (timeHours: number) => void;

export let currentTime: number = 0;
export let playbackSpeed: number = 10;
export let isPlaying: boolean = true;

let progressRingMesh: THREE.Mesh | null = null;
let timeUpdateCallbacks: TimeUpdateCallback[] = [];
let lastFrameTime: number = 0;

export function initTimeline(): void {
  createProgressRing();
  lastFrameTime = performance.now();
}

function createProgressRing(): void {
  const innerRadius = 54.5;
  const outerRadius = 55.5;
  const segments = 128;

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    vertices.push(
      cos * innerRadius,
      0.02,
      sin * innerRadius,
      cos * outerRadius,
      0.02,
      sin * outerRadius
    );

    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });

  progressRingMesh = new THREE.Mesh(geometry, material);
  progressRingMesh.rotation.x = -Math.PI / 2;
  progressRingMesh.position.y = -0.45;
  scene.add(progressRingMesh);
}

export function updateProgressRing(progress: number): void {
  if (!progressRingMesh) return;

  const geometry = progressRingMesh.geometry as THREE.BufferGeometry;
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const array = positions.array as Float32Array;

  const innerRadius = 54.5;
  const outerRadius = 55.5;
  const fullSegments = 128;
  const activeSegments = Math.floor(progress * fullSegments);

  for (let i = 0; i <= fullSegments; i++) {
    const angle = (i / fullSegments) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const isActive = i <= activeSegments;
    const yPos = isActive ? 0.05 : 0.02;

    array[i * 6] = cos * innerRadius;
    array[i * 6 + 1] = yPos;
    array[i * 6 + 2] = sin * innerRadius;
    array[i * 6 + 3] = cos * outerRadius;
    array[i * 6 + 4] = yPos;
    array[i * 6 + 5] = sin * outerRadius;
  }

  positions.needsUpdate = true;

  const material = progressRingMesh.material as THREE.MeshBasicMaterial;
  material.opacity = 0.6 + Math.sin(performance.now() / 500) * 0.1;
}

export function updateTimeline(deltaTime: number): void {
  if (!isPlaying) return;

  const hoursPerSecond = playbackSpeed / 3600;
  currentTime += deltaTime * hoursPerSecond * 1000;

  if (currentTime >= 24) {
    currentTime = 0;
  }

  const progress = currentTime / 24;
  updateProgressRing(progress);

  timeUpdateCallbacks.forEach((callback) => {
    callback(currentTime);
  });
}

export function setSpeed(speed: number): void {
  playbackSpeed = Math.max(0.5, Math.min(20, speed));
}

export function setTime(timeHours: number): void {
  currentTime = Math.max(0, Math.min(24, timeHours));
  const progress = currentTime / 24;
  updateProgressRing(progress);

  timeUpdateCallbacks.forEach((callback) => {
    callback(currentTime);
  });
}

export function resetTimeline(): void {
  currentTime = 0;
  isPlaying = true;
  updateProgressRing(0);

  timeUpdateCallbacks.forEach((callback) => {
    callback(0);
  });
}

export function pause(): void {
  isPlaying = false;
}

export function play(): void {
  isPlaying = true;
  lastFrameTime = performance.now();
}

export function togglePlay(): void {
  isPlaying = !isPlaying;
  if (isPlaying) {
    lastFrameTime = performance.now();
  }
}

export function onTimeUpdate(callback: TimeUpdateCallback): void {
  timeUpdateCallbacks.push(callback);
}

export function formatTime(timeHours: number): string {
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function getProgress(): number {
  return currentTime / 24;
}
