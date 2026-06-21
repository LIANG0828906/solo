import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { eventBus, EVENTS } from './utils/EventBus';
import { NodeManager, NodeData } from './network/NodeManager';
import { LinkManager, LinkData } from './network/LinkManager';
import { ForceSimulator } from './physics/ForceSimulator';
import { Panel } from './ui/Panel';

interface HistoryAction {
  type: 'node:add' | 'node:remove' | 'link:add' | 'link:remove';
  data: NodeData | LinkData;
  timestamp: number;
}

class TopologyFantasy {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private labelContainer: HTMLElement;

  private nodeManager: NodeManager;
  private linkManager: LinkManager;
  private forceSimulator: ForceSimulator;
  private panel: Panel;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedNodeId: string | null = null;

  private particles: THREE.Points;
  private icosahedron: THREE.LineSegments;

  private history: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];
  private readonly MAX_HISTORY = 30;

  private clock: THREE.Clock;
  private animationId: number | null = null;
  private lastTime: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.labelContainer = document.body;

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.particles = this.createAuroraParticles();
    this.icosahedron = this.createIcosahedron();

    this.nodeManager = new NodeManager(this.scene, this.camera, this.labelContainer);
    this.linkManager = new LinkManager(this.scene, this.nodeManager.getNodes());
    this.forceSimulator = new ForceSimulator();
    this.panel = new Panel(
      this.nodeManager.getNodes(),
      this.camera,
      (nodeId: string) => this.linkManager.getConnectionCount(nodeId)
    );

    this.setupEventListeners();
    this.setupEventBus();
    this.setupHistory();

    this.onWindowResize();
    window.addEventListener('resize', () => this.onWindowResize());

    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(1, 1, 0, 1, 1, 1.5);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 2);

    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x3B82F6, 0.5, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const distance = 20;
    const angle = Math.PI / 4;
    camera.position.set(
      distance * Math.sin(angle),
      distance * Math.cos(angle),
      distance * Math.sin(angle)
    );
    camera.lookAt(0, 0, 0);

    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    this.container.appendChild(renderer.domElement);

    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);
    controls.autoRotate = false;
    controls.enablePan = true;

    return controls;
  }

  private createAuroraParticles(): THREE.Points {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(0x3B82F6);
    const color2 = new THREE.Color(0x8B5CF6);
    const color3 = new THREE.Color(0x06B6D4);

    for (let i = 0; i < particleCount; i++) {
      const radius = 15 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.5;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const colorMix = Math.random();
      let color: THREE.Color;
      if (colorMix < 0.33) {
        color = color1;
      } else if (colorMix < 0.66) {
        color = color2;
      } else {
        color = color3;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.2 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    return points;
  }

  private createIcosahedron(): THREE.LineSegments {
    const geometry = new THREE.IcosahedronGeometry(3, 0);
    const edges = new THREE.EdgesGeometry(geometry);
    
    const material = new THREE.LineBasicMaterial({
      color: 0x3B82F6,
      transparent: true,
      opacity: 0.3,
    });

    const line = new THREE.LineSegments(edges, material);
    this.scene.add(line);

    return line;
  }

  private setupEventListeners(): void {
    this.renderer.domElement.addEventListener('dblclick', (e) => {
      this.onDoubleClick(e);
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      this.onClick(e);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        eventBus.emit(EVENTS.HISTORY_UNDO);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        eventBus.emit(EVENTS.HISTORY_REDO);
      }
    });
  }

  private setupEventBus(): void {
    eventBus.on(EVENTS.NODE_ADD, (node: NodeData) => {
      this.pushHistory({
        type: 'node:add',
        data: node,
        timestamp: Date.now(),
      });
    });

    eventBus.on(EVENTS.LINK_ADD, (link: LinkData) => {
      this.pushHistory({
        type: 'link:add',
        data: link,
        timestamp: Date.now(),
      });
    });

    eventBus.on(EVENTS.SIMULATION_TOGGLE, (payload: boolean | null) => {
      if (payload === null) {
        const isRunning = this.forceSimulator.toggle();
        eventBus.emit(EVENTS.SIMULATION_TOGGLE, isRunning);
      }
    });

    eventBus.on(EVENTS.SIMULATION_RESET, () => {
      this.forceSimulator.resetNodePositions(this.nodeManager.getNodes());
    });

    eventBus.on(EVENTS.SEARCH_FOCUS, (nodeId: string) => {
      this.focusOnNode(nodeId);
    });
  }

  private setupHistory(): void {
    eventBus.on(EVENTS.HISTORY_UNDO, () => {
      this.undo();
    });

    eventBus.on(EVENTS.HISTORY_REDO, () => {
      this.redo();
    });
  }

  private pushHistory(action: HistoryAction): void {
    if (this.history.length >= this.MAX_HISTORY) {
      this.history.shift();
    }
    this.history.push(action);
    this.redoStack = [];
  }

  private undo(): void {
    const action = this.history.pop();
    if (!action) return;

    this.redoStack.push(action);
    this.executeAction(action, true);
  }

  private redo(): void {
    const action = this.redoStack.pop();
    if (!action) return;

    this.history.push(action);
    this.executeAction(action, false);
  }

  private executeAction(action: HistoryAction, isUndo: boolean): void {
    const isRemove = isUndo ? action.type === 'node:add' : action.type === 'node:remove';
    const isRemoveLink = isUndo ? action.type === 'link:add' : action.type === 'link:remove';

    if (action.type.startsWith('node:')) {
      const nodeData = action.data as NodeData;
      if (isRemove) {
        eventBus.emit(EVENTS.NODE_REMOVE, nodeData.id);
      } else {
        const position = nodeData.position.clone();
        const newNode = this.nodeManager.addNode(position, nodeData.label);
        newNode.color.copy(nodeData.color);
        newNode.createdAt = nodeData.createdAt;
      }
    } else if (action.type.startsWith('link:')) {
      const linkData = action.data as LinkData;
      if (isRemoveLink) {
        eventBus.emit(EVENTS.LINK_REMOVE, linkData.id);
      } else {
        this.linkManager.addLink(linkData.sourceId, linkData.targetId);
      }
    }
  }

  private onDoubleClick(event: MouseEvent): void {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.nodeManager.getNodeMeshes(),
      false
    );

    if (intersects.length > 0) return;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, point);

    if (point) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      point.add(offset);
      this.nodeManager.addNode(point);
    }
  }

  private onClick(event: MouseEvent): void {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.nodeManager.getNodeMeshes().filter(m => m.geometry instanceof THREE.SphereGeometry);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const nodeId = mesh.userData.nodeId;

      if (this.selectedNodeId && this.selectedNodeId !== nodeId) {
        const link = this.linkManager.addLink(this.selectedNodeId, nodeId);
        if (link) {
          eventBus.emit(EVENTS.NODE_UNHIGHLIGHT);
        }
        this.selectedNodeId = null;
      } else if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
        eventBus.emit(EVENTS.NODE_UNHIGHLIGHT);
      } else {
        this.selectedNodeId = nodeId;
        eventBus.emit(EVENTS.NODE_HIGHLIGHT, nodeId);
      }
    } else {
      if (!this.wasDragging) {
        this.selectedNodeId = null;
        eventBus.emit(EVENTS.NODE_UNHIGHLIGHT);
      }
    }
  }

  private wasDragging: boolean = false;
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 };

  private updateMouse(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private focusOnNode(nodeId: string): void {
    const node = this.nodeManager.getNodeById(nodeId);
    if (!node) return;

    const targetPosition = node.position.clone();
    const startPosition = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const duration = 1000;
    const startTime = performance.now();

    const offset = new THREE.Vector3(5, 5, 5);
    const cameraTarget = targetPosition.clone().add(offset);

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeInOutCubic(progress);

      this.camera.position.lerpVectors(startPosition, cameraTarget, easeProgress);
      this.controls.target.lerpVectors(startLookAt, targetPosition, easeProgress);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.particles.rotation.y = time * 0.05;
    this.particles.rotation.x = time * 0.02;

    this.icosahedron.rotation.x = time * 0.1;
    this.icosahedron.rotation.y = time * 0.15;

    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(time + i * 0.01) * 0.002;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    const forceNodes = new Map<string, { id: string; position: THREE.Vector3; velocity: THREE.Vector3 }>();
    this.nodeManager.getNodes().forEach((node, id) => {
      forceNodes.set(id, {
        id: node.id,
        position: node.position,
        velocity: node.velocity,
      });
    });

    this.forceSimulator.step(delta, forceNodes, this.linkManager.getLinks());

    const averageDistance = this.forceSimulator.getAverageDistance();
    this.linkManager.updateTensionColors(averageDistance);

    this.nodeManager.update(delta, time);
    this.linkManager.update(delta, time);
    this.panel.update();

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', () => this.onWindowResize());

    this.nodeManager.clearAll();
    this.linkManager.clearAll();

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);

    eventBus.clear();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TopologyFantasy();
});
