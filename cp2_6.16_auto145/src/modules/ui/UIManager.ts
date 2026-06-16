import { PlayerState, Equipment, GameStats, RARITY_COLORS, TILE_SIZE, COLORS } from '../../types/gameTypes';
import { v4 as uuidv4 } from 'uuid';

interface UIButton {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  hovered: boolean;
  pressed: boolean;
  visible: boolean;
  onClick: () => void;
}

interface EquipmentTooltip {
  equipment: Equipment;
  x: number;
  y: number;
  compareTo?: Equipment | null;
  visible: boolean;
}

export class UIManager {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private buttons: UIButton[] = [];
  private pageTransition: { active: boolean; progress: number; direction: 'in' | 'out' } = { active: false, progress: 0, direction: 'in' };
  private tooltip: EquipmentTooltip | null = null;
  private equipmentPanel: { visible: boolean; equipment: Equipment | null; x: number; y: number } = { visible: false, equipment: null, x: 0, y: 0 };
  private isNarrowScreen: boolean = false;
  private mobileEquipmentPanelOpen: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
    this.isNarrowScreen = window.innerWidth < 1024;
  }

  public startPageTransition(): void {
    this.pageTransition = { active: true, progress: 0, direction: 'out' };
  }

  public endPageTransition(): void {
    this.pageTransition = { active: true, progress: 0, direction: 'in' };
  }

  public update(deltaTime: number): void {
    if (this.pageTransition.active) {
      const speed = 0.3 / deltaTime * 16;
      if (this.pageTransition.direction === 'out') {
        this.pageTransition.progress = Math.min(1, this.pageTransition.progress + speed);
        if (this.pageTransition.progress >= 1) {
          this.pageTransition.direction = 'in';
        }
      } else {
        this.pageTransition.progress = Math.max(0, this.pageTransition.progress - speed);
        if (this.pageTransition.progress <= 0) {
          this.pageTransition.active = false;
        }
      }
    }
  }

  public drawMenu(now: number, onStart: () => void, onLeaderboard: () => void): void {
    this.buttons = [];
    
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, this.canvas.width * 0.7);
    gradient.addColorStop(0, 'rgba(58, 42, 74, 0.5)');
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    const titleScale = 1 + Math.sin(now / 500) * 0.02;
    this.ctx.translate(cx, cy - 120);
    this.ctx.scale(titleScale, titleScale);
    
    this.ctx.font = 'bold 64px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.ctx.strokeStyle = '#A855F7';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText('RogueCraft', 0, 0);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText('RogueCraft', 0, 0);
    
    this.ctx.font = '18px system-ui';
    this.ctx.fillStyle = '#9CA3AF';
    this.ctx.fillText('地牢探索 · 无尽冒险', 0, 45);
    
    this.ctx.restore();

    const btnWidth = 240;
    const btnHeight = 56;
    const btnSpacing = 20;

    this.createButton(cx - btnWidth / 2, cy - 20, btnWidth, btnHeight, '开始游戏', onStart);
    this.createButton(cx - btnWidth / 2, cy + btnHeight + btnSpacing - 20, btnWidth, btnHeight, '排行榜', onLeaderboard);

    this.drawButtons();

    this.ctx.font = '14px system-ui';
    this.ctx.fillStyle = '#6B7280';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('WASD 移动 | 空格 攻击 | E 交互 | 点击 攻击', cx, this.canvas.height - 40);

    this.drawPageTransition();
  }

  public drawGameUI(player: PlayerState, now: number): void {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.drawHealthBar(player, 20, h - 80);
    this.drawStats(player, w - 20, 20);
    this.drawPortalIcon(w / 2, 20, now);

    if (this.isNarrowScreen) {
      this.drawMobileEquipmentToggle(w - 70, h - 70);
      if (this.mobileEquipmentPanelOpen) {
        this.drawEquipmentPanel(w / 2 - 140, h / 2 - 180, player);
      }
    } else {
      this.drawEquipmentPanel(w - 300, 100, player);
      this.drawControlsHint(20, 20);
    }

    const nearbyChest = this.getNearbyChestHint();
    if (nearbyChest) {
      this.drawInteractHint(w / 2, h - 120, '按 E 开启宝箱');
    } else if (this.isNearPortal(player)) {
      this.drawInteractHint(w / 2, h - 120, '按 E 进入下一层');
    }

    if (this.equipmentPanel.visible && this.equipmentPanel.equipment) {
      this.drawLootPanel(this.equipmentPanel.x, this.equipmentPanel.y, this.equipmentPanel.equipment, now);
    }

    if (this.tooltip?.visible) {
      this.drawEquipmentTooltip(this.tooltip);
    }

    this.drawButtons();
    this.drawPageTransition();
  }

  private drawHealthBar(player: PlayerState, x: number, y: number): void {
    const width = 240;
    const height = 32;
    const percent = player.entity.hp / player.entity.maxHp;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.roundRect(x - 2, y - 2, width + 4, height + 4, 12);
    this.ctx.fill();

    const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
    if (percent > 0.6) {
      gradient.addColorStop(0, '#22C55E');
      gradient.addColorStop(1, '#16A34A');
    } else if (percent > 0.3) {
      gradient.addColorStop(0, '#EAB308');
      gradient.addColorStop(1, '#CA8A04');
    } else {
      gradient.addColorStop(0, '#EF4444');
      gradient.addColorStop(1, '#DC2626');
    }

    this.ctx.fillStyle = '#1F2937';
    this.roundRect(x, y, width, height, 10);
    this.ctx.fill();

    this.ctx.fillStyle = gradient;
    this.roundRect(x, y, width * percent, height, 10);
    this.ctx.fill();

    const rainbowGradient = this.ctx.createLinearGradient(x, y, x + width * percent, y);
    rainbowGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    rainbowGradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.3)');
    rainbowGradient.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
    this.ctx.fillStyle = rainbowGradient;
    this.roundRect(x, y, width * percent, height, 10);
    this.ctx.fill();

    this.ctx.font = 'bold 14px system-ui';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${Math.ceil(player.entity.hp)} / ${player.entity.maxHp}`, x + width / 2, y + height / 2);
  }

  private drawStats(player: PlayerState, x: number, y: number): void {
    const panelWidth = 160;
    const panelHeight = 80;

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.85)';
    this.roundRect(x - panelWidth, y, panelWidth, panelHeight, 10);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.roundRect(x - panelWidth, y, panelWidth, panelHeight, 10);
    this.ctx.stroke();

    this.ctx.font = 'bold 16px system-ui';
    this.ctx.fillStyle = '#A855F7';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`第 ${player.floor} 层`, x - 15, y + 12);

    this.ctx.font = '18px system-ui';
    this.ctx.fillStyle = '#FFD700';
    const iconX = x - 15;
    const iconY = y + 45;
    
    this.ctx.beginPath();
    this.ctx.arc(iconX - 60, iconY + 10, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fill();
    this.ctx.strokeStyle = '#DAA520';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`${player.gold}`, iconX, iconY + 5);
  }

  private drawPortalIcon(cx: number, y: number, now: number): void {
    const size = 28;
    
    this.ctx.save();
    this.ctx.translate(cx, y + size / 2);

    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const progress = ((now / 800 + i * 0.3) % 1);
      const radius = 4 + progress * (size / 2 - 4);
      const alpha = 1 - progress;
      
      this.ctx.beginPath();
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2 + now / 400 + i;
        const r = radius + Math.sin(angle * 3 + now / 150) * 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (j === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
      this.ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.25})`;
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(192, 132, 252, ${alpha * 0.7})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 3);
    centerGradient.addColorStop(0, 'rgba(216, 180, 254, 0.9)');
    centerGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)');
    centerGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    this.ctx.fillStyle = centerGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    this.ctx.font = '12px system-ui';
    this.ctx.fillStyle = '#A855F7';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('传送门', cx, y + size + 18);
  }

  private drawEquipmentPanel(x: number, y: number, player: PlayerState): void {
    const panelWidth = 280;
    const panelHeight = 320;
    const slotSize = 60;
    const spacing = 15;

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.9)';
    this.roundRect(x, y, panelWidth, panelHeight, 12);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    this.ctx.lineWidth = 2;
    this.roundRect(x, y, panelWidth, panelHeight, 12);
    this.ctx.stroke();

    this.ctx.font = 'bold 18px system-ui';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('装备栏', x + panelWidth / 2, y + 15);

    const weaponX = x + 40;
    const armorX = x + panelWidth - 40 - slotSize;
    const slotY = y + 55;

    this.drawEquipmentSlot(weaponX, slotY, slotSize, '武器', player.equippedWeapon);
    this.drawEquipmentSlot(armorX, slotY, slotSize, '防具', player.equippedArmor);

    if (player.equippedWeapon) {
      this.drawEquipmentStats(x + 20, slotY + slotSize + 20, player.equippedWeapon);
    }
    if (player.equippedArmor) {
      this.drawEquipmentStats(x + 20, slotY + slotSize + 90, player.equippedArmor);
    }
  }

  private drawEquipmentSlot(x: number, y: number, size: number, label: string, equipment: Equipment | null): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.roundRect(x, y, size, size, 10);
    this.ctx.fill();

    if (equipment) {
      this.ctx.strokeStyle = RARITY_COLORS[equipment.rarity];
      this.ctx.lineWidth = 3;
      this.roundRect(x, y, size, size, 10);
      this.ctx.stroke();

      const glowGradient = this.ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size);
      glowGradient.addColorStop(0, RARITY_COLORS[equipment.rarity] + '30');
      glowGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glowGradient;
      this.roundRect(x - 5, y - 5, size + 10, size + 10, 12);
      this.ctx.fill();

      this.drawEquipmentIcon(x + size / 2, y + size / 2, equipment.type);

      this.ctx.font = 'bold 11px system-ui';
      this.ctx.fillStyle = RARITY_COLORS[equipment.rarity];
      this.ctx.textAlign = 'center';
      this.ctx.fillText(equipment.name, x + size / 2, y + size + 15);
    } else {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 2;
      this.roundRect(x, y, size, size, 10);
      this.ctx.stroke();

      this.ctx.font = '24px system-ui';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('+', x + size / 2, y + size / 2);
    }

    this.ctx.font = '12px system-ui';
    this.ctx.fillStyle = '#9CA3AF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + size / 2, y - 12);
  }

  private drawEquipmentIcon(cx: number, cy: number, type: string): void {
    this.ctx.save();
    this.ctx.translate(cx, cy);

    switch (type) {
      case 'SWORD':
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(-2, -18, 4, 28);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-8, 8, 16, 4);
        break;
      case 'AXE':
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-2, -12, 4, 22);
        this.ctx.fillStyle = '#808080';
        this.ctx.fillRect(-12, -15, 14, 10);
        break;
      case 'BOW':
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15, -Math.PI / 2, Math.PI / 2);
        this.ctx.stroke();
        break;
      case 'HELMET':
        this.ctx.fillStyle = '#708090';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 14, Math.PI, 0);
        this.ctx.fill();
        break;
      case 'CHESTPLATE':
        this.ctx.fillStyle = '#708090';
        this.ctx.fillRect(-12, -12, 24, 24);
        this.ctx.fillStyle = '#556B7A';
        this.ctx.fillRect(-2, -10, 4, 20);
        break;
      case 'BOOTS':
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-10, 2, 8, 10);
        this.ctx.fillRect(2, 2, 8, 10);
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(-12, 8, 12, 4);
        this.ctx.fillRect(0, 8, 12, 4);
        break;
    }

    this.ctx.restore();
  }

  private drawEquipmentStats(x: number, y: number, equipment: Equipment): void {
    this.ctx.font = '12px system-ui';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#D1D5DB';

    const stats: { label: string; value: number }[] = [];
    if (equipment.attack > 0) stats.push({ label: '攻击力', value: equipment.attack });
    if (equipment.defense > 0) stats.push({ label: '防御力', value: equipment.defense });
    if (equipment.attackSpeed > 0) stats.push({ label: '攻速', value: equipment.attackSpeed });
    if (equipment.range > 0) stats.push({ label: '射程', value: equipment.range });
    if (equipment.moveSpeed !== 0) stats.push({ label: '移速', value: equipment.moveSpeed });

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      this.ctx.fillStyle = '#9CA3AF';
      this.ctx.fillText(`${stat.label}:`, x, y + i * 20);
      this.ctx.fillStyle = stat.value > 0 ? '#22C55E' : '#EF4444';
      this.ctx.fillText(`${stat.value > 0 ? '+' : ''}${stat.value}`, x + 80, y + i * 20);
    }
  }

  private drawInteractHint(cx: number, y: number, text: string): void {
    const padding = 15;
    this.ctx.font = '16px system-ui';
    const textWidth = this.ctx.measureText(text).width;
    
    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.9)';
    this.roundRect(cx - textWidth / 2 - padding, y - 20, textWidth + padding * 2, 40, 10);
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    this.roundRect(cx - textWidth / 2 - padding, y - 20, textWidth + padding * 2, 40, 10);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, cx, y);
  }

  private drawControlsHint(x: number, y: number): void {
    const width = 200;
    const height = 100;

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.7)';
    this.roundRect(x, y, width, height, 10);
    this.ctx.fill();

    this.ctx.font = '12px system-ui';
    this.ctx.fillStyle = '#9CA3AF';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const controls = [
      'WASD - 移动',
      '空格 - 攻击',
      'E - 交互',
      'ESC - 暂停'
    ];

    controls.forEach((text, i) => {
      this.ctx.fillText(text, x + 15, y + 12 + i * 20);
    });
  }

  private drawMobileEquipmentToggle(x: number, y: number): void {
    const size = 56;

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.font = '24px system-ui';
    this.ctx.fillStyle = '#A855F7';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('⚔', x, y);
  }

  public drawGameOver(player: PlayerState, onRestart: () => void, onMenu: () => void): void {
    this.buttons = [];

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const cardWidth = 400;
    const cardHeight = 450;

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.95)';
    this.roundRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 16);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    this.ctx.lineWidth = 2;
    this.roundRect(cx - cardWidth / 2, cy - cardHeight / 2, cardWidth, cardHeight, 16);
    this.ctx.stroke();

    this.ctx.font = 'bold 36px system-ui';
    this.ctx.fillStyle = '#EF4444';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('游戏结束', cx, cy - cardHeight / 2 + 30);

    const stats = [
      { label: '存活层数', value: player.floor, color: '#A855F7' },
      { label: '击败怪物', value: player.monstersKilled, color: '#22C55E' },
      { label: '获得金币', value: player.gold, color: '#FFD700' },
      { label: '最高伤害', value: player.maxDamage, color: '#EF4444' }
    ];

    stats.forEach((stat, i) => {
      const statY = cy - cardHeight / 2 + 100 + i * 55;
      
      this.ctx.font = '16px system-ui';
      this.ctx.fillStyle = '#9CA3AF';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(stat.label, cx - cardWidth / 2 + 40, statY);

      this.ctx.font = 'bold 24px system-ui';
      this.ctx.fillStyle = stat.color;
      this.ctx.textAlign = 'right';
      this.ctx.fillText(stat.value.toString(), cx + cardWidth / 2 - 40, statY - 5);
    });

    const btnWidth = 160;
    const btnHeight = 48;
    const btnY = cy + cardHeight / 2 - 90;

    this.createButton(cx - btnWidth - 15, btnY, btnWidth, btnHeight, '重新开始', onRestart);
    this.createButton(cx + 15, btnY, btnWidth, btnHeight, '返回菜单', onMenu);

    this.drawButtons();
  }

  public drawLeaderboard(stats: GameStats[], onBack: () => void, onReset: () => void): void {
    this.buttons = [];

    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const tableWidth = 600;
    const tableHeight = 500;

    this.ctx.font = 'bold 32px system-ui';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('排行榜', cx, cy - tableHeight / 2 - 60);

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.95)';
    this.roundRect(cx - tableWidth / 2, cy - tableHeight / 2, tableWidth, tableHeight, 12);
    this.ctx.fill();

    const headers = ['排名', '层数', '怪物', '金币', '最高伤害', '日期'];
    const colWidths = [80, 100, 100, 100, 120, 120];
    const headerY = cy - tableHeight / 2 + 20;
    const rowHeight = 45;

    this.ctx.font = 'bold 16px system-ui';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let colX = cx - tableWidth / 2;
    headers.forEach((header, i) => {
      this.ctx.fillText(header, colX + colWidths[i] / 2, headerY + 15);
      colX += colWidths[i];
    });

    this.ctx.strokeStyle = '#A855F7';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - tableWidth / 2 + 20, headerY + 40);
    this.ctx.lineTo(cx + tableWidth / 2 - 20, headerY + 40);
    this.ctx.stroke();

    const sortedStats = [...stats].sort((a, b) => b.floor - a.floor || b.monstersKilled - a.monstersKilled).slice(0, 10);

    sortedStats.forEach((stat, i) => {
      const rowY = headerY + 50 + i * rowHeight;
      
      if (i % 2 === 0) {
        this.ctx.fillStyle = 'rgba(127, 29, 29, 0.3)';
      } else {
        this.ctx.fillStyle = 'rgba(88, 28, 135, 0.3)';
      }
      this.ctx.fillRect(cx - tableWidth / 2 + 10, rowY - 18, tableWidth - 20, rowHeight - 5);

      const values = [
        `#${i + 1}`,
        stat.floor.toString(),
        stat.monstersKilled.toString(),
        stat.gold.toString(),
        stat.maxDamage.toString(),
        new Date(stat.timestamp).toLocaleDateString()
      ];

      colX = cx - tableWidth / 2;
      values.forEach((value, j) => {
        this.ctx.font = '14px system-ui';
        this.ctx.fillStyle = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#D1D5DB';
        this.ctx.fillText(value, colX + colWidths[j] / 2, rowY);
        colX += colWidths[j];
      });
    });

    if (sortedStats.length === 0) {
      this.ctx.font = '18px system-ui';
      this.ctx.fillStyle = '#6B7280';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('暂无记录，快去冒险吧！', cx, cy);
    }

    const btnWidth = 140;
    const btnHeight = 44;
    const btnY = cy + tableHeight / 2 - 65;

    this.createButton(cx - btnWidth - 15, btnY, btnWidth, btnHeight, '返回', onBack);
    this.createButton(cx + 15, btnY, btnWidth, btnHeight, '重置数据', onReset);

    this.drawButtons();
    this.drawPageTransition();
  }

  public drawPauseMenu(onResume: () => void, onMenu: () => void): void {
    this.buttons = [];

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    this.ctx.font = 'bold 48px system-ui';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('已暂停', cx, cy - 80);

    const btnWidth = 200;
    const btnHeight = 52;
    const spacing = 20;

    this.createButton(cx - btnWidth / 2, cy - 10, btnWidth, btnHeight, '继续游戏', onResume);
    this.createButton(cx - btnWidth / 2, cy + btnHeight + spacing - 10, btnWidth, btnHeight, '返回菜单', onMenu);

    this.drawButtons();
  }

  private drawLootPanel(x: number, y: number, equipment: Equipment, now: number): void {
    const panelWidth = 320;
    const panelHeight = 280;

    this.ctx.fillStyle = 'rgba(26, 18, 32, 0.95)';
    this.roundRect(x, y, panelWidth, panelHeight, 16);
    this.ctx.fill();

    this.ctx.strokeStyle = RARITY_COLORS[equipment.rarity];
    this.ctx.lineWidth = 3;
    this.roundRect(x, y, panelWidth, panelHeight, 16);
    this.ctx.stroke();

    const glowIntensity = 0.3 + 0.2 * Math.sin(now / 300);
    const glowGradient = this.ctx.createRadialGradient(x + panelWidth / 2, y + 60, 0, x + panelWidth / 2, y + 60, 80);
    glowGradient.addColorStop(0, RARITY_COLORS[equipment.rarity] + Math.floor(glowIntensity * 255).toString(16).padStart(2, '0'));
