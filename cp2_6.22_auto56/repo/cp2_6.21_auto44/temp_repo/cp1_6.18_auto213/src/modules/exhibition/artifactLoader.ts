import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Artifact } from '../../types';

export type ModelType = Artifact['modelType'];

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function loadGLTFModel(
  path: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        
        centerModel(model);
        
        let polygonCount = 0;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const geometry = child.geometry;
            if (geometry.index) {
              polygonCount += geometry.index.count / 3;
            } else {
              polygonCount += geometry.attributes.position.count / 3;
            }
          }
        });
        
        if (polygonCount > 5000) {
          console.warn(`模型多边形数 ${Math.round(polygonCount)} 超过5000限制`);
        }
        
        resolve(model);
      },
      (xhr) => {
        if (onProgress && xhr.total > 0) {
          onProgress({
            loaded: xhr.loaded,
            total: xhr.total,
            percentage: (xhr.loaded / xhr.total) * 100
          });
        }
      },
      (error) => {
        console.error('模型加载失败:', error);
        reject(error);
      }
    );
  });
}

export function createProceduralModel(modelType: ModelType): THREE.Group {
  const group = new THREE.Group();
  
  switch (modelType) {
    case 'pyramid':
      group.add(createPyramidModel());
      break;
    case 'parthenon':
      group.add(createParthenonModel());
      break;
    case 'wall':
      group.add(createGreatWallModel());
      break;
    case 'colosseum':
      group.add(createColosseumModel());
      break;
    case 'pagoda':
      group.add(createPagodaModel());
      break;
    case 'temple':
      group.add(createMayaTempleModel());
      break;
    case 'mosque':
      group.add(createAngkorWatModel());
      break;
    case 'cathedral':
      group.add(createCathedralModel());
      break;
    default:
      group.add(createPyramidModel());
  }
  
  centerModel(group);
  return group;
}

function createPyramidModel(): THREE.Group {
  const group = new THREE.Group();
  
  const mainGeo = new THREE.ConeGeometry(1.5, 2, 4);
  const mainMat = new THREE.MeshStandardMaterial({ 
    color: 0xD4A574,
    roughness: 0.8,
    metalness: 0.1
  });
  const mainPyramid = new THREE.Mesh(mainGeo, mainMat);
  mainPyramid.rotation.y = Math.PI / 4;
  mainPyramid.position.y = 1;
  group.add(mainPyramid);
  
  const smallGeo1 = new THREE.ConeGeometry(0.6, 0.9, 4);
  const smallPyramid1 = new THREE.Mesh(smallGeo1, mainMat);
  smallPyramid1.rotation.y = Math.PI / 4;
  smallPyramid1.position.set(1.8, 0.45, 0.5);
  group.add(smallPyramid1);
  
  const smallGeo2 = new THREE.ConeGeometry(0.5, 0.7, 4);
  const smallPyramid2 = new THREE.Mesh(smallGeo2, mainMat);
  smallPyramid2.rotation.y = Math.PI / 4;
  smallPyramid2.position.set(-1.6, 0.35, 0.3);
  group.add(smallPyramid2);
  
  const baseGeo = new THREE.BoxGeometry(4, 0.1, 4);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xC4956A });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.05;
  group.add(base);
  
  return group;
}

function createParthenonModel(): THREE.Group {
  const group = new THREE.Group();
  
  const baseGeo = new THREE.BoxGeometry(3.5, 0.2, 2);
  const stoneMat = new THREE.MeshStandardMaterial({ 
    color: 0xE8E0D0,
    roughness: 0.7
  });
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = 0.1;
  group.add(base);
  
  const columnGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 16);
  for (let i = 0; i < 6; i++) {
    const columnFront = new THREE.Mesh(columnGeo, stoneMat);
    columnFront.position.set(-1.4 + i * 0.56, 1.1, 0.75);
    group.add(columnFront);
    
    const columnBack = new THREE.Mesh(columnGeo, stoneMat);
    columnBack.position.set(-1.4 + i * 0.56, 1.1, -0.75);
    group.add(columnBack);
  }
  
  for (let i = 0; i < 3; i++) {
    const columnSide1 = new THREE.Mesh(columnGeo, stoneMat);
    columnSide1.position.set(-1.4, 1.1, -0.75 + i * 0.75);
    group.add(columnSide1);
    
    const columnSide2 = new THREE.Mesh(columnGeo, stoneMat);
    columnSide2.position.set(1.4, 1.1, -0.75 + i * 0.75);
    group.add(columnSide2);
  }
  
  const roofGeo = new THREE.BoxGeometry(3.7, 0.15, 2.2);
  const roof = new THREE.Mesh(roofGeo, stoneMat);
  roof.position.y = 2.1;
  group.add(roof);
  
  const pedimentGeo = new THREE.ConeGeometry(2.2, 0.5, 2);
  const pediment = new THREE.Mesh(pedimentGeo, stoneMat);
  pediment.rotation.x = Math.PI;
  pediment.position.y = 2.5;
  group.add(pediment);
  
  return group;
}

function createGreatWallModel(): THREE.Group {
  const group = new THREE.Group();
  
  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x8B7355,
    roughness: 0.9
  });
  
  for (let i = -2; i <= 2; i++) {
    const height = 0.6 + Math.sin(i * 0.5) * 0.2;
    const wallGeo = new THREE.BoxGeometry(1.2, height, 0.6);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(i * 1.0, height / 2, 0);
    group.add(wall);
    
    const battlementGeo = new THREE.BoxGeometry(0.2, 0.2, 0.6);
    for (let j = 0; j < 5; j++) {
      const battlement = new THREE.Mesh(battlementGeo, wallMat);
      battlement.position.set(i * 1.0 - 0.4 + j * 0.2, height + 0.1, 0);
      group.add(battlement);
    }
  }
  
  const towerGeo = new THREE.BoxGeometry(1, 1.5, 1);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x7A6548 });
  const tower1 = new THREE.Mesh(towerGeo, towerMat);
  tower1.position.set(-2.5, 0.75, 0);
  group.add(tower1);
  
  const tower2 = new THREE.Mesh(towerGeo, towerMat);
  tower2.position.set(2.5, 0.75, 0);
  group.add(tower2);
  
  return group;
}

function createColosseumModel(): THREE.Group {
  const group = new THREE.Group();
  
  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0xC4A882,
    roughness: 0.8
  });
  
  for (let level = 0; level < 3; level++) {
    const radius = 1.8 - level * 0.3;
    const height = 0.7;
    const segments = 24;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      
      const innerRadius = radius - 0.2;
      const shape = new THREE.Shape();
      shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      shape.lineTo(Math.cos(nextAngle) * radius, Math.sin(nextAngle) * radius);
      shape.lineTo(Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
      shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      shape.closePath();
      
      const extrudeSettings = { depth: height, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geometry, wallMat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = level * height;
      group.add(mesh);
    }
  }
  
  const topGeo = new THREE.TorusGeometry(1, 0.05, 8, 32);
  const top = new THREE.Mesh(topGeo, wallMat);
  top.rotation.x = Math.PI / 2;
  top.position.y = 2.1;
  group.add(top);
  
  const floorGeo = new THREE.CircleGeometry(1.3, 32);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xB8956E });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  group.add(floor);
  
  return group;
}

function createPagodaModel(): THREE.Group {
  const group = new THREE.Group();
  
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.7
  });
  
  const roofMat = new THREE.MeshStandardMaterial({ 
    color: 0x2F4F4F,
    roughness: 0.6
  });
  
  const baseGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2);
  const base = new THREE.Mesh(baseGeo, bodyMat);
  base.position.y = 0.1;
  group.add(base);
  
  const levels = 7;
  for (let i = 0; i < levels; i++) {
    const scale = 1 - i * 0.1;
    const bodySize = 0.8 * scale;
    const bodyHeight = 0.5;
    
    const bodyGeo = new THREE.BoxGeometry(bodySize, bodyHeight, bodySize);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2 + i * (bodyHeight + 0.2) + bodyHeight / 2;
    group.add(body);
    
    const roofSize = 1.1 * scale;
    const roofGeo = new THREE.ConeGeometry(roofSize, 0.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.2 + i * (bodyHeight + 0.2) + bodyHeight + 0.1;
    group.add(roof);
  }
  
  const topGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 0.2 + levels * 0.7 + 0.2;
  group.add(top);
  
  return group;
}

function createMayaTempleModel(): THREE.Group {
  const group = new THREE.Group();
  
  const stoneMat = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.9
  });
  
  const levels = 6;
  for (let i = 0; i < levels; i++) {
    const size = 2.5 - i * 0.35;
    const height = 0.4;
    
    const layerGeo = new THREE.BoxGeometry(size, height, size);
    const layer = new THREE.Mesh(layerGeo, stoneMat);
    layer.position.y = i * height + height / 2;
    group.add(layer);
    
    if (i < levels - 1) {
      const stairGeo = new THREE.BoxGeometry(0.3, 0.05, 0.5);
      for (let j = 0; j < 8; j++) {
        const stair = new THREE.Mesh(stairGeo, stoneMat);
        stair.position.set(0, i * height + 0.025 + j * 0.05, size / 2 - 0.15);
        group.add(stair);
      }
    }
  }
  
  const templeGeo = new THREE.BoxGeometry(0.8, 0.8, 1);
  const templeMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
  const temple = new THREE.Mesh(templeGeo, templeMat);
  temple.position.y = levels * 0.4 + 0.4;
  group.add(temple);
  
  const roofGeo = new THREE.ConeGeometry(0.6, 0.4, 4);
  const roof = new THREE.Mesh(roofGeo, stoneMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = levels * 0.4 + 1.0;
  group.add(roof);
  
  return group;
}

function createAngkorWatModel(): THREE.Group {
  const group = new THREE.Group();
  
  const stoneMat = new THREE.MeshStandardMaterial({ 
    color: 0xA0926C,
    roughness: 0.8
  });
  
  const baseGeo = new THREE.BoxGeometry(3, 0.3, 3);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = 0.15;
  group.add(base);
  
  const mainTowerGeo = new THREE.ConeGeometry(0.5, 2, 8);
  const mainTower = new THREE.Mesh(mainTowerGeo, stoneMat);
  mainTower.position.y = 1.3;
  group.add(mainTower);
  
  const cornerPositions = [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];
  
  for (const [x, z] of cornerPositions) {
    const towerGeo = new THREE.ConeGeometry(0.3, 1.2, 8);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.set(x * 0.8, 0.9, z * 0.8);
    group.add(tower);
  }
  
  const galleryGeo = new THREE.BoxGeometry(2.5, 0.8, 0.3);
  const gallery1 = new THREE.Mesh(galleryGeo, stoneMat);
  gallery1.position.y = 0.7;
  group.add(gallery1);
  
  const gallery2 = new THREE.Mesh(galleryGeo, stoneMat);
  gallery2.rotation.y = Math.PI / 2;
  gallery2.position.y = 0.7;
  group.add(gallery2);
  
  const spireGeo = new THREE.ConeGeometry(0.1, 0.3, 8);
  const spireMat = new THREE.MeshStandardMaterial({ color: 0xC0B080 });
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 2.45;
  group.add(spire);
  
  return group;
}

function createCathedralModel(): THREE.Group {
  const group = new THREE.Group();
  
  const stoneMat = new THREE.MeshStandardMaterial({ 
    color: 0xF5F5DC,
    roughness: 0.7
  });
  
  const domeBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.8, 32);
  const domeBase = new THREE.Mesh(domeBaseGeo, stoneMat);
  domeBase.position.y = 0.4;
  group.add(domeBase);
  
  const domeGeo = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, stoneMat);
  dome.position.y = 0.8;
  group.add(dome);
  
  const ribCount = 8;
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    const curvePoints: THREE.Vector3[] = [];
    
    for (let j = 0; j <= 20; j++) {
      const t = j / 20;
      const radius = 1.2 * Math.cos(t * Math.PI / 2);
      const height = 1.2 * Math.sin(t * Math.PI / 2);
      
      curvePoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        height + 0.8,
        Math.sin(angle) * radius
      ));
    }
    
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const ribGeo = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0xE8E0C8 });
    const rib = new THREE.Mesh(ribGeo, ribMat);
    group.add(rib);
  }
  
  const lanternGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 16);
  const lantern = new THREE.Mesh(lanternGeo, stoneMat);
  lantern.position.y = 2.1;
  group.add(lantern);
  
  const crossGeo1 = new THREE.BoxGeometry(0.05, 0.4, 0.05);
  const crossGeo2 = new THREE.BoxGeometry(0.25, 0.05, 0.05);
  const crossMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const cross1 = new THREE.Mesh(crossGeo1, crossMat);
  const cross2 = new THREE.Mesh(crossGeo2, crossMat);
  cross1.position.y = 2.6;
  cross2.position.y = 2.65;
  group.add(cross1, cross2);
  
  const drumWindows = 16;
  for (let i = 0; i < drumWindows; i++) {
    const angle = (i / drumWindows) * Math.PI * 2;
    const windowGeo = new THREE.BoxGeometry(0.08, 0.3, 0.1);
    const windowMat = new THREE.MeshStandardMaterial({ 
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.6
    });
    const window = new THREE.Mesh(windowGeo, windowMat);
    window.position.set(
      Math.cos(angle) * 1.35,
      0.8,
      Math.sin(angle) * 1.35
    );
    window.rotation.y = angle;
    group.add(window);
  }
  
  return group;
}

function centerModel(model: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2 / maxDim;
  
  model.scale.setScalar(scale);
  
  box.setFromObject(model);
  box.getCenter(center);
  
  model.position.sub(center);
  model.position.y += box.min.y * -1;
}

export function disposeModel(model: THREE.Object3D): void {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
