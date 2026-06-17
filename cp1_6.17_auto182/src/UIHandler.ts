import type { StarMapManager, StarPoint } from './StarMapManager';

interface UIHandlerCallbacks {
  onNewCanvas: () => Promise<void>;
  onUndo: () => void;
  onExport: () => void;
  onDeleteStar: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onToggleLock: (id: string) => void;
  onConnectionMode: (id: string) => void;
}

const STAR_COLORS = [
  '#FFFFFF', '#FF6B9D', '#FFA94D', '#FFE066',
  '#69DB7C', '#38D9A9', '#4DABF7', '#748FFC',
  '#DA77F2', '#FF8787', '#63E6BE', '#A5D8FF',
];

export class UIHandler {
  private app: HTMLElement;
  private manager: StarMapManager;
  private callbacks: UIHandlerCallbacks;

  private panelEl!: HTMLDivElement;
  private sceneContainer!: HTMLDivElement;
  private countEl!: HTMLDivElement;
  private undoBtn!: HTMLButtonElement;
  private newBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private starInfoEl!: HTMLDivElement;
  private radialMenuEl!: HTMLDivElement;
  private radialTargetId: string | null = null;
  private colorPickerEl!: HTMLDivElement | null;
  private unsubscribeManager: (() => void) | null = null;

  constructor(app: HTMLElement, manager: StarMapManager, callbacks: UIHandlerCallbacks) {
    this.app = app;
    this.manager = manager;
    this.callbacks = callbacks;
    this.build();
    this.bindGlobalEvents();
    this.unsubscribeManager = manager.subscribe(() => this.refreshUI());
    this.refreshUI();
  }

  getSceneContainer(): HTMLElement {
    return this.sceneContainer;
  }

  private build(): void {
    this.app.innerHTML = '';
    this.app.style.cssText = `
      width: 100vw; height: 100vh;
      display: flex; flex-direction: row;
      background: #0A0A14;
      position: relative; overflow: hidden;
    `;

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'starmap-panel';
    this.panelEl.style.cssText = `
      flex-shrink: 0;
      width: 280px;
      margin: 12px 0 12px 12px;
      padding: 20px 18px;
      background: rgba(18, 18, 30, 0.88);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      color: #E0E0FF;
      display: flex; flex-direction: column;
      gap: 18px;
      overflow-y: auto;
      z-index: 20;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 1.25rem; font-weight: 700;
      letter-spacing: 2px;
      background: linear-gradient(135deg, #B0C4DE 0%, #748FFC 50%, #DA77F2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    `;
    title.textContent = '轨迹星图';

    const subtitle = document.createElement('div');
    subtitle.style.cssText = `
      font-size: 11px; opacity: 0.55; margin-top: -10px;
      letter-spacing: 1px;
    `;
    subtitle.textContent = 'CONSTELLATION STUDIO';

    this.countEl = document.createElement('div');
    this.countEl.style.cssText = `
      padding: 14px 16px;
      background: rgba(30, 30, 58, 0.7);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      display: flex; flex-direction: column;
      gap: 4px;
    `;
    const countLabel = document.createElement('div');
    countLabel.style.cssText = 'font-size: 11px; opacity: 0.65; letter-spacing: 1px;';
    countLabel.textContent = '星点总数';
    const countValue = document.createElement('div');
    countValue.style.cssText = 'font-size: 1.2rem; color: #E0E0FF; font-weight: 600; font-family: Consolas, Monaco, monospace;';
    countValue.textContent = '0';
    this.countEl.appendChild(countLabel);
    this.countEl.appendChild(countValue);
    (this.countEl as any).valueEl = countValue;

    this.newBtn = this.makeButton('✦ 新建画布', '#FF8787', true);
    this.undoBtn = this.makeButton('↶ 撤销操作', '#748FFC');
    this.exportBtn = this.makeButton('⬇ 导出截图', '#69DB7C');

    this.starInfoEl = document.createElement('div');
    this.starInfoEl.style.cssText = `
      padding: 12px 14px;
      background: rgba(30, 30, 58, 0.5);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-size: 11px;
      line-height: 1.6;
      opacity: 0.85;
    `;
    this.starInfoEl.innerHTML = `
      <div style="opacity:0.7; margin-bottom:6px; letter-spacing:1px;">操作指南</div>
      <div>• 点击网格球表面放置星点</div>
      <div>• 点击星点：打开操作菜单</div>
      <div>• 拖拽星点：调整位置</div>
      <div>• 空白拖拽：旋转视角</div>
      <div>• 滚轮：缩放</div>
      <div>• 右键：取消选择</div>
    `;

    this.panelEl.append(title, subtitle, this.countEl, this.newBtn, this.undoBtn, this.exportBtn, this.starInfoEl);

    this.sceneContainer = document.createElement('div');
    this.sceneContainer.className = 'starmap-scene';
    this.sceneContainer.style.cssText = `
      flex: 1;
      position: relative;
      margin: 12px;
      margin-left: 3px;
      border-radius: 12px;
      overflow: hidden;
      min-width: 0;
      min-height: 0;
      background: #0A0A14;
    `;

    this.radialMenuEl = document.createElement('div');
    this.radialMenuEl.style.cssText = `
      position: absolute;
      width: 0; height: 0;
      pointer-events: none;
      z-index: 50;
      transform: translate(0, 0);
    `;
    this.sceneContainer.appendChild(this.radialMenuEl);

    this.app.appendChild(this.panelEl);
    this.app.appendChild(this.sceneContainer);

    this.applyResponsive();
  }

  private makeButton(text: string, accent = '#748FFC', danger = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 11px 14px;
      background: #1E1E3A;
      color: #E0E0FF;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      user-select: none;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#2E2E5A';
      btn.style.borderColor = accent + '80';
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = `0 4px 12px ${accent}30`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#1E1E3A';
      btn.style.borderColor = 'rgba(255,255,255,0.18)';
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'translateY(2px)';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('mouseup', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = `0 4px 12px ${accent}30`;
    });
    if (danger) {
      btn.dataset.accent = accent;
    }
    return btn;
  }

  private bindGlobalEvents(): void {
    this.newBtn.addEventListener('click', async () => {
      if (this.manager.getStarCount() === 0) return;
      this.newBtn.style.pointerEvents = 'none';
      this.newBtn.style.opacity = '0.7';
      await this.callbacks.onNewCanvas();
      this.newBtn.style.pointerEvents = '';
      this.newBtn.style.opacity = '';
    });

    this.undoBtn.addEventListener('click', () => {
      if (!this.manager.canUndo()) return;
      const origTransform = this.undoBtn.style.transform;
      this.undoBtn.animate(
        [
          { transform: origTransform || 'translateY(0)', boxShadow: 'none' },
          { transform: (origTransform || 'translateY(0)') + ' scale(0.92)', offset: 0.4 },
          { transform: origTransform || 'translateY(0)', boxShadow: '' },
        ],
        { duration: 220, easing: 'ease-out' },
      );
      this.callbacks.onUndo();
    });

    this.exportBtn.addEventListener('click', () => {
      if (this.exportBtn.classList.contains('exporting')) return;
      this.exportBtn.classList.add('exporting');
      const originalHTML = this.exportBtn.innerHTML;
      this.exportBtn.innerHTML = `<span style="display:inline-block; animation:spin-export 0.9s linear infinite;">⟳</span> 导出中...`;
      if (!document.getElementById('starmap-export-anim')) {
        const st = document.createElement('style');
        st.id = 'starmap-export-anim';
        st.textContent = `@keyframes spin-export { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
        document.head.appendChild(st);
      }
      setTimeout(() => {
        this.callbacks.onExport();
        setTimeout(() => {
          this.exportBtn.innerHTML = originalHTML;
          this.exportBtn.classList.remove('exporting');
        }, 400);
      }, 600);
    });

    window.addEventListener('resize', () => this.applyResponsive());
    this.applyResponsive();
  }

  private applyResponsive(): void {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      this.app.style.flexDirection = 'column';
      this.panelEl.style.width = '';
      this.panelEl.style.margin = '8px';
      this.panelEl.style.marginBottom = '0';
      this.panelEl.style.maxHeight = '180px';
      this.panelEl.style.flexDirection = 'row';
      this.panelEl.style.flexWrap = 'nowrap';
      this.panelEl.style.overflowX = 'auto';
      this.panelEl.style.overflowY = 'hidden';
      this.panelEl.style.gap = '10px';
      this.panelEl.style.padding = '12px 14px';
      this.sceneContainer.style.margin = '8px';
      this.sceneContainer.style.height = 'calc(100vh - 196px)';
      this.countEl.style.minWidth = '140px';
      this.countEl.style.flexShrink = '0';
      this.newBtn.style.flexShrink = '0';
      this.newBtn.style.whiteSpace = 'nowrap';
      this.undoBtn.style.flexShrink = '0';
      this.undoBtn.style.whiteSpace = 'nowrap';
      this.exportBtn.style.flexShrink = '0';
      this.exportBtn.style.whiteSpace = 'nowrap';
      this.starInfoEl.style.display = 'none';
    } else {
      this.app.style.flexDirection = 'row';
      this.panelEl.style.width = '280px';
      this.panelEl.style.margin = '12px 0 12px 12px';
      this.panelEl.style.maxHeight = '';
      this.panelEl.style.flexDirection = 'column';
      this.panelEl.style.flexWrap = '';
      this.panelEl.style.overflowX = '';
      this.panelEl.style.overflowY = 'auto';
      this.panelEl.style.gap = '18px';
      this.panelEl.style.padding = '20px 18px';
      this.sceneContainer.style.margin = '12px';
      this.sceneContainer.style.marginLeft = '3px';
      this.sceneContainer.style.height = '';
      this.countEl.style.minWidth = '';
      this.countEl.style.flexShrink = '';
      this.newBtn.style.flexShrink = '';
      this.newBtn.style.whiteSpace = '';
      this.undoBtn.style.flexShrink = '';
      this.undoBtn.style.whiteSpace = '';
      this.exportBtn.style.flexShrink = '';
      this.exportBtn.style.whiteSpace = '';
      this.starInfoEl.style.display = '';
    }
  }

  private refreshUI(): void {
    const count = this.manager.getStarCount();
    const valueEl = (this.countEl as any).valueEl as HTMLDivElement;
    if (valueEl) valueEl.textContent = String(count);

    this.undoBtn.disabled = !this.manager.canUndo();
    this.undoBtn.style.opacity = this.manager.canUndo() ? '' : '0.45';
    this.undoBtn.style.cursor = this.manager.canUndo() ? '' : 'not-allowed';

    this.newBtn.disabled = count === 0;
    this.newBtn.style.opacity = count === 0 ? '0.45' : '';
    this.newBtn.style.cursor = count === 0 ? 'not-allowed' : '';

    this.exportBtn.disabled = count === 0;
    this.exportBtn.style.opacity = count === 0 && !this.exportBtn.classList.contains('exporting') ? '0.45' : '';
    this.exportBtn.style.cursor = count === 0 ? 'not-allowed' : '';
  }

  public showRadialMenu(starId: string, screenX: number, screenY: number): void {
    this.hideRadialMenu();
    this.hideColorPicker();
    this.radialTargetId = starId;

    const rect = this.sceneContainer.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;

    this.radialMenuEl.style.left = `${x}px`;
    this.radialMenuEl.style.top = `${y}px`;
    this.radialMenuEl.style.pointerEvents = 'auto';

    const items: Array<{ icon: string; label: string; color: string; onClick: () => void }> = [
      {
        icon: '✕',
        label: '删除',
        color: '#FF8787',
        onClick: () => {
          if (this.radialTargetId) {
            this.callbacks.onDeleteStar(this.radialTargetId);
          }
          this.hideRadialMenu();
        },
      },
      {
        icon: '◐',
        label: '变色',
        color: '#DA77F2',
        onClick: () => {
          if (this.radialTargetId) {
            this.showColorPicker(x, y, this.radialTargetId);
          }
        },
      },
      {
        icon: '⇌',
        label: '连线',
        color: '#4DABF7',
        onClick: () => {
          if (this.radialTargetId) {
            this.callbacks.onConnectionMode(this.radialTargetId);
          }
          this.hideRadialMenu();
        },
      },
      {
        icon: '🔒',
        label: '锁定',
        color: '#FFD43B',
        onClick: () => {
          if (this.radialTargetId) {
            this.callbacks.onToggleLock(this.radialTargetId);
          }
          this.hideRadialMenu();
        },
      },
    ];

    const star = this.manager.getStarById(starId);
    if (star?.locked) {
      items[3].icon = '🔓';
      items[3].label = '解锁';
    }

    const radius = 58;
    items.forEach((it, idx) => {
      const angle = (idx / items.length) * Math.PI * 2 - Math.PI / 2;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = it.icon;
      btn.title = it.label;
      btn.style.cssText = `
        position: absolute;
        left: 0; top: 0;
        width: 40px; height: 40px;
        border-radius: 50%;
        background: #2A2A5A;
        color: ${it.color};
        border: 1px solid rgba(255,255,255,0.25);
        font-size: 16px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transform: translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3);
        opacity: 0;
        transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s, background 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        font-family: inherit;
        pointer-events: auto;
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1)`;
        btn.style.background = '#3A3A7A';
        btn.style.boxShadow = `0 6px 20px ${it.color}50`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`;
        btn.style.background = '#2A2A5A';
        btn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.5)';
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        it.onClick();
      });
      this.radialMenuEl.appendChild(btn);
      requestAnimationFrame(() => {
        setTimeout(() => {
          btn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`;
          btn.style.opacity = '1';
        }, idx * 40);
      });
    });

    setTimeout(() => {
      const handler = (ev: MouseEvent) => {
        const target = ev.target as HTMLElement;
        if (!target.closest('.starmap-radial') && !this.radialMenuEl.contains(target) && !this.colorPickerEl?.contains(target)) {
          this.hideRadialMenu();
          this.hideColorPicker();
          document.removeEventListener('mousedown', handler, true);
        }
      };
      document.addEventListener('mousedown', handler, true);
    }, 0);
  }

  public hideRadialMenu(): void {
    const children = Array.from(this.radialMenuEl.children) as HTMLElement[];
    children.forEach((ch, idx) => {
      const currentTransform = ch.style.transform;
      const match = currentTransform.match(/translate\(calc\(-50% \+ ([-\d.]+)px\), calc\(-50% \+ ([-\d.]+)px\)\)/);
      const dx = match ? match[1] : '0';
      const dy = match ? match[2] : '0';
      ch.style.transition = 'transform 0.16s ease, opacity 0.14s';
      ch.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`;
      ch.style.opacity = '0';
      setTimeout(() => {
        if (ch.parentNode === this.radialMenuEl) {
          this.radialMenuEl.removeChild(ch);
        }
      }, 180 + idx * 15);
    });
    this.radialMenuEl.style.pointerEvents = 'none';
    if (children.length === 0) {
      this.radialTargetId = null;
    } else {
      setTimeout(() => { this.radialTargetId = null; }, 300);
    }
  }

  private showColorPicker(x: number, y: number, starId: string): void {
    this.hideColorPicker();
    const container = document.createElement('div');
    container.className = 'starmap-radial';
    container.style.cssText = `
      position: absolute;
      left: ${x + 70}px;
      top: ${y - 50}px;
      padding: 10px;
      background: rgba(30, 30, 58, 0.96);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
      z-index: 55;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      animation: cp-in 0.2s ease-out;
    `;
    if (!document.getElementById('starmap-cp-anim')) {
      const s = document.createElement('style');
      s.id = 'starmap-cp-anim';
      s.textContent = `@keyframes cp-in { from { opacity:0; transform: scale(0.85) translateY(-5px); } to { opacity:1; transform: scale(1) translateY(0); } }`;
      document.head.appendChild(s);
    }
    STAR_COLORS.forEach(c => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.style.cssText = `
        width: 26px; height: 26px;
        border-radius: 50%;
        background: ${c};
        border: 2px solid rgba(255,255,255,0.3);
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        padding: 0;
      `;
      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.2)';
        swatch.style.boxShadow = `0 0 12px ${c}90`;
        swatch.style.borderColor = '#fff';
      });
      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = 'scale(1)';
        swatch.style.boxShadow = 'none';
        swatch.style.borderColor = 'rgba(255,255,255,0.3)';
      });
      swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onChangeColor(starId, c);
        this.hideColorPicker();
        this.hideRadialMenu();
      });
      container.appendChild(swatch);
    });
    this.colorPickerEl = container;
    this.sceneContainer.appendChild(container);
  }

  private hideColorPicker(): void {
    if (this.colorPickerEl) {
      this.colorPickerEl.remove();
      this.colorPickerEl = null;
    }
  }

  public hideAllOverlays(): void {
    this.hideRadialMenu();
    this.hideColorPicker();
  }

  public getActiveStarId(): string | null {
    return this.radialTargetId;
  }

  public destroy(): void {
    this.unsubscribeManager?.();
    this.unsubscribeManager = null;
    this.hideAllOverlays();
  }
}
