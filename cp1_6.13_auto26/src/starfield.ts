import * as THREE from 'three';

export class Starfield {
  private stars: THREE.Points;
  private twinkleCount: number = 100;
  private twinkleIndices: Int32Array;
  private twinkleSpeeds: Float32Array;
  private twinklePhases: Float32Array;
  private baseBrightness: Float32Array;

  constructor(scene: THREE.Scene, count: number = 800) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.baseBrightness = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const i3 = i * 3;
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      const colorVariation = Math.random() * 0.2;
      this.baseBrightness[i] = brightness;

      colors[i3] = brightness * (0.8 + colorVariation);
      colors[i3 + 1] = brightness * (0.85 + colorVariation);
      colors[i3 + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.stars = new THREE.Points(geometry, material);
    scene.add(this.stars);

    this.twinkleCount = Math.min(100, Math.floor(count * 0.1));
    this.twinkleIndices = new Int32Array(this.twinkleCount);
    this.twinkleSpeeds = new Float32Array(this.twinkleCount);
    this.twinklePhases = new Float32Array(this.twinkleCount);

    for (let i = 0; i < this.twinkleCount; i++) {
      this.twinkleIndices[i] = Math.floor(Math.random() * count);
      this.twinkleSpeeds[i] = 0.5 + Math.random() * 1.5;
      this.twinklePhases[i] = Math.random() * Math.PI * 2;
    }
  }

  public update(time: number): void {
    const colors = this.stars.geometry.attributes.color as THREE.BufferAttribute;
    const colorArr = colors.array as Float32Array;
    const baseBrightness = this.baseBrightness;

    for (let i = 0; i < this.twinkleCount; i++) {
      const idx = this.twinkleIndices[i];
      const twinkle = 0.75 + Math.sin(time * this.twinkleSpeeds[i] + this.twinklePhases[i]) * 0.25;
      const idx3 = idx * 3;
      const base = baseBrightness[idx];

      colorArr[idx3] = base * 0.85 * twinkle;
      colorArr[idx3 + 1] = base * 0.9 * twinkle;
      colorArr[idx3 + 2] = base * twinkle;
    }

    colors.needsUpdate = true;

    this.stars.rotation.y += 0.00003;
  }

  public dispose(): void {
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();
  }
}
