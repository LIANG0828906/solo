import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePotteryStore } from './store';

export let scene: THREE.Scene;
export let camera: THREE.PerspectiveCamera;
export let renderer: THREE.WebGLRenderer;
export let potteryMesh: THREE.Mesh;
export let wheelGroup: THREE.Group;

let controls: OrbitControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let potteryMaterial: THREE.MeshStandardMaterial;

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  type: 'ripple' | 'heat';
}

const particlePool: Particle[] = [];
const MAX_PARTICLES = 100;
const rippleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
const heatGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const rippleMaterial = new THREE.MeshBasicMaterial({
  color: 0xE0E0E0,
  transparent: true,
  opacity: 0.8,
});
const heatMaterial = new THREE.MeshBasicMaterial({
  color: 0xFF6633,
  transparent: true,
  opacity: 0.4,
});

let lastTime = 0;
let heatTimer = 0;

const POTTERY_HEIGHT = 3;

export function initScene(container: HTMLElement): void {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  const floorGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
  const floorColors: number[] = [];
  const color1 = new THREE.Color(0x4A4A4A);
  const color2 = new THREE.Color(0x5C5C5C);

  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      const color = (i + j) % 2 === 0 ? color1 : color2;
      floorColors.push(color.r, color.g, color.b);
      floorColors.push(color.r, color.g, color.b);
      floorColors.push(color.r, color.g, color.b);
      floorColors.push(color.r, color.g, color.b);
    }
  }
  floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(floorColors, 3));

  const floorMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  wheelGroup = new THREE.Group();

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B5E3C,
    roughness: 0.6,
    metalness: 0.1,
  });

  const torusGeometry = new THREE.TorusGeometry(1.3, 0.15, 16, 32);
  const wheelTorus = new THREE.Mesh(torusGeometry, wheelMaterial);
  wheelTorus.rotation.x = Math.PI / 2;
  wheelTorus.castShadow = true;
  wheelTorus.receiveShadow = true;
  wheelGroup.add(wheelTorus);

  const cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32);
  const wheelCylinder = new THREE.Mesh(cylinderGeometry, wheelMaterial);
  wheelCylinder.position.y = -0.15;
  wheelCylinder.castShadow = true;
  wheelCylinder.receiveShadow = true;
  wheelGroup.add(wheelCylinder);

  scene.add(wheelGroup);

  potteryMaterial = new THREE.MeshStandardMaterial({
    color: 0xCD853F,
    roughness: 0.9,
    metalness: 0.1,
  });

  const initialPoints: THREE.Vector2[] = [];
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    initialPoints.push(new THREE.Vector2(1, t * POTTERY_HEIGHT - POTTERY_HEIGHT / 2));
  }

  const latheGeometry = new THREE.LatheGeometry(initialPoints, 24);
  potteryMesh = new THREE.Mesh(latheGeometry, potteryMaterial);
  potteryMesh.position.y = 0.15;
  potteryMesh.castShadow = true;
  potteryMesh.receiveShadow = true;
  scene.add(potteryMesh);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 1.5, 0);
  controls.update();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const geometry = i % 2 === 0 ? rippleGeometry : heatGeometry;
    const material = i % 2 === 0 ? rippleMaterial : heatMaterial;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    particlePool.push({
      mesh,
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      active: false,
      type: i % 2 === 0 ? 'ripple' : 'heat',
    });
  }

  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handleResize);
}

function getParticle(type: 'ripple' | 'heat'): Particle | null {
  for (const particle of particlePool) {
    if (!particle.active && particle.type === type) {
      return particle;
    }
  }
  return null;
}

export function createRippleParticles(y: number): void {
  for (let i = 0; i < 30; i++) {
    const particle = getParticle('ripple');
    if (particle) {
      const angle = (i / 30) * Math.PI * 2;
      const startRadius = 0.8 + Math.random() * 0.4;
      const x = Math.cos(angle) * startRadius;
      const z = Math.sin(angle) * startRadius;
      particle.mesh.position.set(x, y, z);
      particle.velocity.set(
        Math.cos(angle) * 2,
        0,
        Math.sin(angle) * 2
      );
      particle.life = 0.6;
      particle.maxLife = 0.6;
      particle.active = true;
      particle.mesh.visible = true;
      particle.mesh.scale.setScalar(1);
    }
  }
}

export function createHeatParticles(): void {
  const particle = getParticle('heat');
  if (particle) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const size = 0.05 + Math.random() * 0.1;
    particle.mesh.position.set(x, POTTERY_HEIGHT / 2 + 0.3, z);
    particle.velocity.set(0, 0.5, 0);
    particle.life = 1.5;
    particle.maxLife = 1.5;
    particle.active = true;
    particle.mesh.visible = true;
    particle.mesh.scale.setScalar(size);
  }
}

export function updatePotteryShape(points: number[]): void {
  const geometry = potteryMesh.geometry as THREE.LatheGeometry;
  const positions = geometry.attributes.position;
  const segments = 24;
  const heightSegments = points.length;

  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments;
    const radius = i < points.length ? points[i] : points[points.length - 1];
    const y = t * POTTERY_HEIGHT - POTTERY_HEIGHT / 2;

    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const index = i * (segments + 1) + j;
      positions.setXYZ(
        index,
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
    }
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

export function updatePotteryMaterial(progress: number, coverage: number): void {
  const clayColor = new THREE.Color(0xCD853F);
  const finalColor = coverage > 0.5 ? new THREE.Color(0xB22222) : new THREE.Color(0x8B0000);
  potteryMaterial.color.copy(clayColor.clone().lerp(finalColor, progress));
  potteryMaterial.roughness = 0.9 - progress * 0.6;
  potteryMaterial.metalness = 0.1 + progress * 0.3;
}

export function renderFrame(time: number): void {
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  const state = usePotteryStore.getState();

  const rpm = 30;
  const angularVelocity = (rpm * Math.PI * 2) / 60;
  wheelGroup.rotation.y += angularVelocity * delta;

  if (state.isFiring) {
    heatTimer += delta;
    if (heatTimer > 0.05) {
      heatTimer = 0;
      createHeatParticles();
    }
  }

  for (const particle of particlePool) {
    if (particle.active) {
      particle.life -= delta;
      if (particle.life <= 0) {
        particle.active = false;
        particle.mesh.visible = false;
      } else {
        particle.mesh.position.addScaledVector(particle.velocity, delta);
        const alpha = particle.life / particle.maxLife;
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.8;
        if (particle.type === 'ripple') {
          const scale = 1 + (1 - alpha) * 0.5;
          particle.mesh.scale.setScalar(scale);
        }
      }
    }
  }

  updatePotteryShape(state.shapePoints);
  updatePotteryMaterial(state.firingProgress, state.glazeCoverage);

  controls.update();
  renderer.render(scene, camera);
}

function getIntersection(event: MouseEvent): THREE.Intersection | null {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(potteryMesh);
  return intersects.length > 0 ? intersects[0] : null;
}

export function handleMouseDown(event: MouseEvent): void {
  const state = usePotteryStore.getState();

  if (state.currentStep === 'firing') return;

  const intersection = getIntersection(event);
  if (!intersection) return;

  if (state.currentStep === 'shaping') {
    controls.enabled = false;
    const pointIndex = Math.floor(((intersection.point.y / POTTERY_HEIGHT) + 0.5) * 24);
    const clampedIndex = Math.max(0, Math.min(23, pointIndex));
    usePotteryStore.getState().setDragging(true, event.clientY, clampedIndex);
  } else if (state.currentStep === 'glazing') {
    const localPoint = intersection.uv;
    if (localPoint) {
      usePotteryStore.getState().addGlazeSpot(localPoint.x, localPoint.y);
      createRippleParticles(intersection.point.y);
    }
  }
}

export function handleMouseMove(event: MouseEvent): void {
  const state = usePotteryStore.getState();

  if (state.currentStep === 'firing') return;
  if (!state.isDragging) return;
  if (state.currentStep !== 'shaping') return;

  const deltaY = event.clientY - state.dragStartY;
  const delta = -deltaY * 0.02;
  usePotteryStore.getState().deformPottery(state.dragStartPointIndex, delta);
  usePotteryStore.getState().setDragging(true, event.clientY, state.dragStartPointIndex);
}

export function handleMouseUp(): void {
  const state = usePotteryStore.getState();
  if (state.isDragging) {
    usePotteryStore.getState().setDragging(false);
  }
  controls.enabled = true;
}
