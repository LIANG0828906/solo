import * as THREE from 'three';
import { scene } from './scene';
import { buildingMeshes, buildingDataMap, setBuildingTargetColor, buildingDataArray } from './cityModel';

export type HeatType = 'population' | 'energy' | 'traffic';

export interface ParticleData {
  buildingId: number;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export const heatTypes: { value: HeatType; label: string }[] = [
  { value: 'population', label: '人口密度' },
  { value: 'energy', label: '能耗' },
  { value: 'traffic', label: '交通流量' }
];

export let currentHeatType: HeatType = 'population';
export let currentHour: number = 12;

interface HeatmapData {
  [type: string]: {
    [buildingId: number]: number[];
  };
}

interface BuildingParticles {
  points: THREE.Points;
  particleData: ParticleData[];
  maxParticles: number;
}

let heatmapData: HeatmapData;
let buildingParticlesMap: Map<number, BuildingParticles> = new Map();
let particleTexture: THREE.Texture;

const COLOR_LOW = new THREE.Color(0x0066CC);
const COLOR_MID = new THREE.Color(0xFF9900);
const COLOR_HIGH = new THREE.Color(0xFF3300);
const MAX_PARTICLES_PER_BUILDING = 200;
const TOTAL_BUILDINGS = 25;

export function initHeatmap(): void {
  generateHeatmapData();
  createParticleTexture();
  createParticleSystems();
  updateHeatmapData(currentHour);
}

function generateHeatmapData(): void {
  heatmapData = {};
  
  for (const type of heatTypes) {
    heatmapData[type.value] = {};
    
    for (let buildingId = 0; buildingId < TOTAL_BUILDINGS; buildingId++) {
      heatmapData[type.value][buildingId] = generateBuildingHeatData(buildingId, type.value);
    }
  }
}

function generateBuildingHeatData(buildingId: number, type: HeatType): number[] {
  const data: number[] = [];
  const seed = buildingId * 0.1;
  const baseValue = Math.sin(seed) * 0.3 + 0.5;
  
  for (let hour = 0; hour < 24; hour++) {
    let timeFactor = 0;
    
    if (type === 'population') {
      if (hour >= 7 && hour <= 9) timeFactor = 0.8;
      else if (hour >= 12 && hour <= 14) timeFactor = 0.6;
      else if (hour >= 17 && hour <= 20) timeFactor = 0.9;
      else if (hour >= 22 || hour <= 5) timeFactor = 0.15;
      else timeFactor = 0.4;
    } else if (type === 'energy') {
      if (hour >= 8 && hour <= 18) timeFactor = 0.85;
      else if (hour >= 6 && hour < 8) timeFactor = 0.5;
      else if (hour >= 19 && hour <= 22) timeFactor = 0.7;
      else timeFactor = 0.25;
    } else if (type === 'traffic') {
      if (hour >= 7 && hour <= 9) timeFactor = 0.95;
      else if (hour >= 11 && hour <= 13) timeFactor = 0.65;
      else if (hour >= 17 && hour <= 19) timeFactor = 0.9;
      else if (hour >= 21 || hour <= 5) timeFactor = 0.1;
      else timeFactor = 0.45;
    }
    
    const randomVariation = (Math.random() - 0.5) * 0.2;
    let value = baseValue * timeFactor + randomVariation;
    value = Math.max(0, Math.min(1, value));
    data.push(value);
  }
  
  return data;
}

function createParticleTexture(): void {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.5)');
  gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  particleTexture = new THREE.CanvasTexture(canvas);
}

function createParticleSystems(): void {
  for (const mesh of buildingMeshes) {
    const buildingId = mesh.userData.buildingId;
    const buildingData = buildingDataMap.get(mesh);
    if (!buildingData) continue;
    
    const positions = new Float32Array(MAX_PARTICLES_PER_BUILDING * 3);
    const colors = new Float32Array(MAX_PARTICLES_PER_BUILDING * 3);
    const sizes = new Float32Array(MAX_PARTICLES_PER_BUILDING);
    const particleData: ParticleData[] = [];
    
    for (let i = 0; i < MAX_PARTICLES_PER_BUILDING; i++) {
      const i3 = i * 3;
      positions[i3] = buildingData.mesh.position.x + (Math.random() - 0.5) * 0.8;
      positions[i3 + 1] = buildingData.height + Math.random() * 2;
      positions[i3 + 2] = buildingData.mesh.position.z + (Math.random() - 0.5) * 0.8;
      
      colors[i3] = 1;
      colors[i3 + 1] = 0.6;
      colors[i3 + 2] = 0;
      
      sizes[i] = Math.random() * 0.3 + 0.1;
      
      particleData.push({
        buildingId,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.03 + 0.01,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random() * 2,
        maxLife: 2 + Math.random() * 2
      });
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    points.visible = false;
    scene.add(points);
    
    buildingParticlesMap.set(buildingId, {
      points,
      particleData,
      maxParticles: MAX_PARTICLES_PER_BUILDING
    });
  }
}

export function getHeatColor(value: number): THREE.Color {
  const color = new THREE.Color();
  
  if (value <= 0.5) {
    const t = value / 0.5;
    color.lerpColors(COLOR_LOW, COLOR_MID, t);
  } else {
    const t = (value - 0.5) / 0.5;
    color.lerpColors(COLOR_MID, COLOR_HIGH, t);
  }
  
  return color;
}

export function getHeatValue(buildingId: number, hour: number = currentHour, type: HeatType = currentHeatType): number {
  return heatmapData[type][buildingId][hour];
}

export function updateHeatmapData(hour: number): void {
  currentHour = hour;
  
  for (const mesh of buildingMeshes) {
    const buildingId = mesh.userData.buildingId;
    const value = getHeatValue(buildingId, hour);
    const color = getHeatColor(value);
    setBuildingTargetColor(mesh, color);
    updateBuildingParticles(buildingId, value, color);
  }
}

function updateBuildingParticles(buildingId: number, heatValue: number, color: THREE.Color): void {
  const particleSystem = buildingParticlesMap.get(buildingId);
  if (!particleSystem) return;
  
  const visibleCount = Math.floor(heatValue * MAX_PARTICLES_PER_BUILDING);
  particleSystem.points.visible = heatValue > 0.1;
  
  const colors = particleSystem.points.geometry.attributes.color.array as Float32Array;
  
  for (let i = 0; i < particleSystem.maxParticles; i++) {
    const i3 = i * 3;
    if (i < visibleCount) {
      const variation = (Math.random() - 0.5) * 0.2;
      colors[i3] = color.r + variation;
      colors[i3 + 1] = color.g + variation;
      colors[i3 + 2] = color.b + variation;
    } else {
      colors[i3] = 0;
      colors[i3 + 1] = 0;
      colors[i3 + 2] = 0;
    }
  }
  
  particleSystem.points.geometry.attributes.color.needsUpdate = true;
}

export function updateParticles(deltaTime: number): void {
  for (const [buildingId, particleSystem] of buildingParticlesMap) {
    const buildingData = buildingDataArray[buildingId];
    if (!buildingData) continue;
    
    const positions = particleSystem.points.geometry.attributes.position.array as Float32Array;
    const heatValue = getHeatValue(buildingId);
    const visibleCount = Math.floor(heatValue * MAX_PARTICLES_PER_BUILDING);
    
    for (let i = 0; i < visibleCount; i++) {
      const i3 = i * 3;
      const particleData = particleSystem.particleData[i];
      
      particleData.life += deltaTime;
      
      if (particleData.life >= particleData.maxLife) {
        positions[i3] = buildingData.mesh.position.x + (Math.random() - 0.5) * 0.8;
        positions[i3 + 1] = buildingData.height + Math.random() * 0.5;
        positions[i3 + 2] = buildingData.mesh.position.z + (Math.random() - 0.5) * 0.8;
        particleData.life = 0;
        particleData.maxLife = 2 + Math.random() * 2;
      } else {
        positions[i3] += particleData.velocity.x + Math.sin(Date.now() * 0.001 + i) * 0.005;
        positions[i3 + 1] += particleData.velocity.y;
        positions[i3 + 2] += particleData.velocity.z + Math.cos(Date.now() * 0.001 + i) * 0.005;
      }
    }
    
    particleSystem.points.geometry.attributes.position.needsUpdate = true;
  }
}

export function switchHeatType(type: HeatType): void {
  currentHeatType = type;
  updateHeatmapData(currentHour);
}

export function getHeatTypeLabel(type: HeatType = currentHeatType): string {
  return heatTypes.find(t => t.value === type)?.label || '';
}
