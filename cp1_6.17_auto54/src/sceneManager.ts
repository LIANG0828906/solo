import * as THREE from 'three';
import type { ChargeSystem, Charge } from './chargeSystem';
import { computeElectricField, computePotential, traceFieldLine } from './fieldCalculator';
import type { Vector3 } from './fieldCalculator';

interface ChargeVisual {
  group: THREE.Group;
  sphere: THREE.Mesh;
  glow: THREE.Mesh;
  particles: THREE.Points;
  particleData: { angle: number; speed: number; offset: number }[];
}

interface PerformanceConfig {
  particleCount: number;
  fieldLinesPerCharge: number;
}

const HIGH_PERF: PerformanceConfig = { particleCount: 30, fieldLinesPerCharge: 12 };
const LOW_PERF: PerformanceConfig = { particleCount: 10, fieldLinesPerCharge: 6 };

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private chargeSystem: ChargeSystem;

  private chargeVisuals: Map<string, ChargeVisual> = new Map();
  private fieldLinesGroup: THREE.Group;
  private equipotentialGroup: THREE.Group;
  private gridHelper: THREE.GridHelper;

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private cameraDistance = 150;
  private cameraTheta = 0;
  private cameraPhi = Math.PI / 4;
  private targetTheta = 0;
  private targetPhi = Math.PI / 4;
  private targetDistance = 150;

  private showFieldLines = true;
  private showEquipotential = true;
  private fieldLinesOpacity = 1;
  private equipotentialOpacity = 0.3;
  private targetFieldLinesOpacity = 1;
  private targetEquipotentialOpacity = 0.3;

  private performanceConfig: PerformanceConfig = { ...HIGH_PERF };
  private lastFpsUpdate = 0;
  private frameCount = 0;
  private fps = 60;
  private performanceDegraded = false;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private addMode = false;
  private addChargeType: 'positive' | 'negative' = 'positive';

  private animationId: number | null = null;
  private clock: THREE.Clock;

  private onChargeAddedCallback: ((position: { x: number; y: number; z: number }, type: 'positive' | 'negative') => void) | null = null;

  constructor(container: HTMLElement, chargeSystem: ChargeSystem) {
    this.container = container;
    this.chargeSystem = chargeSystem;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0B1024);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.gridHelper = new THREE.GridHelper(200, 40, 0x445566, 0x445566);
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.3;
    (this.gridHelper.material as THREE.LineBasicMaterial).linewidth = 1;
    this.scene.add(this.gridHelper);

    const axesHelper = new THREE.AxesHelper(50);
    axesHelper.material.transparent = true;
    axesHelper.material.opacity = 0.5;
    this.scene.add(axesHelper);

    this.fieldLinesGroup = new THREE.Group();
    this.scene.add(this.fieldLinesGroup);

    this.equipotentialGroup = new THREE.Group();
    this.scene.add(this.equipotentialGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 500);
    pointLight.position.set(100, 100, 100);
    this.scene.add(pointLight);

    this.updateCameraPosition();

    this.setupEventListeners();

    this.chargeSystem.subscribe(() => this.onChargesChanged());
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.targetTheta -= deltaX * 0.01;
    this.targetPhi += deltaY * 0.01;

    this.targetPhi = Math.max(Math.PI / 4 - Math.PI / 4, Math.min(Math.PI / 4 + Math.PI / 4, this.targetPhi));

    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomSpeed = 0.1;
    this.targetDistance += event.deltaY * zoomSpeed;
    this.targetDistance = Math.max(30, Math.min(500, this.targetDistance));
  }

  private onClick(event: MouseEvent): void {
    if (!this.addMode) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
      this.addMode = false;
      this.renderer.domElement.style.cursor = 'grab';
      if (this.onChargeAddedCallback) {
        this.onChargeAddedCallback(
          { x: intersectPoint.x, y: intersectPoint.y, z: intersectPoint.z },
          this.addChargeType
        );
      }
    }
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  setOnChargeAdded(callback: (position: { x: number; y: number; z: number }, type: 'positive' | 'negative') => void): void {
    this.onChargeAddedCallback = callback;
  }

  startAddMode(type: 'positive' | 'negative'): void {
    this.addMode = true;
    this.addChargeType = type;
    this.renderer.domElement.style.cursor = 'crosshair';
  }

  cancelAddMode(): void {
    this.addMode = false;
    this.renderer.domElement.style.cursor = 'grab';
  }

  toggleFieldLines(show: boolean): void {
    this.showFieldLines = show;
    this.targetFieldLinesOpacity = show ? 1 : 0;
  }

  toggleEquipotential(show: boolean): void {
    this.showEquipotential = show;
    this.targetEquipotentialOpacity = show ? 0.3 : 0;
  }

  private onChargesChanged(): void {
    this.rebuildChargeVisuals();
    this.rebuildFieldLines();
    this.rebuildEquipotential();
  }

  private rebuildChargeVisuals(): void {
    const charges = this.chargeSystem.getAllCharges();
    const existingIds = new Set(this.chargeVisuals.keys());
    const currentIds = new Set(charges.map(c => c.id));

    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        const visual = this.chargeVisuals.get(id);
        if (visual) {
          this.scene.remove(visual.group);
          visual.group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
            if (obj instanceof THREE.Points) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
        }
        this.chargeVisuals.delete(id);
      }
    }

    for (const charge of charges) {
      if (!this.chargeVisuals.has(charge.id)) {
        const visual = this.createChargeVisual(charge);
        this.chargeVisuals.set(charge.id, visual);
        this.scene.add(visual.group);
      } else {
        const visual = this.chargeVisuals.get(charge.id);
        if (visual) {
          visual.group.position.set(charge.position.x, charge.position.y, charge.position.z);
        }
      }
    }
  }

  private createChargeVisual(charge: Charge): ChargeVisual {
    const group = new THREE.Group();
    group.position.set(charge.position.x, charge.position.y, charge.position.z);

    const isPositive = charge.charge >= 0;
    const mainColor = isPositive ? 0xFF5252 : 0x448AFF;
    const glowColor = isPositive ? 0xFF8A80 : 0x82B1FF;

    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.8,
      emissive: mainColor,
      emissiveIntensity: 0.3,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    const particleCount = this.performanceConfig.particleCount;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleData: { angle: number; speed: number; offset: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const offset = (Math.random() - 0.5) * 6;
      const speed = 0.5 + Math.random() * 0.5;

      particleData.push({ angle, speed, offset });

      const radius = 6 + Math.random() * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = offset;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: glowColor,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    return { group, sphere, glow, particles, particleData };
  }

  private rebuildFieldLines(): void {
    while (this.fieldLinesGroup.children.length > 0) {
      const child = this.fieldLinesGroup.children[0];
      this.fieldLinesGroup.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const charges = this.chargeSystem.getAllCharges();
    if (charges.length === 0) return;

    const positiveCharges = charges.filter(c => c.charge > 0);
    const negativeCharges = charges.filter(c => c.charge < 0);

    const linesPerCharge = this.performanceConfig.fieldLinesPerCharge;

    for (const charge of positiveCharges) {
      const numLines = Math.max(4, Math.round(linesPerCharge * Math.abs(charge.charge)));
      this.createFieldLinesFromCharge(charge, numLines, 1);
    }

    if (positiveCharges.length === 0 && negativeCharges.length > 0) {
      for (const charge of negativeCharges) {
        const numLines = Math.max(4, Math.round(linesPerCharge * Math.abs(charge.charge)));
        this.createFieldLinesFromCharge(charge, numLines, -1);
      }
    }
  }

  private createFieldLinesFromCharge(charge: Charge, numLines: number, direction: 1 | -1): void {
    for (let i = 0; i < numLines; i++) {
      const phi = Math.acos(2 * (i / numLines) - 1);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const startRadius = 6;
      const startPos: Vector3 = {
        x: charge.position.x + startRadius * Math.sin(phi) * Math.cos(theta),
        y: charge.position.y + startRadius * Math.cos(phi),
        z: charge.position.z + startRadius * Math.sin(phi) * Math.sin(theta),
      };

      const points = traceFieldLine(
        this.chargeSystem.getAllCharges(),
        startPos,
        direction,
        300,
        1.5,
        300
      );

      if (points.length < 2) continue;

      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);

      const colorStart = new THREE.Color(0xFFD54F);
      const colorEnd = new THREE.Color(0x81D4FA);

      for (let j = 0; j < points.length; j++) {
        vertices[j * 3] = points[j].x;
        vertices[j * 3 + 1] = points[j].y;
        vertices[j * 3 + 2] = points[j].z;

        const t = j / points.length;
        const color = colorStart.clone().lerp(colorEnd, t);
        colors[j * 3] = color.r;
        colors[j * 3 + 1] = color.g;
        colors[j * 3 + 2] = color.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: this.fieldLinesOpacity,
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      line.userData.flowOffset = Math.random() * 100;
      this.fieldLinesGroup.add(line);
    }
  }

  private rebuildEquipotential(): void {
    while (this.equipotentialGroup.children.length > 0) {
      const child = this.equipotentialGroup.children[0];
      this.equipotentialGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const charges = this.chargeSystem.getAllCharges();
    if (charges.length === 0) return;

    const gridSize = 60;
    const resolution = 30;
    const step = gridSize / resolution;

    const potentials: number[][][] = [];
    let minPotential = Infinity;
    let maxPotential = -Infinity;

    for (let i = 0; i <= resolution; i++) {
      potentials[i] = [];
      for (let j = 0; j <= resolution; j++) {
        potentials[i][j] = [];
        for (let k = 0; k <= resolution; k++) {
          const pos: Vector3 = {
            x: -gridSize / 2 + i * step,
            y: -gridSize / 2 + j * step,
            z: -gridSize / 2 + k * step,
          };
          const pot = computePotential(charges, pos);
          if (Math.abs(pot) === Infinity) {
            potentials[i][j][k] = pot > 0 ? 1e20 : -1e20;
          } else {
            potentials[i][j][k] = pot;
          }
          if (Math.abs(potentials[i][j][k]) < 1e20) {
            minPotential = Math.min(minPotential, potentials[i][j][k]);
            maxPotential = Math.max(maxPotential, potentials[i][j][k]);
          }
        }
      }
    }

    if (minPotential === Infinity || maxPotential === -Infinity) return;

    const numSurfaces = 5;
    const colorMin = new THREE.Color(0x2196F3);
    const colorMax = new THREE.Color(0xF44336);

    for (let s = 0; s < numSurfaces; s++) {
      const t = (s + 0.5) / numSurfaces;
      const targetPotential = minPotential + t * (maxPotential - minPotential);

      const color = colorMin.clone().lerp(colorMax, t);

      const geometry = this.createMarchingCubesMesh(potentials, targetPotential, gridSize, resolution);
      if (!geometry) continue;

      const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: this.equipotentialOpacity,
        side: THREE.DoubleSide,
        wireframe: true,
        wireframeLinewidth: 1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      this.equipotentialGroup.add(mesh);
    }
  }

  private createMarchingCubesMesh(
    potentials: number[][][],
    target: number,
    gridSize: number,
    resolution: number
  ): THREE.BufferGeometry | null {
    const step = gridSize / resolution;
    const halfSize = gridSize / 2;
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    const edgeVerts: THREE.Vector3[][] = [];
    for (let i = 0; i < 12; i++) {
      edgeVerts.push([]);
    }

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        for (let k = 0; k < resolution; k++) {
          const cubeValues = [
            potentials[i][j][k + 1],
            potentials[i + 1][j][k + 1],
            potentials[i + 1][j][k],
            potentials[i][j][k],
            potentials[i][j + 1][k + 1],
            potentials[i + 1][j + 1][k + 1],
            potentials[i + 1][j + 1][k],
            potentials[i][j + 1][k],
          ];

          let cubeIndex = 0;
          for (let v = 0; v < 8; v++) {
            if (cubeValues[v] > target) cubeIndex |= 1 << v;
          }

          if (cubeIndex === 0 || cubeIndex === 255) continue;

          const baseX = -halfSize + i * step;
          const baseY = -halfSize + j * step;
          const baseZ = -halfSize + k * step;

          const vertList: (THREE.Vector3 | null)[] = new Array(12).fill(null);

          const edges = this.marchingCubesEdgeTable[cubeIndex];
          if (!edges) continue;

          for (let e = 0; e < 12; e++) {
            if (edges & (1 << e)) {
              const v1 = this.marchingCubesEdgeVertices[e][0];
              const v2 = this.marchingCubesEdgeVertices[e][1];

              const p1 = this.getVertexPosition(v1, baseX, baseY, baseZ, step);
              const p2 = this.getVertexPosition(v2, baseX, baseY, baseZ, step);

              const val1 = cubeValues[v1];
              const val2 = cubeValues[v2];

              const t = (target - val1) / (val2 - val1);
              const interpolated = new THREE.Vector3().lerpVectors(p1, p2, t);
              vertList[e] = interpolated;
            }
          }

          const triList = this.marchingCubesTriTable[cubeIndex];
          if (!triList) continue;

          for (let t = 0; triList[t] !== -1; t += 3) {
            const v0 = vertList[triList[t]];
            const v1 = vertList[triList[t + 1]];
            const v2 = vertList[triList[t + 2]];

            if (!v0 || !v1 || !v2) continue;

            const idx0 = vertices.length / 3;
            vertices.push(v0.x, v0.y, v0.z);
            vertices.push(v1.x, v1.y, v1.z);
            vertices.push(v2.x, v2.y, v2.z);

            const edge1 = new THREE.Vector3().subVectors(v1, v0);
            const edge2 = new THREE.Vector3().subVectors(v2, v0);
            const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

            normals.push(normal.x, normal.y, normal.z);
            normals.push(normal.x, normal.y, normal.z);
            normals.push(normal.x, normal.y, normal.z);

            indices.push(idx0, idx0 + 1, idx0 + 2);
          }
        }
      }
    }

    if (vertices.length === 0) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
  }

  private getVertexPosition(
    vertexIndex: number,
    baseX: number,
    baseY: number,
    baseZ: number,
    step: number
  ): THREE.Vector3 {
    switch (vertexIndex) {
      case 0: return new THREE.Vector3(baseX, baseY, baseZ + step);
      case 1: return new THREE.Vector3(baseX + step, baseY, baseZ + step);
      case 2: return new THREE.Vector3(baseX + step, baseY, baseZ);
      case 3: return new THREE.Vector3(baseX, baseY, baseZ);
      case 4: return new THREE.Vector3(baseX, baseY + step, baseZ + step);
      case 5: return new THREE.Vector3(baseX + step, baseY + step, baseZ + step);
      case 6: return new THREE.Vector3(baseX + step, baseY + step, baseZ);
      case 7: return new THREE.Vector3(baseX, baseY + step, baseZ);
      default: return new THREE.Vector3();
    }
  }

  private marchingCubesEdgeTable: number[] = [
    0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
    0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
    0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
    0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
    0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
    0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
    0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
    0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
    0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
    0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
    0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
    0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
    0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
    0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
    0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
    0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
    0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
    0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
    0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
    0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
    0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
    0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
    0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
    0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
    0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
    0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
    0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
    0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
    0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
    0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
    0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
    0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
  ];

  private marchingCubesEdgeVertices: number[][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  private marchingCubesTriTable: number[][] = [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1],
    [3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1],
    [3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1],
    [3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1],
    [9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1],
    [9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
    [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1],
    [8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1],
    [9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
    [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1],
    [3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1],
    [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1],
    [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1],
    [4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
    [5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1],
    [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1],
    [9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
    [0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
    [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1],
    [10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1],
    [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1],
    [5, 0, 3, 5, 4, 0, 5, 3, 11, 3, 10, 11, -1, -1, -1, -1],
    [5, 4, 10, 5, 10, 8, 5, 8, 11, 11, 8, 3, -1, -1, -1, -1],
    [9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1],
    [0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1],
    [1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1],
    [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1],
    [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1],
    [2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1],
    [7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1],
    [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1],
    [11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1],
    [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
    [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
    [11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
    [1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1],
    [9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1],
    [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
    [2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
    [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1],
    [6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1],
    [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1],
    [6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1],
    [5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1],
    [1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
    [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1],
    [6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1],
    [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1],
    [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
    [3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
    [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1],
    [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1],
    [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
    [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1],
    [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
    [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
    [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1],
    [10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1],
    [10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1],
    [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1],
    [1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1],
    [0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1],
    [10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1],
    [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1],
    [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
    [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1],
    [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
    [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
    [9, 5, 6, 9, 6, 3, 3, 6, 2, -1, -1, -1, -1, -1, -1, -1],
    [4, 9, 5, 7, 9, 4, 7, 8, 9, -1, -1, -1, -1, -1, -1, -1],
    [4, 5, 8, 4, 8, 7, 0, 3, 8, 0, 8, 9, 3, 9, 8, -1],
    [0, 5, 9, 0, 1, 5, 1, 7, 5, 1, 8, 7, -1, -1, -1, -1],
    [8, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [10, 1, 2, 5, 8, 4, 5, 9, 8, 7, 8, 4, -1, -1, -1, -1],
    [11, 6, 3, 11, 3, 0, 6, 10, 3, 5, 3, 4, 10, 4, 3, -1],
    [0, 2, 6, 0, 6, 5, 0, 5, 9, 8, 4, 7, 5, 7, 4, -1],
    [6, 3, 2, 6, 2, 5, 5, 2, 8, 5, 8, 7, -1, -1, -1, -1],
    [7, 8, 4, 3, 10, 1, 3, 11, 10, 11, 6, 10, -1, -1, -1, -1],
    [1, 11, 6, 1, 6, 10, 7, 8, 0, 7, 0, 4, 8, 4, 0, -1],
    [8, 4, 7, 3, 11, 0, 1, 9, 10, 10, 9, 6, -1, -1, -1, -1],
    [10, 1, 6, 11, 6, 1, 7, 8, 5, 8, 4, 5, -1, -1, -1, -1],
    [5, 8, 4, 5, 9, 8, 9, 1, 8, 11, 8, 6, 1, 6, 8, -1],
    [0, 4, 11, 0, 11, 6, 0, 6, 1, 5, 6, 11, 9, 11, 5, -1],
    [8, 2, 6, 8, 5, 2, 5, 9, 2, 11, 2, 10, 9, 10, 2, -1],
    [9, 5, 6, 11, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 11, 7, 9, 11, 4, 9, 10, 11, 9, 2, 10, -1, -1, -1, -1],
    [4, 11, 7, 0, 8, 1, 8, 10, 1, 8, 11, 10, 6, 10, 8, -1],
    [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1],
    [10, 7, 4, 10, 11, 7, 11, 3, 7, 1, 7, 0, 3, 0, 7, -1],
    [4, 11, 7, 9, 11, 4, 9, 1, 11, 9, 2, 1, -1, -1, -1, -1],
    [9, 7, 4, 9, 11, 7, 9, 10, 11, 2, 11, 10, 0, 1, 10, -1],
    [11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1],
    [10, 7, 4, 10, 11, 7, 2, 11, 10, -1, -1, -1, -1, -1, -1, -1],
    [5, 8, 7, 5, 2, 8, 5, 10, 2, 1, 2, 10, -1, -1, -1, -1],
    [5, 0, 1, 5, 7, 0, 5, 10, 7, 7, 3, 0, -1, -1, -1, -1],
    [0, 7, 8, 0, 1, 7, 1, 5, 7, 2, 7, 10, 10, 5, 7, -1],
    [3, 5, 10, 7, 5, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [5, 8, 7, 5, 10, 8, 10, 2, 8, 10, 11, 2, -1, -1, -1, -1],
    [5, 0, 1, 5, 10, 0, 10, 11, 0, 10, 7, 11, 7, 3, 11, -1],
    [0, 7, 8, 1, 0, 8, 1, 8, 10, 2, 10, 8, 11, 10, 2, -1],
    [11, 7, 3, 11, 10, 7, 10, 2, 7, -1, -1, -1, -1, -1, -1, -1],
    [11, 5, 10, 7, 5, 11, 7, 8, 5, 1, 5, 9, 8, 9, 5, -1],
    [10, 7, 11, 10, 11, 5, 7, 3, 11, 1, 11, 9, 3, 9, 11, -1],
    [1, 5, 9, 8, 5, 1, 8, 7, 5, 8, 10, 7, 10, 11, 7, -1],
    [3, 11, 10, 7, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 1, 6, 9, 6, 4, 1, 2, 6, 7, 6, 8, 2, 8, 6, -1],
    [1, 2, 7, 1, 7, 9, 7, 2, 6, 7, 6, 4, 6, 2, 11, -1],
    [1, 6, 4, 1, 2, 6, 0, 8, 2, 8, 7, 2, -1, -1, -1, -1],
    [0, 2, 7, 0, 7, 9, 2, 6, 7, 7, 11, 6, -1, -1, -1, -1],
    [6, 4, 9, 6, 9, 11, 2, 9, 1, 2, 11, 9, -1, -1, -1, -1],
    [11, 6, 4, 11, 4, 9, 11, 9, 2, 1, 9, 7, 2, 7, 9, -1],
    [2, 8