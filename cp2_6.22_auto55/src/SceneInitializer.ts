import * as THREE from 'three';
import { EnvParams, ISceneInitializer } from './types';

export class SceneInitializer implements ISceneInitializer {
  private scene: THREE.Scene;
  public terrain!: THREE.Mesh;
  public fog!: THREE.FogExp2;
  public ambientLight!: THREE.AmbientLight;
  public directionalLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public pointLights: THREE.PointLight[] = [];
  public particles!: THREE.Points;
  private particleVelocities: Float32Array | null = null;
  private readonly TERRAIN_SIZE = 200;
  private readonly PARTICLE_COUNT = 600;
  private readonly TERRAIN_SEG = 180;

  public terrainAmplitude = 1.0;
  public terrainFrequency = 1.0;

  private targetTerrainAmplitude = 1.0;
  private targetTerrainFrequency = 1.0;
  private _terrainHeightScale = 1.0;
  private _terrainFreqScale = 1.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public init(): void {
    this.terrain = this.createTerrain();
    this.scene.add(this.terrain);
    this.setupFog();
    this.setupLights();
    this.particles = this.createCurrentParticles();
    this.scene.add(this.particles);
  }

  private createTerrain(): THREE.Mesh {
    const SEG = this.TERRAIN_SEG;
    const TERRAIN_SIZE = this.TERRAIN_SIZE;
    const vertexCount = (SEG + 1) * (SEG + 1);
    const indexCount = SEG * SEG * 6;

    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const indices = new Uint32Array(indexCount);

    const shallow = new THREE.Color(0x8a6b3f);
    const deep = new THREE.Color(0x2e2518);

    const f = this.terrainFrequency;
    const a = this.terrainAmplitude;

    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j <= SEG; j++) {
        const idx = i * (SEG + 1) + j;
        const x = (i / SEG - 0.5) * TERRAIN_SIZE;
        const z = (j / SEG - 0.5) * TERRAIN_SIZE;

        const n1 = Math.sin(x * 0.08 * f) * Math.cos(z * 0.07 * f) * 2.5 * a;
        const n2 = Math.sin(x * 0.2 * f + 1.3) * Math.cos(z * 0.18 * f + 0.5) * 0.9 * a;
        const n3 = Math.sin(x * 0.5 * f + z * 0.4 * f) * 0.35 * a;
        const y = n1 + n2 + n3;

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        const depthT = Math.min(1, Math.max(0, (-y + 3) / 15));
        const c = shallow.clone().lerp(deep, depthT);
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
      }
    }

    let idxPtr = 0;
    for (let i = 0; i < SEG; i++) {
      for (let j = 0; j < SEG; j++) {
        const a = i * (SEG + 1) + j;
        const b = a + 1;
        const c = a + (SEG + 1);
        const d = c + 1;

        indices[idxPtr++] = a;
        indices[idxPtr++] = c;
        indices[idxPtr++] = b;

        indices[idxPtr++] = b;
        indices[idxPtr++] = c;
        indices[idxPtr++] = d;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  public getTerrainHeight(x: number, z: number): number {
    const f = this.terrainFrequency;
    const a = this.terrainAmplitude;
    const n1 = Math.sin(x * 0.08 * f) * Math.cos(z * 0.07 * f) * 2.5 * a;
    const n2 = Math.sin(x * 0.2 * f + 1.3) * Math.cos(z * 0.18 * f + 0.5) * 0.9 * a;
    const n3 = Math.sin(x * 0.5 * f + z * 0.4 * f) * 0.35 * a;
    return n1 + n2 + n3;
  }

  public updateTerrainFromParams(params: EnvParams): void {
    this.targetTerrainAmplitude = params.terrainAmplitude ?? 1.0;
    this.targetTerrainFrequency = params.terrainFrequency ?? 1.0;

    const prevA = this.terrainAmplitude;
    const prevF = this.terrainFrequency;

    this.terrainAmplitude = THREE.MathUtils.lerp(this.terrainAmplitude, this.targetTerrainAmplitude, 0.08);
    this.terrainFrequency = THREE.MathUtils.lerp(this.terrainFrequency, this.targetTerrainFrequency, 0.08);

    const diffA = Math.abs(this.terrainAmplitude - prevA);
    const diffF = Math.abs(this.terrainFrequency - prevF);

    if (diffA > 0.01 || diffF > 0.01) {
      this._terrainHeightScale = this.terrainAmplitude;
      this._terrainFreqScale = this.terrainFrequency;
      this.updateTerrainVertices();
    }
  }

  private updateTerrainVertices(): void {
    const SEG = this.TERRAIN_SEG;
    const TERRAIN_SIZE = this.TERRAIN_SIZE;
    const posAttr = this.terrain.geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = this.terrain.geometry.attributes.color as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;

    const shallow = new THREE.Color(0x8a6b3f);
    const deep = new THREE.Color(0x2e2518);

    const f = this.terrainFrequency;
    const a = this.terrainAmplitude;

    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j <= SEG; j++) {
        const idx = i * (SEG + 1) + j;
        const x = (i / SEG - 0.5) * TERRAIN_SIZE;
        const z = (j / SEG - 0.5) * TERRAIN_SIZE;

        const n1 = Math.sin(x * 0.08 * f) * Math.cos(z * 0.07 * f) * 2.5 * a;
        const n2 = Math.sin(x * 0.2 * f + 1.3) * Math.cos(z * 0.18 * f + 0.5) * 0.9 * a;
        const n3 = Math.sin(x * 0.5 * f + z * 0.4 * f) * 0.35 * a;
        const y = n1 + n2 + n3;

        positions[idx * 3 + 1] = y;

        const depthT = Math.min(1, Math.max(0, (-y + 3) / 15));
        const c = shallow.clone().lerp(deep, depthT);
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    this.terrain.geometry.computeVertexNormals();
  }

  private setupFog(): void {
    this.fog = new THREE.FogExp2(0x0a1a30, 0.012);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0x0a1a30);
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x77bbff, 0x0a1a2a, 0.5);
    this.scene.add(this.hemiLight);

    this.directionalLight = new THREE.DirectionalLight(0xddeeff, 0.85);
    this.directionalLight.position.set(40, 80, 30);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.near = 1;
    this.directionalLight.shadow.camera.far = 200;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);

    const glowColors = [0x00ffcc, 0xffaa66, 0xaa88ff, 0xff88bb, 0x66ffcc, 0xffcc66];
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(glowColors[i], 0.375, 25, 2);
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 10;
      pl.position.set(Math.cos(angle) * radius, 2 + Math.random() * 8, Math.sin(angle) * radius);
      this.scene.add(pl);
      this.pointLights.push(pl);
    }
  }

  private createCurrentParticles(): THREE.Points {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.PARTICLE_COUNT * 3);
    const colors = new Float32Array(this.PARTICLE_COUNT * 3);
    const vel = new Float32Array(this.PARTICLE_COUNT * 3);

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = Math.random() * 20 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.6, 0.65 + Math.random() * 0.2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      vel[i * 3] = (Math.random() * 0.4 + 0.2);
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 2] = (Math.random() * 0.2 + 0.1);
    }
    this.particleVelocities = vel;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  public updateParticles(time: number, speed: number): void {
    if (!this.particleVelocities) return;
    const pos = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const half = 90;
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      let x = pos.getX(i) + this.particleVelocities[i * 3] * speed * 0.3;
      let y = pos.getY(i) + this.particleVelocities[i * 3 + 1] + Math.sin(time * 0.5 + i) * 0.008;
      let z = pos.getZ(i) + this.particleVelocities[i * 3 + 2] * speed * 0.3;
      if (x > half) x = -half;
      if (x < -half) x = half;
      if (y > 21) y = 1;
      if (y < 1) y = 21;
      if (z > half) z = -half;
      if (z < -half) z = half;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
  }

  public updateLighting(params: EnvParams): void {
    const t = params.lightIntensity / 100;
    this.ambientLight.intensity = 0.2 + t * 0.4;
    this.directionalLight.intensity = 0.4 + t * 0.9;
    this.hemiLight.intensity = 0.25 + t * 0.5;
    this.pointLights.forEach((pl) => {
      pl.intensity = 0.15 + t * 0.45;
    });
    const fogT = 1 - t * 0.3 - params.nutrientLevel / 300;
    this.fog.density = 0.007 + fogT * 0.014;
    const dark = new THREE.Color(0x0a1a30);
    const bright = new THREE.Color(0x143252);
    const bg = dark.clone().lerp(bright, t);
    this.scene.background = bg;
    this.fog.color.copy(bg);
  }
}
