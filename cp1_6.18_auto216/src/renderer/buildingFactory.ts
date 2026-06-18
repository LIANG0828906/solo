import * as THREE from 'three';
import type { Building, EnergyLevel } from '@/data/buildingModel';
import { getEnergyColor } from '@/data/buildingModel';

export interface BuildingMeshGroup extends THREE.Group {
  userData: {
    buildingId: string;
    baseColor: THREE.Color;
    material: THREE.MeshStandardMaterial;
    edgeLines: THREE.LineSegments;
    topBorder: THREE.LineSegments;
  };
}

const geometryCache = new Map<string, THREE.BufferGeometry>();

function getBoxGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.BoxGeometry(w, h, d));
  }
  return geometryCache.get(key) as THREE.BoxGeometry;
}

function createGradientCanvas(baseColorHex: string, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(baseColorHex);
  const topColor = base.clone().offsetHSL(0, 0, 0.12);
  const bottomColor = base.clone().offsetHSL(0, 0, -0.15);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, `#${topColor.getHexString()}`);
  grad.addColorStop(0.5, `#${base.getHexString()}`);
  grad.addColorStop(1, `#${bottomColor.getHexString()}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  return canvas;
}

function createTopBorder(w: number, d: number, h: number): THREE.LineSegments {
  const hw = w / 2;
  const hd = d / 2;
  const y = h / 2;
  const pts: THREE.Vector3[] = [
    new THREE.Vector3(-hw, y, -hd),
    new THREE.Vector3(hw, y, -hd),
    new THREE.Vector3(hw, y, -hd),
    new THREE.Vector3(hw, y, hd),
    new THREE.Vector3(hw, y, hd),
    new THREE.Vector3(-hw, y, hd),
    new THREE.Vector3(-hw, y, hd),
    new THREE.Vector3(-hw, y, -hd),
  ];
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    linewidth: 2,
  });
  const lines = new THREE.LineSegments(geom, mat);
  (lines as any).userData = { baseOpacity: 0.75 };
  return lines;
}

function createFullEdges(w: number, h: number, d: number): THREE.LineSegments {
  const geom = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
  const mat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    linewidth: 2,
  });
  return new THREE.LineSegments(geom, mat);
}

export function applyEnergyColor(material: THREE.MeshStandardMaterial, level: EnergyLevel): void {
  const color = getEnergyColor(level);
  material.color.set(color);
  (material.userData as any).baseColor = new THREE.Color(color);
}

export function createBuildingMesh(building: Building): BuildingMeshGroup {
  const { dimensions, energyLevel, position, id } = building;
  const { width, height, depth } = dimensions;
  const geometry = getBoxGeometry(width, height, depth);
  const canvas = createGradientCanvas(getEnergyColor(energyLevel), height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.55,
    metalness: 0.15,
    transparent: false,
  });
  material.userData = {
    baseColor: new THREE.Color(getEnergyColor(energyLevel)),
    baseRoughness: 0.55,
  };
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `building-body-${id}`;
  const group = new THREE.Group() as BuildingMeshGroup;
  group.add(mesh);
  group.position.set(position.x, position.y, position.z);
  const topBorder = createTopBorder(width, depth, height);
  topBorder.name = `top-border-${id}`;
  group.add(topBorder);
  const edgeLines = createFullEdges(width, height, depth);
  edgeLines.name = `edges-${id}`;
  group.add(edgeLines);
  group.userData = {
    buildingId: id,
    baseColor: new THREE.Color(getEnergyColor(energyLevel)),
    material,
    edgeLines,
    topBorder,
  };
  (group as any).bodyMesh = mesh;
  return group;
}

export function setSolarBrightness(group: BuildingMeshGroup, intensity: number): void {
  const material = group.userData.material;
  const base = group.userData.baseColor;
  const factor = 0.55 + intensity * 0.55;
  material.color.copy(base).multiplyScalar(Math.min(1.3, factor));
  material.emissive = base.clone().multiplyScalar(Math.max(0, (intensity - 0.5) * 0.12));
  material.emissiveIntensity = Math.max(0, (intensity - 0.5) * 0.4);
  material.needsUpdate = true;
}

export function setHighlighted(group: BuildingMeshGroup, highlighted: boolean): void {
  const edges = group.userData.edgeLines;
  const target = highlighted ? 0.9 : 0;
  const current = (edges.material as THREE.LineBasicMaterial).opacity;
  (edges.material as THREE.LineBasicMaterial).opacity = current + (target - current) * 0.4;
  (edges.material as THREE.LineBasicMaterial).color.setHex(highlighted ? 0xffffff : 0xffffff);
  edges.material.needsUpdate = true;
}

export function setSelected(group: BuildingMeshGroup, selected: boolean): void {
  const edges = group.userData.edgeLines;
  const mat = edges.material as THREE.LineBasicMaterial;
  if (selected) {
    mat.opacity = 1;
    mat.color.setHex(0x00e5ff);
  }
  mat.needsUpdate = true;
}

export function updateBreathingEffect(group: BuildingMeshGroup, time: number): void {
  const top = group.userData.topBorder;
  const base = (top.userData as any).baseOpacity ?? 0.75;
  const opacity = base + Math.sin(time / 1500) * 0.15;
  (top.material as THREE.LineBasicMaterial).opacity = Math.max(0.5, Math.min(0.95, opacity));
  top.material.needsUpdate = true;
}
