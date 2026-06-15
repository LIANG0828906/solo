import { Player } from './Player';
import { Laser } from './Entity';
import { Terrain } from './Terrain';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDown: boolean = false;

  private players: Player[] = [];
  private lasers: Laser[] = [];
  private terrain: Terrain;

  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraSmooth: number = 0.08;

  private lastTime: number = 0;
  private startTime: number = 0;
  private fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;

  private shakeAmplitude: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  private miniMapSize: number = 150;
  private radarRange: number = 800;

  private worldWidth: number = 8000;
  private worldHeight: number = 8000;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.terrain = new Terrain(this.worldWidth, this.worldHeight);

    this.setupCanvas();
    this.initPlayers();
    this.setupInput();
    this.setupCamera();

    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.loop(performance.now());
  }

  private setupCanvas(): void {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  private initPlayers(): void {
    const playerColors = ['#ff4466', '#44ff66', '#6644ff', '#ffaa44', '#aa44ff'];
    const aiNames = ['Raptor', 'Valkyrie', 'Phoenix', 'Viper'];

    const playerX = this.worldWidth / 2 + (Math.random() - 0.5) * 500;
    const playerY = this.worldHeight / 2 + (Math.random() - 0.5) * 500;
    const mainPlayer = new Player(0, playerX, playerY, '#00ddff', true, 'Player');
    this.players.push(mainPlayer);

    for (let i = 0; i < 4; i++) {
      let x: number, y: number;
      let tries = 0;
      do {
        x = Math.random() * this.worldWidth;
        y = Math.random() * this.worldHeight;
        tries++;
      } while (
        Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2) < 800 && tries < 50
      );

      const ai = new Player(
        i + 1,
        x,
        y,
        playerColors[i % playerColors.length],
        false,
        aiNames[i]
      );
      this.players.push(ai);
    }
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (e.key === 'Shift' || e.key === 'shift') {
        const mainPlayer = this.players.find((p) => p.isPlayer);
        if (mainPlayer && mainPlayer.isAlive()) {
          mainPlayer.activateShield();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private setupCamera(): void {
    const mainPlayer = this.players.find((p) => p.isPlayer);
    if (mainPlayer) {
      this.cameraX = mainPlayer.getX() - this.width / 2;
      this.cameraY = mainPlayer.getY() - this.height / 2;
    }
  }

  private triggerShake(amplitude: number, duration: number): void {
    this.shakeAmplitude = Math.max(this.shakeAmplitude, amplitude);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTimer = duration;
  }

  private updateShake(dt: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = this.shakeTimer / this.shakeDuration;
      const amp = this.shakeAmplitude * t;
      this.shakeOffsetX = (Math.random() - 0.5) * amp * 2;
      this.shakeOffsetY = (Math.random() - 0.5) * amp * 2;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeAmplitude = 0;
    }
  }

  private updateCamera(): void {
    const mainPlayer = this.players.find((p) => p.isPlayer);
    if (mainPlayer && mainPlayer.isAlive()) {
      const targetX = mainPlayer.getX() - this.width / 2;
      const targetY = mainPlayer.getY() - this.height / 2;
      this.cameraX += (targetX - this.cameraX) * this.cameraSmooth;
      this.cameraY += (targetY - this.cameraY) * this.cameraSmooth;
    }
  }

  private update(dt: number, currentTime: number): void {
    this.updateShake(dt);
    this.updateCamera();

    this.terrain.update(dt, currentTime);

    const mainPlayer = this.players.find((p) => p.isPlayer);
    let mouseAngle = 0;
    if (mainPlayer) {
      const worldMouseX = this.mouseX + this.cameraX + this.shakeOffsetX;
      const worldMouseY = this.mouseY + this.cameraY + this.shakeOffsetY;
      mouseAngle = Math.atan2(
        worldMouseY - mainPlayer.getY(),
        worldMouseX - mainPlayer.getX()
      );
    }

    for (const player of this.players) {
      if (player.isPlayer && player.isAlive()) {
        player.update(dt, this.keys, mouseAngle, this.terrain);

        if (this.mouseDown) {
          const laser = player.shoot(currentTime);
          if (laser) this.lasers.push(laser);
        }
      } else if (!player.isPlayer && player.isAlive()) {
        const laser = player.updateAI(
          dt,
          currentTime,
          this.players,
          this.worldWidth,
          this.worldHeight
        );
        if (laser) this.lasers.push(laser);
      }
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.update(dt);

      if (!laser.isAlive()) {
        this.lasers.splice(i, 1);
        continue;
      }

      for (const player of this.players) {
        if (player.id === laser.getOwnerId() || !player.isAlive()) continue;
        if (player.checkSATCollision(laser)) {
          const dead = player.takeDamage(laser.getDamage());
          this.terrain.addExplosion(laser.getX(), laser.getY(), 30);

          if (laser.getOwnerId() === 0 || player.isPlayer) {
            this.triggerShake(5, 0.2);
          }

          if (dead) {
            this.terrain.addExplosion(player.getX(), player.getY(), 60);
            this.terrain.addDebris(player.getX(), player.getY(), player.color, 6);
            player.destroy();
          }

          this.lasers.splice(i, 1);
          break;
        }
      }
    }
  }

  private renderHUD(): void {
    const mainPlayer = this.players.find((p) => p.isPlayer);
    if (!mainPlayer || !mainPlayer.isAlive()) return;

    const state = mainPlayer.getState();
    const barWidth = 160;
    const barHeight = 14;
    const startX = 20;
    const startY = 20;

    this.ctx.save();

    const hpGradient = this.ctx.createLinearGradient(
      startX,
      startY,
      startX + barWidth,
      startY
    );
    hpGradient.addColorStop(0, '#00ff44');
    hpGradient.addColorStop(1, '#ff2244');

    const hpPercent = state.hp / state.maxHp;
    this.ctx.shadowColor = 'rgba(0, 200, 255, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = 'rgba(10, 11, 26, 0.8)';
    this.ctx.fillRect(startX, startY, barWidth, barHeight);
    this.ctx.strokeRect(startX, startY, barWidth, barHeight);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = hpGradient;
    this.ctx.fillRect(startX + 2, startY + 2, (barWidth - 4) * hpPercent, barHeight - 4);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px Orbitron, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('HULL', startX, startY - 3);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${Math.ceil(state.hp)}/${state.maxHp}`, startX + barWidth, startY - 3);

    const energyY = startY + barHeight + 10;
    const energyPercent = state.energy / state.maxEnergy;
    this.ctx.shadowColor = 'rgba(0, 200, 255, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
    this.ctx.fillStyle = 'rgba(10, 11, 26, 0.8)';
    this.ctx.fillRect(startX, energyY, barWidth, barHeight);
    this.ctx.strokeRect(startX, energyY, barWidth, barHeight);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#ff8800';
    this.ctx.shadowColor = '#ff8800';
    this.ctx.shadowBlur = 8;
    this.ctx.fillRect(startX + 2, energyY + 2, (barWidth - 4) * energyPercent, barHeight - 4);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px Orbitron, monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('ENERGY', startX, energyY - 3);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${Math.ceil(state.energy)}/${state.maxEnergy}`, startX + barWidth, energyY - 3);

    this.ctx.restore();
  }

  private renderMiniMap(currentTime: number): void {
    const mainPlayer = this.players.find((p) => p.isPlayer);
    const mapX = this.width - this.miniMapSize - 20;
    const mapY = 20;
    const mapScale = this.miniMapSize / Math.max(this.worldWidth, this.worldHeight);

    this.ctx.save();

    this.ctx.shadowColor = 'rgba(0, 200, 255, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = 'rgba(10, 11, 26, 0.8)';
    this.ctx.fillRect(mapX, mapY, this.miniMapSize, this.miniMapSize);
    this.ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(mapX, mapY, this.miniMapSize, this.miniMapSize);
    this.ctx.shadowBlur = 0;

    if (mainPlayer && mainPlayer.isAlive()) {
      const pulse = 0.5 + 0.5 * Math.sin(currentTime * 0.005);
      this.ctx.strokeStyle = `rgba(0, 255, 100, ${0.2 + 0.2 * pulse})`;
      this.ctx.lineWidth = 1;
      const radarScreenSize = this.radarRange * mapScale * 2;
      this.ctx.beginPath();
      this.ctx.arc(
        mapX + mainPlayer.getX() * mapScale,
        mapY + mainPlayer.getY() * mapScale,
        radarScreenSize / 2,
        0,
        Math.PI * 2
      );
      this.ctx.stroke();
    }

    for (const player of this.players) {
      if (!player.isAlive()) continue;
      const px = mapX + player.getX() * mapScale;
      const py = mapY + player.getY() * mapScale;

      if (player.isPlayer) {
        this.ctx.fillStyle = '#00ff66';
        this.ctx.shadowColor = '#00ff66';
        this.ctx.shadowBlur = 6;
      } else {
        let inRadar = true;
        if (mainPlayer && mainPlayer.isAlive()) {
          const d = Math.sqrt(
            (player.getX() - mainPlayer.getX()) ** 2 +
              (player.getY() - mainPlayer.getY()) ** 2
          );
          inRadar = d <= this.radarRange;
        }

        if (inRadar) {
          const blink = 0.5 + 0.5 * Math.sin(currentTime * 0.008);
          this.ctx.fillStyle = `rgba(255, 68, 68, ${0.4 + 0.6 * blink})`;
          this.ctx.shadowColor = '#ff4444';
          this.ctx.shadowBlur = 8;
        } else {
          this.ctx.fillStyle = 'rgba(255, 68, 68, 0.25)';
          this.ctx.shadowBlur = 0;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(px, py, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.fillStyle = '#88ccff';
    this.ctx.font = '10px Orbitron, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('RADAR', mapX + this.miniMapSize / 2, mapY + this.miniMapSize + 14);

    const aliveCount = this.players.filter((p) => p.isAlive()).length;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '9px Orbitron, monospace';
    this.ctx.fillText(
      `SHIPS: ${aliveCount}/${this.players.length}`,
      mapX + this.miniMapSize / 2,
      mapY + this.miniMapSize + 28
    );

    this.ctx.restore();
  }

  private renderGameOver(): void {
    const aliveCount = this.players.filter((p) => p.isAlive()).length;
    const mainPlayer = this.players.find((p) => p.isPlayer);
    const playerDead = mainPlayer && !mainPlayer.isAlive();

    if (aliveCount <= 1 || playerDead) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(10, 11,