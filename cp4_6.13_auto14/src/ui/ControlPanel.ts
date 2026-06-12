import { SceneManager } from '../scene/SceneManager';
import { DisplayMode } from '../scene/MoleculeBuilder';
import { ScreenshotService } from '../services/ScreenshotService';
import { getMoleculeList, getMolecule, MOLECULES, getReaction } from '../data/MoleculeData';

type AppMode = 'browse' | 'reaction';

export class ControlPanel {
  private container: HTMLElement;
  private selectorContainer: HTMLElement;
  private reactionInfo: HTMLElement;
  private mobileToggle: HTMLElement;
  private sceneManager: SceneManager;
  private appMode: AppMode = 'browse';
  private selectedMolecule: string = 'H2O';
  private selectedReactants: [string | null, string | null] = [null, null];
  private drawerOpen: boolean = false;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.container = document.getElementById('control-panel')!;
    this.selectorContainer = document.getElementById('molecule-selector')!;
    this.reactionInfo = document.getElementById('reaction-info')!;
    this.mobileToggle = document.getElementById('mobile-toggle')!;

    this.init();
  }

  private init(): void {
    this.buildMoleculeSelector();
    this.buildControlPanel();
    this.bindEvents();
    this.setupResponsive();
  }

  private buildMoleculeSelector(): void {
    const molecules = getMoleculeList();

    this.selectorContainer.innerHTML = `
      <div class="selector-header">
        <div class="selector-title">分子选择</div>
        <div class="mode-tabs">
          <button class="mode-tab active" data-mode="browse">浏览</button>
          <button class="mode-tab" data-mode="reaction">反应</button>
        </div>
      </div>
      <div class="molecule-list" id="molecule-list">
        ${molecules
          .map(
            (name) => `
          <div class="molecule-item ${name === this.selectedMolecule ? 'active' : ''}" 
               data-molecule="${name}">
            <span class="molecule-formula">${this.formatFormula(name)}</span>
            <span class="molecule-name">${MOLECULES[name].name}</span>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="reaction-controls" class="hidden">
        <div class="panel-section-title" style="margin-top: 12px;">反应物选择</div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-secondary); min-width: 60px;">反应物1:</span>
            <span id="reactant1-display" style="font-size: 13px; color: var(--accent-color);">未选择</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12px; color: var(--text-secondary); min-width: 60px;">反应物2:</span>
            <span id="reactant2-display" style="font-size: 13px; color: var(--accent-color);">未选择</span>
          </div>
          <button id="start-reaction-btn" class="action-btn primary" style="margin-top: 8px; width: 100%;" disabled>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            开始反应
          </button>
        </div>
      </div>
    `;
  }

  private formatFormula(name: string): string {
    return name.replace(/(\d+)/g, '<sub>$1</sub>');
  }

  private buildControlPanel(): void {
    this.container.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">显示模式</div>
        <div class="mode-selector">
          <button class="mode-btn active" data-mode="ball-stick" title="球棍模型">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="6" cy="12" r="2"></circle>
              <circle cx="18" cy="12" r="2"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            球棍
          </button>
          <button class="mode-btn" data-mode="space-filling" title="空间填充">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="9" cy="12" r="5"></circle>
              <circle cx="15" cy="12" r="5"></circle>
            </svg>
            填充
          </button>
          <button class="mode-btn" data-mode="wireframe" title="线框模型">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="6" cy="12" r="2" stroke-dasharray="2,1"></circle>
              <circle cx="18" cy="12" r="2" stroke-dasharray="2,1"></circle>
              <line x1="8" y1="12" x2="16" y2="12" stroke-dasharray="3,2"></line>
            </svg>
            线框
          </button>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">显示选项</div>
        <div class="toggle-row">
          <span class="toggle-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            原子标签
          </span>
          <div class="toggle-switch" id="toggle-labels"></div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            自动旋转
          </span>
          <div class="toggle-switch active" id="toggle-rotate"></div>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">视角控制</div>
        <div class="action-buttons">
          <button class="action-btn" id="reset-view-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            重置视角
          </button>
          <button class="action-btn primary" id="screenshot-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            截图
          </button>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">关于</div>
        <div style="font-size: 11px; color: var(--text-muted); line-height: 1.6;">
          分子3D可视化工具<br>
          基于 Three.js 构建
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const modeTabs = this.selectorContainer.querySelectorAll('.mode-tab');
    modeTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const mode = target.dataset.mode as AppMode;
        this.setAppMode(mode);
      });
    });

    const moleculeItems = this.selectorContainer.querySelectorAll('.molecule-item');
    moleculeItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const molecule = target.dataset.molecule!;
        this.handleMoleculeClick(molecule);
      });
    });

    const modeBtns = this.container.querySelectorAll('.mode-btn');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const mode = target.dataset.mode as DisplayMode;
        this.setDisplayMode(mode);
      });
    });

    const labelsToggle = document.getElementById('toggle-labels');
    labelsToggle?.addEventListener('click', () => {
      const isActive = labelsToggle.classList.toggle('active');
      this.sceneManager.setLabelsVisible(isActive);
    });

    const rotateToggle = document.getElementById('toggle-rotate');
    rotateToggle?.addEventListener('click', () => {
      const isActive = rotateToggle.classList.toggle('active');
      this.sceneManager.setAutoRotate(isActive);
    });

    const resetBtn = document.getElementById('reset-view-btn');
    resetBtn?.addEventListener('click', () => {
      this.sceneManager.resetCamera();
    });

    const screenshotBtn = document.getElementById('screenshot-btn');
    screenshotBtn?.addEventListener('click', () => {
      ScreenshotService.capture(this.sceneManager.getRendererDomElement(), 'molecule.png');
    });

    const startReactionBtn = document.getElementById('start-reaction-btn');
    startReactionBtn?.addEventListener('click', () => {
      this.startReaction();
    });

    this.mobileToggle.addEventListener('click', () => {
      this.toggleDrawer();
    });

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawer-overlay';
    document.getElementById('ui-layer')?.appendChild(overlay);
    overlay.addEventListener('click', () => {
      this.closeDrawer();
    });

    this.sceneManager.onReactionComplete((equation, productName) => {
      this.showReactionInfo(equation);
    });
  }

  private setAppMode(mode: AppMode): void {
    this.appMode = mode;

    const tabs = this.selectorContainer.querySelectorAll('.mode-tab');
    tabs.forEach((tab) => {
      const tabEl = tab as HTMLElement;
      tabEl.classList.toggle('active', tabEl.dataset.mode === mode);
    });

    const reactionControls = document.getElementById('reaction-controls');
    if (mode === 'reaction') {
      reactionControls?.classList.remove('hidden');
      this.selectedReactants = [null, null];
      this.updateReactantDisplay();
      this.updateMoleculeListSelection();
    } else {
      reactionControls?.classList.add('hidden');
      this.showMolecule(this.selectedMolecule);
    }

    this.updateMoleculeListSelection();
  }

  private handleMoleculeClick(name: string): void {
    if (this.appMode === 'browse') {
      this.selectedMolecule = name;
      this.showMolecule(name);
      this.updateMoleculeListSelection();
    } else {
      this.selectReactant(name);
    }
  }

  private selectReactant(name: string): void {
    if (!this.selectedReactants[0]) {
      this.selectedReactants[0] = name;
    } else if (!this.selectedReactants[1]) {
      if (this.selectedReactants[0] === name) {
        this.selectedReactants[1] = name;
      } else {
        this.selectedReactants[1] = name;
      }
    } else {
      this.selectedReactants = [name, null];
    }

    this.updateReactantDisplay();
    this.updateMoleculeListSelection();
    this.updateStartButton();
  }

  private updateReactantDisplay(): void {
    const r1Display = document.getElementById('reactant1-display');
    const r2Display = document.getElementById('reactant2-display');

    if (r1Display) {
      r1Display.innerHTML = this.selectedReactants[0]
        ? this.formatFormula(this.selectedReactants[0]) + ' (' + MOLECULES[this.selectedReactants[0]].name + ')'
        : '未选择';
    }
    if (r2Display) {
      r2Display.innerHTML = this.selectedReactants[1]
        ? this.formatFormula(this.selectedReactants[1]) + ' (' + MOLECULES[this.selectedReactants[1]].name + ')'
        : '未选择';
    }
  }

  private updateMoleculeListSelection(): void {
    const items = this.selectorContainer.querySelectorAll('.molecule-item');
    items.forEach((item) => {
      const itemEl = item as HTMLElement;
      const name = itemEl.dataset.molecule!;

      if (this.appMode === 'browse') {
        itemEl.classList.toggle('active', name === this.selectedMolecule);
        itemEl.classList.remove('selected-reactant');
        const label = itemEl.querySelector('.reactant-label');
        if (label) label.remove();
      } else {
        itemEl.classList.remove('active');
        const isR1 = name === this.selectedReactants[0];
        const isR2 = name === this.selectedReactants[1];
        itemEl.classList.toggle('selected-reactant', isR1 || isR2);

        let label = itemEl.querySelector('.reactant-label');
        if (isR1 || isR2) {
          if (!label) {
            label = document.createElement('span');
            label.className = 'reactant-label';
            itemEl.appendChild(label);
          }
          label.textContent = isR1 ? 'R1' : 'R2';
        } else if (label) {
          label.remove();
        }
      }
    });
  }

  private updateStartButton(): void {
    const btn = document.getElementById('start-reaction-btn') as HTMLButtonElement;
    if (!btn) return;

    const canReact = this.selectedReactants[0] && this.selectedReactants[1] &&
      getReaction(this.selectedReactants[0], this.selectedReactants[1]);

    btn.disabled = !canReact;
    btn.style.opacity = canReact ? '1' : '0.5';
    btn.style.cursor = canReact ? 'pointer' : 'not-allowed';
  }

  private startReaction(): void {
    const [r1, r2] = this.selectedReactants;
    if (!r1 || !r2) return;

    const success = this.sceneManager.startReaction(r1, r2);
    if (success) {
      this.hideReactionInfo();
    }
  }

  private showMolecule(name: string): void {
    this.sceneManager.showMolecule(name);
    this.hideReactionInfo();
  }

  private showReactionInfo(equation: string): void {
    this.reactionInfo.innerHTML = `
      <div class="reaction-equation">${equation.replace(/(\d+)/g, '<sub>$1</sub>')}</div>
      <div class="reaction-status success">✓ 反应完成</div>
    `;
    this.reactionInfo.classList.remove('hidden');
  }

  private hideReactionInfo(): void {
    this.reactionInfo.classList.add('hidden');
  }

  private setDisplayMode(mode: DisplayMode): void {
    this.sceneManager.setDisplayMode(mode);

    const btns = this.container.querySelectorAll('.mode-btn');
    btns.forEach((btn) => {
      const btnEl = btn as HTMLElement;
      btnEl.classList.toggle('active', btnEl.dataset.mode === mode);
    });
  }

  private setupResponsive(): void {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        this.container.classList.remove('open');
        this.selectorContainer.classList.remove('open');
        this.drawerOpen = false;
        this.updateDrawerOverlay();
      }
    };

    window.addEventListener('resize', checkBreakpoint);
    checkBreakpoint();
  }

  private toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
    if (this.drawerOpen) {
      this.openDrawer();
    } else {
      this.closeDrawer();
    }
  }

  private openDrawer(): void {
    this.container.classList.add('open');
    this.selectorContainer.classList.add('open');
    this.drawerOpen = true;
    this.updateDrawerOverlay();
  }

  private closeDrawer(): void {
    this.container.classList.remove('open');
    this.selectorContainer.classList.remove('open');
    this.drawerOpen = false;
    this.updateDrawerOverlay();
  }

  private updateDrawerOverlay(): void {
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.toggle('visible', this.drawerOpen);
    }
  }
}
