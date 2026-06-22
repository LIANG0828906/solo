import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ColorMap, LightDataPoint, RenderMode } from "./types";
import { animate, easeInOutCubic, easeInOutSine, lerp } from "./utils/easing";
import { hexToThreeColor } from "./utils/colorMapper";

export interface SceneManagerCallbacks {
  onHover?: (point: LightDataPoint | null, screenPos: { x: number; y: number } | null) => void;
  onClick?: (point: LightDataPoint) => void;
}

const INITIAL_CAMERA_POS = new THREE.Vector3(0, 180, 220);
const INITIAL_TARGET = new THREE.Vector3(0, 0, 0);
const MAX_BAR_HEIGHT = 80;
const BAR_BASE_SIZE = 0.8;

export class SceneManager {
  private container: HTMLElement;
  private callbacks: SceneManagerCallbacks;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private mouseNDC = new THREE.Vector2();

  private data: LightDataPoint[] = [];
  private currentRenderMode: RenderMode = "bar";

  private barMesh!: THREE.InstancedMesh | null;
  private heatmapMesh!: THREE.InstancedMesh | null;
  private particles!: THREE.Points | null;
  private particleBasePositions!: Float32Array | null;
  private highlightInstance: number = -1;
  private baseDummy = new THREE.Object3D();
  private colorTmp = new THREE.Color();

  private ground!: THREE.Mesh;
  private grid!: THREE.GridHelper;
  private ambientLights: THREE.Light[] = [];

  private currentScale = 1;
  private currentOpacity = 1;
  private currentColorMap: ColorMap = "default";

  private rafId: number = 0;
  private disposed = false;
  private lastMouseMove = 0;
  private cancelAnim: (() => void) | null = null;
  private transitioning = false;

  private clock = new THREE.Clock();

  constructor(container: HTMLElement, callbacks: SceneManagerCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = this.createBackground();
    this.scene.fog = new THREE.FogExp2(0x0a192f, 0.0025);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.copy(INITIAL_CAMERA_POS);
    this.camera.lookAt(INITIAL_TARGET);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.copy(INITIAL_TARGET);

    this.setupLights();
    this.setupGround();
    this.bindEvents();
    this.animate();
  }

  private createBackground(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 512);
    gradient.addColorStop(0, "#0a192f");
    gradient.addColorStop(1, "#020c1b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x3a4a7a, 0.6);
    this.scene.add(ambient);
    this.ambientLights.push(ambient);

    const hemi = new THREE.HemisphereLight(0x5a6fb0, 0x0a0a1a, 0.4);
    this.scene.add(hemi);
    this.ambientLights.push(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.3);
    dir.position.set(100, 200, 100);
    this.scene.add(dir);
    this.ambientLights.push(dir);
  }

  private setupGround() {
    const planeGeo = new THREE.PlaneGeometry(280, 280, 1, 1);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1428,
      transparent: true,
      opacity: 0.6,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.ground = new THREE.Mesh(planeGeo, planeMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.01;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.grid = new THREE.GridHelper(260, 52, 0x1a2a4a, 0x1a2a4a);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.3;
    this.scene.add(this.grid);

    const innerGrid = new THREE.GridHelper(130, 26, 0x223456, 0x223456);
    (innerGrid.material as THREE.Material).transparent = true;
    (innerGrid.material as THREE.Material).opacity = 0.2;
    this.scene.add(innerGrid);
  }

  private bindEvents() {
    window.addEventListener("resize", this.handleResize);
    this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.addEventListener("click", this.handleClick);
  }

  private handleResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handlePointerMove = (ev: PointerEvent) => {
    this.lastMouseMove = performance.now();
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseNDC.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  };

  private handleClick = () => {
    const hit = this.raycastHit();
    if (hit && this.callbacks.onClick) {
      this.callbacks.onClick(hit);
    }
  };

  private raycastHit(): LightDataPoint | null {
    if (!this.data.length) return null;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const targets: THREE.Object3D[] = [];
    if (this.currentRenderMode === "bar" && this.barMesh) targets.push(this.barMesh);
    if (this.currentRenderMode === "heatmap" && this.heatmapMesh) targets.push(this.heatmapMesh);
    if (this.currentRenderMode === "particles" && this.particles) {
      this.raycaster.params.Points = { threshold: 1.5 };
      targets.push(this.particles);
    }
    if (!targets.length) return null;
    const hits = this.raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    const hit = hits[0];
    let idx = -1;
    if (typeof hit.instanceId === "number") {
      idx = hit.instanceId;
    } else if (typeof hit.index === "number") {
      idx = Math.floor(hit.index / (this.currentRenderMode === "particles" ? 1 : 1));
      if (this.currentRenderMode === "particles") idx = hit.index;
    }
    if (idx >= 0 && idx < this.data.length) {
      return this.data[idx];
    }
    return null;
  }

  private updateHoverHighlight() {
    if (!this.data.length) {
      if (this.callbacks.onHover) this.callbacks.onHover(null, null);
      return;
    }
    if (performance.now() - this.lastMouseMove > 80) return;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const targets: THREE.Object3D[] = [];
    if (this.currentRenderMode === "bar" && this.barMesh) targets.push(this.barMesh);
    if (this.currentRenderMode === "heatmap" && this.heatmapMesh) targets.push(this.heatmapMesh);
    if (this.currentRenderMode === "particles" && this.particles) {
      this.raycaster.params.Points = { threshold: 1.5 };
      targets.push(this.particles);
    }

    let newIdx = -1;
    if (targets.length) {
      const hits = this.raycaster.intersectObjects(targets, false);
      if (hits.length) {
        const hit = hits[0];
        if (typeof hit.instanceId === "number") newIdx = hit.instanceId;
        else if (typeof hit.index === "number" && this.currentRenderMode === "particles") newIdx = hit.index;

        if (newIdx >= 0 && newIdx < this.data.length) {
          const rect = this.renderer.domElement.getBoundingClientRect();
          const p = this.data[newIdx].position;
          const v = new THREE.Vector3(p.x, this.getInstanceHeight(newIdx) + 2, p.z);
          v.project(this.camera);
          const sx = (v.x * 0.5 + 0.5) * rect.width + rect.left;
          const sy = (-v.y * 0.5 + 0.5) * rect.height + rect.top;
          if (this.callbacks.onHover) {
            this.callbacks.onHover(this.data[newIdx], { x: sx, y: sy });
          }
        } else {
          newIdx = -1;
          if (this.callbacks.onHover) this.callbacks.onHover(null, null);
        }
      } else {
        if (this.callbacks.onHover) this.callbacks.onHover(null, null);
      }
    } else {
      if (this.callbacks.onHover) this.callbacks.onHover(null, null);
    }

    if (newIdx !== this.highlightInstance) {
      const prev = this.highlightInstance;
      this.highlightInstance = newIdx;
      this.applyHighlight(prev, false);
      this.applyHighlight(newIdx, true);
    }
  }

  private getInstanceHeight(idx: number): number {
    if (idx < 0 || idx >= this.data.length) return 0;
    return this.data[idx].normalizedIntensity * MAX_BAR_HEIGHT * this.currentScale;
  }

  private applyHighlight(idx: number, on: boolean) {
    if (idx < 0 || idx >= this.data.length) return;
    const mesh =
      this.currentRenderMode === "bar"
        ? this.barMesh
        : this.currentRenderMode === "heatmap"
          ? this.heatmapMesh
          : null;
    if (!mesh) return;
    const point = this.data[idx];
    const h = this.getInstanceHeight(idx);
    const size = BAR_BASE_SIZE * (on ? 1.3 : 1);
    this.baseDummy.position.set(point.position.x, h / 2, point.position.z);
    this.baseDummy.scale.set(size, h / (MAX_BAR_HEIGHT * this.currentScale) || 0.001, size);
    this.baseDummy.updateMatrix();
    mesh.setMatrixAt(idx, this.baseDummy.matrix);
    const c = hexToThreeColor(point.color);
    this.colorTmp.setHex(c);
    if (on) {
      this.colorTmp.offsetHSL(0, 0, 0.2);
    }
    mesh.setColorAt(idx, this.colorTmp);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  private animate = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();
    this.controls.update();
    this.updateHoverHighlight();
    this.updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateParticles(dt: number) {
    if (this.currentRenderMode !== "particles" || !this.particles || !this.particleBasePositions) return;
    const geo = this.particles.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const base = this.particleBasePositions;
    const speed = 8 + (performance.now() * 0.001);
    for (let i = 0; i < this.data.length; i++) {
      const idx = i * 3;
      const h = base[idx + 1];
      const t = (performance.now() * 0.0005 + i * 0.037) % 1;
      posArr[idx] = base[idx] + Math.sin(speed + i) * 0.3;
      posArr[idx + 1] = h * t + 1;
      posArr[idx + 2] = base[idx + 2] + Math.cos(speed * 0.7 + i * 1.3) * 0.3;
    }
    posAttr.needsUpdate = true;
  }

  public loadData(points: LightDataPoint[]) {
    this.data = points;
    this.clearVisualizations();
    this.renderMode(this.currentRenderMode, true);
  }

  public clearData() {
    this.data = [];
    this.clearVisualizations();
  }

  private clearVisualizations() {
    if (this.barMesh) {
      this.scene.remove(this.barMesh);
      this.barMesh.geometry.dispose();
      (this.barMesh.material as THREE.Material).dispose();
      this.barMesh = null;
    }
    if (this.heatmapMesh) {
      this.scene.remove(this.heatmapMesh);
      this.heatmapMesh.geometry.dispose();
      (this.heatmapMesh.material as THREE.Material).dispose();
      this.heatmapMesh = null;
    }
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
      this.particles = null;
      this.particleBasePositions = null;
    }
    this.highlightInstance = -1;
  }

  public async setRenderMode(mode: RenderMode): Promise<void> {
    if (this.transitioning || mode === this.currentRenderMode) return;
    this.transitioning = true;
    await this.fadeOutCurrent();
    this.currentRenderMode = mode;
    this.renderMode(mode, false);
    await this.fadeInCurrent();
    this.transitioning = false;
  }

  private async fadeOutCurrent(): Promise<void> {
    const targets: { obj: THREE.Object3D; getOpacity: () => number; setOpacity: (v: number) => void }[] = [];
    if (this.barMesh) {
      const mat = this.barMesh.material as THREE.MeshStandardMaterial;
      targets.push({
        obj: this.barMesh,
        getOpacity: () => mat.opacity,
        setOpacity: (v) => (mat.opacity = v),
      });
    }
    if (this.heatmapMesh) {
      const mat = this.heatmapMesh.material as THREE.MeshStandardMaterial;
      targets.push({
        obj: this.heatmapMesh,
        getOpacity: () => mat.opacity,
        setOpacity: (v) => (mat.opacity = v),
      });
    }
    if (this.particles) {
      const mat = this.particles.material as THREE.PointsMaterial;
      targets.push({
        obj: this.particles,
        getOpacity: () => mat.opacity,
        setOpacity: (v) => (mat.opacity = v),
      });
    }
    if (!targets.length) return;
    const starts = targets.map((t) => t.getOpacity());
    return new Promise((resolve) => {
      this.cancelAnim = animate({
        duration: 250,
        easing: easeInOutSine,
        onUpdate: (p) => {
          targets.forEach((t, i) => t.setOpacity(lerp(starts[i], 0, p)));
        },
        onComplete: () => {
          this.clearVisualizations();
          resolve();
        },
      });
    });
  }

  private async fadeInCurrent(): Promise<void> {
    let getO: (() => number) | null = null;
    let setO: ((v: number) => void) | null = null;
    if (this.currentRenderMode === "bar" && this.barMesh) {
      const m = this.barMesh.material as THREE.MeshStandardMaterial;
      m.transparent = true;
      m.opacity = 0;
      getO = () => m.opacity;
      setO = (v) => (m.opacity = v);
    } else if (this.currentRenderMode === "heatmap" && this.heatmapMesh) {
      const m = this.heatmapMesh.material as THREE.MeshStandardMaterial;
      m.transparent = true;
      m.opacity = 0;
      getO = () => m.opacity;
      setO = (v) => (m.opacity = v);
    } else if (this.currentRenderMode === "particles" && this.particles) {
      const m = this.particles.material as THREE.PointsMaterial;
      m.transparent = true;
      m.opacity = 0;
      getO = () => m.opacity;
      setO = (v) => (m.opacity = v);
    }
    if (!getO || !setO) return;
    const target = this.currentOpacity;
    return new Promise((resolve) => {
      this.cancelAnim = animate({
        duration: 250,
        easing: easeInOutSine,
        onUpdate: (p) => setO!(lerp(0, target, p)),
        onComplete: resolve,
      });
    });
  }

  private renderMode(mode: RenderMode, immediate: boolean) {
    if (!this.data.length) return;
    const count = this.data.length;
    if (mode === "bar") {
      const geo = new THREE.BoxGeometry(1, MAX_BAR_HEIGHT * this.currentScale, 1);
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: immediate ? this.currentOpacity : 0,
        roughness: 0.35,
        metalness: 0.2,
        emissiveIntensity: 0.6,
      });
      this.barMesh = new THREE.InstancedMesh(geo, mat, count);
      this.barMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.barMesh.userData.pickable = true;
      this.populateInstances(this.barMesh, BAR_BASE_SIZE);
      this.scene.add(this.barMesh);
    } else if (mode === "heatmap") {
      const geo = new THREE.BoxGeometry(1.4, MAX_BAR_HEIGHT * this.currentScale, 1.4);
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: immediate ? this.currentOpacity * 0.7 : 0,
        roughness: 0.5,
        metalness: 0.1,
        emissiveIntensity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.heatmapMesh = new THREE.InstancedMesh(geo, mat, count);
      this.heatmapMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.heatmapMesh.userData.pickable = true;
      this.populateInstances(this.heatmapMesh, 1.4);
      this.scene.add(this.heatmapMesh);
    } else if (mode === "particles") {
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const base = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const pt = this.data[i];
        const h = pt.normalizedIntensity * MAX_BAR_HEIGHT * this.currentScale;
        base[i * 3] = pt.position.x;
        base[i * 3 + 1] = h;
        base[i * 3 + 2] = pt.position.z;
        positions[i * 3] = pt.position.x;
        positions[i * 3 + 1] = 1;
        positions[i * 3 + 2] = pt.position.z;
        const c = hexToThreeColor(pt.color);
        this.colorTmp.setHex(c);
        colors[i * 3] = this.colorTmp.r;
        colors[i * 3 + 1] = this.colorTmp.g;
        colors[i * 3 + 2] = this.colorTmp.b;
        sizes[i] = 0.8 + pt.normalizedIntensity * 3.5;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: immediate ? this.currentOpacity : 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      this.particles = new THREE.Points(geo, mat);
      this.particles.userData.pickable = true;
      (this.particles.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
      this.particles.userData.sizes = sizes;
      this.particleBasePositions = base;
      this.scene.add(this.particles);
    }
  }

  private populateInstances(mesh: THREE.InstancedMesh, baseSize: number) {
    const count = this.data.length;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const pt = this.data[i];
      const h = pt.normalizedIntensity * MAX_BAR_HEIGHT * this.currentScale;
      this.baseDummy.position.set(pt.position.x, h / 2, pt.position.z);
      this.baseDummy.scale.set(baseSize, 1, baseSize);
      this.baseDummy.rotation.set(0, 0, 0);
      this.baseDummy.updateMatrix();
      mesh.setMatrixAt(i, this.baseDummy.matrix);
      const c = hexToThreeColor(pt.color);
      this.colorTmp.setHex(c);
      colors[i * 3] = this.colorTmp.r;
      colors[i * 3 + 1] = this.colorTmp.g;
      colors[i * 3 + 2] = this.colorTmp.b;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        // emissive is global for instanced mesh
      }
    }
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  public setScale(scale: number) {
    this.currentScale = scale;
    this.refreshInstances();
  }

  public setOpacity(opacity: number) {
    this.currentOpacity = opacity;
    if (this.barMesh) {
      (this.barMesh.material as THREE.MeshStandardMaterial).opacity = opacity;
      (this.barMesh.material as THREE.MeshStandardMaterial).transparent = opacity < 1;
    }
    if (this.heatmapMesh) {
      (this.heatmapMesh.material as THREE.MeshStandardMaterial).opacity = opacity * 0.7;
    }
    if (this.particles) {
      (this.particles.material as THREE.PointsMaterial).opacity = opacity;
    }
  }

  public setColorMap(colorMap: ColorMap, colors: string[]) {
    this.currentColorMap = colorMap;
    if (!this.data.length) return;
    for (let i = 0; i < this.data.length; i++) {
      this.data[i].color = colors[i];
    }
    const count = this.data.length;
    const colorsArr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const c = hexToThreeColor(colors[i]);
      this.colorTmp.setHex(c);
      colorsArr[i * 3] = this.colorTmp.r;
      colorsArr[i * 3 + 1] = this.colorTmp.g;
      colorsArr[i * 3 + 2] = this.colorTmp.b;
    }
    if (this.barMesh && this.barMesh.instanceColor) {
      (this.barMesh.instanceColor.array as Float32Array).set(colorsArr);
      this.barMesh.instanceColor.needsUpdate = true;
    }
    if (this.heatmapMesh && this.heatmapMesh.instanceColor) {
      (this.heatmapMesh.instanceColor.array as Float32Array).set(colorsArr);
      this.heatmapMesh.instanceColor.needsUpdate = true;
    }
    if (this.particles) {
      const attr = this.particles.geometry.getAttribute("color") as THREE.BufferAttribute;
      (attr.array as Float32Array).set(colorsArr);
      attr.needsUpdate = true;
    }
  }

  private refreshInstances() {
    if (!this.data.length) return;
    const baseSize =
      this.currentRenderMode === "heatmap" ? 1.4 : BAR_BASE_SIZE;
    const mesh =
      this.currentRenderMode === "bar"
        ? this.barMesh
        : this.currentRenderMode === "heatmap"
          ? this.heatmapMesh
          : null;
    if (!mesh) {
      if (this.currentRenderMode === "particles" && this.particles && this.particleBasePositions) {
        const base = this.particleBasePositions;
        for (let i = 0; i < this.data.length; i++) {
          base[i * 3 + 1] = this.data[i].normalizedIntensity * MAX_BAR_HEIGHT * this.currentScale;
        }
      }
      return;
    }
    for (let i = 0; i < this.data.length; i++) {
      const pt = this.data[i];
      const h = pt.normalizedIntensity * MAX_BAR_HEIGHT * this.currentScale;
      const isHi = this.highlightInstance === i;
      const size = baseSize * (isHi ? 1.3 : 1);
      this.baseDummy.position.set(pt.position.x, h / 2, pt.position.z);
      this.baseDummy.scale.set(size, 1, size);
      this.baseDummy.updateMatrix();
      mesh.setMatrixAt(i, this.baseDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  public async resetCamera(): Promise<void> {
    if (this.cancelAnim) this.cancelAnim();
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = INITIAL_CAMERA_POS.clone();
    const endTarget = INITIAL_TARGET.clone();

    const startQ = new THREE.Quaternion().copy(this.camera.quaternion);
    const tmpCam = this.camera.clone();
    tmpCam.position.copy(endPos);
    tmpCam.lookAt(endTarget);
    const endQ = tmpCam.quaternion.clone();

    return new Promise((resolve) => {
      this.cancelAnim = animate({
        duration: 800,
        easing: easeInOutCubic,
        onUpdate: (p) => {
          const arc = Math.sin(p * Math.PI);
          this.camera.position.lerpVectors(startPos, endPos, p);
          this.camera.position.y += arc * 40;
          this.controls.target.lerpVectors(startTarget, endTarget, p);
          this.camera.quaternion.slerpQuaternions(startQ, endQ, p);
          this.camera.lookAt(this.controls.target);
        },
        onComplete: () => {
          this.camera.position.copy(endPos);
          this.controls.target.copy(endTarget);
          this.camera.lookAt(endTarget);
          resolve();
        },
      });
    });
  }

  public async flyTo(point: LightDataPoint): Promise<void> {
    if (this.cancelAnim) this.cancelAnim();
    const h = this.getInstanceHeight(point.id ? parseInt(point.id.split("_")[1]) : 0) || 0;
    const hSafe = isNaN(h) ? point.normalizedIntensity * MAX_BAR_HEIGHT * this.currentScale : h;
    const targetPos = new THREE.Vector3(point.position.x, hSafe * 0.5, point.position.z);
    const offset = new THREE.Vector3(35, hSafe * 0.6 + 15, 45);
    const endPos = targetPos.clone().add(offset);
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const startQ = this.camera.quaternion.clone();
    const tmpCam = this.camera.clone();
    tmpCam.position.copy(endPos);
    tmpCam.lookAt(targetPos);
    const endQ = tmpCam.quaternion.clone();

    return new Promise((resolve) => {
      this.cancelAnim = animate({
        duration: 600,
        easing: easeInOutCubic,
        onUpdate: (p) => {
          const arc = Math.sin(p * Math.PI);
          this.camera.position.lerpVectors(startPos, endPos, p);
          this.camera.position.y += arc * 30;
          this.controls.target.lerpVectors(startTarget, targetPos, p);
          this.camera.quaternion.slerpQuaternions(startQ, endQ, p);
          this.camera.lookAt(this.controls.target);
        },
        onComplete: resolve,
      });
    });
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL("image/png");
  }

  public dispose() {
    this.disposed = true;
    if (this.cancelAnim) this.cancelAnim();
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.removeEventListener("click", this.handleClick);
    this.clearVisualizations();
    this.controls.dispose();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose?.();
      const mat = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
      else mat?.dispose?.();
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
