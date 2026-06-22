import * as THREE from 'three';
import { EditOperation } from './TerrainEditor';

export interface TerrainRendererOptions {
  size: number;
  container: HTMLElement;
}

interface AnimationState {
  active: boolean;
  startTime: number;
  duration: number;
  affectedVertices: number[];
  startPositions: Float32Array;
  targetPositions: Float32Array;
  flashVertices: Set<number>;
  flashStartTime: number;
  flashDuration: number;
}

class TerrainRenderer {
  private size: number;
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrainMesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshStandardMaterial;

  private isLeftDown = false;
  private isRightDown = false;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private theta = Math.PI / 4;
  private phi = Math.PI / 3;
  private distance = Math.sqrt(30 * 30 + 20 * 20 + 30 * 30);
  private minDistance = 5;
  private maxDistance = 50;
  private panOffsetX = 0;
  private panOffsetZ = 0;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationFrameId: number | null = null;

  private positionAnimation: AnimationState | null = null;
  private colorAnimation: { active: boolean; startTime: number; duration: number; vertices: Set<number> } | null = null;

  private minHeight = 0;
  private maxHeight = 0;

  private onTerrainClickCallback: ((gridX: number, gridZ: number) => void) | null = null;
  private onTerrainDragCallback: ((gridX: number, gridZ: number) => void) | null = null;

  constructor(options: TerrainRendererOptions) {
    this.size = options.size;
    this.container = options.container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.geometry = new THREE.PlaneGeometry(this.size - 1, this.size - 1, this.size - 1, this.size - 1);
    this.geometry.rotateX(-Math.PI / 2);

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    positionAttr.setUsage(THREE.DynamicDrawUsage);

    const colors = new Float32Array(this.size * this.size * 3);
    for (let i = 0; i < this.size * this.size; i++) {
      colors[i * 3] = 0.05;
      colors[i * 3 + 1] = 0.28;
      colors[i * 3 + 2] = 0.63;
    }
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('color', colorAttr);

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.terrainMesh = new THREE.Mesh(this.geometry, this.material);
    this.terrainMesh.castShadow = true;
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    this.scene.add(directionalLight);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.updateCameraPosition();
    this.updateNormals();
    this.setupEventListeners();
    this.animate();
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.lastMouseX = e.clientX - rect.left;
    this.lastMouseY = e.clientY - rect.top;

    if (e.button === 0) {
      this.isLeftDown = true;
      const result = this.getIntersectedVertex(e.clientX, e.clientY);
      if (result) {
        if (this.onTerrainClickCallback) {
          this.onTerrainClickCallback(result.gridX, result.gridZ);
        }
      }
    } else if (e.button === 2) {
      this.isRightDown = true;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const deltaX = x - this.lastMouseX;
    const deltaY = y - this.lastMouseY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      this.isDragging = true;
    }

    if (this.isLeftDown && this.isDragging) {
      this.theta -= deltaX * 0.01;
      this.updateCameraPosition();
    } else if (this.isRightDown) {
      const right = new THREE.Vector3();
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const panSpeed = this.distance * 0.002;
      this.panOffsetX += -deltaX * right.x * panSpeed + deltaX * forward.x * panSpeed;
      this.panOffsetZ += -deltaX * right.z * panSpeed + deltaX * forward.z * panSpeed;
      this.panOffsetX += deltaY * right.x * panSpeed * 0;
      this.panOffsetZ += deltaY * right.z * panSpeed * 0;

      const panVec = new THREE.Vector3()
        .addScaledVector(right, -deltaX * panSpeed)
        .addScaledVector(forward, deltaY * panSpeed);
      this.panOffsetX += panVec.x;
      this.panOffsetZ += panVec.z;

      this.updateCameraPosition();
    } else if (this.isLeftDown && !this.isDragging) {
      const result = this.getIntersectedVertex(e.clientX, e.clientY);
      if (result && this.onTerrainDragCallback) {
        this.onTerrainDragCallback(result.gridX, result.gridZ);
      }
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.isLeftDown = false;
    } else if (e.button === 2) {
      this.isRightDown = false;
    }
    setTimeout(() => {
      this.isDragging = false;
    }, 50);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomSpeed = 0.001;
    this.distance += e.deltaY * zoomSpeed * this.distance;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    this.updateCameraPosition();
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private updateCameraPosition(): void {
    const x = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z = this.distance * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.position.set(
      x + this.panOffsetX,
      y,
      z + this.panOffsetZ
    );
    this.camera.lookAt(this.panOffsetX, 0, this.panOffsetZ);
  }

  private getIntersectedVertex(clientX: number, clientY: number): { gridX: number; gridZ: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.terrainMesh);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const halfSize = (this.size - 1) / 2;
      const gridX = Math.round(point.x + halfSize);
      const gridZ = Math.round(point.z + halfSize);

      if (gridX >= 0 && gridX < this.size && gridZ >= 0 && gridZ < this.size) {
        return { gridX, gridZ };
      }
    }
    return null;
  }

  onTerrainClick(callback: (gridX: number, gridZ: number) => void): void {
    this.onTerrainClickCallback = callback;
  }

  onTerrainDrag(callback: (gridX: number, gridZ: number) => void): void {
    this.onTerrainDragCallback = callback;
  }

  updateHeights(heights: Float32Array, animate: boolean = true): void {
    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;

    if (animate && this.positionAnimation && this.positionAnimation.active) {
      for (const vi of this.positionAnimation.affectedVertices) {
        positions[vi * 3 + 1] = this.positionAnimation.targetPositions[vi];
      }
      this.positionAnimation.active = false;
    }

    let minH = Infinity;
    let maxH = -Infinity;
    for (let i = 0; i < heights.length; i++) {
      minH = Math.min(minH, heights[i]);
      maxH = Math.max(maxH, heights[i]);
    }
    this.minHeight = minH;
    this.maxHeight = maxH;

    if (animate) {
      const affectedVertices: number[] = [];
      const startPositions = new Float32Array(this.size * this.size);
      const targetPositions = new Float32Array(this.size * this.size);

      for (let i = 0; i < heights.length; i++) {
        const currentY = positions[i * 3 + 1];
        const targetY = heights[i];
        if (Math.abs(currentY - targetY) > 0.0001) {
          affectedVertices.push(i);
          startPositions[i] = currentY;
          targetPositions[i] = targetY;
        }
      }

      if (affectedVertices.length > 0) {
        this.positionAnimation = {
          active: true,
          startTime: performance.now(),
          duration: 200,
          affectedVertices,
          startPositions,
          targetPositions,
          flashVertices: new Set(affectedVertices),
          flashStartTime: performance.now(),
          flashDuration: 300,
        };
      } else {
        for (let i = 0; i < heights.length; i++) {
          positions[i * 3 + 1] = heights[i];
        }
        positionAttr.needsUpdate = true;
        this.updateColors();
        this.updateNormals();
      }
    } else {
      for (let i = 0; i < heights.length; i++) {
        positions[i * 3 + 1] = heights[i];
      }
      positionAttr.needsUpdate = true;
      this.updateColors();
      this.updateNormals();
    }
  }

  flashVertices(vertices: number[]): void {
    this.colorAnimation = {
      active: true,
      startTime: performance.now(),
      duration: 300,
      vertices: new Set(vertices),
    };
  }

  private updateColors(): void {
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const colors = colorAttr.array as Float32Array;
    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;

    for (let i = 0; i < this.size * this.size; i++) {
      const height = positions[i * 3 + 1];
      const [r, g, b] = this.heightToColor(height);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    colorAttr.needsUpdate = true;
  }

  private heightToColor(height: number): [number, number, number] {
    const normalized = this.maxHeight === this.minHeight
      ? 0.5
      : (height - this.minHeight) / (this.maxHeight - this.minHeight);

    if (normalized < 0.2) {
      return [0.05, 0.28, 0.63];
    } else if (normalized < 0.4) {
      const t = (normalized - 0.2) / 0.2;
      return [
        0.05 + t * (0.30 - 0.05),
        0.28 + t * (0.69 - 0.28),
        0.63 + t * (0.31 - 0.63),
      ];
    } else if (normalized < 0.6) {
      const t = (normalized - 0.4) / 0.2;
      return [
        0.30 + t * (1.00 - 0.30),
        0.69 + t * (0.92 - 0.69),
        0.31 + t * (0.23 - 0.31),
      ];
    } else if (normalized < 0.8) {
      const t = (normalized - 0.6) / 0.2;
      return [
        1.00 + t * (1.00 - 1.00),
        0.92 + t * (0.60 - 0.92),
        0.23 + t * (0.00 - 0.23),
      ];
    } else {
      const t = (normalized - 0.8) / 0.2;
      return [
        1.00 + t * (1.00 - 1.00),
        0.60 + t * (1.00 - 0.60),
        0.00 + t * (1.00 - 0.00),
      ];
    }
  }

  private updateNormals(): void {
    this.geometry.computeVertexNormals();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const now = performance.now();

    if (this.positionAnimation && this.positionAnimation.active) {
      const elapsed = now - this.positionAnimation.startTime;
      const progress = Math.min(elapsed / this.positionAnimation.duration, 1);
      const easedProgress = this.easeInOutCubic(progress);

      const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = positionAttr.array as Float32Array;

      for (const vi of this.positionAnimation.affectedVertices) {
        const startY = this.positionAnimation.startPositions[vi];
        const targetY = this.positionAnimation.targetPositions[vi];
        positions[vi * 3 + 1] = startY + (targetY - startY) * easedProgress;
      }
      positionAttr.needsUpdate = true;

      const flashElapsed = now - this.positionAnimation.flashStartTime;
      const flashProgress = Math.min(flashElapsed / this.positionAnimation.flashDuration, 1);
      const flashEased = flashProgress < 0.5 ? flashProgress * 2 : 2 - flashProgress * 2;

      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      const colors = colorAttr.array as Float32Array;
      const positionArr = positionAttr.array as Float32Array;

      for (const vi of this.positionAnimation.flashVertices) {
        const [r, g, b] = this.heightToColor(positionArr[vi * 3 + 1]);
        colors[vi * 3] = r + (1 - r) * flashEased;
        colors[vi * 3 + 1] = g + (1 - g) * flashEased;
        colors[vi * 3 + 2] = b + (1 - b) * flashEased;
      }
      colorAttr.needsUpdate = true;

      if (progress >= 1) {
        for (const vi of this.positionAnimation.affectedVertices) {
          const [r, g, b] = this.heightToColor(this.positionAnimation.targetPositions[vi]);
          colors[vi * 3] = r;
          colors[vi * 3 + 1] = g;
          colors[vi * 3 + 2] = b;
        }
        colorAttr.needsUpdate = true;
        this.updateNormals();
        this.positionAnimation.active = false;
      }
    }

    if (this.colorAnimation && this.colorAnimation.active) {
      const elapsed = now - this.colorAnimation.startTime;
      const progress = Math.min(elapsed / this.colorAnimation.duration, 1);
      const eased = progress < 0.5 ? progress * 2 : 2 - progress * 2;

      const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      const colors = colorAttr.array as Float32Array;
      const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = positionAttr.array as Float32Array;

      for (const vi of this.colorAnimation.vertices) {
        const [r, g, b] = this.heightToColor(positions[vi * 3 + 1]);
        colors[vi * 3] = r + (1 - r) * eased;
        colors[vi * 3 + 1] = g + (1 - g) * eased;
        colors[vi * 3 + 2] = b + (1 - b) * eased;
      }
      colorAttr.needsUpdate = true;

      if (progress >= 1) {
        for (const vi of this.colorAnimation.vertices) {
          const [r, g, b] = this.heightToColor(positions[vi * 3 + 1]);
          colors[vi * 3] = r;
          colors[vi * 3 + 1] = g;
          colors[vi * 3 + 2] = b;
        }
        colorAttr.needsUpdate = true;
        this.colorAnimation.active = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  animateOperation(operation: EditOperation): void {
    this.flashVertices(operation.affectedVertices);
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default TerrainRenderer;
