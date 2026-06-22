import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FossilFragment, SnapInfo } from './types';
import { SnapEngine } from './SnapEngine';

const GROUND_COLOR = 0xf5e6c8;
const GRID_COLOR = 0xcccccc;
const FRAGMENT_COLOR = 0xb0b0b0;
const HIGHLIGHT_COLOR = 0xffd700;
const SNAP_LINE_COLOR = 0x00ffff;
const TRAIL_COLOR = 0x87ceeb;

export interface SceneManagerCallbacks {
  onFragmentSelect: (id: string | null) => void;
  onSnapDetected: (info: SnapInfo | null) => void;
  onFragmentPositionUpdate: (
    id: string,
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number }
  ) => void;
  onFpsUpdate: (fps: number) => void;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private callbacks: SceneManagerCallbacks;

  private fragments: Map<string, THREE.Group> = new Map();
  private fragmentMeshes: Map<string, THREE.Mesh> = new Map();
  private fragmentEdges: Map<string, THREE.LineSegments> = new Map();
  private snapLine: THREE.Line | null = null;
  private trailPoints: THREE.Vector3[] = [];
  private trailLine: THREE.Line | null = null;
  private trailMaterial: THREE.LineBasicMaterial | null = null;

  private snapEngine: SnapEngine;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private groundPlane: THREE.Plane;

  private isDraggingScene = false;
  private isDraggingFragment = false;
  private draggedFragmentId: string | null = null;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  private dragPlane: THREE.Plane = new THREE.Plane();

  private isSimulating = false;
  private simulationTime = 0;
  private simulationStartPositions: Map<string, THREE.Vector3> = new Map();
  private simulationStartRotations: Map<string, THREE.Euler> = new Map();

  private animationId: number | null = null;
  private lastTime = performance.now();
  private frameCount = 0;
  private fpsUpdateTimer = 0;

  constructor(container: HTMLElement, callbacks: SceneManagerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.snapEngine = new SnapEngine();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GROUND_COLOR);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const dist = 15;
    const angle = (45 * Math.PI) / 180;
    this.camera.position.set(
      dist * Math.cos(angle),
      dist * Math.sin(angle),
      dist * Math.cos(angle)
    );
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    this.setupLighting();
    this.setupGround();
    this.setupSnapLine();
    this.setupTrailLine();
    this.setupEventListeners();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-8, 5, -8);
    this.scene.add(fillLight);
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: GROUND_COLOR,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(50, 50, GRID_COLOR, GRID_COLOR);
    const gridMaterial = (gridHelper as any).material || 
      (gridHelper.children[0] as THREE.LineSegments)?.material;
    if (gridMaterial) {
      const mat = Array.isArray(gridMaterial) ? gridMaterial[0] : gridMaterial;
      mat.opacity = 0.5;
      mat.transparent = true;
    }
    gridHelper.position.y = 0.001;
    this.scene.add(gridHelper);
  }

  private setupSnapLine(): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3()
    ]);
    const material = new THREE.LineBasicMaterial({
      color: SNAP_LINE_COLOR,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    this.snapLine = new THREE.Line(geometry, material);
    this.snapLine.visible = false;
    this.scene.add(this.snapLine);
  }

  private setupTrailLine(): void {
    this.trailPoints = [];
    const geometry = new THREE.BufferGeometry();
    this.trailMaterial = new THREE.LineBasicMaterial({
      color: TRAIL_COLOR,
      transparent: true,
      opacity: 0.8
    });
    this.trailLine = new THREE.Line(geometry, this.trailMaterial);
    this.trailLine.visible = false;
    this.scene.add(this.trailLine);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointerleave', this.onPointerUp);
    canvas.addEventListener('dragover', this.onDragOver);
    canvas.addEventListener('drop', this.onDrop);
    window.addEventListener('resize', this.onResize);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.fragmentMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const fragmentId = mesh.userData.fragmentId as string;

      if (fragmentId && !this.isSimulating) {
        this.controls.enabled = false;
        this.isDraggingFragment = true;
        this.draggedFragmentId = fragmentId;
        this.callbacks.onFragmentSelect(fragmentId);

        const intersectPoint = intersects[0].point;
        const group = this.fragments.get(fragmentId);
        if (group) {
          this.dragOffset.copy(group.position).sub(intersectPoint);
          this.dragPlane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            intersectPoint
          );
        }
        return;
      }
    }

    this.callbacks.onFragmentSelect(null);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDraggingFragment && this.draggedFragmentId) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersectPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint);

      const group = this.fragments.get(this.draggedFragmentId);
      if (group) {
        const newPos = intersectPoint.add(this.dragOffset);
        group.position.copy(newPos);

        this.callbacks.onFragmentPositionUpdate(
          this.draggedFragmentId,
          { x: newPos.x, y: newPos.y, z: newPos.z },
          {
            x: group.rotation.x,
            y: group.rotation.y,
            z: group.rotation.z
          }
        );
      }
    }
  };

  private onPointerUp = (): void => {
    if (this.isDraggingFragment && this.draggedFragmentId) {
      this.isDraggingFragment = false;
      this.draggedFragmentId = null;
      this.controls.enabled = true;
    }
  };

  private onDragOver = (e: DragEvent): void => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  };

  private onDrop = (e: DragEvent): void => {
    e.preventDefault();
    const fragmentId = e.dataTransfer?.getData('fragmentId');
    if (!fragmentId) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);

    this.onFragmentDropped(fragmentId, intersectPoint);
  };

  private onResize = (): void => {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  };

  onFragmentDropped(fragmentId: string, position: THREE.Vector3): void {
    const event = new CustomEvent('fragment-dropped', {
      detail: { fragmentId, position }
    });
    this.container.dispatchEvent(event);
  }

  addFragment(fragment: FossilFragment): void {
    const group = new THREE.Group();
    group.name = fragment.id;
    group.position.set(
      fragment.position.x,
      fragment.position.y,
      fragment.position.z
    );
    group.rotation.set(
      fragment.rotation.x,
      fragment.rotation.y,
      fragment.rotation.z
    );

    let geometry: THREE.BufferGeometry;
    const dims = fragment.dimensions;

    switch (fragment.geometryType) {
      case 'box':
        geometry = new THREE.BoxGeometry(dims.x, dims.y, dims.z);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          dims.x / 2,
          dims.z / 2,
          dims.y,
          8
        );
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(dims.x / 2, 8, 6);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(dims.x / 2, dims.y, 8);
        break;
      default:
        geometry = new THREE.BoxGeometry(dims.x, dims.y, dims.z);
    }

    const material = new THREE.MeshStandardMaterial({
      color: FRAGMENT_COLOR,
      roughness: 0.7,
      metalness: 0.3,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.fragmentId = fragment.id;
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: HIGHLIGHT_COLOR,
      linewidth: 2,
      transparent: true,
      opacity: 0
    });
    const edgeLine = new THREE.LineSegments(edges, edgeMaterial);
    group.add(edgeLine);

    this.scene.add(group);
    this.fragments.set(fragment.id, group);
    this.fragmentMeshes.set(fragment.id, mesh);
    this.fragmentEdges.set(fragment.id, edgeLine);
    this.snapEngine.registerFragment(fragment.id, group);
  }

  removeFragment(id: string): void {
    const group = this.fragments.get(id);
    if (group) {
      this.scene.remove(group);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.fragments.delete(id);
      this.fragmentMeshes.delete(id);
      this.fragmentEdges.delete(id);
      this.snapEngine.unregisterFragment(id);
    }
  }

  updateFragment(
    id: string,
    updates: Partial<{
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
    }>
  ): void {
    const group = this.fragments.get(id);
    if (!group) return;

    if (updates.position) {
      group.position.set(
        updates.position.x,
        updates.position.y,
        updates.position.z
      );
    }
    if (updates.rotation) {
      group.rotation.set(
        updates.rotation.x,
        updates.rotation.y,
        updates.rotation.z
      );
    }
  }

  highlightFragment(id: string | null): void {
    this.fragmentEdges.forEach((edge, fragId) => {
      const material = edge.material as THREE.LineBasicMaterial;
      material.opacity = fragId === id ? 1 : 0;
      material.needsUpdate = true;
    });
  }

  updateSnapLine(snapInfo: SnapInfo | null): void {
    if (!this.snapLine) return;

    if (snapInfo) {
      const positions = this.snapLine.geometry.attributes.position
        .array as Float32Array;
      positions[0] = snapInfo.snapPointA.x;
      positions[1] = snapInfo.snapPointA.y;
      positions[2] = snapInfo.snapPointA.z;
      positions[3] = snapInfo.snapPointB.x;
      positions[4] = snapInfo.snapPointB.y;
      positions[5] = snapInfo.snapPointB.z;
      this.snapLine.geometry.attributes.position.needsUpdate = true;
      this.snapLine.visible = true;

      if (this.draggedFragmentId) {
        const group = this.fragments.get(this.draggedFragmentId);
        if (group) {
          const shake = this.snapEngine.getShakeOffset(performance.now() / 1000);
          const originalPos = group.userData.originalPosition;
          if (originalPos) {
            group.position.x = originalPos.x + shake.x;
            group.position.y = originalPos.y + shake.y;
            group.position.z = originalPos.z + shake.z;
          }
        }
      }
    } else {
      this.snapLine.visible = false;
    }
  }

  storeOriginalPosition(id: string): void {
    const group = this.fragments.get(id);
    if (group) {
      group.userData.originalPosition = group.position.clone();
    }
  }

  applySnap(
    id: string,
    target: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
    }
  ): void {
    const group = this.fragments.get(id);
    if (!group) return;

    const startPos = group.position.clone();
    const startRot = group.rotation.clone();
    const endPos = new THREE.Vector3(
      target.position.x,
      target.position.y,
      target.position.z
    );
    const endRot = new THREE.Euler(
      target.rotation.x,
      target.rotation.y,
      target.rotation.z
    );

    const duration = 200;
    const startTime = performance.now();

    const animateSnap = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      group.position.lerpVectors(startPos, endPos, ease);
      group.rotation.x = startRot.x + (endRot.x - startRot.x) * ease;
      group.rotation.y = startRot.y + (endRot.y - startRot.y) * ease;
      group.rotation.z = startRot.z + (endRot.z - startRot.z) * ease;

      if (t < 1) {
        requestAnimationFrame(animateSnap);
      } else {
        this.callbacks.onFragmentPositionUpdate(
          id,
          target.position,
          target.rotation
        );
      }
    };

    animateSnap();
  }

  getSnapEngine(): SnapEngine {
    return this.snapEngine;
  }

  startSimulation(fragments: FossilFragment[]): void {
    if (this.isSimulating) return;

    this.isSimulating = true;
    this.simulationTime = 0;
    this.trailPoints = [];

    for (const fragment of fragments) {
      const group = this.fragments.get(fragment.id);
      if (group) {
        this.simulationStartPositions.set(
          fragment.id,
          group.position.clone()
        );
        this.simulationStartRotations.set(
          fragment.id,
          group.rotation.clone()
        );
      }
    }

    if (this.trailLine) {
      this.trailLine.visible = true;
    }
  }

  stopSimulation(): void {
    this.isSimulating = false;

    this.simulationStartPositions.forEach((pos, id) => {
      const group = this.fragments.get(id);
      if (group) {
        group.position.copy(pos);
      }
    });

    this.simulationStartRotations.forEach((rot, id) => {
      const group = this.fragments.get(id);
      if (group) {
        group.rotation.copy(rot);
      }
    });

    if (this.trailLine) {
      this.trailLine.visible = false;
    }
    this.trailPoints = [];
  }

  private updateSimulation(deltaTime: number): void {
    if (!this.isSimulating) return;

    this.simulationTime += deltaTime;
    const speed = 2;
    const stride = 0.02;
    const hipHeight = 2;

    const torso = this.fragments.get('torso');
    if (!torso) return;

    const basePos = this.simulationStartPositions.get('torso');
    if (!basePos) return;

    const forwardOffset = this.simulationTime * speed * 0.5;
    const bobOffset = Math.abs(Math.sin(this.simulationTime * speed)) * 0.1;

    torso.position.x = basePos.x;
    torso.position.y = basePos.y + bobOffset;
    torso.position.z = basePos.z - forwardOffset;

    const trailPos = new THREE.Vector3(
      torso.position.x,
      0.05,
      torso.position.z
    );

    if (
      this.trailPoints.length === 0 ||
      this.trailPoints[this.trailPoints.length - 1].distanceTo(trailPos) > 0.1
    ) {
      this.trailPoints.push(trailPos.clone());
      if (this.trailPoints.length > 200) {
        this.trailPoints.shift();
      }

      if (this.trailLine && this.trailMaterial) {
        this.trailLine.geometry.dispose();
        this.trailLine.geometry = new THREE.BufferGeometry().setFromPoints(
          this.trailPoints
        );
        const fadeStart = Math.max(0, this.trailPoints.length - 100);
        const colors = new Float32Array(this.trailPoints.length * 3);
        for (let i = 0; i < this.trailPoints.length; i++) {
          const alpha =
            i < fadeStart
              ? 0.1
              : 0.1 + ((i - fadeStart) / (this.trailPoints.length - fadeStart)) * 0.7;
          const color = new THREE.Color(TRAIL_COLOR);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }
      }
    }

    if (this.trailMaterial) {
      const age = (performance.now() % 3000) / 3000;
      this.trailMaterial.opacity = 0.8 - age * 0.7;
    }

    const legIds = [
      'leg_upper_L',
      'leg_lower_L',
      'leg_upper_R',
      'leg_lower_R',
      'arm_upper_L',
      'arm_lower_L',
      'arm_upper_R',
      'arm_lower_R'
    ];

    const phaseOffsets: Record<string, number> = {
      leg_upper_L: 0,
      leg_lower_L: 0,
      leg_upper_R: Math.PI,
      leg_lower_R: Math.PI,
      arm_upper_L: Math.PI,
      arm_lower_L: Math.PI,
      arm_upper_R: 0,
      arm_lower_R: 0
    };

    for (const id of legIds) {
      const group = this.fragments.get(id);
      const startRot = this.simulationStartRotations.get(id);
      const startPos = this.simulationStartPositions.get(id);

      if (group && startRot && startPos) {
        const phase = this.simulationTime * speed + (phaseOffsets[id] || 0);
        const legSwing = Math.sin(phase) * 0.5;
        const legLift = Math.max(0, Math.sin(phase)) * 0.3;

        if (id.includes('upper')) {
          group.rotation.x = startRot.x + legSwing;
          group.position.z = startPos.z - forwardOffset;
          group.position.y = startPos.y;
        } else {
          const kneeBend = Math.max(0, -Math.sin(phase)) * 0.4;
          group.rotation.x = startRot.x + kneeBend;
          group.position.z = startPos.z - forwardOffset;
        }
      }
    }

    const neckIds = ['neck1', 'neck2'];
    for (const id of neckIds) {
      const group = this.fragments.get(id);
      const startRot = this.simulationStartRotations.get(id);
      const startPos = this.simulationStartPositions.get(id);

      if (group && startRot && startPos) {
        const bob = Math.sin(this.simulationTime * speed * 2) * 0.05;
        group.position.z = startPos.z - forwardOffset;
        group.position.y = startPos.y + bob;
      }
    }

    const skull = this.fragments.get('skull');
    const skullStartPos = this.simulationStartPositions.get('skull');
    if (skull && skullStartPos) {
      const skullBob = Math.sin(this.simulationTime * speed * 2) * 0.08;
      skull.position.z = skullStartPos.z - forwardOffset;
      skull.position.y = skullStartPos.y + skullBob;
    }

    const tailIds = ['tail1', 'tail2'];
    for (let i = 0; i < tailIds.length; i++) {
      const group = this.fragments.get(tailIds[i]);
      const startPos = this.simulationStartPositions.get(tailIds[i]);
      if (group && startPos) {
        const tailSwing =
          Math.sin(this.simulationTime * speed * 1.5 + i * 0.3) * 0.2;
        group.position.z = startPos.z - forwardOffset;
        group.rotation.y = tailSwing;
      }
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.frameCount++;
    this.fpsUpdateTimer += deltaTime;
    if (this.fpsUpdateTimer >= 0.5) {
      const fps = Math.round(this.frameCount / this.fpsUpdateTimer);
      this.callbacks.onFpsUpdate(fps);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
    }

    this.controls.update();

    if (this.isSimulating) {
      this.updateSimulation(deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
  };

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.renderer.domElement.removeEventListener(
      'pointerdown',
      this.onPointerDown
    );
    this.renderer.domElement.removeEventListener(
      'pointermove',
      this.onPointerMove
    );
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener(
      'pointerleave',
      this.onPointerUp
    );
    this.renderer.domElement.removeEventListener('dragover', this.onDragOver);
    this.renderer.domElement.removeEventListener('drop', this.onDrop);
    window.removeEventListener('resize', this.onResize);

    this.fragments.forEach((_, id) => this.removeFragment(id));

    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
