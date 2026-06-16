import * as THREE from 'three';
import { Crystal } from './Crystal';

interface FluorescentPoint {
  mesh: THREE.Points;
  baseOpacity: number;
  phase: number;
}

export class Garden {
  public scene: THREE.Scene;
  public crystals: Crystal[] = [];
  public terrain!: THREE.Mesh;
  public terrainAmplitude: number = 1;

  private terrainGeometry!: THREE.PlaneGeometry;
  private terrainMaterial!: THREE.MeshStandardMaterial;
  private targetAmplitude: number = 1;
  private originalPositions: Float32Array | null = null;
  private noiseSeed: number[] = [];

  private fluorescentPoints: FluorescentPoint[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredCrystal: Crystal | null = null;

  private auroraMesh!: THREE.Mesh;
  private auroraMaterial!: THREE.ShaderMaterial;
  private time: number = 0;

  private isShaking: boolean = false;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;

  private terrainTransitionProgress: number = 1;
  private isTransitioning: boolean = false;
  private oldNoiseSeed: number[] = [];

  private crystalGroup: THREE.Group;

  private static readonly MAX_CRYSTALS = 300;
  private static readonly TERRAIN_SIZE = 40;
  private static readonly TERRAIN_SEGMENTS = 80;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.crystalGroup = new THREE.Group();
    this.scene.add(this.crystalGroup);

    this.generateNoiseSeed();
    this.createAuroraBackground();
    this.generateTerrain(this.terrainAmplitude);
    this.generateFluorescentPoints();
    this.generateCrystals();
  }

  private generateNoiseSeed(): void {
    this.noiseSeed = [];
    for (let i = 0; i < (Garden.TERRAIN_SEGMENTS + 1) * (Garden.TERRAIN_SEGMENTS + 1); i++) {
      this.noiseSeed.push(Math.random() * 1000);
    }
  }

  private noise2D(x: number, y: number, seed: number[]): number {
    const xi = Math.floor(x) % (Garden.TERRAIN_SEGMENTS + 1);
    const yi = Math.floor(y) % (Garden.TERRAIN_SEGMENTS + 1);
    const index = yi * (Garden.TERRAIN_SEGMENTS + 1) + xi;
    const seedValue = seed[Math.abs(index) % seed.length];

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const n = Math.sin(xf * 12.9898 + yf * 78.233 + seedValue) * 43758.5453;
    return n - Math.floor(n);
  }

  private smoothNoise(x: number, y: number, seed: number[]): number {
    const corners = (this.noise2D(x - 1, y - 1, seed) + this.noise2D(x + 1, y - 1, seed) +
                     this.noise2D(x - 1, y + 1, seed) + this.noise2D(x + 1, y + 1, seed)) / 16;
    const sides = (this.noise2D(x - 1, y, seed) + this.noise2D(x + 1, y, seed) +
                   this.noise2D(x, y - 1, seed) + this.noise2D(x, y + 1, seed)) / 8;
    const center = this.noise2D(x, y, seed) / 4;
    return corners + sides + center;
  }

  private interpolatedNoise(x: number, y: number, seed: number[]): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;

    const v1 = this.smoothNoise(intX, intY, seed);
    const v2 = this.smoothNoise(intX + 1, intY, seed);
    const v3 = this.smoothNoise(intX, intY + 1, seed);
    const v4 = this.smoothNoise(intX + 1, intY + 1, seed);

    const i1 = v1 * (1 - fracX) + v2 * fracX;
    const i2 = v3 * (1 - fracX) + v4 * fracX;

    return i1 * (1 - fracY) + i2 * fracY;
  }

  private fbmNoise(x: number, y: number, seed: number[], amplitude: number): number {
    let total = 0;
    let frequency = 0.1;
    let amp = amplitude;
    let maxValue = 0;

    for (let i = 0; i < 4; i++) {
      total += this.interpolatedNoise(x * frequency, y * frequency, seed) * amp;
      maxValue += amp;
      frequency *= 2;
      amp *= 0.5;
    }

    return total / maxValue;
  }

  public generateTerrain(amplitude: number): void {
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrainGeometry?.dispose();
      this.terrainMaterial?.dispose();
    }

    this.terrainGeometry = new THREE.PlaneGeometry(
      Garden.TERRAIN_SIZE,
      Garden.TERRAIN_SIZE,
      Garden.TERRAIN_SEGMENTS,
      Garden.TERRAIN_SEGMENTS
    );

    this.terrainGeometry.rotateX(-Math.PI / 2);

    const positions = this.terrainGeometry.attributes.position;
    this.originalPositions = new Float32Array(positions.array);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      const noiseX = (x / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;
      const noiseZ = (z / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;

      const height = this.fbmNoise(noiseX, noiseZ, this.noiseSeed, amplitude);
      positions.setY(i, height);
    }

    this.terrainGeometry.computeVertexNormals();

    this.terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A0F2E,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  public generateFluorescentPoints(): void {
    const pointCount = 800;
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    const sizes = new Float32Array(pointCount);

    const color = new THREE.Color(0xB5D8FF);

    for (let i = 0; i < pointCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Garden.TERRAIN_SIZE * 0.45;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const noiseX = (x / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;
      const noiseZ = (z / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;

      const height = this.fbmNoise(noiseX, noiseZ, this.noiseSeed, this.terrainAmplitude);

      positions[i * 3] = x;
      positions[i * 3 + 1] = height + 0.05;
      positions[i * 3 + 2] = z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 1 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = sin(time * 2.0 + position.x * 0.5 + position.z * 0.5) * 0.3 + 0.7;
          gl_PointSize = size * pulse;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    this.fluorescentPoints.push({ mesh: points, baseOpacity: 0.8, phase: Math.random() * Math.PI * 2 });
    this.scene.add(points);
  }

  public generateCrystals(): void {
    this.clearCrystals();

    const crystalCount = Math.min(250, Garden.MAX_CRYSTALS);

    for (let i = 0; i < crystalCount; i++) {
      let x: number, z: number, height: number;
      let attempts = 0;

      do {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * Garden.TERRAIN_SIZE * 0.42;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;

        const noiseX = (x / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;
        const noiseZ = (z / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;

        height = this.fbmNoise(noiseX, noiseZ, this.noiseSeed, this.terrainAmplitude);
        attempts++;
      } while (height < this.terrainAmplitude * 0.3 && attempts < 10);

      const position = new THREE.Vector3(x, height, z);
      const crystal = new Crystal(position, this.scene);

      crystal.animateGrow(0.8 + Math.random() * 0.5);
      this.crystals.push(crystal);
      this.crystalGroup.add(crystal.mesh);
    }
  }

  private clearCrystals(): void {
    for (const crystal of this.crystals) {
      crystal.dispose();
    }
    this.crystals = [];
  }

  public updateTerrainAmplitude(amplitude: number): void {
    this.targetAmplitude = amplitude;
    this.isTransitioning = true;
    this.terrainTransitionProgress = 0;
    this.oldNoiseSeed = [...this.noiseSeed];
    this.generateNoiseSeed();

    this.updateCrystalPositions();
  }

  private updateCrystalPositions(): void {
    for (const crystal of this.crystals) {
      const x = crystal.position.x;
      const z = crystal.position.z;

      const noiseX = (x / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;
      const noiseZ = (z / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;

      const targetHeight = this.fbmNoise(noiseX, noiseZ, this.noiseSeed, this.targetAmplitude);

      crystal.position.y = targetHeight;
    }
  }

  public async resetAllCrystals(): Promise<void> {
    this.isShaking = true;
    this.shakeIntensity = 0.05;
    this.shakeDuration = 1.5;

    const shrinkPromises = this.crystals.map((crystal, index) => {
      const delay = index * 0.005;
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          crystal.animateShrink(1).then(resolve);
        }, delay);
      });
    });

    await Promise.all(shrinkPromises);

    this.clearCrystals();
    this.generateNoiseSeed();
    this.generateTerrain(this.targetAmplitude);

    for (const point of this.fluorescentPoints) {
      this.scene.remove(point.mesh);
      point.mesh.geometry.dispose();
      (point.mesh.material as THREE.Material).dispose();
    }
    this.fluorescentPoints = [];
    this.generateFluorescentPoints();

    this.generateCrystals();

    const growPromises = this.crystals.map((crystal) => {
      return crystal.animateGrow(0.8 + Math.random() * 0.4);
    });

    await Promise.all(growPromises);
  }

  private createAuroraBackground(): void {
    const auroraVertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const auroraFragmentShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        vec4 m = max(vec4(0.0), 0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)));
        m = m * m;
        return 42.0 * dot(m * norm, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      void main() {
        float n1 = snoise(vec3(vUv.x * 3.0, vUv.y * 2.0, time * 0.1));
        float n2 = snoise(vec3(vUv.x * 4.0 + 100.0, vUv.y * 3.0, time * 0.15));

        vec3 color1 = vec3(0.6, 0.4, 0.9);
        vec3 color2 = vec3(0.3, 0.5, 0.9);
        vec3 color3 = vec3(0.8, 0.3, 0.7);

        float mask1 = smoothstep(0.3, 0.7, n1);
        float mask2 = smoothstep(0.2, 0.6, n2);

        vec3 aurora = mix(color1, color2, mask1);
        aurora = mix(aurora, color3, mask2);

        float gradient = vUv.y;
        float intensity = mask1 * mask2 * 0.6;

        vec3 bgBottom = vec3(0.102, 0.059, 0.180);
        vec3 bgTop = vec3(0.176, 0.106, 0.306);
        vec3 bg = mix(bgBottom, bgTop, gradient);

        vec3 finalColor = mix(bg, aurora, intensity * gradient);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      side: THREE.DoubleSide,
    });

    const auroraGeometry = new THREE.SphereGeometry(200, 32, 32);
    this.auroraMesh = new THREE.Mesh(auroraGeometry, this.auroraMaterial);
    this.auroraMesh.position.y = 50;
    this.scene.add(this.auroraMesh);
  }

  public handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  public updateRaycaster(camera: THREE.Camera): void {
    this.raycaster.setFromCamera(this.mouse, camera);

    const meshes = this.crystals.map(c => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (this.hoveredCrystal) {
      this.hoveredCrystal.hoverOff();
      this.hoveredCrystal = null;
    }

    if (intersects.length > 0) {
      let crystal = this.findCrystalFromIntersect(intersects[0].object);
      if (crystal) {
        crystal.hoverOn();
        this.hoveredCrystal = crystal;
      }
    }
  }

  private findCrystalFromIntersect(obj: THREE.Object3D): Crystal | null {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (current.userData && current.userData.crystal) {
        return current.userData.crystal;
      }
      current = current.parent;
    }
    return null;
  }

  public handleClick(event: MouseEvent, camera: THREE.Camera, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    const meshes = this.crystals.map(c => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const crystal = this.findCrystalFromIntersect(intersects[0].object);
      if (crystal) {
        crystal.animateBurst();
      }
    }
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;

    if (this.auroraMaterial) {
      this.auroraMaterial.uniforms.time.value = this.time;
    }

    for (const point of this.fluorescentPoints) {
      const mat = point.mesh.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.time.value = this.time + point.phase;
      }
    }

    if (this.isTransitioning) {
      this.terrainTransitionProgress += deltaTime * 0.8;
      const progress = Math.min(this.terrainTransitionProgress, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const positions = this.terrainGeometry.attributes.position;

      for (let i = 0; i < positions.count; i++) {
        const x = this.originalPositions![i * 3];
        const z = this.originalPositions![i * 3 + 2];

        const noiseX = (x / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;
        const noiseZ = (z / Garden.TERRAIN_SIZE + 0.5) * Garden.TERRAIN_SEGMENTS;

        const oldHeight = this.fbmNoise(noiseX, noiseZ, this.oldNoiseSeed, this.terrainAmplitude);
        const newHeight = this.fbmNoise(noiseX, noiseZ, this.noiseSeed, this.targetAmplitude);

        const currentHeight = oldHeight + (newHeight - oldHeight) * easedProgress;
        positions.setY(i, currentHeight);
      }

      this.terrainGeometry.computeVertexNormals();
      positions.needsUpdate = true;

      if (progress >= 1) {
        this.isTransitioning = false;
        this.terrainAmplitude = this.targetAmplitude;
      }
    }

    if (this.isShaking) {
      this.shakeDuration -= deltaTime;
      if (this.shakeDuration <= 0) {
        this.isShaking = false;
        this.terrain.position.y = 0;
      } else {
        const shakeAmount = this.shakeIntensity * Math.sin(this.time * 50) * (this.shakeDuration / 1.5);
        this.terrain.position.y = shakeAmount;
      }
    }

    for (const crystal of this.crystals) {
      crystal.update(deltaTime);
    }
  }
}
