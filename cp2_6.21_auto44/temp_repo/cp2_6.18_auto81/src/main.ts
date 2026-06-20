import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MoleculeRenderer, OrbitControlsApi, RenderMode } from './renderer';
import { parseSMILES, PRESET_MOLECULES, MoleculeData } from './parser';
import { UIController } from './ui';

class OrbitControlsAdapter implements OrbitControlsApi {
  private impl: ThreeOrbitControls;
  constructor(impl: ThreeOrbitControls) {
    this.impl = impl;
  }
  get target(): THREE.Vector3 { return this.impl.target; }
  set target(v: THREE.Vector3) { this.impl.target.copy(v); }
  get rotateSpeed(): number { return this.impl.rotateSpeed; }
  set rotateSpeed(v: number) { this.impl.rotateSpeed = v; }
  get zoomSpeed(): number { return this.impl.zoomSpeed; }
  set zoomSpeed(v: number) { this.impl.zoomSpeed = v; }
  get panSpeed(): number { return this.impl.panSpeed; }
  set panSpeed(v: number) { this.impl.panSpeed = v; }
  get enableDamping(): boolean { return this.impl.enableDamping; }
  set enableDamping(v: boolean) { this.impl.enableDamping = v; }
  get dampingFactor(): number { return this.impl.dampingFactor; }
  set dampingFactor(v: number) { this.impl.dampingFactor = v; }
  public update(): void { this.impl.update(); }
  public dispose(): void { this.impl.dispose(); }
  public get controls(): ThreeOrbitControls { return this.impl; }
}

class App {
  private renderer!: MoleculeRenderer;
  private ui!: UIController;
  private orbitImpl!: ThreeOrbitControls;
  private orbitAdapter!: OrbitControlsAdapter;
  private container: HTMLElement;
  private autoRotateTimer: number | null = null;

  constructor() {
    const app = document.getElementById('app');
    if (!app) throw new Error('App container not found');
    this.container = app;
    this.init();
  }

  private init(): void {
    const canvasContainer = document.getElementById('canvas-container') as HTMLElement;

    this.renderer = new MoleculeRenderer(canvasContainer, {
      onFpsUpdate: (fps) => this.ui?.setFps(fps),
      onAtomHover: () => {},
      onAtomSelect: (idx) => {
        this.ui?.setSelectedAtom(idx);
      }
    });

    this.orbitImpl = new ThreeOrbitControls(this.renderer.camera, this.renderer.renderer.domElement);
    this.orbitImpl.enableDamping = true;
    this.orbitImpl.dampingFactor = 0.08;
    this.orbitImpl.rotateSpeed = 1.0;
    this.orbitImpl.zoomSpeed = 1.0;
    this.orbitImpl.panSpeed = 1.0;
    this.orbitImpl.enablePan = true;
    this.orbitImpl.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.orbitImpl.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    this.orbitImpl.minDistance = 2;
    this.orbitImpl.maxDistance = 200;
    this.orbitAdapter = new OrbitControlsAdapter(this.orbitImpl);
    this.renderer.controls = this.orbitAdapter;

    this.ui = new UIController(this.container, {
      onLoadSMILES: (smiles) => this.loadSMILES(smiles),
      onLoadPreset: (key) => this.loadPreset(key),
      onSetRenderMode: (mode) => this.setRenderMode(mode),
      onResetView: () => this.renderer.resetView(),
      onSetRotationSpeed: (speed) => this.renderer.setRotationSpeed(speed),
      onSetZoomSpeed: (speed) => this.renderer.setZoomSpeed(speed),
      onToggleAutoRotate: (enabled) => this.setAutoRotate(enabled)
    });

    this.renderer.start();
    this.loadPreset('caffeine');

    setTimeout(() => {
      const presetBtns = (document as any).querySelectorAll('#app button[data-preset]');
      presetBtns.forEach((b: HTMLButtonElement) => {
        if (b.dataset.preset === 'caffeine') (b as any).click();
      });
    }, 50);
  }

  private loadSMILES(smiles: string): void {
    try {
      const data = parseSMILES(smiles);
      this.loadMolecule(data);
    } catch (err) {
      console.error('SMILES 解析失败:', err);
      alert(`解析失败：${(err as Error).message || '请检查输入格式'}`);
    }
  }

  private loadPreset(key: string): void {
    const fn = PRESET_MOLECULES[key];
    if (!fn) return;
    try {
      const data = fn();
      this.loadMolecule(data);
    } catch (err) {
      console.error('预设载入失败:', err);
    }
  }

  private loadMolecule(data: MoleculeData): void {
    this.renderer.loadMolecule(data);
    this.ui.setMolecule(data);
    this.ui.setSelectedAtom(null);
  }

  private setRenderMode(mode: RenderMode): void {
    this.renderer.setRenderMode(mode);
  }

  private setAutoRotate(enabled: boolean): void {
    if (this.autoRotateTimer !== null) {
      cancelAnimationFrame(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
    this.orbitImpl.autoRotate = enabled;
    this.orbitImpl.autoRotateSpeed = 1.8;
    if (enabled) {
      const tick = () => {
        this.orbitImpl.update();
        this.autoRotateTimer = requestAnimationFrame(tick);
      };
      this.autoRotateTimer = requestAnimationFrame(tick);
    }
  }

  public dispose(): void {
    this.setAutoRotate(false);
    this.orbitImpl.dispose();
    this.renderer.dispose();
    this.ui.dispose();
  }
}

let app: App | null = null;

window.addEventListener('DOMContentLoaded', () => {
  try {
    app = new App();
  } catch (err) {
    console.error('初始化失败:', err);
  }
});

window.addEventListener('beforeunload', () => {
  app?.dispose();
});
