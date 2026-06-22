import * as THREE from 'three';
import { BarChart, DataGroup, GroupMode } from './BarChart';
import { Interaction } from './Interaction';

const LAYER_COLORS = ['#6366f1', '#06b6d4', '#f59e0b'];

const data: DataGroup[] = [
  {
    name: '华东区',
    categories: [
      { name: '产品A', layers: [
        { name: '研发', value: 120, color: LAYER_COLORS[0] },
        { name: '市场', value: 85, color: LAYER_COLORS[1] },
        { name: '运营', value: 65, color: LAYER_COLORS[2] },
      ]},
      { name: '产品B', layers: [
        { name: '研发', value: 95, color: LAYER_COLORS[0] },
        { name: '市场', value: 110, color: LAYER_COLORS[1] },
        { name: '运营', value: 80, color: LAYER_COLORS[2] },
      ]},
      { name: '产品C', layers: [
        { name: '研发', value: 140, color: LAYER_COLORS[0] },
        { name: '市场', value: 75, color: LAYER_COLORS[1] },
        { name: '运营', value: 90, color: LAYER_COLORS[2] },
      ]},
      { name: '产品D', layers: [
        { name: '研发', value: 80, color: LAYER_COLORS[0] },
        { name: '市场', value: 95, color: LAYER_COLORS[1] },
        { name: '运营', value: 110, color: LAYER_COLORS[2] },
      ]},
      { name: '产品E', layers: [
        { name: '研发', value: 105, color: LAYER_COLORS[0] },
        { name: '市场', value: 130, color: LAYER_COLORS[1] },
        { name: '运营', value: 70, color: LAYER_COLORS[2] },
      ]},
    ],
  },
  {
    name: '华南区',
    categories: [
      { name: '产品A', layers: [
        { name: '研发', value: 90, color: LAYER_COLORS[0] },
        { name: '市场', value: 100, color: LAYER_COLORS[1] },
        { name: '运营', value: 85, color: LAYER_COLORS[2] },
      ]},
      { name: '产品B', layers: [
        { name: '研发', value: 115, color: LAYER_COLORS[0] },
        { name: '市场', value: 80, color: LAYER_COLORS[1] },
        { name: '运营', value: 95, color: LAYER_COLORS[2] },
      ]},
      { name: '产品C', layers: [
        { name: '研发', value: 70, color: LAYER_COLORS[0] },
        { name: '市场', value: 120, color: LAYER_COLORS[1] },
        { name: '运营', value: 75, color: LAYER_COLORS[2] },
      ]},
      { name: '产品D', layers: [
        { name: '研发', value: 130, color: LAYER_COLORS[0] },
        { name: '市场', value: 65, color: LAYER_COLORS[1] },
        { name: '运营', value: 100, color: LAYER_COLORS[2] },
      ]},
      { name: '产品E', layers: [
        { name: '研发', value: 85, color: LAYER_COLORS[0] },
        { name: '市场', value: 90, color: LAYER_COLORS[1] },
        { name: '运营', value: 120, color: LAYER_COLORS[2] },
      ]},
    ],
  },
  {
    name: '华北区',
    categories: [
      { name: '产品A', layers: [
        { name: '研发', value: 100, color: LAYER_COLORS[0] },
        { name: '市场', value: 70, color: LAYER_COLORS[1] },
        { name: '运营', value: 95, color: LAYER_COLORS[2] },
      ]},
      { name: '产品B', layers: [
        { name: '研发', value: 80, color: LAYER_COLORS[0] },
        { name: '市场', value: 105, color: LAYER_COLORS[1] },
        { name: '运营', value: 65, color: LAYER_COLORS[2] },
      ]},
      { name: '产品C', layers: [
        { name: '研发', value: 110, color: LAYER_COLORS[0] },
        { name: '市场', value: 90, color: LAYER_COLORS[1] },
        { name: '运营', value: 80, color: LAYER_COLORS[2] },
      ]},
      { name: '产品D', layers: [
        { name: '研发', value: 75, color: LAYER_COLORS[0] },
        { name: '市场', value: 115, color: LAYER_COLORS[1] },
        { name: '运营', value: 70, color: LAYER_COLORS[2] },
      ]},
      { name: '产品E', layers: [
        { name: '研发', value: 95, color: LAYER_COLORS[0] },
        { name: '市场', value: 85, color: LAYER_COLORS[1] },
        { name: '运营', value: 105, color: LAYER_COLORS[2] },
      ]},
    ],
  },
];

const container = document.getElementById('scene-container')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'default',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xc8d6e5, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(10, 20, 8);
scene.add(directionalLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1e293b, 0.35);
scene.add(hemiLight);

const groundGeo = new THREE.PlaneGeometry(60, 60);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  transparent: true,
  opacity: 0.6,
  roughness: 1,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
scene.add(ground);

const barChart = new BarChart(scene);
barChart.createBarChart(data, 'category', false);

const interaction = new Interaction(camera, scene, renderer, barChart, container);

const groupModeSelect = document.getElementById('group-mode') as HTMLSelectElement;
const gridToggle = document.getElementById('grid-toggle') as HTMLInputElement;
const leftPanelClose = document.getElementById('left-panel-close')!;
const bottomSheetClose = document.getElementById('bottom-sheet-close')!;
const rightPanelToggle = document.getElementById('right-panel-toggle')!;
const rightPanel = document.getElementById('right-panel')!;

groupModeSelect.addEventListener('change', () => {
  const mode = groupModeSelect.value as GroupMode;
  barChart.createBarChart(data, mode, true);
});

gridToggle.addEventListener('change', () => {
  barChart.toggleGrid(gridToggle.checked);
});

leftPanelClose.addEventListener('click', () => {
  document.getElementById('left-panel')!.classList.remove('visible');
});

bottomSheetClose.addEventListener('click', () => {
  document.getElementById('bottom-sheet')!.classList.remove('visible');
});

rightPanelToggle.addEventListener('click', () => {
  rightPanel.classList.toggle('mobile-open');
});

const legendItems = document.querySelectorAll('.legend-item');
legendItems.forEach(item => {
  const layerIndex = parseInt((item as HTMLElement).dataset.layer || '0');
  item.addEventListener('mouseenter', () => {
    item.classList.add('flashing');
    barChart.flashLayer(layerIndex, true);
  });
  item.addEventListener('mouseleave', () => {
    item.classList.remove('flashing');
    barChart.flashLayer(layerIndex, false);
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerWidth >= 768) {
    rightPanel.classList.remove('mobile-open');
  }
});

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  barChart.updateAnimations(now);
  interaction.update();
  renderer.render(scene, camera);
}

animate();
