import * as THREE from 'three';
import type { PlanetData, TextureType } from '../planets/PlanetSystem';
import OrbitWorker from '../workers/OrbitWorker?worker';

export interface PlanetMeshEntry {
  mesh: THREE.Mesh;
  data: PlanetData;
  glowMaterial?: THREE.MeshBasicMaterial;
}

export interface SceneRendererOptions {
  onPositionsUpdate?: (positions: Array<{ x: number; y: number; z: number }>) => void;
}

export class SceneRenderer {
  public scene: THREE.Scene;
  public sun!: THREE.Mesh;
  public planets: PlanetMeshEntry[] = [];
  public orbitLines: THREE.LineLoop[] = [];
  public stars!: THREE.Points;

  private worker: Worker;
  private textureResolution = 2048;
  private timeScale = 1;
  private planetAngles: number[] = [];
  private starPhases: Float32Array;
  private options: SceneRendererOptions;
  private sunMaterial!: THREE.ShaderMaterial;

  constructor(options: SceneRendererOptions = {}) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.starPhases = new Float32Array(0);
    this.options = options;

    this.worker = new OrbitWorker();
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
  }

  public init(planetDataList: PlanetData[]): void {
    this.createSun();
    this.createStars();

    planetDataList.forEach((data, index) => {
      this.planetAngles.push(Math.random() * Math.PI * 2);
      const planetMesh = this.createPlanetMesh(data);
      this.planets.push({ mesh: planetMesh, data });
      this.orbitLines.push(this.createOrbitLine(data.orbitRadius));
      this.scene.add(planetMesh);
    });

    this.worker.postMessage({
      type: 'init',
      orbits: planetDataList.map((p, i) => ({
        orbitRadius: p.orbitRadius,
        orbitSpeed: p.orbitSpeed,
        phase: this.planetAngles[i],
      })),
    });
  }

  private createSun(): void {
    const sunGeo = new THREE.SphereGeometry(2, 64, 64);

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * smoothNoise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv * 3.0 + uTime * 0.1;
        float n = fbm(uv);
        float n2 = fbm(uv + vec2(10.0, uTime * 0.05));
        vec3 color1 = vec3(1.0, 0.85, 0.2);
        vec3 color2 = vec3(1.0, 0.45, 0.05);
        vec3 color3 = vec3(1.0, 0.95, 0.5);
        vec3 color = mix(color1, color2, n);
        color = mix(color, color3, n2 * 0.4);
        float intensity = 0.8 + 0.2 * sin(uTime * 2.0 + n * 10.0);
        gl_FragColor = vec4(color * intensity, 1.0);
      }
    `;

    this.sunMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
    });

    this.sun = new THREE.Mesh(sunGeo, this.sunMaterial);
    this.scene.add(this.sun);

    const sunLight = new THREE.PointLight(0xffd700, 2, 200, 0.5);
    this.sun.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const glowGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    this.sun.add(glow);
  }

  private createStars(): void {
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    this.starPhases = new Float32Array(starCount);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 500 * Math.cbrt(Math.random());

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      this.starPhases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 1 + Math.random() * 2;
    }

    const starVertex = `
      attribute float size;
      attribute float phase;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vAlpha = 0.3 + 0.5 * (0.5 + 0.5 * sin(uTime * (0.5 + phase * 0.1) + phase));
      }
    `;

    const starFragment = `
      varying float vAlpha;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        float alpha = vAlpha * (1.0 - smoothstep(0.0, 0.5, dist));
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
      }
    `;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(this.starPhases, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: starVertex,
      fragmentShader: starFragment,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  private generatePlanetTexture(type: TextureType, baseColor: number): THREE.Texture {
    const size = this.textureResolution;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d')!;

    const base = new THREE.Color(baseColor);

    if (type === 'earth') {
      this.generateEarthTexture(ctx, canvas.width, canvas.height);
    } else if (type === 'mars') {
      this.generateMarsTexture(ctx, canvas.width, canvas.height, base);
    } else if (type === 'jupiter') {
      this.generateJupiterTexture(ctx, canvas.width, canvas.height);
    } else if (type === 'saturn') {
      this.generateSaturnTexture(ctx, canvas.width, canvas.height);
    } else if (type === 'ice') {
      this.generateIceTexture(ctx, canvas.width, canvas.height, base);
    } else {
      this.generateRockyTexture(ctx, canvas.width, canvas.height, base);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private generateEarthTexture(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const nx = x / w;
        const ny = y / h;
        const n = this.perlin2(nx * 4, ny * 4);
        const n2 = this.perlin2(nx * 8 + 100, ny * 8 + 100);
        const continent = n > 0.15;
        const latitude = Math.abs(ny - 0.5) * 2;

        if (continent && latitude < 0.85) {
          const greenness = 0.5 + 0.3 * n2;
          data[idx] = Math.floor(40 + 80 * (1 - greenness) + 30 * n);
          data[idx + 1] = Math.floor(90 + 100 * greenness + 20 * n);
          data[idx + 2] = Math.floor(30 + 40 * (1 - greenness));
        } else if (latitude >= 0.85) {
          data[idx] = 230;
          data[idx + 1] = 240;
          data[idx + 2] = 255;
        } else {
          const depth = 0.4 + 0.3 * (1 - n);
          data[idx] = Math.floor(20 + 40 * depth);
          data[idx + 1] = Math.floor(60 + 80 * depth);
          data[idx + 2] = Math.floor(130 + 80 * depth);
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    for (let i = 0; i < 80; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const r = 20 + Math.random() * 60;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.6)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private generateMarsTexture(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color): void {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const nx = x / w;
        const ny = y / h;
        const n = this.perlin2(nx * 6, ny * 6);
        const n2 = this.perlin2(nx * 12 + 50, ny * 12 + 50);

        const stripe = Math.sin(nx * 20 + n2 * 3) > 0.7 ? 0.7 : 1;

        data[idx] = Math.floor(base.r * 255 * (0.6 + 0.5 * n) * stripe);
        data[idx + 1] = Math.floor(base.g * 255 * (0.5 + 0.4 * n) * stripe);
        data[idx + 2] = Math.floor(base.b * 255 * (0.4 + 0.3 * n) * stripe);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private generateJupiterTexture(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const colors = [
      [216, 202, 157],
      [180, 130, 80],
      [240, 220, 180],
      [160, 100, 60],
      [230, 200, 160],
    ];

    for (let y = 0; y < h; y++) {
      const bandIdx = Math.floor((y / h) * colors.length * 2) % colors.length;
      const n = this.perlin2(0, y / h * 3);
      const color = colors[bandIdx];
      ctx.fillStyle = `rgb(${color[0] + n * 30}, ${color[1] + n * 20}, ${color[2] + n * 10})`;
      ctx.fillRect(0, y, w, 1);
    }

    const grad = ctx.createRadialGradient(w * 0.7, h * 0.45, 0, w * 0.7, h * 0.45, h * 0.1);
    grad.addColorStop(0, 'rgba(200, 90, 50, 0.9)');
    grad.addColorStop(1, 'rgba(200, 90, 50, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private generateSaturnTexture(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const colors = [
      [250, 213, 165],
      [230, 190, 140],
      [245, 210, 170],
      [220, 180, 130],
      [240, 200, 160],
    ];

    for (let y = 0; y < h; y++) {
      const bandIdx = Math.floor((y / h) * colors.length * 1.5) % colors.length;
      const n = this.perlin2(0, y / h * 4);
      const color = colors[bandIdx];
      ctx.fillStyle = `rgb(${color[0] + n * 20}, ${color[1] + n * 15}, ${color[2] + n * 10})`;
      ctx.fillRect(0, y, w, 1);
    }
  }

  private generateIceTexture(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color): void {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const nx = x / w;
        const ny = y / h;
        const n = this.perlin2(nx * 5, ny * 5);

        data[idx] = Math.floor(base.r * 255 * (0.7 + 0.3 * n));
        data[idx + 1] = Math.floor(base.g * 255 * (0.75 + 0.25 * n));
        data[idx + 2] = Math.floor(base.b * 255 * (0.8 + 0.2 * n));
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private generateRockyTexture(ctx: CanvasRenderingContext2D, w: number, h: number, base: THREE.Color): void {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const nx = x / w;
        const ny = y / h;
        const n = this.perlin2(nx * 8, ny * 8);
        const n2 = this.perlin2(nx * 16 + 10, ny * 16 + 10);

        data[idx] = Math.floor(base.r * 255 * (0.6 + 0.5 * n) * (0.85 + 0.15 * n2));
        data[idx + 1] = Math.floor(base.g * 255 * (0.6 + 0.5 * n) * (0.85 + 0.15 * n2));
        data[idx + 2] = Math.floor(base.b * 255 * (0.6 + 0.5 * n) * (0.85 + 0.15 * n2));
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  private perlin2(x: number, y: number): number {
    const p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
      247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
      57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    ];
    const perm = new Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = perm[X] + Y;
    const B = perm[X + 1] + Y;
    return this.lerp(
      v,
      this.lerp(u, this.grad(perm[A], x, y), this.grad(perm[B], x - 1, y)),
      this.lerp(u, this.grad(perm[A + 1], x, y - 1), this.grad(perm[B + 1], x - 1, y - 1))
    );
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private createPlanetMesh(data: PlanetData): THREE.Mesh {
    const geo = new THREE.SphereGeometry(data.radius, 32, 32);
    const tex = this.generatePlanetTexture(data.textureType, data.color);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.8,
      metalness: 0.1,
      emissive: new THREE.Color(data.color),
      emissiveIntensity: 0.05,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { planetName: data.name };
    mesh.position.set(data.orbitRadius, 0, 0);

    if (data.name === '土星') {
      const ringGeo = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.3, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc9b896,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      mesh.add(ring);
    }

    return mesh;
  }

  private createOrbitLine(radius: number): THREE.LineLoop {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    });
    const line = new THREE.LineLoop(geo, mat);
    this.scene.add(line);
    return line;
  }

  public updatePlanetTexture(type: TextureType, baseColor: number, index: number): void {
    const entry = this.planets[index];
    if (!entry) return;
    const tex = this.generatePlanetTexture(type, baseColor);
    const mat = entry.mesh.material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.map = tex;
    mat.needsUpdate = true;
  }

  public degradeAllTextures(): void {
    if (this.textureResolution === 1024) return;
    this.textureResolution = 1024;
    this.planets.forEach((entry, i) => {
      this.updatePlanetTexture(entry.data.textureType, entry.data.color, i);
    });
  }

  private handleWorkerMessage(e: MessageEvent): void {
    const { positions, degradeTexture } = e.data;

    if (degradeTexture) {
      this.degradeAllTextures();
    }

    positions.forEach((pos: { x: number; y: number; z: number }, i: number) => {
      if (this.planets[i]) {
        this.planets[i].mesh.position.set(pos.x, pos.y, pos.z);
      }
    });

    this.options.onPositionsUpdate?.(positions);
  }

  public setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  public update(time: number, deltaTime: number): void {
    this.worker.postMessage({
      type: 'update',
      time,
      deltaTime,
      timeScale: this.timeScale,
    });

    this.planets.forEach((entry) => {
      entry.mesh.rotation.y += entry.data.rotationSpeed * deltaTime * this.timeScale;
    });

    if (this.sunMaterial) {
      this.sunMaterial.uniforms.uTime.value = time;
    }

    if (this.stars && this.stars.material instanceof THREE.ShaderMaterial) {
      this.stars.material.uniforms.uTime.value = time;
    }
  }

  public dispose(): void {
    this.worker.terminate();
  }
}
