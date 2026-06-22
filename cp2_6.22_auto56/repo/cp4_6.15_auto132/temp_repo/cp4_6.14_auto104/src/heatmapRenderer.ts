import * as THREE from 'three';
import { TimeSlice, createColorScale } from './dataProcessor';

export class HeatmapRenderer {
  public points: THREE.Points;
  public geometry: THREE.BufferGeometry;
  public material: THREE.ShaderMaterial;
  private maxParticles: number;
  private currentCount: number;
  private colorFn: (value: number) => [number, number, number];
  private minSize: number = 2;
  private maxSize: number = 12;
  private threshold: number = 200;

  constructor(maxParticles: number = 100000) {
    this.maxParticles = maxParticles;
    this.currentCount = 0;
    this.colorFn = createColorScale(this.threshold);

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    (this.geometry.getAttribute('position') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (this.geometry.getAttribute('size') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);

    this.material = this.createShaderMaterial();
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  private createShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: window.devicePixelRatio || 1 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = 0.0;
          float core = 0.4;
          float glow = 0.5;
          if (dist < core) {
            alpha = 1.0;
          } else if (dist < core + glow) {
            float t = (dist - core) / glow;
            alpha = 1.0 - smoothstep(0.0, 1.0, t);
            alpha *= 0.6;
          } else {
            discard;
          }
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
  }

  public updateFromSlice(slice: TimeSlice): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute;

    const positions = posAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;
    const sizes = sizeAttr.array as Float32Array;

    const count = Math.min(slice.values.length, this.maxParticles);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = slice.positions[i * 3];
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = slice.positions[i * 3 + 2];

      const val = slice.values[i];
      const [r, g, b] = this.colorFn(val);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      const norm = Math.min(val / this.threshold, 1);
      sizes[i] = this.minSize + (this.maxSize - this.minSize) * norm;
    }

    for (let i = count; i < this.currentCount; i++) {
      sizes[i] = 0;
    }

    this.currentCount = count;
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, Math.max(count, this.currentCount));
  }

  public setThreshold(threshold: number): void {
    this.threshold = threshold;
    this.colorFn = createColorScale(threshold);
  }

  public getThreshold(): number {
    return this.threshold;
  }

  public setPixelRatio(ratio: number): void {
    this.material.uniforms.pixelRatio.value = ratio;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
