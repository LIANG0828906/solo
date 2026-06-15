import * as THREE from 'three';

export type GeometryType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'octahedron';

export interface GeometryConfig {
  type: GeometryType;
  color: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  name?: string;
}

interface InitialState {
  config: GeometryConfig;
}

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let gridHelper: THREE.GridHelper;
let objects: THREE.Mesh[] = [];
let initialStates: Map<THREE.Mesh, InitialState> = new Map();
let container: HTMLElement;

const MAX_OBJECTS = 10;
const GEOMETRY_NAMES: Record<GeometryType, string> = {
  cube: '立方体',
  sphere: '球体',
  cylinder: '圆柱体',
  cone: '圆锥体',
  torus: '环面体',
  octahedron: '八面体'
};

const NEON_COLORS = [
  '#ff6b6b',
  '#48dbfb',
  '#ff9ff3',
  '#feca57',
  '#1dd1a1',
  '#5f27cd'
];

const GEOMETRY_TYPES: GeometryType[] = ['cube', 'sphere', 'cylinder', 'cone', 'torus', 'octahedron'];

function getRandomPositionInSphere(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius * Math.cbrt(Math.random());
  
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 1,
    r * Math.cos(phi)
  );
}

function createGeometry(type: GeometryType): THREE.BufferGeometry {
  switch (type) {
    case 'cube':
      return new THREE.BoxGeometry(2, 2, 2);
    case 'sphere':
      return new THREE.SphereGeometry(1.2, 32, 32);
    case 'cylinder':
      return new THREE.CylinderGeometry(1, 1, 2.5, 32);
    case 'cone':
      return new THREE.ConeGeometry(1.2, 2.5, 32);
    case 'torus':
      return new THREE.TorusGeometry(1, 0.4, 16, 48);
    case 'octahedron':
      return new THREE.OctahedronGeometry(1.3);
    default:
      return new THREE.BoxGeometry(2, 2, 2);
  }
}

export function initScene(containerEl: HTMLElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
} {
  container = containerEl;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const pointLight1 = new THREE.PointLight(0xffffff, 1.5, 100);
  pointLight1.position.set(15, 20, 15);
  pointLight1.castShadow = true;
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0xffffff, 0.6, 100);
  pointLight2.position.set(-15, 15, -15);
  scene.add(pointLight2);
  
  gridHelper = new THREE.GridHelper(50, 50, 0x2d2d4a, 0x2d2d4a);
  (gridHelper.material as THREE.Material).opacity = 0.3;
  (gridHelper.material as THREE.Material).transparent = true;
  scene.add(gridHelper);
  
  window.addEventListener('resize', onWindowResize);
  
  return { scene, camera, renderer };
}

function onWindowResize(): void {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

export function createInitialObjects(): THREE.Mesh[] {
  objects.forEach(obj => removeObject(obj));
  objects = [];
  initialStates.clear();
  
  for (let i = 0; i < 6; i++) {
    const type = GEOMETRY_TYPES[i];
    const color = NEON_COLORS[i];
    const position = getRandomPositionInSphere(10);
    
    const config: GeometryConfig = {
      type,
      color,
      position: { x: position.x, y: position.y, z: position.z },
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
      name: GEOMETRY_NAMES[type]
    };
    
    const mesh = addObject(config);
    if (mesh) {
      initialStates.set(mesh, { config: { ...config } });
    }
  }
  
  return objects;
}

export function addObject(config: GeometryConfig): THREE.Mesh | null {
  if (objects.length >= MAX_OBJECTS) {
    console.warn('已达到最大几何体数量限制（10个）');
    return null;
  }
  
  const geometry = createGeometry(config.type);
  const material = new THREE.MeshStandardMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: 0.7,
    metalness: 0.2,
    roughness: 0.3
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(config.position.x, config.position.y, config.position.z);
  mesh.scale.set(config.scale.x, config.scale.y, config.scale.z);
  mesh.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  mesh.userData = {
    type: config.type,
    name: config.name || GEOMETRY_NAMES[config.type],
    originalColor: config.color,
    initialPosition: { ...config.position }
  };
  
  scene.add(mesh);
  objects.push(mesh);
  
  return mesh;
}

export function removeObject(mesh: THREE.Mesh): void {
  const index = objects.indexOf(mesh);
  if (index > -1) {
    objects.splice(index, 1);
  }
  
  scene.remove(mesh);
  
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m: THREE.Material) => m.dispose());
    } else {
      mesh.material.dispose();
    }
  }
  
  initialStates.delete(mesh);
}

export function resetAll(): void {
  objects.forEach(obj => {
    const state = initialStates.get(obj);
    if (state) {
      obj.position.set(
        state.config.position.x,
        state.config.position.y,
        state.config.position.z
      );
      obj.scale.set(
        state.config.scale.x,
        state.config.scale.y,
        state.config.scale.z
      );
      obj.rotation.set(
        state.config.rotation.x,
        state.config.rotation.y,
        state.config.rotation.z
      );
      
      const material = obj.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.7;
    }
  });
}

export function updateGridDensity(cameraDistance: number): void {
  let divisions = 50;
  
  if (cameraDistance < 10) {
    divisions = 100;
  } else if (cameraDistance < 15) {
    divisions = 50;
  } else if (cameraDistance < 25) {
    divisions = 30;
  } else {
    divisions = 20;
  }
  
  if (gridHelper && divisions !== gridHelper.position.y) {
    scene.remove(gridHelper);
    
    gridHelper = new THREE.GridHelper(50, divisions, 0x2d2d4a, 0x2d2d4a);
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);
  }
}

export function render(): void {
  renderer.render(scene, camera);
}

export function getObjects(): THREE.Mesh[] {
  return objects;
}

export function getCameraDistance(): number {
  return camera.position.length();
}

export function getGeometryName(type: GeometryType): string {
  return GEOMETRY_NAMES[type];
}

export function getMaxObjects(): number {
  return MAX_OBJECTS;
}
