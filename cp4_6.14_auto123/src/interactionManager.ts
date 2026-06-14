import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { COLOR_PALETTE } from './dataLoader';
import { calculatePathLength, calculateAvgDiameter } from './measurementEngine';
import type { TracePath } from './uiController';

const NEIGHBOR_RADIUS = 0.15;
const TRACE_INTERVAL = 0.1;

export class InteractionManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private sphereMeshes: THREE.Mesh[] = [];
  private allPoints: THREE.Vector3[] = [];
  private pointLabels: number[] = [];
  private isTracing: boolean = false;
  private currentTracePoints: THREE.Vector3[] = [];
  private currentTraceLine: THREE.Line | null = null;
  private highlightedMeshes: THREE.Mesh[] = [];
  private originalColors: Map<THREE.Mesh, number> = new Map();
  private pathCounter: number = 0;
  private onPathComplete: ((path: TracePath) => void) | null = null;
  private hoveredMesh: THREE.Mesh | null = null;
  private isMouseDown: boolean = false;
  private orbitControls: any;
  private branchPointIndices: number[] = [];
  private lastTracePoint: THREE.Vector3 | null = null;
  private traceGeometry: THREE.BufferGeometry | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    orbitControls: any
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.orbitControls = orbitControls;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points = { threshold: 0.1 };
    this.mouse = new THREE.Vector2();

    this.bindEvents();
  }

  setPointData(meshes: THREE.Mesh[], points: THREE.Vector3[], labels: number[]) {
    this.sphereMeshes = meshes;
    this.allPoints = points;
    this.pointLabels = labels;
  }

  setOnPathComplete(callback: (path: TracePath) => void) {
    this.onPathComplete = callback;
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.updateMouse(touch.clientX, touch.clientY);
        this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 } as MouseEvent);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.updateMouse(touch.clientX, touch.clientY);
        this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      this.onMouseUp({ button: 0 } as MouseEvent);
    });
  }

  private updateMouse(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseMove(event: MouseEvent) {
    this.updateMouse(event.clientX, event.clientY);

    if (this.isTracing && this.isMouseDown) {
      this.addTracePoint();
      return;
    }

    if (!this.isTracing) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.sphereMeshes);

      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        if (this.hoveredMesh !== mesh) {
          this.resetHover();
          this.hoveredMesh = mesh;
          this.renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        this.resetHover();
        this.renderer.domElement.style.cursor = 'default';
      }
    }
  }

  private resetHover() {
    if (this.hoveredMesh) {
      this.hoveredMesh = null;
    }
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    this.isMouseDown = true;

    if (this.isTracing) {
      this.renderer.domElement.style.cursor = 'crosshair';
      this.addTracePoint();
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.sphereMeshes);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;
      const hitMesh = intersects[0].object as THREE.Mesh;
      const hitIdx = this.sphereMeshes.indexOf(hitMesh);

      if (hitIdx >= 0) {
        this.startTrace(hitIdx, hitPoint);
      }
    }
  }

  private onMouseUp(event: MouseEvent) {
    if (event.button !== 0) return;
    this.isMouseDown = false;

    if (this.isTracing) {
      this.endTrace();
    }
  }

  private startTrace(hitIndex: number, hitPoint: THREE.Vector3) {
    this.orbitControls.enabled = false;
    this.isTracing = true;
    this.currentTracePoints = [];
    this.branchPointIndices = [];
    this.lastTracePoint = null;

    const hitLabel = this.pointLabels[hitIndex];
    const neighborIndices: number[] = [];

    for (let i = 0; i < this.allPoints.length; i++) {
      if (this.pointLabels[i] === hitLabel) {
        neighborIndices.push(i);
      }
    }

    this.highlightBranch(neighborIndices);
    this.flashBranch(neighborIndices, hitLabel);

    this.addTracePointAt(hitPoint);
  }

  private highlightBranch(indices: number[]) {
    this.clearHighlights();
    this.branchPointIndices = indices;

    indices.forEach((idx) => {
      const mesh = this.sphereMeshes[idx];
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        this.originalColors.set(mesh, mat.color.getHex());
        mat.color.setHex(0xffffff);
        this.highlightedMeshes.push(mesh);
      }
    });
  }

  private async flashBranch(indices: number[], _label: number) {
    const flashColor = 0xffffff;
    const normalColor = COLOR_PALETTE[_label] || 0x3b82f6;

    for (let flash = 0; flash < 2; flash++) {
      await this.delay(300);
      indices.forEach((idx) => {
        const mesh = this.sphereMeshes[idx];
        if (mesh) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.color.setHex(normalColor);
        }
      });

      await this.delay(300);
      indices.forEach((idx) => {
        const mesh = this.sphereMeshes[idx];
        if (mesh) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.color.setHex(flashColor);
        }
      });
    }
  }

  private addTracePoint() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.sphereMeshes);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.addTracePointAt(point);
    }
  }

  private addTracePointAt(point: THREE.Vector3) {
    if (this.lastTracePoint && this.lastTracePoint.distanceTo(point) < TRACE_INTERVAL) {
      return;
    }

    this.currentTracePoints.push(point.clone());
    this.lastTracePoint = point.clone();
    this.updateTraceLine();
  }

  private updateTraceLine() {
    if (this.currentTracePoints.length < 2) return;

    if (this.currentTraceLine) {
      this.scene.remove(this.currentTraceLine);
      this.currentTraceLine.geometry.dispose();
    }

    const curve = new THREE.CatmullRomCurve3(this.currentTracePoints);
    const tubeGeometry = new THREE.TubeGeometry(curve, this.currentTracePoints.length * 4, 0.015, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.6,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    this.scene.add(tubeMesh);

    if (this.currentTraceLine) {
      (this.currentTraceLine as any)._tubeMesh = tubeMesh;
    } else {
      this.currentTraceLine = new THREE.Line();
      (this.currentTraceLine as any)._tubeMesh = tubeMesh;
    }
  }

  private endTrace() {
    this.orbitControls.enabled = true;
    this.isTracing = false;
    this.renderer.domElement.style.cursor = 'default';
    this.lastTracePoint = null;

    if (this.currentTracePoints.length >= 2) {
      const pathLength = calculatePathLength(this.currentTracePoints);
      const avgDiameter = calculateAvgDiameter(this.currentTracePoints, this.allPoints);

      this.pathCounter++;

      const tubeMesh = this.currentTraceLine ? (this.currentTraceLine as any)._tubeMesh : null;

      const path: TracePath = {
        id: uuidv4(),
        index: this.pathCounter,
        points: [...this.currentTracePoints],
        length: pathLength,
        avgDiameter: avgDiameter,
        line: tubeMesh,
        highlightMeshes: [...this.highlightedMeshes],
      };

      this.onPathComplete?.(path);
    } else {
      this.clearHighlights();
      if (this.currentTraceLine) {
        const tubeMesh = (this.currentTraceLine as any)._tubeMesh;
        if (tubeMesh) {
          this.scene.remove(tubeMesh);
          tubeMesh.geometry.dispose();
        }
      }
    }

    this.currentTracePoints = [];
    this.currentTraceLine = null;
    this.traceGeometry = null;
  }

  clearHighlights() {
    this.highlightedMeshes.forEach((mesh) => {
      const originalColor = this.originalColors.get(mesh);
      if (originalColor !== undefined) {
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(originalColor);
      }
    });
    this.highlightedMeshes = [];
    this.originalColors.clear();
  }

  removePath(path: TracePath) {
    if (path.line) {
      this.scene.remove(path.line);
      path.line.geometry.dispose();
    }
    if (path.highlightMeshes) {
      path.highlightMeshes.forEach((mesh) => {
        const originalColor = this.originalColors.get(mesh);
        if (originalColor !== undefined) {
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(originalColor);
        }
      });
    }
  }

  clearAllPaths() {
    this.clearHighlights();
    this.pathCounter = 0;
    this.isTracing = false;
    this.isMouseDown = false;
    this.orbitControls.enabled = true;
  }

  isCurrentlyTracing(): boolean {
    return this.isTracing;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
