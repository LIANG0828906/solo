import { Player } from './player';
import { ObstacleManager, Obstacle } from './obstacles';
import { MusicManager } from './music';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private obstacleManager: ObstacleManager;
  private musicManager: MusicManager;
  private lastTime: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  private gameStartTime: number = 0;
  private isGameOver: boolean = false;
  private isStarted: boolean = false;
  private currentBeat: number = 0;
  private lastBeatTime: number = 0;
  private beatWindow: number = 100;
  private trackY: number = 0;
  private trackHeight: number = 0;
  private offsetX: number = 0;
  private restartButton: { x: number; y: number; width: number; height: number; hovered: boolean } | null = null;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    const groundY = this.trackY + this.trackHeight - 40;
    this.player = new Player(50 + 15, groundY);
    this.obstacleManager = new ObstacleManager(groundY, this.trackHeight);
    this.musicManager = new MusicManager();

    this.musicManager.addBeatCallback((beatNumber: number) => {
      this.currentBeat = beatNumber;
      this.lastBeatTime = performance.now();
    });

    this.highScore = parseInt(localStorage.getItem('rhythmRunnerHighScore') || '0', 10);

    this.setupInput();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.trackY = this.canvas.height * 0.4;
    this.trackHeight = this.canvas.height * 0.6;

    if (this.player) {
      const groundY = this.trackY + this.trackHeight - 40;
      this.player.groundY = groundY;
      this.player.y = groundY;
    }

    if (this.obstacleManager) {
      const groundY = this.trackY + this.trackHeight - 40;
      (this.obstacleManager as any).groundY = groundY;
      (this.obstacleManager as any).trackHeight = this.trackHeight;
    }
  }

  private setupInput(): void {
    const handleJump = (e: Event) => {
      e.preventDefault();
      this.musicManager.resume();

      if (!this.isStarted) {
        this.startGame();
        return;
      }

      if (this.isGameOver) {
        return;
      }

      const now = performance.now();
      const onBeat = now - this.lastBeatTime < this.beatWindow || this.lastBeatTime === 0;
      this.player.jump(onBeat);
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleJump(e);
      }
    });

    window.addEventListener('click', (e) => {
      if (this.isGameOver && this.restartButton) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= this.restartButton.x && x <= this.restartButton.x + this.restartButton.width &&
            y >= this.restartButton.y && y <= this.restartButton.y + this.restartButton.height) {
          this.restartGame();
          return;
        }
      }
      handleJump(e);
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handleJump(e);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isGameOver && this.restartButton) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.restartButton.hovered = x >= this.restartButton.x && x <= this.restartButton.x + this.restartButton.width &&
                                     y >= this.restartButton.y && y <= this.restartButton.y + this.restartButton.height;
      }
    });
  }

  private startGame(): void {
    this.isStarted = true;
    this.isGameOver = false;
    this.score = 0;
    this.gameStartTime = performance.now();
    this.player.y = this.player.groundY;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.obstacleManager.reset();
    this.musicManager.start();
  }

  private restartGame(): void {
    this.musicManager.stop();
    this.startGame();
  }

  private checkCollision(box1: { x: number; y: number; width: number; height: number },
                          box2: { x: number; y: number; width: number; height: number }): boolean {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  private update(deltaTime: number): void {
    if (!this.isStarted || this.isGameOver) return;

    const currentTime = performance.now();
    const elapsedSeconds = (currentTime - this.gameStartTime) / 1000;
    this.score = Math.floor(elapsedSeconds);

    this.player.update(deltaTime);
    this.obstacleManager.update(deltaTime, currentTime, this.musicManager.getBpm());

    this.offsetX += this.obstacleManager.getCurrentSpeed() * deltaTime;

    const playerBox = this.player.getCollisionBox();

    for (const obs of this.obstacleManager.obstacles) {
      if (obs.collected) continue;

      const obsBox = {
        x: obs.x,
        y: obs.y,
        width: obs.width,
        height: obs.height,
      };

      if (this.checkCollision(playerBox, obsBox)) {
        if (obs.type === 'note') {
          this.obstacleManager.collectNote(obs);
          this.score += 10;
          this.musicManager.playCollectSound();
        } else if (obs.type === 'obstacle') {
          this.gameOver();
          return;
        }
      }

      if (!obs.passed && obs.x + obs.width < this.player.x - this.player.radius) {
        obs.passed = true;
        if (obs.type === 'obstacle') {
          this.score += 5;
        }
      }
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.musicManager.stop();
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('rhythmRunnerHighScore', this.highScore.toString());
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = this.ctx.createLinearGradient(0, this.trackY, 0, this.trackY + this.trackHeight);
    gradient.addColorStop(0, '#1a1a3a');
    gradient.addColorStop(1, '#0a0a2a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.trackY, this.canvas.width, this.trackHeight);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    const lineSpacing = 80;
    const startOffset = this.offsetX % lineSpacing;

    for (let x = -startOffset; x < this.canvas.width + lineSpacing; x += lineSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.trackY);
      this.ctx.lineTo(x, this.trackY + this.trackHeight);
      this.ctx.stroke();
    }

    const groundY = this.trackY + this.trackHeight - 40;
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY + this.player.radius + 5);
    this.ctx.lineTo(this.canvas.width, groundY + this.player.radius + 5);
    this.ctx.stroke();
  }

  private drawScore(): void {
    this.ctx.save();
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText(`Score: ${this.score}`, 20, 20);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Score: ${this.score}`, 20, 20);

    this.ctx.strokeText(`High Score: ${this.highScore}`, 20, 52);
    this.ctx.fillText(`High Score: ${this.highScore}`, 20, 52);

    this.ctx.restore();
  }

  private drawGameOver(): void {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const panelWidth = 360;
    const panelHeight = 280;
    const panelX = (this.canvas.width - panelWidth) / 2;
    const panelY = (this.canvas.height - panelHeight) / 2;

    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.67)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 10;

    this.ctx.fillStyle = '#ffffff';
    this.beginRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    this.ctx.fill();

    this.ctx.shadowColor = 'transparent';

    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', panelX + panelWidth / 2, panelY + 50);

    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillStyle = '#555555';
    this.ctx.fillText(`Score: ${this.score}`, panelX + panelWidth / 2, panelY + 100);
    this.ctx.fillText(`High Score: ${this.highScore}`, panelX + panelWidth / 2, panelY + 135);

    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonX = panelX + (panelWidth - buttonWidth) / 2;
    const buttonY = panelY + 180;

    this.restartButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      hovered: this.restartButton?.hovered || false,
    };

    const buttonColor = this.restartButton.hovered ? '#FF6347' : '#FF4500';
    this.ctx.fillStyle = buttonColor;
    this.beginInsetRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('Restart', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 7);

    this.ctx.restore();
  }

  private drawStartScreen(): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('RHYTHM RUNNER', this.canvas.width / 2, this.canvas.height / 2 - 60);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Click, Tap or Press Space to Start', this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.fillText('Jump on the beat for bonus height!', this.canvas.width / 2, this.canvas.height / 2 + 40);

    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.fillText('Collect golden notes +10 | Dodge obstacles +5', this.canvas.width / 2, this.canvas.height / 2 + 90);

    this.ctx.restore();
  }

  private beginRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private beginInsetRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y + radius, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private draw(): void {
    this.drawBackground();
    this.obstacleManager.draw(this.ctx);
    this.player.draw(this.ctx);
    this.drawScore();

    if (!this.isStarted) {
      this.drawStartScreen();
    }

    if (this.isGameOver) {
      this.drawGameOver();
    }
  }

  public gameLoop(currentTime: number): void {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  public start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

window.addEventListener('load', () => {
  const game = new Game();
  game.start();
});
