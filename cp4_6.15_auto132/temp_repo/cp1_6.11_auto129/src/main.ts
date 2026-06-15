import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TectonicPlate } from './plate';
import { plateData, getGeologicalPeriod } from './data';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let earth: THREE.Mesh;
let stars: THREE.Points;
let plates: TectonicPlate[] = [];
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

let currentTime = -200;
let lastSliderTime = -200;
let isPlaying = false;
let playbackStartTime = 0;
let playbackStartValue = 0;
let selectedPlate: TectonicPlate | null = null;

const EARTH_RADIUS = 5;
const ROTATION_SPEED = (Math.PI * 2) / 60000;
const PLAYBACK_SPEED = 1;

let lastFrameTime = 0;
let deltaTime = 0;
const MIN_FRAME_TIME = 1000 / 60;

function init(): void {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 8;
  controls.maxDistance = 50;
  controls.enablePan = false;

  createLighting();
  createEarth();
  createStars();
  createPlates();
  setupUI();
  setupRaycaster();

  window.addEventListener('resize', onWindowResize);

  animate(performance.now());
}

function createLighting(): void {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0x4488ff, 0.2);
  backLight.position.set(-10, -5, -10);
  scene.add(backLight);
}

function createEarth(): void {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);
  const material = new THREE.MeshPhongMaterial({
    color: 0x1A3A5C,
    shininess: 5,
  });
  earth = new THREE.Mesh(geometry, material);
  scene.add(earth);
}

function createStars(): void {
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    const radius = 100 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    sizes[i] = 1 + Math.random() * 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

function createPlates(): void {
  plates = [];
  for (const data of plateData) {
    const plate = new TectonicPlate(data, scene);
    plates.push(plate);
  }
}

function setupUI(): void {
  const slider = document.getElementById('time-slider') as HTMLInputElement;
  const playButton = document.getElementById('play-button') as HTMLButtonElement;

  slider.addEventListener('input', onSliderInput);
  slider.addEventListener('change', onSliderChange);

  playButton.addEventListener('click', togglePlayback);

  updateTimeDisplay(currentTime);
}

function setupRaycaster(): void {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('click', onMouseClick);
}

function onSliderInput(e: Event): void {
  const slider = e.target as HTMLInputElement;
  const value = parseInt(slider.value, 10);

  if (isPlaying) {
    stopPlayback();
  }

  updateSliderBackground(slider);
  updateTimeDisplay(value);
}

function onSliderChange(e: Event): void {
  const slider = e.target as HTMLInputElement;
  const value = parseInt(slider.value, 10);

  const timeDiff = Math.abs(value - lastSliderTime);
  if (timeDiff >= 10) {
    updateAllPlates(value);
    lastSliderTime = Math.round(value / 10) * 10;
  }

  currentTime = value;
}

function updateSliderBackground(slider: HTMLInputElement): void {
  const min = parseInt(slider.min, 10);
  const max = parseInt(slider.max, 10);
  const value = parseInt(slider.value, 10);
  const percentage = ((value - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, #27AE60 0%, #27AE60 ${percentage}%, #34495e ${percentage}%, #34495e 100%)`;
}

function updateTimeDisplay(time: number): void {
  const valueEl = document.getElementById('time-value');
  const periodEl = document.getElementById('geological-period');

  if (valueEl) {
    const displayValue = Math.abs(time) / 100;
    valueEl.textContent = displayValue.toFixed(1);
  }

  if (periodEl) {
    periodEl.textContent = getGeologicalPeriod(time);
  }
}

function updateAllPlates(targetTime: number): void {
  for (const plate of plates) {
    plate.updatePosition(targetTime, 5000);
  }
}

function onMouseClick(event: MouseEvent): void {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const plateMeshes = plates.map((p) => p.mesh);
  const intersects = raycaster.intersectObjects(plateMeshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const clickedPlate = plates.find((p) => p.mesh === clickedMesh);

    if (clickedPlate) {
      if (selectedPlate === clickedPlate) {
        deselectPlate();
      } else {
        if (selectedPlate) {
          deselectPlate();
        }
        selectPlate(clickedPlate);
      }
    }
  } else {
    if (selectedPlate) {
      deselectPlate();
    }
  }
}

function selectPlate(plate: TectonicPlate): void {
  selectedPlate = plate;
  plate.toggleHighlight(true);
  plate.showInfoCard(
    camera,
    window.innerWidth,
    window.innerHeight
  );
}

function deselectPlate(): void {
  if (selectedPlate) {
    selectedPlate.toggleHighlight(false);
    selectedPlate.hideInfoCard();
    selectedPlate = null;
  }
}

function togglePlayback(): void {
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function startPlayback(): void {
  isPlaying = true;
  playbackStartTime = performance.now();
  playbackStartValue = currentTime;

  const playButton = document.getElementById('play-button') as HTMLButtonElement;
  const playText = playButton.querySelector('.play-text') as HTMLElement;
  playButton.classList.add('playing');
  playText.textContent = '暂停动画';

  controls.enabled = false;

  const targetCamPos = new THREE.Vector3(0, 0, 20);
  const startPos = camera.position.clone();
  const startLookAt = controls.target.clone();
  const animDuration = 1500;
  const animStart = performance.now();

  function animateCamera(): void {
    const elapsed = performance.now() - animStart;
    const t = Math.min(elapsed / animDuration, 1);
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos, targetCamPos, easedT);
    controls.target.lerpVectors(startLookAt, new THREE.Vector3(0, 0, 0), easedT);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateCamera);
    }
  }

  animateCamera();
}

function stopPlayback(): void {
  isPlaying = false;

  const playButton = document.getElementById('play-button') as HTMLButtonElement;
  const playText = playButton.querySelector('.play-text') as HTMLElement;
  playButton.classList.remove('playing');
  playText.textContent = '播放板块动画';

  controls.enabled = true;
}

function updatePlayback(): void {
  if (!isPlaying) return;

  const elapsed = performance.now() - playbackStartTime;
  let newValue = playbackStartValue + (elapsed / 1000) * PLAYBACK_SPEED;

  if (newValue >= 0) {
    newValue = 0;
    stopPlayback();
  }

  currentTime = newValue;

  const slider = document.getElementById('time-slider') as HTMLInputElement;
  slider.value = String(Math.round(newValue));
  updateSliderBackground(slider);
  updateTimeDisplay(newValue);

  const roundedTime = Math.round(newValue / 10) * 10;
  if (roundedTime !== lastSliderTime && Math.abs(roundedTime - lastSliderTime) >= 10) {
    updateAllPlates(roundedTime);
    lastSliderTime = roundedTime;
  }
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time: number): void {
  requestAnimationFrame(animate);

  const frameDelta = time - lastFrameTime;
  if (frameDelta < MIN_FRAME_TIME) return;

  deltaTime = frameDelta;
  lastFrameTime = time;

  earth.rotation.y += ROTATION_SPEED * deltaTime;
  stars.rotation.y += ROTATION_SPEED * deltaTime * 0.1;

  const cameraDistance = camera.position.length();

  for (const plate of plates) {
    plate.update(deltaTime, cameraDistance);
  }

  updatePlayback();
  controls.update();
  renderer.render(scene, camera);
}

init();
