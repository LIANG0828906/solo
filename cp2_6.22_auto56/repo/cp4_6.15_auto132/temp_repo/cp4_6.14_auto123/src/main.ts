import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadSampleData, COLOR_PALETTE } from './dataLoader';
import { InteractionManager } from './interactionManager';
import { UIController } from './uiController';
import type { TracePath } from './uiController';

const BG_COLOR = 0x0f172a;
const SPHERE_RADIUS = 0.03;
const SPHERE_SEGMENTS = 8;
const CAMERA_POSITION = new THREE.Vector3(3, 2, 5);

class NeuronAnnotator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private interactionManager: InteractionManager;
  private uiController: UIController;
  private sphereMeshes: THREE.Mesh[] = [];
  private allPoints: THREE.Vector3[] = [];
  private pointLabels: number[] = [];
  private completedPaths: TracePath[] = [];
  private animationId: number = 0;

  constructor() {
    const container = document.getElementById('canvas-container')!;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(BG_COLOR, 1);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.copy(CAMERA_POSITION);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    this.uiController = new UIController();

    this.interactionManager = new InteractionManager(
      this.scene,
      this.camera,
      this.renderer,
      this.controls
    );

    this.setupCallbacks();
    this.loadPointCloud();
    this.setupResize();
    this.animate();
  }

  private setupCallbacks() {
    this.interactionManager.setOnPathComplete((path: TracePath) => {
      this.completedPaths.push(path);
      this.uiController.addPathResult(path);
      this.uiController.setMode('browse');
      this.interactionManager.clearHighlights();
    });

    this.uiController.setCallbacks({
      onResetView: () => {
        this.camera.position.copy(CAMERA_POSITION);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
      },
      onClearAll: () => {
        this.completedPaths.forEach((path) => {
          this.interactionManager.removePath(path);
        });
        this.completedPaths = [];
        this.interactionManager.clearAllPaths();
        this.uiController.clearAllPaths();
      },
      onClearPath: (pathId: string) => {
        const idx = this.completedPaths.findIndex((p) => p.id === pathId);
        if (idx >= 0) {
          this.interactionManager.removePath(this.completedPaths[idx]);
          this.completedPaths.splice(idx, 1);
          this.uiController.removePathResult(pathId);
        }
      },
      onExport: () => {
        this.exportAnnotations();
      },
    });
  }

  private loadPointCloud() {
    const data = loadSampleData();
    const sharedGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS);

    const materialCache: Map<number, THREE.MeshBasicMaterial> = new Map();
    for (let label = 0; label < 6; label++) {
      materialCache.set(label, new THREE.MeshBasicMaterial({ color: COLOR_PALETTE[label] }));
    }

    const instancedMeshes: Map<number, THREE.InstancedMesh> = new Map();
    const labelCounts: Map<number, number> = new Map();

    for (const point of data.points) {
      const count = labelCounts.get(point.label) || 0;
      labelCounts.set(point.label, count + 1);
    }

    for (const [label, count] of labelCounts) {
      const instancedMesh = new THREE.InstancedMesh(
        sharedGeometry,
        materialCache.get(label)!,
        count
      );
      instancedMeshes.set(label, instancedMesh);
      this.scene.add(instancedMesh);
    }

    const labelIndices: Map<number, number> = new Map();
    const dummy = new THREE.Object3D();

    for (let i = 0; i < data.points.length; i++) {
      const point = data.points[i];
      const idx = labelIndices.get(point.label) || 0;
      labelIndices.set(point.label, idx + 1);

      dummy.position.set(point.x, point.y, point.z);
      dummy.updateMatrix();

      const instancedMesh = instancedMeshes.get(point.label)!;
      instancedMesh.setMatrixAt(idx, dummy.matrix);

      this.allPoints.push(new THREE.Vector3(point.x, point.y, point.z));
      this.pointLabels.push(point.label);

      const mesh = new THREE.Mesh(sharedGeometry, materialCache.get(point.label)!);
      mesh.position.set(point.x, point.y, point.z);
      mesh.userData.pointIndex = i;
      this.sphereMeshes.push(mesh);
    }

    for (const [, instancedMesh] of instancedMeshes) {
      instancedMesh.instanceMatrix.needsUpdate = true;
    }

    this.interactionManager.setPointData(this.sphereMeshes, this.allPoints, this.pointLabels);
  }

  private exportAnnotations() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportData = {
      timestamp: new Date().toISOString(),
      annotations: this.completedPaths.map((path) => ({
        pathIndex: path.index,
        points: path.points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
        length: path.length,
        avgDiameter: path.avgDiameter,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuron_annotations_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.uiController.showToast('标注数据导出成功', 2000);
  }

  private setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new NeuronAnnotator();
