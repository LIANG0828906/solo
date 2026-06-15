import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModelManager, FossilInfo } from './ModelManager';
import { GeologicalTimeline } from './GeologicalTimeline';
import { AnnotationSystem, BoneAnnotation } from './AnnotationSystem';
import { easeOutCubic, lerp } from './utils';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let modelManager: ModelManager;
let timeline: GeologicalTimeline;
let annotationSystem: AnnotationSystem;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

let canvasContainer: HTMLElement;
let loadingIndicator: HTMLElement;
let infoPanelContent: HTMLElement;
let cutPlaneBtn: HTMLElement;
let cutPlaneSlider: HTMLElement;
let cutSlider: HTMLInputElement;
let cutValue: HTMLElement;
let annotationsBtn: HTMLElement;
let resetViewBtn: HTMLElement;

let mobileToolbarToggle: HTMLElement;
let mobileToolbar: HTMLElement;
let mobileCutPlaneBtn: HTMLElement;
let mobileCutPlaneSlider: HTMLElement;
let mobileCutSlider: HTMLInputElement;
let mobileCutValue: HTMLElement;
let mobileAnnotationsBtn: HTMLElement;
let mobileResetViewBtn: HTMLElement;

let isAnimatingCamera: boolean = false;
let cameraAnimationStart: { position: THREE.Vector3; target: THREE.Vector3 } | null = null;
let cameraAnimationEnd: { position: THREE.Vector3; target: THREE.Vector3 } | null = null;
let cameraAnimationProgress: number = 0;
let cameraAnimationDuration: number = 500;
let cameraAnimationStartTime: number = 0;

let lastTime: number = 0;
let frameCount: number = 0;
let fps: number = 60;

const defaultCameraPosition = new THREE.Vector3(0, 2, 5);
const defaultTarget = new THREE.Vector3(0, 0.3, 0);

function init() {
  canvasContainer = document.getElementById('canvas-container') as HTMLElement;
  loadingIndicator = document.getElementById('loading-indicator') as HTMLElement;
  infoPanelContent = document.getElementById('info-panel-content') as HTMLElement;
  cutPlaneBtn = document.getElementById('btn-cut-plane') as HTMLElement;
  cutPlaneSlider = document.getElementById('cut-plane-slider') as HTMLElement;
  cutSlider = document.getElementById('cut-slider') as HTMLInputElement;
  cutValue = document.getElementById('cut-value') as HTMLElement;
  annotationsBtn = document.getElementById('btn-annotations') as HTMLElement;
  resetViewBtn = document.getElementById('btn-reset-view') as HTMLElement;

  mobileToolbarToggle = document.getElementById('mobile-toolbar-toggle') as HTMLElement;
  mobileToolbar = document.getElementById('mobile-toolbar') as HTMLElement;
  mobileCutPlaneBtn = document.getElementById('mobile-btn-cut-plane') as HTMLElement;
  mobileCutPlaneSlider = document.getElementById('mobile-cut-plane-slider') as HTMLElement;
  mobileCutSlider = document.getElementById('mobile-cut-slider') as HTMLInputElement;
  mobileCutValue = document.getElementById('mobile-cut-value') as HTMLElement;
  mobileAnnotationsBtn = document.getElementById('mobile-btn-annotations') as HTMLElement;
  mobileResetViewBtn = document.getElementById('mobile-btn-reset-view') as HTMLElement;

  initThreeJS();
  initManagers();
  initEventListeners();
  animate(performance.now());

  const firstPeriodId = timeline.getCurrentPeriodId();
  modelManager.switchPeriod(firstPeriodId);
}

function initThreeJS() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.copy(defaultCameraPosition);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);

  canvasContainer.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 15;
  controls.target.copy(defaultTarget);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2 + 0.3;

  setupLighting();
  setupGround();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

function setupLighting() {
  const ambientLight = new THREE.HemisphereLight(0x444444, 0x222222, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
  mainLight.position.set(5, 10, 7);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 50;
  mainLight.shadow.camera.left = -10;
  mainLight.shadow.camera.right = 10;
  mainLight.shadow.camera.top = 10;
  mainLight.shadow.camera.bottom = -10;
  scene.add(mainLight);

  const fillLight1 = new THREE.PointLight(0xffffff, 0.3, 20);
  fillLight1.position.set(-5, 3, 2);
  scene.add(fillLight1);

  const fillLight2 = new THREE.PointLight(0xffffff, 0.3, 20);
  fillLight2.position.set(5, 3, -2);
  scene.add(fillLight2);
}

function setupGround() {
  const groundGeometry = new THREE.CircleGeometry(8, 64);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(16, 32, 0x333333, 0x222222);
  gridHelper.position.y = -0.49;
  (gridHelper.material as THREE.Material).opacity = 0.3;
  (gridHelper.material as THREE.Material).transparent = true;
  scene.add(gridHelper);
}

function initManagers() {
  modelManager = new ModelManager(scene);

  timeline = new GeologicalTimeline();
  timeline.render(document.getElementById('timeline-container') as HTMLElement);

  annotationSystem = new AnnotationSystem('annotations-container', 'annotation-line-svg');

  modelManager.onLoadingStart(() => {
    loadingIndicator.classList.add('visible');
    annotationSystem.clear();
  });

  modelManager.onLoadingEnd(() => {
    loadingIndicator.classList.remove('visible');
  });

  modelManager.onModelReady(({ model, data }) => {
    annotationSystem.attachToModel(model, data.annotations, camera);
    controls.target.copy(defaultTarget);
  });

  modelManager.onModelRemoved(() => {
    annotationSystem.clear();
  });

  modelManager.onInfoUpdate((info) => {
    updateInfoPanel(info);
  });

  timeline.onPeriodChange((periodId) => {
    modelManager.switchPeriod(periodId);
  });

  annotationSystem.onBoneClick((annotation) => {
    focusOnBone(annotation);
  });
}

function initEventListeners() {
  window.addEventListener('resize', onWindowResize);

  cutPlaneBtn.addEventListener('click', toggleCutPlane);
  annotationsBtn.addEventListener('click', toggleAnnotations);
  resetViewBtn.addEventListener('click', resetCamera);

  cutSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    cutValue.textContent = value.toString();
    modelManager.setCutPlanePosition(value);
  });

  mobileCutPlaneBtn.addEventListener('click', toggleCutPlane);
  mobileAnnotationsBtn.addEventListener('click', toggleAnnotations);
  mobileResetViewBtn.addEventListener('click', resetCamera);

  mobileCutSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    mobileCutValue.textContent = value.toString();
    cutValue.textContent = value.toString();
    cutSlider.value = value.toString();
    modelManager.setCutPlanePosition(value);
  });

  mobileToolbarToggle.addEventListener('click', () => {
    mobileToolbar.classList.toggle('visible');
  });

  renderer.domElement.addEventListener('dblclick', onModelDoubleClick);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  timeline.handleResize();
}

function toggleCutPlane() {
  const enabled = !modelManager.isCutPlaneEnabled();
  modelManager.setCutPlaneEnabled(enabled);

  if (enabled) {
    cutPlaneBtn.classList.add('active');
    mobileCutPlaneBtn.classList.add('active');
    cutPlaneSlider.classList.add('visible');
    mobileCutPlaneSlider.classList.add('visible');
  } else {
    cutPlaneBtn.classList.remove('active');
    mobileCutPlaneBtn.classList.remove('active');
    cutPlaneSlider.classList.remove('visible');
    mobileCutPlaneSlider.classList.remove('visible');
  }
}

function toggleAnnotations() {
  const visible = !annotationSystem.isVisible();
  annotationSystem.setVisible(visible);

  if (visible) {
    annotationsBtn.classList.add('active');
    mobileAnnotationsBtn.classList.add('active');
  } else {
    annotationsBtn.classList.remove('active');
    mobileAnnotationsBtn.classList.remove('active');
  }
}

function resetCamera() {
  animateCameraTo(defaultCameraPosition.clone(), defaultTarget.clone());
}

function onModelDoubleClick(event: MouseEvent) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const model = modelManager.getCurrentModel();
  if (!model) return;

  const meshes: THREE.Mesh[] = [];
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });

  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const direction = point.clone().sub(camera.position).normalize();
    const distance = 3;
    const newPosition = point.clone().sub(direction.multiplyScalar(distance));
    animateCameraTo(newPosition, point.clone());
  }
}

function focusOnBone(annotation: BoneAnnotation) {
  const model = modelManager.getCurrentModel();
  if (!model) return;

  const localPos = new THREE.Vector3(...annotation.localPosition);
  const worldPos = localPos.clone().applyMatrix4(model.matrixWorld);

  const direction = worldPos.clone().sub(camera.position).normalize();
  const distance = 2.5;
  const newPosition = worldPos.clone().sub(direction.multiplyScalar(distance));

  animateCameraTo(newPosition, worldPos.clone());
}

function animateCameraTo(position: THREE.Vector3, target: THREE.Vector3) {
  cameraAnimationStart = {
    position: camera.position.clone(),
    target: controls.target.clone()
  };
  cameraAnimationEnd = {
    position,
    target
  };
  cameraAnimationProgress = 0;
  cameraAnimationStartTime = performance.now();
  isAnimatingCamera = true;
  controls.enabled = false;
}

function updateCameraAnimation(currentTime: number) {
  if (!isAnimatingCamera || !cameraAnimationStart || !cameraAnimationEnd) return;

  const elapsed = currentTime - cameraAnimationStartTime;
  const progress = Math.min(elapsed / cameraAnimationDuration, 1);
  const eased = easeOutCubic(progress);

  camera.position.lerpVectors(
    cameraAnimationStart.position,
    cameraAnimationEnd.position,
    eased
  );
  controls.target.lerpVectors(
    cameraAnimationStart.target,
    cameraAnimationEnd.target,
    eased
  );

  if (progress >= 1) {
    isAnimatingCamera = false;
    controls.enabled = true;
    cameraAnimationStart = null;
    cameraAnimationEnd = null;
  }
}

function updateInfoPanel(info: FossilInfo) {
  infoPanelContent.style.animation = 'none';
  infoPanelContent.offsetHeight;

  const nameEl = infoPanelContent.querySelector('.fossil-name') as HTMLElement;
  const scientificEl = infoPanelContent.querySelector('.fossil-scientific') as HTMLElement;
  const rows = infoPanelContent.querySelectorAll('.info-row');

  nameEl.textContent = info.name;
  scientificEl.textContent = info.scientificName;

  (rows[0].querySelector('.info-value') as HTMLElement).textContent = info.ageRange;
  (rows[1].querySelector('.info-value') as HTMLElement).textContent = info.size;
  (rows[2].querySelector('.info-value') as HTMLElement).textContent = info.discoveryLocation;

  infoPanelContent.style.animation = '';
}

function animate(currentTime: number) {
  requestAnimationFrame(animate);

  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  frameCount++;
  if (frameCount % 30 === 0) {
    fps = Math.round(1000 / deltaTime);
  }

  if (isAnimatingCamera) {
    updateCameraAnimation(currentTime);
  }

  controls.update();
  annotationSystem.update();
  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
