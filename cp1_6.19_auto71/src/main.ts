import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setupChannel, updateChannelMesh, createGradientBar, updateGradientBar, ChannelType } from './channel';
import { initParticles, updateParticles, getMixEfficiency, setChannelData } from './particles';
import {
  createUI,
  updateUI,
  setCameraRef,
  setRendererRef,
  setChannelDataRef,
  setFlowRef,
  setupClickHandler,
  UICallbacks,
} from './ui';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let channelData: ReturnType<typeof setupChannel>['data'];
let gradientBar: THREE.Mesh;
let flowRatioA = 1;
let flowRatioB = 1;
let currentChannelType: ChannelType = 'Y';

let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;

function init(): void {
  const container = document.getElementById('canvas-container')!;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 14);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.sortObjects = true;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2;
  controls.maxDistance = 40;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.enablePan = true;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(5, 8, 10);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x4ecdc4, 0.3);
  dirLight2.position.set(-5, -3, 5);
  scene.add(dirLight2);

  const pointLight = new THREE.PointLight(0xff6b6b, 0.3, 20);
  pointLight.position.set(3, 5, 5);
  scene.add(pointLight);

  const gridHelper = new THREE.GridHelper(20, 40, 0x0f3460, 0x0f1b33);
  gridHelper.position.y = -6;
  gridHelper.rotation.x = 0;
  scene.add(gridHelper);

  const result = setupChannel(scene, currentChannelType);
  channelData = result.data;
  gradientBar = createGradientBar(scene, channelData);

  initParticles(scene, channelData);

  const callbacks: UICallbacks = {
    onChannelChange: (type: ChannelType) => {
      currentChannelType = type;
      const existingBar = scene.getObjectByName('gradientBar');
      if (existingBar) {
        (existingBar as THREE.Mesh).geometry.dispose();
        ((existingBar as THREE.Mesh).material as THREE.Material).dispose();
        scene.remove(existingBar);
      }
      channelData = updateChannelMesh(scene, type);
      gradientBar = createGradientBar(scene, channelData);
      setChannelData(channelData);
      setChannelDataRef(channelData);
    },
    onFlowRatioChange: (ratio: number) => {
      flowRatioA = ratio;
      flowRatioB = 1;
      setFlowRef(flowRatioA, flowRatioB);
    },
    onResetView: () => {
      camera.position.set(0, 0, 14);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    },
  };

  createUI(callbacks);
  setCameraRef(camera);
  setRendererRef(renderer);
  setChannelDataRef(channelData);
  setFlowRef(flowRatioA, flowRatioB);
  setupClickHandler(scene);

  window.addEventListener('resize', onResize);

  animate();
}

function onResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let lastTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  frameCount++;
  if (now - lastFpsTime >= 500) {
    currentFps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
    frameCount = 0;
    lastFpsTime = now;
  }

  controls.update();

  updateParticles(channelData, flowRatioA, flowRatioB, delta);

  const efficiency = getMixEfficiency();
  updateGradientBar(gradientBar, efficiency, flowRatioA, flowRatioB);

  updateUI(currentFps, efficiency);

  renderer.render(scene, camera);
}

init();
