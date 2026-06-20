import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { NetworkGraph, NetworkNodeData, NetworkEdgeData } from './networkGraph';
import { ParticleSystem } from './particleSystem';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;

  private graph: NetworkGraph;
  private particleSystem: ParticleSystem;
  private starField: THREE.Points;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private hoveredNodeId: string | null = null;
  private hoveredEdgeId: string | null = null;
  private selectedNodeId: string | null = null;

  private nodeInfoPanel: HTMLElement;
  private edgeLoadLabel: HTMLElement;
  private monitorPanel: HTMLElement;

  private lastTime = 0;
  private fps = 60;
  private fpsFrames = 0;
  private fpsLastUpdate = 0;

  private topologyTimer = 0;
  private topologyInterval = 5000;

  private autoRotateTarget: THREE.Vector3 | null = null;
  private cameraTransitionProgress = 0;
  private cameraStartPos: THREE.Vector3 = new THREE.Vector3();
  private cameraTargetPos: THREE.Vector3 = new THREE.Vector3();
  private cameraTransitioning = false;
  private autoRotateSpeed = 0.3;
  private autoRotateActive = false;

  private monitorDragging = false;
  private monitorDragOffset = { x: 0, y: 0 };
  private monitorCollapsed = false;

  private stressTestMode = false;

  constructor() {
    const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a2e);
    this.scene.fog = new THREE.Fog(0x0a0a2e, 40, 100);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 35);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 80;
    this.controls.enablePan = true;
    this.controls.autoRotate = false;

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6,
      0.4,
      0.85
    );
    this.composer.addPass(bloomPass);

    this.setupLighting();

    this.starField = this.createStarField();
    this.scene.add(this.starField);

    this.graph = new NetworkGraph(this.scene);
    this.graph.generateInitialGraph(18);

    this.particleSystem = new ParticleSystem(this.scene, this.graph, 2500);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.nodeInfoPanel = document.getElementById('node-info-panel')!;
    this.edgeLoadLabel = document.getElementById('edge-load-label')!;
    this.monitorPanel = document.getElementById('monitor-panel')!;

    this.setupEventListeners();
    this.setupMonitorPanel();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x6677aa, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x4488ff, 0.8, 50);
    pointLight1.position.set(-15, 10, -10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xaa44ff, 0.6, 50);
    pointLight2.position.set(15, -5, 10);
    this.scene.add(pointLight2);
  }

  private createStarField(): THREE.Points {
    const starCount = 1500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 80 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.4 + Math.random() * 0.6;
      const tint = Math.random();
      colors[i * 3] = brightness * (0.7 + tint * 0.3);
      colors[i * 3 + 1] = brightness * (0.7 + tint * 0.2);
      colors[i * 3 + 2] = brightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  private setupMonitorPanel(): void {
    const collapseBtn = document.getElementById('collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMonitorCollapse();
      });
    }

    this.monitorPanel.addEventListener('mousedown', (e) => {
      if (this.monitorCollapsed) return;
      const target = e.target as HTMLElement;
      if (target.id === 'collapse-btn') return;

      this.monitorDragging = true;
      const rect = this.monitorPanel.getBoundingClientRect();
      this.monitorDragOffset.x = e.clientX - rect.left;
      this.monitorDragOffset.y = e.clientY - rect.top;

      e.preventDefault();
    });

    this.monitorPanel.addEventListener('click', (e) => {
      if (this.monitorCollapsed) {
        this.toggleMonitorCollapse();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.monitorDragging) return;

      const x = e.clientX - this.monitorDragOffset.x;
      const y = e.clientY - this.monitorDragOffset.y;

      this.monitorPanel.style.right = 'auto';
      this.monitorPanel.style.bottom = 'auto';
      this.monitorPanel.style.left = `${x}px`;
      this.monitorPanel.style.top = `${y}px`;
    });

    window.addEventListener('mouseup', () => {
      this.monitorDragging = false;
    });
  }

  private toggleMonitorCollapse(): void {
    this.monitorCollapsed = !this.monitorCollapsed;
    if (this.monitorCollapsed) {
      this.monitorPanel.classList.add('collapsed');
    } else {
      this.monitorPanel.classList.remove('collapsed');
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.handleHover(event);
  }

  private handleHover(event: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const nodeMeshes: THREE.Mesh[] = [];
    const nodeIdMap = new Map<THREE.Mesh, string>();

    for (const node of this.graph.nodes.values()) {
      if (node.mesh && node.state !== 'leaving' && node.state !== 'entering') {
        nodeMeshes.push(node.mesh);
        nodeIdMap.set(node.mesh, node.id);
      }
    }

    const nodeIntersects = this.raycaster.intersectObjects(nodeMeshes);

    if (nodeIntersects.length > 0) {
      const mesh = nodeIntersects[0].object as THREE.Mesh;
      const nodeId = nodeIdMap.get(mesh);

      if (nodeId && this.hoveredNodeId !== nodeId) {
        if (this.hoveredNodeId) {
          this.graph.setNodeHovered(this.hoveredNodeId, false);
        }
        this.hoveredNodeId = nodeId;
        this.graph.setNodeHovered(nodeId, true);
        this.particleSystem.setSelectedNode(this.selectedNodeId || nodeId);
        document.body.style.cursor = 'pointer';
      }

      if (nodeId && this.hoveredNodeId === nodeId) {
        this.showNodeInfoPanel(nodeId, event.clientX, event.clientY);
      }
    } else {
      if (this.hoveredNodeId) {
        this.graph.setNodeHovered(this.hoveredNodeId, false);
        this.hoveredNodeId = null;
        if (!this.selectedNodeId) {
          this.particleSystem.setSelectedNode(null);
        }
      }
      this.nodeInfoPanel.style.display = 'none';
    }

    if (!this.hoveredNodeId) {
      const edgeMeshes: THREE.Mesh[] = [];
      const edgeIdMap = new Map<THREE.Mesh, string>();

      for (const edge of this.graph.edges.values()) {
        if (edge.tubeMesh && edge.state !== 'leaving') {
          edgeMeshes.push(edge.tubeMesh);
          edgeIdMap.set(edge.tubeMesh, edge.id);
        }
      }

      const edgeIntersects = this.raycaster.intersectObjects(edgeMeshes);

      if (edgeIntersects.length > 0) {
        const mesh = edgeIntersects[0].object as THREE.Mesh;
        const edgeId = edgeIdMap.get(mesh);

        if (edgeId && this.hoveredEdgeId !== edgeId) {
          if (this.hoveredEdgeId) {
            this.graph.setEdgeHighlighted(this.hoveredEdgeId, false);
          }
          this.hoveredEdgeId = edgeId;
          this.graph.setEdgeHighlighted(edgeId, true);
          this.particleSystem.setHoveredEdge(edgeId);
        }

        if (edgeId) {
          this.showEdgeLoadLabel(edgeId, event.clientX, event.clientY);
        }

        if (this.hoveredNodeId === null) {
          document.body.style.cursor = 'pointer';
        }
      } else {
        if (this.hoveredEdgeId) {
          this.graph.setEdgeHighlighted(this.hoveredEdgeId, false);
          this.hoveredEdgeId = null;
          this.particleSystem.setHoveredEdge(null);
        }
        this.edgeLoadLabel.style.display = 'none';

        if (!this.hoveredNodeId) {
          document.body.style.cursor = 'default';
        }
      }
    } else {
      if (this.hoveredEdgeId) {
        this.graph.setEdgeHighlighted(this.hoveredEdgeId, false);
        this.hoveredEdgeId = null;
        this.particleSystem.setHoveredEdge(null);
      }
      this.edgeLoadLabel.style.display = 'none';
    }
  }

  private showNodeInfoPanel(nodeId: string, screenX: number, screenY: number): void {
    const node = this.graph.getNodeById(nodeId);
    if (!node) return;

    const panel = this.nodeInfoPanel;
    const titleEl = document.getElementById('info-title');
    const typeEl = document.getElementById('info-type');
    const ipEl = document.getElementById('info-ip');
    const rateEl = document.getElementById('info-rate');
    const connEl = document.getElementById('info-conn');

    if (titleEl) titleEl.textContent = node.name;
    if (typeEl) typeEl.textContent = this.getNodeTypeName(node.type);
    if (ipEl) ipEl.textContent = node.ip;
    if (rateEl) rateEl.textContent = `${node.processingRate} Mbps`;
    if (connEl) connEl.textContent = String(node.connections);

    const panelWidth = 220;
    const panelHeight = 140;
    let left = screenX + 15;
    let top = screenY - panelHeight - 30;

    if (left + panelWidth > window.innerWidth - 10) {
      left = screenX - panelWidth - 15;
    }
    if (top < 10) {
      top = screenY + 15;
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.display = 'block';
  }

  private getNodeTypeName(type: string): string {
    const names: Record<string, string> = {
      router: '路由器',
      server: '服务器',
      terminal: '终端'
    };
    return names[type] || type;
  }

  private showEdgeLoadLabel(edgeId: string, screenX: number, screenY: number): void {
    const edge = this.graph.getEdgeById(edgeId);
    if (!edge) return;

    const label = this.edgeLoadLabel;
    const valueEl = document.getElementById('load-value');
    const barEl = document.getElementById('load-bar');

    const loadPercent = Math.round(edge.load * 100);
    if (valueEl) valueEl.textContent = `${loadPercent}%`;
    if (barEl) barEl.style.width = `${loadPercent}%`;

    let left = screenX + 15;
    let top = screenY - 35;

    if (left + 120 > window.innerWidth - 10) {
      left = screenX - 135;
    }
    if (top < 10) {
      top = screenY + 15;
    }

    label.style.left = `${left}px`;
    label.style.top = `${top}px`;
    label.style.display = 'block';
  }

  private onClick(event: MouseEvent): void {
    if (event.target !== this.renderer.domElement) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const nodeMeshes: THREE.Mesh[] = [];
    const nodeIdMap = new Map<THREE.Mesh, string>();

    for (const node of this.graph.nodes.values()) {
      if (node.mesh && node.state !== 'leaving' && node.state !== 'entering') {
        nodeMeshes.push(node.mesh);
        nodeIdMap.set(node.mesh, node.id);
      }
    }

    const intersects = this.raycaster.intersectObjects(nodeMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const nodeId = nodeIdMap.get(mesh);

      if (nodeId) {
        if (this.selectedNodeId === nodeId) {
          this.deselectNode();
        } else {
          this.selectNode(nodeId);
        }
      }
    } else if (this.selectedNodeId) {
      this.deselectNode();
    }
  }

  private selectNode(nodeId: string): void {
    this.selectedNodeId = nodeId;
    this.graph.selectNode(nodeId);
    this.particleSystem.setSelectedNode(nodeId);

    const node = this.graph.getNodeById(nodeId);
    if (!node || !node.mesh) return;

    const nodePos = node.mesh.position.clone();
    const dist = this.camera.position.distanceTo(nodePos);
    const targetDist = Math.min(Math.max(dist * 0.5, 8), 20);

    const dir = this.camera.position.clone().sub(nodePos).normalize();
    this.cameraStartPos.copy(this.camera.position);
    this.cameraTargetPos.copy(nodePos).add(dir.multiplyScalar(targetDist));

    this.cameraTransitionProgress = 0;
    this.cameraTransitioning = true;
    this.autoRotateTarget = nodePos.clone();
  }

  private deselectNode(): void {
    this.selectedNodeId = null;
    this.graph.selectNode(null);
    this.particleSystem.setSelectedNode(null);
    this.autoRotateActive = false;
    this.cameraTransitioning = false;
    this.autoRotateTarget = null;

    this.controls.enableDamping = true;
    this.controls.autoRotate = false;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.deselectNode();
    }
    if (event.key === 't' || event.key === 'T') {
      this.toggleStressTest();
    }
  }

  private toggleStressTest(): void {
    this.stressTestMode = !this.stressTestMode;
    if (this.stressTestMode) {
      while (this.graph.nodes.size < 50) {
        this.graph.addRandomNode();
      }
      console.log('压力测试模式开启: 50节点');
    } else {
      console.log('压力测试模式关闭');
    }
  }

  private animate(time: number): void {
    requestAnimationFrame(this.animate);

    const delta = time - this.lastTime;
    this.lastTime = time;

    this.updateFPS(time);

    if (this.cameraTransitioning) {
      this.cameraTransitionProgress += delta * 0.002;
      if (this.cameraTransitionProgress >= 1) {
        this.cameraTransitionProgress = 1;
        this.cameraTransitioning = false;
        this.autoRotateActive = true;
      }

      const t = this.easeInOutCubic(this.cameraTransitionProgress);
      this.camera.position.lerpVectors(this.cameraStartPos, this.cameraTargetPos, t);

      if (this.autoRotateTarget) {
        this.controls.target.lerp(this.autoRotateTarget, 0.1);
      }
    }

    if (this.autoRotateActive && !this.cameraTransitioning && this.autoRotateTarget) {
      const radius = this.camera.position.distanceTo(this.autoRotateTarget);
      const angle = time * 0.0003 * this.autoRotateSpeed;
      const height = this.autoRotateTarget.y + 3;

      this.camera.position.x = this.autoRotateTarget.x + Math.cos(angle) * radius;
      this.camera.position.z = this.autoRotateTarget.z + Math.sin(angle) * radius;
      this.camera.position.y = height + Math.sin(time * 0.0001) * 1;
      this.camera.lookAt(this.autoRotateTarget);
    } else {
      this.controls.update();
    }

    this.starField.rotation.y += delta * 0.00002;

    this.graph.update(delta);
    this.particleSystem.update(delta);

    this.topologyTimer += delta;
    if (this.topologyTimer >= this.topologyInterval) {
      this.topologyTimer = 0;
      this.updateTopology();
    }

    this.composer.render();

    this.updateMonitorPanel();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updateFPS(time: number): void {
    this.fpsFrames++;
    if (time - this.fpsLastUpdate >= 1000) {
      this.fps = Math.round(this.fpsFrames * 1000 / (time - this.fpsLastUpdate));
      this.fpsFrames = 0;
      this.fpsLastUpdate = time;
    }
  }

  private updateTopology(): void {
    const shouldAdd = Math.random() > 0.4 || this.graph.nodes.size < 10;

    if (shouldAdd && this.graph.nodes.size < 60) {
      this.graph.addRandomNode();
    } else if (!shouldAdd && this.graph.nodes.size > 8) {
      this.graph.removeRandomNode();
    }

    this.graph.scheduleLayout();
  }

  private updateMonitorPanel(): void {
    const fpsEl = document.getElementById('fps-value');
    const collapsedFpsEl = document.getElementById('collapsed-fps-num');
    const nodeEl = document.getElementById('node-count');
    const edgeEl = document.getElementById('edge-count');
    const latencyEl = document.getElementById('avg-latency');
    const particleEl = document.getElementById('particle-count');

    const fpsStr = String(this.fps);

    if (fpsEl) {
      fpsEl.textContent = fpsStr;
      fpsEl.classList.remove('low', 'medium', 'high');
      if (this.fps < 30) {
        fpsEl.classList.add('low');
        this.monitorPanel.classList.add('warning');
      } else if (this.fps < 45) {
        fpsEl.classList.add('medium');
        this.monitorPanel.classList.remove('warning');
      } else {
        fpsEl.classList.add('high');
        this.monitorPanel.classList.remove('warning');
      }
    }

    if (collapsedFpsEl) {
      collapsedFpsEl.textContent = fpsStr;
      collapsedFpsEl.classList.remove('low', 'medium', 'high');
      if (this.fps < 30) {
        collapsedFpsEl.classList.add('low');
      } else if (this.fps < 45) {
        collapsedFpsEl.classList.add('medium');
      } else {
        collapsedFpsEl.classList.add('high');
      }
    }

    if (nodeEl) nodeEl.textContent = String(this.graph.nodes.size);
    if (edgeEl) edgeEl.textContent = String(this.graph.edges.size);
    if (latencyEl) latencyEl.textContent = `${this.graph.getAverageLatency()}ms`;
    if (particleEl) particleEl.textContent = String(this.particleSystem.getActiveParticleCount());
  }

  public dispose(): void {
    this.graph.dispose();
    this.particleSystem.dispose();
    this.renderer.dispose();
    this.composer.dispose();
  }
}

const app = new App();
(window as any).app = app;
