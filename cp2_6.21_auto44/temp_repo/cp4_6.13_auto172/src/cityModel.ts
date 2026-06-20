import * as THREE from 'three';

const GRID_SIZE = 8;
const BLOCK_SIZE = 10;
const BLOCK_GAP = 2;
const MIN_BUILDING_HEIGHT = 5;
const MAX_BUILDING_HEIGHT = 50;
const MAX_HEAT_HEIGHT = 40;

let cityGroup: THREE.Group;
let buildingHeights: number[][] = [];
let blockFlows: number[][] = [];
let buildingMeshes: THREE.Mesh[][] = [];
let heatColumns: THREE.Mesh[][] = [];
let glowRings: THREE.Mesh[][] = [];
let introAnimationProgress = 0;
let introAnimationComplete = false;

const blockNames: string[][] = [];

export function getCityGroup(): THREE.Group {
  return cityGroup;
}

export function buildCity(scene: THREE.Scene, flowData: number[][]): void {
  cityGroup = new THREE.Group();
  
  const totalSize = GRID_SIZE * BLOCK_SIZE + (GRID_SIZE - 1) * BLOCK_GAP;
  const offset = -totalSize / 2 + BLOCK_SIZE / 2;

  for (let row = 0; row < GRID_SIZE; row++) {
    buildingHeights[row] = [];
    blockFlows[row] = [];
    buildingMeshes[row] = [];
    heatColumns[row] = [];
    glowRings[row] = [];
    blockNames[row] = [];
    
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = offset + col * (BLOCK_SIZE + BLOCK_GAP);
      const z = offset + row * (BLOCK_SIZE + BLOCK_GAP);
      
      const height = MIN_BUILDING_HEIGHT + Math.random() * (MAX_BUILDING_HEIGHT - MIN_BUILDING_HEIGHT);
      buildingHeights[row][col] = height;
      blockFlows[row][col] = flowData[row][col];
      
      const rowLabel = String.fromCharCode(65 + row);
      const colLabel = (col + 1).toString().padStart(2, '0');
      blockNames[row][col] = `${rowLabel}-${colLabel}`;
      
      const building = createBuilding(height, flowData[row][col]);
      building.position.set(x, height / 2, z);
      building.userData.row = row;
      building.userData.col = col;
      building.userData.isBuilding = true;
      building.userData.targetColor = getFlowColor(flowData[row][col]);
      building.scale.y = 0;
      buildingMeshes[row][col] = building;
      cityGroup.add(building);
      
      const heatColumn = createHeatColumn(flowData[row][col], height);
      heatColumn.position.set(x, height, z);
      heatColumn.userData.row = row;
      heatColumn.userData.col = col;
      heatColumn.userData.heatColumn = true;
      heatColumn.userData.baseHeight = MAX_HEAT_HEIGHT;
      heatColumn.userData.buildingHeight = height;
      heatColumn.userData.targetHeight = flowData[row][col] / 100;
      heatColumn.scale.y = 0;
      heatColumns[row][col] = heatColumn;
      cityGroup.add(heatColumn);
      
      const glowRing = createGlowRing();
      glowRing.position.set(x, 0.1, z);
      glowRing.userData.row = row;
      glowRing.userData.col = col;
      glowRing.userData.glowRing = true;
      glowRing.visible = false;
      glowRings[row][col] = glowRing;
      cityGroup.add(glowRing);
    }
  }

  scene.add(cityGroup);
  
  introAnimationProgress = 0;
  introAnimationComplete = false;
}

function createBuilding(height: number, flow: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.85, height, BLOCK_SIZE * 0.85);
  
  const color = getFlowColor(flow);
  
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.3,
    metalness: 0.7,
    emissive: color.clone().multiplyScalar(0.15),
    emissiveIntensity: 0.5
  });

  const building = new THREE.Mesh(geometry, material);
  building.castShadow = true;
  building.receiveShadow = true;

  return building;
}

function createHeatColumn(flow: number, buildingHeight: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(
    BLOCK_SIZE * 0.3,
    BLOCK_SIZE * 0.4,
    MAX_HEAT_HEIGHT,
    16,
    1,
    true
  );
  
  const color = getFlowColor(flow);
  
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });

  const column = new THREE.Mesh(geometry, material);
  
  return column;
}

function createGlowRing(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(BLOCK_SIZE * 0.5, BLOCK_SIZE * 0.65, 32);
  
  const material = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  
  return ring;
}

function getFlowColor(flow: number): THREE.Color {
  const t = Math.max(0, Math.min(1, flow / 100));
  
  const r = Math.round(t * 255);
  const g = Math.round((1 - t) * 255);
  const b = 0;
  
  return new THREE.Color(r / 255, g / 255, b / 255);
}

export function updateBlockFlow(row: number, col: number, flow: number): void {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
  
  blockFlows[row][col] = flow;
  
  const color = getFlowColor(flow);
  
  if (buildingMeshes[row][col]) {
    buildingMeshes[row][col].userData.targetColor = color;
  }
  
  if (heatColumns[row][col]) {
    heatColumns[row][col].userData.targetHeight = flow / 100;
    const heatMaterial = heatColumns[row][col].material as THREE.MeshBasicMaterial;
    heatMaterial.color.lerp(color, 0.1);
  }
}

export function updateAllFlows(flowData: number[][]): void {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      updateBlockFlow(row, col, flowData[row][col]);
    }
  }
}

export function updateBlockData(delta: number): void {
  if (!introAnimationComplete) {
    introAnimationProgress += delta / 0.8;
    
    if (introAnimationProgress >= 1) {
      introAnimationProgress = 1;
      introAnimationComplete = true;
    }
    
    const eased = easeOutCubic(introAnimationProgress);
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const delay = (row + col) * 0.03;
        const progress = Math.max(0, Math.min(1, (introAnimationProgress - delay) / (1 - delay)));
        const easedProgress = easeOutCubic(progress);
        
        if (buildingMeshes[row][col]) {
          buildingMeshes[row][col].scale.y = easedProgress;
        }
        if (heatColumns[row][col]) {
          heatColumns[row][col].scale.y = easedProgress * (blockFlows[row][col] / 100);
        }
      }
    }
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function getBlockByMesh(mesh: THREE.Mesh): { row: number; col: number; flow: number; name: string } | null {
  const row = mesh.userData.row;
  const col = mesh.userData.col;
  
  if (row !== undefined && col !== undefined) {
    return {
      row,
      col,
      flow: blockFlows[row][col],
      name: blockNames[row][col]
    };
  }
  
  return null;
}

export function highlightBlock(row: number, col: number): void {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
  
  if (glowRings[row][col]) {
    glowRings[row][col].visible = true;
  }
}

export function removeHighlight(row: number, col: number): void {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
  
  if (glowRings[row][col]) {
    glowRings[row][col].visible = false;
  }
}

export function getBlockFlow(row: number, col: number): number {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return 0;
  return blockFlows[row][col];
}

export function getBlockName(row: number, col: number): string {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return '';
  return blockNames[row][col];
}
