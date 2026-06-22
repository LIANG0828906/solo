import * as THREE from 'three';

const EARTH_RADIUS = 1.0;
const CLOUD_OFFSET = 0.018;
const HEATMAP_OFFSET = 0.008;

interface RingMesh {
  mesh: THREE.Mesh;
  targetScale: number;
  currentScale: number;
}

export class EarthRenderer {
  private scene: THREE.Scene;
  private earthMesh: THREE.Mesh;
  private earthMaterial: THREE.MeshStandardMaterial;
  private earthBaseTexture: THREE.CanvasTexture;

  private cloudMesh: THREE.Mesh;
  private cloudMaterial: THREE.MeshBasicMaterial;

  private heatmapMesh: THREE.Mesh;
  private heatmapMaterial: THREE.MeshBasicMaterial;

  private atmosphereMesh: THREE.Mesh;
  private atmosphereMaterial: THREE.ShaderMaterial;

  private starField: THREE.Points;

  private rings: RingMesh[] = [];
  private currentHeightLevel: number = 2;
  private targetHeightLevel: number = 2;

  private group: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.earthBaseTexture = this.createEarthBaseTexture();

    this.earthMaterial = new THREE.MeshStandardMaterial({
      map: this.earthBaseTexture,
      roughness: 0.88,
      metalness: 0.05,
      color: 0xffffff
    });

    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96);
    this.earthMesh = new THREE.Mesh(earthGeo, this.earthMaterial);
    this.group.add(this.earthMesh);

    this.cloudMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffffff
    });

    const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS + CLOUD_OFFSET, 96, 96);
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMaterial);
    this.group.add(this.cloudMesh);

    this.heatmapMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffffff
    });

    const heatmapGeo = new THREE.SphereGeometry(EARTH_RADIUS + HEATMAP_OFFSET, 96, 96);
    this.heatmapMesh = new THREE.Mesh(heatmapGeo, this.heatmapMaterial);
    this.group.add(this.heatmapMesh);

    this.atmosphereMaterial = this.createAtmosphereShader();
    const atmGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.09, 96, 96);
    this.atmosphereMesh = new THREE.Mesh(atmGeo, this.atmosphereMaterial);
    this.group.add(this.atmosphereMesh);

    this.createHeightRings();
    this.starField = this.createStarField();
    this.scene.add(this.starField);

    this.group.rotation.y = -Math.PI / 2.2;
  }

  private createEarthBaseTexture(): THREE.CanvasTexture {
    const W = 2048;
    const H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
    oceanGrad.addColorStop(0, '#0a2a4a');
    oceanGrad.addColorStop(0.35, '#0d3a66');
    oceanGrad.addColorStop(0.5, '#114c82');
    oceanGrad.addColorStop(0.65, '#0d3a66');
    oceanGrad.addColorStop(1, '#0a2a4a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, W, H);

    const noise = (x: number, y: number, seed: number) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    const continents: { cx: number; cy: number; rx: number; ry: number; rot: number; seed: number }[] = [
      { cx: 0.20, cy: 0.42, rx: 0.11, ry: 0.15, rot: -0.15, seed: 11 },
      { cx: 0.27, cy: 0.70, rx: 0.08, ry: 0.18, rot: 0.1, seed: 22 },
      { cx: 0.46, cy: 0.40, rx: 0.06, ry: 0.08, rot: 0.3, seed: 33 },
      { cx: 0.54, cy: 0.55, rx: 0.14, ry: 0.20, rot: -0.05, seed: 44 },
      { cx: 0.60, cy: 0.28, rx: 0.03, ry: 0.04, rot: 0, seed: 55 },
      { cx: 0.78, cy: 0.38, rx: 0.16, ry: 0.15, rot: 0.2, seed: 66 },
      { cx: 0.86, cy: 0.72, rx: 0.04, ry: 0.04, rot: 0, seed: 77 },
      { cx: 0.50, cy: 0.08, rx: 0.40, ry: 0.06, rot: 0, seed: 88 },
      { cx: 0.50, cy: 0.94, rx: 0.40, ry: 0.05, rot: 0, seed: 99 }
    ];

    for (const cont of continents) {
      for (let i = 0; i < 3500; i++) {
        const u = (Math.random() - 0.5) * 2;
        const v = (Math.random() - 0.5) * 2;
        const dist2 = u * u + v * v;
        if (dist2 > 1) continue;
        const edgeFade = 1 - Math.pow(dist2, 1.4);

        const cosA = Math.cos(cont.rot);
        const sinA = Math.sin(cont.rot);
        const rotU = u * cosA - v * sinA;
        const rotV = u * sinA + v * cosA;

        const px = (cont.cx + rotU * cont.rx) * W;
        const py = (cont.cy + rotV * cont.ry) * H;
        const n1 = noise(i * 0.1, cont.seed, 1);
        const n2 = noise(i * 0.17, cont.seed, 2);

        const landType = (n1 * 0.6 + n2 * 0.4);
        let r: number, g: number, b: number;
        if (landType < 0.32) {
          r = 60 + n2 * 50; g = 110 + n1 * 70; b = 50 + n2 * 40;
        } else if (landType < 0.58) {
          r = 110 + n2 * 50; g = 140 + n1 * 50; b = 60 + n2 * 40;
        } else if (landType < 0.78) {
          r = 160 + n2 * 40; g = 140 + n1 * 30; b = 80 + n2 * 30;
        } else if (landType < 0.9) {
          r = 190 + n2 * 40; g = 175 + n1 * 30; b = 140 + n2 * 20;
        } else {
          r = 240 + n2 * 15; g = 245 + n1 * 10; b = 250;
        }

        const alpha = edgeFade * (0.55 + 0.45 * Math.random());
        const size = 1.2 + Math.random() * 3.2;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    const img = ctx.getImageData(0, 0, W, H);
    const data = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        const nx = x / W;
        const ny = y / H;
        const polarFactor = Math.max(0, (Math.abs(ny - 0.5) - 0.41) / 0.09);

        if (polarFactor > 0) {
          const ice = polarFactor * polarFactor;
          data[idx] = Math.min(255, data[idx] + (255 - data[idx]) * ice);
          data[idx + 1] = Math.min(255, data[idx + 1] + (255 - data[idx + 1]) * ice);
          data[idx + 2] = Math.min(255, data[idx + 2] + (255 - data[idx + 2]) * ice);
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }

  private createAtmosphereShader(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x00d4ff) },
        viewVector: { value: new THREE.Vector3(0, 0, 1) }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.65 - dot(vNormal, vNormel), 2.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.55);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
  }

  private createHeightRings(): void {
    const baseScales = [1.004, 1.008, 1.012, 1.017, 1.023];
    const colors = [0x00d4ff, 0x00d4ff, 0x00d4ff, 0x00d4ff, 0x00d4ff];

    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(
        EARTH_RADIUS * (baseScales[this.targetHeightLevel] + i * 0.006) - 0.003,
        EARTH_RADIUS * (baseScales[this.targetHeightLevel] + i * 0.006) + 0.003,
        128
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -0.02 - i * 0.01;
      this.group.add(mesh);

      this.rings.push({
        mesh,
        targetScale: 1,
        currentScale: 0
      });
    }
  }

  private createStarField(): THREE.Points {
    const starCount = 480;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 40 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const tint = 0.7 + Math.random() * 0.3;
      const blueTint = 0.85 + Math.random() * 0.15;
      colors[i * 3] = tint;
      colors[i * 3 + 1] = tint * 0.95;
      colors[i * 3 + 2] = tint * blueTint;
      sizes[i] = 0.4 + Math.random() * 1.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false
    });

    return new THREE.Points(geo, mat);
  }

  public updateCloudTexture(texture: THREE.Texture, opacity: number): void {
    this.cloudMaterial.map = texture;
    this.cloudMaterial.opacity = opacity;
    this.cloudMaterial.needsUpdate = true;
  }

  public updateHeatmapTexture(texture: THREE.Texture, opacity: number): void {
    this.heatmapMaterial.map = texture;
    this.heatmapMaterial.opacity = opacity;
    this.heatmapMaterial.needsUpdate = true;
  }

  public setHeightLevel(level: number): void {
    this.targetHeightLevel = Math.max(0, Math.min(4, level));
  }

  public update(dt: number, camera: THREE.Camera): void {
    const baseScales = [1.004, 1.008, 1.012, 1.017, 1.023];
    const targetBase = baseScales[this.targetHeightLevel];

    this.rings.forEach((ring, i) => {
      const targetScale = targetBase + i * 0.007;
      ring.currentScale += (targetScale - ring.currentScale) * Math.min(1, dt * 4.5);

      ring.mesh.scale.setScalar(ring.currentScale);
      const mat = ring.mesh.material as THREE.MeshBasicMaterial;

      if (this.currentHeightLevel !== this.targetHeightLevel || mat.opacity < 0.18) {
        const targetOpacity = 0.16;
        mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, dt * 3);
      } else {
        mat.opacity += (0 - mat.opacity) * Math.min(1, dt * 1.8);
      }
      mat.needsUpdate = true;
    });

    if (Math.abs(this.rings[0].currentScale - targetBase) < 0.0005) {
      this.currentHeightLevel = this.targetHeightLevel;
    }

    const viewDir = new THREE.Vector3();
    camera.getWorldDirection(viewDir);
    this.atmosphereMaterial.uniforms.viewVector.value.copy(viewDir).multiplyScalar(-1);
    this.atmosphereMaterial.uniformsNeedUpdate = true;

    this.starField.rotation.y += dt * 0.002;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public dispose(): void {
    this.earthBaseTexture.dispose();
    this.earthMaterial.dispose();
    this.cloudMaterial.dispose();
    this.heatmapMaterial.dispose();
    this.atmosphereMaterial.dispose();
    this.earthMesh.geometry.dispose();
    this.cloudMesh.geometry.dispose();
    this.heatmapMesh.geometry.dispose();
    this.atmosphereMesh.geometry.dispose();
    (this.starField.geometry as THREE.BufferGeometry).dispose();
    (this.starField.material as THREE.PointsMaterial).dispose();
    this.rings.forEach(r => {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
  }
}
