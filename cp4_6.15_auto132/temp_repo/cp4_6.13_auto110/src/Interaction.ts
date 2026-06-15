import * as THREE from 'three';
import { BarChart, BarSegmentRef } from './BarChart';

interface CameraState {
  theta: number;
  phi: number;
  radius: number;
  thetaVel: number;
  phiVel: number;
}

interface TweenAnim {
  startTime: number;
  duration: number;
  update: (t: number) => void;
  done: boolean;
}

export class Interaction {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private barChart: BarChart;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;

  private cam: CameraState;
  private initialCam: CameraState;
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private lastDragPos = { x: 0, y: 0 };

  private hoveredBar: THREE.Mesh | null = null;
  private hoveredBarGroup: THREE.Group | null = null;
  private selectedSegment: BarSegmentRef | null = null;

  private tweens: TweenAnim[] = [];
  private bounceAnim: TweenAnim | null = null;

  private hoverLabel: HTMLElement;
  private leftPanel: HTMLElement;
  private leftPanelContent: HTMLElement;
  private bottomSheet: HTMLElement;
  private bottomSheetContent: HTMLElement;

  private onBarClick: ((seg: BarSegmentRef) => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    barChart: BarChart,
    container: HTMLElement
  ) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.barChart = barChart;
    this.container = container;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    this.hoverLabel = document.getElementById('hover-label')!;
    this.leftPanel = document.getElementById('left-panel')!;
    this.leftPanelContent = document.getElementById('left-panel-content')!;
    this.bottomSheet = document.getElementById('bottom-sheet')!;
    this.bottomSheetContent = document.getElementById('bottom-sheet-content')!;

    this.cam = {
      theta: Math.PI / 4,
      phi: Math.PI / 3.5,
      radius: 18,
      thetaVel: 0,
      phiVel: 0,
    };
    this.initialCam = { ...this.cam };

    this.bindEvents();
    this.updateCameraPosition();
  }

  setOnBarClick(cb: (seg: BarSegmentRef) => void) {
    this.onBarClick = cb;
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    canvas.addEventListener('click', this.onClick.bind(this));

    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.lastDragPos = { x: e.clientX, y: e.clientY };
    this.cam.thetaVel = 0;
    this.cam.phiVel = 0;
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging) {
      const dx = e.clientX - this.lastDragPos.x;
      const dy = e.clientY - this.lastDragPos.y;
      this.cam.thetaVel = dx * 0.005;
      this.cam.phiVel = dy * 0.005;
      this.cam.theta += this.cam.thetaVel;
      this.cam.phi = Math.max(0.2, Math.min(Math.PI / 2.1, this.cam.phi + this.cam.phiVel));
      this.lastDragPos = { x: e.clientX, y: e.clientY };
    }
  }

  private onMouseUp() {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    this.cam.radius = Math.max(8, Math.min(40, this.cam.radius + e.deltaY * 0.02));
  }

  private onDoubleClick() {
    this.animateCameraReset();
  }

  private onClick(e: MouseEvent) {
    if (this.isDragging) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const meshes = this.barChart.getSegmentMeshes();
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const ref = mesh.userData as BarSegmentRef;
      if (ref) {
        this.selectedSegment = ref;
        this.triggerBounce(ref);
        this.showInfoPanel(ref);
        if (this.onBarClick) this.onBarClick(ref);
      }
    } else {
      this.hideInfoPanel();
      this.selectedSegment = null;
    }
  }

  private touchStartPos = { x: 0, y: 0 };
  private lastTouchDist = 0;
  private isTouchDragging = false;

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isTouchDragging = true;
      this.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.lastDragPos = { ...this.touchStartPos };
      this.cam.thetaVel = 0;
      this.cam.phiVel = 0;
    } else if (e.touches.length === 2) {
      this.lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isTouchDragging) {
      const dx = e.touches[0].clientX - this.lastDragPos.x;
      const dy = e.touches[0].clientY - this.lastDragPos.y;
      this.cam.thetaVel = dx * 0.005;
      this.cam.phiVel = dy * 0.005;
      this.cam.theta += this.cam.thetaVel;
      this.cam.phi = Math.max(0.2, Math.min(Math.PI / 2.1, this.cam.phi + this.cam.phiVel));
      this.lastDragPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = this.lastTouchDist - dist;
      this.cam.radius = Math.max(8, Math.min(40, this.cam.radius + delta * 0.05));
      this.lastTouchDist = dist;
    }
  }

  private onTouchEnd() {
    this.isTouchDragging = false;
  }

  private animateCameraReset() {
    const startTheta = this.cam.theta;
    const startPhi = this.cam.phi;
    const startRadius = this.cam.radius;
    const targetTheta = this.initialCam.theta;
    const targetPhi = this.initialCam.phi;
    const targetRadius = this.initialCam.radius;
    const startTime = performance.now();
    const duration = 1000;

    this.cam.thetaVel = 0;
    this.cam.phiVel = 0;

    this.tweens.push({
      startTime,
      duration,
      update: (t: number) => {
        const ease = 1 - Math.pow(1 - t, 3);
        this.cam.theta = startTheta + (targetTheta - startTheta) * ease;
        this.cam.phi = startPhi + (targetPhi - startPhi) * ease;
        this.cam.radius = startRadius + (targetRadius - startRadius) * ease;
      },
      done: false,
    });
  }

  private triggerBounce(ref: BarSegmentRef) {
    const group = ref.barGroup;
    const startTime = performance.now();
    const compressDuration = 100;
    const recoverDuration = 200;

    this.bounceAnim = {
      startTime,
      duration: compressDuration + recoverDuration,
      update: (t: number) => {
        const totalT = t * (compressDuration + recoverDuration);
        if (totalT < compressDuration) {
          const ct = totalT / compressDuration;
          const scaleY = 1 - 0.2 * ct;
          const scaleXZ = 1 + 0.1 * ct;
          group.scale.set(scaleXZ, scaleY, scaleXZ);
        } else {
          const rt = (totalT - compressDuration) / recoverDuration;
          const ease = 1 - Math.pow(1 - rt, 2);
          const scaleY = 0.8 + 0.2 * ease;
          const scaleXZ = 1.1 - 0.1 * ease;
          group.scale.set(scaleXZ, scaleY, scaleXZ);
        }
      },
      done: false,
    };
  }

  update() {
    const now = performance.now();

    if (!this.isDragging) {
      this.cam.theta += this.cam.thetaVel;
      this.cam.phi = Math.max(0.2, Math.min(Math.PI / 2.1, this.cam.phi + this.cam.phiVel));
      this.cam.thetaVel *= 0.95;
      this.cam.phiVel *= 0.95;
      if (Math.abs(this.cam.thetaVel) < 0.0001) this.cam.thetaVel = 0;
      if (Math.abs(this.cam.phiVel) < 0.0001) this.cam.phiVel = 0;
    }

    for (const tw of this.tweens) {
      if (tw.done) continue;
      const elapsed = now - tw.startTime;
      const t = Math.min(1, elapsed / tw.duration);
      tw.update(t);
      if (t >= 1) tw.done = true;
    }
    this.tweens = this.tweens.filter(tw => !tw.done);

    if (this.bounceAnim && !this.bounceAnim.done) {
      const elapsed = now - this.bounceAnim.startTime;
      const t = Math.min(1, elapsed / this.bounceAnim.duration);
      this.bounceAnim.update(t);
      if (t >= 1) {
        this.bounceAnim.done = true;
      }
    }

    this.updateCameraPosition();
    this.updateHover();
    this.updateHoverLabel();
  }

  private updateCameraPosition() {
    const { theta, phi, radius } = this.cam;
    this.camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
    this.camera.lookAt(0, 2, 0);
  }

  private updateHover() {
    if (this.isDragging) return;

    const meshes = this.barChart.getSegmentMeshes();
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const ref = mesh.userData as BarSegmentRef;

      if (this.hoveredBar !== mesh) {
        this.unhoverCurrent();
        this.hoveredBar = mesh;
        this.hoveredBarGroup = ref.barGroup;
        this.applyHoverEffect(ref);
      }
    } else {
      this.unhoverCurrent();
    }
  }

  private applyHoverEffect(ref: BarSegmentRef) {
    const group = ref.barGroup;
    group.scale.set(1.15, 1.15, 1.15);

    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshPhysicalMaterial;
        mat.emissive.set(0x7dd3fc);
        mat.emissiveIntensity = 0.5;
      }
    }
  }

  private unhoverCurrent() {
    if (!this.hoveredBar || !this.hoveredBarGroup) return;

    const group = this.hoveredBarGroup;
    group.scale.set(1, 1, 1);

    for (const child of group.children) {
      if (child instanceof THREE.Mesh) {
        const ref = child.userData as BarSegmentRef;
        if (ref) {
          const mat = child.material as THREE.MeshPhysicalMaterial;
          mat.emissive.set(ref.layer.color);
          mat.emissiveIntensity = ref.baseEmissiveIntensity;
        }
      }
    }

    this.hoveredBar = null;
    this.hoveredBarGroup = null;
  }

  private updateHoverLabel() {
    if (this.hoveredBar) {
      const ref = this.hoveredBar.userData as BarSegmentRef;
      const topY = this.getBarTopY(ref);
      const worldPos = new THREE.Vector3(0, topY, 0);
      this.hoveredBar.getWorldPosition(worldPos);
      worldPos.y = topY;

      const projected = worldPos.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * this.container.clientWidth;
      const y = (-projected.y * 0.5 + 0.5) * this.container.clientHeight;

      const total = this.getBarTotalValue(ref);
      this.hoverLabel.style.left = `${x}px`;
      this.hoverLabel.style.top = `${y}px`;
      this.hoverLabel.classList.remove('hidden');
      document.getElementById('hover-label-text')!.textContent =
        `${ref.dataGroup.name} · ${ref.category.name} — 总计: ${total}`;
    } else {
      this.hoverLabel.classList.add('hidden');
    }
  }

  private getBarTopY(ref: BarSegmentRef): number {
    let topY = 0;
    for (const child of ref.barGroup.children) {
      if (child instanceof THREE.Mesh) {
        const params = child.geometry.parameters as { height?: number };
        if (params?.height) {
          topY = Math.max(topY, child.position.y + params.height / 2);
        }
      }
    }
    const worldY = new THREE.Vector3();
    ref.barGroup.getWorldPosition(worldY);
    return topY + worldY.y;
  }

  private getBarTotalValue(ref: BarSegmentRef): number {
    return ref.category.layers.reduce((sum, l) => sum + l.value, 0);
  }

  private showInfoPanel(ref: BarSegmentRef) {
    const isMobile = window.innerWidth < 768;
    const target = isMobile ? this.bottomSheetContent : this.leftPanelContent;
    const panel = isMobile ? this.bottomSheet : this.leftPanel;

    const total = ref.category.layers.reduce((s, l) => s + l.value, 0);

    let html = `
      <div class="info-row">
        <div class="info-label">数据分组</div>
        <div class="info-value">${ref.dataGroup.name}</div>
      </div>
      <div class="info-row">
        <div class="info-label">类别</div>
        <div class="info-value">${ref.category.name}</div>
      </div>
      <div class="info-layer-list">
    `;

    for (const layer of ref.category.layers) {
      html += `
        <div class="info-layer-item">
          <div class="info-layer-color" style="background:${layer.color}"></div>
          <span class="info-layer-name">${layer.name}</span>
          <span class="info-layer-val">${layer.value}</span>
        </div>
      `;
    }

    html += `
      </div>
      <div class="info-total">
        <span class="info-total-label">合计</span>
        <span class="info-total-val">${total}</span>
      </div>
    `;

    target.innerHTML = html;
    panel.classList.add('visible');
  }

  private hideInfoPanel() {
    this.leftPanel.classList.remove('visible');
    this.bottomSheet.classList.remove('visible');
  }

  dispose() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.removeEventListener('wheel', this.onWheel.bind(this));
    canvas.removeEventListener('dblclick', this.onDoubleClick.bind(this));
    canvas.removeEventListener('click', this.onClick.bind(this));
  }
}
