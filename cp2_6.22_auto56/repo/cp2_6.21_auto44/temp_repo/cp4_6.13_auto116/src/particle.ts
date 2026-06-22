import type { FrequencyData, ThemeConfig } from './types.d';

const PARTICLE_COUNT = 1000;
const SPHERE_RADIUS = 20;

const themes: Record<string, ThemeConfig> = {
  neon: {
    name: '霓虹',
    particleHue: [180, 320],
    bgColor: 0x0a0a1a,
    starColor: 0x00ffff,
    glowIntensity: 1.5
  },
  aurora: {
    name: '极光',
    particleHue: [120, 280],
    bgColor: 0x0a1a0f,
    starColor: 0x00ff88,
    glowIntensity: 1.2
  },
  lava: {
    name: '熔岩',
    particleHue: [0, 60],
    bgColor: 0x1a0a0a,
    starColor: 0xff4400,
    glowIntensity: 2.0
  }
};

class ParticleSystem {
  private scene: any = null;
  private particleMesh: any = null;
  private glowMesh: any = null;
  private starMesh: any = null;
  private dummy: any = null;
  private currentTheme: ThemeConfig = themes.neon;

  private basePositions: Float32Array = new Float32Array(PARTICLE_COUNT * 3);
  private baseScales: Float32Array = new Float32Array(PARTICLE_COUNT);
  private baseHueOffsets: Float32Array = new Float32Array(PARTICLE_COUNT);
  private rotationSpeeds: Float32Array = new Float32Array(PARTICLE_COUNT);
  private angles: Float32Array = new Float32Array(PARTICLE_COUNT);
  private radii: Float32Array = new Float32Array(PARTICLE_COUNT);
  private yOffsets: Float32Array = new Float32Array(PARTICLE_COUNT);
  private pulsePhases: Float32Array = new Float32Array(PARTICLE_COUNT);

  private prevFreqData: FrequencyData = { low: 0, mid: 0, high: 0 };
  private smoothFreqData: FrequencyData = { low: 0, mid: 0, high: 0 };

  private colorObj: any = null;
  private glowColorObj: any = null;
  private starColorObj: any = null;

  init(scene: any): void {
    this.scene = scene;
    this.dummy = new THREE.Object3D();
    this.colorObj = new THREE.Color();
    this.glowColorObj = new THREE.Color();
    this.starColorObj = new THREE.Color();

    this.initParticleData();
    this.createParticles();
    this.createStars();
    this.applyTheme(this.currentTheme);
  }

  private initParticleData(): void {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SPHERE_RADIUS * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;

      this.angles[i] = theta;
      this.radii[i] = r;
      this.yOffsets[i] = y;
      this.baseScales[i] = 0.6 + Math.random() * 0.8;
      this.baseHueOffsets[i] = Math.random();
      this.rotationSpeeds[i] = 0.3 + Math.random() * 0.7;
      this.pulsePhases[i] = Math.random() * Math.PI * 2;
    }
  }

  private createParticles(): void {
    const geometry = new THREE.SphereGeometry(0.6, 10, 10);

    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95
    });
    this.particleMesh = new THREE.InstancedMesh(geometry, particleMaterial, PARTICLE_COUNT);

    const glowGeometry = new THREE.SphereGeometry(1.0, 10, 10);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    this.glowMesh = new THREE.InstancedMesh(glowGeometry, glowMaterial, PARTICLE_COUNT);

    this.scene.add(this.particleMesh);
    this.scene.add(this.glowMesh);
  }

  private createStars(): void {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.7;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.starMesh = new THREE.Points(geometry, material);
    this.scene.add(this.starMesh);
  }

  setTheme(themeName: string): void {
    const theme = themes[themeName];
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
    }
  }

  private applyTheme(theme: ThemeConfig): void {
    if (this.scene) {
      this.scene.background = new THREE.Color(theme.bgColor);
    }
  }

  update(delta: number, freqData: FrequencyData): void {
    if (!this.particleMesh || !this.glowMesh) return;

    this.smoothFreqData.low += (freqData.low - this.smoothFreqData.low) * 0.3;
    this.smoothFreqData.mid += (freqData.mid - this.smoothFreqData.mid) * 0.3;
    this.smoothFreqData.high += (freqData.high - this.smoothFreqData.high) * 0.3;

    const low = this.smoothFreqData.low;
    const mid = this.smoothFreqData.mid;
    const high = this.smoothFreqData.high;

    const scaleMultiplier = 0.5 + low * 1.5;
    const hueShift = mid;
    const rotationSpeed = 0.5 + high * 2;
    const glowIntensity = this.currentTheme.glowIntensity * (0.5 + low * 0.5 + high * 0.5);

    const hueStart = this.currentTheme.particleHue[0];
    const hueEnd = this.currentTheme.particleHue[1];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.angles[i] += delta * this.rotationSpeeds[i] * rotationSpeed;

      const pulse = 1 + Math.sin(this.pulsePhases[i] + high * 5) * 0.2 * low;
      const r = this.radii[i] * (1 + low * 0.15 * pulse);

      const x = r * Math.cos(this.angles[i]);
      const z = r * Math.sin(this.angles[i]);
      const y = this.yOffsets[i];

      const scale = this.baseScales[i] * scaleMultiplier * pulse;

      this.dummy.position.set(x, y, z);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();

      let hue = hueStart + (hueEnd - hueStart) * (this.baseHueOffsets[i] + hueShift * 0.3) % 360;
      if (hue > 360) hue -= 360;
      if (hue < 0) hue += 360;

      const saturation = 0.8 + mid * 0.2;
      const lightness = 0.5 + low * 0.3;

      this.colorObj.setHSL(hue / 360, saturation, lightness);
      this.particleMesh.setMatrixAt(i, this.dummy.matrix);
      this.particleMesh.setColorAt(i, this.colorObj);

      this.dummy.scale.setScalar(scale * 2.5);
      this.dummy.updateMatrix();
      this.glowMesh.setMatrixAt(i, this.dummy.matrix);

      this.glowColorObj.copy(this.colorObj);
      this.glowColorObj.multiplyScalar(glowIntensity);
      this.glowMesh.setColorAt(i, this.glowColorObj);

      this.pulsePhases[i] += delta * 2;
    }

    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.particleMesh.instanceColor.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceColor.needsUpdate = true;

    if (this.starMesh) {
      this.starMesh.rotation.y += delta * 0.02;
      this.starColorObj.setHex(this.currentTheme.starColor);
      (this.starMesh.material as any).color = this.starColorObj;
    }
  }

  resize(): void {
  }

  getThemeNames(): string[] {
    return Object.keys(themes);
  }

  getCurrentTheme(): string {
    return this.currentTheme.name;
  }

  dispose(): void {
    if (this.particleMesh) {
      this.particleMesh.geometry.dispose();
      this.particleMesh.material.dispose();
      this.scene.remove(this.particleMesh);
    }
    if (this.glowMesh) {
      this.glowMesh.geometry.dispose();
      this.glowMesh.material.dispose();
      this.scene.remove(this.glowMesh);
    }
    if (this.starMesh) {
      this.starMesh.geometry.dispose();
      (this.starMesh.material as any).dispose();
      this.scene.remove(this.starMesh);
    }
  }
}

export const particleSystem = new ParticleSystem();
