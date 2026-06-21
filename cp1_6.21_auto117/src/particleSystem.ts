import * as THREE from 'three';

const PARTICLE_COUNT = 5000;
const GALAXY_RADIUS = 15;
const LOW_BAND_START = 0;
const LOW_BAND_END = 4;
const MID_BAND_START = 4;
const MID_BAND_END = 10;
const HIGH_BAND_START = 10;
const HIGH_BAND_END = 16;
const LERP_SPEED = 0.1;

interface ParticleData {
  theta: number;
  phi: number;
  radius: number;
  rotationSpeed: number;
  baseSize: number;
  hue: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private particleData: ParticleData[];
  private initialPositions: Float32Array;
  private targetSizes: Float32Array;
  private targetColors: Float32Array;
  private targetOffsets: Float32Array;
  private boostRotation: number;
  private boostEndTime: number;

  private lowEnergy: number = 0;
  private midEnergy: number = 0;
  private highEnergy: number = 0;

  private lowEnergyTarget: number = 0;
  private midEnergyTarget: number = 0;
  private highEnergyTarget: number = 0;

  private centerSphere: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.boostRotation = 1;
    this.boostEndTime = 0;

    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.colors = new Float32Array(PARTICLE_COUNT * 3);
    this.sizes = new Float32Array(PARTICLE_COUNT);
    this.particleData = new Array(PARTICLE_COUNT);
    this.initialPositions = new Float32Array(PARTICLE_COUNT * 3);
    this.targetSizes = new Float32Array(PARTICLE_COUNT);
    this.targetColors = new Float32Array(PARTICLE_COUNT * 3);
    this.targetOffsets = new Float32Array(PARTICLE_COUNT);

    this.generateInitialPositions();
    this.targetSizes.set(this.sizes);
    this.targetColors.set(this.colors);
    this.targetOffsets.fill(0);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));

    const particleTexture = this.createCircleTexture();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: particleTexture },
        globalOpacity: { value: 0.6 }
      },
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (500.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        uniform float globalOpacity;
        varying vec3 vColor;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * globalOpacity);
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    this.centerSphere = this.createCenterSphere();
    this.scene.add(this.centerSphere);
  }

  private createCircleTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createCenterSphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sphere = new THREE.Mesh(geometry, material);

    const glowGeometry = new THREE.SphereGeometry(2.5, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sphere.add(glow);

    return sphere;
  }

  private generateInitialPositions(): void {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = GALAXY_RADIUS * (0.85 + Math.random() * 0.15);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.initialPositions[i3] = x;
      this.initialPositions[i3 + 1] = y;
      this.initialPositions[i3 + 2] = z;

      this.particleData[i] = {
        theta,
        phi,
        radius,
        rotationSpeed: 0.01 + Math.random() * 0.04,
        baseSize: 2 + Math.random() * 6,
        hue: Math.random()
      };

      this.sizes[i] = this.particleData[i].baseSize;

      const hue = this.particleData[i].hue;
      const color = this.hueToRgb(hue, 0.85, 0.7);
      this.colors[i3] = color.r;
      this.colors[i3 + 1] = color.g;
      this.colors[i3 + 2] = color.b;
    }

    if (this.geometry) {
      (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (this.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  private hueToRgb(hue: number, saturation: number, lightness: number): { r: number; g: number; b: number } {
    const color = new THREE.Color();
    color.setHSL(hue, saturation, lightness);
    return { r: color.r, g: color.g, b: color.b };
  }

  private bandGradientColor(midEnergy: number, particleHue: number): { r: number; g: number; b: number } {
    const blue = new THREE.Color(0x2196F3);
    const purple = new THREE.Color(0x9C27B0);
    const red = new THREE.Color(0xF44336);

    let base: THREE.Color;
    if (midEnergy < 0.5) {
      const t = midEnergy * 2;
      base = blue.clone().lerp(purple, t);
    } else {
      const t = (midEnergy - 0.5) * 2;
      base = purple.clone().lerp(red, t);
    }

    const hueShift = new THREE.Color();
    hueShift.setHSL(particleHue * 0.2 + midEnergy * 0.1, 0.7, 0.6);
    return {
      r: base.r * 0.7 + hueShift.r * 0.3,
      g: base.g * 0.7 + hueShift.g * 0.3,
      b: base.b * 0.7 + hueShift.b * 0.3
    };
  }

  public updateSpectrum(spectrum: number[]): void {
    let lowSum = 0;
    for (let i = LOW_BAND_START; i < LOW_BAND_END; i++) {
      lowSum += spectrum[i] || 0;
    }
    this.lowEnergyTarget = lowSum / (LOW_BAND_END - LOW_BAND_START);

    let midSum = 0;
    for (let i = MID_BAND_START; i < MID_BAND_END; i++) {
      midSum += spectrum[i] || 0;
    }
    this.midEnergyTarget = midSum / (MID_BAND_END - MID_BAND_START);

    let highSum = 0;
    for (let i = HIGH_BAND_START; i < HIGH_BAND_END; i++) {
      highSum += spectrum[i] || 0;
    }
    this.highEnergyTarget = highSum / (HIGH_BAND_END - HIGH_BAND_START);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const data = this.particleData[i];

      const particleLow = this.lowEnergyTarget * (0.7 + data.hue * 0.3);
      const scaleFactor = 1 + particleLow * 1.0;
      this.targetSizes[i] = data.baseSize * scaleFactor;

      const particleMid = (this.midEnergyTarget + data.hue * 0.2) % 1;
      const color = this.bandGradientColor(particleMid, data.hue);
      this.targetColors[i3] = color.r;
      this.targetColors[i3 + 1] = color.g;
      this.targetColors[i3 + 2] = color.b;

      const particleHigh = this.highEnergyTarget * (0.6 + (1 - data.hue) * 0.4);
      this.targetOffsets[i] = particleHigh * 3;
    }
  }

  public triggerRotationBoost(): void {
    this.boostEndTime = performance.now() + 3000;
  }

  public resetParticles(): void {
    this.generateInitialPositions();
    this.targetSizes.set(this.sizes);
    this.targetColors.set(this.colors);
    this.targetOffsets.fill(0);
    this.lowEnergy = 0;
    this.midEnergy = 0;
    this.highEnergy = 0;
  }

  public animate(deltaTime: number): void {
    const currentBoost = performance.now() < this.boostEndTime ? 1.5 : 1;
    this.boostRotation += (currentBoost - this.boostRotation) * 0.05;

    this.lowEnergy += (this.lowEnergyTarget - this.lowEnergy) * LERP_SPEED;
    this.midEnergy += (this.midEnergyTarget - this.midEnergy) * LERP_SPEED;
    this.highEnergy += (this.highEnergyTarget - this.highEnergy) * LERP_SPEED;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const data = this.particleData[i];

      data.theta += data.rotationSpeed * this.boostRotation * deltaTime * 60;

      const radialOffset = this.targetOffsets[i] * this.highEnergy;
      const r = data.radius + radialOffset;

      const x = r * Math.sin(data.phi) * Math.cos(data.theta);
      const y = r * Math.sin(data.phi) * Math.sin(data.theta);
      const z = r * Math.cos(data.phi);

      this.positions[i3] += (x - this.positions[i3]) * LERP_SPEED;
      this.positions[i3 + 1] += (y - this.positions[i3 + 1]) * LERP_SPEED;
      this.positions[i3 + 2] += (z - this.positions[i3 + 2]) * LERP_SPEED;

      this.sizes[i] += (this.targetSizes[i] - this.sizes[i]) * LERP_SPEED;

      this.colors[i3] += (this.targetColors[i3] - this.colors[i3]) * LERP_SPEED;
      this.colors[i3 + 1] += (this.targetColors[i3 + 1] - this.colors[i3 + 1]) * LERP_SPEED;
      this.colors[i3 + 2] += (this.targetColors[i3 + 2] - this.colors[i3 + 2]) * LERP_SPEED;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;

    (this.material as THREE.ShaderMaterial).uniforms.globalOpacity.value = 0.6 + this.highEnergy * 0.2;

    const centerScale = 1 + this.lowEnergy * 0.3;
    this.centerSphere.scale.set(centerScale, centerScale, centerScale);
    this.centerSphere.rotation.y += deltaTime * 0.5;
  }

  public dispose(): void {
    this.geometry.dispose();
    const shaderMat = this.material as THREE.ShaderMaterial;
    if (shaderMat.uniforms.pointTexture?.value instanceof THREE.Texture) {
      shaderMat.uniforms.pointTexture.value.dispose();
    }
    this.material.dispose();
    this.centerSphere.geometry.dispose();
    (this.centerSphere.material as THREE.Material).dispose();
    this.centerSphere.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
