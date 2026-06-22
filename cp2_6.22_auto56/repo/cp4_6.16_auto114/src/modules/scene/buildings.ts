import * as THREE from 'three';
import { BuildingData } from '../../types';

export const createBuildingMesh = (building: BuildingData): THREE.Group => {
  const group = new THREE.Group();
  group.name = `building_${building.id}`;
  group.userData = { buildingId: building.id };

  const geometry = new THREE.BoxGeometry(building.width, building.height, building.depth);
  
  const material = new THREE.MeshStandardMaterial({
    color: building.color,
    roughness: 0.7,
    metalness: 0.1,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = building.height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { buildingId: building.id };
  
  group.add(mesh);
  
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(building.color).multiplyScalar(0.7),
    transparent: true,
    opacity: 0.6
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.position.y = building.height / 2;
  group.add(edges);
  
  const lineCount = Math.floor(building.height / 5);
  for (let i = 1; i < lineCount; i++) {
    const yPos = i * 5;
    const lineGeometry = new THREE.BufferGeometry();
    const linePoints = new Float32Array([
      -building.width / 2, yPos, -building.depth / 2,
      building.width / 2, yPos, -building.depth / 2,
      building.width / 2, yPos, building.depth / 2,
      -building.width / 2, yPos, building.depth / 2,
      -building.width / 2, yPos, -building.depth / 2
    ]);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(building.color).multiplyScalar(0.8),
      transparent: true,
      opacity: 0.4
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);
  }
  
  group.position.set(building.x, 0, building.z);
  
  return group;
};

export const createBuildingMeshes = (buildings: BuildingData[]): THREE.Group[] => {
  return buildings.map(building => createBuildingMesh(building));
};

export const parseBuildingsFromJSON = (jsonString: string): BuildingData[] => {
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array');
    }
    
    return data.map((item: any, index: number) => ({
      id: item.id || `building_${index}`,
      x: item.x ?? 0,
      z: item.z ?? 0,
      width: item.width ?? 10,
      depth: item.depth ?? 10,
      height: item.height ?? 20,
      color: item.color || '#d0d0d0'
    }));
  } catch (error) {
    console.error('Error parsing buildings JSON:', error);
    throw error;
  }
};

export const generateRandomBuildings = (): BuildingData[] => {
  const buildings: BuildingData[] = [];
  const colors = ['#d0d0d0', '#e8dcc8', '#c8d4e0'];
  const gridSize = 8;
  const spacing = 25;
  
  const count = Math.floor(Math.random() * 21) + 30;
  
  for (let i = 0; i < count; i++) {
    const gridX = Math.floor(Math.random() * gridSize) - gridSize / 2;
    const gridZ = Math.floor(Math.random() * gridSize) - gridSize / 2;
    
    const building: BuildingData = {
      id: `building_${i}`,
      x: gridX * spacing + (Math.random() - 0.5) * 8,
      z: gridZ * spacing + (Math.random() - 0.5) * 8,
      width: 8 + Math.random() * 8,
      depth: 8 + Math.random() * 8,
      height: 10 + Math.random() * 70,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    
    const exists = buildings.some(b => 
      Math.abs(b.x - building.x) < 12 && Math.abs(b.z - building.z) < 12
    );
    
    if (!exists) {
      buildings.push(building);
    }
  }
  
  return buildings;
};
