import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  MoleculeData,
  ModelMode,
  ELEMENT_COLORS,
  ELEMENT_RADII,
  ElementType,
  AtomType,
} from './types';

const BOND_RADIUS = 0.05;
const CPK_RADIUS = 0.3;
const HALO_COLOR = 0xffd700;
const HALO_OPACITY = 0.4;
const MEASURE_COLOR = 0x00ff00;
const RIM_LIGHT_COLOR = 0x38bdf8;
const RIM_LIGHT_INTENSITY = 0.15;
const GRID_COLOR = 0x334155;

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let animationId: number;
let moleculeGroup: THREE.Group;
let haloGroup: THREE.Group;
let measurementGroup: THREE.Group;
let atomMeshes: Map<number, THREE.Mesh> = new Map();
let atomPositions: Map<number, THREE.Vector3> = new Map();
let atomElements: Map<number, ElementType> = new Map();
let currentModelMode: ModelMode = 'ball-stick';
let currentMolecule: MoleculeData | null = null;
let currentSelection: number[] = [];
let currentClippingRadius: number = 30;
let clippingCenter: THREE.Vector3 = new THREE.Vector3();
let atomIdArray: number[] = [];

let selectionBox: THREE.Mesh | null = null;
let isBoxSelecting = false;
let boxStart: THREE.Vector2 = new THREE.Vector2();
let boxEnd: THREE.Vector2 = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let onAtomClick: ((atomId: number) => void) | null = null;
let onBoxSelect: ((atomIds: number[]) => void) | null = null;

let clippingSphere: THREE.Mesh | null = null;
let clippingTransitions: Map<number, { targetOpacity: number; currentOpacity: number }> = new Map();

let measurementLabels: THREE.Sprite[] = [];
let measurementLines: THREE.Line[] = [];

const DEFAULT_CAMERA_POS = new THREE.Vector3(
  8 * Math.sin(30 * Math.PI / 180) * Math.cos(0),
  8 * Math.sin(30 * Math.PI / 180),
  8 * Math.cos(30 * Math.PI / 180)
);

function createGradientBackground(): void {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0F172A');
  gradient.addColorStop(1, '#1E293B');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  scene.background = tex;
}

function createGrid(): void {
  const grid = new THREE.GridHelper(40, 40, GRID_COLOR, GRID_COLOR);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.3;
  grid.position.y = -5;
  scene.add(grid);
}

function createLights(): void {
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 7);
  scene.add(directional);

  const rimLight1 = new THREE.PointLight(RIM_LIGHT_COLOR, RIM_LIGHT_INTENSITY, 50);
  rimLight1.position.set(-10, 0, -10);
  scene.add(rimLight1);

  const rimLight2 = new THREE.PointLight(RIM_LIGHT_COLOR, RIM_LIGHT_INTENSITY, 50);
  rimLight2.position.set(10, 0, 10);
  scene.add(rimLight2);
}

function createBallStickModel(mol: MoleculeData): THREE.Group {
  const group = new THREE.Group();
  const atomGeo = new THREE.SphereGeometry(1, 16, 12);
  const bondGeo = new THREE.CylinderGeometry(1, 1, 1, 8);

  const atomsByElement: Map<ElementType, { atom: AtomType; meshIndex: number }[]> = new Map();
  const bondsByKey: Map<string, { from: THREE.Vector3; to: THREE.Vector3; element1: ElementType; element2: ElementType }[]> = new Map();

  for (const atom of mol.atoms) {
    if (!atomsByElement.has(atom.element)) {
      atomsByElement.set(atom.element, []);
    }
    atomsByElement.get(atom.element)!.push({ atom, meshIndex: -1 });
  }

  for (const bond of mol.bonds) {
    const a1 = mol.atoms.find(a => a.id === bond.atom1Id);
    const a2 = mol.atoms.find(a => a.id === bond.atom2Id);
    if (!a1 || !a2) continue;
    const key = [a1.element, a2.element].sort().join('-');
    if (!bondsByKey.has(key)) bondsByKey.set(key, []);
    bondsByKey.get(key)!.push({
      from: new THREE.Vector3(a1.x, a1.y, a1.z),
      to: new THREE.Vector3(a2.x, a2.y, a2.z),
      element1: a1.element,
      element2: a2.element,
    });
  }

  atomsByElement.forEach((entries, element) => {
    const count = entries.length;
    const instancedMesh = new THREE.InstancedMesh(atomGeo, new THREE.MeshPhongMaterial({
      color: ELEMENT_COLORS[element],
      shininess: 60,
    }), count);
    const dummy = new THREE.Object3D();
    const radius = ELEMENT_RADII[element];

    for (let i = 0; i < count; i++) {
      const atom = entries[i].atom;
      dummy.position.set(atom.x, atom.y, atom.z);
      dummy.scale.setScalar(radius);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      atomMeshes.set(atom.id, instancedMesh as unknown as THREE.Mesh);
      atomPositions.set(atom.id, new THREE.Vector3(atom.x, atom.y, atom.z));
      atomElements.set(atom.id, atom.element);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.userData = { type: 'atoms', element, entries };
    group.add(instancedMesh);
  });

  bondsByKey.forEach((bondList) => {
    const count = bondList.length;
    const instancedMesh = new THREE.InstancedMesh(bondGeo, new THREE.MeshPhongMaterial({
      color: 0x808080,
      shininess: 40,
    }), count);
    const dummy = new THREE.Object3D();
    const halfBondPos = new THREE.Vector3();
    const bondDir = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const bond = bondList[i];
      halfBondPos.copy(bond.from).add(bond.to).multiplyScalar(0.5);
      dummy.position.copy(halfBondPos);
      bondDir.copy(bond.to).sub(bond.from);
      const len = bondDir.length();
      dummy.scale.set(BOND_RADIUS, len, BOND_RADIUS);
      dummy.lookAt(bond.to);
      dummy.rotateX(Math.PI / 2);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.userData = { type: 'bonds' };
    group.add(instancedMesh);
  });

  return group;
}

function createCartoonModel(mol: MoleculeData): THREE.Group {
  const group = new THREE.Group();

  const residues = new Map<number, AtomType[]>();
  for (const atom of mol.atoms) {
    if (atom.element === 'H') continue;
    if (!residues.has(atom.residueId)) residues.set(atom.residueId, []);
    residues.get(atom.residueId)!.push(atom);
  }

  const caAtoms: THREE.Vector3[] = [];
  const sortedResIds = [...residues.keys()].sort((a, b) => a - b);
  for (const resId of sortedResIds) {
    const resAtoms = residues.get(resId)!;
    const ca = resAtoms.find(a => a.atomName === 'CA');
    if (ca) {
      caAtoms.push(new THREE.Vector3(ca.x, ca.y, ca.z));
      atomPositions.set(ca.id, new THREE.Vector3(ca.x, ca.y, ca.z));
      atomElements.set(ca.id, ca.element);
    }
  }

  if (caAtoms.length > 2) {
    const curve = new THREE.CatmullRomCurve3(caAtoms, false);
    const tubeGeo = new THREE.TubeGeometry(curve, caAtoms.length * 4, 0.3, 8, false);
    const tubeMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8,
      shininess: 80,
      transparent: true,
      opacity: 0.85,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    group.add(tube);

    const strandGeo = new THREE.TubeGeometry(curve, caAtoms.length * 4, 0.35, 4, false);
    const strandMat = new THREE.MeshPhongMaterial({
      color: 0xf472b6,
      shininess: 80,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const strand = new THREE.Mesh(strandGeo, strandMat);
    group.add(strand);
  }

  for (const atom of mol.atoms) {
    if (atom.element === 'H') continue;
    atomPositions.set(atom.id, new THREE.Vector3(atom.x, atom.y, atom.z));
    atomElements.set(atom.id, atom.element);
  }

  return group;
}

function createWireframeModel(mol: MoleculeData): THREE.Group {
  const group = new THREE.Group();

  for (const atom of mol.atoms) {
    if (atom.element === 'H') continue;
    atomPositions.set(atom.id, new THREE.Vector3(atom.x, atom.y, atom.z));
    atomElements.set(atom.id, atom.element);
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();

  for (const bond of mol.bonds) {
    const a1 = mol.atoms.find(a => a.id === bond.atom1Id);
    const a2 = mol.atoms.find(a => a.id === bond.atom2Id);
    if (!a1 || !a2) continue;
    if (a1.element === 'H' || a2.element === 'H') continue;

    positions.push(a1.x, a1.y, a1.z, a2.x, a2.y, a2.z);
    color.set(ELEMENT_COLORS[a1.element]);
    colors.push(color.r, color.g, color.b);
    color.set(ELEMENT_COLORS[a2.element]);
    colors.push(color.r, color.g, color.b);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 1 });
  const lineSegments = new THREE.LineSegments(geo, mat);
  group.add(lineSegments);

  const sphereGeo = new THREE.SphereGeometry(0.1, 8, 6);
  const instancedByElement: Map<ElementType, AtomType[]> = new Map();
  for (const atom of mol.atoms) {
    if (atom.element === 'H') continue;
    if (!instancedByElement.has(atom.element)) instancedByElement.set(atom.element, []);
    instancedByElement.get(atom.element)!.push(atom);
  }

  instancedByElement.forEach((entries, element) => {
    const im = new THREE.InstancedMesh(sphereGeo, new THREE.MeshBasicMaterial({
      color: ELEMENT_COLORS[element],
    }), entries.length);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < entries.length; i++) {
      dummy.position.set(entries[i].x, entries[i].y, entries[i].z);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    group.add(im);
  });

  return group;
}

function updateModel(): void {
  if (!currentMolecule) return;

  if (moleculeGroup) {
    scene.remove(moleculeGroup);
    moleculeGroup.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    });
  }

  atomMeshes.clear();

  switch (currentModelMode) {
    case 'ball-stick':
      moleculeGroup = createBallStickModel(currentMolecule);
      break;
    case 'cartoon':
      moleculeGroup = createCartoonModel(currentMolecule);
      break;
    case 'wireframe':
      moleculeGroup = createWireframeModel(currentMolecule);
      break;
  }

  scene.add(moleculeGroup);
  atomIdArray = currentMolecule.atoms.map(a => a.id);
  applyClipping(currentClippingRadius, clippingCenter);
}

function createHaloMeshes(atomIds: number[]): void {
  clearHaloMeshes();
  const geo = new THREE.SphereGeometry(0.6, 16, 12);
  const mat = new THREE.MeshBasicMaterial({
    color: HALO_COLOR,
    transparent: true,
    opacity: HALO_OPACITY,
    depthWrite: false,
  });

  for (const id of atomIds) {
    const pos = atomPositions.get(id);
    if (!pos) continue;
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.position.copy(pos);
    mesh.userData = { atomId: id };
    haloGroup.add(mesh);
  }
}

function clearHaloMeshes(): void {
  while (haloGroup.children.length > 0) {
    const child = haloGroup.children[0];
    haloGroup.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (child.material instanceof THREE.Material) child.material.dispose();
    }
  }
}

function applyClipping(radius: number, center: THREE.Vector3): void {
  if (!moleculeGroup) return;

  moleculeGroup.traverse(child => {
    if (child instanceof THREE.InstancedMesh && child.userData.entries) {
      const entries = child.userData.entries;
      const dummy = new THREE.Object3D();
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();

      for (let i = 0; i < entries.length; i++) {
        child.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        const dist = position.distanceTo(center);
        const visible = dist <= radius;

        if (child.userData.type === 'atoms') {
          const scale = visible ? ELEMENT_RADII[entries[i].atom.element] : 0;
          dummy.position.copy(position);
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          child.setMatrixAt(i, dummy.matrix);
        }
      }
      child.instanceMatrix.needsUpdate = true;
      child.computeBoundingSphere();
    } else if (child instanceof THREE.InstancedMesh && child.userData.type === 'bonds') {
      child.visible = true;
    } else if (child instanceof THREE.Mesh) {
      if (child.userData.atomId !== undefined) {
        const pos = atomPositions.get(child.userData.atomId);
        if (pos) {
          const dist = pos.distanceTo(center);
          child.visible = dist <= radius;
        }
      }
    }
  });
}

function makeTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 128;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.0)';
  ctx.fillRect(0, 0, 256, 128);

  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = '#00FF00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.5, 0.75, 1);
  sprite.userData = { text, isMeasurementLabel: true };
  return sprite;
}

function animate(): void {
  animationId = requestAnimationFrame(animate);
  controls.update();

  for (const sprite of measurementLabels) {
    sprite.quaternion.copy(camera.quaternion);
  }

  renderer.render(scene, camera);
}

function getAtomAtMouse(clientX: number, clientY: number): number | null {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  let closestDist = Infinity;
  let closestId: number | null = null;

  for (const [id, pos] of atomPositions) {
    const radius = (atomElements.get(id) === 'H' ? 0.2 : CPK_RADIUS) * 1.5;
    const sphere = new THREE.Sphere(pos, radius);
    const ray = raycaster.ray;
    const point = new THREE.Vector3();
    if (ray.intersectSphere(sphere, point)) {
      const dist = ray.origin.distanceTo(point);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }
  }

  return closestId;
}

function getAtomsInBox(start: THREE.Vector2, end: THREE.Vector2): number[] {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  const result: number[] = [];
  const rect = renderer.domElement.getBoundingClientRect();

  for (const [id, pos] of atomPositions) {
    const projected = pos.clone().project(camera);
    const sx = (projected.x + 1) / 2;
    const sy = (projected.y + 1) / 2;
    if (projected.z > 0 && projected.z < 1 && sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
      result.push(id);
    }
  }

  return result;
}

export function setupScene(
  container: HTMLElement,
  callbacks: {
    onAtomClick?: (atomId: number) => void;
    onBoxSelect?: (atomIds: number[]) => void;
  }
): void {
  onAtomClick = callbacks.onAtomClick || null;
  onBoxSelect = callbacks.onBoxSelect || null;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  createGradientBackground();

  camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.copy(DEFAULT_CAMERA_POS);
  camera.lookAt(0, 0, 0);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  createLights();
  createGrid();

  moleculeGroup = new THREE.Group();
  scene.add(moleculeGroup);

  haloGroup = new THREE.Group();
  scene.add(haloGroup);

  measurementGroup = new THREE.Group();
  scene.add(measurementGroup);

  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.shiftKey && e.button === 0) {
      isBoxSelecting = true;
      boxStart.set(e.clientX, e.clientY);
      controls.enabled = false;
    }
  });

  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    if (isBoxSelecting) {
      boxEnd.set(e.clientX, e.clientY);
    }
  });

  canvas.addEventListener('mouseup', (e: MouseEvent) => {
    if (isBoxSelecting && e.button === 0) {
      isBoxSelecting = false;
      controls.enabled = true;

      const rect = canvas.getBoundingClientRect();
      const start = new THREE.Vector2(
        (boxStart.x - rect.left) / rect.width,
        1 - (boxStart.y - rect.top) / rect.height
      );
      const end = new THREE.Vector2(
        (boxEnd.x - rect.left) / rect.width,
        1 - (boxEnd.y - rect.top) / rect.height
      );

      if (Math.abs(start.x - end.x) > 0.01 || Math.abs(start.y - end.y) > 0.01) {
        const ids = getAtomsInBox(start, end);
        if (ids.length > 0 && onBoxSelect) {
          onBoxSelect(ids);
        }
      }
    }
  });

  canvas.addEventListener('click', (e: MouseEvent) => {
    if (e.shiftKey) return;
    const atomId = getAtomAtMouse(e.clientX, e.clientY);
    if (atomId !== null && onAtomClick) {
      onAtomClick(atomId);
    }
  });

  canvas.addEventListener('contextmenu', (e: Event) => {
    e.preventDefault();
  });

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  animate();
}

export function loadMolecule(mol: MoleculeData): void {
  currentMolecule = mol;
  atomIdArray = mol.atoms.map(a => a.id);
  updateModel();
}

export function setModelMode(mode: ModelMode): void {
  if (currentModelMode === mode) return;
  currentModelMode = mode;
  updateModel();
  highlightAtoms(currentSelection);
  applyClipping(currentClippingRadius, clippingCenter);
}

export function highlightAtoms(atomIds: number[]): void {
  currentSelection = atomIds;
  clearHaloMeshes();
  if (atomIds.length > 0) {
    createHaloMeshes(atomIds);
    const center = new THREE.Vector3();
    let count = 0;
    for (const id of atomIds) {
      const pos = atomPositions.get(id);
      if (pos) {
        center.add(pos);
        count++;
      }
    }
    if (count > 0) {
      center.divideScalar(count);
      clippingCenter.copy(center);
    }
  }
}

export function updateClipping(radius: number, center?: THREE.Vector3): void {
  currentClippingRadius = radius;
  if (center) clippingCenter.copy(center);

  if (moleculeGroup) {
    moleculeGroup.traverse(child => {
      if (child instanceof THREE.InstancedMesh && child.userData.entries) {
        const entries = child.userData.entries;
        const dummy = new THREE.Object3D();
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();

        for (let i = 0; i < entries.length; i++) {
          child.getMatrixAt(i, matrix);
          position.setFromMatrixPosition(matrix);
          const dist = position.distanceTo(clippingCenter);
          const visible = dist <= radius;
          const scale = visible ? ELEMENT_RADII[entries[i].atom.element] : 0;
          dummy.position.copy(position);
          dummy.scale.setScalar(scale);
          dummy.updateMatrix();
          child.setMatrixAt(i, dummy.matrix);
        }
        child.instanceMatrix.needsUpdate = true;
        child.computeBoundingSphere();
      }
    });
  }
}

export function addMeasurement(id: number, atom1Id: number, atom2Id: number): void {
  const pos1 = atomPositions.get(atom1Id);
  const pos2 = atomPositions.get(atom2Id);
  if (!pos1 || !pos2) return;

  const distance = pos1.distanceTo(pos2);

  const points = [pos1.clone(), pos2.clone()];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({
    color: MEASURE_COLOR,
    dashSize: 0.2,
    gapSize: 0.13,
    linewidth: 1,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.userData = { measurementId: id };
  measurementGroup.add(line);
  measurementLines.push(line);

  const midPoint = pos1.clone().add(pos2).multiplyScalar(0.5);
  const label = makeTextSprite(distance.toFixed(2) + ' Å');
  label.position.copy(midPoint);
  label.position.y += 0.3;
  label.userData = { measurementId: id };
  measurementGroup.add(label);
  measurementLabels.push(label);
}

export function removeMeasurement(id: number): void {
  const lineIdx = measurementLines.findIndex(l => l.userData.measurementId === id);
  if (lineIdx >= 0) {
    const line = measurementLines[lineIdx];
    measurementGroup.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
    measurementLines.splice(lineIdx, 1);
  }
  const labelIdx = measurementLabels.findIndex(l => l.userData.measurementId === id);
  if (labelIdx >= 0) {
    const label = measurementLabels[labelIdx];
    measurementGroup.remove(label);
    label.material.dispose();
    (label.material as THREE.SpriteMaterial).map?.dispose();
    measurementLabels.splice(labelIdx, 1);
  }
}

export function clearAllMeasurements(): void {
  while (measurementGroup.children.length > 0) {
    const child = measurementGroup.children[0];
    measurementGroup.remove(child);
    if (child instanceof THREE.Line) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    } else if (child instanceof THREE.Sprite) {
      (child.material as THREE.SpriteMaterial).map?.dispose();
      child.material.dispose();
    }
  }
  measurementLines = [];
  measurementLabels = [];
}

export function resetCamera(): void {
  camera.position.copy(DEFAULT_CAMERA_POS);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

export function getSceneInfo(): { atomCount: number; bondCount: number } {
  if (!currentMolecule) return { atomCount: 0, bondCount: 0 };
  return {
    atomCount: currentMolecule.atoms.length,
    bondCount: currentMolecule.bonds.length,
  };
}

export function getAtomInfo(atomId: number): AtomType | null {
  if (!currentMolecule) return null;
  return currentMolecule.atoms.find(a => a.id === atomId) || null;
}

export function dispose(): void {
  if (animationId) cancelAnimationFrame(animationId);
  renderer?.dispose();
}
