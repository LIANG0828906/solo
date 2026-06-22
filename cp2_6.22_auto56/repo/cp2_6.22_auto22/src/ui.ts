import { GUI } from 'dat.gui';
import * as THREE from 'three';
import { Galaxy, GalaxyParams } from './galaxy';
import { CollisionSimulator } from './collision';

export interface SimParams {
  massA: number;
  massB: number;
  initialDistance: number;
  collisionAngle: number;
  speedMultiplier: number;
  playbackSpeed: number;
}

export interface UICallbacks {
  onParamsChange: (params: SimParams) => void;
  onReset: () => void;
  onPlayToggle: () => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onTimeSeek: (t: number) => void;
}

export class UIController {
  public params: SimParams;
  public isPlaying: boolean = false;
  public playbackSpeed: number = 1;
  public currentTime: number = 0;
  public totalTime: number = 100;

  private callbacks: UICallbacks;
  private gui: GUI | null = null;
  private timelineDragging: boolean = false;

  private els: {
    massA: HTMLInputElement;
    massB: HTMLInputElement;
    distance: HTMLInputElement;
    angle: HTMLInputElement;
    speedMul: HTMLInputElement;
    massAValue: HTMLSpanElement;
    massBValue: HTMLSpanElement;
    distanceValue: HTMLSpanElement;
    angleValue: HTMLSpanElement;
    speedMulValue: HTMLSpanElement;
    kineticValue: HTMLDivElement;
    potentialValue: HTMLDivElement;
    playBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    playIcon: SVGSVGElement;
    timeline: HTMLInputElement;
    timeCurrent: HTMLSpanElement;
    timeTotal: HTMLSpanElement;
    speedBtns: NodeListOf<HTMLButtonElement>;
  };

  constructor(params: SimParams, callbacks: UICallbacks) {
    this.params = { ...params };
    this.callbacks = callbacks;
    this.els = this.bindElements();
    this.setupEventListeners();
    this.setupGUI();
    this.updateSliderDisplays();
  }

  private bindElements() {
    const getInput = (id: string) => document.getElementById(id) as HTMLInputElement;
    const getSpan = (id: string) => document.getElementById(id) as HTMLSpanElement;
    const getDiv = (id: string) => document.getElementById(id) as HTMLDivElement;
    const getBtn = (id: string) => document.getElementById(id) as HTMLButtonElement;

    return {
      massA: getInput('massA'),
      massB: getInput('massB'),
      distance: getInput('distance'),
      angle: getInput('angle'),
      speedMul: getInput('speedMul'),
      massAValue: getSpan('massA-value'),
      massBValue: getSpan('massB-value'),
      distanceValue: getSpan('distance-value'),
      angleValue: getSpan('angle-value'),
      speedMulValue: getSpan('speedMul-value'),
      kineticValue: getDiv('kinetic-value'),
      potentialValue: getDiv('potential-value'),
      playBtn: getBtn('play-btn'),
      resetBtn: getBtn('reset-btn'),
      playIcon: document.getElementById('play-icon') as unknown as SVGSVGElement,
      timeline: getInput('timeline'),
      timeCurrent: getSpan('time-current'),
      timeTotal: getSpan('time-total'),
      speedBtns: document.querySelectorAll('.speed-btn') as NodeListOf<HTMLButtonElement>,
    };
  }

  private setupEventListeners(): void {
    const onSliderChange = () => {
      this.params.massA = parseFloat(this.els.massA.value);
      this.params.massB = parseFloat(this.els.massB.value);
      this.params.initialDistance = parseFloat(this.els.distance.value);
      this.params.collisionAngle = parseFloat(this.els.angle.value);
      this.params.speedMultiplier = parseFloat(this.els.speedMul.value);
      this.updateSliderDisplays();
      this.callbacks.onParamsChange(this.params);
    };

    this.els.massA.addEventListener('input', onSliderChange);
    this.els.massB.addEventListener('input', onSliderChange);
    this.els.distance.addEventListener('input', onSliderChange);
    this.els.angle.addEventListener('input', onSliderChange);
    this.els.speedMul.addEventListener('input', onSliderChange);

    this.els.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    this.els.resetBtn.addEventListener('click', () => {
      this.callbacks.onReset();
      this.setTime(0);
      this.setPlaying(true);
    });

    this.els.timeline.addEventListener('mousedown', () => {
      this.timelineDragging = true;
    });
    this.els.timeline.addEventListener('touchstart', () => {
      this.timelineDragging = true;
    });
    this.els.timeline.addEventListener('input', (e) => {
      const t = parseFloat((e.target as HTMLInputElement).value);
      this.currentTime = t;
      this.updateTimeDisplay();
    });
    const onSeekEnd = (e: Event) => {
      if (this.timelineDragging) {
        this.timelineDragging = false;
        const t = parseFloat((e.target as HTMLInputElement).value);
        this.callbacks.onTimeSeek(t);
      }
    };
    this.els.timeline.addEventListener('mouseup', onSeekEnd);
    this.els.timeline.addEventListener('touchend', onSeekEnd);
    this.els.timeline.addEventListener('change', onSeekEnd);

    this.els.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed || '1');
        this.setPlaybackSpeed(speed);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'KeyR') {
        this.callbacks.onReset();
        this.setTime(0);
      }
    });
  }

  private setupGUI(): void {
    this.gui = new GUI({ width: 280 });
    this.gui.domElement.style.display = 'none';

    const params = {
      massA: this.params.massA,
      massB: this.params.massB,
      initialDistance: this.params.initialDistance,
      collisionAngle: this.params.collisionAngle,
      speedMultiplier: this.params.speedMultiplier,
    };

    const folder = this.gui.addFolder('星系参数');
    folder.add(params, 'massA', 0.2, 3.0, 0.1).name('星系A质量').onChange((v: number) => {
      this.params.massA = v;
      this.els.massA.value = String(v);
      this.updateSliderDisplays();
      this.callbacks.onParamsChange(this.params);
    });
    folder.add(params, 'massB', 0.2, 3.0, 0.1).name('星系B质量').onChange((v: number) => {
      this.params.massB = v;
      this.els.massB.value = String(v);
      this.updateSliderDisplays();
      this.callbacks.onParamsChange(this.params);
    });
    folder.add(params, 'initialDistance', 60, 200, 5).name('初始距离').onChange((v: number) => {
      this.params.initialDistance = v;
      this.els.distance.value = String(v);
      this.updateSliderDisplays();
      this.callbacks.onParamsChange(this.params);
    });
    folder.add(params, 'collisionAngle', 0, 90, 1).name('碰撞角度').onChange((v: number) => {
      this.params.collisionAngle = v;
      this.els.angle.value = String(v);
      this.updateSliderDisplays();
      this.callbacks.onParamsChange(this.params);
    });
    folder.add(params, 'speedMultiplier', 0.2, 3.0, 0.1).name('速度倍数').onChange((v: number) => {
      this.params.speedMultiplier = v;
      this.els.speedMul.value = String(v);
      this.updateSliderDisplays();
      this.callbacks.onParamsChange(this.params);
    });
  }

  private updateSliderDisplays(): void {
    this.els.massAValue.textContent = this.params.massA.toFixed(1);
    this.els.massBValue.textContent = this.params.massB.toFixed(1);
    this.els.distanceValue.textContent = String(Math.round(this.params.initialDistance));
    this.els.angleValue.textContent = String(Math.round(this.params.collisionAngle));
    this.els.speedMulValue.textContent = this.params.speedMultiplier.toFixed(1);
  }

  private updateTimeDisplay(): void {
    this.els.timeCurrent.textContent = `${this.currentTime.toFixed(2)}s`;
    this.els.timeTotal.textContent = `${this.totalTime.toFixed(1)}s`;
    if (!this.timelineDragging) {
      this.els.timeline.value = String(Math.min(this.currentTime, this.totalTime));
    }
  }

  public updateEnergyDisplay(kinetic: number, potential: number): void {
    this.els.kineticValue.textContent = kinetic.toFixed(2);
    this.els.potentialValue.textContent = potential.toFixed(2);
  }

  public setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    if (playing) {
      this.els.playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
      this.els.playIcon.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
    }
  }

  public togglePlay(): void {
    this.setPlaying(!this.isPlaying);
    this.callbacks.onPlayToggle();
  }

  public setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
    this.els.speedBtns.forEach((btn) => {
      const btnSpeed = parseFloat(btn.dataset.speed || '1');
      btn.classList.toggle('active', Math.abs(btnSpeed - speed) < 0.001);
    });
    this.callbacks.onPlaybackSpeedChange(speed);
  }

  public setTime(t: number): void {
    this.currentTime = Math.max(0, Math.min(t, this.totalTime));
    this.updateTimeDisplay();
  }

  public incrementTime(dt: number): void {
    if (!this.timelineDragging) {
      this.currentTime += dt;
      if (this.currentTime > this.totalTime) {
        this.currentTime = this.totalTime;
        this.setPlaying(false);
      }
      this.updateTimeDisplay();
    }
  }

  public syncFromGUI(): void {
    this.updateSliderDisplays();
  }
}

export function buildGalaxyParams(params: SimParams, particleCount: number): {
  galaxyA: GalaxyParams;
  galaxyB: GalaxyParams;
  initialVelA: THREE.Vector3;
  initialVelB: THREE.Vector3;
} {
  const d = params.initialDistance;
  const angleRad = (params.collisionAngle * Math.PI) / 180;

  const posA = new THREE.Vector3(-d / 2, 0, 0);
  const posB = new THREE.Vector3(d / 2, 0, 0);

  const rotA = new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ');
  const rotB = new THREE.Euler(Math.PI / 2 + angleRad, 0, angleRad * 0.5, 'XYZ');

  const galaxyA: GalaxyParams = {
    particleCount,
    mass: params.massA,
    radius: 40,
    arms: 4,
    position: posA,
    rotation: rotA,
  };

  const galaxyB: GalaxyParams = {
    particleCount,
    mass: params.massB,
    radius: 40,
    arms: 4,
    position: posB,
    rotation: rotB,
  };

  const totalMass = params.massA + params.massB;
  const orbitSpeed = Math.sqrt(totalMass * 2.0 / d) * params.speedMultiplier;

  const velA = new THREE.Vector3(0, orbitSpeed * 0.3, orbitSpeed);
  const velB = new THREE.Vector3(0, -orbitSpeed * 0.3, -orbitSpeed);

  return { galaxyA, galaxyB, initialVelA: velA, initialVelB: velB };
}

export function applyInitialVelocities(
  galaxyA: Galaxy,
  galaxyB: Galaxy,
  velA: THREE.Vector3,
  velB: THREE.Vector3,
): void {
  galaxyA.coreVelocity.copy(velA);
  galaxyB.coreVelocity.copy(velB);

  const countA = galaxyA.particleCount;
  const countB = galaxyB.particleCount;

  for (let i = 0; i < countA; i++) {
    const i3 = i * 3;
    galaxyA.velocities[i3] += velA.x;
    galaxyA.velocities[i3 + 1] += velA.y;
    galaxyA.velocities[i3 + 2] += velA.z;
  }

  for (let i = 0; i < countB; i++) {
    const i3 = i * 3;
    galaxyB.velocities[i3] += velB.x;
    galaxyB.velocities[i3 + 1] += velB.y;
    galaxyB.velocities[i3 + 2] += velB.z;
  }
}

export function reinitializeSimulation(
  params: SimParams,
  particleCount: number,
  galaxyA: Galaxy,
  galaxyB: Galaxy,
  simulator: CollisionSimulator,
): void {
  const { galaxyA: gA, galaxyB: gB, initialVelA, initialVelB } = buildGalaxyParams(params, particleCount);
  galaxyA.reset(gA);
  galaxyB.reset(gB);
  applyInitialVelocities(galaxyA, galaxyB, initialVelA, initialVelB);
  simulator.time = 0;
  simulator.saveInitialState();
}
