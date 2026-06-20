import * as THREE from 'three';

const EARTH_AXIS_TILT = 23.5 * (Math.PI / 180);

function createNoiseTexture(size: number = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const value = Math.random() * 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createCloudTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 60 + 20;
    const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cloudGradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createSun(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(2, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
  });
  
  const sun = new THREE.Mesh(geometry, material);
  
  const glowGeometry = new THREE.SphereGeometry(2.3, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFA500,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  sun.add(glow);
  
  (sun.material as THREE.MeshBasicMaterial).color.multiplyScalar(1.2);
  
  return sun;
}

export function createEarth(): { earth: THREE.Group; clouds: THREE.Mesh } {
  const earthGroup = new THREE.Group();
  
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const noiseTexture = createNoiseTexture(256);
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x2196F3,
    roughness: 0.8,
    metalness: 0.1,
  });
  
  const earth = new THREE.Mesh(geometry, material);
  earth.castShadow = true;
  earth.receiveShadow = true;
  
  const landGeometry = new THREE.SphereGeometry(1.001, 32, 32);
  const landMaterial = new THREE.MeshStandardMaterial({
    color: 0x2E7D32,
    transparent: true,
    opacity: 0.7,
    alphaMap: noiseTexture,
  });
  const land = new THREE.Mesh(landGeometry, landMaterial);
  earth.add(land);
  
  earthGroup.add(earth);
  earthGroup.rotation.z = EARTH_AXIS_TILT;
  
  const cloudsGeometry = new THREE.SphereGeometry(1.02, 64, 64);
  const cloudTexture = createCloudTexture(512);
  const cloudsMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.35,
    alphaMap: cloudTexture,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  earthGroup.add(clouds);
  
  return { earth: earthGroup, clouds };
}

export function createMoon(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.3, 64, 64);
  const noiseTexture = createNoiseTexture(256);
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x9E9E9E,
    roughness: 0.9,
    metalness: 0.0,
    bumpMap: noiseTexture,
    bumpScale: 0.02,
  });
  
  const moon = new THREE.Mesh(geometry, material);
  moon.castShadow = true;
  moon.receiveShadow = true;
  
  return moon;
}
