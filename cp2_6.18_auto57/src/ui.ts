import { eventBus } from './eventBus';

export class UIManager {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private comboElement: HTMLElement;
  private livesElement: HTMLElement;
  private speedIndicator: HTMLElement;
  private startScreen: HTMLElement;
  private gameOverScreen: HTMLElement;
  private finalScoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private startButton: HTMLElement;
  private restartButton: HTMLElement;
  private pauseOverlay: HTMLElement;
  
  private onStartCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;
  private onResumeCallback: (() => void) | null = null;
  
  private isMobile: boolean;
  private isPaused: boolean = false;
  private isGameStarted: boolean = false;
  private audioContext: AudioContext | null = null;
  private musicOscillator: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.isMobile = window.innerWidth < 768;

    this.scoreElement = document.getElementById('score')!;
    this.comboElement = document.getElementById('combo')!;
    this.livesElement = document.getElementById('lives')!;
    this.speedIndicator = document.getElementById('speed-indicator')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.gameOverScreen = document.getElementById('game-over-screen')!;
    this.finalScoreElement = document.getElementById('final-score')!;
    this.highScoreElement = document.getElementById('high-score')!;
    this.startButton = document.getElementById('start-btn')!;
    this.restartButton = document.getElementById('restart-btn')!;
    this.pauseOverlay = document.getElementById('pause-overlay')!;

    this.setupEventListeners();
    this.setupLives();
    this.updateHighScoreDisplay();
  }

  private setupEventListeners(): void {
    this.startButton.addEventListener('click', () => {
      this.handleStart();
    });

    this.restartButton.addEventListener('click', () => {
      this.handleRestart();
    });

    document.addEventListener('keydown', (e) => {
      if (!this.isGameStarted) return;

      switch (e.key.toLowerCase()) {
        case 'p':
          if (this.isPaused) {
            this.resumeGame();
          } else {
            this.pauseGame();
          }
          break;
      }
    });

    this.container.addEventListener('click', (e) => {
      if (!this.isGameStarted || this.isPaused) return;
      this.handleMouseClick(e);
    });

    this.container.addEventListener('mousemove', (e) => {
      if (!this.isGameStarted || this.isPaused) return;
      this.handleMouseMove(e);
    });

    this.container.addEventListener('touchstart', (e) => {
      if (!this.isGameStarted || this.isPaused) return;
      e.preventDefault();
      const touch = e.touches[0];
      this.handleTouch(touch);
    }, { passive: false });

    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });
  }

  private setupLives(): void {
    this.livesElement.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = '❤';
      this.livesElement.appendChild(heart);
    }
  }

  updateLives(lives: number): void {
    const hearts = this.livesElement.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
      if (index < lives) {
        heart.classList.remove('lost');
      } else {
        heart.classList.add('lost');
      }
    });
  }

  private handleStart(): void {
    this.isGameStarted = true;
    this.startScreen.style.display = 'none';
    this.gameOverScreen.style.display = 'none';
    this.startMusic();
    
    if (this.onStartCallback) {
      this.onStartCallback();
    }
  }

  private handleRestart(): void {
    this.gameOverScreen.style.display = 'none';
    this.setupLives();
    this.updateScore(0, 0);
    this.startMusic();
    
    if (this.onRestartCallback) {
      this.onRestartCallback();
    }
  }

  private handleMouseClick(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      eventBus.emit({ type: 'pause' } as any);
    } else if (x > width * 2 / 3) {
      eventBus.emit({ type: 'resume' } as any);
    }
  }

  private lastMouseZone: number = -1;

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    let zone: number;
    if (x < width / 3) {
      zone = 0;
    } else if (x < width * 2 / 3) {
      zone = 1;
    } else {
      zone = 2;
    }

    if (zone !== this.lastMouseZone) {
      this.lastMouseZone = zone;
      this.emitLaneChange(zone);
    }
  }

  private handleTouch(touch: Touch): void {
    const rect = this.container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    
    let zone: number;
    if (x < width / 3) {
      zone = 0;
    } else if (x < width * 2 / 3) {
      zone = 1;
    } else {
      zone = 2;
    }

    this.emitLaneChange(zone);
  }

  private emitLaneChange(lane: number): void {
    const moveEvent = new CustomEvent('laneChange', { detail: { lane } });
    document.dispatchEvent(moveEvent);
  }

  private startMusic(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.musicOscillator) {
        this.musicOscillator.stop();
      }

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.1;
      this.musicGain.connect(this.audioContext.destination);

      const bpm = 120;
      const beatDuration = 60 / bpm;
      const notes = [261.63, 329.63, 392.00, 329.63, 261.63, 392.00, 329.63, 293.66];
      let noteIndex = 0;

      const playNote = () => {
        if (!this.audioContext || !this.musicGain || this.isPaused) return;

        if (this.musicOscillator) {
          this.musicOscillator.stop();
          this.musicOscillator.disconnect();
        }

        this.musicOscillator = this.audioContext.createOscillator();
        this.musicOscillator.type = 'sine';
        this.musicOscillator.frequency.value = notes[noteIndex % notes.length];
        this.musicOscillator.connect(this.musicGain);
        this.musicOscillator.start();

        noteIndex++;
      };

      playNote();
      this.musicInterval = window.setInterval(playNote, beatDuration * 1000);
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  private stopMusic(): void {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicOscillator) {
      try {
        this.musicOscillator.stop();
      } catch (e) {}
      this.musicOscillator.disconnect();
      this.musicOscillator = null;
    }
  }

  pauseGame(): void {
    this.isPaused = true;
    this.pauseOverlay.style.display = 'flex';
    eventBus.emit({ type: 'pause' });
  }

  resumeGame(): void {
    this.isPaused = false;
    this.pauseOverlay.style.display = 'none';
    eventBus.emit({ type: 'resume' });
  }

  updateScore(score: number, combo: number): void {
    this.scoreElement.textContent = score.toString();
    if (combo > 1) {
      this.comboElement.textContent = `连击 x${combo}`;
    } else {
      this.comboElement.textContent = '';
    }
  }

  updateSpeed(speed: number): void {
    this.speedIndicator.textContent = `速度: ${speed.toFixed(1)} m/s`;
  }

  showGameOver(finalScore: number): void {
    this.isGameStarted = false;
    this.stopMusic();

    const highScore = this.getHighScore();
    if (finalScore > highScore) {
      this.setHighScore(finalScore);
    }

    this.finalScoreElement.textContent = finalScore.toString();
    this.highScoreElement.textContent = this.getHighScore().toString();
    this.gameOverScreen.style.display = 'flex';
  }

  private getHighScore(): number {
    const stored = localStorage.getItem('railsurfer_highscore');
    return stored ? parseInt(stored, 10) : 0;
  }

  private setHighScore(score: number): void {
    localStorage.setItem('railsurfer_highscore', score.toString());
  }

  private updateHighScoreDisplay(): void {
    this.highScoreElement.textContent = this.getHighScore().toString();
  }

  setOnStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  setOnRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  setOnPause(callback: () => void): void {
    this.onPauseCallback = callback;
  }

  setOnResume(callback: () => void): void {
    this.onResumeCallback = callback;
  }

  getIsMobile(): boolean {
    return this.isMobile;
  }
}
