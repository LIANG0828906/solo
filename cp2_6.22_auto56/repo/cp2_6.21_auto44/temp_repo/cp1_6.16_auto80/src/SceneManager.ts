import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DataParser } from './DataParser';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const MAX_DEPTH = 11000;
const PARTICLE_COUNT = 2000;

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;

  readonly creatureContainer: THREE.Group;
  readonly curveContainer: THREE.Group;

  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  private particles!: THREE.Points;
  private particleVelocities: Float32Array;

  private pressureTube!: THREE.Mesh;
  private tempLine!: THREE.Line;

  private currentDepth = 0;
  private targetDepth = 0;
  private depthAnimating = false;

  private cameraFrom: CameraState | null = null;
  private cameraTo: CameraState | null = null;
  private cameraAnimTime = 0;
  private cameraAnimDuration = 0;

  private readonly depthListeners: ((d: number) => void = () => {};

  private fogColorSurface = new THREE.Color(0x0a2a55);
  private fogColorDeep = new THREE.Color(0x000000);
  private bgColor = new THREE.Color(0x0a2a55);

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a2a55, 0.0002);

    const w = container.clientWidth;
    const h = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, w / h, 1, 40000);
    this.camera.position.set(4000, 500, 5000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(this.bgColor);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 300;
    this.controls.maxDistance = 20000;
    this.controls.target.set(0, 0, 0);
    this.controls.maxPolarAngle = Math.PI * 0.55;

    this.ambientLight = new THREE.AmbientLight(0x88aaff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(3000, 8000, 3000);
    this.scene.add(this.directionalLight);

    this.creatureContainer = new THREE.Group();
    this.scene.add(this.creatureContainer);

    this.curveContainer = new THREE.Group();
    this.scene.add(this.curveContainer);

    this.particleVelocities = new Float32Array(PARTICLE_COUNT);

    this.createOceanGrid();
    this.createParticleSystem();
    this.createCurves();
    this.createDepthLabels();
    this.createSeaSurface();

    window.addEventListener('resize', () => this.onResize(container));
    this.controls.addEventListener('change', () => {
      const d = Math.max(0, Math.min(MAX_DEPTH, -this.controls.target.y * -1));
      const t = THREE.MathUtils.clamp(-this.controls.target.y, 0, MAX_DEPTH);
      this.setImmediateDepth(t);
    });
  }

  private onResize(container: HTMLElement): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private createOceanGrid(): void {
    const gridGroup = new THREE.Group();
    gridGroup.name = 'oceanGrid';

    const gridMat = new THREE.LineBasicMaterial({
      color: 0x1e40af,
      transparent: true,
      opacity: 0.25
    });

    for (let d = 0; d <= MAX_DEPTH; d += 1000) {
      const size = 6000;
      const seg = 12;
      const y = -d;
      const half = size / 2;

      const ptsH = [];
      for (let i = 0; i <= seg; i++) {
        const x = -half + (size / seg) * i;
        ptsH.push(new THREE.Vector3(x, y, -half), new THREE.Vector3(x, y, half));
        ptsH.push(new THREE.Vector3(-half, y, x), new THREE.Vector3(half, y, x));
      }
      const g = new THREE.BufferGeometry().setFromPoints(ptsH);
      gridGroup.add(new THREE.LineSegments(g, gridMat));
    }

    for (let i = -3000; i <= 3000; i += 3000) {
      const vPts: THREE.Vector3[] = [];
      for (let j = 0; j <= 11; j++) {
        vPts.push(new THREE.Vector3(i, -j * 1000, -3000));
        vPts.push(new THREE.Vector3(i, -j * 1000, 3000));
      }
      const gv = new THREE.BufferGeometry().setFromPoints(vPts);
      gridGroup.add(new THREE.LineSegments(gv, gridMat));
    }

    this.scene.add(gridGroup);
  }

  private createParticleSystem(): void {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const c1 = new THREE.Color(0x88ddff);
    const c2 = new THREE.Color(0x5577aa);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 10000;
      positions[i3 + 1] = -Math.random() * MAX_DEPTH;
      positions[i3 + 2] = (Math.random() - 0.5) * 10000;

      const depthFactor = -positions[i3 + 1] / MAX_DEPTH;
      const c = c1.clone().lerp(c2, depthFactor);
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      sizes[i] = Math.random() * 2.5 + 0.5;
      this.particleVelocities[i] = (Math.random() - 0.5) * 8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      transparentOpacity: true
    } as THREE.PointsMaterialParameters);

    this.particles = new THREE.Points(geo, mat);
    this.particles.name = 'particles';
    this.scene.add(this.particles);
    (this.particles.geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  }

  private createCurves(): void {
    const curveGroup = new THREE.Group();
    curveGroup.position.set(-5500, -MAX_DEPTH - 500, -4500);

    const chartWidth = 11000;
    const chartHeight = 900;

    const pressurePts: THREE.Vector3[] = [];
    const tempPts: THREE.Vector3[] = [];
    const samples = 120;

    let pMax = DataParser.pressure(MAX_DEPTH);
    const tMax = 26;

    for (let i = 0; i <= samples; i++) {
      const depth = (i / samples) * MAX_DEPTH;
      const x = (i / samples) * chartWidth;
      const p = DataParser.pressure(depth);
      const t = DataParser.temperature(depth);
      pressurePts.push(new THREE.Vector3(x, (p / pMax) * chartHeight, 0));
      tempPts.push(new THREE.Vector3(x, (t / tMax) * chartHeight, -20);
    }

    const pCurve = new THREE.CatmullRomCurve3(pressurePts);
    const tubeGeo = new THREE.TubeGeometry(pCurve, 120, 14, 6, false);

    const pColors = new Float32Array(tubeGeo.attributes.position.count * 3);
    for (let i = 0; i < tubeGeo.attributes.position.count; i++) {
      const t = i / tubeGeo.attributes.position.count;
      const c1 = new THREE.Color(0x3b82f6);
      const c2 = new THREE.Color(0x8b5cf6);
      const c = c1.lerpColors(c1, c2, t);
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }
    tubeGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    const tubeMat = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.75
    });
    this.pressureTube = new THREE.Mesh(tubeGeo, tubeMat);
    curveGroup.add(this.pressureTube);

    const tCurve = new THREE.CatmullRomCurve3(tempPts);
    const tPts = tCurve.getPoints(240);
    const tGeo = new THREE.BufferGeometry().setFromPoints(tPts);
    const tColors = new Float32Array(tPts.length * 3);
    for (let i = 0; i < tPts.length; i++) {
      const tt = i / tPts.length;
      const col1 = new THREE.Color(0xfb923c);
      const col2 = new THREE.Color(0xef4444);
      const col = col1.lerpColors(col1, col2, tt);
      tColors[i * 3] = col.r;
      tColors[i * 3 + 1] = col.g;
      tColors[i * 3 + 2] = col.b;
    }
    tGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
    const tMat = new THREE.LineDashedMaterial({
      vertexColors: true,
      dashSize: 30,
      gapSize: 20,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
    this.tempLine = new THREE.Line(tGeo, tMat);
    this.tempLine.computeLineDistances();
    curveGroup.add(this.tempLine);

    const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const axisPts = [
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(chartWidth, 0, 10),
      new THREE.Vector3(0, chartHeight + 50, 10)
    ];
    const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPts);
    curveGroup.add(new THREE.Line(axisGeo, axisMat));

    this.curveContainer.add(curveGroup);
  }

  private createDepthLabels(): void {
    // Labels are handled in HTML overlay — see main.ts
  }

  private createSeaSurface(): void {
    const surfaceGeo = new THREE.PlaneGeometry(16000, 16000);
    const surfaceMat = new THREE.MeshBasicMaterial({
      color: 0x1e6fa3, transparent: true, opacity: 0.18, side: THREE.DoubleSide
    });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.rotation.x = Math.PI / 2;
    surface.position.y = 50;
    this.scene.add(surface);
  }

  onDepthChange(cb: (d: number) => void): void {
    this.depthListeners = cb;
  }

  getCurrentDepth(): number {
    return this.currentDepth;
  }

  setImmediateDepth(d: number): void {
    const clamped = THREE.MathUtils.clamp(d, 0, MAX_DEPTH);
    if (Math.abs(clamped - this.currentDepth) < 0.5) return;
    this.currentDepth = clamped;
    this.targetDepth = clamped;
    this.depthListeners(clamped);
    this.updateEnvironmentForDepth(clamped);
  }

  async gotoDepth(target: number, duration = 2000): Promise<void> {
    this.targetDepth = THREE.MathUtils.clamp(target, 0, MAX_DEPTH);
    const from = this.camera.position.clone();
    const ratio = this.targetDepth / MAX_DEPTH;
    const dist = 4500 - ratio * 2000;
    const yOffset = 800 - ratio * 400;
    const toPos = new THREE.Vector3(
      Math.cos(0.8) * dist,
      -this.targetDepth + yOffset,
      Math.sin(0.8) * dist
    );
    const toTarget = new THREE.Vector3(0, -this.targetDepth, 0);
    return this.animateCamera(from, this.controls.target.clone(), toPos, toTarget, duration);
  }

  async gotoCreature(displayDepth: number, duration = 2000): Promise<void> {
    const depth = THREE.MathUtils.clamp(displayDepth, 0, MAX_DEPTH);
    const from = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const dist = 1500;
    const angle = 1.0;
    const toPos = new THREE.Vector3(
      Math.cos(angle) * dist,
      -depth + 400,
      Math.sin(angle) * dist
    );
    const toTarget = new THREE.Vector3(0, -depth, 0);
    return this.animateCamera(from, fromTarget, toPos, toTarget, duration);
  }

  private animateCamera(
    fromPos: THREE.Vector3,
    fromTarget: THREE.Vector3,
    toPos: THREE.Vector3,
    toTarget: THREE.Vector3,
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      this.cameraFrom = { position: fromPos, target: fromTarget };
      this.cameraTo = { position: toPos, target: toTarget };
      this.cameraAnimTime = 0;
      this.cameraAnimDuration = duration;
      this.depthAnimating = true;
      this.targetDepth = -toTarget.y;
      const check = () => {
        if (!this.depthAnimating) return;
        resolve();
      };
      setTimeout(check, duration + 50);
    });
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  updateEnvironmentForDepth(depth: number): void {
    const ratio = THREE.MathUtils.clamp(depth / MAX_DEPTH, 0, 1);
    const bg = this.fogColorSurface.clone().lerp(this.fogColorDeep, ratio);
    if (this.scene.fog instanceof THREE.FogExp2) {
      (this.scene.fog as THREE.FogExp2).color.copy(bg);
      (this.scene.fog as THREE.FogExp2).density = 0.0001 + ratio * 0.00025;
    }
    this.renderer.setClearColor(bg);
    this.ambientLight.intensity = 0.6 * (1 - ratio * 0.85);
    this.directionalLight.intensity = 1.0 * (1 - ratio * 0.9);
  }

  update(delta: number): void {
    if (this.depthAnimating && this.cameraFrom && this.cameraTo) {
      this.cameraAnimTime += delta * 1000;
      const t = this.easeInOutCubic(
        Math.min(1, this.cameraAnimTime / this.cameraAnimDuration)
      );
      this.camera.position.lerpVectors(
        this.cameraFrom.position,
        this.cameraTo.position,
        t
      );
      this.controls.target.lerpVectors(
        this.cameraFrom.target,
        this.cameraTo.target,
        t
      );
      const interpDepth = THREE.MathUtils.lerp(
        -this.cameraFrom.target.y,
        -this.cameraTo.target.y,
        t
      );
      this.setImmediateDepth(-interpDepth);
      if (t >= 1) {
        this.depthAnimating = false;
        this.cameraFrom = null;
        this.cameraTo = null;
      }
    }

    this.controls.update();

    const posAttr = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      arr[i3 + 1] += this.particleVelocities[i] * delta;
      if (arr[i3 + 1] > 0) arr[i3 + 1] = -MAX_DEPTH;
      if (arr[i3 + 1] < -MAX_DEPTH) arr[i3 + 1] = 0;
    }
    posAttr.needsUpdate = true;

    if (!this.depthAnimating) {
      const tDepth = -this.controls.target.y;
      this.setImmediateDepth(-tDepth);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
