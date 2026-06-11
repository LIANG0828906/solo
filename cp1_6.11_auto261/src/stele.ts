import * as THREE from 'three';

function generateStoneTexture(width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const brightness = 45 + Math.random() * 30;
    const size = 0.5 + Math.random() * 2;
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 2})`;
    ctx.fillRect(x, y, size, size);
  }

  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    const startX = Math.random() * width;
    const startY = Math.random() * height;
    ctx.moveTo(startX, startY);
    let cx = startX;
    let cy = startY;
    const segs = 3 + Math.floor(Math.random() * 6);
    for (let j = 0; j < segs; j++) {
      cx += (Math.random() - 0.5) * 60;
      cy += (Math.random() - 0.5) * 40;
      ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = `rgba(30, 30, 28, ${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.stroke();
  }

  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
  gradient.addColorStop(0, 'rgba(80, 80, 78, 0.15)');
  gradient.addColorStop(1, 'rgba(20, 20, 18, 0.25)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

function generateXumiBaseTexture(width: number, height: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7A6A5A';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const b = 90 + Math.random() * 40;
    ctx.fillStyle = `rgb(${b}, ${b - 10}, ${b - 20})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }

  ctx.strokeStyle = '#5A4A3A';
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 5; row++) {
    const y = (row + 1) * (height / 6);
    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const wave = Math.sin(x * 0.05 + row) * 3 + Math.sin(x * 0.12) * 2;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createStele(scene: THREE.Scene): {
  group: THREE.Group;
  steleMesh: THREE.Mesh;
  steleSurface: THREE.Mesh;
  displacementCanvas: HTMLCanvasElement;
  displacementCtx: CanvasRenderingContext2D;
  displacementTexture: THREE.CanvasTexture;
  weatherCanvas: HTMLCanvasElement;
  weatherCtx: CanvasRenderingContext2D;
  weatherTexture: THREE.CanvasTexture;
} {
  const group = new THREE.Group();

  const stoneTex = generateStoneTexture(1024, 1024);
  stoneTex.wrapS = THREE.RepeatWrapping;
  stoneTex.wrapT = THREE.RepeatWrapping;

  const steleGeo = new THREE.BoxGeometry(1.2, 2.0, 0.3);
  const steleMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.85,
    metalness: 0.05,
    color: new THREE.Color(0x3A3A3A),
  });
  const steleMesh = new THREE.Mesh(steleGeo, steleMat);
  steleMesh.position.set(0, 1.2, 0);
  steleMesh.castShadow = true;
  steleMesh.receiveShadow = true;
  group.add(steleMesh);

  const surfaceGeo = new THREE.PlaneGeometry(1.18, 1.98);
  const surfaceMat = new THREE.MeshStandardMaterial({
    map: stoneTex.clone(),
    roughness: 0.8,
    metalness: 0.05,
    color: new THREE.Color(0x3A3A3A),
    transparent: true,
  });
  const steleSurface = new THREE.Mesh(surfaceGeo, surfaceMat);
  steleSurface.position.set(0, 1.2, 0.151);
  steleSurface.receiveShadow = true;
  steleSurface.name = 'steleSurface';
  group.add(steleSurface);

  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = 512;
  dispCanvas.height = 512;
  const dispCtx = dispCanvas.getContext('2d')!;
  dispCtx.fillStyle = '#808080';
  dispCtx.fillRect(0, 0, 512, 512);
  const dispTex = new THREE.CanvasTexture(dispCanvas);
  surfaceMat.displacementMap = dispTex;
  surfaceMat.displacementScale = 0.03;

  const weatherCanvas = document.createElement('canvas');
  weatherCanvas.width = 512;
  weatherCanvas.height = 512;
  const weatherCtx = weatherCanvas.getContext('2d')!;
  const weatherTex = new THREE.CanvasTexture(weatherCanvas);
  surfaceMat.alphaMap = weatherTex;

  const baseTex = generateXumiBaseTexture(256, 128);
  const baseMat = new THREE.MeshStandardMaterial({
    map: baseTex,
    roughness: 0.9,
    metalness: 0.0,
    color: new THREE.Color(0x7A6A5A),
  });

  const baseWidths = [1.5, 1.35, 1.2];
  const baseHeights = [0.2, 0.18, 0.16];
  baseWidths.forEach((w, i) => {
    const geo = new THREE.BoxGeometry(w, baseHeights[i], 0.6);
    const mesh = new THREE.Mesh(geo, baseMat);
    mesh.position.set(0, -baseHeights[i] * 0.5 - i * 0.19, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });

  group.position.set(0, 0.2, 0);
  scene.add(group);

  return {
    group,
    steleMesh,
    steleSurface,
    displacementCanvas: dispCanvas,
    displacementCtx: dispCtx,
    displacementTexture: dispTex,
    weatherCanvas,
    weatherCtx,
    weatherTexture: weatherTex,
  };
}
