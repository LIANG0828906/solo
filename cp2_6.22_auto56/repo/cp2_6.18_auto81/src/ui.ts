import type { MoleculeData } from './parser';
import type { RenderMode } from './renderer';
import { getPresetList } from './parser';

export interface UICallbacks {
  onLoadSMILES: (smiles: string) => void;
  onLoadPreset: (key: string) => void;
  onSetRenderMode: (mode: RenderMode) => void;
  onResetView: () => void;
  onSetRotationSpeed: (speed: number) => void;
  onSetZoomSpeed: (speed: number) => void;
  onToggleAutoRotate: (enabled: boolean) => void;
}

export class UIController {
  private container: HTMLElement;
  private callbacks: UICallbacks;
  private hud!: HTMLDivElement;
  private sidebar!: HTMLDivElement;
  private sidebarContent!: HTMLDivElement;
  private collapseBtn!: HTMLButtonElement;
  private floatButtons!: HTMLDivElement;
  private inputSection!: HTMLDivElement;
  private atomInfoSection!: HTMLDivElement;
  private moleculeInfoSection!: HTMLDivElement;
  private settingsSection!: HTMLDivElement;
  private mobileDropdown!: HTMLDivElement;
  private mobileDropdownContent!: HTMLDivElement;
  private fpsEl!: HTMLSpanElement;
  private nameEl!: HTMLSpanElement;
  private smilesInput!: HTMLInputElement;
  private presetButtons!: HTMLDivElement;
  private formulaEl!: HTMLDivElement;
  private weightEl!: HTMLDivElement;
  private atomCountEl!: HTMLDivElement;
  private bondCountEl!: HTMLDivElement;
  private selectedAtomEl!: HTMLDivElement;
  private floatWindow: HTMLDivElement | null = null;
  private isSidebarDetached = false;
  private dragState: {
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    target: HTMLElement | null;
  } = { dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, target: null };
  private currentMolecule: MoleculeData | null = null;
  private currentMode: RenderMode = 'ball-stick';
  private rotationSpeed = 1.0;
  private zoomSpeed = 1.0;
  private autoRotate = false;

  constructor(container: HTMLElement, callbacks: UICallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.buildDOM();
    this.attachEvents();
    this.updateResponsive();
    window.addEventListener('resize', this.updateResponsive);
  }

  private buildDOM(): void {
    this.buildHUD();
    this.buildSidebar();
    this.buildFloatButtons();
    this.buildInputSection();
    this.buildMobileDropdown();
  }

  private buildHUD(): void {
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 10px 16px;
      background: rgba(20, 20, 40, 0.65);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 12px;
      color: #e0e0f0;
      font-size: 13px;
      line-height: 1.5;
      z-index: 50;
      pointer-events: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      min-width: 160px;
    `;
    this.hud.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="width:6px;height:6px;border-radius:50%;background:#00d4ff;box-shadow:0 0 8px #00d4ff;display:inline-block;"></span>
        <span id="mol-name" style="font-weight:600;color:#fff;letter-spacing:0.3px;">未载入</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:16px;font-size:11px;opacity:0.8;">
        <span>FPS</span>
        <span id="fps-display" style="font-family:'Courier New',monospace;font-weight:700;color:#00d4ff;">--</span>
      </div>
    `;
    this.container.appendChild(this.hud);
    this.fpsEl = this.hud.querySelector('#fps-display') as HTMLSpanElement;
    this.nameEl = this.hud.querySelector('#mol-name') as HTMLSpanElement;
  }

  private buildSidebar(): void {
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'mol-sidebar';
    this.sidebar.style.cssText = `
      position: absolute;
      top: 16px;
      right: 16px;
      width: 320px;
      max-height: calc(100vh - 32px);
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%);
      border: 1px solid rgba(0, 212, 255, 0.18);
      border-radius: 16px;
      padding: 20px;
      color: #e0e0f0;
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: 18px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.04);
      overflow: hidden;
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: move;
      user-select: none;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin: -20px -20px 0 -20px;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, transparent 70%);
    `;
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#6644ff);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;box-shadow:0 0 12px rgba(0,212,255,0.4);">M</div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#fff;letter-spacing:0.3px;">结构分析</div>
          <div style="font-size:10px;opacity:0.5;letter-spacing:1px;text-transform:uppercase;">Structure Panel</div>
        </div>
      </div>
    `;
    this.collapseBtn = document.createElement('button');
    this.collapseBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;
    this.collapseBtn.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      color: #b0b0c8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    header.appendChild(this.collapseBtn);
    header.addEventListener('mousedown', this.handleSidebarDragStart);
    this.sidebar.appendChild(header);

    this.sidebarContent = document.createElement('div');
    this.sidebarContent.style.cssText = `
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      scrollbar-width: thin;
      scrollbar-color: rgba(0,212,255,0.3) transparent;
    `;
    this.sidebarContent.addEventListener('wheel', (e) => { e.stopPropagation(); }, { passive: true });
    this.sidebar.appendChild(this.sidebarContent);

    this.buildMoleculeInfoSection();
    this.buildAtomInfoSection();
    this.buildRenderModeSection();
    this.buildSettingsSection();

    this.container.appendChild(this.sidebar);
  }

  private buildMoleculeInfoSection(): void {
    this.moleculeInfoSection = document.createElement('div');
    this.moleculeInfoSection.style.cssText = `
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 14px;
    `;
    this.moleculeInfoSection.innerHTML = `
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;margin-bottom:10px;font-weight:700;">◈ 分子信息</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:12.5px;">
        <div style="opacity:0.55;">分子式</div>
        <div id="formula-display" style="font-weight:600;color:#fff;font-family:'Courier New',monospace;">--</div>
        <div style="opacity:0.55;">分子量</div>
        <div id="weight-display" style="font-weight:600;color:#fff;">-- <span style="opacity:0.5;font-weight:400;font-size:11px;">g/mol</span></div>
        <div style="opacity:0.55;">原子数</div>
        <div id="atom-count" style="font-weight:600;color:#fff;">--</div>
        <div style="opacity:0.55;">化学键</div>
        <div id="bond-count" style="font-weight:600;color:#fff;">--</div>
      </div>
    `;
    this.sidebarContent.appendChild(this.moleculeInfoSection);
    this.formulaEl = this.moleculeInfoSection.querySelector('#formula-display') as HTMLDivElement;
    this.weightEl = this.moleculeInfoSection.querySelector('#weight-display') as HTMLDivElement;
    this.atomCountEl = this.moleculeInfoSection.querySelector('#atom-count') as HTMLDivElement;
    this.bondCountEl = this.moleculeInfoSection.querySelector('#bond-count') as HTMLDivElement;
  }

  private buildAtomInfoSection(): void {
    this.atomInfoSection = document.createElement('div');
    this.atomInfoSection.style.cssText = `
      background: rgba(0, 212, 255, 0.04);
      border: 1px solid rgba(0, 212, 255, 0.15);
      border-radius: 12px;
      padding: 14px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    `;
    this.atomInfoSection.innerHTML = `
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;margin-bottom:10px;font-weight:700;">◈ 选中原子</div>
      <div id="selected-atom-body">
        <div style="font-size:12px;color:rgba(255,255,255,0.4);text-align:center;padding:8px 4px;line-height:1.6;">
          左键或双击<br>场景中的原子查看信息
        </div>
      </div>
    `;
    this.sidebarContent.appendChild(this.atomInfoSection);
    this.selectedAtomEl = this.atomInfoSection.querySelector('#selected-atom-body') as HTMLDivElement;
  }

  private buildRenderModeSection(): void {
    const section = document.createElement('div');
    section.style.cssText = `
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 14px;
    `;
    section.innerHTML = `
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;margin-bottom:12px;font-weight:700;">◈ 渲染模式</div>
      <div id="render-mode-group" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <button data-mode="ball-stick" class="mode-btn active">
          <div style="font-size:11px;font-weight:600;">球棍模型</div>
        </button>
        <button data-mode="space-fill" class="mode-btn">
          <div style="font-size:11px;font-weight:600;">空间填充</div>
        </button>
        <button data-mode="wireframe" class="mode-btn">
          <div style="font-size:11px;font-weight:600;">线框</div>
        </button>
      </div>
    `;
    this.sidebarContent.appendChild(section);

    const buttons = section.querySelectorAll('.mode-btn') as NodeListOf<HTMLButtonElement>;
    buttons.forEach(btn => {
      const isActive = btn.dataset.mode === this.currentMode;
      btn.style.cssText = `
        padding: 10px 6px;
        border-radius: 8px;
        border: 1.5px solid ${isActive ? '#00d4ff' : 'rgba(255,255,255,0.08)'};
        background: ${isActive ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.02)'};
        color: ${isActive ? '#00d4ff' : '#b0b0c8'};
        cursor: pointer;
        transition: all 0.22s ease;
        box-shadow: ${isActive ? '0 0 10px rgba(0,212,255,0.25), inset 0 0 8px rgba(0,212,255,0.1)' : 'none'};
        font-family: inherit;
      `;
      btn.addEventListener('mouseenter', () => {
        if (!btn.classList.contains('active')) {
          btn.style.background = 'rgba(0,212,255,0.08)';
          btn.style.borderColor = 'rgba(0,212,255,0.5)';
          btn.style.boxShadow = '0 0 8px rgba(0,212,255,0.2)';
          btn.style.color = '#fff';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('active')) {
          btn.style.background = 'rgba(255,255,255,0.02)';
          btn.style.borderColor = 'rgba(255,255,255,0.08)';
          btn.style.boxShadow = 'none';
          btn.style.color = '#b0b0c8';
        }
      });
      btn.addEventListener('click', () => {
        buttons.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'rgba(255,255,255,0.02)';
          b.style.borderColor = 'rgba(255,255,255,0.08)';
          b.style.color = '#b0b0c8';
          b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(0,212,255,0.15)';
        btn.style.borderColor = '#00d4ff';
        btn.style.color = '#00d4ff';
        btn.style.boxShadow = '0 0 10px rgba(0,212,255,0.25), inset 0 0 8px rgba(0,212,255,0.1)';
        this.currentMode = btn.dataset.mode as RenderMode;
        this.callbacks.onSetRenderMode(this.currentMode);
        this.updateFloatButtonMode(this.currentMode);
      });
    });
  }

  private buildSettingsSection(): void {
    this.settingsSection = document.createElement('div');
    this.settingsSection.style.cssText = `
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    `;
    this.settingsSection.innerHTML = `
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;margin-bottom:2px;font-weight:700;">◈ 交互设置</div>

      <div class="slider-group">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
          <span style="font-size:12px;opacity:0.75;">旋转速度</span>
          <span id="rot-val" style="font-size:11px;font-family:'Courier New',monospace;color:#00d4ff;font-weight:700;">1.00</span>
        </div>
        <input id="rot-slider" type="range" min="0.1" max="3" step="0.05" value="1">
      </div>

      <div class="slider-group">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
          <span style="font-size:12px;opacity:0.75;">缩放速度</span>
          <span id="zoom-val" style="font-size:11px;font-family:'Courier New',monospace;color:#00d4ff;font-weight:700;">1.00</span>
        </div>
        <input id="zoom-slider" type="range" min="0.1" max="3" step="0.05" value="1">
      </div>

      <label class="toggle-row" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding-top:4px;">
        <span style="font-size:12px;opacity:0.75;">自动旋转</span>
        <div class="toggle-wrap" style="position:relative;width:40px;height:22px;">
          <input id="auto-rotate-toggle" type="checkbox" style="display:none;">
          <div class="toggle-track" style="
            position:absolute;inset:0;border-radius:11px;
            background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);
            transition:all 0.25s ease;
          "></div>
          <div class="toggle-thumb" style="
            position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;
            background:#888;transition:all 0.25s ease;
          "></div>
        </div>
      </label>
    `;
    this.sidebarContent.appendChild(this.settingsSection);

    const rotSlider = this.settingsSection.querySelector('#rot-slider') as HTMLInputElement;
    const rotVal = this.settingsSection.querySelector('#rot-val') as HTMLSpanElement;
    const zoomSlider = this.settingsSection.querySelector('#zoom-slider') as HTMLInputElement;
    const zoomVal = this.settingsSection.querySelector('#zoom-val') as HTMLSpanElement;
    const autoRotateInput = this.settingsSection.querySelector('#auto-rotate-toggle') as HTMLInputElement;
    const toggleTrack = this.settingsSection.querySelector('.toggle-track') as HTMLDivElement;
    const toggleThumb = this.settingsSection.querySelector('.toggle-thumb') as HTMLDivElement;

    const applySliderStyle = (slider: HTMLInputElement) => {
      const style = document.createElement('style');
      style.textContent = `
        #${slider.id} {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        #${slider.id}::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00d4ff;
          box-shadow: 0 0 8px rgba(0,212,255,0.6), 0 2px 4px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: all 0.18s ease;
          border: 2px solid #fff;
        }
        #${slider.id}::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 0 14px #00d4ff, 0 4px 8px rgba(0,0,0,0.4);
        }
        #${slider.id}::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00d4ff;
          box-shadow: 0 0 8px rgba(0,212,255,0.6);
          cursor: pointer;
          border: 2px solid #fff;
        }
      `;
      document.head.appendChild(style);
    };
    applySliderStyle(rotSlider);
    applySliderStyle(zoomSlider);

    rotSlider.addEventListener('input', () => {
      this.rotationSpeed = Number(rotSlider.value);
      rotVal.textContent = this.rotationSpeed.toFixed(2);
      this.callbacks.onSetRotationSpeed(this.rotationSpeed);
    });
    zoomSlider.addEventListener('input', () => {
      this.zoomSpeed = Number(zoomSlider.value);
      zoomVal.textContent = this.zoomSpeed.toFixed(2);
      this.callbacks.onSetZoomSpeed(this.zoomSpeed);
    });
    const setToggle = (on: boolean) => {
      this.autoRotate = on;
      toggleTrack.style.background = on ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.1)';
      toggleTrack.style.borderColor = on ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.12)';
      toggleThumb.style.left = on ? '21px' : '3px';
      toggleThumb.style.background = on ? '#00d4ff' : '#888';
      toggleThumb.style.boxShadow = on ? '0 0 8px #00d4ff' : 'none';
      autoRotateInput.checked = on;
      this.callbacks.onToggleAutoRotate(this.autoRotate);
    };
    autoRotateInput.addEventListener('change', () => setToggle(autoRotateInput.checked));
    setToggle(false);
  }

  private buildFloatButtons(): void {
    this.floatButtons = document.createElement('div');
    this.floatButtons.style.cssText = `
      position: absolute;
      left: 16px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 50;
    `;
    const configs = [
      { id: 'btn-reset', icon: '⟳', label: '重置视角', color: '#00d4ff' },
      { id: 'btn-mode', icon: '◉', label: '球棍', color: '#00d4ff' },
      { id: 'btn-load', icon: '＋', label: '载入分子', color: '#00d4ff' }
    ];
    const mainWrap = document.createElement('div');
    mainWrap.style.cssText = `
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      background: #2a2a3e;
      border: 1px solid rgba(0, 212, 255, 0.18);
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    `;
    configs.forEach(cfg => {
      const btn = document.createElement('button');
      btn.id = cfg.id;
      btn.title = cfg.label;
      btn.style.cssText = `
        width: 44px;
        height: 44px;
        border-radius: 9px;
        border: 1.5px solid rgba(0,212,255,0.25);
        background: linear-gradient(145deg, rgba(0,212,255,0.08), rgba(0,212,255,0.02));
        color: #e0e0f0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 700;
        transition: all 0.22s ease;
        font-family: inherit;
        user-select: none;
      `;
      btn.innerHTML = `
        <div style="line-height:1;">${cfg.icon}</div>
        <div style="font-size:9px;margin-top:2px;font-weight:500;opacity:0.75;letter-spacing:0.3px;">${cfg.label}</div>
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'linear-gradient(145deg, rgba(0,212,255,0.22), rgba(0,212,255,0.08))';
        btn.style.borderColor = cfg.color;
        btn.style.color = '#ffffff';
        btn.style.boxShadow = '0 0 12px #00d4ff, inset 0 0 8px rgba(0,212,255,0.2)';
        btn.style.transform = 'translateY(-2px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'linear-gradient(145deg, rgba(0,212,255,0.08), rgba(0,212,255,0.02))';
        btn.style.borderColor = 'rgba(0,212,255,0.25)';
        btn.style.color = '#e0e0f0';
        btn.style.boxShadow = 'none';
        btn.style.transform = 'translateY(0)';
      });
      mainWrap.appendChild(btn);
    });
    this.floatButtons.appendChild(mainWrap);

    (mainWrap.querySelector('#btn-reset') as HTMLButtonElement).addEventListener('click', () => {
      this.callbacks.onResetView();
    });
    (mainWrap.querySelector('#btn-mode') as HTMLButtonElement).addEventListener('click', () => {
      const modes: RenderMode[] = ['ball-stick', 'space-fill', 'wireframe'];
      const idx = modes.indexOf(this.currentMode);
      const next = modes[(idx + 1) % modes.length];
      this.setRenderModeExternal(next);
    });
    (mainWrap.querySelector('#btn-load') as HTMLButtonElement).addEventListener('click', () => {
      this.scrollInputIntoView();
    });

    this.container.appendChild(this.floatButtons);
  }

  private updateFloatButtonMode(mode: RenderMode): void {
    const btn = this.floatButtons.querySelector('#btn-mode') as HTMLButtonElement;
    if (!btn) return;
    const labels: Record<RenderMode, string> = {
      'ball-stick': '球棍',
      'space-fill': '填充',
      'wireframe': '线框'
    };
    const icons: Record<RenderMode, string> = {
      'ball-stick': '◉',
      'space-fill': '●',
      'wireframe': '◎'
    };
    btn.innerHTML = `
      <div style="line-height:1;">${icons[mode]}</div>
      <div style="font-size:9px;margin-top:2px;font-weight:500;opacity:0.75;letter-spacing:0.3px;">${labels[mode]}</div>
    `;
  }

  private buildInputSection(): void {
    this.inputSection = document.createElement('div');
    this.inputSection.style.cssText = `
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: min(520px, calc(100vw - 40px));
      z-index: 50;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    const inputWrap = document.createElement('div');
    inputWrap.style.cssText = `
      display: flex;
      gap: 10px;
      padding: 10px;
      background: rgba(20, 20, 40, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 14px;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    `;
    this.smilesInput = document.createElement('input');
    this.smilesInput.type = 'text';
    this.smilesInput.placeholder = '输入 SMILES 字符串，例如：c1ccccc1、CCO、O';
    this.smilesInput.spellcheck = false;
    this.smilesInput.style.cssText = `
      flex: 1;
      padding: 10px 14px;
      border-radius: 9px;
      border: 1.5px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.25);
      color: #fff;
      font-size: 13px;
      font-family: 'Courier New', 'Consolas', monospace;
      outline: none;
      transition: all 0.2s ease;
    `;
    this.smilesInput.addEventListener('focus', () => {
      this.smilesInput.style.borderColor = '#00d4ff';
      this.smilesInput.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.15), 0 0 12px rgba(0,212,255,0.2)';
    });
    this.smilesInput.addEventListener('blur', () => {
      this.smilesInput.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      this.smilesInput.style.boxShadow = 'none';
    });
    this.smilesInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.loadInputSMILES();
    });
    const loadBtn = document.createElement('button');
    loadBtn.textContent = '载入';
    loadBtn.style.cssText = `
      padding: 10px 20px;
      border-radius: 9px;
      border: 1.5px solid #00d4ff;
      background: linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,212,255,0.1));
      color: #00d4ff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.22s ease;
      letter-spacing: 1px;
      font-family: inherit;
    `;
    loadBtn.addEventListener('mouseenter', () => {
      loadBtn.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.45), rgba(0,212,255,0.2))';
      loadBtn.style.color = '#fff';
      loadBtn.style.boxShadow = '0 0 16px #00d4ff, 0 4px 12px rgba(0,212,255,0.3)';
      loadBtn.style.transform = 'translateY(-1px)';
    });
    loadBtn.addEventListener('mouseleave', () => {
      loadBtn.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,212,255,0.1))';
      loadBtn.style.color = '#00d4ff';
      loadBtn.style.boxShadow = 'none';
      loadBtn.style.transform = 'translateY(0)';
    });
    loadBtn.addEventListener('click', () => this.loadInputSMILES());

    inputWrap.appendChild(this.smilesInput);
    inputWrap.appendChild(loadBtn);
    this.inputSection.appendChild(inputWrap);

    this.presetButtons = document.createElement('div');
    this.presetButtons.style.cssText = `
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: center;
      padding: 8px;
      background: rgba(20, 20, 40, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
    `;
    const presets = getPresetList();
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.textContent = p.name;
      btn.dataset.preset = p.key;
      btn.style.cssText = `
        padding: 6px 12px;
        border-radius: 7px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        color: #c0c0d8;
        font-size: 11.5px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        font-family: inherit;
        font-weight: 500;
      `;
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = '#00d4ff';
        btn.style.background = 'rgba(0,212,255,0.1)';
        btn.style.color = '#00d4ff';
        btn.style.boxShadow = '0 0 8px rgba(0,212,255,0.25)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = 'rgba(255,255,255,0.08)';
        btn.style.background = 'rgba(255,255,255,0.03)';
        btn.style.color = '#c0c0d8';
        btn.style.boxShadow = 'none';
      });
      btn.addEventListener('click', () => {
        this.clearPresetActive();
        btn.style.borderColor = '#00d4ff';
        btn.style.background = 'rgba(0,212,255,0.18)';
        btn.style.color = '#00d4ff';
        btn.style.fontWeight = '700';
        this.callbacks.onLoadPreset(p.key);
      });
      this.presetButtons.appendChild(btn);
    });
    this.inputSection.appendChild(this.presetButtons);

    this.container.appendChild(this.inputSection);
  }

  private clearPresetActive(): void {
    const btns = this.presetButtons.querySelectorAll('button');
    btns.forEach(b => {
      b.style.borderColor = 'rgba(255,255,255,0.08)';
      b.style.background = 'rgba(255,255,255,0.03)';
      b.style.color = '#c0c0d8';
      b.style.fontWeight = '500';
    });
  }

  private buildMobileDropdown(): void {
    this.mobileDropdown = document.createElement('div');
    this.mobileDropdown.style.cssText = `
      display: none;
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 70;
    `;
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    toggleBtn.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid rgba(0,212,255,0.25);
      background: rgba(20, 20, 40, 0.7);
      backdrop-filter: blur(8px);
      color: #00d4ff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    `;
    toggleBtn.addEventListener('click', () => this.toggleMobileDropdown());
    this.mobileDropdown.appendChild(toggleBtn);

    this.mobileDropdownContent = document.createElement('div');
    this.mobileDropdownContent.style.cssText = `
      display: none;
      position: absolute;
      top: 50px;
      left: 0;
      width: min(340px, calc(100vw - 32px));
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      padding: 14px;
      background: rgba(20, 20, 30, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 212, 255, 0.2);
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    `;
    this.mobileDropdown.appendChild(this.mobileDropdownContent);
    this.container.appendChild(this.mobileDropdown);
  }

  private toggleMobileDropdown(): void {
    const open = this.mobileDropdownContent.style.display === 'block';
    this.mobileDropdownContent.style.display = open ? 'none' : 'block';
    if (!open) {
      const clone = this.sidebarContent.cloneNode(true) as HTMLDivElement;
      this.mobileDropdownContent.innerHTML = '';
      this.mobileDropdownContent.appendChild(clone);
    }
  }

  private loadInputSMILES(): void {
    const val = this.smilesInput.value.trim();
    if (!val) return;
    this.clearPresetActive();
    this.callbacks.onLoadSMILES(val);
  }

  private scrollInputIntoView(): void {
    this.smilesInput.focus();
    this.smilesInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private attachEvents(): void {
    this.collapseBtn.addEventListener('click', () => {
      if (this.isSidebarDetached) {
        this.reattachSidebar();
      } else {
        this.toggleSidebarCollapse();
      }
    });
    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
  }

  private toggleSidebarCollapse(): void {
    const collapsed = this.sidebar.dataset.collapsed === 'true';
    if (collapsed) {
      this.sidebar.dataset.collapsed = 'false';
      this.sidebarContent.style.display = 'flex';
      this.sidebar.style.width = '320px';
      this.sidebar.style.opacity = '1';
      this.collapseBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      `;
    } else {
      this.sidebar.dataset.collapsed = 'true';
      this.sidebarContent.style.display = 'none';
      this.sidebar.style.width = 'auto';
      this.collapseBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      `;
    }
  }

  private handleSidebarDragStart = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    const threshold = 6;
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - startX) > threshold || Math.abs(ev.clientY - startY) > threshold) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (!this.isSidebarDetached) this.detachSidebar();
        this.dragState.dragging = true;
        this.dragState.startX = ev.clientX;
        this.dragState.startY = ev.clientY;
        this.dragState.target = this.floatWindow || this.sidebar;
        const rect = this.dragState.target!.getBoundingClientRect();
        this.dragState.origX = rect.left;
        this.dragState.origY = rect.top;
        this.dragState.target!.style.transition = 'none';
      }
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    void target;
  };

  private detachSidebar(): void {
    this.floatWindow = document.createElement('div');
    const rect = this.sidebar.getBoundingClientRect();
    this.floatWindow.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      max-height: calc(100vh - 32px);
      background: rgba(20, 20, 30, 0.92);
      backdrop-filter: blur(20px) saturate(150%);
      -webkit-backdrop-filter: blur(20px) saturate(150%);
      border: 1.5px solid rgba(0, 212, 255, 0.3);
      border-radius: 16px;
      z-index: 200;
      box-shadow: 0 16px 48px rgba(0,0,0,0.65), 0 0 24px rgba(0,212,255,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    const contentChildren = Array.from(this.sidebar.childNodes);
    contentChildren.forEach(child => this.floatWindow!.appendChild(child));
    this.sidebar.style.display = 'none';
    const header = this.floatWindow.querySelector('div[style*="cursor: move"]') as HTMLElement;
    if (header) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = `
        width: 26px;
        height: 26px;
        margin-right: 8px;
        border-radius: 7px;
        border: 1px solid rgba(255,80,80,0.4);
        background: rgba(255,60,60,0.12);
        color: #ff7070;
        cursor: pointer;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      `;
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255,60,60,0.25)';
        closeBtn.style.boxShadow = '0 0 8px rgba(255,60,60,0.4)';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255,60,60,0.12)';
        closeBtn.style.boxShadow = 'none';
      });
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reattachSidebar();
      });
      header.insertBefore(closeBtn, this.collapseBtn);
      header.addEventListener('mousedown', this.handleSidebarDragStart);
    }
    this.collapseBtn.addEventListener('click', () => {
      if (this.isSidebarDetached) this.reattachSidebar();
    });
    document.body.appendChild(this.floatWindow);
    this.isSidebarDetached = true;
  }

  private reattachSidebar(): void {
    if (!this.floatWindow || !this.isSidebarDetached) return;
    const children = Array.from(this.floatWindow.childNodes);
    children.forEach(child => this.sidebar.appendChild(child));
    this.sidebar.style.display = 'flex';
    const header = this.sidebar.querySelector('div[style*="cursor: move"]') as HTMLElement;
    if (header) {
      const close = header.querySelector('button');
      if (close && close !== this.collapseBtn) close.remove();
    }
    this.floatWindow.remove();
    this.floatWindow = null;
    this.isSidebarDetached = false;
    this.sidebar.style.transition = '';
  }

  private handleDragMove = (e: MouseEvent): void => {
    if (!this.dragState.dragging || !this.dragState.target) return;
    const dx = e.clientX - this.dragState.startX;
    const dy = e.clientY - this.dragState.startY;
    const nx = Math.max(0, Math.min(window.innerWidth - 300, this.dragState.origX + dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 80, this.dragState.origY + dy));
    const t = this.dragState.target;
    t.style.left = `${nx}px`;
    t.style.top = `${ny}px`;
    t.style.right = 'auto';
    t.style.position = 'fixed';
  };

  private handleDragEnd = (): void => {
    if (!this.dragState.dragging) return;
    this.dragState.dragging = false;
    if (this.dragState.target) {
      this.dragState.target.style.transition = '';
    }
    this.dragState.target = null;
  };

  private updateResponsive = (): void => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.mobileDropdown.style.display = 'block';
      this.sidebar.style.display = 'none';
      this.inputSection.style.top = '12px';
      this.inputSection.style.width = 'calc(100vw - 24px)';
      this.floatButtons.style.left = '12px';
      this.floatButtons.style.bottom = '12px';
      this.hud.style.top = '12px';
      this.hud.style.right = '70px';
    } else {
      this.mobileDropdown.style.display = 'none';
      this.mobileDropdownContent.style.display = 'none';
      if (!this.isSidebarDetached) this.sidebar.style.display = 'flex';
      this.inputSection.style.top = '16px';
      this.inputSection.style.width = 'min(520px, calc(100vw - 40px))';
    }
  };

  public setFps(fps: number): void {
    this.fpsEl.textContent = `${fps}`;
    if (fps >= 55) this.fpsEl.style.color = '#00ff88';
    else if (fps >= 35) this.fpsEl.style.color = '#ffcc00';
    else this.fpsEl.style.color = '#ff4466';
  }

  public setMolecule(data: MoleculeData): void {
    this.currentMolecule = data;
    this.nameEl.textContent = data.name;
    this.formulaEl.textContent = data.formula;
    this.weightEl.innerHTML = `${data.molecularWeight.toFixed(2)} <span style="opacity:0.5;font-weight:400;font-size:11px;">g/mol</span>`;
    this.atomCountEl.textContent = String(data.atoms.length);
    this.bondCountEl.textContent = String(data.bonds.length);
  }

  public setSelectedAtom(index: number | null): void {
    if (!this.currentMolecule || index === null || index < 0 || index >= this.currentMolecule.atoms.length) {
      this.selectedAtomEl.innerHTML = `
        <div style="font-size:12px;color:rgba(255,255,255,0.4);text-align:center;padding:8px 4px;line-height:1.6;">
          左键或双击<br>场景中的原子查看信息
        </div>
      `;
      this.atomInfoSection.style.borderColor = 'rgba(0, 212, 255, 0.15)';
      this.atomInfoSection.style.boxShadow = 'none';
      return;
    }
    const atom = this.currentMolecule.atoms[index];
    const connections = this.currentMolecule.bonds
      .filter(b => b.from === index || b.to === index)
      .map(b => {
        const otherIdx = b.from === index ? b.to : b.from;
        const other = this.currentMolecule!.atoms[otherIdx];
        const bondName = ['', '单', '双', '三'][b.type] || `${b.type}`;
        return { idx: otherIdx, element: other.element, bond: bondName, type: b.type };
      });
    this.atomInfoSection.style.borderColor = 'rgba(0, 212, 255, 0.5)';
    this.atomInfoSection.style.boxShadow = '0 0 16px rgba(0,212,255,0.15)';
    this.selectedAtomEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="
          width:42px;height:42px;border-radius:12px;
          background:${atom.color};
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:15px;color:${this.getTextForBg(atom.color)};
          border:2px solid rgba(255,255,255,0.2);
          box-shadow:0 0 12px ${atom.color}55, inset 0 1px 0 rgba(255,255,255,0.3);
        ">${atom.element}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#fff;">${atom.element} <span style="font-size:11px;opacity:0.5;">#${index + 1}</span></div>
          <div style="font-size:11px;opacity:0.6;">范德华半径 ${atom.vdwRadius.toFixed(2)}Å · 质量 ${atom.mass.toFixed(2)}</div>
        </div>
      </div>
      <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#00d4ff;opacity:0.7;margin-bottom:6px;font-weight:700;">三维坐标</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px;">
        <div style="padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:7px;border:1px solid rgba(255,255,255,0.04);">
          <div style="font-size:9px;opacity:0.5;letter-spacing:1px;">X</div>
          <div style="font-size:12px;font-weight:700;color:#ff6b6b;font-family:'Courier New',monospace;">${atom.position.x.toFixed(3)}</div>
        </div>
        <div style="padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:7px;border:1px solid rgba(255,255,255,0.04);">
          <div style="font-size:9px;opacity:0.5;letter-spacing:1px;">Y</div>
          <div style="font-size:12px;font-weight:700;color:#51cf66;font-family:'Courier New',monospace;">${atom.position.y.toFixed(3)}</div>
        </div>
        <div style="padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:7px;border:1px solid rgba(255,255,255,0.04);">
          <div style="font-size:9px;opacity:0.5;letter-spacing:1px;">Z</div>
          <div style="font-size:12px;font-weight:700;color:#4dabf7;font-family:'Courier New',monospace;">${atom.position.z.toFixed(3)}</div>
        </div>
      </div>
      <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#00d4ff;opacity:0.7;margin-bottom:6px;font-weight:700;">连接原子 (${connections.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;max-height:74px;overflow-y:auto;">
        ${connections.length === 0
          ? '<div style="font-size:11px;opacity:0.4;padding:4px;">无连接</div>'
          : connections.map(c => `
          <div style="padding:4px 8px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:6px;font-size:10.5px;display:flex;align-items:center;gap:4px;">
            <span style="width:16px;height:16px;border-radius:4px;background:${this.currentMolecule!.atoms[c.idx].color};color:${this.getTextForBg(this.currentMolecule!.atoms[c.idx].color)};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">${c.element}</span>
            <span style="font-weight:600;">${c.element}</span>
            <span style="opacity:0.5;">#${c.idx + 1}</span>
            <span style="color:#00d4ff;font-weight:700;">${c.bond}键</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  public setRenderModeExternal(mode: RenderMode): void {
    const group = document.getElementById('render-mode-group');
    if (group) {
      const btns = group.querySelectorAll('.mode-btn') as NodeListOf<HTMLButtonElement>;
      btns.forEach(b => {
        if (b.dataset.mode === mode) (b as HTMLButtonElement).click();
      });
    } else {
      this.currentMode = mode;
      this.callbacks.onSetRenderMode(mode);
      this.updateFloatButtonMode(mode);
    }
  }

  private getTextForBg(hex: string): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.55 ? '#1a1a2e' : '#ffffff';
  }

  public dispose(): void {
    window.removeEventListener('resize', this.updateResponsive);
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);
    [this.hud, this.sidebar, this.floatButtons, this.inputSection, this.mobileDropdown].forEach(el => el.remove());
    if (this.floatWindow) this.floatWindow.remove();
  }
}
