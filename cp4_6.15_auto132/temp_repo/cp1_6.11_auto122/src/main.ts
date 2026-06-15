import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DNAModel, BaseType } from './dnaModel';
import { SequenceEditor } from './sequenceEditor';
import './style.css';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let dnaModel: DNAModel;
let sequenceEditor: SequenceEditor;

let lastTime = 0;
let frameCount = 0;
let fps = 60;
let fpsUpdateTime = 0;

const fpsElement = document.getElementById('fps-value');

const HEALTHY_SEQUENCE: BaseType[] = ['A', 'C', 'A', 'C', 'A', 'C', 'A', 'C', 'A', 'C'];

const MUTATION_PAIRS = [
  { base1: 'A' as BaseType, base2: 'T' as BaseType },
  { base1: 'C' as BaseType, base2: 'G' as BaseType },
  { base1: 'A' as BaseType, base2: 'T' as BaseType },
  { base1: 'C' as BaseType, base2: 'G' as BaseType },
  { base1: 'A' as BaseType, base2: 'T' as BaseType },
  { base1: 'A' as BaseType, base2: 'G' as BaseType },
  { base1: 'C' as BaseType, base2: 'T' as BaseType },
  { base1: 'A' as BaseType, base2: 'C' as BaseType },
  { base1: 'T' as BaseType, base2: 'G' as BaseType },
  { base1: 'A' as BaseType, base2: 'A' as BaseType },
];

const CUSTOM_SEQUENCE: BaseType[] = ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'];

let currentPreset: 'healthy' | 'mutation' | 'custom' = 'healthy';

function init() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(4, 5.6568, 4);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 3;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI * 0.9;

  const gridHelper = new THREE.GridHelper(10, 20, 0x333333, 0x222222);
  gridHelper.position.y = -0.5;
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.5;
  scene.add(gridHelper);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  ambientLight.color.setHSL(0.58, 0.1, 1);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = false;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);

  dnaModel = new DNAModel({
    radius: 2,
    pitch: 3,
    basePairsPerTurn: 10,
    basePairCount: 10,
  });
  dnaModel.setCamera(camera);
  dnaModel.build(HEALTHY_SEQUENCE);
  scene.add(dnaModel.group);

  sequenceEditor = new SequenceEditor({
    containerId: 'sequence-editor',
    listId: 'sequence-list',
    pickerId: 'base-picker',
    onSequenceChange: (sequence) => {
      if (currentPreset === 'custom' || currentPreset === 'healthy') {
        dnaModel.rebuild(sequence);
      }
    },
    onPairChange: (index, base1, base2) => {
      if (currentPreset === 'mutation' || currentPreset === 'custom') {
        const pairs = sequenceEditor.getPairs();
        dnaModel.rebuildWithPairs(pairs);
      }
      dnaModel.triggerPulseAnimation(index);
      sequenceEditor.flashRow(index);
    },
    onEdit: (index) => {
      dnaModel.triggerPulseAnimation(index);
    },
  });
  sequenceEditor.setSequence(HEALTHY_SEQUENCE);

  bindPresetButtons();

  window.addEventListener('resize', onWindowResize);

  animate();
}

function bindPresetButtons(): void {
  const buttons = document.querySelectorAll('.preset-btn');
  buttons.forEach((btn) => {
    const button = btn as HTMLButtonElement;
    button.addEventListener('click', () => {
      const preset = button.dataset.preset as 'healthy' | 'mutation' | 'custom';
      if (preset && preset !== currentPreset) {
        switchPreset(preset);
      }
    });
  });
  updatePresetButtonStates();
}

function switchPreset(preset: 'healthy' | 'mutation' | 'custom'): void {
  currentPreset = preset;
  updatePresetButtonStates();

  switch (preset) {
    case 'healthy':
      sequenceEditor.setSequence(HEALTHY_SEQUENCE);
      dnaModel.rebuild(HEALTHY_SEQUENCE);
      break;
    case 'mutation':
      sequenceEditor.setPairs(MUTATION_PAIRS);
      dnaModel.rebuildWithPairs(MUTATION_PAIRS);
      break;
    case 'custom':
      sequenceEditor.setSequence(CUSTOM_SEQUENCE);
      dnaModel.rebuild(CUSTOM_SEQUENCE);
      break;
  }
}

function updatePresetButtonStates(): void {
  const buttons = document.querySelectorAll('.preset-btn');
  buttons.forEach((btn) => {
    const button = btn as HTMLButtonElement;
    if (button.dataset.preset === currentPreset) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(currentTime = 0): void {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  frameCount++;
  fpsUpdateTime += deltaTime;
  if (fpsUpdateTime >= 0.5) {
    fps = Math.round(frameCount / fpsUpdateTime);
    if (fpsElement) {
      fpsElement.textContent = String(fps);
    }
    frameCount = 0;
    fpsUpdateTime = 0;
  }

  controls.update();

  dnaModel.update(deltaTime);
  dnaModel.updateLOD();

  renderer.render(scene, camera);
}

init();
