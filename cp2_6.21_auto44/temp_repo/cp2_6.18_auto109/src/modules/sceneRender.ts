import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PipeData, CollisionPair, PipeType } from '../types';
import { PIPE_COLORS, PIPE_LABELS, PIPE_ABBR } from '../types';
import { usePipeStore } from '../store';

const HOVER_TRANSITION_MS = 200;
const BLINK_PERIOD_S = 1.0;
const COLLISION_SPHERE_RADIUS = 0.4;

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private clock: THREE.Clock;

  private pipeMeshes: Map<string, THREE.Mesh> = new Map();
  private pipeMaterials: Map<string, THREE.MeshPhongMaterial> = new Map();
  private pipeTypeLookup: Map<string, PipeType> = new Map();
  private collisionMarkers: THREE.Mesh[] = [];
  private collisionMarkerGroup: THREE.Group;

  private hoveredPipeId: string | null = null;
  private hoverTransition: Map<string, { start: number; from: number; to: number }> = new Map();

  private initialCameraPosition = new THREE.Vector3(8, 6, 10);
  private initialCameraTarget = new THREE.Vector3(0, -2, 0);

  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseClickBound: (e: MouseEvent) => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0F1E);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.initialCameraPosition);
    this.camera.lookAt(this.initialCameraTarget);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.initialCameraTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.update();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.collisionMarkerGroup = new THREE.Group();
    this.scene.add(this.collisionMarkerGroup);

    this.setupLighting();
    this.addGridHelper();

    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseClickBound = this.onMouseClick.bind(this);
    this.onKeyDownBound = this.onKeyDown.bind(this);

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMoveBound);
    this.renderer.domElement.addEventListener('click', this.onMouseClickBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x404060, 1.2);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 15, 10);
    this.scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x8888ff, 0.4);
    dirLight2.position.set(-10, 5, -10);
    this.scene.add(dirLight2);
  }

  private addGridHelper(): void {
    const grid = new THREE.GridHelper(20, 20, 0x1a2744, 0x111833);
    grid.position.y = 0;
    this.scene.add(grid);
  }

  private createPipeMesh(pipe: PipeData): THREE.Mesh {
    const startVec = new THREE.Vector3(pipe.start.x, pipe.start.y, pipe.start.z);
    const endVec = new THREE.Vector3(pipe.end.x, pipe.end.y, pipe.end.z);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();

    const geometry = new THREE.CylinderGeometry(pipe.radius, pipe.radius, length, 16, 1, false);

    const color = PIPE_COLORS[pipe.type];
    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      shininess: 80,
      specular: 0x444444,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    mesh.position.copy(midPoint);

    const yAxis = new THREE.Vector3(0, 1, 0);
    const normalized = direction.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, normalized);
    mesh.quaternion.copy(quaternion);

    mesh.userData = { pipeId: pipe.id };

    this.pipeMeshes.set(pipe.id, mesh);
    this.pipeMaterials.set(pipe.id, material);
    this.pipeTypeLookup.set(pipe.id, pipe.type);
    this.scene.add(mesh);

    return mesh;
  }

  private createCollisionMarker(point: { x: number; y: number; z: number }): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(COLLISION_SPHERE_RADIUS, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xFF1744,
      transparent: true,
      opacity: 0.7,
      emissive: 0xFF1744,
      emissiveIntensity: 0.5,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(point.x, point.y, point.z);
    mesh.userData.isCollisionMarker = true;

    this.collisionMarkerGroup.add(mesh);
    this.collisionMarkers.push(mesh);

    return mesh;
  }

  updatePipes(pipes: PipeData[]): void {
    const currentIds = new Set(pipes.map((p) => p.id));

    for (const [id, mesh] of this.pipeMeshes) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.pipeMeshes.delete(id);
        this.pipeMaterials.delete(id);
        this.pipeTypeLookup.delete(id);
      }
    }

    for (const pipe of pipes) {
      if (!this.pipeMeshes.has(pipe.id)) {
        this.createPipeMesh(pipe);
      } else {
        const mesh = this.pipeMeshes.get(pipe.id)!;
        const startVec = new THREE.Vector3(pipe.start.x, pipe.start.y, pipe.start.z);
        const endVec = new THREE.Vector3(pipe.end.x, pipe.end.y, pipe.end.z);
        const direction = new THREE.Vector3().subVectors(endVec, startVec);
        const length = direction.length();

        const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
        mesh.position.copy(midPoint);

        const yAxis = new THREE.Vector3(0, 1, 0);
        const normalized = direction.clone().normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, normalized);
        mesh.quaternion.copy(quaternion);

        const oldGeom = mesh.geometry as THREE.CylinderGeometry;
        const newGeom = new THREE.CylinderGeometry(pipe.radius, pipe.radius, length, 16, 1, false);
        mesh.geometry = newGeom;
        oldGeom.dispose();
      }
    }
  }

  updateCollisions(collisions: CollisionPair[], showMarkers: boolean): void {
    for (const marker of this.collisionMarkers) {
      this.collisionMarkerGroup.remove(marker);
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
    }
    this.collisionMarkers = [];

    if (showMarkers) {
      for (const collision of collisions) {
        this.createCollisionMarker(collision.closestPoint);
      }
    }

    this.updateCollisionPanel(collisions);
  }

  private updateCollisionPanel(collisions: CollisionPair[]): void {
    const listEl = document.getElementById('collision-list');
    if (!listEl) return;

    if (collisions.length === 0) {
      listEl.innerHTML = '<div class="no-collisions">暂无冲突</div>';
      return;
    }

    listEl.innerHTML = collisions
      .map((c) => {
        const abbrA = PIPE_ABBR[c.pipeA.type];
        const abbrB = PIPE_ABBR[c.pipeB.type];
        return `<div class="collision-row">
          <span class="collision-pair">${abbrA}-${abbrB}</span>
          <span class="collision-dist">${c.minDistance.toFixed(2)}m</span>
        </div>`;
      })
      .join('');
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const pipeMeshArray = Array.from(this.pipeMeshes.values());
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(pipeMeshArray);

    const hoverLabel = document.getElementById('hover-label')!;

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const pipeId = hit.userData.pipeId as string;

      if (this.hoveredPipeId !== pipeId) {
        this.hoveredPipeId = pipeId;
        usePipeStore.getState().setHoveredPipe(
          usePipeStore.getState().pipes.find((p) => p.id === pipeId) ?? null
        );
      }

      const pipe = usePipeStore.getState().pipes.find((p) => p.id === pipeId);
      if (pipe) {
        hoverLabel.innerHTML = `${PIPE_LABELS[pipe.type]} | 管径: ${pipe.radius}m`;
        hoverLabel.style.left = `${event.clientX + 16}px`;
        hoverLabel.style.top = `${event.clientY - 10}px`;
        hoverLabel.classList.add('visible');
      }
    } else {
      if (this.hoveredPipeId !== null) {
        this.hoveredPipeId = null;
        usePipeStore.getState().setHoveredPipe(null);
      }
      hoverLabel.classList.remove('visible');
    }
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const pipeMeshArray = Array.from(this.pipeMeshes.values());
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(pipeMeshArray);

    const panel = document.getElementById('property-panel')!;

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const pipeId = hit.userData.pipeId as string;
      const pipe = usePipeStore.getState().pipes.find((p) => p.id === pipeId);
      if (pipe) {
        usePipeStore.getState().setSelectedPipe(pipe);
        this.showPropertyPanel(pipe);
      }
    } else {
      usePipeStore.getState().setSelectedPipe(null);
      panel.classList.remove('visible');
    }
  }

  private showPropertyPanel(pipe: PipeData): void {
    const panel = document.getElementById('property-panel')!;
    const title = document.getElementById('prop-title')!;
    const content = document.getElementById('prop-content')!;

    const colorHex = '#' + PIPE_COLORS[pipe.type].toString(16).padStart(6, '0');
    title.innerHTML = `<span style="color:${colorHex}">●</span> ${PIPE_LABELS[pipe.type]}`;

    const store = usePipeStore.getState();
    const conflicts = store.collisions.filter(
      (c) => c.pipeA.id === pipe.id || c.pipeB.id === pipe.id
    );

    content.innerHTML = `
      <div class="prop-row"><span class="prop-label">类型</span><span class="prop-value">${PIPE_LABELS[pipe.type]}</span></div>
      <div class="prop-row"><span class="prop-label">起点</span><span class="prop-value">(${pipe.start.x}, ${pipe.start.y}, ${pipe.start.z})</span></div>
      <div class="prop-row"><span class="prop-label">终点</span><span class="prop-value">(${pipe.end.x}, ${pipe.end.y}, ${pipe.end.z})</span></div>
      <div class="prop-row"><span class="prop-label">管径</span><span class="prop-value">${pipe.radius}m</span></div>
      <div class="prop-row"><span class="prop-label">埋深</span><span class="prop-value">${pipe.depth}m</span></div>
      ${conflicts.length > 0 ? `
        <div class="panel-section-title">冲突管线</div>
        ${conflicts
          .map((c) => {
            const other = c.pipeA.id === pipe.id ? c.pipeB : c.pipeA;
            return `<div class="conflict-item">${PIPE_LABELS[other.type]} (${c.minDistance.toFixed(2)}m)</div>`;
          })
          .join('')}
      ` : ''}
    `;

    panel.classList.add('visible');
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      usePipeStore.getState().setSelectedPipe(null);
      const panel = document.getElementById('property-panel')!;
      panel.classList.remove('visible');
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  resetCamera(): void {
    this.camera.position.copy(this.initialCameraPosition);
    this.controls.target.copy(this.initialCameraTarget);
    this.controls.update();
  }

  render(): void {
    const elapsed = this.clock.getElapsedTime();

    this.controls.update();
    this.updateHoverTransition(elapsed);
    this.updateCollisionBlink(elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private updateHoverTransition(elapsed: number): void {
    for (const [id, mat] of this.pipeMaterials) {
      const isHovered = this.hoveredPipeId === id;
      const targetOpacity = isHovered ? 1.0 : 0.65;

      if (!this.hoverTransition.has(id)) {
        this.hoverTransition.set(id, {
          start: elapsed,
          from: mat.opacity,
          to: targetOpacity,
        });
      }

      const transition = this.hoverTransition.get(id)!;
      if (transition.to !== targetOpacity) {
        transition.from = mat.opacity;
        transition.start = elapsed;
        transition.to = targetOpacity;
      }

      const progress = Math.min((elapsed - transition.start) / (HOVER_TRANSITION_MS / 1000), 1);
      mat.opacity = transition.from + (transition.to - transition.from) * this.easeOutCubic(progress);

      if (isHovered) {
        const pipeType = this.pipeTypeLookup.get(id);
        const baseColor = pipeType ? PIPE_COLORS[pipeType] : 0xffffff;
        mat.emissive.setHex(baseColor);
        mat.emissiveIntensity = 0.3;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  }

  private updateCollisionBlink(elapsed: number): void {
    const blinkPhase = (elapsed % BLINK_PERIOD_S) / BLINK_PERIOD_S;
    const blinkValue = Math.sin(blinkPhase * Math.PI * 2) * 0.5 + 0.5;

    for (const marker of this.collisionMarkers) {
      const mat = marker.material as THREE.MeshPhongMaterial;
      mat.opacity = 0.3 + blinkValue * 0.5;
      mat.emissiveIntensity = 0.2 + blinkValue * 0.8;
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  dispose(): void {
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMoveBound);
    this.renderer.domElement.removeEventListener('click', this.onMouseClickBound);
    window.removeEventListener('keydown', this.onKeyDownBound);

    for (const [, mesh] of this.pipeMeshes) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    for (const marker of this.collisionMarkers) {
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
  }
}
