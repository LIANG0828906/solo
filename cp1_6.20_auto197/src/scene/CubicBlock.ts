import * as THREE from 'three';
import { SedimentLayer } from '../data/sedimentData';

export interface CubicBlockResult {
  group: THREE.Group;
  layerMeshes: Map<string, THREE.Mesh>;
  boundaryLines: THREE.LineSegments;
  materials: THREE.MeshStandardMaterial[];
  blockSize: number;
  layers: SedimentLayer[];
}

const BLOCK_SIZE = 10;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0.5, g: 0.5, b: 0.5 };
}

function generateTexture(layer: SedimentLayer, isFace: boolean = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = isFace ? 512 : 128;
  const ctx = canvas.getContext('2d')!;
  const baseColor = hexToRgb(layer.color);

  ctx.fillStyle = layer.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const addNoise = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 40;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
  };

  switch (layer.textureType) {
    case 'granite':
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 8 + 2;
        const shade = 0.7 + Math.random() * 0.6;
        ctx.fillStyle = `rgb(${Math.floor(baseColor.r * 255 * shade)}, ${Math.floor(baseColor.g * 255 * shade)}, ${Math.floor(baseColor.b * 255 * shade)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      addNoise();
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
        ctx.stroke();
      }
      break;

    case 'sandstone':
      for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.5;
        const shade = 0.8 + Math.random() * 0.4;
        ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * shade)}, ${Math.floor(baseColor.g * 255 * shade)}, ${Math.floor(baseColor.b * 255 * shade)}, 0.7)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let y = 0; y < canvas.height; y += 8) {
        ctx.strokeStyle = `rgba(${Math.floor(baseColor.r * 255 * 0.7)}, ${Math.floor(baseColor.g * 255 * 0.7)}, ${Math.floor(baseColor.b * 255 * 0.7)}, 0.3)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random() * 3);
        for (let x = 0; x < canvas.width; x += 10) {
          ctx.lineTo(x, y + Math.random() * 3);
        }
        ctx.stroke();
      }
      addNoise();
      break;

    case 'limestone':
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * 0.8)}, ${Math.floor(baseColor.g * 255 * 0.8)}, ${Math.floor(baseColor.b * 255 * 0.9)}, 0.5)`;
        ctx.beginPath();
        ctx.ellipse(x, y, 5 + Math.random() * 8, 3 + Math.random() * 5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 2 + Math.random() * 4;
        ctx.strokeStyle = 'rgba(180,180,200,0.4)';
        ctx.lineWidth = 0.5;
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(x, y, r + j * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      addNoise();
      break;

    case 'clay':
      for (let y = 0; y < canvas.height; y += 3) {
        const alpha = 0.1 + Math.sin(y * 0.1) * 0.05;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(0, y, canvas.width, 1);
      }
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const shade = 0.85 + Math.random() * 0.3;
        ctx.fillStyle = `rgba(${Math.floor(baseColor.r * 255 * shade)}, ${Math.floor(baseColor.g * 255 * shade * 0.8)}, ${Math.floor(baseColor.b * 255 * shade * 0.6)}, 0.6)`;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.random() * 15 + 5, Math.random() * 3 + 1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      addNoise();
      break;

    case 'topsoil':
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const shade = 0.7 + Math.random() * 0.5;
        ctx.fillStyle = `rgba(${Math.floor(60 * shade + 40)}, ${Math.floor(baseColor.g * 255 * shade)}, ${Math.floor(50 * shade)}, 0.8)`;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * canvas.width;
        const y = canvas.height - Math.random() * canvas.height * 0.4;
        ctx.strokeStyle = `rgba(${Math.floor(80 + Math.random() * 40)}, ${Math.floor(150 + Math.random() * 60)}, ${Math.floor(40 + Math.random() * 40)}, 0.6)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 6 - 3, y - 5 - Math.random() * 10);
        ctx.stroke();
      }
      addNoise();
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function generateCubicBlock(layers: SedimentLayer[]): CubicBlockResult {
  const group = new THREE.Group();
  const layerMeshes = new Map<string, THREE.Mesh>();
  const materials: THREE.MeshStandardMaterial[] = [];
  const halfSize = BLOCK_SIZE / 2;

  layers.forEach((layer) => {
    const layerHeight = layer.thickness;
    const yCenter = -halfSize + layer.yStart + layerHeight / 2;

    const geometry = new THREE.BoxGeometry(
      BLOCK_SIZE * 1.001,
      layerHeight * 1.001,
      BLOCK_SIZE * 1.001
    );

    const texture = generateTexture(layer, true);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.85,
      metalness: layer.textureType === 'granite' ? 0.15 : 0.05,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });

    materials.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = yCenter;
    mesh.userData = { layerId: layer.id, layer };
    layerMeshes.set(layer.id, mesh);
    group.add(mesh);
  });

  const edgesGroup = new THREE.Group();
  const boundaryPositions: number[] = [];

  for (let i = 0; i <= layers.length; i++) {
    const y = -halfSize + (i === 0 ? 0 : layers[i - 1].yEnd);

    const corners = [
      [-halfSize, -halfSize],
      [halfSize, -halfSize],
      [halfSize, halfSize],
      [-halfSize, halfSize]
    ];

    for (let j = 0; j < 4; j++) {
      const [x1, z1] = corners[j];
      const [x2, z2] = corners[(j + 1) % 4];
      boundaryPositions.push(x1, y, z1, x2, y, z2);
    }
  }

  const outlineCorners = [
    [-halfSize, -halfSize, -halfSize],
    [halfSize, -halfSize, -halfSize],
    [halfSize, -halfSize, halfSize],
    [-halfSize, -halfSize, halfSize],
    [-halfSize, halfSize, -halfSize],
    [halfSize, halfSize, -halfSize],
    [halfSize, halfSize, halfSize],
    [-halfSize, halfSize, halfSize]
  ];

  const outlineEdges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  const allPositions = [...boundaryPositions];
  outlineEdges.forEach(([a, b]) => {
    allPositions.push(...outlineCorners[a], ...outlineCorners[b]);
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const boundaryLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  edgesGroup.add(boundaryLines);
  group.add(edgesGroup);

  return {
    group,
    layerMeshes,
    boundaryLines,
    materials,
    blockSize: BLOCK_SIZE,
    layers
  };
}

export function setBlockOpacity(result: CubicBlockResult, opacity: number): void {
  result.materials.forEach((mat) => {
    mat.opacity = opacity;
    mat.transparent = opacity < 1.0;
    mat.depthWrite = opacity >= 0.95;
  });
  (result.boundaryLines.material as THREE.LineBasicMaterial).opacity = Math.max(0.2, opacity * 0.6);
}

export function highlightLayer(result: CubicBlockResult, layerId: string | null): void {
  result.layerMeshes.forEach((mesh, id) => {
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (id === layerId) {
      material.emissive = new THREE.Color(0xffffff);
      material.emissiveIntensity = 0.3;
    } else {
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;
    }
  });
}
