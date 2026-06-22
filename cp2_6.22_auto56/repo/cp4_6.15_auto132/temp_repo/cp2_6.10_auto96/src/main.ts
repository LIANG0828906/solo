import * as THREE from 'three';
import { ShadowSimulator } from './ShadowSimulator';
import { Sundial } from './Sundial';
import { setupUI, eventBus, setDateSliderValue } from './ui';
import './style.css';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let sundial: Sundial;
let simulator: ShadowSimulator;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let cameraAngle: number = 0;
let isDragging: boolean = false;
let lastMouseX: number = 0;
let lastMouseY: number = 0;

const clock = new THREE.Clock();

function init(): void {
  const container = document.getElementById('scene-container') as HTMLDivElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a1e14);
  scene.fog = new THREE.Fog(0x2a1e14, 20, 50);

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 12, 18);
  camera.lookAt(0, 2, 0);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  setupLighting();

  simulator = new ShadowSimulator();
  sundial = new Sundial(simulator);
  scene.add(sundial);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  setupUI(simulator);
  setupEventListeners(container);
  setupEventBusHandlers();

  animate();
}

function setupLighting(): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  mainLight.position.set(15, 25, 10);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 100;
  mainLight.shadow.camera.left = -20;
  mainLight.shadow.camera.right = 20;
  mainLight.shadow.camera.top = 20;
  mainLight.shadow.camera.bottom = -20;
  mainLight.shadow.bias = -0.0001;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
  fillLight.position.set(-10, 15, -10);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffd700, 0.5, 30);
  rimLight.position.set(0, 8, 0);
  scene.add(rimLight);

  const candleLight1 = new THREE.PointLight(0xffaa44, 0.3, 15);
  candleLight1.position.set(8, 2, 8);
  scene.add(candleLight1);

  const candleLight2 = new THREE.PointLight(0xffaa44, 0.3, 15);
  candleLight2.position.set(-8, 2, -8);
  scene.add(candleLight2);

  const candleLight3 = new THREE.PointLight(0xffaa44, 0.3, 15);
  candleLight3.position.set(8, 2, -8);
  scene.add(candleLight3);

  const candleLight4 = new THREE.PointLight(0xffaa44, 0.3, 15);
  candleLight4.position.set(-8, 2, 8);
  scene.add(candleLight4);
}

function setupEventListeners(container: HTMLDivElement): void {
  window.addEventListener('resize', onWindowResize);

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mouseleave', onMouseUp);
  container.addEventListener('wheel', onWheel);

  container.addEventListener('touchstart', onTouchStart, { passive: false });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd);

  container.addEventListener('click', onClick);
}

function setupEventBusHandlers(): void {
  eventBus.on('shichen-selected', (data) => {
    const index = data as number;
    sundial.animateToShichen(index);
  });

  document.addEventListener('shichen-aligned', ((e: CustomEvent) => {
    eventBus.emit('shichen-aligned-ui', e.detail);
  }) as EventListener);
}

function onWindowResize(): void {
  const container = document.getElementById('scene-container') as HTMLDivElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function onMouseDown(event: MouseEvent): void {
  isDragging = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onMouseMove(event: MouseEvent): void {
  if (isDragging) {
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    cameraAngle += deltaX * 0.005;

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position);
    spherical.theta += deltaX * 0.005;
    spherical.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.1, spherical.phi - deltaY * 0.005));
    
    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 2, 0);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }

  const container = document.getElementById('scene-container') as HTMLDivElement;
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseUp(): void {
  isDragging = false;
}

function onWheel(event: WheelEvent): void {
  event.preventDefault();
  
  const direction = event.deltaY > 0 ? 1 : -1;
  const distance = camera.position.length();
  const newDistance = Math.max(8, Math.min(40, distance + direction * 1));
  
  camera.position.normalize().multiplyScalar(newDistance);
}

function onTouchStart(event: TouchEvent): void {
  event.preventDefault();
  if (event.touches.length === 1) {
    isDragging = true;
    lastMouseX = event.touches[0].clientX;
    lastMouseY = event.touches[0].clientY;
  }
}

function onTouchMove(event: TouchEvent): void {
  event.preventDefault();
  if (isDragging && event.touches.length === 1) {
    const deltaX = event.touches[0].clientX - lastMouseX;
    const deltaY = event.touches[0].clientY - lastMouseY;

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position);
    spherical.theta += deltaX * 0.005;
    spherical.phi = Math.max(0.3, Math.min(Math.PI / 2 - 0.1, spherical.phi - deltaY * 0.005));
    
    camera.position.setFromSpherical(spherical);
    camera.lookAt(0, 2, 0);

    lastMouseX = event.touches[0].clientX;
    lastMouseY = event.touches[0].clientY;
  }
}

function onTouchEnd(): void {
  isDragging = false;
}

function onClick(event: MouseEvent): void {
  const container = document.getElementById('scene-container') as HTMLDivElement;
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  
  const solarBalls = sundial.getSolarBalls();
  const intersects = raycaster.intersectObjects(solarBalls.map(b => b.mesh), false);

  if (intersects.length > 0) {
    const clickedBall = solarBalls.find(b => b.mesh === intersects[0].object);
    if (clickedBall) {
      simulator.setDate(clickedBall.day);
      setDateSliderValue(clickedBall.day);
      eventBus.emit('date-changed', clickedBall.day);

      const originalEmissive = (clickedBall.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity;
      const originalScale = clickedBall.mesh.scale.x;
      
      (clickedBall.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
      clickedBall.mesh.scale.setScalar(originalScale * 1.5);
      
      setTimeout(() => {
        (clickedBall.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = originalEmissive;
        clickedBall.mesh.scale.setScalar(originalScale);
      }, 500);
    }
  }
}

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime() * 1000;

  sundial.update(deltaTime, elapsedTime);

  if (!isDragging) {
    cameraAngle += 0.0005;
    const distance = camera.position.length();
    const height = camera.position.y;
    camera.position.x = Math.sin(cameraAngle) * Math.sqrt(distance * distance - height * height);
    camera.position.z = Math.cos(cameraAngle) * Math.sqrt(distance * distance - height * height);
    camera.lookAt(0, 2, 0);
  }

  const time = clock.getElapsedTime();
  scene.traverse((obj) => {
    if (obj instanceof THREE.PointLight && obj.color.getHex() === 0xffaa44) {
      obj.intensity = 0.3 + Math.sin(time * 3 + obj.position.x) * 0.1;
    }
  });

  renderer.render(scene, camera);
}

init();
