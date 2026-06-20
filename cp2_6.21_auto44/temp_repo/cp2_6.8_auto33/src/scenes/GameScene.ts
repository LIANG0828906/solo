import Phaser from 'phaser';
import { BrickManager } from '../utils/BrickManager';
import { BallController } from '../utils/BallController';
import { PaddleController } from '../utils/PaddleController';
import { PowerUpManager, PowerUpActivatedEvent } from '../utils/PowerUpManager';
import { ScoreManager, ScoreUpdatedEvent } from '../utils/ScoreManager';
import { UIManager } from '../utils/UIManager';

export class GameScene extends Phaser.Scene {
  private brickManager!: BrickManager;
  private ballController!: BallController;
  private paddleController!: PaddleController;
  private powerUpManager!: PowerUpManager;
  private scoreManager!: ScoreManager;
  private uiManager!: UIManager;

  private lives: number = 3;
  private level: number = 1;
  private maxLevel: number = 5;
  private gameState: 'menu' | 'playing' | 'gameover' | 'levelcomplete' = 'menu';
  private isLevelTransitioning: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.brickManager = new BrickManager(this);
    this.ballController = new BallController(this);
    this.paddleController = new PaddleController(this);
    this.powerUpManager = new PowerUpManager(this);
    this.scoreManager = new ScoreManager(this);
    this.uiManager = new UIManager(this);

    this.setupEventListeners();
    this.showMainMenu();
  }

  private setupEventListeners(): void {
    this.brickManager.onBrickDestroy.on('destroy', (x: number, y: number, color: string) => {
      this.powerUpManager.trySpawnPowerUp(x, y);
    });

    this.powerUpManager.onPowerUpActivated.on('activate', (event: PowerUpActivatedEvent) => {
      this.handlePowerUp(event);
    });

    this.scoreManager.onScoreUpdated.on('update', (event: ScoreUpdatedEvent) => {
      this.uiManager.updateScore(event);
    });

    this.scoreManager.onScoreUpdated.on('comboReset', () => {
      this.uiManager.resetCombo();
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private showMainMenu(): void {
    this.gameState = 'menu';
    this.uiManager.showMainMenu(() => {
      this.startGame();
    });
  }

  private startGame(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.isLevelTransitioning = false;

    this.scoreManager.reset();
    this.uiManager.createHUD(width);
    this.uiManager.updateLives(this.lives);
    this.uiManager.updateLevel(this.level);

    this.paddleController.create(width / 2, height - 60);
    this.ballController.create(width / 2, height - 100);
    this.brickManager.generateLevel(this.level, width, height);

    this.setupCollisions();
  }

  private setupCollisions(): void {
    const paddle = this.paddleController.paddle;
    const balls = this.ballController.balls;
    const bricks = this.brickManager.getBricksGroup();
    const powerUps = this.powerUpManager.getGroup();

    this.physics.add.collider(balls, paddle, (ballObj, paddleObj) => {
      const ball = ballObj as Phaser.Physics.Arcade.Sprite;
      this.ballController.handlePaddleCollision(ball, paddleObj as Phaser.GameObjects.GameObject);
      this.paddleController.triggerBounce();
    });

    this.physics.add.collider(balls, bricks, (ballObj, brickObj) => {
      const ball = ballObj as Phaser.Physics.Arcade.Sprite;
      const brick = brickObj as Phaser.Physics.Arcade.Sprite;
      const isFireball = this.ballController.handleBrickCollision(ball);

      const wasDestroyed = this.brickManager.hitBrick(brick, isFireball);

      if (wasDestroyed) {
        this.scoreManager.addBrickScore();
      }

      if (!isFireball) {
        const ballBody = ball.body as Phaser.Physics.Arcade.Body;
        if (!ballBody) return;
        const velX = ballBody.velocity.x;
        const velY = ballBody.velocity.y;
        const overlapX = ballBody.touching.left || ballBody.touching.right;
        const overlapY = ballBody.touching.up || ballBody.touching.down;

        if (overlapX) ball.setVelocityX(-velX);
        if (overlapY) ball.setVelocityY(-velY);
      }

      this.checkLevelComplete();
    });

    this.physics.add.overlap(paddle, powerUps, () => {
      this.powerUpManager.handlePaddleCollision(paddle);
    });
  }

  private handlePowerUp(event: PowerUpActivatedEvent): void {
    switch (event.type) {
      case 'expand':
        this.paddleController.expand(5000);
        break;
      case 'multiball':
        if (this.ballController.balls.getChildren().length > 0) {
          const firstBall = this.ballController.balls.getChildren()[0] as Phaser.Physics.Arcade.Sprite;
          this.ballController.splitIntoThree(firstBall);
        }
        break;
      case 'fireball':
        this.ballController.activateFireball(8000);
        break;
    }
  }

  update(time: number, delta: number): void {
    if (this.gameState !== 'playing') return;

    this.paddleController.update(time, delta);
    this.powerUpManager.update();

    const lostBalls = this.ballController.checkLostBalls();
    if (lostBalls.length > 0) {
      lostBalls.forEach(ball => this.ballController.removeBall(ball));

      if (this.ballController.getBallCount() === 0) {
        this.handleBallLost();
      }
    }
  }

  private handleBallLost(): void {
    this.lives--;
    this.uiManager.updateLives(this.lives);
    this.paddleController.flashRed();

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      this.time.delayedCall(600, () => {
        this.ballController.resetBall(width / 2, height - 100);
        this.paddleController.reset();
      });
    }
  }

  private checkLevelComplete(): void {
    if (this.isLevelTransitioning) return;

    if (this.brickManager.getActiveBrickCount() === 0) {
      this.isLevelTransitioning = true;

      if (this.level >= this.maxLevel) {
        this.gameWin();
      } else {
        this.level++;
        this.uiManager.showLevelComplete(this.level - 1, () => {
          this.nextLevel();
        });
      }
    }
  }

  private nextLevel(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.uiManager.updateLevel(this.level);
    this.brickManager.generateLevel(this.level, width, height);
    this.ballController.resetBall(width / 2, height - 100);
    this.paddleController.reset();
    this.powerUpManager.clear();
    this.isLevelTransitioning = false;
  }

  private gameOver(): void {
    this.gameState = 'gameover';
    this.powerUpManager.clear();
    this.ballController.clear();

    this.uiManager.showGameOver(() => {
      this.restartGame();
    });
  }

  private gameWin(): void {
    this.gameState = 'gameover';
    this.powerUpManager.clear();
    this.ballController.clear();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.uiManager.showGameOver(() => {
      this.restartGame();
    });

    this.time.delayedCall(100, () => {
      const winText = this.add.text(width / 2, height / 2 - 150, '🎉 恭喜通关! 🎉', {
        fontFamily: 'Arial',
        fontSize: '40px',
        color: '#00ff88',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      winText.setShadow(4, 4, '#00e5ff', 6, true, true);
      winText.setDepth(250);
    });
  }

  private restartGame(): void {
    this.brickManager.clear();
    this.powerUpManager.clear();
    this.ballController.clear();
    this.scoreManager.reset();

    if (this.paddleController.paddle) {
      this.paddleController.paddle.destroy();
    }

    this.scene.restart();
  }

  private handleResize(width: number, height: number): void {
    this.cameras.main.setSize(width, height);
    this.uiManager.resize(width);

    if (this.paddleController.paddle) {
      this.paddleController.paddle.y = height - 60;
    }
  }
}
