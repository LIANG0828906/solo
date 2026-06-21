import * as THREE from 'three';
import { eventBus, EVENTS } from '../utils/EventBus';
import { ForceNode } from '../physics/ForceSimulator';

export interface NodeData extends ForceNode {
  color: THREE.Color;
  label: string;
  createdAt: number;
  isHighlighted: boolean;
  mesh: THREE.Mesh;
  glowMesh?: THREE.Mesh;
  labelElement?: HTMLElement;
  animationProgress: number;
  targetScale: number;
}

const LABELS = ['阿尔法', '贝塔', '伽马', '德尔塔', '厄普西隆', '泽塔', '艾塔', '西塔', '约塔', '卡帕', '拉姆达', '缪', '纽', '克西', '奥米克戎', '派', '柔', '西格玛', '陶', '乌普西隆', '斐', '希', '普西', '奥米伽'];

export class NodeManager {
  nodes: Map<string, NodeData> = new Map();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private labelContainer: HTMLElement;
  private selectedNodeId: string | null = null;
  private nodeGeometry: THREE.SphereGeometry;
  private glowGeometry: THREE.SphereGeometry;
  private labelIndex = 0;
  private highlightTime = 0;

  constructor(scene: THREE.Scene, camera: THREE.Camera, labelContainer: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.labelContainer = labelContainer;

    this.nodeGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    this.glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);

    eventBus.on(EVENTS.NODE_REMOVE, (id: string) => {
      this.removeNode(id, true);
    });

    eventBus.on(EVENTS.NODE_HIGHLIGHT, (id: string) => {
      this.highlightNode(id);
    });

    eventBus.on(EVENTS.NODE_UNHIGHLIGHT, () => {
      this.unhighlightAll();
    });

    eventBus.on(EVENTS.SIMULATION_RESET, () => {
      // Position reset handled by ForceSimulator
    });

    eventBus.on(EVENTS.SEARCH_FOCUS, (id: string) => {
      this.focusOnNode(id);
    });
  }

  addNode(position: THREE.Vector3, label?: string): NodeData {
    const id = this.generateId();

    const hue = Math.random();
    const saturation = 0.7 + Math.random() * 0.2;
    const lightness = 0.6 + Math.random() * 0.2;
    const color = new THREE.Color().setHSL(hue, saturation, lightness);

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: color.clone().multiplyScalar(0.2),
    });

    const mesh = new THREE.Mesh(this.nodeGeometry, material);
    mesh.position.copy(position);
    mesh.scale.set(0, 0, 0);
    mesh.userData.nodeId = id;

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });

    const glowMesh = new THREE.Mesh(this.glowGeometry, glowMaterial);
    glowMesh.position.copy(position);
    glowMesh.scale.set(0, 0, 0);
    glowMesh.userData.nodeId = id;

    this.scene.add(mesh);
    this.scene.add(glowMesh);

    const nodeLabel = label || this.getNextLabel();
    const labelElement = this.createLabelElement(nodeLabel);
    this.labelContainer.appendChild(labelElement);

    const node: NodeData = {
      id,
      position: mesh.position,
      velocity: new THREE.Vector3(),
      color,
      label: nodeLabel,
      createdAt: Date.now(),
      isHighlighted: false,
      mesh,
      glowMesh,
      labelElement,
      animationProgress: 0,
      targetScale: 1,
    };

    this.nodes.set(id, node);
    eventBus.emit(EVENTS.NODE_ADD, node);
    eventBus.emit(EVENTS.NODE_COUNT_CHANGE, this.nodes.size);

    this.animateNodeIn(node);

    return node;
  }

  removeNode(id: string, animate: boolean = false): void {
    const node = this.nodes.get(id);
    if (!node) return;

    if (this.selectedNodeId === id) {
      this.selectedNodeId = null;
    }

    if (animate) {
      this.animateNodeOut(node, () => {
        this.cleanupNode(node);
      });
    } else {
      this.cleanupNode(node);
    }
  }

  private cleanupNode(node: NodeData): void {
    this.scene.remove(node.mesh);
    if (node.glowMesh) {
      this.scene.remove(node.glowMesh);
    }
    if (node.labelElement) {
      node.labelElement.remove();
    }
    this.nodes.delete(node.id);
    eventBus.emit(EVENTS.NODE_COUNT_CHANGE, this.nodes.size);
  }

  highlightNode(id: string): void {
    this.unhighlightAll();

    const node = this.nodes.get(id);
    if (!node) return;

    node.isHighlighted = true;
    node.targetScale = 1.2;

    const material = node.mesh.material as THREE.MeshStandardMaterial;
    material.emissive.set(node.color.clone().multiplyScalar(0.5));

    if (node.glowMesh) {
      const glowMaterial = node.glowMesh.material as THREE.MeshBasicMaterial;
      glowMaterial.opacity = 0.5;
    }

    this.selectedNodeId = id;
  }

  unhighlightAll(): void {
    this.nodes.forEach(node => {
      if (node.isHighlighted) {
        node.isHighlighted = false;
        node.targetScale = 1;

        const material = node.mesh.material as THREE.MeshStandardMaterial;
        material.emissive.set(node.color.clone().multiplyScalar(0.2));

        if (node.glowMesh) {
          const glowMaterial = node.glowMesh.material as THREE.MeshBasicMaterial;
          glowMaterial.opacity = 0.3;
        }
      }
    });
    this.selectedNodeId = null;
  }

  getNodeById(id: string): NodeData | undefined {
    return this.nodes.get(id);
  }

  getSelectedNodeId(): string | null {
    return this.selectedNodeId;
  }

  setSelectedNodeId(id: string | null): void {
    this.selectedNodeId = id;
  }

  getNodeMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    this.nodes.forEach(node => {
      meshes.push(node.mesh);
      if (node.glowMesh) {
        meshes.push(node.glowMesh);
      }
    });
    return meshes;
  }

  update(dt: number, time: number): void {
    this.highlightTime = time;

    this.nodes.forEach(node => {
      node.mesh.position.copy(node.position);
      if (node.glowMesh) {
        node.glowMesh.position.copy(node.position);
      }

      if (node.animationProgress < 1) {
        node.animationProgress = Math.min(node.animationProgress + dt / 0.8, 1);
        const scale = this.elasticOut(node.animationProgress) * node.targetScale;
        node.mesh.scale.set(scale, scale, scale);
        if (node.glowMesh) {
          node.glowMesh.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
        }
      } else {
        let targetScale = node.targetScale;
        if (node.isHighlighted) {
          const breathe = 0.1 * Math.sin((time * 1000) / 1500 * Math.PI * 2);
          targetScale += breathe;
        }
        node.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        if (node.glowMesh) {
          node.glowMesh.scale.lerp(new THREE.Vector3(targetScale * 1.2, targetScale * 1.2, targetScale * 1.2), 0.1);
        }
      }
    });

    this.updateLabels();
  }

  updateLabels(): void {
    this.nodes.forEach(node => {
      if (!node.labelElement) return;

      const vector = node.position.clone();
      vector.project(this.camera);

      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

      const distance = this.camera.position.distanceTo(node.position);
      const visible = vector.z < 1;

      if (visible) {
        node.labelElement.style.display = 'block';
        node.labelElement.style.left = `${x - node.labelElement.offsetWidth / 2}px`;
        node.labelElement.style.top = `${y - 40}px`;
        node.labelElement.style.opacity = Math.max(0.3, Math.min(1, 20 / distance)).toString();
      } else {
        node.labelElement.style.display = 'none';
      }
    });
  }

  focusOnNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    this.highlightNode(id);
  }

  getConnectionCount(nodeId: string): number {
    return 0;
  }

  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextLabel(): string {
    const label = LABELS[this.labelIndex % LABELS.length];
    this.labelIndex++;
    return label;
  }

  private createLabelElement(text: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'node-label';
    div.textContent = text;
    return div;
  }

  private animateNodeIn(node: NodeData): void {
    node.animationProgress = 0;
  }

  private animateNodeOut(node: NodeData, callback: () => void): void {
    const startTime = performance.now();
    const duration = 300;
    const startScale = node.mesh.scale.x;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = startScale * (1 - progress);

      node.mesh.scale.set(scale, scale, scale);
      if (node.glowMesh) {
        node.glowMesh.scale.set(scale, scale, scale);
      }
      if (node.labelElement) {
        node.labelElement.style.opacity = (1 - progress).toString();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };

    animate();
  }

  private elasticOut(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  getNodes(): Map<string, NodeData> {
    return this.nodes;
  }

  clearAll(): void {
    this.nodes.forEach(node => {
      this.scene.remove(node.mesh);
      if (node.glowMesh) {
        this.scene.remove(node.glowMesh);
      }
      if (node.labelElement) {
        node.labelElement.remove();
      }
    });
    this.nodes.clear();
    this.selectedNodeId = null;
    eventBus.emit(EVENTS.NODE_COUNT_CHANGE, 0);
  }
}
