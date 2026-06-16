import * as THREE from 'three';
import {
  createRippleMesh,
  InkParticleSystem,
  createInkMarkSprite,
  InkStrokeParams
} from './inkEffect';

interface FingerTrajectoryPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

type RippleEntry = ReturnType<typeof createRippleMesh>;

export class PaintScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private brushMesh: THREE.Mesh | null = null;
  private paperPlane: THREE.Mesh | null = null;
  private devGrid: THREE.GridHelper | null = null;
  private inkMarks: THREE.Sprite[] = [];
  private ripples: RippleEntry[] = [];
  private particleSystem: InkParticleSystem;
  private animationFrameId: number = 0;
  private lastPoint: FingerTrajectoryPoint | null = null;
  private lastRippleTime: number = 0;
  private wasTouching: boolean = false;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private isClearing: boolean = false;
  private clearProgress: number = 0;
  private clearCenter: THREE.Vector2 = new THREE.Vector2(0, 0);
  public devMode: boolean = false;
  private onFpsUpdate?: (fps: number) => void;
  private mouseDrawing: boolean = false;
  private lastMousePoint: FingerTrajectoryPoint | null = null;

  constructor(container: HTMLElement, onFpsUpdate?: (fps: number) => void) {
    this.container = container;
    this.onFpsUpdate = onFpsUpdate;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false
    });
    this.particleSystem = new InkParticleSystem(this.scene);
    this.init();
  }

  private init(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0xf5f0e8, 1);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 45, 45);
    this.camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    this.scene.add(directionalLight);

    this.createPaperBackground();
    this.createBrushMesh();
    if (this.devMode) {
      this.createDevGrid();
    }
    this.setupMouseEvents();
    this.animate();
    window.addEventListener('resize', this.handleResize);
  }

  private createPaperBackground(): void {
    const paperSize = 120;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 512;
    noiseCanvas.height = 512;
    const ctx = noiseCanvas.getContext('2d')!;
    const imgData = ctx.createImageData(512, 512);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      imgData.data[i] = Math.min(255, Math.max(0, 245 + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, 240 + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, 232 + noise));
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const paperTexture = new THREE.CanvasTexture(noiseCanvas);
    paperTexture.wrapS = THREE.RepeatWrapping;
    paperTexture.wrapT = THREE.RepeatWrapping;
    paperTexture.repeat.set(4, 4);

    const paperGeo = new THREE.PlaneGeometry(paperSize, paperSize, 1, 1);
    const paperMat = new THREE.MeshBasicMaterial({
      map: paperTexture,
      color: 0xF5F0E8,
      side: THREE.DoubleSide
    });
    this.paperPlane = new THREE.Mesh(paperGeo, paperMat);
    this.paperPlane.rotation.x = -Math.PI / 2;
    this.paperPlane.position.y = 0;
    this.paperPlane.renderOrder = 0;
    this.scene.add(this.paperPlane);

    const borderMat = new THREE.LineBasicMaterial({ color: 0x4A4A4A, linewidth: 2 });
    const half = paperSize / 2;
    const borderPts = [
      new THREE.Vector3(-half, 0.002, -half),
      new THREE.Vector3(half, 0.002, -half),
      new THREE.Vector3(half, 0.002, half),
      new THREE.Vector3(-half, 0.002, half),
      new THREE.Vector3(-half, 0.002, -half)
    ];
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPts);
    const border = new THREE.Line(borderGeo, borderMat);
    this.scene.add(border);
  }

  private createBrushMesh(): void {
    const brushHeight = 6;
    const brushGeo = new THREE.ConeGeometry(1.2, brushHeight, 16);
    const brushMat = new THREE.MeshPhongMaterial({
      color: 0x000000,
      shininess: 30,
      transparent: true,
      opacity: 0.85
    });
    this.brushMesh = new THREE.Mesh(brushGeo, brushMat);
    this.brushMesh.rotation.x = Math.PI;
    this.brushMesh.position.set(0, brushHeight / 2 + 10, 0);
    this.brushMesh.visible = false;
    this.scene.add(this.brushMesh);
  }

  private createDevGrid(): void {
    this.devGrid = new THREE.GridHelper(120, 24, 0x888888, 0xcccccc);
    (this.devGrid.material as THREE.Material).transparent = true;
    (this.devGrid.material as THREE.Material).opacity = 0.35;
    this.devGrid.position.y = 0.005;
    this.scene.add(this.devGrid);
  }

  private setupMouseEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.mouseDrawing = true;
      const p = this.screenToWorld(e.clientX, e.clientY);
      if (p) {
        this.lastMousePoint = {
          x: p.x, y: 0.5, z: p.z,
          timestamp: performance.now()
        };
      }
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.mouseDrawing) return;
      const p = this.screenToWorld(e.clientX, e.clientY);
      if (p && this.lastMousePoint) {
        const point: FingerTrajectoryPoint = {
          x: p.x, y: 0.5, z: p.z,
          timestamp: performance.now()
        };
        this.processPoint(point);
        this.lastMousePoint = point;
      }
    });
    dom.addEventListener('pointerup', () => {
      this.mouseDrawing = false;
      this.lastMousePoint = null;
      this.wasTouching = false;
    });
    dom.addEventListener('pointerleave', () => {
      this.mouseDrawing = false;
      this.lastMousePoint = null;
      this.wasTouching = false;
    });
  }

  private screenToWorld(sx: number, sy: number): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((sx - rect.left) / rect.width) * 2 - 1,
      -((sy - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);
    return intersect;
  }

  public updateFingerPosition(point: FingerTrajectoryPoint | null): void {
    if (!point) {
      if (this.brushMesh) this.brushMesh.visible = false;
      this.lastPoint = null;
      this.wasTouching = false;
      return;
    }
    const worldPoint = this.normalizeFingerCoords(point);
    this.updateBrushMesh(worldPoint);
    this.processPoint(worldPoint);
    this.lastPoint = worldPoint;
  }

  private normalizeFingerCoords(p: FingerTrajectoryPoint): FingerTrajectoryPoint {
    const worldW = 100;
    const worldH = 70;
    const x = (0.5 - p.x) * worldW;
    const z = (p.y - 0.5) * worldH;
    const depthFactor = 1 + p.z * 1.5;
    const y = Math.max(0, (1 - depthFactor) * 12);
    return { x, y, z, timestamp: p.timestamp };
  }

  private updateBrushMesh(p: FingerTrajectoryPoint): void {
    if (!this.brushMesh) return;
    this.brushMesh.visible = true;
    const opacity = 0.3 + Math.min(0.6, (12 - p.y) / 12 * 0.6);
    (this.brushMesh.material as THREE.MeshPhongMaterial).opacity = opacity;
    this.brushMesh.position.set(p.x, p.y + 3, p.z);
    const scale = 0.8 + Math.min(0.8, (12 - p.y) / 12);
    this.brushMesh.scale.setScalar(scale);
  }

  private processPoint(p: FingerTrajectoryPoint): void {
    const now = performance.now();
    const touching = p.y < 2.0;

    if (touching && !this.wasTouching) {
      if (now - this.lastRippleTime > 300) {
        this.lastRippleTime = now;
        const ripple = createRippleMesh(new THREE.Vector3(p.x, 0, p.z), 50);
        this.scene.add(ripple.mesh);
        this.ripples.push(ripple);
        this.particleSystem.emit(new THREE.Vector3(p.x, 0.01, p.z), 12);
      }
    }
    this.wasTouching = touching;
    if (!touching) return;

    let speed = 8;
    if (this.lastPoint) {
      const dt = Math.max(1, p.timestamp - this.lastPoint.timestamp);
      const dx = p.x - this.lastPoint.x;
      const dz = p.z - this.lastPoint.z;
      speed = Math.sqrt(dx * dx + dz * dz) / dt * 1000;
      speed = Math.max(1, Math.min(30, speed));
    }

    let radius: number;
    if (speed < 5) radius = 2 + Math.random() * 3;
    else if (speed < 15) radius = 5 + Math.random() * 6;
    else radius = 12 + Math.random() * 8;

    const contactDepth = Math.max(0, 1 - p.y / 3);
    const opacity = 0.35 + contactDepth * 0.55;
    const markParams: InkStrokeParams = {
      radius,
      opacity,
      position: new THREE.Vector3(p.x, 0.015 + Math.random() * 0.01, p.z),
      speed
    };
    const sprite = createInkMarkSprite(markParams);
    this.scene.add(sprite);
    this.inkMarks.push(sprite);

    if (speed > 20 && Math.random() < 0.5) {
      this.particleSystem.emit(
        new THREE.Vector3(p.x, 0.01, p.z),
        Math.floor(2 + Math.random() * 3)
      );
    }
  }

  public triggerClearAnimation(): void {
    this.isClearing = true;
    this.clearProgress = 0;
  }

  private updateClearAnimation(delta: number): void {
    if (!this.isClearing) return;
    this.clearProgress += delta;
    const progress = Math.min(1, this.clearProgress / 0.8);
    const clearRadius = progress * 150;
    this.inkMarks = this.inkMarks.filter(sprite => {
      const dx = sprite.position.x - this.clearCenter.x;
      const dz = sprite.position.z - this.clearCenter.y;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < clearRadius) {
        (sprite.material as THREE.SpriteMaterial).opacity -= delta * 3;
        if ((sprite.material as THREE.SpriteMaterial).opacity <= 0) {
          this.scene.remove(sprite);
          sprite.material.dispose();
          if (sprite.material.map) sprite.material.map.dispose();
          return false;
        }
      }
      return true;
    });
    if (progress >= 1) {
      this.inkMarks.forEach(sprite => {
        this.scene.remove(sprite);
        sprite.material.dispose();
        if (sprite.material.map) sprite.material.map.dispose();
      });
      this.inkMarks = [];
      this.isClearing = false;
      this.clearProgress = 0;
    }
  }

  public captureScreenshot(): string | null {
    const w = 1920;
    const h = 1080;
    const prevW = this.renderer.domElement.width;
    const prevH = this.renderer.domElement.height;
    this.renderer.setSize(w, h, false);
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    this.renderer.setSize(prevW / this.renderer.getPixelRatio(), prevH / this.renderer.getPixelRatio(), false);
    return dataUrl;
  }

  public setDevMode(enabled: boolean): void {
    this.devMode = enabled;
    if (this.devMode && !this.devGrid) {
      this.createDevGrid();
    }
    if (this.devGrid) {
      this.devGrid.visible = enabled;
    }
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = (now - this.lastFpsTime) / 1000;
    this.frameCount++;
    if (delta >= 0.5) {
      const fps = Math.round(this.frameCount / delta);
      this.onFpsUpdate?.(fps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
    this.ripples = this.ripples.filter(r => {
      const elapsed = (now - r.startTime) / 1000;
      if (elapsed >= r.duration / 1000) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.material.dispose();
        return false;
      }
      r.material.uniforms.uTime.value = elapsed;
      return true;
    });
    this.particleSystem.update();
    this.updateClearAnimation(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private handleResize = (): void => {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.particleSystem.dispose();
    this.inkMarks.forEach(s => {
      s.material.dispose();
      if (s.material.map) s.material.map.dispose();
    });
    this.ripples.forEach(r => {
      r.mesh.geometry.dispose();
      r.material.dispose();
    });
    if (this.brushMesh) {
      this.brushMesh.geometry.dispose();
      (this.brushMesh.material as THREE.Material).dispose();
    }
    if (this.paperPlane) {
      this.paperPlane.geometry.dispose();
      const mat = this.paperPlane.material as THREE.MeshBasicMaterial;
      mat.dispose();
      if (mat.map) mat.map.dispose();
    }
    this.devGrid?.geometry.dispose();
    (this.devGrid?.material as THREE.Material)?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
