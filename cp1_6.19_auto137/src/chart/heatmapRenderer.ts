import * as THREE from 'three';

const WORLD_SIZE = 100;

function noiseToColor(db: number): [number, number, number, number] {
  if (db < 30) return [0, 1, 0, 0];
  const clamped = Math.min(Math.max(db, 30), 100);
  const t = (clamped - 30) / 70;
  let r: number, g: number;
  if (t < 0.5) {
    const s = t * 2;
    r = s;
    g = 1;
  } else {
    const s = (t - 0.5) * 2;
    r = 1;
    g = 1 - s;
  }
  const a = 0.3 + t * 0.6;
  return [r, g, 0, a];
}

export class HeatmapRenderer {
  private mesh: THREE.InstancedMesh;
  private colorAttr: THREE.InstancedBufferAttribute;
  private opacityAttr: THREE.InstancedBufferAttribute;
  private material: THREE.ShaderMaterial;
  private gridSize: number;
  private count: number;
  private animType: 'fadeIn' | 'fadeOut' | null = null;
  private animStart = 0;
  private animDuration = 0;
  private animResolve: (() => void) | null = null;

  constructor(scene: THREE.Scene, gridSize: number) {
    this.gridSize = gridSize;
    this.count = gridSize * gridSize;

    const geo = new THREE.PlaneGeometry(2, 2, 1, 1);
    geo.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 aColor;
        attribute float aOpacity;
        varying vec3 vColor;
        varying float vOpacity;
        varying vec2 vUv;
        void main() {
          vColor = aColor;
          vOpacity = aOpacity;
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        varying vec2 vUv;
        uniform float uOpacityMultiplier;
        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          float edge = 1.0 - smoothstep(0.5, 1.0, dist);
          gl_FragColor = vec4(vColor, vOpacity * edge * uOpacityMultiplier);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uOpacityMultiplier: { value: 1.0 },
      },
    });

    this.mesh = new THREE.InstancedMesh(geo, this.material, this.count);
    this.mesh.frustumCulled = false;

    const dummy = new THREE.Object3D();
    const cellSize = WORLD_SIZE / gridSize;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const idx = i * gridSize + j;
        dummy.position.set(
          (i + 0.5) * cellSize,
          0.15,
          (j + 0.5) * cellSize,
        );
        dummy.updateMatrix();
        this.mesh.setMatrixAt(idx, dummy.matrix);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    const colors = new Float32Array(this.count * 3);
    const opacities = new Float32Array(this.count);
    this.colorAttr = new THREE.InstancedBufferAttribute(colors, 3);
    this.opacityAttr = new THREE.InstancedBufferAttribute(opacities, 1);
    this.mesh.geometry.setAttribute('aColor', this.colorAttr);
    this.mesh.geometry.setAttribute('aOpacity', this.opacityAttr);

    scene.add(this.mesh);
  }

  update(matrix: number[][]): void {
    const colors = this.colorAttr.array as Float32Array;
    const opacities = this.opacityAttr.array as Float32Array;

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const idx = i * this.gridSize + j;
        const db = matrix[i][j];
        const [r, g, b, a] = noiseToColor(db);
        colors[idx * 3] = r;
        colors[idx * 3 + 1] = g;
        colors[idx * 3 + 2] = b;
        opacities[idx] = a;
      }
    }

    this.colorAttr.needsUpdate = true;
    this.opacityAttr.needsUpdate = true;
  }

  setVisible(v: boolean): void {
    this.mesh.visible = v;
  }

  fadeIn(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.animType = 'fadeIn';
      this.animStart = performance.now();
      this.animDuration = duration;
      this.animResolve = resolve;
      this.material.uniforms.uOpacityMultiplier.value = 0;
    });
  }

  fadeOut(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.animType = 'fadeOut';
      this.animStart = performance.now();
      this.animDuration = duration;
      this.animResolve = resolve;
    });
  }

  tick(): void {
    if (!this.animType) return;

    const elapsed = performance.now() - this.animStart;
    const t = Math.min(elapsed / this.animDuration, 1);
    const eased = t * t * (3 - 2 * t);

    if (this.animType === 'fadeIn') {
      this.material.uniforms.uOpacityMultiplier.value = eased;
    } else if (this.animType === 'fadeOut') {
      this.material.uniforms.uOpacityMultiplier.value = 1 - eased;
    }

    if (t >= 1) {
      const resolve = this.animResolve;
      this.animType = null;
      this.animResolve = null;
      if (resolve) resolve();
    }
  }
}
