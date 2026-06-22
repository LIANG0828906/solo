import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private audioContext: AudioContext | null = null;

  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }

  public create(): void {
    this.generatePlayerTexture();
    this.generateLightWallTexture();
    this.generatePulseTrapTexture();
    this.generateDebrisTexture();
    this.generateStarDustTexture();

    this.generateAudio();

    this.scene.start('GameScene');
  }

  private generatePlayerTexture(): void {
    const graphics = this.add.graphics();
    const width = 80;
    const height = 40;
    const halfW = width / 2;
    const halfH = height / 2;

    graphics.lineStyle(2, 0x00ffff, 1);
    graphics.fillStyle(0x001a1a, 1);

    graphics.beginPath();
    graphics.moveTo(-halfW, -halfH * 0.6);
    graphics.lineTo(halfW * 0.8, -halfH * 0.3);
    graphics.lineTo(halfW, 0);
    graphics.lineTo(halfW * 0.8, halfH * 0.3);
    graphics.lineTo(-halfW, halfH * 0.6);
    graphics.lineTo(-halfW * 0.7, halfH * 0.3);
    graphics.lineTo(-halfW * 0.7, -halfH * 0.3);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0x00ffff, 0.8);
    graphics.beginPath();
    graphics.moveTo(-halfW * 0.5, -halfH * 0.2);
    graphics.lineTo(halfW * 0.3, 0);
    graphics.lineTo(-halfW * 0.5, halfH * 0.2);
    graphics.closePath();
    graphics.fillPath();

    graphics.fillStyle(0xff00ff, 0.9);
    graphics.beginPath();
    graphics.arc(-halfW * 0.9, 0, 4, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0x00ffff, 0.6);
    graphics.beginPath();
    graphics.arc(-halfW * 0.9, 0, 8, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.generateTexture('player', width, height);
    graphics.destroy();
  }

  private generateLightWallTexture(): void {
    const graphics = this.add.graphics();
    const width = 400;
    const height = 60;

    graphics.fillStyle(0x6600cc, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(3, 0x00ffff, 1);
    graphics.strokeRect(1, 1, width - 2, height - 2);

    graphics.fillStyle(0x00ffff, 0.3);
    for (let i = 0; i < 5; i++) {
      const yPos = (height / 6) * (i + 1);
      graphics.fillRect(10, yPos - 1, width - 20, 2);
    }

    graphics.fillStyle(0xff00ff, 0.5);
    graphics.fillRect(0, 0, 8, height);
    graphics.fillRect(width - 8, 0, 8, height);

    graphics.generateTexture('lightWall', width, height);
    graphics.destroy();
  }

  private generatePulseTrapTexture(): void {
    const graphics = this.add.graphics();
    const size = 120;
    const center = size / 2;

    graphics.lineStyle(4, 0xff00ff, 1);
    graphics.beginPath();
    graphics.arc(center, center, 50, 0, Math.PI * 2);
    graphics.strokePath();

    graphics.lineStyle(2, 0x00ffff, 0.8);
    graphics.beginPath();
    graphics.arc(center, center, 40, 0, Math.PI * 2);
    graphics.strokePath();

    graphics.fillStyle(0xff00ff, 0.3);
    graphics.beginPath();
    graphics.arc(center, center, 55, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0x00ffff, 0.6);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const x = center + Math.cos(angle) * 45;
      const y = center + Math.sin(angle) * 45;
      graphics.beginPath();
      graphics.arc(x, y, 4, 0, Math.PI * 2);
      graphics.fillPath();
    }

    graphics.fillStyle(0xffffff, 0.9);
    graphics.beginPath();
    graphics.arc(center, center, 6, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.generateTexture('pulseTrap', size, size);
    graphics.destroy();
  }

  private generateDebrisTexture(): void {
    const graphics = this.add.graphics();
    const size = 60;
    const center = size / 2;

    graphics.fillStyle(0x4a4a4a, 1);
    graphics.lineStyle(2, 0x888888, 1);

    const points: Phaser.Geom.Point[] = [];
    const numPoints = 8;
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 / numPoints) * i;
      const radius = 20 + Math.sin(i * 3) * 8;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      points.push(new Phaser.Geom.Point(x, y));
    }

    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0x666666, 1);
    graphics.beginPath();
    graphics.arc(center - 8, center - 5, 5, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0x333333, 1);
    graphics.beginPath();
    graphics.arc(center + 10, center + 8, 4, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.generateTexture('debris', size, size);
    graphics.destroy();
  }

  private generateStarDustTexture(): void {
    const graphics = this.add.graphics();
    const size = 30;
    const center = size / 2;

    graphics.fillStyle(0xffff00, 0.3);
    graphics.beginPath();
    graphics.arc(center, center, 14, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0xffaa00, 0.6);
    graphics.beginPath();
    graphics.arc(center, center, 10, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0xffff00, 1);
    graphics.beginPath();
    graphics.arc(center, center, 6, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0xffffff, 1);
    graphics.beginPath();
    graphics.arc(center, center, 2, 0, Math.PI * 2);
    graphics.fillPath();

    graphics.fillStyle(0xffff88, 0.8);
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i + Math.PI / 4;
      const x = center + Math.cos(angle) * 8;
      const y = center + Math.sin(angle) * 8;
      graphics.beginPath();
      graphics.arc(x, y, 2, 0, Math.PI * 2);
      graphics.fillPath();
    }

    graphics.generateTexture('starDust', size, size);
    graphics.destroy();
  }

  private generateAudio(): void {
    if (!this.audioContext) {
      return;
    }

    this.generateCollectSound();
    this.generateHitSound();
    this.generateStarBurstSound();
  }

  private generateCollectSound(): void {
    if (!this.audioContext) {
      return;
    }

    const ctx = this.audioContext;
    const duration = 0.2;
    const sampleRate = ctx.sampleRate;
    const length = duration * sampleRate;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 800 + (1200 * (1 - t / duration));
      const amp = 0.3 * (1 - t / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * amp;
    }

    this.cache.audio.add('collect', buffer);
  }

  private generateHitSound(): void {
    if (!this.audioContext) {
      return;
    }

    const ctx = this.audioContext;
    const duration = 0.15;
    const sampleRate = ctx.sampleRate;
    const length = duration * sampleRate;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 150 + (50 * (1 - t / duration));
      const amp = 0.4 * (1 - t / duration);
      const noise = (Math.random() * 2 - 1) * 0.2 * (1 - t / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * amp + noise;
    }

    this.cache.audio.add('hit', buffer);
  }

  private generateStarBurstSound(): void {
    if (!this.audioContext) {
      return;
    }

    const ctx = this.audioContext;
    const duration = 0.4;
    const sampleRate = ctx.sampleRate;
    const length = duration * sampleRate;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const baseFreq = 400 + (800 * (t / duration));
      const amp = 0.3 * Math.exp(-t * 8);
      const osc1 = Math.sin(2 * Math.PI * baseFreq * t);
      const osc2 = Math.sin(2 * Math.PI * (baseFreq * 1.5) * t);
      const osc3 = Math.sin(2 * Math.PI * (baseFreq * 2) * t);
      data[i] = (osc1 + osc2 * 0.5 + osc3 * 0.3) * amp;
    }

    this.cache.audio.add('starBurst', buffer);
  }
}
