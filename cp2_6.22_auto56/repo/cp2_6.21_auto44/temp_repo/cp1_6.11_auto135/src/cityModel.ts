import * as THREE from 'three';
import { scene } from './scene';

export interface BuildingData {
  id: number;
  gridX: number;
  gridZ: number;
  height: number;
  baseColor: THREE.Color;
  mesh: THREE.Mesh;
  edgeLines: THREE.LineSegments;
  glowSprite: THREE.Sprite;
  currentColor: THREE.Color;
  targetColor: THREE.Color;
  isHighlighted: boolean;
}

export let buildingMeshes: THREE.Mesh[] = [];
export let buildingDataMap: Map<THREE.Mesh, BuildingData> = new Map();
export let buildingDataArray: BuildingData[] = [];

const GRID_SIZE = 5;
const BUILDING_SPACING = 3;
const MIN_HEIGHT = 1;
const MAX_HEIGHT = 8;

export function createCity(): void {
  const startOffset = -((GRID_SIZE - 1) * BUILDING_SPACING) / 2;

  for (let gridZ = 0; gridZ < GRID_SIZE; gridZ++) {
    for (let gridX = 0; gridX < GRID_SIZE; gridX++) {
      const id = gridZ * GRID_SIZE + gridX;
      const height = Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT;
      
      const baseColor = new THREE.Color();
      const heightRatio = (height - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT);
      baseColor.lerpColors(
        new THREE.Color(0x4A90D9),
        new THREE.Color(0xD93A3A),
        heightRatio
      );

      const geometry = new THREE.BoxGeometry(1.5, height, 1.5);
      const material = new THREE.MeshStandardMaterial({
        color: baseColor.clone(),
        roughness: 0.5,
        metalness: 0.3
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        startOffset + gridX * BUILDING_SPACING,
        height / 2,
        startOffset + gridZ * BUILDING_SPACING
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.buildingId = id;
      scene.add(mesh);

      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6
      });
      const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edgeLines.position.copy(mesh.position);
      scene.add(edgeLines);

      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 256;
      glowCanvas.height = 256;
      const ctx = glowCanvas.getContext('2d')!;
      const glowGradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      glowGradient.addColorStop(0, 'rgba(74, 144, 217, 0.4)');
      glowGradient.addColorStop(0.5, 'rgba(74, 144, 217, 0.2)');
      glowGradient.addColorStop(1, 'rgba(74, 144, 217, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, 256, 256);
      
      const glowTexture = new THREE.CanvasTexture(glowCanvas);
      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const glowSprite = new THREE.Sprite(glowMaterial);
      glowSprite.position.set(
        mesh.position.x,
        0.05,
        mesh.position.z
      );
      glowSprite.scale.set(3, 3, 1);
      scene.add(glowSprite);

      const buildingData: BuildingData = {
        id,
        gridX,
        gridZ,
        height,
        baseColor: baseColor.clone(),
        mesh,
        edgeLines,
        glowSprite,
        currentColor: baseColor.clone(),
        targetColor: baseColor.clone(),
        isHighlighted: false
      };

      buildingMeshes.push(mesh);
      buildingDataMap.set(mesh, buildingData);
      buildingDataArray.push(buildingData);
    }
  }
}

export function updateBuildingColors(deltaTime: number): void {
  for (const building of buildingDataArray) {
    if (!building.currentColor.equals(building.targetColor)) {
      building.currentColor.lerp(building.targetColor, Math.min(deltaTime * 2, 1));
      (building.mesh.material as THREE.MeshStandardMaterial).color.copy(building.currentColor);
    }
  }
}

export function highlightBuilding(mesh: THREE.Mesh, isHover: boolean = true): void {
  const building = buildingDataMap.get(mesh);
  if (!building) return;

  if (isHover) {
    (building.edgeLines.material as THREE.LineBasicMaterial).color.setHex(0xffffff);
    (building.edgeLines.material as THREE.LineBasicMaterial).opacity = 1;
    (building.edgeLines.material as THREE.LineBasicMaterial).linewidth = 2;
  } else {
    const highlightColor = building.currentColor.clone();
    highlightColor.offsetHSL(0, 0.2, 0.15);
    (building.mesh.material as THREE.MeshStandardMaterial).color.copy(highlightColor);
    building.isHighlighted = true;
  }
}

export function unhighlightBuilding(mesh: THREE.Mesh, isHover: boolean = true): void {
  const building = buildingDataMap.get(mesh);
  if (!building) return;

  if (isHover) {
    (building.edgeLines.material as THREE.LineBasicMaterial).color.setHex(0x88ccff);
    (building.edgeLines.material as THREE.LineBasicMaterial).opacity = 0.6;
  } else {
    (building.mesh.material as THREE.MeshStandardMaterial).color.copy(building.currentColor);
    building.isHighlighted = false;
  }
}

export function setBuildingTargetColor(mesh: THREE.Mesh, color: THREE.Color): void {
  const building = buildingDataMap.get(mesh);
  if (building) {
    building.targetColor.copy(color);
  }
}

export function getBuildingData(mesh: THREE.Mesh): BuildingData | undefined {
  return buildingDataMap.get(mesh);
}
