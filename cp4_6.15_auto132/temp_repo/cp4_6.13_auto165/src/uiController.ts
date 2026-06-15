import { AudioEngine } from './audioEngine';
import { ParticleSystem } from './particleSystem';
import { startPresetTransition } from './presets';

export class UIController {
  private audio: AudioEngine;
  private ps: ParticleSystem;
  private frozen = false;
  private onFreeze: (v: boolean) => void;

  constructor(audio: AudioEngine, ps: ParticleSystem, onFreeze: (v: boolean) => void) {
    this.audio = audio;
    this.ps = ps;
    this.onFreeze = onFreeze;
    this.bindMic();
    this.bindSamples();
    this.bindPresets();
    this.bindScreenshot();
    this.bindSpace();
  }

  private bindMic() {
    const btn = document.getElementById('mic-btn')!;
    btn.addEventListener('click', async () => {
      this.createRipple(btn);
      if (this.audio.isRecording) {
        this.audio.stopMic();
        btn.classList.remove('active');
        this.setMode('live');
      } else {
        const ok = await this.audio.startMic();
        if (ok) {
          btn.classList.add('active');
          this.setMode('live');
          this.clearActiveSample();
        }
      }
    });
  }

  private bindSamples() {
    const noiseBtn = document.getElementById('sample-noise')!;
    const sineBtn = document.getElementById('sample-sine')!;
    noiseBtn.addEventListener('click', () => {
      if (this.audio.isPlaying && noiseBtn.classList.contains('active')) {
        this.audio.stopSample();
        this.clearActiveSample();
      } else {
        this.audio.playSample('whiteNoise');
        this.clearActiveSample();
        noiseBtn.classList.add('active');
        this.setMode('live');
        document.getElementById('mic-btn')?.classList.remove('active');
      }
    });
    sineBtn.addEventListener('click', () => {
      if (this.audio.isPlaying && sineBtn.classList.contains('active')) {
        this.audio.stopSample();
        this.clearActiveSample();
      } else {
        this.audio.playSample('sineSequence');
        this.clearActiveSample();
        sineBtn.classList.add('active');
        this.setMode('live');
        document.getElementById('mic-btn')?.classList.remove('active');
      }
    });
  }

  private clearActiveSample() {
    document.querySelectorAll('.sample-btn').forEach(b => b.classList.remove('active'));
  }

  private bindPresets() {
    ['nebula', 'tornado', 'ripple'].forEach(name => {
      const btn = document.getElementById(`preset-${name}`)!;
      btn.addEventListener('click', () => {
        this.audio.stopMic();
        this.audio.stopSample();
        this.clearActiveSample();
        document.getElementById('mic-btn')?.classList.remove('active');
        this.setMode('preset');
        startPresetTransition(this.ps, name);
      });
    });
  }

  private bindScreenshot() {
    document.getElementById('screenshot-btn')!.addEventListener('click', () => {
      const canvas = document.querySelector('canvas')!;
      const w = canvas.width, h = canvas.height;
      const c2d = document.createElement('canvas');
      c2d.width = w; c2d.height = h;
      const ctx = c2d.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0);
      ctx.font = '20px "Exo 2", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('ParticleSculpture', w - 24, h - 20);
      const a = document.createElement('a');
      a.href = c2d.toDataURL('image/png');
      a.download = 'particle-sculpture.png';
      a.click();
    });
  }

  private bindSpace() {
    window.addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.frozen = !this.frozen;
        this.onFreeze(this.frozen);
        document.getElementById('freeze-hint')!.classList.toggle('visible', this.frozen);
        const icon = document.getElementById('status-icon')!;
        icon.classList.toggle('frozen', this.frozen);
      }
    });
  }

  private setMode(m: 'live' | 'preset') {
    const el = document.getElementById('status-mode')!;
    el.textContent = m === 'live' ? '实时输入' : '预设模式';
    const icon = document.getElementById('status-icon')!;
    icon.classList.toggle('preset', m === 'preset');
  }

  private createRipple(btn: HTMLElement) {
    const ring = document.createElement('span');
    ring.className = 'ripple-ring';
    btn.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  }
}
