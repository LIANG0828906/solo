import * as THREE from 'three';
import { DisplayMode, MoleculeBuilder, MOLECULES } from './MoleculeBuilder';

type MoleculeChangeCallback = (key: string) => void;
type DisplayModeChangeCallback = (mode: DisplayMode) => void;
type RotationSpeedChangeCallback = (speed: number) => void;

interface AnimationState {
  isTransitioning: boolean;
  phase: 'fadeout' | 'delay' | 'fadein' | 'idle';
  phaseTimer: number;
  pendingMolecule: string;
}

export class UIManager {
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private moleculeBuilder: MoleculeBuilder;

  private isDragging: boolean = false;
  private previousMouse: { x: number; y: number } = { x: 0, y: 0 };
  private autoRotateResumeTimer: number = 0;
  private autoRotatePaused: boolean = false;
  private rotationSpeed: number = 0.3;

  private targetRotationX: number = 0;
  private targetRotationY: number = 0;
  private currentRotationX: number = 0;
  private currentRotationY: number = 0;

  private zoomLevel: number = 1.0;
  private baseDistance: number = 5;

  private moleculeAnimState: AnimationState = {
    isTransitioning: false,
    phase: 'idle',
    phaseTimer: 0,
    pendingMolecule: '',
  };

  private onMoleculeChange: MoleculeChangeCallback | null = null;
  private onDisplayModeChange: DisplayModeChangeCallback | null = null;
  private onRotationSpeedChange: RotationSpeedChangeCallback | null = null;

  private infoCard: HTMLElement;
  private cardName: HTMLElement;
  private cardFormula: HTMLElement;
  private cardWeight: HTMLElement;
  private cardAngles: HTMLElement;

  private startWeight: number = 0;
  private animatedWeight: number = 0;
  private targetWeight: number = 0;
  private weightAnimTimer: number = 0;
  private startAngle: number = 0;
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private angleAnimTimer: number = 0;
  private cardAnimState: 'idle' | 'sliding-out' | 'sliding-in' = 'idle';
  private cardAnimTimer: number = 0;
  private pendingInfo: { formula: string; weight: number; angle: number; angleStr: string } | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    moleculeBuilder: MoleculeBuilder
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.moleculeBuilder = moleculeBuilder;

    this.infoCard = document.getElementById('info-card')!;
    this.cardName = document.getElementById('card-molecule-name')!;
    this.cardFormula = document.getElementById('card-formula')!;
    this.cardWeight = document.getElementById('card-weight')!;
    this.cardAngles = document.getElementById('card-angles')!;

    this.setupToolbar();
    this.setupMouseControls();
    this.setupInfoCard();
  }

  setMoleculeChangeCallback(cb: MoleculeChangeCallback): void {
    this.onMoleculeChange = cb;
  }

  setDisplayModeChangeCallback(cb: DisplayModeChangeCallback): void {
    this.onDisplayModeChange = cb;
  }

  setRotationSpeedChangeCallback(cb: RotationSpeedChangeCallback): void {
    this.onRotationSpeedChange = cb;
  }

  getAutoRotatePaused(): boolean {
    return this.autoRotatePaused;
  }

  getRotationSpeed(): number {
    return this.rotationSpeed;
  }

  getTargetRotationX(): number {
    return this.targetRotationX;
  }

  getTargetRotationY(): number {
    return this.targetRotationY;
  }

  isTransitioning(): boolean {
    return this.moleculeAnimState.isTransitioning;
  }

  private setupToolbar(): void {
    const select = document.getElementById('molecule-select') as HTMLSelectElement;
    select.addEventListener('change', () => {
      this.startMoleculeTransition(select.value);
    });

    const modes: { id: string; mode: DisplayMode }[] = [
      { id: 'mode-ball-stick', mode: 'ball-stick' },
      { id: 'mode-space-fill', mode: 'space-fill' },
      { id: 'mode-wireframe', mode: 'wireframe' },
    ];

    for (const { id, mode } of modes) {
      const btn = document.getElementById(id)!;
      btn.addEventListener('click', () => {
        for (const m of modes) {
          document.getElementById(m.id)!.classList.remove('active');
        }
        btn.classList.add('active');
        if (this.onDisplayModeChange) this.onDisplayModeChange(mode);
      });
    }

    const slider = document.getElementById('rotation-speed') as HTMLInputElement;
    slider.addEventListener('input', () => {
      this.rotationSpeed = parseFloat(slider.value);
      if (this.onRotationSpeedChange) this.onRotationSpeedChange(this.rotationSpeed);
    });
  }

  private setupMouseControls(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      this.previousMouse = { x: e.clientX, y: e.clientY };
      this.autoRotatePaused = true;
      clearTimeout(this.autoRotateResumeTimer);
    });

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.previousMouse.x;
      const dy = e.clientY - this.previousMouse.y;
      this.targetRotationY += dx * 0.005;
      this.targetRotationX += dy * 0.005;
      this.previousMouse = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.scheduleAutoRotateResume();
    });

    canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.scheduleAutoRotateResume();
      }
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      this.zoomLevel = Math.max(0.5, Math.min(3.0, this.zoomLevel + delta));
      this.updateCameraDistance();
    }, { passive: false });

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.autoRotatePaused = true;
        clearTimeout(this.autoRotateResumeTimer);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.previousMouse.x;
      const dy = e.touches[0].clientY - this.previousMouse.y;
      this.targetRotationY += dx * 0.005;
      this.targetRotationX += dy * 0.005;
      this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
      this.scheduleAutoRotateResume();
    });
  }

  private scheduleAutoRotateResume(): void {
    clearTimeout(this.autoRotateResumeTimer);
    this.autoRotateResumeTimer = window.setTimeout(() => {
      this.autoRotatePaused = false;
    }, 1000);
  }

  private updateCameraDistance(): void {
    this.camera.position.set(0, 0, this.baseDistance * this.zoomLevel);
    this.camera.lookAt(0, 0, 0);
  }

  setBaseDistance(distance: number): void {
    this.baseDistance = distance;
    this.updateCameraDistance();
  }

  private setupInfoCard(): void {
    requestAnimationFrame(() => {
      this.infoCard.classList.add('visible');
    });
    this.cardName.textContent = '水';
    this.cardFormula.textContent = 'H₂O';
    this.cardAngles.textContent = '104.5°';
    this.cardWeight.textContent = '18.015';
    this.startWeight = 18.015;
    this.animatedWeight = 18.015;
    this.targetWeight = 18.015;
    this.startAngle = 104.5;
    this.currentAngle = 104.5;
    this.targetAngle = 104.5;
  }

  private startMoleculeTransition(key: string): void {
    if (this.moleculeAnimState.isTransitioning) return;
    if (key === this.moleculeBuilder.getCurrentMoleculeKey()) return;

    this.moleculeAnimState = {
      isTransitioning: true,
      phase: 'fadeout',
      phaseTimer: 0,
      pendingMolecule: key,
    };
  }

  updateMoleculeTransition(delta: number): void {
    const state = this.moleculeAnimState;
    if (!state.isTransitioning) return;

    state.phaseTimer += delta;

    switch (state.phase) {
      case 'fadeout': {
        const t = Math.min(1.0, state.phaseTimer / 0.4);
        const scale = 1.0 - t * 0.5;
        const opacity = 1.0 - t;
        this.moleculeBuilder.setGroupScale(scale);
        this.moleculeBuilder.setGroupOpacity(opacity);
        if (t >= 1.0) {
          state.phase = 'delay';
          state.phaseTimer = 0;
        }
        break;
      }
      case 'delay': {
        if (state.phaseTimer >= 0.2) {
          this.moleculeBuilder.buildMolecule(state.pendingMolecule);
          this.moleculeBuilder.setGroupScale(0.5);
          this.moleculeBuilder.setGroupOpacity(0);
          this.updateInfoCard(state.pendingMolecule);
          state.phase = 'fadein';
          state.phaseTimer = 0;
        }
        break;
      }
      case 'fadein': {
        const t = Math.min(1.0, state.phaseTimer / 0.4);
        const eased = this.easeOutCubic(t);
        const scale = 0.5 + eased * 0.5;
        const opacity = eased;
        this.moleculeBuilder.setGroupScale(scale);
        this.moleculeBuilder.setGroupOpacity(opacity);
        if (t >= 1.0) {
          this.moleculeBuilder.setGroupScale(1.0);
          this.moleculeBuilder.setGroupOpacity(1.0);
          state.phase = 'idle';
          state.isTransitioning = false;
        }
        break;
      }
    }
  }

  private updateInfoCard(key: string): void {
    const data = MOLECULES[key];
    if (!data) return;

    const angleStr = data.bondAngles[0] || '';
    const angleNum = parseFloat(angleStr.replace('°', '')) || 0;
    const currentWeightStr = this.cardWeight.textContent || '0';
    const currentWeight = parseFloat(currentWeightStr);
    const currentAngleStr = this.cardAngles.textContent || '';
    const currentAngle = parseFloat(currentAngleStr.replace('°', '')) || 0;

    this.pendingInfo = {
      formula: data.formula,
      weight: data.molecularWeight,
      angle: angleNum,
      angleStr: angleStr,
    };

    this.cardName.textContent = data.name;
    this.startWeightAnimation(currentWeight, data.molecularWeight);
    this.startAngleAnimation(currentAngle, angleNum);

    this.infoCard.classList.remove('visible');
    this.cardAnimState = 'sliding-out';
    this.cardAnimTimer = 0;
  }

  updateCardAnimation(delta: number): void {
    if (this.cardAnimState === 'idle') return;

    this.cardAnimTimer += delta;

    if (this.cardAnimState === 'sliding-out') {
      if (this.cardAnimTimer >= 0.3) {
        if (this.pendingInfo) {
          this.cardFormula.textContent = this.pendingInfo.formula;
        }
        this.infoCard.classList.add('visible');
        this.cardAnimState = 'sliding-in';
        this.cardAnimTimer = 0;
      }
    } else if (this.cardAnimState === 'sliding-in') {
      if (this.cardAnimTimer >= 0.3) {
        this.cardAnimState = 'idle';
        this.pendingInfo = null;
      }
    }
  }

  private startAngleAnimation(from: number, to: number): void {
    this.startAngle = from;
    this.currentAngle = from;
    this.targetAngle = to;
    this.angleAnimTimer = 0;
  }

  updateAngleAnimation(delta: number): void {
    if (Math.abs(this.currentAngle - this.targetAngle) < 0.01) {
      this.currentAngle = this.targetAngle;
      this.cardAngles.textContent = this.currentAngle.toFixed(1) + '°';
      return;
    }

    this.angleAnimTimer += delta;
    const duration = 0.6;
    const t = Math.min(1.0, this.angleAnimTimer / duration);
    const eased = this.easeOutCubic(t);
    const diff = this.targetAngle - this.startAngle;
    this.currentAngle = this.startAngle + diff * eased;
    this.cardAngles.textContent = this.currentAngle.toFixed(1) + '°';
  }

  updateWeightAnimation(delta: number): void {
    if (Math.abs(this.animatedWeight - this.targetWeight) < 0.001) {
      this.animatedWeight = this.targetWeight;
      this.cardWeight.textContent = this.animatedWeight.toFixed(3);
      return;
    }

    this.weightAnimTimer += delta;
    const duration = 0.6;
    const t = Math.min(1.0, this.weightAnimTimer / duration);
    const eased = this.easeOutCubic(t);
    const diff = this.targetWeight - this.startWeight;
    this.animatedWeight = this.startWeight + diff * eased;
    this.cardWeight.textContent = this.animatedWeight.toFixed(3);
  }

  startWeightAnimation(from: number, to: number): void {
    this.startWeight = from;
    this.animatedWeight = from;
    this.targetWeight = to;
    this.weightAnimTimer = 0;
  }

  updateDragRotation(): void {
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.1;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.1;
  }

  getCurrentRotationX(): number {
    return this.currentRotationX;
  }

  getCurrentRotationY(): number {
    return this.currentRotationY;
  }

  updateLabelSizes(camera: THREE.Camera): void {
    const distance = camera.position.length();
    const scaleFactor = Math.max(0.3, Math.min(2.0, distance / 5));
    const molScale = this.moleculeBuilder.getMoleculeScale();
    const group = this.moleculeBuilder.getGroup();
    group.traverse((child) => {
      if (child instanceof THREE.Sprite && child.userData.isLabel === true) {
        const baseScale = 0.5 * scaleFactor * molScale;
        child.scale.set(baseScale, baseScale * 0.5, 1);
      }
    });
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
