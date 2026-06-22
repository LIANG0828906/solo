import * as THREE from 'three';
import { SceneElement, SoundSource, Obstacle, Absorber, useStore } from '../store';

const ROOM_WIDTH = 20;
const ROOM_DEPTH = 16;
const GRID_DIVISIONS = 40;

let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let groundMesh: THREE.Mesh;
let roomBorder: THREE.LineSegments;
let elementMeshes: Map<string, THREE.Object3D> = new Map();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let onElementClick: ((id: string) => void) | null = null;
let onElementDblClick: ((id: string) => void) => void | null = null;
let containerEl: HTMLElement | null = null;

const COLORS = {
  source: 0xFF9800,
  obstacle: 0x607D8B,
  absorber: 0x8BC34A,
  ground: 0x1A1A1A,
  gridLine: 0x333333,
  border: 0x00BFA5,
};

export function initScene(container: HTMLElement): void {
  containerEl = container;
  const rect = container.getBoundingClientRect();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  const aspect = rect.width / rect.height;
  const viewSize = ROOM_DEPTH / 2 + 2;
  camera = new THREE.OrthographicCamera(
    -viewSize * aspect,
    viewSize * aspect,
    viewSize,
    -viewSize,
    0.1,
    100
  );
  camera.position.set(ROOM_WIDTH / 2, 20, ROOM_DEPTH / 2);
  camera.lookAt(ROOM_WIDTH / 2, 0, ROOM_DEPTH / 2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(rect.width, rect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0x00BFA5, 0.3);
  dirLight2.position.set(-5, 15, -5);
  scene.add(dirLight2);

  createGround();
  createRoomBorder();

  setupInteraction();
  setupResize(container);
}

function createGround(): void {
  const gridHelper = new THREE.GridHelper(
    Math.max(ROOM_WIDTH, ROOM_DEPTH),
    GRID_DIVISIONS,
    COLORS.gridLine,
    COLORS.gridLine
  );
  gridHelper.position.set(ROOM_WIDTH / 2, 0, ROOM_DEPTH / 2);
  scene.add(gridHelper);

  const groundGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const groundMat = new THREE.MeshStandardMaterial({
    color: COLORS.ground,
    roughness: 0.9,
    metalness: 0.1,
  });
  groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(ROOM_WIDTH / 2, -0.01, ROOM_DEPTH / 2);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
}

function createRoomBorder(): void {
  const points = [
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(ROOM_WIDTH, 0.02, 0),
    new THREE.Vector3(ROOM_WIDTH, 0.02, ROOM_DEPTH),
    new THREE.Vector3(0, 0.02, ROOM_DEPTH),
    new THREE.Vector3(0, 0.02, 0),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: COLORS.border, linewidth: 2 });
  roomBorder = new THREE.LineSegments(geo, mat);
  scene.add(roomBorder);
}

function setupInteraction(): void {
  renderer.domElement.addEventListener('click', onSceneClick);
  renderer.domElement.addEventListener('dblclick', onSceneDblClick);
}

let clickTimeout: ReturnType<typeof setTimeout> | null = null;

function onSceneClick(event: MouseEvent): void {
  if (clickTimeout) {
    clearTimeout(clickTimeout);
    clickTimeout = null;
    return;
  }

  clickTimeout = setTimeout(() => {
    clickTimeout = null;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const meshes = Array.from(elementMeshes.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData.elementId) {
        obj = obj.parent;
      }
      if (obj && obj.userData.elementId && onElementClick) {
        onElementClick(obj.userData.elementId);
      }
    } else {
      useStore.getState().setSelectedElement(null);
    }
  }, 250);
}

function onSceneDblClick(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const meshes = Array.from(elementMeshes.values());
  const intersects = raycaster.intersectObjects(meshes, true);

  if (intersects.length > 0) {
    let obj: THREE.Object3D | null = intersects[0].object;
    while (obj && !obj.userData.elementId) {
      obj = obj.parent;
    }
    if (obj && obj.userData.elementId && onElementDblClick) {
      onElementDblClick(obj.userData.elementId);
    }
  }
}

function setupResize(container: HTMLElement): void {
  const observer = new ResizeObserver(() => {
    const rect = container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const viewSize = ROOM_DEPTH / 2 + 2;
    camera.left = -viewSize * aspect;
    camera.right = viewSize * aspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
  });
  observer.observe(container);
}

export function addElement(element: SceneElement): void {
  let mesh: THREE.Object3D;

  switch (element.type) {
    case 'source': {
      const src = element as SoundSource;
      const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.source,
        emissive: 0xFF9800,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.5,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(src.x, 0.075, src.z);

      const ringGeo = new THREE.RingGeometry(0.5, 0.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFF9800,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      mesh.add(ring);
      break;
    }
    case 'obstacle': {
      const obs = element as Obstacle;
      const geo = new THREE.BoxGeometry(obs.width, 1.2, obs.depth);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.obstacle,
        roughness: 0.6,
        metalness: 0.2,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(obs.x, 0.6, obs.z);
      if (obs.rotation) {
        mesh.rotation.y = obs.rotation;
      }

      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x90A4AE, linewidth: 1 });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(edges);
      break;
    }
    case 'absorber': {
      const abs = element as Absorber;
      const geo = new THREE.BoxGeometry(abs.width, 0.3, abs.depth);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.absorber,
        roughness: 0.9,
        metalness: 0.0,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(abs.x, 0.15, abs.z);
      break;
    }
  }

  mesh.userData.elementId = element.id;
  mesh.userData.elementType = element.type;
  scene.add(mesh);
  elementMeshes.set(element.id, mesh);
}

export function removeElement(id: string): void {
  const mesh = elementMeshes.get(id);
  if (mesh) {
    scene.remove(mesh);
    if (mesh instanceof THREE.Mesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    elementMeshes.delete(id);
  }
}

export function updateElement(id: string, updates: Partial<SceneElement>): void {
  const mesh = elementMeshes.get(id);
  if (!mesh) return;

  if (updates.x !== undefined) mesh.position.x = updates.x;
  if (updates.z !== undefined) mesh.position.z = updates.z;

  const elType = mesh.userData.elementType;
  if (elType === 'obstacle' && updates.rotation !== undefined) {
    mesh.rotation.y = updates.rotation;
  }
}

export function setOnElementClick(cb: (id: string) => void): void {
  onElementClick = cb;
}

export function setOnElementDblClick(cb: (id: string) => void): void {
  onElementDblClick = cb;
}

export function getScene(): THREE.Scene {
  return scene;
}

export function getCamera(): THREE.OrthographicCamera {
  return camera;
}

export function getRenderer(): THREE.WebGLRenderer {
  return renderer;
}

export function getRoomDimensions(): { width: number; depth: number } {
  return { width: ROOM_WIDTH, depth: ROOM_DEPTH };
}

export function renderScene(): void {
  renderer.render(scene, camera);
}

export function worldToScreen(worldX: number, worldZ: number): { x: number; y: number } {
  const vec = new THREE.Vector3(worldX, 0, worldZ);
  vec.project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: (vec.x * 0.5 + 0.5) * rect.width,
    y: (-vec.y * 0.5 + 0.5) * rect.height,
  };
}

export function screenToWorld(screenX: number, screenY: number): { x: number; z: number } {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = (screenX / rect.width) * 2 - 1;
  mouse.y = -(screenY / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersect = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersect);

  if (intersect) {
    return { x: intersect.x, z: intersect.z };
  }
  return { x: ROOM_WIDTH / 2, z: ROOM_DEPTH / 2 };
}

export function getContainerElement(): HTMLElement | null {
  return containerEl;
}
