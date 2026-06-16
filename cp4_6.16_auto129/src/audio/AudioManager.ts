import Phaser from 'phaser';

console.log('[TRACE] 初始化 AudioManager 模块...');

export type SoundType = 'build' | 'upgrade' | 'embed' | 'damage' | 'kill' | 'wave' | 'click' | 'error';

export class AudioManager {
  private scene: Phaser.Scene;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;
  private soundCache: Map<SoundType, AudioBuffer> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    console.log('[TRACE] AudioManager 实例已创建');
  }

  public async init() {
    if (this.initialized) return;

    try {
      console.log('[TRACE] 初始化 Web Audio 上下文...');
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;

      await this.generateAllSounds();
      this.initialized = true;
      console.log('[TRACE] AudioManager 初始化完成');
    } catch (e) {
      console.error('[TRACE] AudioManager 初始化失败:', e);
    }
  }

  private async generateAllSounds() {
    console.log('[TRACE] 生成所有音效...');

    this.soundCache.set('build', this.generateBuildSound());
    this.soundCache.set('upgrade', this.generateUpgradeSound());
    this.soundCache.set('embed', this.generateEmbedSound());
    this.soundCache.set('damage', this.generateDamageSound());
    this.soundCache.set('kill', this.generateKillSound());
    this.soundCache.set('wave', this.generateWaveSound());
    this.soundCache.set('click', this.generateClickSound());
    this.soundCache.set('error', this.generateErrorSound());

    console.log('[TRACE] 所有音效生成完成');
  }

  private generateBuildSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 400 + (1 - t / duration) * 300;
      const envelope = Math.exp(-t * 15);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }

    return buffer;
  }

  private generateUpgradeSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.3;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 500 + Math.min(t / 0.2, 1) * 500;
      const envelope = Math.exp(-t * 8);
      data[i] = (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3) * envelope * 0.3;
    }

    return buffer;
  }

  private generateEmbedSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.25;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 800 + Math.sin(t * 30) * 200;
      const envelope = Math.exp(-t * 12);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25;
    }

    return buffer;
  }

  private generateDamageSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.1;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.2;
    }

    return buffer;
  }

  private generateKillSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.2;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 600 - t / duration * 400;
      const envelope = Math.exp(-t * 10);
      data[i] = (Math.sin(2 * Math.PI * freq * t) + (Math.random() * 2 - 1) * 0.3) * envelope * 0.25;
    }

    return buffer;
  }

  private generateWaveSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 300 + Math.sin(t * 5) * 100;
      const envelope = t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 5);
      data[i] = (Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 2 * t) * 0.2) * envelope * 0.3;
    }

    return buffer;
  }

  private generateClickSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.08;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 50);
      data[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.2;
    }

    return buffer;
  }

  private generateErrorSound(): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 20);
      data[i] = (Math.sin(2 * Math.PI * 200 * t) + Math.sin(2 * Math.PI * 150 * t)) * envelope * 0.2;
    }

    return buffer;
  }

  public play(type: SoundType) {
    if (!this.initialized || !this.audioContext || !this.masterGain) {
      console.log('[TRACE] 音频系统未初始化，跳过播放:', type);
      return;
    }

    const buffer = this.soundCache.get(type);
    if (!buffer) {
      console.log('[TRACE] 音效未找到:', type);
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start();

    console.log('[TRACE] 播放音效:', type);
  }

  public resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
      console.log('[TRACE] 恢复音频上下文');
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
      console.log('[TRACE] 设置音量:', volume);
    }
  }

  public destroy() {
    console.log('[TRACE] 销毁 AudioManager');
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCache.clear();
  }
}
