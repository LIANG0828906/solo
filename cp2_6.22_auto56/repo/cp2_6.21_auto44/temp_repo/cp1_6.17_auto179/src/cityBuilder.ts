import * as THREE from 'three';
import gsap from 'gsap';

export type BuildingStyle = 'modern-glass' | 'classical-stone' | 'future-streamline';

export interface BuildingData {
  id: string;
  name: string;
  group: THREE.Group;
  floors: number;
  height: number;
  style: BuildingStyle;
  position: THREE.Vector3;
  growthProgress: number;
  isGrowing: boolean;
  birthYear: number;
  highlightMesh: THREE.LineSegments | null;
  materials: THREE.MeshStandardMaterial[];
}

interface StyleConfig {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  opacity: number;
  floorColor: THREE.Color;
}

const STYLE_CONFIGS: Record<BuildingStyle, StyleConfig> = {
  'modern-glass': {
    color: new THREE.Color(0x3a5f8a),
    emissive: new THREE.Color(0x1a3f6a),
    emissiveIntensity: 0.15,
    roughness: 0.1,
    metalness: 0.9,
    opacity: 0.85,
    floorColor: new THREE.Color(0x4a7faa),
  },
  'classical-stone': {
    color: new THREE.Color(0x8a7a6a),
    emissive: new THREE.Color(0x2a2018),
    emissiveIntensity: 0.05,
    roughness: 0.85,
    metalness: 0.05,
    opacity: 1.0,
    floorColor: new THREE.Color(0x9a8a7a),
  },
  'future-streamline': {
    color: new THREE.Color(0x2a6a7a),
    emissive: new THREE.Color(0x0a4a5a),
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.6,
    opacity: 0.9,
    floorColor: new THREE.Color(0x3a8a9a),
  },
};

const BUILDING_NAMES = [
  '未来大厦', '云端中心', '星辰塔', '天际楼', '新界广场',
  '量子大厦', '银河中心', '鹏程楼', '东方之门', '云端塔',
  '翡翠中心', '金沙大厦', '碧海楼', '紫金塔', '龙腾广场',
  '凤翔大厦', '鸿运中心', '宏图楼', '盛世塔', '锦绣广场',
  '明珠大厦', '明珠中心', '望江楼', '揽月塔', '朝阳广场',
  '长虹大厦', '凌云中心', '摩天楼', '彩虹塔', '星河广场',
  '梦幻大厦', '极光中心', '曙光楼', '晨曦塔', '启航广场',
  '飞天大厦', '鹏翼中心', '瑞云楼', '祥龙塔', '鸿鹄广场',
  '紫微大厦', '太微中心', '天璇楼', '玉衡塔', '开阳广场',
  '摇光大厦', '天枢中心', '天玑楼', '天权塔', '瑶光广场',
];

let buildingCounter = 0;
let buildings: BuildingData[] = [];
let scene: THREE.Scene;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let onBuildingClick: ((building: BuildingData) => void) | null = null;
let growthTimeline: gsap.core.Timeline | null = null;
let isPlaying = false;

const GRID_SIZE = 40;
const CELL_SIZE = 4;
const FLOOR_HEIGHT = 1.2;

export function initCityBuilder(sceneRef: THREE.Scene): void {
  scene = sceneRef;
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  buildings = [];
  buildingCounter = 0;

  window.addEventListener('click', onCanvasClick);
}

export function setOnBuildingClick(callback: (building: BuildingData) => void): void {
  onBuildingClick = callback;
}

function getBuildingPositions(density: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const half = GRID_SIZE / 2;
  const occupied = new Set<string>();

  const totalCells = (GRID_SIZE / CELL_SIZE) * (GRID_SIZE / CELL_SIZE);
  const targetCount = Math.floor(totalCells * density * 0.3);

  for (let i = 0; i < targetCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const cx = Math.floor(Math.random() * (GRID_SIZE / CELL_SIZE));
      const cz = Math.floor(Math.random() * (GRID_SIZE / CELL_SIZE));
      const key = `${cx},${cz}`;
      if (!occupied.has(key)) {
        occupied.add(key);
        const x = -half + cx * CELL_SIZE + CELL_SIZE / 2;
        const z = -half + cz * CELL_SIZE + CELL_SIZE / 2;
        if (Math.abs(x) < half - 1 && Math.abs(z) < half - 1) {
          positions.push(new THREE.Vector3(x, 0, z));
        }
        break;
      }
      attempts++;
    }
  }

  return positions;
}

function createBuildingMesh(
  position: THREE.Vector3,
  floors: number,
  style: BuildingStyle
): { group: THREE.Group; materials: THREE.MeshStandardMaterial[] } {
  const config = STYLE_CONFIGS[style];
  const group = new THREE.Group();
  const materials: THREE.MeshStandardMaterial[] = [];
  const baseWidth = 2 + Math.random() * 2;
  const baseDepth = 2 + Math.random() * 2;

  for (let f = 0; f < floors; f++) {
    const floorWidth = baseWidth * (1 - f * 0.008);
    const floorDepth = baseDepth * (1 - f * 0.008);

    const geo = new THREE.BoxGeometry(
      Math.max(0.5, floorWidth),
      FLOOR_HEIGHT * 0.9,
      Math.max(0.5, floorDepth)
    );

    const isEdge = f === 0 || f === floors - 1;
    const mat = new THREE.MeshStandardMaterial({
      color: isEdge ? config.floorColor.clone() : config.color.clone(),
      emissive: config.emissive.clone(),
      emissiveIntensity: config.emissiveIntensity,
      roughness: config.roughness,
      metalness: config.metalness,
      transparent: config.opacity < 1,
      opacity: config.opacity,
    });
    materials.push(mat);

    const floorMesh = new THREE.Mesh(geo, mat);
    floorMesh.position.y = f * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    floorMesh.userData = { floorIndex: f, buildingId: '' };
    group.add(floorMesh);

    if (f > 0 && f % 5 === 0) {
      const lineGeo = new THREE.BoxGeometry(floorWidth + 0.1, 0.05, floorDepth + 0.1);
      const lineMat = new THREE.MeshStandardMaterial({
        color: config.emissive.clone(),
        emissive: config.emissive.clone(),
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
      });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.y = f * FLOOR_HEIGHT;
      group.add(lineMesh);
    }
  }

  group.position.copy(position);
  group.visible = false;

  return { group, materials };
}

export function generateBuildings(
  height: number,
  density: number,
  style: BuildingStyle
): BuildingData[] {
  clearBuildings();

  const positions = getBuildingPositions(density);
  const floors = Math.floor(height / FLOOR_HEIGHT);

  positions.forEach((pos, index) => {
    const variedFloors = Math.max(3, floors + Math.floor((Math.random() - 0.5) * floors * 0.4));
    const { group, materials } = createBuildingMesh(pos, variedFloors, style);

    const id = `building-${buildingCounter++}`;
    group.userData = { buildingId: id };
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.userData.buildingId = id;
      }
    });

    const building: BuildingData = {
      id,
      name: `${BUILDING_NAMES[index % BUILDING_NAMES.length]}${String.fromCharCode(65 + (index % 26))}`,
      group,
      floors: variedFloors,
      height: variedFloors * FLOOR_HEIGHT,
      style,
      position: pos.clone(),
      growthProgress: 0,
      isGrowing: false,
      birthYear: 2024 + index,
      highlightMesh: null,
      materials,
    };

    buildings.push(building);
    scene.add(group);
  });

  return buildings;
}

export function clearBuildings(): void {
  buildings.forEach(b => {
    if (b.highlightMesh) {
      b.group.remove(b.highlightMesh);
      b.highlightMesh.geometry.dispose();
      (b.highlightMesh.material as THREE.Material).dispose();
    }
    b.group.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    scene.remove(b.group);
  });
  buildings = [];
  if (growthTimeline) {
    growthTimeline.kill();
    growthTimeline = null;
  }
}

export function startGrowthAnimation(
  onProgress?: (progress: number, year: number) => void
): void {
  if (growthTimeline) {
    growthTimeline.kill();
  }

  isPlaying = true;
  growthTimeline = gsap.timeline({
    onComplete: () => {
      isPlaying = false;
    },
  });

  const startYear = 2024;
  const endYear = 2050;

  buildings.forEach((building, index) => {
    building.group.visible = true;
    building.group.scale.y = 0.001;

    const delay = index * 0.15;
    const duration = building.floors * 0.5;
    const yearSpan = endYear - startYear;
    const buildingStartYear = startYear + (delay / (buildings.length * 0.15 + duration)) * yearSpan * 0.5;

    growthTimeline!.to(
      building.group.scale,
      {
        y: 1,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          building.growthProgress = building.group.scale.y;
        },
      },
      delay
    );

    building.isGrowing = true;
    building.birthYear = Math.floor(buildingStartYear);
  });

  growthTimeline.eventCallback('onUpdate', () => {
    if (growthTimeline && onProgress) {
      const progress = growthTimeline.progress();
      const year = Math.floor(startYear + progress * (endYear - startYear));
      onProgress(progress, year);
    }
  });
}

export function pauseGrowthAnimation(): void {
  if (growthTimeline) {
    growthTimeline.pause();
    isPlaying = false;
  }
}

export function resumeGrowthAnimation(): void {
  if (growthTimeline) {
    growthTimeline.resume();
    isPlaying = true;
  }
}

export function setGrowthProgress(progress: number, onProgress?: (progress: number, year: number) => void): void {
  if (growthTimeline) {
    growthTimeline.progress(progress);
    const startYear = 2024;
    const endYear = 2050;
    const year = Math.floor(startYear + progress * (endYear - startYear));
    if (onProgress) onProgress(progress, year);
  }
}

export function isAnimationPlaying(): boolean {
  return isPlaying;
}

export function getGrowthProgress(): number {
  return growthTimeline ? growthTimeline.progress() : 0;
}

export function highlightBuilding(building: BuildingData): void {
  clearHighlight();
  const box = new THREE.Box3().setFromObject(building.group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x + 0.2, size.y + 0.2, size.z + 0.2));
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xFFD54F,
    linewidth: 1.5,
    transparent: true,
    opacity: 1,
  });
  const edgesMesh = new THREE.LineSegments(edgesGeo, edgesMat);
  edgesMesh.position.copy(center);
  edgesMesh.position.sub(building.group.position);
  building.group.add(edgesMesh);
  building.highlightMesh = edgesMesh;

  gsap.to(edgesMat, {
    opacity: 0.3,
    duration: 0.8,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

export function clearHighlight(): void {
  buildings.forEach(b => {
    if (b.highlightMesh) {
      gsap.killTweensOf(b.highlightMesh.material);
      b.group.remove(b.highlightMesh);
      b.highlightMesh.geometry.dispose();
      (b.highlightMesh.material as THREE.Material).dispose();
      b.highlightMesh = null;
    }
  });
}

export function removeBuilding(building: BuildingData, onComplete?: () => void): void {
  gsap.to(building.group.scale, {
    x: 0.001,
    y: 0.001,
    z: 0.001,
    duration: 0.3,
    ease: 'back.in(2)',
    onComplete: () => {
      if (building.highlightMesh) {
        gsap.killTweensOf(building.highlightMesh.material);
        building.group.remove(building.highlightMesh);
        building.highlightMesh.geometry.dispose();
        (building.highlightMesh.material as THREE.Material).dispose();
      }
      building.group.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(building.group);
      buildings = buildings.filter(b => b.id !== building.id);
      if (onComplete) onComplete();
    },
  });
}

export function transitionStyle(newStyle: BuildingStyle): void {
  const config = STYLE_CONFIGS[newStyle];

  buildings.forEach(building => {
    building.style = newStyle;
    building.materials.forEach((mat, index) => {
      const isEdge = index === 0 || index === building.materials.length - 1;
      const targetColor = isEdge ? config.floorColor : config.color;

      gsap.to(mat.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.5,
        ease: 'power2.inOut',
      });
      gsap.to(mat.emissive, {
        r: config.emissive.r,
        g: config.emissive.g,
        b: config.emissive.b,
        duration: 0.5,
        ease: 'power2.inOut',
      });
      gsap.to(mat, {
        roughness: config.roughness,
        metalness: config.metalness,
        opacity: config.opacity,
        duration: 0.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          mat.emissiveIntensity = config.emissiveIntensity;
        },
      });
    });
  });
}

export function getBuildings(): BuildingData[] {
  return buildings;
}

export function getBuildingById(id: string): BuildingData | undefined {
  return buildings.find(b => b.id === id);
}

function onCanvasClick(event: MouseEvent): void {
  if (!onBuildingClick) return;

  const rect = renderer?.domElement?.getBoundingClientRect();
  if (!rect) return;

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const meshes: THREE.Object3D[] = [];
  buildings.forEach(b => {
    b.group.traverse(child => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });
  });

  const intersects = raycaster.intersectObjects(meshes, false);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const buildingId = hit.userData.buildingId;
    if (buildingId) {
      const building = getBuildingById(buildingId);
      if (building) {
        onBuildingClick(building);
      }
    }
  }
}

export function getStyleConfig(style: BuildingStyle): StyleConfig {
  return STYLE_CONFIGS[style];
}
