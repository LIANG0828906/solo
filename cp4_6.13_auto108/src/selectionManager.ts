import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let objects: THREE.Mesh[] = [];
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

let selectedObject: THREE.Mesh | null = null;
let boundingBox: THREE.BoxHelper | null = null;
let isRotating = false;
let rotationSpeed = 60;

let isDragging = false;
let dragPlane: THREE.Plane;
let offset: THREE.Vector3;
let intersectionPoint: THREE.Vector3;

let onSelectionChange: ((mesh: THREE.Mesh | null) => void) | null = null;
let onObjectTransform: (() => void) | null = null;

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;

export function initSelection(
  sceneRef: THREE.Scene,
  cameraRef: THREE.PerspectiveCamera,
  rendererRef: THREE.WebGLRenderer,
  objectsRef: THREE.Mesh[]
): void {
  scene = sceneRef;
  camera = cameraRef;
  renderer = rendererRef;
  objects = objectsRef;
  
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  offset = new THREE.Vector3();
  intersectionPoint = new THREE.Vector3();
  dragPlane = new THREE.Plane();
  
  const canvas = renderer.domElement;
  
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('dblclick', onDoubleClick);
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);
}

export function updateObjectsList(objectsRef: THREE.Mesh[]): void {
  objects = objectsRef;
}

export function setSelectionChangeCallback(callback: (mesh: THREE.Mesh | null) => void): void {
  onSelectionChange = callback;
}

export function setObjectTransformCallback(callback: () => void): void {
  onObjectTransform = callback;
}

function updateMousePosition(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function getIntersectedObject(): THREE.Mesh | null {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects, false);
  
  if (intersects.length > 0) {
    return intersects[0].object as THREE.Mesh;
  }
  
  return null;
}

function onMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return;
  
  updateMousePosition(event);
  const intersected = getIntersectedObject();
  
  if (intersected) {
    selectObject(intersected);
    isDragging = true;
    
    raycaster.setFromCamera(mouse, camera);
    
    if (event.shiftKey) {
      dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, selectedObject!.position.y, 0)
      );
    } else {
      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()).negate(),
        selectedObject!.position
      );
    }
    
    if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
      offset.copy(selectedObject!.position).sub(intersectionPoint);
    }
    
    renderer.domElement.style.cursor = 'grabbing';
  } else {
    deselectAll();
  }
}

function onMouseMove(event: MouseEvent): void {
  updateMousePosition(event);
  
  if (isDragging && selectedObject) {
    raycaster.setFromCamera(mouse, camera);
    
    if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
      const newPosition = intersectionPoint.add(offset);
      
      if (event.shiftKey) {
        selectedObject.position.y = newPosition.y;
      } else {
        selectedObject.position.x = newPosition.x;
        selectedObject.position.z = newPosition.z;
      }
      
      if (boundingBox) {
        boundingBox.update();
      }
      
      if (onObjectTransform) {
        onObjectTransform();
      }
    }
  } else {
    const intersected = getIntersectedObject();
    renderer.domElement.style.cursor = intersected ? 'grab' : 'default';
  }
}

function onMouseUp(): void {
  isDragging = false;
  if (selectedObject) {
    renderer.domElement.style.cursor = 'grab';
  } else {
    renderer.domElement.style.cursor = 'default';
  }
}

function onWheel(event: WheelEvent): void {
  event.preventDefault();
  
  if (event.ctrlKey && selectedObject) {
    const delta = event.deltaY > 0 ? -0.05 : 0.05;
    const currentScale = selectedObject.scale.x;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale + delta));
    
    selectedObject.scale.set(newScale, newScale, newScale);
    
    if (boundingBox) {
      boundingBox.update();
    }
    
    if (onObjectTransform) {
      onObjectTransform();
    }
  }
}

function onDoubleClick(event: MouseEvent): void {
  updateMousePosition(event);
  const intersected = getIntersectedObject();
  
  if (intersected) {
    centerObject(intersected);
  }
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault();
  
  updateMousePosition(event);
  const intersected = getIntersectedObject();
  
  if (intersected) {
    selectObject(intersected);
    const customEvent = new CustomEvent('geometryContextMenu', {
      detail: {
        x: event.clientX,
        y: event.clientY,
        mesh: intersected
      }
    });
    window.dispatchEvent(customEvent);
  }
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key.toLowerCase() === 'r' && selectedObject) {
    toggleRotation();
  }
}

export function selectObject(mesh: THREE.Mesh): void {
  if (selectedObject === mesh) return;
  
  deselectAll();
  
  selectedObject = mesh;
  
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.emissiveIntensity = 0.6;
  
  boundingBox = new THREE.BoxHelper(mesh, 0xffffff);
  (boundingBox.material as THREE.Material).opacity = 0.5;
  (boundingBox.material as THREE.Material).transparent = true;
  scene.add(boundingBox);
  
  if (onSelectionChange) {
    onSelectionChange(mesh);
  }
}

export function deselectAll(): void {
  if (selectedObject) {
    const material = selectedObject.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = 0.3;
  }
  
  if (boundingBox) {
    scene.remove(boundingBox);
    boundingBox.geometry.dispose();
    (boundingBox.material as THREE.Material).dispose();
    boundingBox = null;
  }
  
  selectedObject = null;
  isRotating = false;
  
  if (onSelectionChange) {
    onSelectionChange(null);
  }
}

export function getSelected(): THREE.Mesh | null {
  return selectedObject;
}

export function toggleRotation(): void {
  if (!selectedObject) return;
  
  isRotating = !isRotating;
}

export function setRotationSpeed(speed: number): void {
  rotationSpeed = Math.max(0, Math.min(360, speed));
}

export function getRotationSpeed(): number {
  return rotationSpeed;
}

export function isObjectRotating(): boolean {
  return isRotating;
}

export function updateSelection(deltaTime: number): void {
  if (isRotating && selectedObject) {
    const radiansPerSecond = (rotationSpeed * Math.PI) / 180;
    selectedObject.rotation.y += radiansPerSecond * deltaTime;
    
    if (boundingBox) {
      boundingBox.update();
    }
    
    if (onObjectTransform) {
      onObjectTransform();
    }
  }
}

export function centerObject(mesh: THREE.Mesh): void {
  selectObject(mesh);
  
  const targetPosition = mesh.position.clone();
  const startPosition = camera.position.clone();
  const duration = 500;
  const startTime = performance.now();
  
  function animate(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    camera.position.lerpVectors(
      startPosition,
      new THREE.Vector3(
        targetPosition.x,
        targetPosition.y + 15,
        targetPosition.z + 25
      ),
      easeProgress
    );
    
    camera.lookAt(targetPosition);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

export function updatePosition(axis: 'x' | 'y' | 'z', value: number): void {
  if (!selectedObject) return;
  
  selectedObject.position[axis] = value;
  
  if (boundingBox) {
    boundingBox.update();
  }
}

export function updateScale(axis: 'x' | 'y' | 'z', value: number): void {
  if (!selectedObject) return;
  
  const clampedValue = Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
  selectedObject.scale[axis] = clampedValue;
  
  if (boundingBox) {
    boundingBox.update();
  }
}

export function updateRotationY(degrees: number): void {
  if (!selectedObject) return;
  
  selectedObject.rotation.y = (degrees * Math.PI) / 180;
  
  if (boundingBox) {
    boundingBox.update();
  }
}

export function getRotationYDegrees(): number {
  if (!selectedObject) return 0;
  
  let degrees = (selectedObject.rotation.y * 180) / Math.PI;
  while (degrees < 0) degrees += 360;
  while (degrees >= 360) degrees -= 360;
  
  return Math.round(degrees);
}
