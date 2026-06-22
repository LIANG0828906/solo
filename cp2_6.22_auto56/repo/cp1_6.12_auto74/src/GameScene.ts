import Phaser from 'phaser';
import { Player, PlayerInput } from './Player';
import { Terrain } from './Terrain';

const MAX_PROJECTILES = 30;
const MAX_PARTICLES = 30;
const COOLDOWN_DURATION = 2000;
const PROJECTILE_TIMEOUT = 500;

export class GameScene extends Phaser.Scene {
  private player1!: Player;
  private player2!: Player;
  private terrain!: Terrain;
  
  private currentPlayer: number = 1;
  private projectiles: Phaser.Physics.Arcade.Sprite[] = [];
  private particles: Phaser.GameObjects.Graphics[] = [];
  private activeProjectileTimers: Map<Phaser.Physics.Arcade.Sprite, number> = new Map();
  
  private isCooldown: boolean = false;
  private cooldownTimer: number = 0;
  private gameOver: boolean = false;
  
  private cameraShakeIntensity: number = 0;
  private cameraShakeTimer: number = 0;
  
  private worldLayer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    
    this.worldLayer = this.add.container(0, 0);
    
    this.createGround();
    this.terrain = new Terrain(this);
    this.terrain.generate();
    
    this.createPlayers();
    
    this.currentPlayer = 1;
    this.isCooldown = false;
    this.gameOver = false;
    this.updateTurnIndicator();
    
    this.player1.updateHpBar();
    this.player2.updateHpBar();
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => this.restartGame();
    }
    
    this.hideVictoryScreen();
    this.hideCooldownText();
  }

  private createGround(): void {
    const ground = this.physics.add.staticSprite(
      this.scale.width / 2,
      this.scale.height - 10,
      ''
    );
    ground.setSize(this.scale.width, 20);
    ground.setVisible(false);
    ground.refreshBody();
    ground.setName('ground');
  }

  private createPlayers(): void {
    const p1Input: PlayerInput = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      charge: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };
    
    const p2Input: PlayerInput = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      charge: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    };
    
    const bounds = this.terrain.getBounds();
    const p1X = bounds.x - 80;
    const p2X = bounds.x + bounds.width + 80;
    
    this.player1 = new Player(this, 1, p1X, this.scale.height - 150, p1Input);
    this.player2 = new Player(this, 2, p2X, this.scale.height - 150, p2Input);
    
    this.physics.add.collider(this.player1.sprite, this.terrain.getPhysicsGroup());
    this.physics.add.collider(this.player2.sprite, this.terrain.getPhysicsGroup());
    this.physics.add.collider(this.player1.sprite, this.player2.sprite);
    
    p1Input.charge.on('up', () => this.handlePlayerChargeRelease(this.player1));
    p2Input.charge.on('up', () => this.handlePlayerChargeRelease(this.player2));
  }

  private handlePlayerChargeRelease(player: Player): void {
    if (this.gameOver || this.isCooldown) return;
    if (player.id !== this.currentPlayer) return;
    
    const result = player.releaseCharge();
    if (result) {
      this.fireProjectile(player, result.power, result.angle);
    }
  }

  private fireProjectile(player: Player, power: number, angle: number): void {
    if (this.projectiles.length >= MAX_PROJECTILES) {
      const old = this.projectiles.shift();
      if (old) {
        this.activeProjectileTimers.delete(old);
        old.destroy();
      }
    }
    
    const tip = player.getSlingshotTip();
    
    const projectile = this.physics.add.sprite(tip.x, tip.y, '');
    projectile.setCircle(8);
    projectile.setBounce(0, 0);
    projectile.setCollideWorldBounds(false);
    projectile.setGravityY(600);
    
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2C3E50, 1);
    graphics.fillCircle(0, 0, 8);
    graphics.lineStyle(2, 0x1A252F, 1);
    graphics.strokeCircle(0, 0, 8);
    graphics.generateTexture('projectile_texture', 20, 20);
    projectile.setTexture('projectile_texture');
    graphics.destroy();
    
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;
    projectile.setVelocity(vx, vy);
    
    projectile.setData('ownerId', player.id);
    
    this.projectiles.push(projectile);
    this.activeProjectileTimers.set(projectile, 0);
    
    this.startCooldown();
  }

  private startCooldown(): void {
    this.isCooldown = true;
    this.cooldownTimer = COOLDOWN_DURATION;
    this.showCooldownText(2);
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.isCooldown = false;
    this.hideCooldownText();
    this.updateTurnIndicator();
  }

  private update(time: number, delta: number): void {
    if (this.gameOver) return;
    
    this.player1.update(time, delta);
    this.player2.update(time, delta);
    
    if (this.isCooldown) {
      this.cooldownTimer -= delta;
      const remaining = Math.ceil(this.cooldownTimer / 1000);
      this.showCooldownText(remaining);
      
      if (this.cooldownTimer <= 0) {
        this.switchTurn();
      }
    }
    
    this.updateProjectiles(delta);
    this.updateParticles(delta);
    this.checkProjectileCollisions();
    this.updateCameraShake(delta);
    this.updateTurnTimer();
  }

  private updateProjectiles(delta: number): void {
    const toRemove: Phaser.Physics.Arcade.Sprite[] = [];
    
    for (const projectile of this.projectiles) {
      if (!projectile.active) {
        toRemove.push(projectile);
        continue;
      }
      
      const outOfBounds = 
        projectile.x < -50 || 
        projectile.x > this.scale.width + 50 ||
        projectile.y > this.scale.height + 50;
      
      if (outOfBounds) {
        this.createExplosion(projectile.x, projectile.y);
        toRemove.push(projectile);
        continue;
      }
      
      let groundTimer = this.activeProjectileTimers.get(projectile) || 0;
      const onGround = Math.abs(projectile.body!.velocity.y) < 20 && 
                       projectile.y > this.scale.height * 0.7;
      
      if (onGround) {
        groundTimer += delta;
        this.activeProjectileTimers.set(projectile, groundTimer);
        
        if (groundTimer >= PROJECTILE_TIMEOUT) {
          this.createExplosion(projectile.x, projectile.y);
          toRemove.push(projectile);
        }
      }
    }
    
    for (const p of toRemove) {
      this.removeProjectile(p);
    }
  }

  private removeProjectile(projectile: Phaser.Physics.Arcade.Sprite): void {
    const idx = this.projectiles.indexOf(projectile);
    if (idx !== -1) {
      this.projectiles.splice(idx, 1);
    }
    this.activeProjectileTimers.delete(projectile);
    if (projectile.active) {
      projectile.destroy();
    }
  }

  private checkProjectileCollisions(): void {
    const toRemove: Phaser.Physics.Arcade.Sprite[] = [];
    
    for (const projectile of this.projectiles) {
      if (!projectile.active) continue;
      
      const target = projectile.getData('ownerId') === 1 ? this.player2 : this.player1;
      
      if (this.checkSpriteCollision(projectile, target.sprite)) {
        target.takeHit(projectile.x);
        this.createExplosion(projectile.x, projectile.y);
        this.triggerCameraShake(5, 100);
        toRemove.push(projectile);
        
        if (target.hp <= 0) {
          this.endGame(projectile.getData('ownerId'));
        }
        continue;
      }
      
      let hitTerrain = false;
      this.terrain.getPhysicsGroup().getChildren().forEach((body) => {
        const terrainSprite = body as Phaser.Physics.Arcade.Sprite;
        if (this.checkSpriteCollision(projectile, terrainSprite)) {
          hitTerrain = true;
        }
      });
      
      if (hitTerrain) {
        this.createExplosion(projectile.x, projectile.y);
        this.triggerCameraShake(2, 100);
        toRemove.push(projectile);
      }
      
      if (projectile.y > this.scale.height - 25) {
        this.createExplosion(projectile.x, projectile.y);
        this.triggerCameraShake(3, 100);
        toRemove.push(projectile);
      }
    }
    
    for (const p of toRemove) {
      this.removeProjectile(p);
    }
  }

  private checkSpriteCollision(
    a: Phaser.GameObjects.GameObject & { body?: Phaser.Physics.Arcade.Body },
    b: Phaser.GameObjects.GameObject & { body?: Phaser.Physics.Arcade.Body }
  ): boolean {
    if (!a.body || !b.body) return false;
    
    const ab = a.body;
    const bb = b.body;
    
    return (
      ab.x < bb.x + bb.width &&
      ab.x + ab.width > bb.x &&
      ab.y < bb.y + bb.height &&
      ab.y + ab.height > bb.y
    );
  }

  private createExplosion(x: number, y: number): void {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        const old = this.particles.shift();
        if (old) old.destroy();
      }
      
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      
      const graphics = this.add.graphics();
      const size = 3 + Math.random() * 4;
      
      const colors = [0xF39C12, 0xE74C3C, 0xF1C40F, 0xD35400];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 0, size);
      
      graphics.setPosition(x, y);
      graphics.setData('vx', Math.cos(angle) * speed);
      graphics.setData('vy', Math.sin(angle) * speed);
      graphics.setData('life', 500);
      graphics.setData('maxLife', 500);
      graphics.setData('gravity', 400);
      
      this.particles.push(graphics);
    }
  }

  private updateParticles(delta: number): void {
    const toRemove: Phaser.GameObjects.Graphics[] = [];
    
    for (const particle of this.particles) {
      const life = particle.getData('life') as number;
      const newLife = life - delta;
      
      if (newLife <= 0) {
        toRemove.push(particle);
        continue;
      }
      
      particle.setData('life', newLife);
      
      let vy = particle.getData('vy') as number;
      vy += (particle.getData('gravity') as number) * (delta / 1000);
      particle.setData('vy', vy);
      
      const vx = particle.getData('vx') as number;
      particle.x += vx * (delta / 1000);
      particle.y += vy * (delta / 1000);
      
      const maxLife = particle.getData('maxLife') as number;
      particle.setAlpha(newLife / maxLife);
    }
    
    for (const p of toRemove) {
      const idx = this.particles.indexOf(p);
      if (idx !== -1) this.particles.splice(idx, 1);
      p.destroy();
    }
  }

  private triggerCameraShake(intensity: number, duration: number): void {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeTimer = duration;
  }

  private updateCameraShake(delta: number): void {
    if (this.cameraShakeTimer <= 0) {
      if (this.worldLayer.x !== 0 || this.worldLayer.y !== 0) {
        this.worldLayer.setPosition(0, 0);
      }
      return;
    }
    
    this.cameraShakeTimer -= delta;
    
    if (this.cameraShakeTimer > 0) {
      const offsetX = (Math.random() - 0.5) * this.cameraShakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.cameraShakeIntensity * 2;
      this.worldLayer.setPosition(offsetX, offsetY);
    } else {
      this.worldLayer.setPosition(0, 0);
    }
  }

  private updateTurnIndicator(): void {
    const indicator = document.getElementById('turn-indicator');
    if (indicator) {
      indicator.textContent = `P${this.currentPlayer} Turn`;
      indicator.style.borderColor = this.currentPlayer === 1 ? '#3498DB' : '#E74C3C';
      indicator.style.color = this.currentPlayer === 1 ? '#3498DB' : '#E74C3C';
    }
  }

  private updateTurnTimer(): void {
    const timer = document.getElementById('turn-timer');
    if (timer) {
      if (this.isCooldown) {
        timer.textContent = `${Math.ceil(this.cooldownTimer / 1000)}s`;
      } else {
        timer.textContent = 'Ready';
      }
    }
  }

  private showCooldownText(seconds: number): void {
    const text = document.getElementById('cooldown-text');
    if (text) {
      text.style.display = 'block';
      text.textContent = seconds > 0 ? seconds.toString() : '';
    }
  }

  private hideCooldownText(): void {
    const text = document.getElementById('cooldown-text');
    if (text) {
      text.style.display = 'none';
    }
  }

  private endGame(winnerId: number): void {
    this.gameOver = true;
    
    const victoryScreen = document.getElementById('victory-screen');
    const victoryText = document.getElementById('victory-text');
    
    if (victoryText) {
      victoryText.textContent = `P${winnerId} WINS!`;
      victoryText.style.animation = 'none';
      void victoryText.offsetWidth;
      victoryText.style.animation = 'victoryZoom 1s ease-out forwards';
    }
    
    if (victoryScreen) {
      victoryScreen.style.display = 'flex';
    }
    
    const powerBar = document.getElementById('power-bar-container');
    if (powerBar) powerBar.style.display = 'none';
    this.hideCooldownText();
  }

  private hideVictoryScreen(): void {
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.style.display = 'none';
    }
  }

  private restartGame(): void {
    for (const p of this.projectiles) {
      p.destroy();
    }
    this.projectiles = [];
    this.activeProjectileTimers.clear();
    
    for (const particle of this.particles) {
      particle.destroy();
    }
    this.particles = [];
    
    this.player1.destroy();
    this.player2.destroy();
    this.terrain.destroy();
    
    this.scene.restart();
  }
}
