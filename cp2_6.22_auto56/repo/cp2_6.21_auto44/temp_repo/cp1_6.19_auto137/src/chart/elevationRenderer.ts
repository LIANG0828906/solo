import * as THREE from 'three';

const WORLD_SIZE = 100;

function noiseToColor(db: number): [number, number, number] {
  if (db < 30) return [0, 1, 0];
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
  return [r, g, 0];
}

function noiseToHeight(db: number): number {
  if (db < 30) return 0;
  const clamped = Math.min(Math.max(db, 30), 100);
  return ((clamped - 30) / 70) * 50;
}

export class ElevationRenderer {
  private mesh: THREE.InstancedMesh;
  private colorAttr: THREE.InstancedBufferAttribute;
  private heightAttr: THREE.InstancedBufferAttribute;
  private material: THREE.ShaderMaterial;
  private gridSize: number;
  private count: number;
  private animType: 'grow' | 'shrink' | null = null;
  private animStart = 0;
  private animDuration = 0;
  private animResolve: (() => void) | null = null;
  private targetHeights: Float32Array;

  constructor(scene: THREE.Scene, gridSize: number) {
    this.gridSize = gridSize;
    this.count = gridSize * gridSize;

    const geo = new THREE.CylinderGeometry(0.75, 0.75, 1, 8);
    geo.translate(0, 0.5, 0);

    this.material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3 aColor;
        attribute float aHeight;
        varying vec3 vColor;
        varying float vH;
        uniform float uHeightScale;
        void main() {
          vColor = aColor;
          vH = aHeight;
          vec3 pos = position;
          pos.y *= aHeight * uHeightScale;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vH;
        void main() {
          float shade = 0.65 + 0.35 * min(vH / 50.0, 1.0);
          gl_FragColor = vec4(vColor * shade, 0.88);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uHeightScale: { value: 0 },
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
          0,
          (j + 0.5) * cellSize,
        );
        dummy.updateMatrix();
        this.mesh.setMatrixAt(idx, dummy.matrix);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    const colors = new Float32Array(this.count * 3);
    const heights = new Float32Array(this.count);
    this.targetHeights = new Float32Array(this.count);
    this.colorAttr = new THREE.InstancedBufferAttribute(colors, 3);
    this.heightAttr = new THREE.InstancedBufferAttribute(heights, 1);
    this.mesh.geometry.setAttribute('aColor', this.colorAttr);
    this.mesh.geometry.setAttribute('aHeight', this.heightAttr);

    scene.add(this.mesh);
  }

  update(matrix: number[][]): void {
    const colors = this.colorAttr.array as Float32Array;
    const heights = this.heightAttr.array as Float32Array;

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const idx = i * this.gridSize + j;
        const db = matrix[i][j];
        const [r, g, b] = noiseToColor(db);
        colors[idx * 3] = r;
        colors[idx * 3 + 1] = g;
        colors[idx * 3 + 2] = b;
        const h = noiseToHeight(db);
        heights[idx] = h;
        this.targetHeights[idx] = h;
      }
    }

    this.colorAttr.needsUpdate = true;
    this.heightAttr.needsUpdate = true;
  }

  setVisible(v: boolean): void {
    this.mesh.visible = v;
  }

  growFromGround(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.animType = 'grow';
      this.animStart = performance.now();
      this.animDuration = duration;
      this.animResolve = resolve;
      this.material.uniforms.uHeightScale.value = 0;
    });
  }

  shrinkToGround(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.animType = 'shrink';
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

    if (this.animType === 'grow') {
      this.material.uniforms.uHeightScale.value = eased;
    } else if (this.animType === 'shrink') {
      this.material.uniforms.uHeightScale.value = 1 - eased;
    }

    if (t >= 1) {
      const resolve = this.animResolve;
      this.animType = null;
      this.animResolve = null;
      if (resolve) resolve();
    }
  }
}
