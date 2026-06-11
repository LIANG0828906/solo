import * as THREE from 'three';

export interface NebulaParams {
  density: number;
  rotationSpeed: number;
  colorOffset: number;
}

export class NebulaSystem {
  public group: THREE.Group;
  private nebulaPoints: THREE.Points;
  private backgroundStars: THREE.Points;
  private particleCount: number = 30000;
  private backgroundStarCount: number = 200;
  private nebulaRadius: number = 200;
  private backgroundRadius: number = 800;

  private baseSizes: Float32Array;
  private flickerPhases: Float32Array;
  private flickerFrequencies: Float32Array;
  private particleDistances: Float32Array;

  private colorInner: THREE.Color = new THREE.Color('#FF6B6B');
  private colorMid: THREE.Color = new THREE.Color('#4ECDC4');
  private colorOuter: THREE.Color = new THREE.Color('#845EC2');

  private params: NebulaParams = {
    density: 1.0,
    rotationSpeed: 0.01,
    colorOffset: 0
  };

  constructor() {
    this.group = new THREE.Group();

    this.baseSizes = new Float32Array(this.particleCount);
    this.flickerPhases = new Float32Array(this.particleCount);
    this.flickerFrequencies = new Float32Array(this.particleCount);
    this.particleDistances = new Float32Array(this.particleCount);

    this.nebulaPoints = this.createNebulaParticles();
    this.backgroundStars = this.createBackgroundStars();

    this.group.add(this.nebulaPoints);
    this.group.add(this.backgroundStars);
  }

  private createNebulaParticles(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.nebulaRadius * Math.pow(Math.random(), 0.5);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const distance = r / this.nebulaRadius;
      this.particleDistances[i] = distance;

      const color = this.getGradientColor(distance, 0);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      const size = 0.5 + Math.random() * 1.5;
      this.baseSizes[i] = size;
      sizes[i] = size;

      this.flickerPhases[i] = Math.random() * Math.PI * 2;
      this.flickerFrequencies[i] = 0.5 + Math.random() * 2.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    return points;
  }

  private createBackgroundStars(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.backgroundStarCount * 3);
    const colors = new Float32Array(this.backgroundStarCount * 3);
    const sizes = new Float32Array(this.backgroundStarCount);

    for (let i = 0; i < this.backgroundStarCount; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.backgroundRadius;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      colors[i3] = 1.0;
      colors[i3 + 1] = 1.0;
      colors[i3 + 2] = 1.0;

      sizes[i] = 0.1 + Math.random() * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    return points;
  }

  private getGradientColor(distance: number, offset: number): THREE.Color {
    let t = distance + offset;
    t = Math.max(0, Math.min(1, t));

    const color = new THREE.Color();
    if (t < 0.5) {
      const localT = t * 2;
      color.lerpColors(this.colorInner, this.colorMid, localT);
    } else {
      const localT = (t - 0.5) * 2;
      color.lerpColors(this.colorMid, this.colorOuter, localT);
    }

    return color;
  }

  public updateParams(params: Partial<NebulaParams>): void {
    if (params.density !== undefined) {
      this.params.density = params.density;
    }
    if (params.rotationSpeed !== undefined) {
      this.params.rotationSpeed = params.rotationSpeed;
    }
    if (params.colorOffset !== undefined) {
      this.params.colorOffset = params.colorOffset;
      this.updateColors();
    }
  }

  private updateColors(): void {
    const colors = this.nebulaPoints.geometry.getAttribute('color') as THREE.BufferAttribute;
    const colorArray = colors.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const distance = this.particleDistances[i];
      const color = this.getGradientColor(distance, this.params.colorOffset);
      colorArray[i3] = color.r;
      colorArray[i3 + 1] = color.g;
      colorArray[i3 + 2] = color.b;
    }

    colors.needsUpdate = true;
  }

  public animate(time: number): void {
    this.nebulaPoints.rotation.y += this.params.rotationSpeed;

    const sizes = this.nebulaPoints.geometry.getAttribute('size') as THREE.BufferAttribute;
    const sizeArray = sizes.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      const flicker = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(time * this.flickerFrequencies[i] + this.flickerPhases[i]));
      sizeArray[i] = this.baseSizes[i] * this.params.density * flicker;
    }

    sizes.needsUpdate = true;
  }
}
