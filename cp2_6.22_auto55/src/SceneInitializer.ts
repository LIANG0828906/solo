import * as THREE from 'three';

export interface EnvParams {
  currentSpeed: number;
  lightIntensity: number;
  nutrientLevel: number;
}

export class SceneInitializer {
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
    const seg = 180;
    const geo = new THREE.PlaneGeometry(this.TERRAIN_SIZE, this.TERRAIN_SIZE, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const noise1 = Math.sin(x * 0.08) * Math.cos(z * 0.07) * 2.5;
      const noise2 = Math.sin(x * 0.2 + 1.3) * Math.cos(z * 0.18 + 0.5) * 0.9;
      const noise3 = Math.sin(x * 0.5 + z * 0.4) * 0.35;
      const y = noise1 + noise2 + noise3;
      pos.setY(i, y);

      const depthT = Math.min(1, Math.max(0, (-y + 3) / 15));
      const shallow = new THREE.Color(0x8a6b3f);
      const deep = new THREE.Color(0x2e2518);
      const c = shallow.clone().lerp(deep, depthT);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.02,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  public getTerrainHeight(x: number, z: number): number {
    const noise1 = Math.sin(x * 0.08) * Math.cos(z * 0.07) * 2.5;
    const noise2 = Math.sin(x * 0.2 + 1.3) * Math.cos(z * 0.18 + 0.5) * 0.9;
    const noise3 = Math.sin(x * 0.5 + z * 0.4) * 0.35;
    return noise1 + noise2 + noise3;
  }

  private setupFog(): void {
    this.fog = new THREE.FogExp2(0x0a1a30, 0.012);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0x0a1a30);
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x4488aa, 0.35);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x77bbff, 0x0a1a2a, 0.45);
    this.scene.add(this.hemiLight);

    this.directionalLight = new THREE.DirectionalLight(0xddeeff, 0.75);
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
      const pl = new THREE.PointLight(glowColors[i], 0.35, 25, 2);
      const angle = (i / 6) * Math.PI * 2;
      pl.position.set(Math.cos(angle) * 45, 2 + Math.random() * 6, Math.sin(angle) * 45);
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
      positions[i * 3] = (Math.random() - 0.5) * this.TERRAIN_SIZE * 0.9;
      positions[i * 3 + 1] = Math.random() * 20 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.TERRAIN_SIZE * 0.9;
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
    const half = this.TERRAIN_SIZE * 0.45;
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      let x = pos.getX(i) + this.particleVelocities[i * 3] * speed * 0.3;
      let y = pos.getY(i) + this.particleVelocities[i * 3 + 1] + Math.sin(time * 0.5 + i) * 0.008;
      let z = pos.getZ(i) + this.particleVelocities[i * 3 + 2] * speed * 0.3;
      if (x > half) x = -half;
      if (x < -half) x = half;
      if (y > 22) y = 1;
      if (y < 0.5) y = 20;
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
    this.pointLights.forEach((pl, i) => {
      pl.intensity = (0.15 + t * 0.45) * (0.8 + Math.sin(i + t * 2) * 0.2);
    });
    const fogT = 1 - t * 0.3 - params.nutrientLevel / 300;
    this.fog.density = 0.007 + Math.max(0, fogT) * 0.014;
    const bgT = 1 - t * 0.4;
    const bg = new THREE.Color().setRGB(0.04 * bgT + t * 0.03, 0.1 * bgT + t * 0.08, 0.19 * bgT + t * 0.14);
    this.scene.background = bg;
    this.fog.color.copy(bg);
  }
}
