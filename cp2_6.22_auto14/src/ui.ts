import * as THREE from 'three';
import { Galaxy } from './galaxy';


export interface SimParams {
  mass1: number;
  mass2: number;
  distance: number;
  angle: number;
  velocity: number;
  particleCount: number;
  heatmapIntensity: number;
}

export interface UIElements {
  mass1: HTMLInputElement;
  mass2: HTMLInputElement;
  distance: HTMLInputElement;
  angle: HTMLInputElement;
  velocity: HTMLInputElement;
  particles: HTMLInputElement;
  heatmap: HTMLInputElement;
  playBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  timeline: HTMLInputElement;
  kineticEnergy: HTMLElement;
  potentialEnergy: HTMLElement;
  totalEnergy: HTMLElement;
  fpsDisplay: HTMLElement;
  particleCount: HTMLElement;
  currentTime: HTMLElement;
  speedButtons: NodeListOf<HTMLButtonElement>;
}

export class UIController {
  public params: SimParams;
  public isPlaying: boolean = false;
  public playbackSpeed: number = 1;
  public onParamsChange: (() => void) | null = null;
  public onPlayPause: ((playing: boolean) => void) | null = null;
  public onReset: (() => void) | null = null;
  public onTimelineChange: ((value: number) => void) | null = null;
  public onSpeedChange: ((speed: number) => void) | null = null;

  private elements: UIElements;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;

  constructor() {
    this.params = {
      mass1: 1,
      mass2: 0.8,
      distance: 150,
      angle: 30,
      velocity: 1,
      particleCount: 5000,
      heatmapIntensity: 0.5
    };

    this.elements = this.getElements();
    this.bindEvents();
    this.updateDisplayValues();
  }

  private getElements(): UIElements {
    return {
      mass1: document.getElementById('mass1') as HTMLInputElement,
      mass2: document.getElementById('mass2') as HTMLInputElement,
      distance: document.getElementById('distance') as HTMLInputElement,
      angle: document.getElementById('angle') as HTMLInputElement,
      velocity: document.getElementById('velocity') as HTMLInputElement,
      particles: document.getElementById('particles') as HTMLInputElement,
      heatmap: document.getElementById('heatmap') as HTMLInputElement,
      playBtn: document.getElementById('play-btn') as HTMLButtonElement,
      resetBtn: document.getElementById('reset-btn') as HTMLButtonElement,
      timeline: document.getElementById('timeline') as HTMLInputElement,
      kineticEnergy: document.getElementById('kinetic-energy')!,
      potentialEnergy: document.getElementById('potential-energy')!,
      totalEnergy: document.getElementById('total-energy')!,
      fpsDisplay: document.getElementById('fps-display')!,
      particleCount: document.getElementById('particle-count')!,
      currentTime: document.getElementById('current-time')!,
      speedButtons: document.querySelectorAll('.speed-btn') as NodeListOf<HTMLButtonElement>
    };
  }

  private bindEvents(): void {
    this.elements.mass1.addEventListener('input', () => {
      this.params.mass1 = parseFloat(this.elements.mass1.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.mass2.addEventListener('input', () => {
      this.params.mass2 = parseFloat(this.elements.mass2.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.distance.addEventListener('input', () => {
      this.params.distance = parseFloat(this.elements.distance.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.angle.addEventListener('input', () => {
      this.params.angle = parseFloat(this.elements.angle.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.velocity.addEventListener('input', () => {
      this.params.velocity = parseFloat(this.elements.velocity.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.particles.addEventListener('input', () => {
      this.params.particleCount = parseInt(this.elements.particles.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.heatmap.addEventListener('input', () => {
      this.params.heatmapIntensity = parseFloat(this.elements.heatmap.value);
      this.updateDisplayValues();
      this.onParamsChange?.();
    });

    this.elements.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    this.elements.resetBtn.addEventListener('click', () => {
      this.reset();
    });

    this.elements.timeline.addEventListener('input', () => {
      const value = parseFloat(this.elements.timeline.value);
      this.onTimelineChange?.(value / 1000);
      this.updateTimeDisplay(value / 1000);
    });

    this.elements.speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed || '1');
        this.setPlaybackSpeed(speed);
      });
    });
  }

  private updateDisplayValues(): void {
    (document.getElementById('mass1-value') as HTMLElement).textContent = this.params.mass1.toFixed(1);
    (document.getElementById('mass2-value') as HTMLElement).textContent = this.params.mass2.toFixed(1);
    (document.getElementById('distance-value') as HTMLElement).textContent = this.params.distance.toString();
    (document.getElementById('angle-value') as HTMLElement).textContent = `${this.params.angle}°`;
    (document.getElementById('velocity-value') as HTMLElement).textContent = `${this.params.velocity.toFixed(1)}x`;
    (document.getElementById('particles-value') as HTMLElement).textContent = this.params.particleCount.toString();
    (document.getElementById('heatmap-value') as HTMLElement).textContent = this.params.heatmapIntensity.toFixed(2);
  }

  public togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    this.elements.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
    this.onPlayPause?.(this.isPlaying);
  }

  public reset(): void {
    this.isPlaying = false;
    this.elements.playBtn.textContent = '▶';
    this.elements.timeline.value = '0';
    this.updateTimeDisplay(0);
    this.onReset?.();
  }

  public setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
    this.elements.speedButtons.forEach(btn => {
      const btnSpeed = parseFloat(btn.dataset.speed || '1');
      btn.classList.toggle('active', Math.abs(btnSpeed - speed) < 0.01);
    });
    this.onSpeedChange?.(speed);
  }

  public updateTimeDisplay(normalizedTime: number): void {
    const totalTime = 2.0;
    const current = normalizedTime * totalTime;
    this.elements.currentTime.textContent = `${current.toFixed(2)} Gyr`;
  }

  public updateEnergyDisplay(kinetic: number, potential: number, total: number): void {
    this.elements.kineticEnergy.textContent = this.formatNumber(kinetic);
    this.elements.potentialEnergy.textContent = this.formatNumber(potential);
    this.elements.totalEnergy.textContent = this.formatNumber(total);
  }

  public updateParticleCount(count: number): void {
    this.elements.particleCount.textContent = count.toString();
  }

  public updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsTime));
      this.elements.fpsDisplay.textContent = fps.toString();
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  public setTimelineValue(normalizedTime: number): void {
    this.elements.timeline.value = (normalizedTime * 1000).toString();
    this.updateTimeDisplay(normalizedTime);
  }

  private formatNumber(num: number): string {
    if (Math.abs(num) >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    } else if (Math.abs(num) >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  }
}

export function createGalaxiesFromParams(params: SimParams): { galaxy1: Galaxy; galaxy2: Galaxy } {
  const particlesPerGalaxy = Math.floor(params.particleCount / 2);
  const radius1 = 50 * Math.pow(params.mass1, 0.5);
  const radius2 = 40 * Math.pow(params.mass2, 0.5);

  const angleRad = (params.angle * Math.PI) / 180;
  const halfDist = params.distance / 2;

  const pos1 = new THREE.Vector3(-halfDist, 0, 0);
  const pos2 = new THREE.Vector3(
    halfDist * Math.cos(angleRad),
    0,
    halfDist * Math.sin(angleRad)
  );

  const galaxy1 = new Galaxy({
    particleCount: particlesPerGalaxy,
    mass: params.mass1 * 100,
    radius: radius1,
    armCount: 4,
    position: pos1,
    rotationSpeed: 0.8,
    colorScheme: 'blue'
  });

  const galaxy2 = new Galaxy({
    particleCount: particlesPerGalaxy,
    mass: params.mass2 * 100,
    radius: radius2,
    armCount: 3,
    position: pos2,
    rotationSpeed: 0.7,
    colorScheme: 'red'
  });

  const relativeVelocity = params.velocity * 20;
  const velAngle = angleRad + Math.PI / 2;
  
  galaxy1.velocity.set(
    relativeVelocity * Math.cos(velAngle) * 0.5,
    0,
    relativeVelocity * Math.sin(velAngle) * 0.3
  );

  galaxy2.velocity.set(
    -relativeVelocity * Math.cos(velAngle) * 0.5,
    0,
    -relativeVelocity * Math.sin(velAngle) * 0.3
  );

  galaxy1.heatmapIntensity = params.heatmapIntensity;
  galaxy2.heatmapIntensity = params.heatmapIntensity;

  return { galaxy1, galaxy2 };
}
