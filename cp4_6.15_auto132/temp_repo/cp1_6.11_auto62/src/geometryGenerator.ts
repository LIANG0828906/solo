import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { RecognitionResult, Point } from './shapeRecognizer';
import { getClosure, getAspectRatio } from './shapeRecognizer';

export interface GeometryParams {
  size: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  color: string;
}

export const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#F9CA24',
  '#A29BFE',
  '#FFEAA7'
];

const SHAPE_NAMES: Record<string, string> = {
  circle: '球体',
  rect: '立方体',
  triangle: '三棱柱',
  polygon: '拉伸体'
};

export function getShapeName(type: string): string {
  return SHAPE_NAMES[type] || '几何体';
}

export function getRandomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

function createTransparentMaterial(color: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.7,
    roughness: 0.3,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
}

function normalizePointsToShape(points: Point[], targetSize: number = 2): THREE.Vector2[] {
  if (points.length < 2) return [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = targetSize / Math.max(width, height);
  return points.map(p => new THREE.Vector2(
    (p.x - centerX) * scale,
    -(p.y - centerY) * scale
  ));
}

export function createGeometry(
  recognition: RecognitionResult,
  rawPoints: Point[],
  params: GeometryParams
): THREE.Mesh {
  const material = createTransparentMaterial(params.color);
  const { type } = recognition;
  let geometry: THREE.BufferGeometry;
  const size = params.size;

  if (type === 'circle') {
    const closure = getClosure(rawPoints);
    const aspectRatio = getAspectRatio(rawPoints);
    if (closure > 0.95 && Math.abs(aspectRatio - 1) < 0.25) {
      geometry = new THREE.SphereGeometry(size * 0.8, 32, 32);
    } else {
      geometry = new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.2, 32);
    }
  } else if (type === 'rect') {
    geometry = new THREE.BoxGeometry(size, size * 0.8, size);
  } else if (type === 'triangle') {
    geometry = new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.2, 3);
  } else {
    const shapePoints = normalizePointsToShape(recognition.fittedPoints, size);
    if (shapePoints.length < 3) {
      geometry = new THREE.BoxGeometry(size, size, size);
    } else {
      const shape = new THREE.Shape();
      shape.moveTo(shapePoints[0].x, shapePoints[0].y);
      for (let i = 1; i < shapePoints.length; i++) {
        shape.lineTo(shapePoints[i].x, shapePoints[i].y);
      }
      shape.closePath();
      const extrudeSettings = {
        steps: 1,
        depth: size * 0.6,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 2
      };
      geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.center();
    }
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = (params.rotationX * Math.PI) / 180;
  mesh.rotation.y = (params.rotationY * Math.PI) / 180;
  mesh.rotation.z = (params.rotationZ * Math.PI) / 180;
  mesh.userData.shapeType = type;
  mesh.userData.originalParams = { ...params };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function updateMeshParams(mesh: THREE.Mesh, params: GeometryParams): void {
  const material = mesh.material as THREE.MeshPhysicalMaterial;
  material.color.set(params.color);
  mesh.rotation.x = (params.rotationX * Math.PI) / 180;
  mesh.rotation.y = (params.rotationY * Math.PI) / 180;
  mesh.rotation.z = (params.rotationZ * Math.PI) / 180;
  const baseScale = params.size;
  mesh.scale.setScalar(baseScale);
  mesh.userData.originalParams = { ...params };
}

export function cloneMesh(mesh: THREE.Mesh): THREE.Mesh {
  const cloned = mesh.clone();
  cloned.material = (mesh.material as THREE.Material).clone();
  cloned.userData = { ...mesh.userData, originalParams: { ...mesh.userData.originalParams } };
  const offset = 1.5 + Math.random() * 1.5;
  const angle = Math.random() * Math.PI * 2;
  cloned.position.set(Math.cos(angle) * offset, Math.sin(angle) * 0.5, Math.sin(angle) * offset);
  return cloned;
}

export function animateMeshSpawn(mesh: THREE.Mesh, duration: number = 1500): void {
  const originalScale = mesh.scale.clone();
  mesh.scale.set(0.001, 0.001, 0.001);
  const startTime = performance.now();
  function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);
    mesh.scale.set(
      originalScale.x * eased,
      originalScale.y * eased,
      originalScale.z * eased
    );
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

export function createOutline(mesh: THREE.Mesh): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    linewidth: 0.5
  });
  const outline = new THREE.LineSegments(edges, material);
  outline.userData.isOutline = true;
  outline.userData.targetMesh = mesh;
  mesh.add(outline);
  return outline;
}

export function setOutlineHover(outline: THREE.LineSegments, hovered: boolean): void {
  const material = outline.material as THREE.LineBasicMaterial;
  const targetOpacity = hovered ? 0.9 : 0;
  const startOpacity = material.opacity;
  const startTime = performance.now();
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / 150, 1);
    material.opacity = startOpacity + (targetOpacity - startOpacity) * progress;
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

export function exportGLTF(scene: THREE.Scene): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(new Blob([result], { type: 'model/gltf-binary' }));
        } else {
          const json = JSON.stringify(result);
          resolve(new Blob([json], { type: 'model/gltf+json' }));
        }
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateThumbnail(
  mesh: THREE.Mesh,
  width: number = 160,
  height: number = 120
): string {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a2e);
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(3, 2, 3);
  camera.lookAt(0, 0, 0);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 4, 2);
  scene.add(dirLight);
  const clonedMesh = mesh.clone();
  clonedMesh.position.set(0, 0, 0);
  clonedMesh.scale.setScalar(1);
  clonedMesh.rotation.set(0.5, 0.8, 0);
  scene.add(clonedMesh);
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  renderer.dispose();
  clonedMesh.geometry.dispose();
  (clonedMesh.material as THREE.Material).dispose();
  return dataURL;
}
