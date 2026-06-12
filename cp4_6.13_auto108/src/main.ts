import * as THREE from 'three';
import * as sceneManager from './sceneManager';
import * as selectionManager from './selectionManager';
import * as uiController from './uiController';
import * as contextMenu from './contextMenu';

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let objects: THREE.Mesh[] = [];

const MIN_CAMERA_DISTANCE = 5;
const MAX_CAMERA_DISTANCE = 30;

let lastTime = 0;
let frameCount = 0;
let fps = 60;

function init(): void {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  const sceneData = sceneManager.initScene(container);
  scene = sceneData.scene;
  camera = sceneData.camera;
  renderer = sceneData.renderer;

  objects = sceneManager.createInitialObjects();

  selectionManager.initSelection(scene, camera, renderer, objects);
  selectionManager.setSelectionChangeCallback((mesh) => {
    uiController.updateUI(mesh);
  });
  selectionManager.setObjectTransformCallback(() => {
    uiController.updateUI(selectionManager.getSelected());
  });

  uiController.initUI(
    document.body,
    handleResetAll,
    handlePositionChange,
    handleScaleChange,
    handleRotationChange,
    handleRotationSpeedChange
  );

  contextMenu.initContextMenu(document.body, {
    onCopy: handleCopyObject,
    onDelete: handleDeleteObject,
    onResetPosition: handleResetPosition
  });

  renderer.domElement.addEventListener('wheel', handleCameraWheel, { passive: false });

  animate(performance.now());
}

function handleCameraWheel(event: WheelEvent): void {
  if (event.ctrlKey) return;
  
  event.preventDefault();
  
  const delta = event.deltaY > 0 ? 1 : -1;
  const direction = camera.position.clone().normalize();
  const currentDistance = camera.position.length();
  const newDistance = Math.max(
    MIN_CAMERA_DISTANCE,
    Math.min(MAX_CAMERA_DISTANCE, currentDistance + delta * 0.5)
  );
  
  camera.position.copy(direction.multiplyScalar(newDistance));
  camera.lookAt(0, 0, 0);
  
  sceneManager.updateGridDensity(newDistance);
}

function handlePositionChange(axis: 'x' | 'y' | 'z', value: number): void {
  selectionManager.updatePosition(axis, value);
}

function handleScaleChange(axis: 'x' | 'y' | 'z', value: number): void {
  selectionManager.updateScale(axis, value);
}

function handleRotationChange(degrees: number): void {
  selectionManager.updateRotationY(degrees);
}

function handleRotationSpeedChange(speed: number): void {
  selectionManager.setRotationSpeed(speed);
}

function handleResetAll(): void {
  sceneManager.resetAll();
  selectionManager.deselectAll();
  uiController.updateUI(null);
  
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);
  sceneManager.updateGridDensity(camera.position.length());
}

function handleCopyObject(mesh: THREE.Mesh): void {
  if (objects.length >= sceneManager.getMaxObjects()) {
    alert(`已达到最大几何体数量限制（${sceneManager.getMaxObjects()}个），无法继续复制`);
    return;
  }
  
  const material = mesh.material as THREE.MeshStandardMaterial;
  const config: sceneManager.GeometryConfig = {
    type: mesh.userData.type,
    color: mesh.userData.originalColor,
    position: {
      x: mesh.position.x + 2,
      y: mesh.position.y,
      z: mesh.position.z + 2
    },
    scale: {
      x: mesh.scale.x,
      y: mesh.scale.y,
      z: mesh.scale.z
    },
    rotation: {
      x: mesh.rotation.x,
      y: mesh.rotation.y,
      z: mesh.rotation.z
    },
    name: mesh.userData.name + ' (副本)'
  };
  
  const newMesh = sceneManager.addObject(config);
  if (newMesh) {
    objects = sceneManager.getObjects();
    selectionManager.updateObjectsList(objects);
    selectionManager.selectObject(newMesh);
  }
}

function handleDeleteObject(mesh: THREE.Mesh): void {
  if (objects.length <= 1) {
    alert('至少保留一个几何体！');
    return;
  }
  
  const isSelected = selectionManager.getSelected() === mesh;
  
  sceneManager.removeObject(mesh);
  objects = sceneManager.getObjects();
  selectionManager.updateObjectsList(objects);
  
  if (isSelected) {
    selectionManager.deselectAll();
  }
}

function handleResetPosition(mesh: THREE.Mesh): void {
  if (mesh.userData.initialPosition) {
    mesh.position.set(
      mesh.userData.initialPosition.x,
      mesh.userData.initialPosition.y,
      mesh.userData.initialPosition.z
    );
    
    if (selectionManager.getSelected() === mesh) {
      uiController.updateUI(mesh);
    }
  }
}

function animate(currentTime: number): void {
  requestAnimationFrame(animate);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  frameCount++;
  if (frameCount % 60 === 0) {
    fps = Math.round(1 / deltaTime);
  }
  
  selectionManager.updateSelection(deltaTime);
  
  sceneManager.render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
