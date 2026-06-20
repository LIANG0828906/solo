import { ObstacleType, OBSTACLE_PRESETS } from '../physics/bodies';

export type GameMode = 'build' | 'launch' | 'aiming' | 'flying' | 'result';

export class UIPanels {
  private selectedType: ObstacleType | null = null;
  private onPlaceCallback: ((type: ObstacleType, x: number, y: number) => void) | null = null;
  private onRotateCallback: ((id: number, deltaAngle: number) => void) | null = null;
  private onDeleteCallback: ((id: number) => void) | null = null;
  private onNextLevelCallback: (() => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onLaunchClickCallback: (() => void) | null = null;
  private contextMenuTargetId: number = -1;

  init(): void {
    this.buildToolGrid();
    this.bindLaunchButton();
    this.bindContextMenu();
    this.bindResultPanel();
  }

  private buildToolGrid(): void {
    const grid = document.getElementById('tool-grid');
    if (!grid) return;

    const types: ObstacleType[] = ['woodbox', 'ironblock', 'rubberball', 'springboard', 'spiketrap'];

    types.forEach(type => {
      const preset = OBSTACLE_PRESETS[type];
      const item = document.createElement('div');
      item.className = 'tool-item';
      item.dataset.type = type;

      const iconCanvas = document.createElement('canvas');
      iconCanvas.width = 96;
      iconCanvas.height = 96;
      this.drawIcon(iconCanvas, type, preset);

      const label = document.createElement('span');
      label.textContent = preset.label;

      item.appendChild(iconCanvas);
      item.appendChild(label);

      item.addEventListener('click', () => {
        document.querySelectorAll('.tool-item').forEach(el => el.classList.remove('selected'));
        if (this.selectedType === type) {
          this.selectedType = null;
        } else {
          this.selectedType = type;
          item.classList.add('selected');
        }
      });

      grid.appendChild(item);
    });
  }

  private drawIcon(canvas: HTMLCanvasElement, type: ObstacleType, preset: typeof OBSTACLE_PRESETS[ObstacleType]): void {
    const ctx = canvas.getContext('2d')!;
    const size = 96;

    if (type === 'rubberball') {
      const gradient = ctx.createRadialGradient(size / 2, size / 2 - 8, 4, size / 2, size / 2, 36);
      gradient.addColorStop(0, '#4ade80');
      gradient.addColorStop(1, '#16a34a');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (type === 'spiketrap') {
      const w = 70;
      const h = 35;
      const spikes = 5;
      const spikeWidth = w / spikes;
      const ox = (size - w) / 2;
      const oy = (size - h) / 2;

      ctx.fillStyle = '#991b1b';
      ctx.fillRect(ox, oy + h / 2, w, h / 2);

      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < spikes; i++) {
        const sx = ox + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(sx, oy + h / 2);
        ctx.lineTo(sx + spikeWidth / 2, oy);
        ctx.lineTo(sx + spikeWidth, oy + h / 2);
        ctx.fill();
      }
    } else if (type === 'springboard') {
      const w = 80;
      const h = 20;
      const ox = (size - w) / 2;
      const oy = (size - h) / 2;

      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(ox, oy, w, h);

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      const springCount = 6;
      const segW = w / springCount;
      for (let i = 0; i < springCount; i++) {
        const sx = ox + i * segW;
        ctx.beginPath();
        ctx.moveTo(sx, oy + h);
        ctx.lineTo(sx + segW / 2, oy);
        ctx.lineTo(sx + segW, oy + h);
        ctx.stroke();
      }
    } else {
      const w = type === 'woodbox' ? 50 : 50;
      const h = type === 'woodbox' ? 50 : 50;
      const ox = (size - w) / 2;
      const oy = (size - h) / 2;

      ctx.fillStyle = preset.color;
      ctx.fillRect(ox, oy, w, h);
      ctx.strokeStyle = preset.strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(ox, oy, w, h);

      if (type === 'woodbox') {
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + w, oy + h);
        ctx.moveTo(ox + w, oy);
        ctx.lineTo(ox, oy + h);
        ctx.stroke();
      } else if (type === 'ironblock') {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(ox + 5, oy + 5, w - 10, h / 3);
      }
    }
  }

  private bindLaunchButton(): void {
    const btn = document.getElementById('launch-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (this.onLaunchClickCallback) {
        this.onLaunchClickCallback();
      }
    });
  }

  private bindContextMenu(): void {
    const menu = document.getElementById('context-menu');
    const deleteItem = document.getElementById('menu-delete');
    const rotateCw = document.getElementById('menu-rotate-cw');
    const rotateCcw = document.getElementById('menu-rotate-ccw');

    if (!menu || !deleteItem || !rotateCw || !rotateCcw) return;

    deleteItem.addEventListener('click', () => {
      if (this.onDeleteCallback && this.contextMenuTargetId >= 0) {
        this.onDeleteCallback(this.contextMenuTargetId);
      }
      this.hideContextMenu();
    });

    rotateCw.addEventListener('click', () => {
      if (this.onRotateCallback && this.contextMenuTargetId >= 0) {
        this.onRotateCallback(this.contextMenuTargetId, Math.PI / 12);
      }
      this.hideContextMenu();
    });

    rotateCcw.addEventListener('click', () => {
      if (this.onRotateCallback && this.contextMenuTargetId >= 0) {
        this.onRotateCallback(this.contextMenuTargetId, -Math.PI / 12);
      }
      this.hideContextMenu();
    });

    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('#context-menu')) {
        this.hideContextMenu();
      }
    });
  }

  private bindResultPanel(): void {
    const nextBtn = document.getElementById('next-level-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.onNextLevelCallback) {
          this.onNextLevelCallback();
        }
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (this.onRestartCallback) {
          this.onRestartCallback();
        }
      });
    }
  }

  getSelectedType(): ObstacleType | null {
    return this.selectedType;
  }

  clearSelection(): void {
    this.selectedType = null;
    document.querySelectorAll('.tool-item').forEach(el => el.classList.remove('selected'));
  }

  onPlace(callback: (type: ObstacleType, x: number, y: number) => void): void {
    this.onPlaceCallback = callback;
  }

  triggerPlace(type: ObstacleType, x: number, y: number): void {
    if (this.onPlaceCallback) {
      this.onPlaceCallback(type, x, y);
    }
  }

  onRotate(callback: (id: number, deltaAngle: number) => void): void {
    this.onRotateCallback = callback;
  }

  onDelete(callback: (id: number) => void): void {
    this.onDeleteCallback = callback;
  }

  onLaunchClick(callback: () => void): void {
    this.onLaunchClickCallback = callback;
  }

  onNextLevel(callback: () => void): void {
    this.onNextLevelCallback = callback;
  }

  onRestart(callback: () => void): void {
    this.onRestartCallback = callback;
  }

  showContextMenu(x: number, y: number, bodyId: number): void {
    const menu = document.getElementById('context-menu');
    if (!menu) return;
    this.contextMenuTargetId = bodyId;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
  }

  hideContextMenu(): void {
    const menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';
    this.contextMenuTargetId = -1;
  }

  showPowerBar(): void {
    const container = document.getElementById('power-bar-container');
    if (container) container.style.display = 'block';
  }

  hidePowerBar(): void {
    const container = document.getElementById('power-bar-container');
    if (container) container.style.display = 'none';
    const fill = document.getElementById('power-bar-fill');
    if (fill) fill.style.width = '0%';
  }

  updatePowerBar(power: number): void {
    const fill = document.getElementById('power-bar-fill');
    if (fill) fill.style.width = (power * 100) + '%';
  }

  showResultPanel(stars: number, score: number, hasNext: boolean): void {
    const panel = document.getElementById('result-panel');
    const starsEl = document.getElementById('result-stars');
    const scoreEl = document.getElementById('result-score');
    const nextBtn = document.getElementById('next-level-btn');

    if (!panel || !starsEl || !scoreEl) return;

    let starsHtml = '';
    for (let i = 0; i < 3; i++) {
      if (i < stars) {
        starsHtml += '<span class="star-on">★</span>';
      } else {
        starsHtml += '<span class="star-off">★</span>';
      }
    }
    starsEl.innerHTML = starsHtml;
    scoreEl.innerHTML = `得分: <span>${score}</span>`;

    if (nextBtn) {
      nextBtn.style.display = hasNext ? 'inline-block' : 'none';
    }

    panel.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add('show');
      });
    });
  }

  hideResultPanel(): void {
    const panel = document.getElementById('result-panel');
    if (panel) {
      panel.classList.remove('show');
      setTimeout(() => {
        panel.style.display = 'none';
      }, 400);
    }
  }

  setLaunchMode(active: boolean): void {
    const btn = document.getElementById('launch-btn');
    if (btn) {
      if (active) {
        btn.classList.add('launching');
      } else {
        btn.classList.remove('launching');
      }
    }
  }

  updateLevelInfo(name: string, ballCount: number, targetsHit: number, totalTargets: number): void {
    const nameEl = document.getElementById('level-name');
    const ballEl = document.getElementById('ball-count');
    const targetsEl = document.getElementById('targets-info');

    if (nameEl) nameEl.textContent = name;
    if (ballEl) ballEl.textContent = String(ballCount);
    if (targetsEl) targetsEl.textContent = `目标: ${targetsHit}/${totalTargets}`;
  }

  setHintVisible(visible: boolean): void {
    const hint = document.getElementById('hint-text');
    if (hint) hint.style.display = visible ? 'block' : 'none';
  }
}
