import * as THREE from 'three';
import {
  MoleculeGroup,
  ELEMENT_INFO,
  ElementType,
  getCoordinationNumber,
  formatCoordination,
} from './moleculeLoader';
import { showInfoCard, hideInfoCard, updateInfoCard } from './ui';

export interface InteractionOptions {
  getScene: () => THREE.Scene;
  getCamera: () => THREE.PerspectiveCamera;
  getAtomGroup: () => THREE.Group | null;
  getCurrentMolecule: () => MoleculeGroup | null;
  renderer: THREE.WebGLRenderer;
}

interface HighlightState {
  mesh: THREE.Mesh;
  originalScale: THREE.Vector3;
  originalEmissive: THREE.Color;
  originalEmissiveIntensity: number;
  haloMesh: THREE.Mesh | null;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentHighlight: HighlightState | null = null;
let doubleClickTimer: number | undefined = undefined;
let lastClickTime = 0;
let selectedAtomId: string | null = null;

const HIGHLIGHT_COLOR = new THREE.Color(0x00ff88);
const GLOW_SCALE = 1.2;

export function setupInteraction(options: InteractionOptions) {
  const { getScene, getCamera, getAtomGroup, getCurrentMolecule, renderer } = options;
  const dom = renderer.domElement;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  const DRAG_THRESHOLD = 5;

  dom.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    isDragging = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  dom.addEventListener('pointermove', (e) => {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      isDragging = true;
    }

    const rect = dom.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, getCamera());
    const atomGroup = getAtomGroup();
    if (atomGroup) {
      const intersects = raycaster.intersectObjects(atomGroup.children, false);
      dom.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
    }
  });

  dom.addEventListener('pointerup', (e) => {
    if (e.button !== 0) return;
    if (isDragging) return;

    const now = performance.now();
    const isDoubleClick = now - lastClickTime < 320;
    lastClickTime = now;

    const rect = dom.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, getCamera());
    const atomGroup = getAtomGroup();

    if (!atomGroup) {
      clearHighlight();
      hideInfoCard();
      return;
    }

    const intersects = raycaster.intersectObjects(atomGroup.children, false);

    if (intersects.length === 0) {
      clearHighlight();
      hideInfoCard();
      selectedAtomId = null;
      return;
    }

    const hitMesh = intersects[0].object as THREE.Mesh;
    if (!hitMesh.userData?.isAtom) return;

    const atomId = hitMesh.userData.atomId as string;
    const element = hitMesh.userData.element as ElementType;
    const molecule = getCurrentMolecule();

    if (!molecule) return;

    if (isDoubleClick) {
      if (doubleClickTimer) window.clearTimeout(doubleClickTimer);
      doubleClickTimer = undefined;
      applyDoubleClickHighlight(hitMesh);
    } else {
      if (doubleClickTimer) window.clearTimeout(doubleClickTimer);
      doubleClickTimer = window.setTimeout(() => {
        doubleClickTimer = undefined;
      }, 320);
    }

    applyHighlight(hitMesh);
    selectedAtomId = atomId;

    const info = ELEMENT_INFO[element];
    const { neighbors } = getCoordinationNumber(atomId, molecule.data);

    updateInfoCard({
      symbol: element,
      name: info.name,
      atomicNumber: info.atomicNumber,
      atomicRadius: info.atomicRadius,
      coordinationText: formatCoordination(neighbors),
      color: info.cpkColor,
    });
    showInfoCard();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearHighlight();
      hideInfoCard();
      selectedAtomId = null;
    }
  });

  const infoCardEl = document.getElementById('info-card');
  infoCardEl?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('#info-card')) return;
    if (target.closest('.view-btn')) return;
    if (target.closest('.molecule-selector')) return;
    if (target === dom || dom.contains(target)) return;
    clearHighlight();
    hideInfoCard();
    selectedAtomId = null;
  });

  document.addEventListener('deselect-atom', () => {
    clearHighlight();
    selectedAtomId = null;
  });
}

function createHaloMesh(mesh: THREE.Mesh): THREE.Mesh {
  const haloGeo = new THREE.SphereGeometry(1, 24, 16);
  const haloMat = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: HIGHLIGHT_COLOR },
      viewVector: { value: new THREE.Vector3(0, 0, 1) },
      c: { value: 0.3 },
      p: { value: 3.5 },
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(c - dot(vNormal, vNormel), p);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4(glow, intensity * 0.85);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.scale.copy(mesh.scale).multiplyScalar(1.35);
  halo.position.copy(mesh.position);
  return halo;
}

function applyHighlight(mesh: THREE.Mesh) {
  if (currentHighlight?.mesh === mesh) return;
  clearHighlight();

  const material = mesh.material as THREE.MeshStandardMaterial;
  const origEmissive = material.emissive?.clone() || new THREE.Color(0x000000);
  const origEmissiveIntensity = material.emissiveIntensity ?? 0;

  material.emissive = HIGHLIGHT_COLOR.clone();
  material.emissiveIntensity = 0.35;
  material.needsUpdate = true;

  let halo: THREE.Mesh | null = null;
  const parent = mesh.parent;
  if (parent) {
    halo = createHaloMesh(mesh);
    parent.add(halo);
  }

  const targetScale = mesh.userData.originalScale * GLOW_SCALE;
  animateScale(mesh, targetScale, 450);

  currentHighlight = {
    mesh,
    originalScale: mesh.scale.clone(),
    originalEmissive: origEmissive,
    originalEmissiveIntensity: origEmissiveIntensity,
    haloMesh: halo,
  };
}

function applyDoubleClickHighlight(mesh: THREE.Mesh) {
  const material = mesh.material as THREE.MeshStandardMaterial;

  const pulseStart = performance.now();
  const pulseDuration = 2000;
  const baseEmissive = HIGHLIGHT_COLOR.clone();
  const baseScale = mesh.userData.originalScale * GLOW_SCALE;

  function pulseStep() {
    const elapsed = performance.now() - pulseStart;
    const t = Math.min(elapsed / pulseDuration, 1);
    const pulse = 1 + 0.15 * Math.sin(elapsed * 0.012) * (1 - t * 0.5);

    material.emissive = baseEmissive.clone();
    material.emissiveIntensity = 0.35 + 0.35 * pulse * (1 - t);
    material.needsUpdate = true;

    const s = baseScale * pulse;
    mesh.scale.setScalar(s);

    if (currentHighlight?.haloMesh) {
      currentHighlight.haloMesh.scale.setScalar(s * 1.35);
    }

    if (t < 1) {
      requestAnimationFrame(pulseStep);
    } else {
      material.emissiveIntensity = 0.35;
      mesh.scale.setScalar(baseScale);
    }
  }
  pulseStep();
}

function clearHighlight() {
  if (!currentHighlight) return;

  const { mesh, originalEmissive, originalEmissiveIntensity, haloMesh } = currentHighlight;
  const material = mesh.material as THREE.MeshStandardMaterial;

  material.emissive = originalEmissive;
  material.emissiveIntensity = originalEmissiveIntensity;
  material.needsUpdate = true;

  if (haloMesh) {
    const parent = haloMesh.parent;
    if (parent) parent.remove(haloMesh);
    (haloMesh.geometry as THREE.BufferGeometry).dispose();
    (haloMesh.material as THREE.Material).dispose();
  }

  const targetScale = mesh.userData.originalScale as number;
  animateScale(mesh, targetScale, 350);

  currentHighlight = null;
}

function animateScale(mesh: THREE.Mesh, target: number, duration: number) {
  const start = mesh.scale.x;
  const startTime = performance.now();

  function step() {
    const t = Math.min((performance.now() - startTime) / duration, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const s = start + (target - start) * eased;
    mesh.scale.setScalar(s);
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}
