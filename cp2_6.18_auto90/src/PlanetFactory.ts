import * as THREE from 'three';

export interface PlanetData {
  name: string;
  radius: number;
  orbitRadius: number;
  color: string;
  orbitalPeriod: number;
  rotationPeriod: number;
  mass: string;
  moons: number;
  hasRing?: boolean;
  hasClouds?: boolean;
}

const sharedGeometries = {
  lowPolySphere: new THREE.SphereGeometry(1, 16, 12),
  highPolySphere: new THREE.SphereGeometry(1, 32, 24)
};

function createCanvasTexture(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSunTexture(): THREE.CanvasTexture {
  return createCanvasTexture(512, 512, (ctx) => {
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.2, '#FFE066');
    gradient.addColorStop(0.5, '#FFAA00');
    gradient.addColorStop(0.8, '#FF6B00');
    gradient.addColorStop(1, '#CC4400');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 20 + 5;
      const alpha = Math.random() * 0.3 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
      ctx.fill();
    }
  });
}

function createJupiterTexture(): THREE.CanvasTexture {
  return createCanvasTexture(512, 256, (ctx) => {
    const colors = ['#D4AC0D', '#E8C872', '#C9A227', '#B7950B', '#D4AC0D', '#F4D03F'];
    for (let y = 0; y < 256; y += 20) {
      const color = colors[Math.floor(y / 20) % colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(0, y, 512, 18 + Math.random() * 4);
    }
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const w = Math.random() * 80 + 30;
      const h = Math.random() * 15 + 5;
      ctx.fillStyle = `rgba(180, 100, 50, ${Math.random() * 0.3 + 0.1})`;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(350, 150, 40, 25, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#C0392B';
    ctx.fill();
  });
}

function createEarthTexture(): THREE.CanvasTexture {
  return createCanvasTexture(512, 256, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, '#1A5276');
    gradient.addColorStop(0.5, '#2E86AB');
    gradient.addColorStop(1, '#1A5276');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    const greenAreas = [
      { x: 80, y: 80, w: 100, h: 60 },
      { x: 300, y: 60, w: 120, h: 80 },
      { x: 200, y: 160, w: 80, h: 50 },
      { x: 380, y: 170, w: 90, h: 60 },
      { x: 50, y: 180, w: 70, h: 40 }
    ];
    greenAreas.forEach(area => {
      ctx.fillStyle = '#27AE60';
      ctx.beginPath();
      ctx.ellipse(area.x, area.y, area.w, area.h, Math.random() * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E8449';
      ctx.beginPath();
      ctx.ellipse(area.x + 10, area.y + 5, area.w * 0.6, area.h * 0.5, Math.random() * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = Math.random() * 15 + 5;
      ctx.globalAlpha = Math.random() * 0.4 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function createRingTexture(): THREE.CanvasTexture {
  return createCanvasTexture(512, 64, (ctx) => {
    for (let x = 0; x < 512; x++) {
      const alpha = Math.sin(x * 0.05) * 0.2 + 0.4 + Math.random() * 0.2;
      const gray = 150 + Math.random() * 50;
      ctx.fillStyle = `rgba(${gray}, ${gray - 20}, ${gray - 40}, ${alpha})`;
      ctx.fillRect(x, 0, 1, 64);
    }
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 64;
      const w = Math.random() * 30 + 5;
      ctx.fillStyle = `rgba(200, 180, 150, ${Math.random() * 0.3})`;
      ctx.fillRect(x, y, w, 1);
    }
  });
}

export class PlanetFactory {
  private sunTexture: THREE.CanvasTexture;
  private jupiterTexture: THREE.CanvasTexture;
  private earthTexture: THREE.CanvasTexture;
  private ringTexture: THREE.CanvasTexture;

  constructor() {
    this.sunTexture = createSunTexture();
    this.jupiterTexture = createJupiterTexture();
    this.earthTexture = createEarthTexture();
    this.ringTexture = createRingTexture();
  }

  createSun(radius: number, color: string): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(radius, 32, 24);
    const material = new THREE.MeshBasicMaterial({
      map: this.sunTexture,
      color: color,
      transparent: true
    });
    const sunMesh = new THREE.Mesh(geometry, material);
    sunMesh.name = 'sun';
    group.add(sunMesh);
    const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    const particleGroup = this.createGlowParticles(200, radius * 2);
    group.add(particleGroup);
    group.userData = {
      type: 'sun',
      radius,
      rotationSpeed: (2 * Math.PI) / (609.12 * 3600)
    };
    return group;
  }

  createPlanet(data: PlanetData): THREE.Group {
    const group = new THREE.Group();
    group.name = data.name;
    const geometry = data.radius > 5 ? sharedGeometries.highPolySphere : sharedGeometries.lowPolySphere;
    let material: THREE.MeshStandardMaterial;
    if (data.name === '木星') {
      material = new THREE.MeshStandardMaterial({
        map: this.jupiterTexture,
        roughness: 0.8,
        metalness: 0.1
      });
    } else if (data.name === '地球') {
      material = new THREE.MeshStandardMaterial({
        map: this.earthTexture,
        roughness: 0.7,
        metalness: 0.1
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.7,
        metalness: 0.1
      });
    }
    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.scale.setScalar(data.radius);
    planetMesh.name = 'planet';
    planetMesh.userData = { planetData: data };
    group.add(planetMesh);
    if (data.hasRing) {
      const ring = this.createRing(data.radius * 1.4, data.radius * 2.2, '#D4AC0D');
      ring.rotation.x = Math.PI / 2.5;
      group.add(ring);
    }
    if (data.hasClouds) {
      const clouds = this.createClouds(data.radius * 1.05);
      group.add(clouds);
      group.userData.clouds = clouds;
    }
    const orbit = this.createOrbit(data.orbitRadius);
    group.userData.orbit = orbit;
    const label = this.createLabel(data.name, data.radius * 1.5);
    group.add(label);
    group.userData = {
      type: 'planet',
      data,
      orbitRadius: data.orbitRadius,
      angle: Math.random() * Math.PI * 2,
      orbitalSpeed: (2 * Math.PI) / (data.orbitalPeriod * 24 * 3600),
      rotationSpeed: (2 * Math.PI) / (data.rotationPeriod * 3600)
    };
    return group;
  }

  createOrbit(radius: number): THREE.LineLoop {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      dashSize: 2,
      gapSize: 1
    });
    const line = new THREE.LineLoop(geometry, material);
    line.computeLineDistances();
    return line;
  }

  createRing(innerRadius: number, outerRadius: number, color: string): THREE.Mesh {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const material = new THREE.MeshBasicMaterial({
      map: this.ringTexture,
      color: color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geometry, material);
    return ring;
  }

  createClouds(radius: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(radius, 32, 24);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const clouds = new THREE.Mesh(geometry, material);
    return clouds;
  }

  createLabel(text: string, yOffset: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(10, 10, 30, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 64);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);
    sprite.position.y = yOffset + 2;
    sprite.name = 'label';
    return sprite;
  }

  createGlowParticles(count: number, radius: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.4);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const color = new THREE.Color();
      color.setHSL(0.08 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    return points;
  }

  dispose(): void {
    this.sunTexture.dispose();
    this.jupiterTexture.dispose();
    this.earthTexture.dispose();
    this.ringTexture.dispose();
    sharedGeometries.lowPolySphere.dispose();
    sharedGeometries.highPolySphere.dispose();
  }
}
