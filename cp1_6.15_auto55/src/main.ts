import * as THREE from 'three';
import { Waveform3D } from './Waveform3D';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { ControlPanel } from './ControlPanel';
import {
  WaveformParams,
  EnvelopePhase,
  lerp,
  clamp
} from './types';

class App {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private waveform3D: Waveform3D;
  private spectrumAnalyzer: SpectrumAnalyzer | null = null;
  private controlPanel: ControlPanel;

  private params: WaveformParams;
  private envelope: EnvelopePhase;
  private envelopeStartTime: number = 0;
  private isPlaying: boolean = false;
  private loopTimeout: number | null = null;

  private starfield: THREE.Points | null = null;
  private starCount: number = 1000;
  private minStarCount: number = 200;


  private fps: number = 60;
  private fpsUpdateTime: number = 0;
  private frameCount: number = 0;
  private fpsElement: HTMLElement;
  private qualityReduced: boolean = false;

  private mouseX: number = 0;
  private mouseY: number = 0;
  private targetCameraX: number = 0;
  private targetCameraY: number = 8;

  constructor() {
    this.container = document.getElementById('canvas-container') as HTMLElement;
    this.fpsElement = document.getElementById('fps-value') as HTMLElement;
    this.clock = new THREE.Clock();

    this.params = {
      type: 'sine',
      frequency: 440,
      attack: 0.1,
      decay: 0.3,
      sustain: 70,
      release: 0.5
    };

    this.envelope = {
      phase: 'idle',
      progress: 0,
      amplitude: 0
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.createLighting();
    this.createStarfield();

    this.waveform3D = new Waveform3D(this.scene, this.params);

    this.controlPanel = new ControlPanel(this.params, {
      onWaveformChange: (type) => this.handleWaveformChange(type),
      onFrequencyChange: (freq) => this.handleFrequencyChange(freq),
      onAttackChange: (value) => this.handleAttackChange(value),
      onDecayChange: (value) => this.handleDecayChange(value),
      onSustainChange: (value) => this.handleSustainChange(value),
      onReleaseChange: (value) => this.handleReleaseChange(value),
      onSpectrumToggle: (enabled) => this.handleSpectrumToggle(enabled),
      onPlayToggle: () => this.togglePlay()
    });

    this.initAudio();
    this.bindEvents();
    this.animate();
  }

  private createLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x00d4ff, 2, 50);
    keyLight.position.set(10, 10, 10);
    this.scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xff4488, 1.5, 50);
    fillLight.position.set(-10, 5, 10);
    this.scene.add(fillLight);
  }

  private createStarfield(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    for (let i = 0; i < this.starCount; i++) {
      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const colorT = Math.random();
      if (colorT < 0.3) {
        colors[i * 3] = 0.6;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1;
      } else if (colorT < 0.6) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      this.spectrumAnalyzer = new SpectrumAnalyzer(this.scene, this.analyser);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.handleResize());
    
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    this.container.addEventListener('click', () => {
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
    }, { once: true });
  }

  private handleWaveformChange(type: OscillatorType): void {
    this.params.type = type;
    this.waveform3D.setWaveformType(type);
    if (this.oscillator && this.isPlaying) {
      this.oscillator.type = type;
    }
  }

  private handleFrequencyChange(freq: number): void {
    this.params.frequency = clamp(freq, 20, 2000);
    this.waveform3D.setFrequency(this.params.frequency);
    if (this.oscillator && this.isPlaying) {
      this.oscillator.frequency.setValueAtTime(
        this.params.frequency,
        this.audioContext!.currentTime
      );
    }
  }

  private handleAttackChange(value: number): void {
    this.params.attack = value;
    this.waveform3D.setEnvelopeParams({ attack: value });
  }

  private handleDecayChange(value: number): void {
    this.params.decay = value;
    this.waveform3D.setEnvelopeParams({ decay: value });
  }

  private handleSustainChange(value: number): void {
    this.params.sustain = value * 100;
    this.waveform3D.setEnvelopeParams({ sustain: value * 100 });
  }

  private handleReleaseChange(value: number): void {
    this.params.release = value;
    this.waveform3D.setEnvelopeParams({ release: value });
  }

  private handleSpectrumToggle(enabled: boolean): void {
    if (this.spectrumAnalyzer) {
      this.spectrumAnalyzer.setVisible(enabled);
    }
  }

  public togglePlay(): void {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (this.isPlaying) {
      this.stopSound();
    } else {
      this.playSound();
    }
  }

  private playSound(): void {
    if (!this.audioContext || !this.analyser) return;

    this.isPlaying = true;
    this.controlPanel.setPlaying(true);
    this.envelopeStartTime = this.audioContext.currentTime;

    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    this.oscillator.type = this.params.type;
    this.oscillator.frequency.setValueAtTime(
      this.params.frequency,
      this.audioContext.currentTime
    );

    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

    const attackTime = this.params.attack || 0.01;
    const decayTime = this.params.decay || 0.01;
    const sustainLevel = this.params.sustain / 100 * 0.5;

    this.gainNode.gain.linearRampToValueAtTime(
      0.5,
      this.audioContext.currentTime + attackTime
    );
    this.gainNode.gain.linearRampToValueAtTime(
      sustainLevel,
      this.audioContext.currentTime + attackTime + decayTime
    );

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.oscillator.start();

    this.envelope.phase = 'idle';
    this.startLoopPlayback();
  }

  private stopSound(): void {
    if (!this.audioContext || !this.gainNode || !this.oscillator) return;

    const releaseTime = this.params.release || 0.01;
    
    this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(
      this.gainNode.gain.value,
      this.audioContext.currentTime
    );
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + releaseTime
    );

    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }

    setTimeout(() => {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    }, releaseTime * 1000);

    this.isPlaying = false;
    this.controlPanel.setPlaying(false);
    this.envelope.phase = 'release';
    this.envelopeStartTime = this.audioContext.currentTime;
  }

  private startLoopPlayback(): void {
    if (!this.isPlaying) return;

    const _totalDuration = this.params.attack + this.params.decay + 0.5 + this.params.release;

    this.loopTimeout = window.setTimeout(() => {
      if (this.isPlaying && this.oscillator && this.gainNode && this.audioContext) {
        const oldOsc = this.oscillator;
        const oldGain = this.gainNode;

        const releaseTime = this.params.release || 0.01;
        oldGain.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + releaseTime
        );

        setTimeout(() => {
          oldOsc.stop();
          oldOsc.disconnect();
          oldGain.disconnect();
        }, releaseTime * 1000);

        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        this.oscillator.type = this.params.type;
        this.oscillator.frequency.setValueAtTime(
          this.params.frequency,
          this.audioContext.currentTime
        );

        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

        const attackTime = this.params.attack || 0.01;
        const decayTime = this.params.decay || 0.01;
        const sustainLevel = this.params.sustain / 100 * 0.5;

        this.gainNode.gain.linearRampToValueAtTime(
          0.5,
          this.audioContext.currentTime + attackTime
        );
        this.gainNode.gain.linearRampToValueAtTime(
          sustainLevel,
          this.audioContext.currentTime + attackTime + decayTime
        );

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.analyser!);
        this.oscillator.start();

        this.envelopeStartTime = this.audioContext.currentTime;
      }

      this.startLoopPlayback();
    }, (this.params.attack + this.params.decay + 0.3) * 1000);
  }

  private updateEnvelope(deltaTime: number): void {
    if (!this.isPlaying || !this.audioContext) {
      if (this.envelope.phase !== 'idle') {
        this.envelope.phase = 'idle';
      }
      this.envelope.amplitude = lerp(this.envelope.amplitude, 0, deltaTime * 5);
      this.envelope.progress = 0;
      return;
    }

    const elapsed = this.audioContext.currentTime - this.envelopeStartTime;
    const attack = this.params.attack || 0.01;
    const decay = this.params.decay || 0.01;
    const sustain = this.params.sustain / 100;
    const release = this.params.release || 0.01;

    if (this.envelope.phase === 'idle' || this.envelope.phase === 'release') {
      this.envelope.phase = 'attack';
      this.envelopeStartTime = this.audioContext.currentTime;
    }

    switch (this.envelope.phase) {
      case 'attack': {
        this.envelope.progress = Math.min(elapsed / attack, 1);
        const targetAmplitude = this.envelope.progress;
        this.envelope.amplitude = lerp(this.envelope.amplitude, targetAmplitude, deltaTime * 12);
        if (this.envelope.progress >= 1) {
          this.envelope.phase = 'decay';
          this.envelopeStartTime = this.audioContext.currentTime;
        }
        break;
      }
      case 'decay': {
        this.envelope.progress = Math.min(elapsed / decay, 1);
        const targetAmplitude = 1 - (1 - sustain) * this.envelope.progress;
        this.envelope.amplitude = lerp(this.envelope.amplitude, targetAmplitude, deltaTime * 12);
        if (this.envelope.progress >= 1) {
          this.envelope.phase = 'sustain';
        }
        break;
      }
      case 'sustain': {
        this.envelope.progress = 0;
        this.envelope.amplitude = lerp(this.envelope.amplitude, sustain, deltaTime * 12);
        break;
      }
      case 'release': {
        this.envelope.progress = Math.min(elapsed / release, 1);
        const targetAmplitude = sustain * (1 - this.envelope.progress);
        this.envelope.amplitude = lerp(this.envelope.amplitude, targetAmplitude, deltaTime * 12);
        if (this.envelope.progress >= 1) {
          this.envelope.phase = 'idle';
          this.envelope.amplitude = 0;
        }
        break;
      }
    }
  }

  private updateFPS(_now: number, deltaTime: number): void {
    this.frameCount++;
    this.fpsUpdateTime += deltaTime;

    if (this.fpsUpdateTime >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsUpdateTime);
      this.fpsElement.textContent = this.fps.toString();
      this.frameCount = 0;
      this.fpsUpdateTime = 0;

      if (this.fps < 30 && !this.qualityReduced) {
        this.reduceQuality();
      } else if (this.fps > 45 && this.qualityReduced) {
        this.restoreQuality();
      }
    }
  }

  private reduceQuality(): void {
    this.qualityReduced = true;
    if (this.spectrumAnalyzer) {
      this.spectrumAnalyzer.reduceQuality();
    }
    if (this.starfield && this.starCount > this.minStarCount) {
      this.starCount = this.minStarCount;
      this.recreateStarfield();
    }
    this.renderer.setPixelRatio(1);
  }

  private restoreQuality(): void {
    this.qualityReduced = false;
    if (this.spectrumAnalyzer) {
      this.spectrumAnalyzer.restoreQuality();
    }
    if (this.starfield && this.starCount < 1000) {
      this.starCount = 1000;
      this.recreateStarfield();
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private recreateStarfield(): void {
    if (!this.starfield) return;

    this.scene.remove(this.starfield);
    (this.starfield.geometry as THREE.BufferGeometry).dispose();
    (this.starfield.material as THREE.Material).dispose();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    for (let i = 0; i < this.starCount; i++) {
      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const colorT = Math.random();
      if (colorT < 0.3) {
        colors[i * 3] = 0.6;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1;
      } else if (colorT < 0.6) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.6;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.waveform3D.resize();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const currentTime = this.clock.getElapsedTime();

    this.updateFPS(now, deltaTime);
    this.controlPanel.update(deltaTime);
    this.updateEnvelope(deltaTime);

    this.targetCameraX = this.mouseX * 2;
    this.targetCameraY = 8 + this.mouseY * 2;

    this.camera.position.x = lerp(this.camera.position.x, this.targetCameraX, deltaTime * 2);
    this.camera.position.y = lerp(this.camera.position.y, this.targetCameraY, deltaTime * 2);
    this.camera.lookAt(0, 0, 0);

    if (this.starfield) {
      this.starfield.rotation.y = currentTime * 0.02;
      this.starfield.rotation.x = Math.sin(currentTime * 0.01) * 0.1;
    }

    this.waveform3D.update(deltaTime, this.envelope, this.isPlaying);

    if (this.spectrumAnalyzer && this.controlPanel.getSpectrumEnabled()) {
      this.spectrumAnalyzer.update(deltaTime, this.isPlaying);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
    }
    
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }

    this.waveform3D.dispose();
    this.spectrumAnalyzer?.dispose();

    if (this.starfield) {
      (this.starfield.geometry as THREE.BufferGeometry).dispose();
      (this.starfield.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
  }
}

const app = new App();

window.addEventListener('beforeunload', () => {
  app.dispose();
});
