import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Organism } from './organism';
import { FoodManager } from './food';

const BOUNDS = 30;
const HALF = BOUNDS / 2;
const MAX_POPULATION = 30;
const CULL_COUNT = 5;

const SPECIES_NAMES = ['A', 'B', 'C'];
const SPECIES_CSS = ['#00E5FF', '#FF6F00', '#E040FB'];

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(20, 18, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 60;

const bgCanvas = document.createElement('canvas');
bgCanvas.width = 2;
bgCanvas.height = 512;
const bgCtx = bgCanvas.getContext('2d')!;
const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
bgGrad.addColorStop(0, '#001B3D');
bgGrad.addColorStop(1, '#1A0A2E');
bgCtx.fillStyle = bgGrad;
bgCtx.fillRect(0, 0, 2, 512);
const bgTexture = new THREE.CanvasTexture(bgCanvas);
bgTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.background = bgTexture;

scene.fog = new THREE.FogExp2(0x000d1a, 0.012);

const ambientLight = new THREE.AmbientLight(0x1a2a4a, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x4466aa, 0.4);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

const hemisphereLight = new THREE.HemisphereLight(0x1a3a5c, 0x0a0a2e, 0.3);
scene.add(hemisphereLight);

const gridMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 });
const gridStep = 2;
for (let i = -HALF; i <= HALF; i += gridStep) {
  const pts1 = [new THREE.Vector3(i, -HALF, -HALF), new THREE.Vector3(i, -HALF, HALF)];
  const pts2 = [new THREE.Vector3(-HALF, -HALF, i), new THREE.Vector3(HALF, -HALF, i)];
  const pts3 = [new THREE.Vector3(i, HALF, -HALF), new THREE.Vector3(i, HALF, HALF)];
  const pts4 = [new THREE.Vector3(-HALF, HALF, i), new THREE.Vector3(HALF, HALF, i)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts4), gridMaterial));
}
for (let i = -HALF; i <= HALF; i += gridStep) {
  const pts1 = [new THREE.Vector3(-HALF, i, -HALF), new THREE.Vector3(-HALF, i, HALF)];
  const pts2 = [new THREE.Vector3(-HALF, -HALF, i), new THREE.Vector3(-HALF, HALF, i)];
  const pts3 = [new THREE.Vector3(HALF, i, -HALF), new THREE.Vector3(HALF, i, HALF)];
  const pts4 = [new THREE.Vector3(HALF, -HALF, i), new THREE.Vector3(HALF, HALF, i)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts4), gridMaterial));
}
for (let i = -HALF; i <= HALF; i += gridStep) {
  const pts1 = [new THREE.Vector3(-HALF, -HALF, i), new THREE.Vector3(-HALF, HALF, i)];
  const pts2 = [new THREE.Vector3(HALF, -HALF, i), new THREE.Vector3(HALF, HALF, i)];
  const pts3 = [new THREE.Vector3(-HALF, i, -HALF), new THREE.Vector3(HALF, i, -HALF)];
  const pts4 = [new THREE.Vector3(-HALF, i, HALF), new THREE.Vector3(HALF, i, HALF)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), gridMaterial));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts4), gridMaterial));
}

const boxGeo = new THREE.BoxGeometry(BOUNDS, BOUNDS, BOUNDS);
const boxEdges = new THREE.EdgesGeometry(boxGeo);
const boxLine = new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }));
scene.add(boxLine);

const organisms: Organism[] = [];
const foodManager = new FoodManager();

function randomPosition(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * BOUNDS * 0.8,
    (Math.random() - 0.5) * BOUNDS * 0.8,
    (Math.random() - 0.5) * BOUNDS * 0.8
  );
}

function initPopulation(): void {
  for (let s = 0; s < 3; s++) {
    const count = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const org = new Organism(s, randomPosition());
      organisms.push(org);
      scene.add(org.mesh);
    }
  }
}

foodManager.generate(200, BOUNDS);
for (const food of foodManager.getAll()) {
  scene.add(food);
}
foodManager.spawnPeriodic(2000);

initPopulation();

let selectedOrganism: Organism | null = null;
let isPaused = false;
let focusTarget: THREE.Vector3 | null = null;
let focusLerp = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const organismMeshes = organisms.map(o => o.mesh);
  const intersects = raycaster.intersectObjects(organismMeshes, true);

  if (intersects.length > 0) {
    let hitObj: THREE.Object3D = intersects[0].object;
    while (hitObj.parent && !(hitObj instanceof THREE.Group)) {
      hitObj = hitObj.parent;
    }
    const org = organisms.find(o => o.mesh === hitObj);
    if (org) {
      if (selectedOrganism && selectedOrganism !== org) {
        selectedOrganism.setSelected(false);
      }
      org.setSelected(true);
      selectedOrganism = org;
      return;
    }
  }

  if (selectedOrganism) {
    selectedOrganism.setSelected(false);
    selectedOrganism = null;
  }
});

function focusOnSpecies(speciesIndex: number): void {
  const candidates = organisms.filter(o => o.species === speciesIndex);
  if (candidates.length === 0) return;

  if (selectedOrganism) {
    selectedOrganism.setSelected(false);
  }

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  target.setSelected(true);
  selectedOrganism = target;

  focusTarget = target.position.clone();
  focusLerp = 0;
}

function resetPositions(): void {
  for (const org of organisms) {
    org.position.copy(randomPosition());
    org.velocity.set(
      (Math.random() - 0.5),
      (Math.random() - 0.5),
      (Math.random() - 0.5)
    ).normalize().multiplyScalar(org.speed);
    org.mesh.position.copy(org.position);
  }
}

window.addEventListener('keydown', (event: KeyboardEvent) => {
  switch (event.key) {
    case '1':
      focusOnSpecies(0);
      break;
    case '2':
      focusOnSpecies(1);
      break;
    case '3':
      focusOnSpecies(2);
      break;
    case 'r':
    case 'R':
      resetPositions();
      break;
    case ' ':
      event.preventDefault();
      isPaused = !isPaused;
      break;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const panelEl = document.createElement('div');
panelEl.style.cssText = `
  position: fixed; bottom: 20px; left: 20px; width: 280px;
  background: rgba(13, 27, 42, 0.6); backdrop-filter: blur(12px);
  border-radius: 12px; padding: 16px; z-index: 10;
  font-family: 'Segoe UI', system-ui, sans-serif; color: #fff;
  border: 1px solid rgba(255,255,255,0.08);
`;

const row1 = document.createElement('div');
row1.style.cssText = 'font-size:14px; margin-bottom:10px; display:flex; gap:8px; align-items:center;';

const orgCountSpan = document.createElement('span');
orgCountSpan.style.color = '#FFFFFF';
const foodCountSpan = document.createElement('span');
foodCountSpan.style.color = '#FFFFFF';

row1.appendChild(orgCountSpan);
row1.appendChild(foodCountSpan);
panelEl.appendChild(row1);

const row2 = document.createElement('div');
row2.style.cssText = 'display:flex; gap:8px; margin-bottom:10px; align-items:center;';

const speciesSpans: HTMLSpanElement[] = [];

for (let s = 0; s < 3; s++) {
  const swatch = document.createElement('span');
  swatch.style.cssText = `
    display:inline-block; width:24px; height:24px; border-radius:4px;
    background:${SPECIES_CSS[s]};
  `;
  const label = document.createElement('span');
  label.style.cssText = 'font-size:12px; color:#FFFFFF; margin-right:4px;';
  const wrap = document.createElement('span');
  wrap.style.cssText = 'display:flex; align-items:center; gap:4px;';
  wrap.appendChild(swatch);
  wrap.appendChild(label);
  row2.appendChild(wrap);
  speciesSpans.push(label);
}

panelEl.appendChild(row2);

const row3 = document.createElement('div');
row3.style.cssText = 'display:flex; gap:6px;';

const btnConfig = [
  { label: '1', title: '聚焦物种A' },
  { label: '2', title: '聚焦物种B' },
  { label: '3', title: '聚焦物种C' },
  { label: 'R', title: '重置位置' },
  { label: '⏸', title: '暂停/恢复' },
];

const btnElements: HTMLButtonElement[] = [];

for (const cfg of btnConfig) {
  const btn = document.createElement('button');
  btn.textContent = cfg.label;
  btn.title = cfg.title;
  btn.style.cssText = `
    width:32px; height:32px; border-radius:3px; border:none;
    background:rgba(255,255,255,0.12); color:#fff; font-size:12px;
    cursor:pointer; transition: background 0.2s;
    display:flex; align-items:center; justify-content:center;
    font-family: 'Segoe UI', system-ui, sans-serif;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.25)'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.12)'; });
  row3.appendChild(btn);
  btnElements.push(btn);
}

btnElements[0].addEventListener('click', () => focusOnSpecies(0));
btnElements[1].addEventListener('click', () => focusOnSpecies(1));
btnElements[2].addEventListener('click', () => focusOnSpecies(2));
btnElements[3].addEventListener('click', () => resetPositions());
btnElements[4].addEventListener('click', () => { isPaused = !isPaused; });

panelEl.appendChild(row3);
document.body.appendChild(panelEl);

const notificationContainer = document.createElement('div');
notificationContainer.style.cssText = `
  position: fixed; top: 20px; right: 20px; z-index: 20;
  display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
`;
document.body.appendChild(notificationContainer);

function showNotification(text: string): void {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    background: rgba(13, 27, 42, 0.75); backdrop-filter: blur(8px);
    color: #FFFFFF; padding: 10px 18px; border-radius: 8px;
    font-size: 13px; font-family: 'Segoe UI', system-ui, sans-serif;
    border: 1px solid rgba(255,255,255,0.1);
    opacity: 0; transition: opacity 0.3s ease-in;
    pointer-events: none; white-space: nowrap;
  `;
  notificationContainer.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });

  setTimeout(() => {
    el.style.transition = 'opacity 0.5s ease-out';
    el.style.opacity = '0';
    setTimeout(() => {
      notificationContainer.removeChild(el);
    }, 500);
  }, 2000);
}

const clock = new THREE.Clock();
let prevFoodCount = 200;

function animate(): void {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.05);

  controls.update();

  if (focusLerp < 1 && focusTarget) {
    focusLerp += deltaTime;
    if (focusLerp >= 1) focusLerp = 1;
    const t = focusLerp;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    controls.target.lerp(focusTarget, eased);
  }

  if (!isPaused) {
    const newFoods: THREE.Mesh[] = [];
    const currentFoodCount = foodManager.getCount();
    if (currentFoodCount > prevFoodCount) {
      const all = foodManager.getAll();
      for (let i = prevFoodCount; i < all.length; i++) {
        newFoods.push(all[i]);
        scene.add(all[i]);
      }
    }
    prevFoodCount = currentFoodCount;

    const foodArray = foodManager.getAll();

    for (const org of organisms) {
      const nearest = org.findNearestFood(foodArray);
      if (nearest) {
        org.steerToward(nearest, deltaTime);
      } else {
        org.wander(deltaTime);
      }
      org.update(deltaTime, BOUNDS);

      const eaten = org.checkEat(foodArray);
      if (eaten) {
        foodManager.consume(eaten);
        prevFoodCount = foodManager.getCount();
      }

      const offspring = org.reproduce();
      if (offspring) {
        organisms.push(offspring);
        scene.add(offspring.mesh);
        showNotification(`物种${SPECIES_NAMES[offspring.species]}成功繁殖！当前总数：${organisms.length}`);
      }
    }

    if (organisms.length > MAX_POPULATION) {
      const sorted = [...organisms].sort((a, b) => b.aliveTime - a.aliveTime);
      for (let i = 0; i < CULL_COUNT && organisms.length > MAX_POPULATION; i++) {
        const oldest = sorted[i];
        const idx = organisms.indexOf(oldest);
        if (idx !== -1) {
          if (oldest === selectedOrganism) {
            selectedOrganism = null;
          }
          oldest.dispose();
          organisms.splice(idx, 1);
        }
      }
    }
  }

  orgCountSpan.textContent = `有机体: ${organisms.length}`;
  foodCountSpan.textContent = `食物: ${foodManager.getCount()}`;

  for (let s = 0; s < 3; s++) {
    const count = organisms.filter(o => o.species === s).length;
    speciesSpans[s].textContent = `${SPECIES_NAMES[s]}: ${count}`;
  }

  renderer.render(scene, camera);
}

animate();
