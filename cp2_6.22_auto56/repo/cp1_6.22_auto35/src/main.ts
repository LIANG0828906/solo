import { Renderer, ScoreAnimation, ComboAnimation } from './Renderer';
import { BeatTracker } from './BeatTracker';
import { SoundManager } from './SoundManager';
import { Note, JudgeResult } from './Note';

type GameState = 'idle' | 'playing' | 'victory' | 'gameover';

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private beatTracker: BeatTracker;
  private soundManager: SoundManager;

  private score: number = 0;
  private combo: number = 0;
  private gameState: GameState = 'idle';

  private scoreAnim: ScoreAnimation;
  private comboAnim: ComboAnimation;

  private lastTime: number = 0;

  private readonly keyMap: { [key: string]: number } = {
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3,
    'D': 0,
    'F': 1,
    'J': 2,
    'K': 3
  };

  private pressedKeys: Set<string> = new Set();

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.renderer = new Renderer(this.canvas);
    this.soundManager = new SoundManager();
    this.beatTracker = new BeatTracker(this.soundManager);

    this.scoreAnim = {
      scale: 1,
      targetScale: 1,
      animating: false,
      timer: 0,
      duration: 150
    };

    this.comboAnim = {
      scale: 1,
      targetScale: 1,
      animating: false,
      timer: 0,
      duration: 150,
      flashTimer: 0,
      flashing: false
    };

    this.bindEvents();
    this.startGameLoop();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', () => {
      this.soundManager.resume();
      if (this.gameState === 'idle') {
        this.startGame();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;

      if (e.code === 'Space' && (this.gameState === 'gameover' || this.gameState === 'victory')) {
        e.preventDefault();
        this.resetGame();
        return;
      }

      const key = e.key;
      if (this.keyMap[key] !== undefined && this.gameState === 'playing') {
        e.preventDefault();
        if (!this.pressedKeys.has(key)) {
          this.pressedKeys.add(key);
          this.handleKeyPress(this.keyMap[key]);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      const key = e.key;
      if (this.keyMap[key] !== undefined) {
        this.pressedKeys.delete(key);
      }
    });
  }

  private handleKeyPress(trackIndex: number): void {
    const judgeLineY = this.beatTracker.judgeLineY;

    let closestNote: Note | null = null;
    let closestDistance = Infinity;

    for (const note of this.beatTracker.notes) {
      if (note.isJudged || note.isDead) continue;
      if (note.track !== trackIndex) continue;

      const distance = Math.abs(note.y - judgeLineY);
      if (distance <= 30 && distance < closestDistance) {
        closestDistance = distance;
        closestNote = note;
      }
    }

    if (closestNote) {
      const result = closestNote.judge(judgeLineY);
      if (result) {
        this.handleJudgeResult(result, closestNote);
      }
    }
  }

  private handleJudgeResult(result: JudgeResult, note: Note): void {
    if (result === 'perfect') {
      this.score += 50;
      this.combo++;
      this.soundManager.playHitSound();
      this.renderer.addDanmaku(note.x, note.y - 30, 'Perfect!', '#ffd700');
      this.triggerScoreAnimation();
      this.triggerComboAnimation();
    } else if (result === 'good') {
      this.score += 30;
      this.combo++;
      this.soundManager.playHitSound();
      this.renderer.addDanmaku(note.x, note.y - 30, 'Good', '#00ff88');
      this.triggerScoreAnimation();
      this.triggerComboAnimation();
    } else if (result === 'miss') {
      this.combo = 0;
      this.renderer.addDanmaku(note.x, note.y - 30, 'Miss', '#ff4444');
    }

    if (this.score >= 500 && !this.renderer.isClimaxMode) {
      this.enterClimaxMode();
    }

    if (this.score >= 1000 && this.gameState === 'playing') {
      this.triggerVictory();
    }
  }

  private triggerScoreAnimation(): void {
    this.scoreAnim.animating = true;
    this.scoreAnim.timer = 0;
    this.scoreAnim.targetScale = 1.2;
    this.scoreAnim.scale = 1;
  }

  private triggerComboAnimation(): void {
    this.comboAnim.animating = true;
    this.comboAnim.timer = 0;
    this.comboAnim.targetScale = 1.2;
    this.comboAnim.scale = 1;

    if (this.combo >= 10) {
      this.comboAnim.flashing = true;
      this.comboAnim.flashTimer = 0;
      this.renderer.targetComboFontSize = 32;
    }
  }

  private updateScoreAnimation(deltaTime: number): void {
    if (!this.scoreAnim.animating) {
      if (this.scoreAnim.scale !== 1) {
        this.scoreAnim.scale = 1;
      }
      return;
    }

    this.scoreAnim.timer += deltaTime;
    const progress = this.scoreAnim.timer / this.scoreAnim.duration;

    if (progress < 0.5) {
      this.scoreAnim.scale = 1 + (1.2 - 1) * (progress * 2);
    } else {
      this.scoreAnim.scale = 1.2 - (1.2 - 1) * ((progress - 0.5) * 2);
    }

    if (progress >= 1) {
      this.scoreAnim.animating = false;
      this.scoreAnim.scale = 1;
    }
  }

  private updateComboAnimation(deltaTime: number): void {
    if (this.comboAnim.animating) {
      this.comboAnim.timer += deltaTime;
      const progress = this.comboAnim.timer / this.comboAnim.duration;

      if (progress < 0.5) {
        this.comboAnim.scale = 1 + (1.2 - 1) * (progress * 2);
      } else {
        this.comboAnim.scale = 1.2 - (1.2 - 1) * ((progress - 0.5) * 2);
      }

      if (progress >= 1) {
        this.comboAnim.animating = false;
        this.comboAnim.scale = 1;
      }
    }

    if (this.comboAnim.flashing) {
      this.comboAnim.flashTimer += deltaTime;
    }

    if (this.combo < 10) {
      this.comboAnim.flashing = false;
      this.renderer.targetComboFontSize = 24;
    }
  }

  private enterClimaxMode(): void {
    this.renderer.isClimaxMode = true;
    this.renderer.targetComboFontSize = 32;
  }

  private triggerVictory(): void {
    this.gameState = 'victory';
    this.renderer.startVictoryAnimation();
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.score = 0;
    this.combo = 0;
    this.beatTracker.start();
    this.renderer.isClimaxMode = false;
    this.renderer.climaxTransition = 0;
    this.renderer.comboFontSize = 24;
    this.renderer.targetComboFontSize = 24;
    this.comboAnim.flashing = false;
  }

  private resetGame(): void {
    this.gameState = 'idle';
    this.score = 0;
    this.combo = 0;
    this.beatTracker.reset();
    this.renderer.isClimaxMode = false;
    this.renderer.climaxTransition = 0;
    this.renderer.comboFontSize = 24;
    this.renderer.targetComboFontSize = 24;
    this.comboAnim.flashing = false;
    this.comboAnim.flashTimer = 0;
  }

  private update(deltaTime: number): void {
    if (this.gameState === 'playing') {
      const finishedNotes = this.beatTracker.update(deltaTime);

      for (const note of this.beatTracker.notes) {
        if (!note.isJudged && note.isBelowJudge(this.beatTracker.judgeLineY)) {
          note.miss();
          this.combo = 0;
          this.renderer.addDanmaku(note.x, this.beatTracker.judgeLineY, 'Miss', '#ff4444');
        }
      }

      for (const note of finishedNotes) {
        this.beatTracker.removeNote(note);
      }

      this.updateScoreAnimation(deltaTime);
      this.updateComboAnimation(deltaTime);
      this.renderer.updateDanmakus(deltaTime);
      this.renderer.updateClimaxTransition(deltaTime);
      this.renderer.updateComboFontSize(deltaTime);

      if (this.beatTracker.isGameOver() && this.beatTracker.allNotesSpawned) {
        const allParticlesDone = this.beatTracker.notes.every(n => n.isParticleDone);
        if (allParticlesDone || this.beatTracker.notes.length === 0) {
          if (this.score < 1000) {
            this.gameState = 'gameover';
          }
        }
      }
    } else if (this.gameState === 'victory') {
      const victoryDone = this.renderer.updateVictoryAnimation(deltaTime);
      if (victoryDone) {
        this.resetGame();
      }
    }
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawBackground();
    this.renderer.drawTracks();
    this.renderer.drawJudgeLine();

    const sortedNotes = [...this.beatTracker.notes].sort((a, b) => a.y - b.y);
    for (const note of sortedNotes) {
      this.renderer.drawNote(note);
    }

    this.renderer.drawDanmakus();

    this.renderer.drawUI(
      this.score,
      this.combo,
      this.beatTracker.bpm,
      this.scoreAnim,
      this.comboAnim,
      this.gameState
    );

    if (this.gameState === 'victory') {
      this.renderer.drawVictoryAnimation();
    }
  }

  private gameLoop(currentTime: number): void {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
    }

    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (deltaTime > 100) {
      deltaTime = 16.67;
    }

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private startGameLoop(): void {
    this.lastTime = 0;
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
