import { AudioEngine } from './audioEngine';
import { Renderer } from './renderer';
import { GameLogic } from './gameLogic';
import type { BeatEvent, AudioState } from './audioEngine';
import type { GameState, JudgeEvent } from './gameLogic';

class SoundWaveApp {
  private audioEngine: AudioEngine;
  private renderer: Renderer;
  private gameLogic: GameLogic;

  private canvas: HTMLCanvasElement;
  private fileInput: HTMLInputElement;
  private playBtn: HTMLButtonElement;
  private pauseBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private volumeSlider: HTMLInputElement;
  private volumeLabel: HTMLElement;
  private songNameEl: HTMLElement;
  private progressBar: HTMLElement;
  private scoreValue: HTMLElement;
  private comboDisplay: HTMLElement;
  private healthFill: HTMLElement;
  private missFlash: HTMLElement;
  private keyHints: NodeListOf<HTMLElement>;

  private animationId: number | null = null;
  private lastFrameTime = 0;
  private startTime = 0;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    this.volumeLabel = document.getElementById('volumeLabel') as HTMLElement;
    this.songNameEl = document.getElementById('songName') as HTMLElement;
    this.progressBar = document.getElementById('progressBar') as HTMLElement;
    this.scoreValue = document.getElementById('scoreValue') as HTMLElement;
    this.comboDisplay = document.getElementById('comboDisplay') as HTMLElement;
    this.healthFill = document.getElementById('healthFill') as HTMLElement;
    this.missFlash = document.getElementById('missFlash') as HTMLElement;
    this.keyHints = document.querySelectorAll('.key-hint');

    this.audioEngine = new AudioEngine();
    this.renderer = new Renderer(this.canvas);
    this.gameLogic = new GameLogic();

    this.init();
  }

  private init(): void {
    this.gameLogic.setCanvasParams(
      this.renderer.getJudgeLineY(),
      this.renderer.getHeight(),
      this.renderer.getNoteHeight()
    );

    this.audioEngine.setOnBeatCallback((beat: BeatEvent) => {
      this.gameLogic.handleBeat(beat);
    });

    this.gameLogic.setOnJudgeCallback((event: JudgeEvent) => {
      if (event.result !== 'miss') {
        this.renderer.addHitEffect(event.lane, performance.now());
      }
    });

    this.gameLogic.setOnMissCallback(() => {
      this.triggerMissFlash();
    });

    this.gameLogic.setOnFireworkCallback(() => {
      this.renderer.triggerFirework(performance.now());
    });

    this.gameLogic.setOnStateChangeCallback((state: GameState) => {
      this.updateUI(state);
    });

    this.bindEvents();
    this.setVolume(parseInt(this.volumeSlider.value, 10));
    this.startLoop();
  }

  private bindEvents(): void {
    this.playBtn.addEventListener('click', () => this.handlePlayClick());
    this.pauseBtn.addEventListener('click', () => this.handlePauseClick());
    this.stopBtn.addEventListener('click', () => this.handleStopClick());
    this.volumeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.setVolume(value);
    });
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    window.addEventListener('resize', () => {
      this.gameLogic.setCanvasParams(
        this.renderer.getJudgeLineY(),
        this.renderer.getHeight(),
        this.renderer.getNoteHeight()
      );
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.audioEngine.getState() === 'playing') {
        this.handlePauseClick();
      }
    });
  }

  private async handlePlayClick(): Promise<void> {
    const state = this.audioEngine.getState();

    if (state === 'idle' || state === 'ended') {
      this.fileInput.click();
    } else if (state === 'paused') {
      this.audioEngine.play();
      this.gameLogic.resume();
      this.updateButtonStates('playing');
    } else if (state === 'playing') {
      this.handlePauseClick();
    }
  }

  private async handleFileSelect(e: Event): Promise<void> {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.playBtn.disabled = true;
    this.songNameEl.textContent = '加载中...';

    try {
      await this.audioEngine.loadFile(file);
      this.songNameEl.textContent = this.audioEngine.getSongName();
      this.gameLogic.start();
      this.audioEngine.play();
      this.startTime = performance.now();
      this.updateButtonStates('playing');
    } catch (error) {
      console.error('Failed to load audio file:', error);
      this.songNameEl.textContent = '加载失败，请选择其他文件';
      this.playBtn.disabled = false;
    }

    this.fileInput.value = '';
  }

  private handlePauseClick(): void {
    const state = this.audioEngine.getState();
    if (state === 'playing') {
      this.audioEngine.pause();
      this.gameLogic.pause();
      this.updateButtonStates('paused');
    } else if (state === 'paused') {
      this.audioEngine.play();
      this.gameLogic.resume();
      this.updateButtonStates('playing');
    }
  }

  private handleStopClick(): void {
    this.audioEngine.stop();
    this.gameLogic.stop();
    this.updateButtonStates('idle');
    this.progressBar.style.width = '0%';
    this.songNameEl.textContent = '请选择一首音乐文件开始';
  }

  private setVolume(value: number): void {
    const normalized = value / 100;
    this.audioEngine.setVolume(normalized);
    this.volumeLabel.textContent = `${value}%`;
  }

  private updateButtonStates(state: AudioState): void {
    if (state === 'playing') {
      this.playBtn.textContent = '播放中';
      this.playBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.pauseBtn.textContent = '暂停';
      this.stopBtn.disabled = false;
    } else if (state === 'paused') {
      this.playBtn.textContent = '继续';
      this.playBtn.disabled = false;
      this.pauseBtn.disabled = false;
      this.pauseBtn.textContent = '继续';
      this.stopBtn.disabled = false;
    } else {
      this.playBtn.textContent = '播放';
      this.playBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this.pauseBtn.textContent = '暂停';
      this.stopBtn.disabled = true;
    }
  }

  private updateUI(state: GameState): void {
    this.scoreValue.textContent = Math.floor(state.score).toString();

    if (state.combo > 0) {
      this.comboDisplay.textContent = `${state.combo} COMBO`;
      this.comboDisplay.classList.add('visible');

      if (state.combo >= 10) {
        this.comboDisplay.classList.add('gold');
      } else {
        this.comboDisplay.classList.remove('gold');
      }
    } else {
      this.comboDisplay.classList.remove('visible', 'gold');
    }

    this.healthFill.style.height = `${state.health}%`;

    this.keyHints.forEach((hint, index) => {
      if (this.gameLogic.isKeyPressed(index)) {
        hint.classList.add('active');
      } else {
        hint.classList.remove('active');
      }
    });
  }

  private triggerMissFlash(): void {
    this.missFlash.classList.add('active');
    setTimeout(() => {
      this.missFlash.classList.remove('active');
    }, 100);
  }

  private updateProgress(): void {
    const current = this.audioEngine.getCurrentTime();
    const duration = this.audioEngine.getDuration();

    if (duration > 0) {
      const progress = (current / duration) * 100;
      this.progressBar.style.width = `${Math.min(100, progress)}%`;
    }

    const state = this.audioEngine.getState();
    if (state === 'ended') {
      this.gameLogic.stop();
      this.updateButtonStates('ended');
      this.songNameEl.textContent = `播放完成 - ${this.audioEngine.getSongName()}`;
    }
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      const state = this.audioEngine.getState();
      const isPlaying = state === 'playing';

      let currentAudioTimeMs = 0;
      if (isPlaying) {
        currentAudioTimeMs = this.audioEngine.getCurrentTime() * 1000;
      }

      const analysis = this.audioEngine.getAnalysis();
      const notes = this.gameLogic.update(currentAudioTimeMs);

      this.renderer.update(analysis, notes, deltaTime, timestamp);

      if (isPlaying) {
        this.updateProgress();
      }

      this.keyHints.forEach((hint, index) => {
        if (this.gameLogic.isKeyPressed(index)) {
          hint.classList.add('active');
        } else {
          hint.classList.remove('active');
        }
      });

      this.animationId = requestAnimationFrame(loop);
    };

    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(loop);
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.audioEngine.destroy();
    this.renderer.destroy();
    this.gameLogic.destroy();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SoundWaveApp();
});
