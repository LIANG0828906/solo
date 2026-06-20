import * as THREE from 'three';
import { SedimentLayer } from '../data/sedimentData';

export interface CrossSectionData {
  id: number;
  position: number;
  orientation: 'x' | 'z';
  group: THREE.Group;
  planeMesh: THREE.Mesh;
  textureMesh: THREE.Mesh;
  label: THREE.Sprite;
  textureData: {
    layers: SedimentLayer[];
    worldY: (texCoordY: number) => number;
  };
}

export interface CrossSectionManager {
  add: (position: number, orientation: 'x' | 'z') => CrossSectionData | null;
  removeAll: () => void;
  getAll: () => CrossSectionData[];
  getTextureMeshAtPoint: (point: THREE.Vector3) => { data: CrossSectionData; localY: number } | null;
  dispose: () => void;
}

const BLOCK_SIZE = 10;
const HALF_SIZE = BLOCK_SIZE / 2;
const MAX_SECTIONS = 3;

const LABEL_COLORS = ['#f4d03f', '#e67e22', '#8e44ad'];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0.5, g: 0.5, b: 0.5 };
}

function generateCrossSectionTexture(layers: SedimentLayer[]): {
  texture: THREE.CanvasTexture;
  worldY: (texCoordY: number) => number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const totalHeight = BLOCK_SIZE;

  layers.forEach((layer) => {
    const yTop = (1 - layer.yEnd / totalHeight) * canvas.height;
    const yBottom = (1 - layer.yStart / totalHeight) * canvas.height;
    const height = yBottom - yTop;

    const baseColor = hexToRgb(layer.color);
    const gradient = ctx.createLinearGradient(0, yTop, 0, yBottom);
    gradient.addColorStop(0, layer.color);
    gradient.addColorStop(0.5, `rgb(${Math.floor(baseColor.r * 255 * 1.05)}, ${Math.floor(baseColor.g * 255 * 1.05)}, ${Math.floor(baseColor.b * 255 * 1.05)})`);
    gradient.addColorStop(1, `rgb(${Math.floor(baseColor.r * 255 * 0.92)}, ${Math.floor(baseColor.g * 255 * 0.92)}, ${Math.floor(baseColor.b * 255 * 0.92)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, yTop, canvas.width, height);

    for (let y = yTop; y < yBottom; y += 2) {
      const stripeAlpha = 0.03 + Math.sin(y * 0.3) * 0.02;
      ctx.fillStyle = `rgba(0,0,0,${stripeAlpha})`;
      ctx.fillRect(0, y, canvas.width, 1);
    }

    switch (layer.textureType) {
      case 'granite':
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * canvas.width;
          const y = yTop + Math.random() * height;
          const size = Math.random() * 5 + 1;
          const shade = 0.7 + Math.random() * 0.5;
          ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * shade)}, ${Math.floor(baseColor.g * 255 * shade)}, ${Math.floor(baseColor.b * 255 * shade)}, 0.6)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'sandstone':
        for (let i = 0; i < 200; i++) {
          const x = Math.random() * canvas.width;
          const y = yTop + Math.random() * height;
          const size = Math.random() * 1.5 + 0.5;
          const shade = 0.8 + Math.random() * 0.4;
          ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * shade)}, ${Math.floor(baseColor.g * 255 * shade)}, ${Math.floor(baseColor.b * 255 * shade)}, 0.7)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let y = yTop; y < yBottom; y += 6) {
          ctx.strokeStyle = `rgba(${Math.floor(baseColor.r * 255 * 0.6)}, ${Math.floor(baseColor.g * 255 * 0.6)}, ${Math.floor(baseColor.b * 255 * 0.6)}, 0.25)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, y + Math.random() * 2);
          for (let x = 0; x < canvas.width; x += 8) {
            ctx.lineTo(x, y + Math.random() * 2);
          }
          ctx.stroke();
        }
        break;
      case 'limestone':
        for (let i = 0; i < 60; i++) {
          const x = Math.random() * canvas.width;
          const y = yTop + Math.random() * height;
          ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * 0.85)}, ${Math.floor(baseColor.g * 255 * 0.85)}, ${Math.floor(baseColor.b * 255 * 0.95)}, 0.5)`;
          ctx.beginPath();
          ctx.ellipse(x, y, 3 + Math.random() * 5, 2 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'clay':
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * canvas.width;
          const y = yTop + Math.random() * height;
          const shade = 0.85 + Math.random() * 0.3;
          ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * shade)}, ${Math.floor(baseColor.g * 255 * shade * 0.8)}, ${Math.floor(baseColor.b * 255 * shade * 0.6)}, 0.5)`;
          ctx.beginPath();
          ctx.ellipse(x, y, Math.random() * 8 + 3, Math.random() * 2 + 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'topsoil':
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * canvas.width;
          const y = yTop + Math.random() * height;
          const shade = 0.7 + Math.random() * 0.5;
          ctx.fillStyle = `rgba(${Math.floor(50 * shade + 40)}, ${Math.floor(baseColor.g * 255 * shade)}, ${Math.floor(40 * shade)}, 0.7)`;
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    const imageData = ctx.getImageData(0, Math.floor(yTop), canvas.width, Math.ceil(height));
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, Math.floor(yTop));
  });

  for (let i = 1; i < layers.length; i++) {
    const y = (1 - layers[i].yStart / totalHeight) * canvas.height;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  const worldY = (texCoordY: number) => {
    return (1 - texCoordY) * totalHeight;
  };

  return { texture, worldY };
}

function createLabelSprite(index: number, position: number, orientation: 'x' | 'z', color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.beginPath();
  const r = 12;
  const w = 120;
  const h = 52;
  const x = 4;
  const y = 6;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1e2233';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const posText = `${orientation.toUpperCase()}=${position.toFixed(1)}`;
  ctx.fillText(`#${index + 1}  ${posText}`, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 1.5, 1);
  sprite.renderOrder = 999;
  return sprite;
}

export function createCrossSectionManager(
  scene: THREE.Scene,
  layers: SedimentLayer[]
): CrossSectionManager {
  const sections: CrossSectionData[] = [];

  const add = (position: number, orientation: 'x' | 'z'): CrossSectionData | null => {
    if (sections.length >= MAX_SECTIONS) return null;

    const clampedPos = Math.max(-HALF_SIZE + 0.1, Math.min(HALF_SIZE - 0.1, position));
    const index = sections.length;
    const group = new THREE.Group();

    const planeGeometry = new THREE.PlaneGeometry(BLOCK_SIZE, BLOCK_SIZE);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x9b59b6,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

    const { texture, worldY } = generateCrossSectionTexture(layers);
    const textureMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: true
    });
    const textureMesh = new THREE.Mesh(planeGeometry.clone(), textureMaterial);
    textureMesh.position.z = 0.005;
    textureMesh.userData = { isCrossSection: true, index };

    const borderPoints: THREE.Vector3[] = [];
    const hs = HALF_SIZE;
    const corners = [
      [-hs, -hs], [hs, -hs], [hs, hs], [-hs, hs], [-hs, -hs]
    ];
    corners.forEach(([a, b]) => borderPoints.push(new THREE.Vector3(a, b, 0)));
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.9 });
    const border = new THREE.Line(borderGeometry, borderMaterial);
    border.position.z = 0.01;

    if (orientation === 'x') {
      group.position.x = clampedPos;
      group.rotation.y = Math.PI / 2;
    } else {
      group.position.z = clampedPos;
    }

    group.add(planeMesh);
    group.add(textureMesh);
    group.add(border);

    const labelColor = LABEL_COLORS[index];
    const label = createLabelSprite(index, clampedPos, orientation, labelColor);
    if (orientation === 'x') {
      label.position.set(clampedPos, HALF_SIZE + 1.2, 0);
    } else {
      label.position.set(0, HALF_SIZE + 1.2, clampedPos);
    }
    scene.add(label);

    scene.add(group);

    const data: CrossSectionData = {
      id: index,
      position: clampedPos,
      orientation,
      group,
      planeMesh,
      textureMesh,
      label,
      textureData: { layers, worldY }
    };
    sections.push(data);
    return data;
  };

  const removeAll = () => {
    sections.forEach((s) => {
      scene.remove(s.group);
      scene.remove(s.label);
      s.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      const spriteMat = s.label.material as THREE.SpriteMaterial;
      spriteMat.map?.dispose();
      spriteMat.dispose();
    });
    sections.length = 0;
  };

  const getAll = () => sections;

  const getTextureMeshAtPoint = (point: THREE.Vector3): { data: CrossSectionData; localY: number } | null => {
    const epsilon = 0.3;
    for (const s of sections) {
      const localPoint = point.clone();
      s.group.worldToLocal(localPoint);
      if (
        Math.abs(localPoint.z) < epsilon &&
        localPoint.x >= -HALF_SIZE && localPoint.x <= HALF_SIZE &&
        localPoint.y >= -HALF_SIZE && localPoint.y <= HALF_SIZE
      ) {
        return { data: s, localY: localPoint.y };
      }
    }
    return null;
  };

  const dispose = () => {
    removeAll();
  };

  return { add, removeAll, getAll, getTextureMeshAtPoint, dispose };
}
