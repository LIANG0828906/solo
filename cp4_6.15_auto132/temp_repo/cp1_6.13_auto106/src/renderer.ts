import {
  CONFIG, Floor, Room, RoomType, Position, Equipment, GameState, CombatState, BossFightState
} from './types';
import { Player } from './player';
import { ParticleSystem } from './particles';
import { getHpGradientColor, formatTime, lerp } from './utils';
import { MapGenerator } from './map';
import { CombatSystem } from './combat';

interface UIState {
  gameTime: number;
  gameState: GameState;
  transitionProgress: number;
  transitionDirection: 'in' | 'out';
  equipmentPrompt: {
    active: boolean;
    playerId: number;
    equipment: Equipment | null;
    oldEquipment: Equipment | null;
  };
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private mapOffsetX: number;
  private mapOffsetY: number;
  private doorBlinkTimer: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.mapOffsetX = 0;
    this.mapOffsetY = 0;
    this.doorBlinkTimer = 0;

    this.calculateMapOffset();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.calculateMapOffset();
  }

  private calculateMapOffset(): void {
    const mapWidth = CONFIG.GRID_WIDTH * CONFIG.ROOM_SIZE;
    const mapHeight = CONFIG.GRID_HEIGHT * CONFIG.ROOM_SIZE;
    this.mapOffsetX = (this.width - mapWidth) / 2;
    this.mapOffsetY = (this.height - mapHeight) / 2 - 20;
  }

  clear(): void {
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  render(
    floors: Floor[],
    currentFloor: number,
    player1: Player,
    player2: Player,
    combat: CombatSystem,
    particles: ParticleSystem,
    ui: UIState
  ): void {
    this.clear();

    this.doorBlinkTimer += 0.05;
    if (this.doorBlinkTimer > Math.PI * 2) {
      this.doorBlinkTimer = 0;
    }

    if (ui.gameState === 'BOSS_FIGHT') {
      this.renderBossArena(player1, player2, combat, particles);
    } else {
      this.renderFloor(floors[currentFloor]!, currentFloor + 1);
      this.renderPlayer(player1, 1);
      this.renderPlayer(player2, 2);
    }

    particles.render(this.ctx);

    if (ui.gameState === 'COMBAT') {
      this.renderCombatOverlay(player1, player2, combat);
    }

    this.renderUI(player1, player2, ui, currentFloor + 1);

    if (ui.equipmentPrompt.active) {
      this.renderEquipmentPrompt(ui.equipmentPrompt);
    }

    if (ui.gameState === 'TRANSITION') {
      this.renderTransition(ui.transitionProgress, ui.transitionDirection, currentFloor + 1);
    }
  }

  private renderFloor(floor: Floor, level: number): void {
    const rooms = floor.rooms;

    for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
      for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
        const room = rooms[y]![x]!;
        if (room.type === 'EMPTY' && !room.visited) continue;

        this.renderRoom(room);
      }
    }
  }

  private renderRoom(room: Room): void {
    const x = this.mapOffsetX + room.x * CONFIG.ROOM_SIZE;
    const y = this.mapOffsetY + room.y * CONFIG.ROOM_SIZE;
    const size = CONFIG.ROOM_SIZE;

    let bgColor = '#5D4037';
    if (room.visited) {
      bgColor = '#4E342E';
    }

    switch (room.type) {
      case 'ENTRANCE':
        bgColor = '#2E7D32';
        break;
      case 'STAIRS':
        bgColor = '#1565C0';
        break;
      case 'BOSS':
        bgColor = '#B71C1C';
        break;
      case 'MONSTER':
        bgColor = '#4E342E';
        break;
      case 'EQUIPMENT':
        bgColor = '#4E342E';
        break;
      case 'TRAP':
        bgColor = '#4E342E';
        break;
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);

    this.renderDoors(room, x, y, size);

    this.renderRoomContent(room, x, y, size);
  }

  private renderDoors(room: Room, rx: number, ry: number, size: number): void {
    const doorWidth = 16;
    const doorHeight = 6;
    const blinkAlpha = 0.5 + 0.5 * Math.sin(this.doorBlinkTimer * 3);

    this.ctx.fillStyle = `rgba(255, 215, 0, ${blinkAlpha})`;

    if (room.doors.up) {
      this.ctx.fillRect(rx + size / 2 - doorWidth / 2, ry - doorHeight / 2 + 2, doorWidth, doorHeight);
    }
    if (room.doors.down) {
      this.ctx.fillRect(rx + size / 2 - doorWidth / 2, ry + size - doorHeight / 2 - 2, doorWidth, doorHeight);
    }
    if (room.doors.left) {
      this.ctx.save();
      this.ctx.translate(rx - doorHeight / 2 + 2, ry + size / 2 + doorWidth / 2);
      this.ctx.rotate(-Math.PI / 2);
      this.ctx.fillRect(0, 0, doorWidth, doorHeight);
      this.ctx.restore();
    }
    if (room.doors.right) {
      this.ctx.save();
      this.ctx.translate(rx + size - doorHeight / 2 - 2, ry + size / 2 - doorWidth / 2);
      this.ctx.rotate(Math.PI / 2);
      this.ctx.fillRect(0, 0, doorWidth, doorHeight);
      this.ctx.restore();
    }
  }

  private renderRoomContent(room: Room, rx: number, ry: number, size: number): void {
    const cx = rx + size / 2;
    const cy = ry + size / 2;

    switch (room.type) {
      case 'ENTRANCE':
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('入口', cx, cy + 5);
        break;

      case 'STAIRS':
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('楼梯', cx, cy + 5);
        break;

      case 'BOSS':
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BOSS', cx, cy + 5);
        break;

      case 'MONSTER':
        if (room.monster && room.monster.hp > 0) {
          this.ctx.fillStyle = room.monster.color;
          this.ctx.beginPath();
          this.ctx.arc(cx, cy, 18, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#FFF';
          this.ctx.fillRect(cx - 8, cy - 6, 4, 4);
          this.ctx.fillRect(cx + 4, cy - 6, 4, 4);
        }
        break;

      case 'EQUIPMENT':
        if (room.equipment) {
          if (room.equipment.type === 'WEAPON') {
            this.ctx.fillStyle = room.equipment.color;
            this.ctx.fillRect(cx - 3, cy - 15, 6, 30);
            this.ctx.fillRect(cx - 10, cy - 15, 20, 6);
          } else {
            this.ctx.fillStyle = room.equipment.color;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 16, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
          }
        }
        break;

      case 'TRAP':
        this.ctx.fillStyle = '#8B0000';
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const px = cx + Math.cos(angle) * 12;
          const py = cy + Math.sin(angle) * 12;
          this.ctx.beginPath();
          this.ctx.arc(px, py, 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
    }
  }

  private renderPlayer(player: Player, playerNum: number): void {
    const renderPos = player.getRenderPosition();
    const px = this.mapOffsetX + renderPos.x * CONFIG.ROOM_SIZE + CONFIG.ROOM_SIZE / 2;
    const py = this.mapOffsetY + renderPos.y * CONFIG.ROOM_SIZE + CONFIG.ROOM_SIZE / 2;

    if (player.hasArmor()) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.strokeStyle = player.getArmorColor();
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 26, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.ctx.fillStyle = player.getState().color;
    this.ctx.beginPath();
    this.ctx.arc(px, py, 18, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(px - 8, py - 6, 5, 5);
    this.ctx.fillRect(px + 3, py - 6, 5, 5);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(px - 6, py - 5, 2, 3);
    this.ctx.fillRect(px + 5, py - 5, 2, 3);

    this.ctx.save();
    this.ctx.translate(px + 18, py);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.fillStyle = player.getWeaponColor();
    this.ctx.fillRect(-2, -14, 4, 20);
    this.ctx.fillRect(-6, -14, 12, 4);
    this.ctx.restore();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`P${playerNum}`, px, py - 25);
  }

  private renderBossArena(player1: Player, player2: Player, combat: CombatSystem, particles: ParticleSystem): void {
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.fillStyle = '#1a0f0a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = '#5D4037';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * 40);
      this.ctx.lineTo(this.width, i * 40);
      this.ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * 40, 0);
      this.ctx.lineTo(i * 40, this.height);
      this.ctx.stroke();
    }

    const safeZoneRadius = combat.getSafeZoneRadius();
    const safeZoneCenter = combat.getSafeZoneCenter();
    const szx = this.width / 2;
    const szy = this.height / 2;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(183, 28, 28, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(szx, szy, safeZoneRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.arc(szx, szy, safeZoneRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.renderBossPlayer(player1, 1, szx, szy);
    this.renderBossPlayer(player2, 2, szx, szy);
  }

  private renderBossPlayer(player: Player, playerNum: number, arenaCx: number, arenaCy: number): void {
    const state = player.getState();
    const pos = player.getRenderPosition();
    const px = arenaCx + (pos.x - 0.5) * 100;
    const py = arenaCy + (pos.y - 0.5) * 100;

    const attackOffset = player.getAttackAnimation() * 30 * (playerNum === 1 ? 1 : -1);

    if (player.hasArmor()) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.4;
      this.ctx.strokeStyle = player.getArmorColor();
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.arc(px + attackOffset, py, 35, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.ctx.fillStyle = state.color;
    this.ctx.beginPath();
    this.ctx.arc(px + attackOffset, py, 25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(px + attackOffset - 10, py - 8, 7, 7);
    this.ctx.fillRect(px + attackOffset + 3, py - 8, 7, 7);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(px + attackOffset - 8, py - 6, 3, 4);
    this.ctx.fillRect(px + attackOffset + 6, py - 6, 3, 4);

    this.ctx.save();
    this.ctx.translate(px + attackOffset + 25, py);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.fillStyle = player.getWeaponColor();
    this.ctx.fillRect(-3, -20, 6, 28);
    this.ctx.fillRect(-9, -20, 18, 6);
    this.ctx.restore();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`玩家${playerNum}`, px + attackOffset, py - 35);
  }

  private renderCombatOverlay(player1: Player, player2: Player, combat: CombatSystem): void {
    const combatState = combat.getCombatState();
    if (!combatState.active || !combatState.monster) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const player = combatState.playerId === 1 ? player1 : player2;
    const playerX = this.width * 0.25;
    const monsterX = this.width * 0.75;
    const centerY = this.height * 0.45;

    const playerAttackOffset = combatState.playerAttackAnimation * 80;
    const monsterAttackOffset = combatState.monsterAttackAnimation * -80;

    this.renderCombatPlayer(player, playerX + playerAttackOffset, centerY, combatState.playerId);

    this.renderCombatMonster(combatState.monster, monsterX + monsterAttackOffset, centerY);

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 100);
    this.ctx.lineTo(this.width / 2, this.height - 150);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    if (combatState.damageTextTimer > 0) {
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      const textY = centerY - 60 - (1 - combatState.damageTextTimer) * 50;
      this.ctx.globalAlpha = Math.min(1, combatState.damageTextTimer * 2);
      if (combatState.turn === 'MONSTER' && combatState.playerAttackAnimation > 0) {
        this.ctx.fillText(combatState.damageText, monsterX, textY);
      } else {
        this.ctx.fillText(combatState.damageText, playerX, textY);
      }
      this.ctx.globalAlpha = 1;
    }

    const turnText = combatState.turn === 'PLAYER' ? '你的回合' : '怪物回合';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(turnText, this.width / 2, centerY);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = '18px sans-serif';
    this.ctx.fillText('按 E 或 Enter 攻击', this.width / 2, centerY + 50);

    this.renderCombatHpBar(playerX, centerY + 80, player.getHp(), player.getMaxHp(), '玩家');
    this.renderCombatHpBar(monsterX, centerY + 80, combatState.monster.hp, combatState.monster.maxHp, combatState.monster.name);
  }

  private renderCombatPlayer(player: Player, x: number, y: number, playerId: number): void {
    const state = player.getState();

    if (player.hasArmor()) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.strokeStyle = player.getArmorColor();
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 55, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.ctx.fillStyle = state.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 40, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFF';
    this.ctx.fillRect(x - 15, y - 12, 10, 10);
    this.ctx.fillRect(x + 5, y - 12, 10, 10);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x - 12, y - 9, 4, 6);
    this.ctx.fillRect(x + 8, y - 9, 4, 6);

    this.ctx.save();
    this.ctx.translate(x + 40, y);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.fillStyle = player.getWeaponColor();
    this.ctx.fillRect(-4, -30, 8, 40);
    this.ctx.fillRect(-12, -30, 24, 8);
    this.ctx.restore();

    this.ctx.fillStyle = '#FFD700';
    this.ctx