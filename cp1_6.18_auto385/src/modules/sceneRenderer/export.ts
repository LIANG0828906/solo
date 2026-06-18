import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { MaterialType } from '@/store/useStore';

const MAX_DISPLACEMENT = 2;

const materialConfigs: Record<MaterialType, {
  roughness: number;
  metalness: number;
  transparent?: boolean;
  opacity?: number;
  color: number;
}> = {
  matte: { roughness: 0.8, metalness: 0.1, color: 0xc8c8c8 },
  metal: { roughness: 0.3, metalness: 0.8, color: 0xb8b8b8 },
  glass: { roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.6, color: 0xd8e8ff },
};

export function buildSculptMesh(
  depthMap: number[],
  width: number,
  height: number,
  bumpStrength: number,
  material: MaterialType
): THREE.Mesh {
  const w = Math.max(50, width);
  const h = Math.max(50, height);
  const geometry = new THREE.PlaneGeometry(4, 4, w - 1, h - 1);
  const aspect = w / h;
  const scaleY = bumpStrength;

  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const count = positions.count;
  const expectedCount = w * h;

  for (let i = 0; i < count && i < depthMap.length && i < expectedCount; i++) {
    const depthValue = depthMap[i] ?? 0;
    const z = (depthValue / 255) * MAX_DISPLACEMENT;
    positions.setZ(i, z);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const cfg = materialConfigs[material];
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    transparent: cfg.transparent || false,
    opacity: cfg.opacity ?? 1,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, mat);
  mesh.scale.set(aspect >= 1 ? 1 : aspect, 1, scaleY);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function exportToGLB(
  depthMap: number[],
  width: number,
  height: number,
  bumpStrength: number,
  material: MaterialType
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const mesh = buildSculptMesh(depthMap, width, height, bumpStrength, material);
      const scene = new THREE.Scene();
      scene.add(mesh);

      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('导出格式错误'));
          }
        },
        (err) => reject(err || new Error('导出失败')),
        { binary: true }
      );
    } catch (err) {
      reject(err);
    }
  });
}

export function downloadGLB(buffer: ArrayBuffer, filename = 'light-shadow-sculpt.glb'): void {
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export interface ShareParams {
  depth: number;
  lightX: number;
  lightY: number;
  material: MaterialType;
}

export function buildShareUrl(params: ShareParams): string {
  const url = new URL(window.location.href);
  url.hash = '';
  url.hash = [
    `depth=${params.depth.toFixed(2)}`,
    `lightX=${params.lightX.toFixed(2)}`,
    `lightY=${params.lightY.toFixed(2)}`,
    `material=${params.material}`,
  ].join('&');
  return url.toString();
}

export function parseShareUrl(): Partial<ShareParams> | null {
  const raw = window.location.hash.slice(1);
  if (!raw) return null;
  const parts = raw.split('&');
  const result: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v !== undefined) result[k] = decodeURIComponent(v);
  }
  if (Object.keys(result).length === 0) return null;
  const parsed: Partial<ShareParams> = {};
  if (result.depth !== undefined) {
    const n = parseFloat(result.depth);
    if (!Number.isNaN(n)) parsed.depth = Math.max(0, Math.min(5, n));
  }
  if (result.lightX !== undefined) {
    const n = parseFloat(result.lightX);
    if (!Number.isNaN(n)) parsed.lightX = Math.max(-1, Math.min(1, n));
  }
  if (result.lightY !== undefined) {
    const n = parseFloat(result.lightY);
    if (!Number.isNaN(n)) parsed.lightY = Math.max(-1, Math.min(1, n));
  }
  if (result.material === 'matte' || result.material === 'metal' || result.material === 'glass') {
    parsed.material = result.material;
  }
  return parsed;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy') ? resolve() : reject(new Error('复制失败'));
    } finally {
      document.body.removeChild(ta);
    }
  });
}
