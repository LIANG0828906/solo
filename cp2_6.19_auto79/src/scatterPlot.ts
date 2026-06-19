import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scaleLinear } from 'd3-scale';
import type {
  CellData,
  NumericFeature,
  AxisMapping,
  VisualConfig,
  SelectionStats,
  ScatterPlotCallbacks
} from './types';

const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hslToRgb(h: number, s: number, l: number): THREE.Color {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
  return new THREE.Color(r + m, g + m, b + m);
}

function interpolateHSL(
  t: number,
  low: { h: number; s: number; l: number },
  mid: { h: number; s: number; l: number },
  high: { h: number; s: number; l: number }
): THREE.Color {
  let h: number, s: number, l: number;
  if (t < 0.5) {
    const localT = t * 2;
    h = low.h + (mid.h - low.h) * localT;
    s = low.s + (mid.s - low.s) * localT;
    l = low.l + (mid.l - low.l) * localT;
  } else {
    const localT = (t - 0.5) * 2;
    h = mid.h + (high.h - mid.h) * localT;
    s = mid.s + (high.s - mid.s) * localT;
    l = mid.l + (high.l - mid.l) * localT;
  }
  return hslToRgb(h, s / 100, l / 100);
}

export class ScatterPlot {
  private container: HTMLElement;
  private data: CellData[];
  private callbacks: ScatterPlotCallbacks;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private points!: THREE.Points;
  private boxSelectionElement!: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private axisMapping: AxisMapping = {
    x: 'diameter',
    y: 'fluorescence',
    z: 'viability'
  };

  private visualConfig: VisualConfig = {
    sizeRange: [2, 8],
    colorRange: {
      low: { h: 240, s: 80, l: 50 },
      mid: { h: 280, s: 80, l: 50 },
      high: { h: 0, s: 80, l: 50 }
    },
    animationDuration: {
      position: 500,
      color: 300
    }
  };

  private positionScales!: Record<NumericFeature, (v: number) => number>;
  private sizeScale!: (v: number) => number;
  private colorScale!: (v: number) => THREE.Color;

  private basePositions!: Float32Array;
  private targetPositions!: Float32Array;
  private baseSizes!: Float32Array;
  private targetSizes!: Float32Array;
  private baseColors!: Float32Array;
  private targetColors!: Float32Array;

  private hoveredIndex: number = -1;
  private clickedIndex: number = -1;
  private selectedIndices: Set<number> = new Set();
  private isBoxSelecting: boolean = false;
  private boxSelectStart: THREE.Vector2 = new THREE.Vector2();
  private boxSelectEnd: THREE.Vector2 = new THREE.Vector2();

  private positionAnimation: { active: boolean; startTime: number; duration: number } = {
    active: false,
    startTime: 0,
    duration: 500
  };
  private colorAnimation: { active: boolean; startTime: number; duration: number } = {
    active: false,
    startTime: 0,
    duration: 300
  };

  private animationFrameId: number = 0;
  private lastMouseMove: number = 0;
  private bounds!: { min: THREE.Vector3; max: THREE.Vector3 };

  constructor(
    container: HTMLElement,
    data: CellData[],
    callbacks: ScatterPlotCallbacks
  ) {
    this.container = container;
    this.data = data;
    this.callbacks = callbacks;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(50, 50, 50);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 50;

    this.initScales();
    this.createGridHelper();
    this.createParticles();
    this.createBoxSelectionMesh();
    this.setupEventListeners();
    this.autoFitCamera();
    this.animate();
  }

  private initScales(): void {
    const features: NumericFeature[] = ['diameter', 'fluorescence', 'viability'];
    this.positionScales = {} as Record<NumericFeature, (v: number) => number>;

    features.forEach((feature) => {
      const values = this.data.map((d) => d[feature]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const padding = (max - min) * 0.1;
      this.positionScales[feature] = scaleLinear()
        .domain([min - padding, max + padding])
        .range([-30, 30]);
    });

    this.sizeScale = scaleLinear()
      .domain([0, 100])
      .range(this.visualConfig.sizeRange);

    this.colorScale = (t: number) =>
      interpolateHSL(
        t,
        this.visualConfig.colorRange.low,
        this.visualConfig.colorRange.mid,
        this.visualConfig.colorRange.high
      );
  }

  private createGridHelper(): void {
    const gridHelper = new THREE.GridHelper(80, 20, 0x444444, 0x2a2a4a);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(40);
    (axesHelper.material as THREE.LineBasicMaterial).transparent = true;
    (axesHelper.material as THREE.LineBasicMaterial).opacity = 0.5;
    this.scene.add(axesHelper);
  }

  private createParticles(): void {
    const count = this.data.length;
    const geometry = new THREE.BufferGeometry();

    this.basePositions = new Float32Array(count * 3);
    this.targetPositions = new Float32Array(count * 3);
    this.baseSizes = new Float32Array(count);
    this.targetSizes = new Float32Array(count);
    this.baseColors = new Float32Array(count * 3);
    this.targetColors = new Float32Array(count * 3);

    this.bounds = {
      min: new THREE.Vector3(Infinity, Infinity, Infinity),
      max: new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    };

    for (let i = 0; i < count; i++) {
      const cell = this.data[i];
      const x = this.positionScales[this.axisMapping.x](cell[this.axisMapping.x]);
      const y = this.positionScales[this.axisMapping.y](cell[this.axisMapping.y]);
      const z = this.positionScales[this.axisMapping.z](cell[this.axisMapping.z]);

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;
      this.targetPositions[i * 3] = x;
      this.targetPositions[i * 3 + 1] = y;
      this.targetPositions[i * 3 + 2] = z;

      this.bounds.min.min(new THREE.Vector3(x, y, z));
      this.bounds.max.max(new THREE.Vector3(x, y, z));

      const zValue = cell[this.axisMapping.z];
      const zMin = this.data.reduce((m, d) => Math.min(m, d[this.axisMapping.z]), Infinity);
      const zMax = this.data.reduce((m, d) => Math.max(m, d[this.axisMapping.z]), -Infinity);
      const normalizedZ = (zValue - zMin) / (zMax - zMin);

      const size = this.sizeScale(zValue / 10);
      this.baseSizes[i] = size;
      this.targetSizes[i] = size;

      const color = this.colorScale(normalizedZ);
      this.baseColors[i * 3] = color.r;
      this.baseColors[i * 3 + 1] = color.g;
      this.baseColors[i * 3 + 2] = color.b;
      this.targetColors[i * 3] = color.r;
      this.targetColors[i * 3 + 1] = color.g;
      this.targetColors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.basePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.baseColors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.baseSizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        opacity: { value: 0.9 }
      }
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  private createBoxSelectionMesh(): void {
    this.boxSelectionElement = document.createElement('div');
    this.boxSelectionElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      background: rgba(0, 255, 128, 0.15);
      border: 2px solid rgba(0, 255, 128, 0.7);
      pointer-events: none;
      z-index: 10;
      display: none;
    `;
    this.container.appendChild(this.boxSelectionElement);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    const now = performance.now();
    if (now - this.lastMouseMove < 16) return;
    this.lastMouseMove = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isBoxSelecting) {
      this.boxSelectEnd.set(event.clientX, event.clientY);
      this.updateBoxSelectionMesh();
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.points);

    if (intersects.length > 0) {
      const index = intersects[0].index!;
      if (index !== this.hoveredIndex) {
        this.updateHover(this.hoveredIndex, index);
        this.hoveredIndex = index;
        this.callbacks.onCellHover(this.data[index]);
      }
    } else if (this.hoveredIndex !== -1) {
      this.updateHover(this.hoveredIndex, -1);
      this.hoveredIndex = -1;
      this.callbacks.onCellHover(null);
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.shiftKey) {
      this.isBoxSelecting = true;
      this.controls.enabled = false;
      this.boxSelectStart.set(event.clientX, event.clientY);
      this.boxSelectEnd.set(event.clientX, event.clientY);
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (this.isBoxSelecting) {
      this.isBoxSelecting = false;
      this.controls.enabled = true;
      this.boxSelectionElement.style.display = 'none';
      this.performBoxSelection();
    }
  }

  private onClick(event: MouseEvent): void {
    if (this.isBoxSelecting) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.points);

    if (intersects.length > 0) {
      const index = intersects[0].index!;
      if (this.clickedIndex !== -1 && this.clickedIndex !== index) {
        this.updateClickHighlight(this.clickedIndex, false);
      }
      this.clickedIndex = index;
      this.updateClickHighlight(index, true);
      this.callbacks.onCellClick(this.data[index]);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.clearSelection();
    }
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updateHover(oldIndex: number, newIndex: number): void {
    const positions = this.points.geometry.attributes.position.array as Float32Array;
    const colors = this.points.geometry.attributes.color.array as Float32Array;
    const sizes = this.points.geometry.attributes.size.array as Float32Array;

    if (oldIndex !== -1) {
      colors[oldIndex * 3] = this.targetColors[oldIndex * 3];
      colors[oldIndex * 3 + 1] = this.targetColors[oldIndex * 3 + 1];
      colors[oldIndex * 3 + 2] = this.targetColors[oldIndex * 3 + 2];
      sizes[oldIndex] = this.targetSizes[oldIndex];
    }

    if (newIndex !== -1) {
      colors[newIndex * 3] = 1.0;
      colors[newIndex * 3 + 1] = 1.0;
      colors[newIndex * 3 + 2] = 0.0;
      sizes[newIndex] = this.targetSizes[newIndex] * 1.5;
    }

    this.points.geometry.attributes.color.needsUpdate = true;
    this.points.geometry.attributes.size.needsUpdate = true;
  }

  private updateClickHighlight(index: number, isClicked: boolean): void {
    const colors = this.points.geometry.attributes.color.array as Float32Array;
    if (isClicked) {
      colors[index * 3] = 1.0;
      colors[index * 3 + 1] = 0.843;
      colors[index * 3 + 2] = 0.0;
    } else if (index === this.hoveredIndex) {
      colors[index * 3] = 1.0;
      colors[index * 3 + 1] = 1.0;
      colors[index * 3 + 2] = 0.0;
    } else {
      colors[index * 3] = this.targetColors[index * 3];
      colors[index * 3 + 1] = this.targetColors[index * 3 + 1];
      colors[index * 3 + 2] = this.targetColors[index * 3 + 2];
    }
    this.points.geometry.attributes.color.needsUpdate = true;
  }

  private updateBoxSelectionMesh(): void {
    const containerRect = this.container.getBoundingClientRect();
    const startX = this.boxSelectStart.x - containerRect.left;
    const startY = this.boxSelectStart.y - containerRect.top;
    const endX = this.boxSelectEnd.x - containerRect.left;
    const endY = this.boxSelectEnd.y - containerRect.top;

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    this.boxSelectionElement.style.left = `${left}px`;
    this.boxSelectionElement.style.top = `${top}px`;
    this.boxSelectionElement.style.width = `${width}px`;
    this.boxSelectionElement.style.height = `${height}px`;
    this.boxSelectionElement.style.display = 'block';
  }

  private performBoxSelection(): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const startNdc = new THREE.Vector2(
      ((this.boxSelectStart.x - rect.left) / rect.width) * 2 - 1,
      -((this.boxSelectStart.y - rect.top) / rect.height) * 2 + 1
    );
    const endNdc = new THREE.Vector2(
      ((this.boxSelectEnd.x - rect.left) / rect.width) * 2 - 1,
      -((this.boxSelectEnd.y - rect.top) / rect.height) * 2 + 1
    );

    const minX = Math.min(startNdc.x, endNdc.x);
    const maxX = Math.max(startNdc.x, endNdc.x);
    const minY = Math.min(startNdc.y, endNdc.y);
    const maxY = Math.max(startNdc.y, endNdc.y);

    if (Math.abs(maxX - minX) < 0.01 && Math.abs(maxY - minY) < 0.01) {
      return;
    }

    this.selectedIndices.clear();
    const positions = this.points.geometry.attributes.position.array as Float32Array;
    const colors = this.points.geometry.attributes.color.array as Float32Array;
    const material = this.points.material as THREE.PointsMaterial;

    for (let i = 0; i < this.data.length; i++) {
      const worldPos = new THREE.Vector3(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      const screenPos = worldPos.clone().project(this.camera);

      if (
        screenPos.x >= minX &&
        screenPos.x <= maxX &&
        screenPos.y >= minY &&
        screenPos.y <= maxY &&
        screenPos.z >= -1 &&
        screenPos.z <= 1
      ) {
        this.selectedIndices.add(i);
        colors[i * 3] = 0.0;
        colors[i * 3  + 1] = 1.0;
        colors[i * 3 + 2] = 0.5;
      } else {
        material.opacity = 0.2;
        colors[i * 3] = this.targetColors[i * 3];
        colors[i * 3 + 1] = this.targetColors[i * 3 + 1];
        colors[i * 3 + 2] = this.targetColors[i * 3 + 2];
      }
    }

    this.points.geometry.attributes.color.needsUpdate = true;
    this.updateSelectionStats();
  }

  private updateSelectionStats(): void {
    if (this.selectedIndices.size === 0) {
      const material = this.points.material as THREE.PointsMaterial;
      material.opacity = 0.9;
      this.callbacks.onSelectionChange(null);
      return;
    }

    const selectedCells = Array.from(this.selectedIndices).map((i) => this.data[i]);
    const count = selectedCells.length;
    const avgDiameter = selectedCells.reduce((sum, c) => sum + c.diameter, 0) / count;
    const avgFluorescence = selectedCells.reduce((sum, c) => sum + c.fluorescence, 0) / count;
    const avgViability = selectedCells.reduce((sum, c) => sum + c.viability, 0) / count;

    this.callbacks.onSelectionChange({
      count,
      avgDiameter,
      avgFluorescence,
      avgViability,
      selectedCells
    });
  }

  public clearSelection(): void {
    this.selectedIndices.clear();
    const colors = this.points.geometry.attributes.color.array as Float32Array;
    const material = this.points.material as THREE.PointsMaterial;
    material.opacity = 0.9;

    for (let i = 0; i < this.data.length; i++) {
      colors[i * 3] = this.targetColors[i * 3];
      colors[i * 3 + 1] = this.targetColors[i * 3 + 1];
      colors[i * 3 + 2] = this.targetColors[i * 3 + 2];
    }

    if (this.hoveredIndex !== -1) {
      this.updateHover(-1, this.hoveredIndex);
    }
    if (this.clickedIndex !== -1) {
      this.updateClickHighlight(this.clickedIndex, true);
    }

    this.points.geometry.attributes.color.needsUpdate = true;
    this.callbacks.onSelectionChange(null);
  }

  public updateMapping(mapping: Partial<AxisMapping>): void {
    const prevMapping = { ...this.axisMapping };
    this.axisMapping = { ...this.axisMapping, ...mapping };

    const zMin = this.data.reduce((m, d) => Math.min(m, d[this.axisMapping.z]), Infinity);
    const zMax = this.data.reduce((m, d) => Math.max(m, d[this.axisMapping.z]), -Infinity);

    for (let i = 0; i < this.data.length; i++) {
      const cell = this.data[i];

      this.targetPositions[i * 3] = this.positionScales[this.axisMapping.x](cell[this.axisMapping.x]);
      this.targetPositions[i * 3 + 1] = this.positionScales[this.axisMapping.y](cell[this.axisMapping.y]);
      this.targetPositions[i * 3 + 2] = this.positionScales[this.axisMapping.z](cell[this.axisMapping.z]);

      const zValue = cell[this.axisMapping.z];
      const normalizedZ = (zValue - zMin) / (zMax - zMin);
      this.targetSizes[i] = this.sizeScale(zValue / 10);
      const color = this.colorScale(normalizedZ);
      this.targetColors[i * 3] = color.r;
      this.targetColors[i * 3 + 1] = color.g;
      this.targetColors[i * 3 + 2] = color.b;
    }

    const positions = this.points.geometry.attributes.position.array as Float32Array;
    const colors = this.points.geometry.attributes.color.array as Float32Array;
    const sizes = this.points.geometry.attributes.size.array as Float32Array;

    for (let i = 0; i < this.data.length; i++) {
      this.basePositions[i * 3] = positions[i * 3];
      this.basePositions[i * 3 + 1] = positions[i * 3 + 1];
      this.basePositions[i * 3 + 2] = positions[i * 3 + 2];
      this.baseColors[i * 3] = colors[i * 3];
      this.baseColors[i * 3 + 1] = colors[i * 3 + 1];
      this.baseColors[i * 3 + 2] = colors[i * 3 + 2];
      this.baseSizes[i] = sizes[i];
    }

    this.positionAnimation.active = true;
    this.positionAnimation.startTime = performance.now();
    this.positionAnimation.duration = this.visualConfig.animationDuration.position;

    this.colorAnimation.active = true;
    this.colorAnimation.startTime = performance.now();
    this.colorAnimation.duration = this.visualConfig.animationDuration.color;

    this.bounds = {
      min: new THREE.Vector3(
        Math.min(...Array.from({ length: this.data.length }, (_, i) => this.targetPositions[i * 3])),
        Math.min(...Array.from({ length: this.data.length }, (_, i) => this.targetPositions[i * 3 + 1])),
        Math.min(...Array.from({ length: this.data.length }, (_, i) => this.targetPositions[i * 3 + 2]))
      ),
      max: new THREE.Vector3(
        Math.max(...Array.from({ length: this.data.length }, (_, i) => this.targetPositions[i * 3])),
        Math.max(...Array.from({ length: this.data.length }, (_, i) => this.targetPositions[i * 3 + 1])),
        Math.max(...Array.from({ length: this.data.length }, (_, i) => this.targetPositions[i * 3 + 2]))
      )
    };

    setTimeout(() => this.autoFitCamera(), 600);
  }

  private autoFitCamera(): void {
    const center = new THREE.Vector3()
      .addVectors(this.bounds.min, this.bounds.max)
      .multiplyScalar(0.5);
    const size = new THREE.Vector3()
      .subVectors(this.bounds.max, this.bounds.min);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

    this.camera.position.set(
      center.x + distance,
      center.y + distance,
      center.z + distance
    );
    this.controls.target.copy(center);
    this.controls.update();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();

    if (this.positionAnimation.active) {
      const elapsed = now - this.positionAnimation.startTime;
      const progress = Math.min(elapsed / this.positionAnimation.duration, 1);
      const easedProgress = easeInOutCubic(progress);

      const positions = this.points.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.data.length; i++) {
        positions[i * 3] = this.basePositions[i * 3] + (this.targetPositions[i * 3] - this.basePositions[i * 3]) * easedProgress;
        positions[i * 3 + 1] = this.basePositions[i * 3 + 1] + (this.targetPositions[i * 3 + 1] - this.basePositions[i * 3 + 1]) * easedProgress;
        positions[i * 3 + 2] = this.basePositions[i * 3 + 2] + (this.targetPositions[i * 3 + 2] - this.basePositions[i * 3 + 2]) * easedProgress;
      }
      this.points.geometry.attributes.position.needsUpdate = true;

      if (progress >= 1) {
        this.positionAnimation.active = false;
      }
    }

    if (this.colorAnimation.active) {
      const elapsed = now - this.colorAnimation.startTime;
      const progress = Math.min(elapsed / this.colorAnimation.duration, 1);
      const easedProgress = easeInOutCubic(progress);

      const colors = this.points.geometry.attributes.color.array as Float32Array;
      const sizes = this.points.geometry.attributes.size.array as Float32Array;

      for (let i = 0; i < this.data.length; i++) {
        if (i === this.hoveredIndex || i === this.clickedIndex || this.selectedIndices.has(i)) continue;

        colors[i * 3] = this.baseColors[i * 3] + (this.targetColors[i * 3] - this.baseColors[i * 3]) * easedProgress;
        colors[i * 3 + 1] = this.baseColors[i * 3 + 1] + (this.targetColors[i * 3 + 1] - this.baseColors[i * 3 + 1]) * easedProgress;
        colors[i * 3 + 2] = this.baseColors[i * 3 + 2] + (this.targetColors[i * 3 + 2] - this.baseColors[i * 3 + 2]) * easedProgress;
        sizes[i] = this.baseSizes[i] + (this.targetSizes[i] - this.baseSizes[i]) * easedProgress;
      }
      this.points.geometry.attributes.color.needsUpdate = true;
      this.points.geometry.attributes.size.needsUpdate = true;

      if (progress >= 1) {
        this.colorAnimation.active = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
