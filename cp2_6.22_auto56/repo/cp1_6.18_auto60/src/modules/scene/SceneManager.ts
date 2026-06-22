import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppStore } from '../../store/useAppStore';
import type { CodeNode } from '../../types';
import {
  createNodeMesh,
  createEdgeMesh,
  updateNodeAnimation,
  updateEdgeAnimation,
  createLoadingMesh,
  updateLoadingAnimation,
} from './sceneRenderer';

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private nodeMeshes: Map<string, THREE.Group>;
  private edgeMeshes: Map<string, THREE.Group>;
  private animationId: number | null;
  private time: number;
  private loadingMesh: THREE.Group | null;
  private selectedMesh: THREE.Group | null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.nodeMeshes = new Map();
    this.edgeMeshes = new Map();
    this.animationId = null;
    this.time = 0;
    this.loadingMesh = null;
    this.selectedMesh = null;

    this.init();
  }

  private init(): void {
    this.scene.background = new THREE.Color(0x0b0d17);

    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0b0d17, 1);
    this.container.appendChild(this.renderer.domElement);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 0.8;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x4ecdc4, 1, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    this.setupEventListeners();
    this.animate();
    this.createStarfield();
    this.loadDemoData();
  }

  private createStarfield(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private handleClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const allMeshes: THREE.Object3D[] = [];
    this.nodeMeshes.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          allMeshes.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      let clickedGroup: THREE.Group | null = null;
      let clickedObject = intersects[0].object;

      while (clickedObject && !clickedGroup) {
        if (clickedObject instanceof THREE.Group && clickedObject.userData.nodeId) {
          clickedGroup = clickedObject;
        }
        clickedObject = clickedObject.parent as THREE.Object3D;
      }

      if (clickedGroup && clickedGroup.userData.node) {
        this.selectNode(clickedGroup.userData.node);
      }
    } else {
      this.deselectNode();
    }
  };

  private selectNode(node: CodeNode): void {
    const setSelectedNode = useAppStore.getState().setSelectedNode;

    if (this.selectedMesh) {
      this.selectedMesh.scale.setScalar(1);
    }

    this.selectedMesh = this.nodeMeshes.get(node.id) || null;

    if (this.selectedMesh) {
      this.selectedMesh.scale.setScalar(1.5);
    }

    setSelectedNode(node);
  }

  private deselectNode(): void {
    const setSelectedNode = useAppStore.getState().setSelectedNode;
    const currentSelected = useAppStore.getState().selectedNode;

    if (this.selectedMesh && currentSelected) {
      this.selectedMesh.scale.setScalar(1);
    }

    setSelectedNode(null);
    this.selectedMesh = null;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const state = useAppStore.getState();
    const speed = state.isPlaying ? state.speed : 0;

    this.time += 0.016 * speed;

    if (state.isLoading && this.loadingMesh) {
      updateLoadingAnimation(this.loadingMesh, this.time);
    }

    if (!state.isLoading) {
      this.nodeMeshes.forEach((mesh) => {
        if (mesh !== this.selectedMesh) {
          updateNodeAnimation(mesh, this.time, speed);
        }
      });

      this.edgeMeshes.forEach((mesh) => {
        updateEdgeAnimation(mesh, this.time, speed);
      });
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public updateScene(): void {
    const state = useAppStore.getState();

    this.clearScene();

    if (state.isLoading) {
      this.showLoading();
      return;
    }

    this.hideLoading();

    for (const node of state.nodes) {
      const nodeMesh = createNodeMesh(node);
      this.nodeMeshes.set(node.id, nodeMesh);
      this.scene.add(nodeMesh);
    }

    for (const edge of state.edges) {
      const sourceNode = state.nodes.find((n) => n.id === edge.source);
      const targetNode = state.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const edgeMesh = createEdgeMesh(edge, sourceNode, targetNode);
        this.edgeMeshes.set(edge.id, edgeMesh);
        this.scene.add(edgeMesh);
      }
    }
  }

  private clearScene(): void {
    this.nodeMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.nodeMeshes.clear();

    this.edgeMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.edgeMeshes.clear();

    this.selectedMesh = null;
  }

  private showLoading(): void {
    if (!this.loadingMesh) {
      this.loadingMesh = createLoadingMesh();
      this.loadingMesh.position.set(0, 0, 0);
      this.scene.add(this.loadingMesh);
    }
    this.loadingMesh.visible = true;
  }

  private hideLoading(): void {
    if (this.loadingMesh) {
      this.loadingMesh.visible = false;
    }
  }

  private loadDemoData(): void {
    const demoNodes = [
      { id: '1', name: 'formatDate', type: 'function' as const, moduleType: 'util' as const, code: "function formatDate(date) {\n  return date.toISOString().split('T')[0];\n}", position: { x: -8, y: 2, z: 0 }, callCount: 3 },
      { id: '2', name: 'generateId', type: 'function' as const, moduleType: 'util' as const, code: 'function generateId() {\n  return Math.random().toString(36).substr(2, 9);\n}', position: { x: -6, y: -2, z: 4 }, callCount: 5 },
      { id: '3', name: 'validateEmail', type: 'function' as const, moduleType: 'util' as const, code: 'function validateEmail(email) {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n}', position: { x: -7, y: 0, z: -4 }, callCount: 2 },
      { id: '4', name: 'calculateTotal', type: 'function' as const, moduleType: 'business' as const, code: 'function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);\n}', position: { x: 0, y: 3, z: 6 }, callCount: 4 },
      { id: '5', name: 'processOrder', type: 'function' as const, moduleType: 'business' as const, code: 'function processOrder(order) {\n  const total = calculateTotal(order.items);\n  const id = generateId();\n  return { id, total, status: \'processed\' };\n}', position: { x: 2, y: 0, z: 8 }, callCount: 1 },
      { id: '6', name: 'getUserProfile', type: 'function' as const, moduleType: 'business' as const, code: 'function getUserProfile(userId) {\n  return { id: userId, name: \'User \' + userId };\n}', position: { x: -2, y: -3, z: 7 }, callCount: 2 },
      { id: '7', name: 'ButtonComponent', type: 'class' as const, moduleType: 'ui' as const, code: 'class ButtonComponent {\n  constructor(label, onClick) {\n    this.label = label;\n    this.onClick = onClick;\n  }\n  render() {\n    return \'<button>\' + this.label + \'</button>\';\n  }\n}', position: { x: 8, y: 2, z: 2 }, callCount: 3 },
      { id: '8', name: 'ModalComponent', type: 'class' as const, moduleType: 'ui' as const, code: 'class ModalComponent {\n  constructor(title, content) {\n    this.title = title;\n    this.content = content;\n  }\n  open() { this.isOpen = true; }\n  close() { this.isOpen = false; }\n}', position: { x: 7, y: -1, z: -3 }, callCount: 2 },
      { id: '9', name: 'FormComponent', type: 'class' as const, moduleType: 'ui' as const, code: 'class FormComponent {\n  constructor(fields) {\n    this.fields = fields;\n    this.values = {};\n  }\n  validate() {\n    return this.fields.every(f => !f.required || this.values[f.name]);\n  }\n}', position: { x: 9, y: 0, z: 0 }, callCount: 1 },
      { id: '10', name: 'main', type: 'function' as const, moduleType: 'business' as const, code: 'function main() {\n  const order = { items: [...] };\n  const processed = processOrder(order);\n  console.log(\'Order:\', processed);\n}', position: { x: 0, y: 0, z: 0 }, callCount: 0 },
    ];

    const demoEdges = [
      { id: 'e1', source: '5', target: '4', weight: 1 },
      { id: 'e2', source: '5', target: '2', weight: 1 },
      { id: 'e3', source: '10', target: '5', weight: 1 },
      { id: 'e4', source: '10', target: '7', weight: 1 },
      { id: 'e5', source: '6', target: '1', weight: 1 },
      { id: 'e6', source: '9', target: '3', weight: 1 },
      { id: 'e7', source: '8', target: '7', weight: 1 },
      { id: 'e8', source: '4', target: '2', weight: 1 },
    ];

    useAppStore.getState().setNodes(demoNodes);
    useAppStore.getState().setEdges(demoEdges);

    this.updateScene();
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('click', this.handleClick);

    this.clearScene();

    this.renderer.dispose();
    this.controls.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
