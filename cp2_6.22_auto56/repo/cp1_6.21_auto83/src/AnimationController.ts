import { AnimationState, PlaybackSpeed, HELIX_CONFIG } from './types';

export interface AnimationControllerState {
  rotation: number;
  nodeFloatOffsets: number[];
  disassembleProgress: number;
  scatteredPositions: { x: number; y: number; z: number }[];
  reassembleProgress: number;
}

type Listener = (state: AnimationControllerState) => void;

export class AnimationController {
  private state: AnimationControllerState;
  private animationState: AnimationState;
  private playbackSpeed: PlaybackSpeed;
  private listeners: Set<Listener>;
  private rafId: number | null;
  private lastTime: number;
  private floatTime: number;
  private disassembleFrame: number;
  private reassembleFrame: number;
  private totalNodes: number;
  private readonly disassembleDuration = 60;
  private readonly reassembleDuration = 90;
  private readonly rotationSpeed = 10;

  constructor(totalNodes: number = HELIX_CONFIG.nodeCount) {
    this.totalNodes = totalNodes;
    this.animationState = AnimationState.IDLE;
    this.playbackSpeed = PlaybackSpeed.NORMAL;
    this.listeners = new Set();
    this.rafId = null;
    this.lastTime = 0;
    this.floatTime = 0;
    this.disassembleFrame = 0;
    this.reassembleFrame = 0;
    
    this.state = {
      rotation: 0,
      nodeFloatOffsets: new Array(totalNodes * 2).fill(0),
      disassembleProgress: 0,
      scatteredPositions: [],
      reassembleProgress: 0
    };

    this.generateScatteredPositions();
  }

  private generateScatteredPositions() {
    const positions: { x: number; y: number; z: number }[] = [];
    const radius = 80;
    for (let i = 0; i < this.totalNodes * 2; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());
      positions.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta) + 30,
        z: r * Math.cos(phi)
      });
    }
    this.state.scatteredPositions = positions;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  getState(): AnimationControllerState {
    return { ...this.state };
  }

  getAnimationState(): AnimationState {
    return this.animationState;
  }

  setPlaybackSpeed(speed: PlaybackSpeed) {
    this.playbackSpeed = speed;
  }

  getPlaybackSpeed(): PlaybackSpeed {
    return this.playbackSpeed;
  }

  play() {
    if (this.animationState === AnimationState.PLAYING) return;
    if (this.animationState === AnimationState.DISASSEMBLED || 
        this.animationState === AnimationState.DISASSEMBLING ||
        this.animationState === AnimationState.REASSEMBLING) return;
    
    this.animationState = AnimationState.PLAYING;
    this.startAnimationLoop();
  }

  pause() {
    if (this.animationState !== AnimationState.PLAYING) return;
    this.animationState = AnimationState.PAUSED;
    this.stopAnimationLoop();
  }

  togglePlay() {
    if (this.animationState === AnimationState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  disassemble() {
    if (this.animationState === AnimationState.DISASSEMBLING || 
        this.animationState === AnimationState.DISASSEMBLED) return;
    
    this.pause();
    this.animationState = AnimationState.DISASSEMBLING;
    this.disassembleFrame = 0;
    this.generateScatteredPositions();
    this.startAnimationLoop();
  }

  reassemble() {
    if (this.animationState === AnimationState.REASSEMBLING ||
        (this.animationState !== AnimationState.DISASSEMBLED && 
         this.animationState !== AnimationState.DISASSEMBLING)) return;
    
    this.animationState = AnimationState.REASSEMBLING;
    this.reassembleFrame = 0;
    this.startAnimationLoop();
  }

  toggleDisassemble() {
    if (this.animationState === AnimationState.DISASSEMBLED || 
        this.animationState === AnimationState.DISASSEMBLING) {
      this.reassemble();
    } else {
      this.disassemble();
    }
  }

  private startAnimationLoop() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  private stopAnimationLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private animate(currentTime: number) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    switch (this.animationState) {
      case AnimationState.PLAYING:
        this.updatePlaying(deltaTime);
        break;
      case AnimationState.DISASSEMBLING:
        this.updateDisassembling(deltaTime);
        break;
      case AnimationState.REASSEMBLING:
        this.updateReassembling(deltaTime);
        break;
      default:
        break;
    }

    this.notify();
    this.rafId = requestAnimationFrame(this.animate);
  }

  private updatePlaying(deltaTime: number) {
    this.state.rotation += this.rotationSpeed * this.playbackSpeed * deltaTime;
    this.floatTime += deltaTime * this.playbackSpeed;
    
    const floatPeriod = 1.2;
    const floatAmplitude = 2;
    
    for (let i = 0; i < this.totalNodes * 2; i++) {
      const phase = (i / this.totalNodes) * Math.PI * 2;
      this.state.nodeFloatOffsets[i] = Math.sin(
        (this.floatTime / floatPeriod) * Math.PI * 2 + phase
      ) * floatAmplitude;
    }
  }

  private updateDisassembling(_deltaTime: number) {
    this.disassembleFrame++;
    
    this.state.disassembleProgress = Math.min(
      this.disassembleFrame / this.disassembleDuration,
      1
    );

    const scatterStartFrame = 30;
    if (this.disassembleFrame >= scatterStartFrame) {
      const scatterProgress = Math.min(
        (this.disassembleFrame - scatterStartFrame) / (this.disassembleDuration - scatterStartFrame),
        1
      );
      const easedProgress = 1 - Math.pow(1 - scatterProgress, 3);
      this.state.reassembleProgress = 1 - easedProgress;
    }

    if (this.disassembleFrame >= this.disassembleDuration) {
      this.animationState = AnimationState.DISASSEMBLED;
      this.stopAnimationLoop();
    }
  }

  private updateReassembling(_deltaTime: number) {
    this.reassembleFrame++;
    
    const progress = Math.min(
      this.reassembleFrame / this.reassembleDuration,
      1
    );
    
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    this.state.reassembleProgress = easedProgress;
    this.state.disassembleProgress = 1 - easedProgress;

    if (this.reassembleFrame >= this.reassembleDuration) {
      this.animationState = AnimationState.IDLE;
      this.state.disassembleProgress = 0;
      this.state.reassembleProgress = 1;
      this.stopAnimationLoop();
    }
  }

  getScatterProgress(): number {
    if (this.animationState === AnimationState.DISASSEMBLED) return 1;
    if (this.animationState === AnimationState.REASSEMBLING) {
      return 1 - this.state.reassembleProgress;
    }
    if (this.animationState === AnimationState.DISASSEMBLING) {
      const scatterStartFrame = 30;
      if (this.disassembleFrame < scatterStartFrame) return 0;
      const scatterProgress = (this.disassembleFrame - scatterStartFrame) / 
        (this.disassembleDuration - scatterStartFrame);
      return 1 - Math.pow(1 - Math.min(scatterProgress, 1), 3);
    }
    return 0;
  }

  getStrandSeparation(): number {
    if (this.animationState === AnimationState.DISASSEMBLED) {
      return this.disassembleDuration * 0.5;
    }
    if (this.animationState === AnimationState.REASSEMBLING) {
      return (1 - this.state.reassembleProgress) * this.disassembleDuration * 0.5;
    }
    return this.state.disassembleProgress * this.disassembleDuration * 0.5;
  }

  destroy() {
    this.stopAnimationLoop();
    this.listeners.clear();
  }
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function parabolicEase(t: number, height: number = 1): number {
  return 4 * height * t * (1 - t);
}
