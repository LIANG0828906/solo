export interface OrganelleInfo {
  name: string;
  nameEn: string;
  function: string;
  icon: string;
}

const ORGANELLE_DATABASE: Record<string, OrganelleInfo> = {
  mitochondrion: {
    name: '线粒体',
    nameEn: 'Mitochondrion',
    function: '细胞的"动力工厂"，通过有氧呼吸产生ATP，为细胞活动提供能量。含有自身的DNA，参与细胞代谢、信号传导和细胞凋亡调控。',
    icon: '⚡'
  },
  nucleus: {
    name: '细胞核',
    nameEn: 'Nucleus',
    function: '细胞的控制中心，储存遗传物质DNA，负责基因表达的调控、DNA复制和RNA转录。核膜上的核孔控制物质进出。',
    icon: '🧬'
  },
  endoplasmicReticulum: {
    name: '内质网',
    nameEn: 'Endoplasmic Reticulum',
    function: '由膜构成的网状管道系统。粗面内质网附着核糖体参与蛋白质合成；光面内质网参与脂质合成、糖类代谢和解毒作用。',
    icon: '📊'
  },
  golgi: {
    name: '高尔基体',
    nameEn: 'Golgi Apparatus',
    function: '细胞的"加工车间"，对来自内质网的蛋白质进行修饰、分类、包装和运输，形成分泌泡输送到细胞各处。',
    icon: '📦'
  },
  lysosome: {
    name: '溶酶体',
    nameEn: 'Lysosome',
    function: '细胞的"消化器官"，含有多种水解酶，能分解衰老损伤的细胞器、吞噬并降解入侵的细菌和病毒。',
    icon: '🛡️'
  }
};

export class UIOverlay {
  private container: HTMLElement;
  private hudTopLeft: HTMLElement;
  private hudBottomRight: HTMLElement;
  private hudBottomLeft: HTMLElement;
  private infoPanel: HTMLElement;
  private hoverLabel: HTMLElement;
  private currentOrganelleElement: HTMLElement;

  private onPanelOutsideClickCallback: (() => void) | null = null;
  private pendingRequestId: number | null = null;
  private pendingFlipTarget: HTMLElement | null = null;

  constructor() {
    this.container = document.getElementById('app')!;
    this.hudTopLeft = this.createHudTopLeft();
    this.hudBottomRight = this.createHudBottomRight();
    this.hudBottomLeft = this.createHudBottomLeft();
    this.infoPanel = this.createInfoPanel();
    this.hoverLabel = this.createHoverLabel();
    this.currentOrganelleElement = this.hudTopLeft.querySelector('.current-name') as HTMLElement;
    this.setupResponsive();
    this.setupGlobalClickHandler();
  }

  private createGlassElement(className: string): HTMLElement {
    const el = document.createElement('div');
    el.className = className;
    Object.assign(el.style, {
      background: 'rgba(10, 30, 60, 0.55)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(100, 220, 255, 0.25)',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0, 100, 180, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      color: '#c8e6ff',
      pointerEvents: 'auto'
    });
    return el;
  }

  private createHudTopLeft(): HTMLElement {
    const el = this.createGlassElement('hud-top-left');
    Object.assign(el.style, {
      position: 'absolute',
      top: '20px',
      left: '20px',
      padding: '14px 20px',
      minWidth: '220px'
    });
    el.innerHTML = `
      <div style="font-size:11px; color:#5fb8d9; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">当前观察</div>
      <div class="current-name" style="font-size:20px; font-weight:600; color:#7de3ff; letter-spacing:1px;">细胞质环境</div>
      <div style="font-size:12px; color:#6a9ab8; margin-top:4px;">Cytoplasm</div>
      <div style="margin-top:10px; height:2px; background:linear-gradient(90deg, #2a7fb8 0%, #7de3ff 50%, #2a7fb8 100%); border-radius:1px; opacity:0.6;"></div>
    `;
    this.container.appendChild(el);
    return el;
  }

  private createHudBottomRight(): HTMLElement {
    const el = this.createGlassElement('hud-bottom-right');
    Object.assign(el.style, {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      padding: '14px 18px',
      fontSize: '12px',
      lineHeight: '1.9'
    });
    el.innerHTML = `
      <div style="font-size:11px; color:#5fb8d9; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px;">操作指南</div>
      <div><span style="display:inline-block; width:60px; padding:2px 6px; background:rgba(125,227,255,0.12); border-radius:4px; text-align:center; color:#7de3ff; font-weight:600; margin-right:8px;">W A S D</span>自由移动</div>
      <div><span style="display:inline-block; width:60px; padding:2px 6px; background:rgba(125,227,255,0.12); border-radius:4px; text-align:center; color:#7de3ff; font-weight:600; margin-right:8px;">鼠标拖拽</span>视角控制</div>
      <div><span style="display:inline-block; width:60px; padding:2px 6px; background:rgba(125,227,255,0.12); border-radius:4px; text-align:center; color:#7de3ff; font-weight:600; margin-right:8px;">悬停/点击</span>查看详情</div>
    `;
    this.container.appendChild(el);
    return el;
  }

  private createHudBottomLeft(): HTMLElement {
    const el = this.createGlassElement('hud-bottom-left');
    Object.assign(el.style, {
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      padding: '14px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    });

    const buttons = [
      { key: 'overlook', label: '俯瞰全景', icon: '🌐' },
      { key: 'nucleus', label: '靠近细胞核', icon: '🧬' },
      { key: 'mitochondria', label: '观察线粒体', icon: '⚡' }
    ];

    buttons.forEach((btn, idx) => {
      const button = document.createElement('button');
      button.className = 'preset-btn';
      button.dataset.preset = btn.key;
      Object.assign(button.style, {
        background: 'rgba(20, 60, 100, 0.5)',
        border: '1px solid rgba(100, 220, 255, 0.3)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#c8e6ff',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'inherit',
        minWidth: '140px',
        transformStyle: 'preserve-3d',
        outline: 'none'
      });
      button.innerHTML = `<span style="font-size:16px;">${btn.icon}</span><span style="flex:1; text-align:left;">${btn.label}</span>`;

      button.addEventListener('mouseenter', () => {
        Object.assign(button.style, {
          background: 'rgba(40, 100, 160, 0.6)',
          borderColor: 'rgba(125, 227, 255, 0.7)',
          transform: 'translateY(-2px) rotateY(-5deg)',
          boxShadow: '0 4px 16px rgba(0, 150, 255, 0.3)'
        });
      });

      button.addEventListener('mouseleave', () => {
        Object.assign(button.style, {
          background: 'rgba(20, 60, 100, 0.5)',
          borderColor: 'rgba(100, 220, 255, 0.3)',
          transform: 'translateY(0) rotateY(0)',
          boxShadow: 'none'
        });
      });

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.pendingRequestId !== null) {
          if (this.pendingFlipTarget) {
            this.pendingFlipTarget.style.transition = 'none';
            this.pendingFlipTarget.style.transform = '';
          }
          this.pendingFlipTarget = null;
        }
        this.animateButtonFlip(button);
        const event = new CustomEvent('presetView', { detail: { preset: btn.key } });
        document.dispatchEvent(event);
      });

      el.appendChild(button);
    });

    this.container.appendChild(el);
    return el;
  }

  private animateButtonFlip(button: HTMLElement): void {
    button.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    button.style.transform = 'perspective(400px) rotateY(180deg)';
    this.pendingFlipTarget = button;
    this.pendingRequestId = window.setTimeout(() => {
      if (this.pendingFlipTarget === button) {
        button.style.transform = 'perspective(400px) rotateY(360deg)';
        this.pendingRequestId = window.setTimeout(() => {
          if (this.pendingFlipTarget === button) {
            button.style.transition = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
            button.style.transform = '';
          }
          this.pendingFlipTarget = null;
          this.pendingRequestId = null;
        }, 180);
      }
    }, 180);
  }

  private setupGlobalClickHandler(): void {
    document.addEventListener(
      'mousedown',
      (e) => {
        if (!this.isInfoPanelOpen()) return;
        const target = e.target as HTMLElement;
        if (!target.closest('.info-panel')) {
          if (this.onPanelOutsideClickCallback) {
            this.onPanelOutsideClickCallback();
          } else {
            this.hideInfoPanel();
          }
        }
      },
      true
    );
  }

  public setOnPanelOutsideClickCallback(cb: () => void): void {
    this.onPanelOutsideClickCallback = cb;
  }

  private createInfoPanel(): HTMLElement {
    const el = this.createGlassElement('info-panel');
    Object.assign(el.style, {
      position: 'absolute',
      top: '50%',
      right: '-420px',
      transform: 'translateY(-50%)',
      width: '380px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      padding: '0',
      opacity: '0',
      transition: 'right 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
      overflow: 'hidden',
      pointerEvents: 'none'
    });
    el.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(30, 80, 140, 0.8) 0%, rgba(60, 40, 120, 0.6) 100%); padding:18px 22px; border-bottom:1px solid rgba(125, 227, 255, 0.2);">
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="panel-icon" style="width:52px; height:52px; border-radius:50%; background:rgba(125, 227, 255, 0.15); display:flex; align-items:center; justify-content:center; font-size:28px; border:2px solid rgba(125, 227, 255, 0.4);"></div>
          <div style="flex:1;">
            <div class="panel-name" style="font-size:22px; font-weight:600; color:#7de3ff; letter-spacing:1px;"></div>
            <div class="panel-name-en" style="font-size:12px; color:#6a9ab8; margin-top:2px;"></div>
          </div>
          <button class="panel-close" style="width:32px; height:32px; border-radius:50%; border:1px solid rgba(255,150,150,0.3); background:rgba(200, 60, 60, 0.2); color:#ff9999; cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; transition:all 0.2s; outline:none;">✕</button>
        </div>
      </div>
      <div style="padding:20px 22px; overflow-y:auto; max-height:calc(80vh - 100px);">
        <div style="font-size:11px; color:#5fb8d9; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px;">功能说明</div>
        <div class="panel-function" style="font-size:14px; line-height:1.9; color:#b0d4ee; text-align:justify;"></div>
        <div style="margin-top:20px; padding-top:16px; border-top:1px solid rgba(100, 220, 255, 0.15);">
          <div style="font-size:11px; color:#5fb8d9; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px;">结构特征</div>
          <div class="panel-structure" style="font-size:13px; line-height:1.8; color:#8fb8d4;"></div>
        </div>
      </div>
    `;
    this.container.appendChild(el);

    const closeBtn = el.querySelector('.panel-close') as HTMLElement;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideInfoPanel();
    });

    return el;
  }

  private createHoverLabel(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'hover-label';
    Object.assign(el.style, {
      position: 'absolute',
      padding: '6px 14px',
      background: 'rgba(10, 40, 80, 0.85)',
      border: '1px solid rgba(125, 227, 255, 0.5)',
      borderRadius: '6px',
      color: '#7de3ff',
      fontSize: '13px',
      fontWeight: '500',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease',
      transform: 'translate(-50%, -130%)',
      whiteSpace: 'nowrap',
      zIndex: '100',
      letterSpacing: '1px',
      boxShadow: '0 2px 12px rgba(0, 150, 255, 0.25)'
    });
    this.container.appendChild(el);
    return el;
  }

  public setCurrentOrganelle(name: string, nameEn: string): void {
    if (this.currentOrganelleElement.textContent !== name) {
      this.currentOrganelleElement.style.transition = 'opacity 0.2s ease';
      this.currentOrganelleElement.style.opacity = '0';
      setTimeout(() => {
        this.currentOrganelleElement.textContent = name;
        (this.hudTopLeft.children[2] as HTMLElement).textContent = nameEn;
        this.currentOrganelleElement.style.opacity = '1';
      }, 200);
    }
  }

  public showHoverLabel(x: number, y: number, name: string): void {
    this.hoverLabel.textContent = name;
    this.hoverLabel.style.left = x + 'px';
    this.hoverLabel.style.top = y + 'px';
    this.hoverLabel.style.opacity = '1';
  }

  public hideHoverLabel(): void {
    this.hoverLabel.style.opacity = '0';
  }

  public showInfoPanel(organelleType: string): void {
    const info = ORGANELLE_DATABASE[organelleType];
    if (!info) return;

    (this.infoPanel.querySelector('.panel-icon') as HTMLElement).textContent = info.icon;
    (this.infoPanel.querySelector('.panel-name') as HTMLElement).textContent = info.name;
    (this.infoPanel.querySelector('.panel-name-en') as HTMLElement).textContent = info.nameEn;
    (this.infoPanel.querySelector('.panel-function') as HTMLElement).textContent = info.function;

    const structureText = this.getStructureText(organelleType);
    (this.infoPanel.querySelector('.panel-structure') as HTMLElement).textContent = structureText;

    this.infoPanel.style.pointerEvents = 'auto';
    requestAnimationFrame(() => {
      this.infoPanel.style.right = '20px';
      this.infoPanel.style.opacity = '1';
    });
  }

  private getStructureText(type: string): string {
    const map: Record<string, string> = {
      mitochondrion: '双层膜结构，外膜平滑，内膜向内折叠形成嵴，内部充满基质。直径约0.5-1μm。',
      nucleus: '球形结构，由双层核膜包裹，内部含染色质和核仁。核孔复合物控制物质运输。',
      endoplasmicReticulum: '连续的膜囊和管道网络，与核膜相连。分粗面（附着核糖体）和光面两种。',
      golgi: '由堆叠的扁平膜囊构成，含顺面、中间和反面三个功能区。周围伴随运输小泡。',
      lysosome: '单层膜包裹的球形小泡，直径约0.2-0.8μm，内含50余种酸性水解酶。'
    };
    return map[type] || '';
  }

  public hideInfoPanel(): void {
    this.infoPanel.style.right = '-420px';
    this.infoPanel.style.opacity = '0';
    setTimeout(() => {
      this.infoPanel.style.pointerEvents = 'none';
    }, 450);
    const event = new CustomEvent('panelClosed');
    document.dispatchEvent(event);
  }

  public isInfoPanelOpen(): boolean {
    return this.infoPanel.style.right !== '-420px' && this.infoPanel.style.right !== '';
  }

  private setupResponsive(): void {
    const resize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        this.hudTopLeft.style.minWidth = 'auto';
        this.hudTopLeft.style.padding = '10px 14px';
        (this.currentOrganelleElement as HTMLElement).style.fontSize = '16px';
        this.hudBottomRight.style.fontSize = '11px';
        this.infoPanel.style.width = 'calc(100vw - 20px)';
      } else {
        this.hudTopLeft.style.minWidth = '220px';
        this.hudTopLeft.style.padding = '14px 20px';
        (this.currentOrganelleElement as HTMLElement).style.fontSize = '20px';
        this.hudBottomRight.style.fontSize = '12px';
        this.infoPanel.style.width = '380px';
      }
    };
    window.addEventListener('resize', resize);
    resize();
  }

  public setCameraTweenState(_active: boolean): void {
  }
}
