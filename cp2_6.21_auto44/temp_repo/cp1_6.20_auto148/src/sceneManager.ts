import * as THREE from 'three';

const WALL_WIDTH = 10;
const WALL_HEIGHT = 10;
const DISPLACEMENT_SCALE = 0.025;

interface LineVertexInfo {
  i: number;
  j: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private wallGroup: THREE.Group;
  private surfaceMesh: THREE.Mesh | null = null;
  private gridLines: THREE.LineSegments | null = null;
  private windArrow: THREE.ArrowHelper | null = null;
  private legendEl: HTMLDivElement | null = null;

  private nodeCountX: number = 0;
  private nodeCountY: number = 0;

  private basePositions: Float32Array | null = null;
  private previousDisplacements: Float32Array | null = null;
  private targetDisplacements: Float32Array | null = null;
  private targetStresses: Float32Array | null = null;

  private lineVertexInfos: LineVertexInfo[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.wallGroup = new THREE.Group();
    this.scene.add(this.wallGroup);
  }

  createWallMesh(type: string): void {
    while (this.wallGroup.children.length > 0) {
      const child = this.wallGroup.children[0];
      this.wallGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: THREE.Material) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
    this.surfaceMesh = null;
    this.gridLines = null;
    this.windArrow = null;

    switch (type) {
      case 'point-supported': this.nodeCountX = 20; this.nodeCountY = 20; break;
      case 'frame-supported': this.nodeCountX = 30; this.nodeCountY = 30; break;
      case 'unit-type': this.nodeCountX = 10; this.nodeCountY = 10; break;
      default: this.nodeCountX = 20; this.nodeCountY = 20; break;
    }

    const totalNodes = this.nodeCountX * this.nodeCountY;
    this.previousDisplacements = new Float32Array(totalNodes);
    this.targetDisplacements = new Float32Array(totalNodes);
    this.targetStresses = new Float32Array(totalNodes);

    this.createSurface();
    this.createGridLinesMesh();
    this.createLegend();

    this.windArrow = null;
  }

  private createSurface(): void {
    const nx = this.nodeCountX;
    const ny = this.nodeCountY;
    const positions: number[] = [];
    const colors: number[] = [];

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const x = (i / (nx - 1)) * WALL_WIDTH - WALL_WIDTH / 2;
        const y = (j / (ny - 1)) * WALL_HEIGHT - WALL_HEIGHT / 2;
        positions.push(x, y, 0);
        colors.push(0.2, 0.667, 1.0);
      }
    }

    const indices: number[] = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i;
        const b = a + 1;
        const c = a + nx;
        const d = c + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    this.basePositions = new Float32Array(positions);

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnit: 1,
    });

    this.surfaceMesh = new THREE.Mesh(geometry, material);
    this.wallGroup.add(this.surfaceMesh);
  }

  private createGridLinesMesh(): void {
    const nx = this.nodeCountX;
    const ny = this.nodeCountY;
    this.lineVertexInfos = [];
    const positions: number[] = [];

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const x1 = (i / (nx - 1)) * WALL_WIDTH - WALL_WIDTH / 2;
        const y1 = (j / (ny - 1)) * WALL_HEIGHT - WALL_HEIGHT / 2;
        const x2 = ((i + 1) / (nx - 1)) * WALL_WIDTH - WALL_WIDTH / 2;
        positions.push(x1, y1, 0, x2, y1, 0);
        this.lineVertexInfos.push({ i, j }, { i: i + 1, j });
      }
    }

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny - 1; j++) {
        const x1 = (i / (nx - 1)) * WALL_WIDTH - WALL_WIDTH / 2;
        const y1 = (j / (ny - 1)) * WALL_HEIGHT - WALL_HEIGHT / 2;
        const y2 = ((j + 1) / (ny - 1)) * WALL_HEIGHT - WALL_HEIGHT / 2;
        positions.push(x1, y1, 0, x1, y2, 0);
        this.lineVertexInfos.push({ i, j }, { i, j: j + 1 });
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x8888aa,
      transparent: true,
      opacity: 0.55,
    });

    this.gridLines = new THREE.LineSegments(geometry, material);
    this.wallGroup.add(this.gridLines);
  }

  updateWindArrow(direction: number, pressure: number): void {
    if (this.windArrow) {
      this.wallGroup.remove(this.windArrow);
      this.windArrow.dispose();
      this.windArrow = null;
    }

    if (pressure <= 0) return;

    const dir = new THREE.Vector3(
      Math.cos((direction * Math.PI) / 180),
      Math.sin((direction * Math.PI) / 180),
      0
    ).normalize();

    const length = Math.max(0.8, pressure * 0.6);
    const headLength = length * 0.3;
    const headWidth = length * 0.15;

    this.windArrow = new THREE.ArrowHelper(
      dir,
      new THREE.Vector3(0, -WALL_HEIGHT / 2 - 1.5, 0),
      length,
      0x4fc3f7,
      headLength,
      headWidth
    );
    this.wallGroup.add(this.windArrow);
  }

  setAnimationTargets(displacements: Float32Array, stresses: Float32Array): void {
    if (this.previousDisplacements && this.targetDisplacements &&
        this.previousDisplacements.length === displacements.length) {
      const currentT = this.targetDisplacements;
      this.previousDisplacements = new Float32Array(currentT.length);
      for (let i = 0; i < currentT.length; i++) {
        this.previousDisplacements[i] = currentT[i];
      }
    } else {
      this.previousDisplacements = new Float32Array(displacements.length);
    }

    this.targetDisplacements = new Float32Array(displacements);
    this.targetStresses = new Float32Array(stresses);

    this.updateStressColors(stresses);
  }

  private updateStressColors(stresses: Float32Array): void {
    if (!this.surfaceMesh) return;
    const geometry = this.surfaceMesh.geometry as THREE.BufferGeometry;
    const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
    const colorArray = colorAttr.array as Float32Array;

    for (let idx = 0; idx < stresses.length; idx++) {
      const [r, g, b] = this.stressToColor(stresses[idx]);
      colorArray[idx * 3] = r;
      colorArray[idx * 3 + 1] = g;
      colorArray[idx * 3 + 2] = b;
    }

    colorAttr.needsUpdate = true;
  }

  private stressToColor(s: number): [number, number, number] {
    s = Math.max(0, Math.min(1, s));
    if (s < 0.5) {
      const t = s * 2;
      return [
        0.2 + t * 0.8,
        0.667,
        1.0 - t * 1.0,
      ];
    } else {
      const t = (s - 0.5) * 2;
      return [
        1.0,
        0.667 - t * 0.467,
        t * 0.2,
      ];
    }
  }

  interpolateDeformation(t: number): void {
    if (!this.targetDisplacements || !this.previousDisplacements || !this.surfaceMesh) return;

    const geometry = this.surfaceMesh.geometry as THREE.BufferGeometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    const nx = this.nodeCountX;
    const ny = this.nodeCountY;

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const idx = j * nx + i;
        const prev = this.previousDisplacements[idx];
        const target = this.targetDisplacements[idx];
        const current = prev + (target - prev) * t;

        posArray[idx * 3 + 2] = current * DISPLACEMENT_SCALE;
      }
    }
    posAttr.needsUpdate = true;

    this.updateLinePositionsFromDisplacement(posArray as unknown as Float32Array);
  }

  private updateLinePositionsFromDisplacement(meshPositions: Float32Array): void {
    if (!this.gridLines) return;
    const linePosAttr = this.gridLines.geometry.attributes.position as THREE.BufferAttribute;
    const linePosArray = linePosAttr.array as Float32Array;

    const nx = this.nodeCountX;
    const ny = this.nodeCountY;

    for (let v = 0; v < this.lineVertexInfos.length; v++) {
      const { i, j } = this.lineVertexInfos[v];
      const meshIdx = j * nx + i;
      linePosArray[v * 3] = meshPositions[meshIdx * 3];
      linePosArray[v * 3 + 1] = meshPositions[meshIdx * 3 + 1];
      linePosArray[v * 3 + 2] = meshPositions[meshIdx * 3 + 2];
    }
    linePosAttr.needsUpdate = true;
  }

  private createLegend(): void {
    if (this.legendEl) {
      this.legendEl.remove();
    }

    const container = document.getElementById('canvas-container');
    if (!container) return;

    const legend = document.createElement('div');
    legend.style.cssText = `
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: rgba(26, 26, 46, 0.8);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-radius: 10px;
      padding: 14px 16px;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      z-index: 50;
      border: 1px solid rgba(255, 255, 255, 0.08);
    `;

    const title = document.createElement('div');
    title.textContent = '应力分布';
    title.style.cssText = 'margin-bottom: 10px; font-size: 13px; color: #81d4fa; font-weight: 500;';
    legend.appendChild(title);

    const barContainer = document.createElement('div');
    barContainer.style.cssText = 'display: flex; align-items: stretch; gap: 8px;';

    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 18px;
      height: 140px;
      border-radius: 4px;
      background: linear-gradient(to top, #33AAFF, #FFAA00, #FF3333);
    `;
    barContainer.appendChild(bar);

    const labels = document.createElement('div');
    labels.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; height: 140px;';

    const highLabel = document.createElement('span');
    highLabel.textContent = '高';
    highLabel.style.color = '#FF5555';
    labels.appendChild(highLabel);

    const midLabel = document.createElement('span');
    midLabel.textContent = '中';
    midLabel.style.color = '#FFAA00';
    labels.appendChild(midLabel);

    const lowLabel = document.createElement('span');
    lowLabel.textContent = '低';
    lowLabel.style.color = '#33AAFF';
    labels.appendChild(lowLabel);

    barContainer.appendChild(labels);
    legend.appendChild(barContainer);
    container.appendChild(legend);

    this.legendEl = legend;
  }
}
