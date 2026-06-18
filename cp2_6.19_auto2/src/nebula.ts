import * as THREE from 'three';

export type ColorTheme = 'default' | 'neon' | 'aurora';

interface ThemeColors {
  center: THREE.Color;
  edge: THREE.Color;
}

const THEMES: Record<ColorTheme, ThemeColors> = {
  default: {
    center: new THREE.Color(0xffd700),
    edge: new THREE.Color(0x8a2be2)
  },
  neon: {
    center: new THREE.Color(0x00ffff),
    edge: new THREE.Color(0xff00ff)
  },
  aurora: {
    center: new THREE.Color(0x00ff88),
    edge: new THREE.Color(0x0066ff)
  }
};

export class Nebula {
  public particleCount: number;
  public geometry: THREE.BufferGeometry;
  public material: THREE.PointsMaterial;
  public points: THREE.Points;
  public rotationSpeed: number;

  private positions: Float32Array;
  private originalPositions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private radialDistances: Float32Array;
  private currentTheme: ColorTheme;
  private previousTheme: ColorTheme;
  private themeTransitionProgress: number;
  private mouseAttraction: THREE.Vector3;
  private isMouseOver: boolean;
  private attractionProgress: number;
  private elapsedTime: number;

  constructor(count: number = 7500) {
    this.particleCount = count;
    this.rotationSpeed = 1.0;
    this.currentTheme = 'default';
    this.previousTheme = 'default';
    this.themeTransitionProgress = 1.0;
    this.isMouseOver = false;
    this.mouseAttraction = new THREE.Vector3();
    this.attractionProgress = 0;
    this.elapsedTime = 0;

    this.positions = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.radialDistances = new Float32Array(this.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geometry, this.material);

    this.generateParticles();
    this.updateGeometry();
  }

  private generateParticles(): void {
    const maxRadius = 150;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const armOffset = (i % 3) * ((Math.PI * 2) / 3);
      const radius = Math.pow(Math.random(), 0.7) * maxRadius;
      const angle = armOffset + (radius / maxRadius) * Math.PI * 4 + (Math.random() - 0.5) * 0.5;
      const height = (Math.random() - 0.5) * 30 * (1 - radius / maxRadius);

      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 8;
      const y = height + (Math.random() - 0.5) * 5;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 8;

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.originalPositions[i3] = x;
      this.originalPositions[i3 + 1] = y;
      this.originalPositions[i3 + 2] = z;

      this.radialDistances[i] = radius / maxRadius;

      const speed = 0.1 + Math.random() * 0.2;
      const tangentAngle = angle + Math.PI / 2;
      this.velocities[i3] = Math.cos(tangentAngle) * speed * (1 - radius / maxRadius * 0.5);
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = Math.sin(tangentAngle) * speed * (1 - radius / maxRadius * 0.5);
    }

    this.updateColors();
  }

  private lerpColor(
    prev: ThemeColors,
    curr: ThemeColors,
    t: number,
    radial: number
  ): { r: number; g: number; b: number } {
    const prevR = prev.center.r + (prev.edge.r - prev.center.r) * radial;
    const prevG = prev.center.g + (prev.edge.g - prev.center.g) * radial;
    const prevB = prev.center.b + (prev.edge.b - prev.center.b) * radial;

    const currR = curr.center.r + (curr.edge.r - curr.center.r) * radial;
    const currG = curr.center.g + (curr.edge.g - curr.center.g) * radial;
    const currB = curr.center.b + (curr.edge.b - curr.center.b) * radial;

    const easeT = this.easeOutCubic(t);

    return {
      r: prevR + (currR - prevR) * easeT,
      g: prevG + (currG - prevG) * easeT,
      b: prevB + (currB - prevB) * easeT
    };
  }

  private updateColors(): void {
    const prevColors = THEMES[this.previousTheme];
    const currColors = THEMES[this.currentTheme];
    const pulse = (Math.sin(this.elapsedTime * (Math.PI * 2) / 3) + 1) * 0.5;
    const intensity = 0.85 + pulse * 0.15;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const t = this.radialDistances[i];

      const { r, g, b } = this.lerpColor(
        prevColors,
        currColors,
        this.themeTransitionProgress,
        t
      );

      const finalR = Math.min(1, r * intensity);
      const finalG = Math.min(1, g * intensity);
      const finalB = Math.min(1, b * intensity);

      this.colors[i3] = finalR;
      this.colors[i3 + 1] = finalG;
      this.colors[i3 + 2] = finalB;
    }
  }

  private updateGeometry(): void {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public setMousePosition(worldPos: THREE.Vector3, isOver: boolean): void {
    this.mouseAttraction.copy(worldPos);
    this.isMouseOver = isOver;
  }

  public setParticleCount(count: number): void {
    if (count === this.particleCount) return;

    this.particleCount = count;
    this.positions = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.radialDistances = new Float32Array(this.particleCount);

    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry();
    this.generateParticles();
    this.updateGeometry();
    this.points.geometry = this.geometry;
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  public setColorTheme(theme: ColorTheme): void {
    if (theme === this.currentTheme) return;

    this.previousTheme = this.currentTheme;
    this.currentTheme = theme;
    this.themeTransitionProgress = 0;
  }

  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    if (this.themeTransitionProgress < 1.0) {
      this.themeTransitionProgress = Math.min(
        1.0,
        this.themeTransitionProgress + deltaTime / 0.3
      );
    }

    const attractSpeed = 1 / 0.6;
    if (this.isMouseOver) {
      this.attractionProgress = Math.min(1, this.attractionProgress + deltaTime * attractSpeed);
    } else {
      this.attractionProgress = Math.max(0, this.attractionProgress - deltaTime * attractSpeed);
    }

    const easedProgress = this.easeOutCubic(this.attractionProgress);
    const attractionStrength = 0.4;
    const attractionRadius = 60;
    const rotationAngle = deltaTime * 0.15 * this.rotationSpeed;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const ox = this.originalPositions[i3];
      const oy = this.originalPositions[i3 + 1];
      const oz = this.originalPositions[i3 + 2];

      const cos = Math.cos(rotationAngle);
      const sin = Math.sin(rotationAngle);
      const rotatedX = ox * cos - oz * sin;
      const rotatedZ = ox * sin + oz * cos;

      const vx = this.velocities[i3];
      const vy = this.velocities[i3 + 1];
      const vz = this.velocities[i3 + 2];

      let baseX = rotatedX + vx;
      let baseY = oy + vy;
      let baseZ = rotatedZ + vz;

      let px = baseX;
      let py = baseY;
      let pz = baseZ;

      if (easedProgress > 0.001) {
        const dx = this.mouseAttraction.x - baseX;
        const dy = this.mouseAttraction.y - baseY;
        const dz = this.mouseAttraction.z - baseZ;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < attractionRadius && dist > 0.1) {
          const falloff = 1 - dist / attractionRadius;
          const force = attractionStrength * falloff * easedProgress;
          px = baseX + (dx / dist) * force * dist * 0.3;
          py = baseY + (dy / dist) * force * dist * 0.3;
          pz = baseZ + (dz / dist) * force * dist * 0.3;
        }
      }

      this.positions[i3] = px;
      this.positions[i3 + 1] = py;
      this.positions[i3 + 2] = pz;

      this.originalPositions[i3] = baseX;
      this.originalPositions[i3 + 1] = baseY;
      this.originalPositions[i3 + 2] = baseZ;
    }

    this.geometry.attributes.position.needsUpdate = true;

    this.updateColors();
    this.geometry.attributes.color.needsUpdate = true;

    this.points.rotation.y += deltaTime * 0.05 * this.rotationSpeed;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
