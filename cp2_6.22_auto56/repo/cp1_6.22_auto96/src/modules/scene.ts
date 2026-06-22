import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let containerEl: HTMLElement;
let animationId: number | null = null;
let clock: THREE.Clock;

export function initScene(container: HTMLElement): void {
  containerEl = container;
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = null;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(15, 12, 15);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 50;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = (Math.PI * 2) / 3;
  controls.minAzimuthAngle = -Math.PI;
  controls.maxAzimuthAngle = Math.PI;
  controls.enablePan = true;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: null,
  };
  controls.target.set(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0x00d2ff, 0.4, 50);
  pointLight.position.set(-10, 10, -10);
  scene.add(pointLight);

  createGridHelpers();

  window.addEventListener('resize', onResize);
}

function createGridHelpers(): void {
  const gridFloor = new THREE.GridHelper(20, 20, 0x555577, 0x333355);
  gridFloor.position.y = -5;
  scene.add(gridFloor);

  const gridTop = new THREE.GridHelper(20, 20, 0x555577, 0x333355);
  gridTop.position.y = 5;
  scene.add(gridTop);

  const boxGeo = new THREE.BoxGeometry(20, 10, 20);
  const boxEdges = new THREE.EdgesGeometry(boxGeo);
  const boxLine = new THREE.LineSegments(
    boxEdges,
    new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 })
  );
  scene.add(boxLine);

  const verticalMaterial = new THREE.LineBasicMaterial({
    color: 0x555577,
    transparent: true,
    opacity: 0.3,
  });
  for (let i = -10; i <= 10; i += 1) {
    for (let j = -10; j <= 10; j += 1) {
      if (i === -10 || i === 10 || j === -10 || j === 10) {
        const points = [
          new THREE.Vector3(i, -5, j),
          new THREE.Vector3(i, 5, j),
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, verticalMaterial);
        scene.add(line);
      }
    }
  }
}

function onResize(): void {
  if (!containerEl || !camera || !renderer) return;
  const width = containerEl.clientWidth;
  const height = containerEl.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

export function getScene(): THREE.Scene {
  return scene;
}

export function getCamera(): THREE.PerspectiveCamera {
  return camera;
}

export function getControls(): OrbitControls {
  return controls;
}

export function getRenderer(): THREE.WebGLRenderer {
  return renderer;
}

export function render(): void {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

export function animate(callback: (delta: number, elapsed: number) => void): void {
  const loop = () => {
    animationId = requestAnimationFrame(loop);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    controls.update();
    callback(delta, elapsed);
    render();
  };
  loop();
}

export function dispose(): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
}
