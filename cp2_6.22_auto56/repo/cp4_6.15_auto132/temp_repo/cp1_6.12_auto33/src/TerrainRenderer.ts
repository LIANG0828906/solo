import * as THREE from 'three';

export interface TerrainStats {
  rows: number;
  cols: number;
  min: number;
  max: number;
  avg: number;
}

export class TerrainRenderer {
  private scene: THREE.Scene;
  private mesh: THREE.Mesh | null = null;
  private baseHeights: Float32Array | null = null;
  private targetHeights: Float32Array | null = null;
  private animationProgress: number = 1;
  private animationDuration: number = 2000;
  private animationStart: number = 0;
  private stats: TerrainStats | null = null;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(2048, 2048);
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.scene.add(this.directionalLight);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  getStats(): TerrainStats | null {
    return this.stats;
  }

  updateTerrain(data: number[][], stats: TerrainStats): void {
    this.stats = stats;
    const rows = stats.rows;
    const cols = stats.cols;

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh = null;
    }

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const alphas: number[] = [];
    const indices: number[] = [];
    const heights: number[] = [];

    const width = 100;
    const height = 100;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x = (j / (cols - 1) - 0.5) * width;
        const z = (i / (rows - 1) - 0.5) * height;
        vertices.push(x, 0, z);
        heights.push(data[i][j]);
        const color = this.getColorForHeight(data[i][j], stats.min, stats.max);
        colors.push(color.r, color.g, color.b);
        const edgeDist = Math.min(i, j, rows - 1 - i, cols - 1 - j);
        const fadeWidth = Math.min(rows, cols) * 0.1;
        const alpha = edgeDist < fadeWidth ? 0.3 + 0.7 * (edgeDist / fadeWidth) : 1.0;
        alphas.push(alpha);
      }
    }

    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        const a = i * cols + j;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      roughness: 0.8,
      metalness: 0.1
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        attribute float alpha;
        varying float vAlpha;
        `
      ).replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vAlpha = alpha;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vAlpha;
        `
      ).replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `
        vec4 diffuseColor = vec4( diffuse, opacity * vAlpha );
        `
      );
    };

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.targetHeights = new Float32Array(heights);
    this.baseHeights = new Float32Array(heights.length).fill(0);
    this.animationStart = performance.now();
    this.animationProgress = 0;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  update(deltaTime: number): void {
    if (this.animationProgress >= 1 || !this.mesh || !this.baseHeights || !this.targetHeights) {
      return;
    }

    const elapsed = performance.now() - this.animationStart;
    this.animationProgress = Math.min(1, elapsed / this.animationDuration);
    const t = this.easeInOutCubic(this.animationProgress);

    const positionAttr = this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < this.baseHeights.length; i++) {
      positions[i * 3 + 1] = this.baseHeights[i] + (this.targetHeights[i] - this.baseHeights[i]) * t;
    }

    positionAttr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  private getColorForHeight(height: number, min: number, max: number): THREE.Color {
    const range = max - min || 1;
    const t = (height - min) / range;

    if (t < 0.2) {
      return this.lerpColor(new THREE.Color(0x0d3b0d), new THREE.Color(0x1a5f1a), t / 0.2);
    } else if (t < 0.5) {
      return this.lerpColor(new THREE.Color(0x1a5f1a), new THREE.Color(0x8b7355), (t - 0.2) / 0.3);
    } else if (t < 0.8) {
      return this.lerpColor(new THREE.Color(0x8b7355), new THREE.Color(0xaaaaaa), (t - 0.5) / 0.3);
    } else {
      return this.lerpColor(new THREE.Color(0xaaaaaa), new THREE.Color(0xffffff), (t - 0.8) / 0.2);
    }
  }

  private lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
    const color = new THREE.Color();
    color.r = a.r + (b.r - a.r) * t;
    color.g = a.g + (b.g - a.g) * t;
    color.b = a.b + (b.b - a.b) * t;
    return color;
  }
}
