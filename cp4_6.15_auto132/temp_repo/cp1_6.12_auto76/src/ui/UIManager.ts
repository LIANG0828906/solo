import { SceneManager, ElementType, SceneStats } from '../renderer/SceneManager';
import { Toolbar } from './Toolbar';

export class UIManager {
  private sceneManager: SceneManager;
  private toolbar: Toolbar;

  private buildingCountEl: HTMLElement;
  private floorCountEl: HTMLElement;
  private treeCountEl: HTMLElement;
  private lampCountEl: HTMLElement;

  private dayNightBtn: HTMLElement;
  private dayNightIcon: HTMLElement;
  private dayNightText: HTMLElement;

  private forbiddenIcon: HTMLElement;
  private canvas: HTMLCanvasElement;

  private selectedTool: ElementType | null = null;
  private isNight: boolean = false;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.canvas = sceneManager.getCanvas();

    const toolContainer = document.getElementById('toolList');
    if (!toolContainer) throw new Error('Tool list container not found');
    this.toolbar = new Toolbar(toolContainer);

    this.buildingCountEl = document.getElementById('buildingCount')!;
    this.floorCountEl = document.getElementById('floorCount')!;
    this.treeCountEl = document.getElementById('treeCount')!;
    this.lampCountEl = document.getElementById('lampCount')!;

    this.dayNightBtn = document.getElementById('toggleDayNight')!;
    this.dayNightIcon = document.getElementById('dayNightIcon')!;
    this.dayNightText = document.getElementById('dayNightText')!;

    this.forbiddenIcon = document.getElementById('forbiddenIcon')!;

    this.bindEvents();
    this.setupStatsCallback();
  }

  private bindEvents(): void {
    this.toolbar.onSelect((type) => {
      this.selectedTool = type;
      if (!type) {
        this.sceneManager.hidePreview();
      }
    });

    this.dayNightBtn.addEventListener('click', () => {
      this.isNight = this.sceneManager.toggleDayNight();
      this.updateDayNightButton();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.selectedTool) return;

      const pos = this.sceneManager.getGroundPosition(e.clientX, e.clientY);
      if (pos) {
        this.sceneManager.showPreview(this.selectedTool, pos);
      } else {
        this.sceneManager.hidePreview();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.sceneManager.hidePreview();
      this.hideForbiddenIcon();
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.selectedTool) return;
      if (e.button !== 0) return;

      const pos = this.sceneManager.getGroundPosition(e.clientX, e.clientY);
      if (!pos) return;

      const snapped = this.sceneManager.snapToGrid(pos);
      const success = this.sceneManager.placeElement(this.selectedTool, snapped);

      if (!success) {
        this.showForbiddenIcon(e.clientX, e.clientY);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteAtMouse();
      }
      if (e.key === 'Escape') {
        this.selectedTool = null;
        this.toolbar.onSelect((type) => { this.selectedTool = type; });
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(b => b.classList.remove('active'));
        this.sceneManager.hidePreview();
      }
    });
  }

  private deleteAtMouse(): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const pos = this.sceneManager.getGroundPosition(centerX, centerY);
    if (pos) {
      const snapped = this.sceneManager.snapToGrid(pos);
      this.sceneManager.removeElement(snapped);
    }
  }

  private showForbiddenIcon(x: number, y: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.forbiddenIcon.style.left = `${x - rect.left}px`;
    this.forbiddenIcon.style.top = `${y - rect.top}px`;
    this.forbiddenIcon.classList.remove('hidden');

    setTimeout(() => {
      this.hideForbiddenIcon();
    }, 500);
  }

  private hideForbiddenIcon(): void {
    this.forbiddenIcon.classList.add('hidden');
  }

  private setupStatsCallback(): void {
    this.sceneManager.setStatsCallback((stats: SceneStats) => {
      this.updateStats(stats);
    });
  }

  private updateStats(stats: SceneStats): void {
    this.buildingCountEl.textContent = stats.buildingCount.toString();
    this.floorCountEl.textContent = stats.floorCount.toString();
    this.treeCountEl.textContent = stats.treeCount.toString();
    this.lampCountEl.textContent = stats.lampCount.toString();
  }

  private updateDayNightButton(): void {
    if (this.isNight) {
      this.dayNightIcon.textContent = '☀️';
      this.dayNightText.textContent = '日间模式';
    } else {
      this.dayNightIcon.textContent = '🌙';
      this.dayNightText.textContent = '夜间模式';
    }
  }
}
