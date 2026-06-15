import { TOOL_ICONS, FOODS, getSprite, COLORS, Food } from './assets';
import { Pet, PetStats } from './pet';

type Page = 'main' | 'settings';

interface ToolButton {
  id: string;
  x: number;
  y: number;
  radius: number;
  scale: number;
  scaleTarget: number;
}

interface MiniGameStick {
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

interface Slider {
  id: string;
  x: number;
  y: number;
  width: number;
  value: number;
  label: string;
  dragging: boolean;
}

export class UIManager {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  currentPage: Page;
  nextPage: Page | null;
  pageTransition: number;
  transitionDirection: number;
  tools: ToolButton[];
  showFoodMenu: boolean;
  selectedTool: string | null;
  toolAnimationTimers: Record<string, number>;
  miniGameActive: boolean;
  miniGameSticks: MiniGameStick[];
  miniGameTimer: number;
  sliders: Slider[];
  settings: {
    bgColor: string;
    petColor: string;
    decorDensity: number;
  };
  decorPositions: { x: number; y: number; type: number }[];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.currentPage = 'main';
    this.nextPage = null;
    this.pageTransition = 1;
    this.transitionDirection = 1;
    this.tools = [];
    this.showFoodMenu = false;
    this.selectedTool = null;
    this.toolAnimationTimers = {};
    this.miniGameActive = false;
    this.miniGameSticks = [];
    this.miniGameTimer = 0;
    this.settings = {
      bgColor: COLORS.GB_BG,
      petColor: '#ffcc66',
      decorDensity: 0.5
    };
    this.sliders = [
      { id: 'bgColor', x: 60, y: 130, width: 200, value: 0.5, label: '背景色', dragging: false },
      { id: 'petColor', x: 60, y: 210, width: 200, value: 0.3, label: '宠物颜色', dragging: false },
      { id: 'density', x: 60, y: 290, width: 200, value: 0.5, label: '装饰密度', dragging: false }
    ];
    this.initTools();
    this.generateDecor();
  }

  private initTools(): void {
    const toolIds = ['feed', 'clean', 'play', 'sleep', 'settings'];
    const startX = 40;
    const spacing = 56;
    const y = this.height - 40;
    toolIds.forEach((id, i) => {
      this.tools.push({
        id,
        x: startX + i * spacing,
        y,
        radius: 22,
        scale: 1,
        scaleTarget: 1
      });
      this.toolAnimationTimers[id] = 0;
    });
  }

  private generateDecor(): void {
    this.decorPositions = [];
    const count = Math.floor(this.settings.decorDensity * 15);
    for (let i = 0; i < count; i++) {
      this.decorPositions.push({
        x: 20 + Math.random() * (this.width - 40),
        y: 280 + Math.random() * 80,
        type: Math.floor(Math.random() * 3)
      });
    }
  }

  update(deltaTime: number, pet: Pet): void {
    if (this.nextPage) {
      this.pageTransition += deltaTime / 300;
      if (this.pageTransition >= 1) {
        this.pageTransition = 1;
        this.currentPage = this.nextPage;
        this.nextPage = null;
      }
    }

    this.tools.forEach(tool => {
      if (this.toolAnimationTimers[tool.id] > 0) {
        this.toolAnimationTimers[tool.id] -= deltaTime;
        const t = 1 - this.toolAnimationTimers[tool.id] / 200;
        if (t < 0.5) {
          tool.scale = 1 + (t / 0.5) * 0.1;
        } else {
          tool.scale = 1.1 - ((t - 0.5) / 0.5) * 0.1;
        }
      } else {
        tool.scale = 1;
      }
    });

    if (this.miniGameActive) {
      this.miniGameTimer -= deltaTime;
      if (this.miniGameTimer <= 0) {
        this.spawnMiniGameStick();
        this.miniGameTimer = 1500 + Math.random() * 1000;
      }
      this.miniGameSticks.forEach(s => {
        if (s.active) {
          s.y += s.vy * deltaTime;
          if (s.y > this.height - 120) {
            s.active = false;
          }
        }
      });
      this.miniGameSticks = this.miniGameSticks.filter(s => s.active);
      if (this.miniGameSticks.length === 0 && this.miniGameTimer < -3000) {
        this.miniGameActive = false;
      }
    }

    this.sliders.forEach(s => {
      if (s.dragging) {
        this.updateSliderValue(s);
      }
    });
  }

  private spawnMiniGameStick(): void {
    this.miniGameSticks.push({
      x: 40 + Math.random() * (this.width - 80),
      y: -20,
      vy: 0.08 + Math.random() * 0.04,
      active: true
    });
  }

  private lerpColor(c1: string, c2: string, t: number): string {
    const hex = (s: string) => parseInt(s, 16);
    const r = Math.round(hex(c1.slice(1, 3)) + (hex(c2.slice(1, 3)) - hex(c1.slice(1, 3))) * t);
    const g = Math.round(hex(c1.slice(3, 5)) + (hex(c2.slice(3, 5)) - hex(c1.slice(3, 5))) * t);
    const b = Math.round(hex(c1.slice(5, 7)) + (hex(c2.slice(5, 7)) - hex(c1.slice(5, 7))) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private updateSliderValue(slider: Slider): void {
    if (slider.id === 'bgColor') {
      const colors = ['#9bbc0f', '#8bac0f', '#f5deb3', '#87ceeb', '#dda0dd', '#2f4f4f'];
      const idx = Math.floor(slider.value * (colors.length - 1));
      const frac = (slider.value * (colors.length - 1)) % 1;
      this.settings.bgColor = this.lerpColor(colors[idx], colors[Math.min(idx + 1, colors.length - 1)], frac);
    } else if (slider.id === 'petColor') {
      const colors = ['#ffcc66', '#ff9999', '#99ccff', '#ccff99', '#ffccff', '#cccccc'];
      const idx = Math.floor(slider.value * (colors.length - 1));
      const frac = (slider.value * (colors.length - 1)) % 1;
      this.settings.petColor = this.lerpColor(colors[idx], colors[Math.min(idx + 1, colors.length - 1)], frac);
    } else if (slider.id === 'density') {
      this.settings.decorDensity = slider.value;
    }
  }

  render(pet: Pet): void {
    this.ctx.save();

    if (this.nextPage) {
      const t = this.pageTransition;
      this.ctx.save();
      this.ctx.translate(-this.width * t * this.transitionDirection, 0);
      this.renderMainPage(pet);
      this.ctx.restore();

      this.ctx.save();
      this.ctx.translate(this.width * (1 - t) * this.transitionDirection, 0);
      if (this.nextPage === 'settings') {
        this.renderSettingsPage();
      } else {
        this.renderMainPage(pet);
      }
      this.ctx.restore();
    } else {
      if (this.currentPage === 'main') {
        this.renderMainPage(pet);
      } else {
        this.renderSettingsPage();
      }
    }

    this.ctx.restore();
  }

  private renderBackground(): void {
    this.ctx.fillStyle = this.settings.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.globalAlpha = 0.3;
    for (let y = 0; y < this.height; y += 8) {
      for (let x = 0; x < this.width; x += 8) {
        if ((x + y) % 16 === 0) {
          this.ctx.fillRect(x, y, 4, 4);
        }
      }
    }
    this.ctx.globalAlpha = 1;

    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.fillRect(0, this.height - 100, this.width, 4);

    this.decorPositions.forEach(d => {
      this.drawDecor(d.x, d.y, d.type);
    });
  }

  private drawDecor(x: number, y: number, type: number): void {
    this.ctx.fillStyle = COLORS.GB_DARK;
    if (type === 0) {
      for (let i = 0; i < 3; i++) {
        this.ctx.fillRect(x + i * 2, y - 6 + i, 2, 8 - i);
      }
    } else if (type === 1) {
      this.ctx.fillRect(x, y - 4, 8, 2);
      this.ctx.fillRect(x + 2, y - 6, 4, 2);
      this.ctx.fillRect(x + 3, y - 8, 2, 2);
    } else {
      this.ctx.fillRect(x, y, 6, 2);
      this.ctx.fillRect(x + 1, y - 2, 4, 2);
    }
  }

  private renderMainPage(pet: Pet): void {
    this.renderBackground();
    pet.render(this.ctx);
    this.renderStatusBars(pet.getStats());
    this.renderToolbar();

    if (this.showFoodMenu) {
      this.renderFoodMenu();
    }

    if (this.miniGameActive) {
      this.renderMiniGame();
    }
  }

  private renderStatusBars(stats: PetStats): void {
    const barY = 20;
    const spacing = 100;
    const startX = 30;

    this.renderStatusBar(startX, barY, stats.hunger, COLORS.HUNGER_LOW, COLORS.HUNGER_HIGH, '饿');
    this.renderStatusBar(startX + spacing, barY, stats.cleanliness, COLORS.CLEAN_LOW, COLORS.CLEAN_HIGH, '洁');
    this.renderStatusBar(startX + spacing * 2, barY, stats.happiness, COLORS.HAPPY_LOW, COLORS.HAPPY_HIGH, '心');
  }

  private renderStatusBar(x: number, y: number, value: number, lowColor: string, highColor: string, label: string): void {
    const radius = 24;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.globalAlpha = 0.5;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    const gradient = this.ctx.createLinearGradient(x - 16, 0, x + 16, 0);
    gradient.addColorStop(0, lowColor);
    gradient.addColorStop(1, highColor);
    const barHeight = 8;
    const barWidth = 32 * (value / 100);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - 16, y - barHeight / 2, barWidth, barHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y + 4);
    this.ctx.textAlign = 'left';
  }

  private renderToolbar(): void {
    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.fillRect(0, this.height - 80, this.width, 80);

    this.tools.forEach(tool => {
      this.ctx.save();
      this.ctx.translate(tool.x, tool.y);
      this.ctx.scale(tool.scale, tool.scale);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, tool.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.selectedTool === tool.id ? COLORS.GB_LIGHT : COLORS.GB_PALE;
      this.ctx.fill();
      this.ctx.strokeStyle = '#0f380f';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      const icon = TOOL_ICONS[tool.id];
      if (icon) {
        const sprite = getSprite(icon.pixels, '#9bbc0f');
        this.ctx.drawImage(sprite, -8, -8);
      }
      this.ctx.restore();
    });
  }

  private renderFoodMenu(): void {
    const menuX = 20;
    const menuY = 120;
    const menuW = 280;
    const menuH = 200;

    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.globalAlpha = 0.95;
    this.ctx.fillRect(menuX, menuY, menuW, menuH);
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = COLORS.GB_PALE;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(menuX, menuY, menuW, menuH);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('选择食物', this.width / 2, menuY + 24);

    const cellSize = 60;
    const startX = menuX + 25;
    const startY = menuY + 40;

    FOODS.forEach((food, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const fx = startX + col * cellSize;
      const fy = startY + row * cellSize;

      this.ctx.fillStyle = COLORS.GB_LIGHT;
      this.ctx.fillRect(fx, fy, 50, 50);

      const sprite = getSprite(food.pixels, food.color);
      this.ctx.drawImage(sprite, fx + 17, fy + 10);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px "Courier New", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(food.name, fx + 25, fy + 44);
    });
    this.ctx.textAlign = 'left';
  }

  private renderMiniGame(): void {
    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillRect(0, 60, this.width, this.height - 180);
    this.ctx.globalAlpha = 1;

    this.miniGameSticks.forEach(s => {
      if (s.active) {
        this.ctx.fillStyle = '#ff6644';
        this.ctx.fillRect(s.x - 3, s.y, 6, 16);
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(s.x - 2, s.y + 2, 4, 4);
      }
    });

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('点击下落的像素棒!', this.width / 2, 80);
    this.ctx.textAlign = 'left';
  }

  private renderSettingsPage(): void {
    this.ctx.fillStyle = this.settings.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.fillRect(0, 0, this.width, 50);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('设置', this.width / 2, 32);
    this.ctx.textAlign = 'left';

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px "Courier New", monospace';
    this.ctx.fillText('← 返回', 16, 32);

    this.sliders.forEach(s => {
      this.renderSlider(s);
    });

    const previewY = 370;
    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.fillRect(60, previewY, 200, 70);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('预览', this.width / 2, previewY + 20);
    this.ctx.textAlign = 'left';

    this.ctx.fillStyle = this.settings.bgColor;
    this.ctx.fillRect(80, previewY + 30, 40, 30);
    this.ctx.fillStyle = this.settings.petColor;
    this.ctx.fillRect(90, previewY + 35, 20, 20);

    const decorCount = Math.floor(this.settings.decorDensity * 5);
    for (let i = 0; i < decorCount; i++) {
      this.ctx.fillStyle = COLORS.GB_DARK;
      this.ctx.fillRect(140 + i * 12, previewY + 45, 4, 8);
    }
  }

  private renderSlider(slider: Slider): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillText(slider.label, slider.x, slider.y - 10);

    this.ctx.fillStyle = COLORS.GB_DARK;
    this.ctx.fillRect(slider.x, slider.y, slider.width, 8);

    this.ctx.fillStyle = COLORS.GB_LIGHT;
    this.ctx.fillRect(slider.x, slider.y, slider.width * slider.value, 8);

    const handleX = slider.x + slider.width * slider.value;
    this.ctx.fillStyle = COLORS.GB_PALE;
    this.ctx.fillRect(handleX - 6, slider.y - 4, 12, 16);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(handleX - 6, slider.y - 4, 12, 16);
  }

  handleClick(x: number, y: number, pet: Pet): void {
    if (this.nextPage) return;

    if (this.currentPage === 'settings') {
      if (x < 50 && y < 50) {
        this.navigateTo('main');
        return;
      }
      this.sliders.forEach(s => {
        const handleX = s.x + s.width * s.value;
        if (Math.abs(x - handleX) < 12 && Math.abs(y - (s.y + 4)) < 12) {
          s.dragging = true;
        }
      });
      return;
    }

    if (this.showFoodMenu) {
      const food = this.getFoodAt(x, y);
      if (food) {
        pet.feed(food.color, food.pixels, x, y);
        this.showFoodMenu = false;
      } else if (y < 120 || y > 320) {
        this.showFoodMenu = false;
      }
      return;
    }

    if (this.miniGameActive) {
      for (const stick of this.miniGameSticks) {
        if (stick.active && Math.abs(x - stick.x) < 10 && Math.abs(y - stick.y - 8) < 15) {
          stick.active = false;
          pet.playSuccess();
        }
      }
      if (y > this.height - 120) {
        this.miniGameActive = false;
      }
      return;
    }

    for (const tool of this.tools) {
      const dx = x - tool.x;
      const dy = y - tool.y;
      if (dx * dx + dy * dy < tool.radius * tool.radius) {
        this.activateTool(tool.id, pet);
        return;
      }
    }

    if (pet.containsPoint(x, y)) {
      pet.click();
    }
  }

  handleDrag(x: number, y: number): void {
    this.sliders.forEach(s => {
      if (s.dragging) {
        s.value = Math.max(0, Math.min(1, (x - s.x) / s.width));
        this.updateSliderValue(s);
        if (s.id === 'density') {
          this.generateDecor();
        }
      }
    });
  }

  handleRelease(): void {
    this.sliders.forEach(s => {
      s.dragging = false;
    });
  }

  private getFoodAt(x: number, y: number): Food | null {
    const menuX = 20;
    const menuY = 120;
    if (x < menuX || x > menuX + 280 || y < menuY || y > menuY + 200) return null;

    const cellSize = 60;
    const startX = menuX + 25;
    const startY = menuY + 40;

    for (let i = 0; i < FOODS.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const fx = startX + col * cellSize;
      const fy = startY + row * cellSize;
      if (x >= fx && x <= fx + 50 && y >= fy && y <= fy + 50) {
        return FOODS[i];
      }
    }
    return null;
  }

  private activateTool(toolId: string, pet: Pet): void {
    this.selectedTool = toolId;
    this.toolAnimationTimers[toolId] = 200;

    switch (toolId) {
      case 'feed':
        this.showFoodMenu = true;
        this.miniGameActive = false;
        break;
      case 'clean':
        pet.startCleanEffect();
        this.showFoodMenu = false;
        this.miniGameActive = false;
        break;
      case 'play':
        this.miniGameActive = true;
        this.miniGameTimer = 500;
        this.showFoodMenu = false;
        break;
      case 'sleep':
        pet.sleep();
        this.showFoodMenu = false;
        this.miniGameActive = false;
        break;
      case 'settings':
        this.navigateTo('settings');
        this.showFoodMenu = false;
        this.miniGameActive = false;
        break;
    }

    setTimeout(() => {
      this.selectedTool = null;
    }, 200);
  }

  private navigateTo(page: Page): void {
    if (page === this.currentPage) return;
    this.nextPage = page;
    this.pageTransition = 0;
    this.transitionDirection = page === 'settings' ? 1 : -1;
  }

  getSettings(): { bgColor: string; petColor: string } {
    return {
      bgColor: this.settings.bgColor,
      petColor: this.settings.petColor
    };
  }
}
