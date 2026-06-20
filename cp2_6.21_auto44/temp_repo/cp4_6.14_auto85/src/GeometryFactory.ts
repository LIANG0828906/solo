import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export type GeometryType = 'cube' | 'sphere' | 'cylinder' | 'cone';

export interface GeometryData {
  id: string;
  type: GeometryType;
  scale: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  color: string;
  isBooleanResult?: boolean;
}

export interface GeometryObject {
  group: THREE.Group;
  mesh: THREE.Mesh;
  wireframe?: THREE.LineSegments;
  label: CSS2DObject;
  data: GeometryData;
}

const TYPE_LABELS: Record<GeometryType, string> = {
  cube: '立方体',
  sphere: '球体',
  cylinder: '圆柱体',
  cone: '圆锥体',
};

const GEOMETRY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

let idCounter = 0;
const generateId = (): string => `geo_${Date.now()}_${idCounter++}`;

const getComplementaryColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
};

const hexToRgb = (hex: string): THREE.Color => {
  return new THREE.Color(hex);
};

const createGeometry = (type: GeometryType, scale: number): THREE.BufferGeometry => {
  const s = scale;
  switch (type) {
    case 'cube':
      return new THREE.BoxGeometry(s * 1.5, s * 1.5, s * 1.5, 12, 12, 12);
    case 'sphere':
      return new THREE.SphereGeometry(s * 0.9, 24, 18);
    case 'cylinder':
      return new THREE.CylinderGeometry(s * 0.7, s * 0.7, s * 1.6, 32, 12);
    case 'cone':
      return new THREE.ConeGeometry(s * 0.85, s * 1.8, 32, 12);
  }
};

export const createGeometryObject = (
  type: GeometryType,
  position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  scale = 1.0,
  color?: string
): GeometryObject => {
  const geoColor = color || GEOMETRY_COLORS[Math.floor(Math.random() * GEOMETRY_COLORS.length)];
  const id = generateId();

  const group = new THREE.Group();
  group.position.set(position.x, position.y, position.z);

  const geometry = createGeometry(type, 1);

  const material = new THREE.MeshStandardMaterial({
    color: geoColor,
    metalness: 0.2,
    roughness: 0.6,
    transparent: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.geometryId = id;

  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geometry);
  const wireframeColor = getComplementaryColor(geoColor);
  const wireframeMaterial = new THREE.LineBasicMaterial({
    color: wireframeColor,
    transparent: true,
    opacity: 0.15,
  });
  const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
  wireframe.scale.setScalar(scale);
  group.add(wireframe);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'geo-label';
  const labelSpan = document.createElement('span');
  labelSpan.className = 'label-type';
  labelSpan.textContent = TYPE_LABELS[type];
  const coordsSpan = document.createElement('span');
  coordsSpan.className = 'label-coords';
  coordsSpan.textContent = 'X:0.0 Y:0.0 Z:0.0';
  labelDiv.appendChild(labelSpan);
  labelDiv.appendChild(coordsSpan);

  const label = new CSS2DObject(labelDiv);
  label.position.set(0, scale * 1.5 + 0.5, 0);
  group.add(label);

  const data: GeometryData = {
    id,
    type,
    scale,
    position: { ...position },
    rotation: { x: 0, y: 0, z: 0 },
    color: geoColor,
  };

  mesh.userData.geometryData = data;
  wireframe.userData.geometryId = id;
  label.userData.geometryId = id;

  return { group, mesh, wireframe, label, data };
};

export const updateScale = (obj: GeometryObject, scale: number): void => {
  obj.data.scale = scale;
  obj.mesh.scale.setScalar(scale);
  if (obj.wireframe) {
    obj.wireframe.scale.setScalar(scale);
  }
  obj.label.position.set(0, scale * 1.5 + 0.5, 0);
};

export const updatePosition = (obj: GeometryObject, x: number, y: number, z: number): void => {
  obj.data.position = { x, y, z };
  obj.group.position.set(x, y, z);
  updateLabelCoords(obj);
};

export const updateRotation = (
  obj: GeometryObject,
  xDeg: number,
  yDeg: number,
  zDeg: number
): void => {
  obj.data.rotation = { x: xDeg, y: yDeg, z: zDeg };
  obj.group.rotation.set(
    THREE.MathUtils.degToRad(xDeg),
    THREE.MathUtils.degToRad(yDeg),
    THREE.MathUtils.degToRad(zDeg)
  );
};

export const updateLabelCoords = (obj: GeometryObject): void => {
  const el = obj.label.element as HTMLElement;
  const coords = el.querySelector('.label-coords');
  if (coords) {
    coords.textContent = `X:${obj.data.position.x.toFixed(1)} Y:${obj.data.position.y.toFixed(
      1
    )} Z:${obj.data.position.z.toFixed(1)}`;
  }
};

export const setSelected = (obj: GeometryObject, selected: boolean): void => {
  const mat = obj.mesh.material as THREE.MeshStandardMaterial;
  if (selected) {
    mat.emissive = new THREE.Color('#60a5fa');
    mat.emissiveIntensity = 0.5;
    const edges = new THREE.EdgesGeometry(obj.mesh.geometry);
    const glowMat = new THREE.LineBasicMaterial({
      color: '#60a5fa',
      transparent: true,
      opacity: 0.8,
    });
    const glow = new THREE.LineSegments(edges, glowMat);
    glow.name = '__selectionGlow';
    glow.scale.setScalar(obj.data.scale);
    obj.group.add(glow);
  } else {
    mat.emissive = new THREE.Color(0x000000);
    mat.emissiveIntensity = 0;
    const glow = obj.group.getObjectByName('__selectionGlow') as THREE.LineSegments | undefined;
    if (glow) {
      obj.group.remove(glow);
      glow.geometry.dispose();
      const mats = Array.isArray(glow.material) ? glow.material : [glow.material];
      mats.forEach((m) => m.dispose());
    }
  }
};

export const playSpawnAnimation = (obj: GeometryObject): void => {
  const mat = obj.mesh.material as THREE.MeshStandardMaterial;
  const originalColor = hexToRgb(obj.data.color).clone();
  const startTime = performance.now();
  const duration = 1000;

  const animate = () => {
    const elapsed = performance.now() - startTime;
    if (elapsed >= duration) {
      mat.color.copy(originalColor);
      return;
    }
    const t = elapsed / duration;
    const white = new THREE.Color(0xffffff);
    mat.color.copy(white).lerp(originalColor, t);
    requestAnimationFrame(animate);
  };
  animate();
};

export const createDragPreview = (type: GeometryType, canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#60a5fa';
  ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.translate(w / 2, h / 2);

  const s = 28;
  switch (type) {
    case 'cube':
      ctx.beginPath();
      ctx.moveTo(-s, -s / 2);
      ctx.lineTo(0, -s);
      ctx.lineTo(s, -s / 2);
      ctx.lineTo(s, s / 2);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, s / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s, -s / 2);
      ctx.lineTo(0, 0);
      ctx.lineTo(s, -s / 2);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, s);
      ctx.stroke();
      break;
    case 'sphere':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case 'cylinder':
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.8);
      ctx.lineTo(-s, s * 0.8);
      ctx.ellipse(0, s * 0.8, s, s * 0.35, 0, 0, Math.PI);
      ctx.lineTo(s, -s * 0.8);
      ctx.ellipse(0, -s * 0.8, s, s * 0.35, 0, 0, Math.PI, true);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.8, s, s * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'cone':
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.1);
      ctx.lineTo(s, s * 0.7);
      ctx.ellipse(0, s * 0.7, s, s * 0.35, 0, 0, Math.PI);
      ctx.lineTo(-s, s * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }
  ctx.restore();
};
