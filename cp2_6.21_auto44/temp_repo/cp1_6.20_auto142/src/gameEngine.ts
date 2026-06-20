import type { Direction, Position, RoomEventType } from './types';
import { GAME_CONFIG, COLORS, VISIBLE_ROOMS_X, VISIBLE_ROOMS_Y } from './constants';
import { Player } from './player';
import { RoomGenerator } from './roomGenerator';
import { ParticleSystem } from './particleSystem';
import { UIRenderer } from './uiRenderer';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private roomGenerator: RoomGenerator;
  private particleSystem: ParticleSystem;
  private uiRenderer: UIRenderer;

  private lastMoveTime: number = 0;
  private lastFrameTime: number = 0;
  private scale: number = 1;
  private canvasOffsetX: number = 0;
  private canvasOffsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.player = new Player();
    this.roomGenerator = new RoomGenerator();
    this.particleSystem = new ParticleSystem();
    this.uiRenderer = new UIRenderer();

    this.roomGenerator.markExplored(this.player.getPosition());
    this.roomGenerator.markEventTriggered(this.player.getPosition());

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const container = document.getElementById('game-container') as HTMLElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const baseWidth = VISIBLE_ROOMS_X * (GAME_CONFIG.roomSize + GAME_CONFIG.roomBorder) + GAME_CONFIG.roomBorder;
    const baseHeight = VISIBLE_ROOMS_Y * (GAME_CONFIG.roomSize + GAME_CONFIG.roomBorder) + GAME_CONFIG.roomBorder;

    const scaleX = containerWidth / baseWidth;
    const scaleY = containerHeight / baseHeight;
    this.scale = Math.min(scaleX, scaleY, 1.5);

    const finalWidth = Math.floor(baseWidth * this.scale);
    const finalHeight = Math.floor(baseHeight * this.scale);

    this.canvas.width = finalWidth;
    this.canvas.height = finalHeight;
    this.canvas.style.width = `${finalWidth}px`;
    this.canvas.style.height = `${finalHeight}px`;

    this.canvasOffsetX = (containerWidth - finalWidth) / 2;
    this.canvasOffsetY = (containerHeight - finalHeight) / 2;
    this.canvas.style.left = `${this.canvasOffsetX}px`;
    this.canvas.style.top = `${this.canvasOffsetY}px`;
  }

  public handleKeyDown(key: string): void {
    if (!this.player.isAlive()) return;

    const now = performance.now();
    const cooldown = this.player.getMoveCooldown(now);

    if (now - this.lastMoveTime < cooldown) return;

    let direction: Direction | null = null;

    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        direction = 'up';
        break;
      case 's':
      case 'arrowdown':
        direction = 'down';
        break;
      case 'a':
      case 'arrowleft':
        direction = 'left';
        break;
      case 'd':
      case 'arrowright':
        direction = 'right';
        break;
    }

    if (direction) {
      this.movePlayer(direction);
      this.lastMoveTime = now;
    }
  }

  private movePlayer(direction: Direction): void {
    this.player.setDirection(direction);

    const currentPos = this.player.getPosition();
    const newPos: Position = { ...currentPos };

    switch (direction) {
      case 'up': newPos.y -= 1; break;
      case 'down': newPos.y += 1; break;
      case 'left': newPos.x -= 1; break;
      case 'right': newPos.x += 1; break;
    }

    if (newPos.x < 0 || newPos.x >= GAME_CONFIG.gridWidth ||
        newPos.y < 0 || newPos.y >= GAME_CONFIG.gridHeight) {
      return;
    }

    this.player.setPosition(newPos);

    const room = this.roomGenerator.getOrCreateRoom(newPos);
    this.roomGenerator.markExplored(newPos);

    if (!room.eventTriggered) {
      this.triggerRoomEvent(room.eventType, newPos);
      this.roomGenerator.markEventTriggered(newPos);
    }
  }

  private triggerRoomEvent(eventType: RoomEventType, pos: Position): void {
    const roomCenter = this.getRoomCenterScreen(pos);

    switch (eventType) {
      case 'spike':
        this.player.takeDamage(10);
        this.roomGenerator.setRoomFlash(pos, 500);
        this.particleSystem.emitFire(roomCenter.x, roomCenter.y);
        this.uiRenderer.showEventToast('受到尖刺伤害 -10 HP', 'damage');
        break;

      case 'treasure':
        const coins = Math.floor(Math.random() * 11) + 5;
        this.player.addCoins(coins);
        this.particleSystem.emitCoinBurst(roomCenter.x, roomCenter.y);
        this.uiRenderer.showEventToast(`获得金币 +${coins}`, 'coin');
        break;

      case 'swamp':
        this.player.applySlow(3000);
        this.roomGenerator.setRoomSwamp(pos, 3000);
        this.particleSystem.emitSwamp(roomCenter.x, roomCenter.y);
        this.uiRenderer.showEventToast('进入沼泽，移速降低', 'slow');
        break;

      case 'portal':
        this.particleSystem.emitPortal(roomCenter.x, roomCenter.y);
        this.teleportToRandomExplored(pos);
        this.uiRenderer.showEventToast('传送门激活！', 'portal');
        break;

      default:
        break;
    }
  }

  private teleportToRandomExplored(fromPos: Position): void {
    const exploredRooms = this.roomGenerator.getExploredRooms();
    const validRooms = exploredRooms.filter(
      (r) => r.position.x !== fromPos.x || r.position.y !== fromPos.y
    );

    if (validRooms.length > 0) {
      const targetRoom = validRooms[Math.floor(Math.random() * validRooms.length)];
      this.player.setPosition(targetRoom.position);
    }
  }

  private getRoomCenterScreen(roomPos: Position): { x: number; y: number } {
    const playerPos = this.player.getPosition();
    const roomSize = GAME_CONFIG.roomSize;
    const border = GAME_CONFIG.roomBorder;
    const cellSize = roomSize + border;

    const offsetX = (VISIBLE_ROOMS_X / 2 - 0.5) * cellSize;
    const offsetY = (VISIBLE_ROOMS_Y / 2 - 0.5) * cellSize;

    const deltaX = (roomPos.x - playerPos.x) * cellSize;
    const deltaY = (roomPos.y - playerPos.y) * cellSize;

    return {
      x: offsetX + deltaX + roomSize / 2,
      y: offsetY + deltaY + roomSize / 2
    };
  }

  public update(): void {
    this.particleSystem.update();
  }

  public render(): void {
    const ctx = this.ctx;
    const now = performance.now();
    const roomSize = GAME_CONFIG.roomSize;
    const border = GAME_CONFIG.roomBorder;
    const cellSize = roomSize + border;

    ctx.save();
    ctx.scale(this.scale, this.scale);

    const canvasLogicalWidth = this.canvas.width / this.scale;
    const canvasLogicalHeight = this.canvas.height / this.scale;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);

    const playerPos = this.player.getPosition();
    const offsetX = (VISIBLE_ROOMS_X / 2 - 0.5) * cellSize;
    const offsetY = (VISIBLE_ROOMS_Y / 2 - 0.5) * cellSize;

    for (let dy = -Math.ceil(VISIBLE_ROOMS_Y / 2) - 1; dy <= Math.ceil(VISIBLE_ROOMS_Y / 2) + 1; dy++) {
      for (let dx = -Math.ceil(VISIBLE_ROOMS_X / 2) - 1; dx <= Math.ceil(VISIBLE_ROOMS_X / 2) + 1; dx++) {
        const roomPos: Position = {
          x: playerPos.x + dx,
          y: playerPos.y + dy
        };

        if (roomPos.x < 0 || roomPos.x >= GAME_CONFIG.gridWidth ||
            roomPos.y < 0 || roomPos.y >= GAME_CONFIG.gridHeight) {
          continue;
        }

        const screenX = offsetX + dx * cellSize;
        const screenY = offsetY + dy * cellSize;

        const room = this.roomGenerator.getOrCreateRoom(roomPos);
        const isCurrentRoom = dx === 0 && dy === 0;
        const isFlashing = this.roomGenerator.isFlashing(roomPos, now);
        const hasSwamp = this.roomGenerator.hasSwamp(roomPos, now);

        let fillColor: string;
        if (isFlashing) {
          fillColor = COLORS.roomFlash;
        } else if (hasSwamp) {
          fillColor = '#2a5a2a';
        } else if (isCurrentRoom) {
          fillColor = '#4a4a7a';
        } else if (room.explored) {
          fillColor = COLORS.roomExplored;
        } else {
          fillColor = COLORS.roomUnexplored;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(screenX, screenY, roomSize, roomSize);

        if (isCurrentRoom) {
          ctx.strokeStyle = COLORS.roomCurrent;
          ctx.lineWidth = 3;
          ctx.strokeRect(screenX + 1.5, screenY + 1.5, roomSize - 3, roomSize - 3);
        } else {
          ctx.strokeStyle = COLORS.gridLine;
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 0.5, screenY + 0.5, roomSize - 1, roomSize - 1);
        }

        if (room.explored && !room.eventTriggered && room.eventType !== 'empty') {
          this.drawRoomEventIcon(ctx, room.eventType, screenX + roomSize / 2, screenY + roomSize / 2);
        }

        if (hasSwamp) {
          this.drawSwampRipples(ctx, screenX + roomSize / 2, screenY + roomSize / 2, now);
        }
      }
    }

    this.particleSystem.render(ctx, 0, 0);

    this.drawPlayer(ctx, offsetX, offsetY);

    ctx.restore();

    this.uiRenderer.updatePlayerUI(this.player);

    const exploredPositions = this.roomGenerator.getExploredRooms().map((r) => r.position);
    const bounds = this.roomGenerator.getRoomBounds();
    this.uiRenderer.renderMinimap(playerPos, exploredPositions, bounds);
  }

  private drawRoomEventIcon(ctx: CanvasRenderingContext2D, eventType: RoomEventType, x: number, y: number): void {
    ctx.save();
    ctx.globalAlpha = 0.4;

    switch (eventType) {
      case 'spike':
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? 12 : 6;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'treasure':
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x - 10, y - 8, 20, 16);
        ctx.fillStyle = '#cc9900';
        ctx.fillRect(x - 10, y - 2, 20, 2);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 3, y - 2, 6, 8);
        break;

      case 'swamp':
        ctx.fillStyle = '#44aa44';
        ctx.beginPath();
        ctx.ellipse(x, y, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'portal':
        ctx.strokeStyle = '#8866ff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x, y, 6 + i * 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }

  private drawSwampRipples(ctx: CanvasRenderingContext2D, x: number, y: number, now: number): void {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#66dd66';
    ctx.lineWidth = 1.5;

    const phase = (now % 1500) / 1500;
    for (let i = 0; i < 3; i++) {
      const t = (phase + i * 0.33) % 1;
      const radius = 5 + t * 25;
      ctx.globalAlpha = 0.3 * (1 - t);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
    const cellSize = GAME_CONFIG.roomSize + GAME_CONFIG.roomBorder;
    const cx = offsetX + GAME_CONFIG.roomSize / 2;
    const cy = offsetY + GAME_CONFIG.roomSize / 2;
    const direction = this.player.getDirection();

    ctx.save();
    ctx.translate(cx, cy);

    switch (direction) {
      case 'up': ctx.rotate(0); break;
      case 'down': ctx.rotate(Math.PI); break;
      case 'left': ctx.rotate(-Math.PI / 2); break;
      case 'right': ctx.rotate(Math.PI / 2); break;
    }

    const px = -8;
    const py = -8;

    ctx.fillStyle = COLORS.character;
    ctx.fillRect(px + 5, py + 4, 6, 8);
    ctx.fillRect(px + 4, py + 12, 2, 4);
    ctx.fillRect(px + 10, py + 12, 2, 4);
    ctx.fillRect(px + 5, py + 1, 6, 4);
    ctx.fillRect(px + 6, py + 2, 1, 1);
    ctx.fillRect(px + 9, py + 2, 1, 1);

    ctx.fillStyle = COLORS.characterSword;
    ctx.fillRect(px + 13, py + 2, 2, 10);
    ctx.fillRect(px + 12, py + 3, 1, 1);
    ctx.fillRect(px + 15, py + 3, 1, 1);
    ctx.fillRect(px + 12, py + 11, 4, 1);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(px + 13, py + 12, 2, 2);

    ctx.restore();
  }

  public start(): void {
    const loop = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
      }

      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      this.update();
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
