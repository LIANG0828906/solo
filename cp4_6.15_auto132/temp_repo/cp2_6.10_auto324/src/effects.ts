import * as THREE from 'three';

export class PulseEffect {
  private scene: THREE.Scene;
  private activePulses: Pulse[] = [];
  private pulseGeometry: THREE.RingGeometry;
  private maxPulses: number = 20;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pulseGeometry = new THREE.RingGeometry(0.01, 0.15, 64);
  }

  public trigger(position: THREE.Vector3, color: THREE.Color): void {
    if (this.activePulses.length >= this.maxPulses) {
      const oldest = this.activePulses.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
        (oldest.mesh.material as THREE.Material).dispose();
      }
    }

    const material = new THREE.MeshBasicMaterial({
      color: color.clone(),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(this.pulseGeometry.clone(), material);
    mesh.position.copy(position);
    mesh.lookAt(new THREE.Vector3(0, 0, 0));
    mesh.rotation.x = Math.PI / 2;

    this.scene.add(mesh);

    const pulse: Pulse = {
      mesh,
      startTime: performance.now(),
      duration: 1200,
      maxRadius: 5,
      color: color.clone(),
    };

    this.activePulses.push(pulse);
  }

  public update(time: number): void {
    for (let i = this.activePulses.length - 1; i >= 0; i--) {
      const pulse = this.activePulses[i];
      const elapsed = time - pulse.startTime;
      const progress = Math.min(elapsed / pulse.duration, 1);

      if (progress >= 1) {
        this.scene.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        (pulse.mesh.material as THREE.Material).dispose();
        this.activePulses.splice(i, 1);
        continue;
      }

      const eased = this.easeOutCubic(progress);
      const radius = eased * pulse.maxRadius;

      const newGeo = new THREE.RingGeometry(radius * 0.8, radius, 64);
      const oldPos = pulse.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const newPos = newGeo.getAttribute('position') as THREE.BufferAttribute;

      for (let j = 0; j < oldPos.count; j++) {
        oldPos.setX(j, newPos.getX(j));
        oldPos.setY(j, newPos.getY(j));
        oldPos.setZ(j, newPos.getZ(j));
      }
      oldPos.needsUpdate = true;

      newGeo.dispose();

      const material = pulse.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - progress) * 0.8;

      const hueShift = (progress * 0.2) % 1;
      const hsl = { h: 0, s: 0, l: 0 };
      pulse.color.getHSL(hsl);
      material.color.setHSL((hsl.h + hueShift) % 1, hsl.s, hsl.l);
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public dispose(): void {
    for (const pulse of this.activePulses) {
      this.scene.remove(pulse.mesh);
      pulse.mesh.geometry.dispose();
      (pulse.mesh.material as THREE.Material).dispose();
    }
    this.activePulses = [];
    this.pulseGeometry.dispose();
  }
}

interface Pulse {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
  maxRadius: number;
  color: THREE.Color;
}

export class HarpSound {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0;
      this.gainNode.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  public ensureInitialized(): void {
    if (!this.initialized) {
      this.initAudio();
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public play(frequency: number = 440, volume: number = 0.3): void {
    if (!this.initialized || !this.audioContext || !this.gainNode) {
      this.initAudio();
      if (!this.initialized || !this.audioContext || !this.gainNode) return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;

    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const oscillator3 = this.audioContext.createOscillator();

    oscillator1.type = 'triangle';
    oscillator1.frequency.value = frequency;

    oscillator2.type = 'sine';
    oscillator2.frequency.value = frequency * 2;

    oscillator3.type = 'sine';
    oscillator3.frequency.value = frequency * 3;

    const noteGain = this.audioContext.createGain();
    noteGain.gain.setValueAtTime(0, now);

    const attack = 0.01;
    const decay = 0.3;
    const sustain = 0.1;
    const release = 1.2;

    noteGain.gain.linearRampToValueAtTime(volume * 0.8, now + attack);
    noteGain.gain.exponentialRampToValueAtTime(volume * sustain, now + attack + decay);
    noteGain.gain.setValueAtTime(volume * sustain, now + 0.5);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + release);

    const harmonicGain1 = this.audioContext.createGain();
    harmonicGain1.gain.value = 0.3;

    const harmonicGain2 = this.audioContext.createGain();
    harmonicGain2.gain.value = 0.1;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    oscillator1.connect(noteGain);
    oscillator2.connect(harmonicGain1);
    oscillator3.connect(harmonicGain2);

    harmonicGain1.connect(noteGain);
    harmonicGain2.connect(noteGain);

    noteGain.connect(filter);
    filter.connect(this.gainNode);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator3.start(now);

    oscillator1.stop(now + 0.5 + release + 0.1);
    oscillator2.stop(now + 0.5 + release + 0.1);
    oscillator3.stop(now + 0.5 + release + 0.1);

    setTimeout(() => {
      oscillator1.disconnect();
      oscillator2.disconnect();
      oscillator3.disconnect();
      noteGain.disconnect();
      harmonicGain1.disconnect();
      harmonicGain2.disconnect();
      filter.disconnect();
    }, (0.5 + release + 0.2) * 1000);
  }

  public playRandomNote(): void {
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const note = scale[Math.floor(Math.random() * scale.length)];
    const octave = Math.random() > 0.5 ? 1 : 0.5;
    this.play(note * octave, 0.2 + Math.random() * 0.2);
  }

  public playNoteByPosition(x: number, y: number, z: number): void {
    const baseFreq = 220 + Math.abs(x + y + z) * 20;
    const clampedFreq = Math.max(110, Math.min(880, baseFreq));
    this.play(clampedFreq, 0.25);
  }

  public setMasterVolume(volume: number): void {
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime + 0.1
      );
    }
  }

  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.initialized = false;
  }
}

export class BloomEffect {
  private composer: any = null;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private bloomPass: any = null;
  private renderPass: any = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.initComposer();
  }

  private async initComposer(): Promise<void> {
    try {
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');

      const size = new THREE.Vector2();
      this.renderer.getSize(size);

      this.composer = new EffectComposer(this.renderer);

      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      this.bloomPass = new UnrealBloomPass(size, 1.5, 0.5, 0.8);
      this.bloomPass.threshold = 0.3;
      this.bloomPass.strength = 1.2;
      this.bloomPass.radius = 0.6;
      this.composer.addPass(this.bloomPass);
    } catch (e) {
      console.warn('Bloom effect not available:', e);
    }
  }

  public render(deltaTime: number): void {
    if (this.composer) {
      this.composer.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public setBloomStrength(strength: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = Math.max(0, Math.min(3, strength));
    }
  }

  public resize(width: number, height: number): void {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  public dispose(): void {
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
  }
}
