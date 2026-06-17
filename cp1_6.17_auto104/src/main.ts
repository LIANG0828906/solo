import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { BuildingGenerator } from './CityModule/BuildingGenerator';
import { RoadGridSystem } from './CityModule/RoadGridSystem';
import { ParticleEmitter } from './ParticleModule/ParticleEmitter';
import { HeatmapLayer } from './ParticleModule/HeatmapLayer';
import { useLightStore } from './store/useLightStore';
import { kelvinToRGB } from './utils/colorUtils';
import { degToRad } from './utils/mathUtils';
import type { LightParams, BuildingBox } from './ParticleModule/types';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0A1128);
scene.fog = new THREE.FogExp2(0x0A1128, 0.003);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(60, 50, 60);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const canvasContainer = document.createElement('div');
canvasContainer.id = 'canvas-container';
canvasContainer.style.position = 'absolute';
canvasContainer.style.top = '0';
canvasContainer.style.left = '0';
canvasContainer.style.width = '100%';
canvasContainer.style.height = '100%';
canvasContainer.style.zIndex = '0';
document.body.appendChild(canvasContainer);
canvasContainer.appendChild(renderer.domElement);

const uiRoot = document.createElement('div');
uiRoot.id = 'ui-root';
uiRoot.style.position = 'absolute';
uiRoot.style.top = '0';
uiRoot.style.left = '0';
uiRoot.style.width = '100%';
uiRoot.style.height = '100%';
uiRoot.style.zIndex = '10';
uiRoot.style.pointerEvents = 'none';
document.body.appendChild(uiRoot);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.5;
controls.minDistance = 10;
controls.maxDistance = 150;
controls.target.set(0, 10, 0);
controls.enablePan = true;
controls.maxPolarAngle = Math.PI / 2.1;

const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

const groundGeometry = new THREE.PlaneGeometry(400, 400);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x1A233A,
  roughness: 0.9,
  metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const buildingGenerator = new BuildingGenerator();
const roadGridSystem = new RoadGridSystem();
const particleEmitter = new ParticleEmitter();
const heatmapLayer = new HeatmapLayer(200, new THREE.Vector3(0, 0, 0));

const { mesh: buildings, emitPositions, buildingBoxes } = buildingGenerator.generateBuildings(0, 0, 80);
scene.add(buildings);

const roadGrid = roadGridSystem.generateRoadGrid(0, 0, 200, 10);
scene.add(roadGrid);

const particles = particleEmitter.getPoints();
const trailLines = particleEmitter.getTrailLines();
particles.material.transparent = true;
particles.material.opacity = 0;
scene.add(particles);
scene.add(trailLines);

const heatmapMesh = heatmapLayer.getMesh();
scene.add(heatmapMesh);

const convertedBoxes: BuildingBox[] = buildingBoxes.map((box) => ({
  minX: box.min.x,
  maxX: box.max.x,
  minY: box.min.y,
  maxY: box.max.y,
  minZ: box.min.z,
  maxZ: box.max.z,
}));

const defaultLightParams: LightParams = {
  ambientColor: new THREE.Color(0x0A1128),
  gravity: 0.5,
  windForce: new THREE.Vector3(0.1, 0, 0.05),
  bounceCoefficient: 0.6,
};

new TWEEN.Tween({ opacity: 0 })
  .to({ opacity: 1 }, 300)
  .easing(TWEEN.Easing.Quadratic.Out)
  .onUpdate((obj) => {
    particles.material.opacity = obj.opacity;
    trailLines.material.opacity = obj.opacity * 0.3;
  })
  .start();

const setParticleCount = useLightStore.getState().setParticleCount;

const clock = new THREE.Clock();
let emitTimer = 0;

function animate(): void {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  TWEEN.update();

  const state = useLightStore.getState();

  emitTimer += delta;
  if (emitTimer >= 0.016) {
    emitTimer = 0;

    if (emitPositions.length > 0) {
      const buildingPos = emitPositions[Math.floor(Math.random() * emitPositions.length)];
      const buildingRGB = kelvinToRGB(state.building.colorTemp);
      const buildingColor = new THREE.Color(
        buildingRGB.r / 255,
        buildingRGB.g / 255,
        buildingRGB.b / 255
      ).multiplyScalar(state.building.intensity);
      
      const buildingDir = new THREE.Vector3(
        Math.sin(degToRad(state.building.direction)),
        1,
        Math.cos(degToRad(state.building.direction))
      ).normalize();
      
      particleEmitter.emit('building', buildingPos, buildingDir, buildingColor);

      if (Math.random() < 0.3) {
        const adPos = emitPositions[Math.floor(Math.random() * emitPositions.length)];
        const adRGB = kelvinToRGB(state.advertisement.colorTemp);
        const adColor = new THREE.Color(
          adRGB.r / 255,
          adRGB.g / 255,
          adRGB.b / 255
        ).multiplyScalar(state.advertisement.intensity);
        
        const adDir = new THREE.Vector3(
          Math.sin(degToRad(state.advertisement.direction)),
          0.8,
          Math.cos(degToRad(state.advertisement.direction))
        ).normalize();
        
        particleEmitter.emit('advertisement', adPos, adDir, adColor);
      }

      if (Math.random() < 0.2) {
        const lampX = (Math.random() - 0.5) * 160;
        const lampZ = (Math.random() - 0.5) * 160;
        const lampPos = new THREE.Vector3(lampX, 6, lampZ);
        const lampRGB = kelvinToRGB(state.streetLamp.colorTemp);
        const lampColor = new THREE.Color(
          lampRGB.r / 255,
          lampRGB.g / 255,
          lampRGB.b / 255
        ).multiplyScalar(state.streetLamp.intensity);
        
        const lampDir = new THREE.Vector3(
          Math.sin(degToRad(state.streetLamp.direction)),
          0.5,
          Math.cos(degToRad(state.streetLamp.direction))
        ).normalize();
        
        particleEmitter.emit('streetLamp', lampPos, lampDir, lampColor);
      }
    }
  }

  particleEmitter.update(delta, convertedBoxes, defaultLightParams);
  heatmapLayer.update(particleEmitter.getActiveParticles());
  controls.update();

  const activeParticles = particleEmitter.getActiveParticles().length;
  setParticleCount(activeParticles);

  renderer.render(scene, camera);
}

function handleResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);

animate();

const uiElements = document.querySelectorAll('#ui-root > *');
uiElements.forEach((el) => {
  (el as HTMLElement).style.pointerEvents = 'auto';
});

createRoot(uiRoot).render(
  <StrictMode>
    <App />
  </StrictMode>
);

export { scene, camera, renderer, controls };
