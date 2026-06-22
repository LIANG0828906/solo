import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TerrainRenderer } from './TerrainRenderer';

export interface CameraState {
  pitch: number;
  azimuth: number;
  zoom: number;
}

export interface PointInfo {
  x: number;
  z: number;
  height: number;
  gridX: number;
  gridZ: number;
}

export class InteractionController {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private terrainRenderer: TerrainRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private infoCard: HTMLDivElement | null = null;
  private crosshair: HTMLDivElement | null = null;
  private hovered: boolean = false;
  private onCameraChangeCallback: ((state: CameraState) => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    terrainRenderer: TerrainRenderer
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.terrainRenderer = terrainRenderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 180;
    this.controls.zoomSpeed = 1.2;
    this.controls.rotateSpeed = 0.8;
    this.controls.panSpeed = 1.0;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.target.set(0, 0, 0);

    this.setupCrosshair();
    this.setupEventListeners();
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  setOnCameraChange(callback: (state: CameraState) => void): void {
    this.onCameraChangeCallback = callback;
  }

  private setupCrosshair(): void {
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 1000;
      width: 20px;
      height: 20px;
      display: none;
      transform: translate(-50%, -50%);
    `;
    const vLine = document.createElement('div');
    vLine.style.cssText = `
      position: absolute;
      left: 50%;
      top: 0;
      width: 1px;
      height: 100%;
      background: rgba(0, 255, 255, 0.9);
      transform: translateX(-50%);
      box-shadow: 0 0 4px rgba(0, 255, 255, 0.8);
    `;
    const hLine = document.createElement('div');
    hLine.style.cssText = `
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: rgba(0, 255, 255, 0.9);
      transform: translateY(-50%);
      box-shadow: 0 0 4px rgba(0, 255, 255, 0.8);
    `;
    this.crosshair.appendChild(vLine);
    this.crosshair.appendChild(hLine);
    document.body.appendChild(this.crosshair);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('click', (e) => this.onClick(e));
    canvas.addEventListener('mouseleave', () => this.onMouseLeave());
    document.addEventListener('click', (e) => this.onDocumentClick(e));

    this.controls.addEventListener('change', () => this.updateCameraState());
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.crosshair) {
      this.crosshair.style.left = e.clientX + 'px';
      this.crosshair.style.top = e.clientY + 'px';
    }

    const mesh = this.terrainRenderer.getMesh();
    if (!mesh) {
      this.hovered = false;
      if (this.crosshair) this.crosshair.style.display = 'none';
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(mesh);

    this.hovered = intersects.length > 0;
    if (this.crosshair) {
      this.crosshair.style.display = this.hovered ? 'block' : 'none';
    }
    this.renderer.domElement.style.cursor = this.hovered ? 'none' : 'default';
  }

  private onMouseLeave(): void {
    this.hovered = false;
    if (this.crosshair) this.crosshair.style.display = 'none';
    this.renderer.domElement.style.cursor = 'default';
  }

  private onClick(e: MouseEvent): void {
    if (!this.hovered) return;

    const mesh = this.terrainRenderer.getMesh();
    if (!mesh) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(mesh);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const stats = this.terrainRenderer.getStats();
      let gridX = 0, gridZ = 0;
      if (stats) {
        gridX = Math.round(((point.x / 100) + 0.5) * (stats.cols - 1));
        gridZ = Math.round(((point.z / 100) + 0.5) * (stats.rows - 1));
      }
      this.showInfoCard(e.clientX, e.clientY, {
        x: point.x,
        z: point.z,
        height: point.y,
        gridX,
        gridZ
      });
    }
  }

  private onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (this.infoCard && !this.infoCard.contains(target) && target !== this.renderer.domElement) {
      this.hideInfoCard();
    }
    if (this.infoCard && target === this.renderer.domElement) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const mesh = this.terrainRenderer.getMesh();
      if (mesh) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(mesh);
        if (intersects.length === 0) {
          this.hideInfoCard();
        }
      }
    }
  }

  private showInfoCard(x: number, y: number, info: PointInfo): void {
    if (this.infoCard) {
      document.body.removeChild(this.infoCard);
    }

    this.infoCard = document.createElement('div');
    const cardWidth = Math.max(180, Math.min(280, window.innerWidth * 0.15));

    let left = x + 20;
    let top = y + 20;
    if (left + cardWidth > window.innerWidth) left = x - cardWidth - 20;
    if (top + 150 > window.innerHeight) top = y - 150;

    this.infoCard.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      width: ${cardWidth}px;
      padding: 16px;
      background: rgba(22, 33, 62, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1);
      color: white;
      font-family: 'Courier New', monospace;
      font-size: ${Math.max(12, Math.min(14, window.innerWidth / 140))}px;
      z-index: 1001;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    `;

    this.infoCard.innerHTML = `
      <div style="margin-bottom: 8px; color: #00ffff; font-size: 0.85em; letter-spacing: 1px;">网格点信息</div>
      <div style="display: flex; justify-content: space-between; margin: 6px 0;">
        <span style="color: #aaa;">网格 X:</span>
        <span>${info.gridX}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 6px 0;">
        <span style="color: #aaa;">网格 Z:</span>
        <span>${info.gridZ}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 6px 0;">
        <span style="color: #aaa;">世界 X:</span>
        <span>${info.x.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 6px 0;">
        <span style="color: #aaa;">世界 Z:</span>
        <span>${info.z.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 6px 0; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
        <span style="color: #00ffff;">高度:</span>
        <span style="color: #00ffff; font-weight: bold;">${info.height.toFixed(3)}</span>
      </div>
    `;

    document.body.appendChild(this.infoCard);

    requestAnimationFrame(() => {
      if (this.infoCard) {
        this.infoCard.style.opacity = '1';
        this.infoCard.style.transform = 'scale(1)';
      }
    });
  }

  private hideInfoCard(): void {
    if (!this.infoCard) return;
    this.infoCard.style.opacity = '0';
    this.infoCard.style.transform = 'scale(0.8)';
    const card = this.infoCard;
    setTimeout(() => {
      if (card.parentNode) document.body.removeChild(card);
    }, 300);
    this.infoCard = null;
  }

  private updateCameraState(): void {
    if (!this.onCameraChangeCallback) return;

    const position = this.camera.position;
    const target = this.controls.target;
    const dx = position.x - target.x;
    const dy = position.y - target.y;
    const dz = position.z - target.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const pitch = Math.asin(dy / distance);
    const azimuth = Math.atan2(dz, dx);

    const baseDistance = 60;
    const zoom = baseDistance / distance;

    this.onCameraChangeCallback({
      pitch: (pitch * 180) / Math.PI,
      azimuth: ((azimuth * 180) / Math.PI + 360) % 360,
      zoom
    });
  }

  update(): void {
    this.controls.update();
  }
}
