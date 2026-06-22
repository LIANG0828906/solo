import * as THREE from 'three';
import { Nebula, ParticleData, NeighborhoodStats } from './nebula';

function rgbToHex(r: number, g: number, b: number): string {
  const ri = Math.max(0, Math.min(255, Math.round(r * 255)));
  const gi = Math.max(0, Math.min(255, Math.round(g * 255)));
  const bi = Math.max(0, Math.min(255, Math.round(b * 255)));
  return '#' + ((1 << 24) | (ri << 16) | (gi << 8) | bi).toString(16).slice(1).toUpperCase();
}

export interface InteractionCallbacks {
  onRotationChange: (speed: number) => void;
  onSizeChange: (scale: number) => void;
  onResetView: () => void;
}

export class Interaction {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nebula: Nebula;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private theta = Math.PI / 4;
  private phi = Math.PI / 3;
  private distance = 80;
  private readonly MIN_DISTANCE = 20;
  private readonly MAX_DISTANCE = 200;
  private readonly ROTATION_SPEED = 0.5 * Math.PI / 180;

  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly HOVER_DELAY = 500;
  private hoveredIndex: number | null = null;
  private lockedIndex: number | null = null;

  private tooltipEl: HTMLElement;
  private canvasRect: DOMRect;

  private rotationSpeed = 1.0;
  private sizeScale = 1.0;

  private targetTheta = Math.PI / 4;
  private targetPhi = Math.PI / 3;
  private targetDistance = 80;

  private callbacks: InteractionCallbacks;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    nebula: Nebula,
    tooltipEl: HTMLElement,
    callbacks: InteractionCallbacks
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.nebula = nebula;
    this.tooltipEl = tooltipEl;
    this.callbacks = callbacks;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.canvasRect = renderer.domElement.getBoundingClientRect();

    this.updateCameraPosition();
    this.bindEvents();
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    canvas.addEventListener('click', this.handleClick);
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    this.canvasRect = this.renderer.domElement.getBoundingClientRect();
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    if (this.isPanelElement(e.target as HTMLElement)) return;
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.clearHoverTimer();
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.isDragging = false;
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;

      this.targetTheta -= dx * this.ROTATION_SPEED;

      const phiDelta = dy * this.ROTATION_SPEED;
      this.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.targetPhi - phiDelta));

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }

    if (!this.isPanelElement(e.target as HTMLElement)) {
      this.setupHoverCheck(e.clientX, e.clientY);
    }

    if (!this.lockedIndex && !this.isDragging) {
      this.updateTooltipPosition(e.clientX, e.clientY);
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (this.isPanelElement(e.target as HTMLElement)) return;

    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    this.targetDistance = Math.max(
      this.MIN_DISTANCE,
      Math.min(this.MAX_DISTANCE, this.targetDistance * zoomFactor)
    );
  };

  private handleClick = (e: MouseEvent): void => {
    if (this.isDragging) return;
    if (this.isPanelElement(e.target as HTMLElement)) return;

    const index = this.pickParticle(e.clientX, e.clientY);
    if (index !== null) {
      if (this.lockedIndex === index) {
        this.lockedIndex = null;
        this.tooltipEl.classList.remove('locked');
        this.hideTooltip();
      } else {
        this.lockedIndex = index;
        this.tooltipEl.classList.add('locked');
        this.showParticleTooltip(index, e.clientX, e.clientY, true);
      }
    } else if (this.lockedIndex === null) {
      this.hideTooltip();
    }
  };

  private setupHoverCheck(clientX: number, clientY: number): void {
    this.clearHoverTimer();

    if (this.lockedIndex !== null) return;

    this.hoverTimer = setTimeout(() => {
      const index = this.pickParticle(clientX, clientY);
      if (index !== null && !this.lockedIndex) {
        this.hoveredIndex = index;
        this.showParticleTooltip(index, clientX, clientY, false);
      }
    }, this.HOVER_DELAY);
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    this.hoveredIndex = null;
  }

  public pickParticle(clientX: number, clientY: number): number | null {
    const rect = this.canvasRect;
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.params.Points = { threshold: 1.5 };

    const intersects = this.raycaster.intersectObject(this.nebula.points);
    if (intersects.length > 0 && intersects[0].index !== undefined) {
      return intersects[0].index;
    }

    return null;
  }

  private showParticleTooltip(index: number, clientX: number, clientY: number, locked: boolean): void {
    const info: ParticleData | null = this.nebula.getParticleInfo(index);
    if (!info) return;

    const colorHex = rgbToHex(
      info.currentColor.r,
      info.currentColor.g,
      info.currentColor.b
    );

    let html = `
      <div class="tooltip-title">粒子信息 #${index}</div>
      <div class="tooltip-row">
        <span class="tooltip-key">坐标</span>
        <span class="tooltip-val">(${info.position.x.toFixed(2)}, ${info.position.y.toFixed(2)}, ${info.position.z.toFixed(2)})</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-key">颜色</span>
        <span class="tooltip-val color"><span class="color-dot" style="background:${colorHex};color:${colorHex}"></span>${colorHex}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-key">大小</span>
        <span class="tooltip-val">${info.size.toFixed(3)}</span>
      </div>
    `;

    if (locked) {
      const stats: NeighborhoodStats = this.nebula.getNeighborhoodStats(index, 8);
      html += `
        <div class="tooltip-section">
          <div class="tooltip-title" style="border-bottom:none;padding-bottom:0;">邻域统计</div>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-key">平均色</span>
          <span class="tooltip-val color"><span class="color-dot" style="background:${stats.avgColorHex};color:${stats.avgColorHex}"></span>${stats.avgColorHex}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-key">粒子数</span>
          <span class="tooltip-val">${stats.neighborCount}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-key">密度</span>
          <span class="tooltip-val">${stats.density.toFixed(5)}/u³</span>
        </div>
        <div class="tooltip-hint">再次点击取消锁定</div>
      `;
    } else {
      html += `<div class="tooltip-hint">点击查看邻域详情</div>`;
    }

    this.tooltipEl.innerHTML = html;
    this.tooltipEl.classList.add('visible');
    this.updateTooltipPosition(clientX, clientY);
  }

  public updateTooltipPosition(clientX: number, clientY: number): void {
    if (!this.tooltipEl.classList.contains('visible')) return;

    const offsetX = 16;
    const offsetY = -10;
    const padding = 16;
    const rect = this.tooltipEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = clientX + offsetX;
    let top = clientY + offsetY;

    if (left + rect.width + padding > vw) {
      left = clientX - rect.width - offsetX;
    }
    if (top + rect.height + padding > vh) {
      top = vh - rect.height - padding;
    }
    if (top < padding) {
      top = padding;
    }
    if (left < padding) {
      left = padding;
    }

    this.tooltipEl.style.left = left + 'px';
    this.tooltipEl.style.top = top + 'px';
  }

  public hideTooltip(): void {
    if (this.lockedIndex === null) {
      this.tooltipEl.classList.remove('visible', 'locked');
    }
  }

  public forceHideTooltip(): void {
    this.tooltipEl.classList.remove('visible', 'locked');
    this.lockedIndex = null;
  }

  private isPanelElement(el: HTMLElement): boolean {
    if (!el) return false;
    const panel = document.getElementById('controlPanel');
    const tooltip = this.tooltipEl;
    const fps = document.getElementById('fpsCounter');
    return !!(
      (panel && panel.contains(el)) ||
      (tooltip && tooltip.contains(el)) ||
      (fps && fps.contains(el))
    );
  }

  public updateCameraTarget(theta: number, phi: number, distance: number): void {
    this.targetTheta = theta;
    this.targetPhi = phi;
    this.targetDistance = distance;
  }

  public resetView(): void {
    this.targetTheta = Math.PI / 4;
    this.targetPhi = Math.PI / 3;
    this.targetDistance = 80;
    this.forceHideTooltip();
  }

  private updateCameraPosition(): void {
    const sinPhi = Math.sin(this.phi);
    const x = this.distance * sinPhi * Math.cos(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z = this.distance * sinPhi * Math.sin(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  public update(): void {
    const lerpFactor = 0.1;
    this.theta += (this.targetTheta - this.theta) * lerpFactor;
    this.phi += (this.targetPhi - this.phi) * lerpFactor;
    this.distance += (this.targetDistance - this.distance) * lerpFactor;

    this.updateCameraPosition();

    if (this.lockedIndex !== null) {
      const info = this.nebula.getParticleInfo(this.lockedIndex);
      if (info) {
        this.showParticleTooltip(this.lockedIndex, 0, 0, true);
        const rect = this.tooltipEl.getBoundingClientRect();
        const newLeft = window.innerWidth - rect.width - 20;
        const newTop = 20;
        this.tooltipEl.style.left = newLeft + 'px';
        this.tooltipEl.style.top = newTop + 'px';
      }
    }
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  public getRotationSpeed(): number {
    return this.rotationSpeed;
  }

  public setSizeScale(scale: number): void {
    this.sizeScale = scale;
  }

  public getSizeScale(): number {
    return this.sizeScale;
  }

  public bindControlPanel(
    panel: HTMLElement,
    header: HTMLElement,
    toggle: HTMLElement,
    content: HTMLElement,
    rotationSlider: HTMLInputElement,
    rotationValue: HTMLElement,
    sizeSlider: HTMLInputElement,
    sizeValue: HTMLElement,
    resetBtn: HTMLElement
  ): void {
    let isDraggingPanel = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let panelCollapsed = false;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target === toggle) return;
      isDraggingPanel = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = startLeft + 'px';
      panel.style.top = startTop + 'px';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDraggingPanel) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      const rect = panel.getBoundingClientRect();
      newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - rect.height, newTop));
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    window.addEventListener('mouseup', () => {
      isDraggingPanel = false;
    });

    toggle.addEventListener('click', () => {
      panelCollapsed = !panelCollapsed;
      if (panelCollapsed) {
        content.classList.add('collapsed');
        (toggle as HTMLElement).textContent = '+';
      } else {
        content.classList.remove('collapsed');
        (toggle as HTMLElement).textContent = '−';
      }
    });

    rotationSlider.addEventListener('input', () => {
      const val = parseFloat(rotationSlider.value);
      this.setRotationSpeed(val);
      rotationValue.textContent = val.toFixed(1) + 'x';
      this.callbacks.onRotationChange(val);
    });

    sizeSlider.addEventListener('input', () => {
      const val = parseFloat(sizeSlider.value);
      this.setSizeScale(val);
      sizeValue.textContent = val.toFixed(1) + 'x';
      this.callbacks.onSizeChange(val);
    });

    resetBtn.addEventListener('click', () => {
      rotationSlider.value = '1';
      sizeSlider.value = '1';
      rotationValue.textContent = '1.0x';
      sizeValue.textContent = '1.0x';
      this.setRotationSpeed(1);
      this.setSizeScale(1);
      this.callbacks.onRotationChange(1);
      this.callbacks.onSizeChange(1);
      this.callbacks.onResetView();
      this.resetView();
    });
  }

  public dispose(): void {
    const canvas = this.renderer.domElement;

    canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    canvas.removeEventListener('wheel', this.handleWheel);
    canvas.removeEventListener('click', this.handleClick);
    window.removeEventListener('resize', this.handleResize);

    this.clearHoverTimer();
  }
}
