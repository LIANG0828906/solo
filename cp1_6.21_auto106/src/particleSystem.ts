import * as THREE from 'three';

interface ColorTheme {
  name: string;
  colors: string[];
}

class ParticleSystem {
  public points: THREE.Points;
  public lines: THREE.LineSegments;

  private particleCount: number;
  private speedMultiplier: number;
  private themeColors: THREE.Color[];
  private targetThemeColors: THREE.Color[];
  private colorTransitionProgress: number = 1;

  private positions: Float32Array;
  private velocities: Float32Array;
  private sizes: Float32Array;
  private colors: Float32Array;
  private phases: Float32Array;
  private noiseOffsets: Float32Array;

  private linePositions: Float32Array;
  private lineColors: Float32Array;

  private pointsGeometry: THREE.BufferGeometry;
  private linesGeometry: THREE.BufferGeometry;

  private readonly SPHERE_RADIUS = 10;
  private readonly LINK_DISTANCE = 3;
  private readonly MAX_LINKS = 8000;

  constructor(count: number, theme: ColorTheme) {
    this.particleCount = count;
    this.speedMultiplier = 1.0;
    this.themeColors = theme.colors.map((c) => new THREE.Color(c));
    this.targetThemeColors = this.themeColors.slice();

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.colors = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.noiseOffsets = new Float32Array(count * 3);

    this.linePositions = new Float32Array(this.MAX_LINKS * 2 * 3);
    this.lineColors = new Float32Array(this.MAX_LINKS * 2 * 3);

    this.initParticleData();

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.pointsGeometry, pointsMaterial);

    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.lines = new THREE.LineSegments(this.linesGeometry, linesMaterial);
    this.lines.visible = true;
  }

  private initParticleData(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 1 / 3) * this.SPHERE_RADIUS * 0.8;

      this.positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = r * Math.cos(phi);

      const speed = 0.008 + Math.random() * 0.012;
      this.velocities[i3] = (this.positions[i3] / this.SPHERE_RADIUS) * speed;
      this.velocities[i3 + 1] = (this.positions[i3 + 1] / this.SPHERE_RADIUS) * speed;
      this.velocities[i3 + 2] = (this.positions[i3 + 2] / this.SPHERE_RADIUS) * speed;

      this.sizes[i] = 1 + Math.random() * 3;

      this.phases[i] = Math.random() * Math.PI * 2;
      this.noiseOffsets[i3] = Math.random() * 100;
      this.noiseOffsets[i3 + 1] = Math.random() * 100;
      this.noiseOffsets[i3 + 2] = Math.random() * 100;

      this.updateParticleColor(i, 0);
    }
  }

  private simpleNoise3D(x: number, y: number, z: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  private updateParticleColor(i: number, time: number): void {
    const i3 = i * 3;
    const posX = this.positions[i3];
    const posY = this.positions[i3 + 1];
    const posZ = this.positions[i3 + 2];

    const dist = Math.sqrt(posX * posX + posY * posY + posZ * posZ);
    const normalizedDist = Math.min(dist / this.SPHERE_RADIUS, 1);
    const timeOffset = time * 0.15 + this.phases[i];

    let t = (normalizedDist * 0.6 + Math.sin(timeOffset) * 0.2 + 0.2);
    t = t - Math.floor(t);

    const colors = this.themeColors;
    const numColors = colors.length;
    const scaledT = t * (numColors - 1);
    const colorIndex = Math.min(Math.floor(scaledT), numColors - 2);
    const localT = scaledT - colorIndex;

    const c1 = colors[colorIndex];
    const c2 = colors[colorIndex + 1];

    this.colors[i3] = c1.r + (c2.r - c1.r) * localT;
    this.colors[i3 + 1] = c1.g + (c2.g - c1.g) * localT;
    this.colors[i3 + 2] = c1.b + (c2.b - c1.b) * localT;
  }

  public setParticleCount(count: number): void {
    if (count === this.particleCount) return;

    this.particleCount = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.sizes = new Float32Array(count);
    this.colors = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.noiseOffsets = new Float32Array(count * 3);

    this.initParticleData();

    this.pointsGeometry.dispose();
    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.pointsGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.points.geometry = this.pointsGeometry;
  }

  public setSpeed(multiplier: number): void {
    this.speedMultiplier = multiplier;
  }

  public setColorTheme(theme: ColorTheme): void {
    this.targetThemeColors = theme.colors.map((c) => new THREE.Color(c));
    this.colorTransitionProgress = 0;
  }

  private interpolateThemeColors(delta: number): void {
    if (this.colorTransitionProgress >= 1) return;

    const transitionSpeed = delta / 1.5;
    this.colorTransitionProgress = Math.min(this.colorTransitionProgress + transitionSpeed, 1);
    const t = this.easeInOutCubic(this.colorTransitionProgress);

    for (let i = 0; i < this.themeColors.length; i++) {
      this.themeColors[i].lerpColors(
        this.themeColors[i],
        this.targetThemeColors[i],
        t
      );
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public update(time: number, delta: number): void {
    this.interpolateThemeColors(delta);
    const effectiveDelta = delta * this.speedMultiplier;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const noiseX = this.simpleNoise3D(
        this.noiseOffsets[i3] + time * 0.3,
        this.positions[i3 + 1] * 0.2,
        this.positions[i3 + 2] * 0.2
      );
      const noiseY = this.simpleNoise3D(
        this.positions[i3] * 0.2,
        this.noiseOffsets[i3 + 1] + time * 0.3,
        this.positions[i3 + 2] * 0.2
      );
      const noiseZ = this.simpleNoise3D(
        this.positions[i3] * 0.2,
        this.positions[i3 + 1] * 0.2,
        this.noiseOffsets[i3 + 2] + time * 0.3
      );

      const phase = this.phases[i] + time * 0.8;
      const sinForce = 0.015;

      this.velocities[i3] += Math.sin(phase + this.positions[i3 + 1] * 0.5) * sinForce * effectiveDelta;
      this.velocities[i3 + 1] += Math.cos(phase + this.positions[i3 + 2] * 0.5) * sinForce * effectiveDelta;
      this.velocities[i3 + 2] += Math.sin(phase * 0.7 + this.positions[i3] * 0.5) * sinForce * effectiveDelta;

      const noiseForce = 0.03;
      this.velocities[i3] += noiseX * noiseForce * effectiveDelta;
      this.velocities[i3 + 1] += noiseY * noiseForce * effectiveDelta;
      this.velocities[i3 + 2] += noiseZ * noiseForce * effectiveDelta;

      const px = this.positions[i3];
      const py = this.positions[i3 + 1];
      const pz = this.positions[i3 + 2];
      const distFromCenter = Math.sqrt(px * px + py * py + pz * pz);

      if (distFromCenter > this.SPHERE_RADIUS * 1.5) {
        const pullForce = 0.002;
        this.velocities[i3] -= (px / distFromCenter) * pullForce * effectiveDelta * 60;
        this.velocities[i3 + 1] -= (py / distFromCenter) * pullForce * effectiveDelta * 60;
        this.velocities[i3 + 2] -= (pz / distFromCenter) * pullForce * effectiveDelta * 60;
      }

      const damping = 0.995;
      this.velocities[i3] *= damping;
      this.velocities[i3 + 1] *= damping;
      this.velocities[i3 + 2] *= damping;

      this.positions[i3] += this.velocities[i3] * effectiveDelta * 60;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * effectiveDelta * 60;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * effectiveDelta * 60;

      this.updateParticleColor(i, time);
    }

    (this.pointsGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.pointsGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    this.updateLines();
  }

  private updateLines(): void {
    let lineIndex = 0;
    const maxLinePairs = this.MAX_LINKS;
    const sampleStep = Math.max(1, Math.floor(this.particleCount / 400));
    const linkDistSq = this.LINK_DISTANCE * this.LINK_DISTANCE;

    for (let i = 0; i < this.particleCount && lineIndex < maxLinePairs; i += sampleStep) {
      const i3 = i * 3;
      const px = this.positions[i3];
      const py = this.positions[i3 + 1];
      const pz = this.positions[i3 + 2];

      for (let j = i + sampleStep; j < this.particleCount && lineIndex < maxLinePairs; j += sampleStep) {
        const j3 = j * 3;
        const dx = px - this.positions[j3];
        const dy = py - this.positions[j3 + 1];
        const dz = pz - this.positions[j3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < linkDistSq) {
          const li6 = lineIndex * 6;
          const li3 = lineIndex * 3;

          this.linePositions[li6] = px;
          this.linePositions[li6 + 1] = py;
          this.linePositions[li6 + 2] = pz;
          this.linePositions[li6 + 3] = this.positions[j3];
          this.linePositions[li6 + 4] = this.positions[j3 + 1];
          this.linePositions[li6 + 5] = this.positions[j3 + 2];

          const alpha = 0.2 + (1 - distSq / linkDistSq) * 0.4;

          const r = (this.colors[i3] + this.colors[j3]) * 0.5 * alpha;
          const g = (this.colors[i3 + 1] + this.colors[j3 + 1]) * 0.5 * alpha;
          const b = (this.colors[i3 + 2] + this.colors[j3 + 2]) * 0.5 * alpha;

          this.lineColors[li6] = r;
          this.lineColors[li6 + 1] = g;
          this.lineColors[li6 + 2] = b;
          this.lineColors[li6 + 3] = r;
          this.lineColors[li6 + 4] = g;
          this.lineColors[li6 + 5] = b;

          lineIndex++;
        }
      }
    }

    for (let k = lineIndex * 6; k < this.linePositions.length; k++) {
      this.linePositions[k] = 0;
      this.lineColors[k] = 0;
    }

    (this.linesGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.linesGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    this.linesGeometry.setDrawRange(0, lineIndex * 2);
  }

  public dispose(): void {
    this.pointsGeometry.dispose();
    this.linesGeometry.dispose();
    (this.points.material as THREE.Material).dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

export { ParticleSystem };
export type { ColorTheme };
