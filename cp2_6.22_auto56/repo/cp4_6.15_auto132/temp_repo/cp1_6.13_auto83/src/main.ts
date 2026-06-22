import { GameModule, GameState, ScoreUpdate } from './game/GameModule';
import { PlayerInputModule, KeyPress } from './player/PlayerInputModule';
import { AudioModule, SoundType } from './audio/AudioModule';
import { RenderModule } from './render/RenderModule';
import { ScoreBallModule, ScoreEvent } from './render/ScoreBallModule';

class EchoPulseGame {
  private gameModule: GameModule;
  private playerInput: PlayerInputModule;
  private audioModule: AudioModule;
  private renderModule: RenderModule;
  private scoreBallModule: ScoreBallModule;
  
  private animationId: number = 0;
  private scoreAnimations: { id: number; x: number; y: number; targetY: number; progress: number; points: number; player: number }[] = [];
  private scoreAnimationId: number = 0;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    this.gameModule = new GameModule();
    this.playerInput = new PlayerInputModule();
    this.audioModule = new AudioModule();
    this.renderModule = new RenderModule(canvas);
    this.scoreBallModule = new ScoreBallModule(this.renderModule.getScene());

    this.setupCallbacks();
    this.playerInput.startListening();
    
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    startButton.addEventListener('click', () => this.gameModule.startGame());
    
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.gameModule.getState() === GameState.IDLE) {
        e.preventDefault();
        this.gameModule.startGame();
      }
    });

    this.updateCountdownDisplay(this.gameModule.getCountdown(), 1);
    this.startGameLoop();
  }

  private setupCallbacks(): void {
    this.gameModule.setCallbacks(
      this.handleStateChange.bind(this),
      this.handleScoreUpdate.bind(this),
      this.updateCountdownDisplay.bind(this)
    );

    this.playerInput.setCallbacks(
      this.handleKeyPress.bind(this),
      this.handleKeyRelease.bind(this)
    );

    this.scoreBallModule.setCallback(this.handleScoreEvent.bind(this));
  }

  private handleStateChange(state: GameState): void {
    const statusElement = document.getElementById('game-status') as HTMLElement;
    const startButton = document.getElementById('start-button') as HTMLButtonElement;

    switch (state) {
      case GameState.IDLE:
        statusElement.textContent = 'Press SPACE to start';
        statusElement.classList.add('show');
        startButton.classList.add('show');
        break;
      case GameState.PLAYING:
        statusElement.classList.remove('show');
        startButton.classList.remove('show');
        break;
      case GameState.ENDED:
        const winner = this.gameModule.getWinner();
        if (winner === 0) {
          statusElement.textContent = 'PLAYER 1 WINS!';
        } else if (winner === 1) {
          statusElement.textContent = 'PLAYER 2 WINS!';
        } else {
          statusElement.textContent = 'DRAW!';
        }
        statusElement.classList.add('show');
        startButton.classList.add('show');
        break;
    }
  }

  private handleScoreUpdate(update: ScoreUpdate): void {
    const scoreElement = document.getElementById(`player${update.player + 1}-score`) as HTMLElement;
    scoreElement.textContent = this.gameModule.getScores()[update.player].toString();
  }

  private handleScoreEvent(event: ScoreEvent): void {
    this.gameModule.addScore(event.player, event.points, { x: 0, y: 0 });
    
    const camera = this.renderModule.getCamera();
    const screenPos = event.position.clone();
    screenPos.project(camera);
    
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    this.scoreAnimations.push({
      id: this.scoreAnimationId++,
      x,
      y,
      targetY: 140,
      progress: 0,
      points: event.points,
      player: event.player
    });
  }

  private handleKeyPress(press: KeyPress): void {
    if (this.gameModule.getState() !== GameState.PLAYING) return;
    
    this.audioModule.playSound(press.type);
    this.renderModule.createPulseRing(press);
  }

  private handleKeyRelease(key: string): void {
  }

  private updateCountdownDisplay(time: number, progress: number): void {
    const numberElement = document.getElementById('countdown-number') as HTMLElement;
    const ringElement = document.getElementById('countdown-ring') as HTMLElement;
    
    numberElement.textContent = time.toString();
    
    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - progress);
    
    ringElement.style.background = `conic-gradient(
      rgba(0, 170, 255, ${0.6 * progress + 0.2}) 0deg,
      rgba(255, 102, 0, ${0.6 * (1 - progress) + 0.2}) ${(1 - progress) * 360}deg,
      transparent ${(1 - progress) * 360}deg
    )`;
    
    ringElement.style.border = `3px solid rgba(255, 255, 255, ${0.3})`;
  }

  private startGameLoop(): void {
    const loop = () => {
      this.renderModule.update();
      this.scoreBallModule.checkCollisions(this.renderModule.getPulseRings());
      this.scoreBallModule.update();
      this.updateScoreAnimations();
      this.renderModule.render();
      
      this.animationId = requestAnimationFrame(loop);
    };
    
    loop();
  }

  private updateScoreAnimations(): void {
    for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
      const anim = this.scoreAnimations[i];
      anim.progress += 0.03;
      
      if (anim.progress >= 1) {
        this.scoreAnimations.splice(i, 1);
        continue;
      }
      
      const eased = 1 - Math.pow(1 - anim.progress, 3);
      const currentY = anim.y + (anim.targetY - anim.y) * eased;
      const alpha = 1 - anim.progress;
      
      let existingElement = document.getElementById(`score-float-${anim.id}`);
      if (!existingElement) {
        existingElement = document.createElement('div');
        existingElement.id = `score-float-${anim.id}`;
        existingElement.style.position = 'absolute';
        existingElement.style.fontFamily = 'Orbitron, sans-serif';
        existingElement.style.fontSize = '24px';
        existingElement.style.fontWeight = 'bold';
        existingElement.style.pointerEvents = 'none';
        existingElement.textContent = `+${anim.points}`;
        document.getElementById('hud-overlay')?.appendChild(existingElement);
      }
      
      existingElement.style.left = `${anim.x}px`;
      existingElement.style.top = `${currentY}px`;
      existingElement.style.color = anim.player === 0 ? '#00aaff' : '#ff6600';
      existingElement.style.textShadow = `0 0 10px ${anim.player === 0 ? '#00aaff' : '#ff6600'}`;
      existingElement.style.opacity = alpha.toString();
      existingElement.style.transform = `translate(-50%, -50%) scale(${0.8 + eased * 0.4})`;
      
      if (anim.progress >= 1) {
        existingElement.remove();
      }
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId);
    this.playerInput.stopListening();
    this.scoreBallModule.destroy();
    this.renderModule.destroy();
  }
}

const game = new EchoPulseGame();

window.addEventListener('beforeunload', () => {
  game.destroy();
});
