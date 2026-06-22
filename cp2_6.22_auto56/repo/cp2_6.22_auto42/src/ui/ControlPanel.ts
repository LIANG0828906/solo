// 控制面板UI模块：渲染滑块控制模拟速度、时间轴进度条、3D/2D视角切换按钮、热力图开关
// 数据流向：用户交互触发事件，调用场景的update方法并传入参数

import type { DisasterLevel } from '@/data/DataService';

export interface ControlPanelEvents {
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onTimeStepChange?: (step: number) => void;
  onSpeedChange?: (mult: number) => void;
  onViewToggle?: (mode: 'perspective3d' | 'ortho2d') => void;
  onHeatmapToggle?: (enabled: boolean) => void;
}

interface StatsSnapshot {
  step: number;
  total: number;
  windSpeed: number;
  pressure: number;
  category: number;
  lat: number;
  lng: number;
}

const SPEED_OPTIONS: number[] = [0.5, 1, 1.5, 2, 3];

export class ControlPanel {
  private root: HTMLElement;
  private container: HTMLElement;
  private mobileToggle: HTMLElement;
  private drawerContainer: HTMLElement | null = null;
  private mobileOpen = false;

  private playBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private timeSlider!: HTMLInputElement;
  private timeLabel!: HTMLElement;
  private speedGroup!: HTMLElement;
  private viewBtn!: HTMLButtonElement;
  private heatBtn!: HTMLButtonElement;
  private statsEl!: HTMLElement;

  private isPlaying = false;
  private heatmapEnabled = true;
  private viewMode: 'perspective3d' | 'ortho2d' = 'perspective3d';
  private currentSpeedMult = 1;

  private events: ControlPanelEvents;
  private collapsed = false;

  private mqLg = window.matchMedia('(min-width: 1201px)');
  private mqMd = window.matchMedia('(min-width: 768px) and (max-width: 1200px)');

  constructor(parent: HTMLElement, events: ControlPanelEvents = {}) {
    this.events = events;
    this.root = parent;
    // 移动端抽屉容器
    this.drawerContainer = document.createElement('aside');
    this.drawerContainer.className = 'tp-drawer';
    Object.assign(this.drawerContainer.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: 'min(82%, 320px)',
      height: '100%',
      background: 'rgba(18,26,54,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(120,180,255,0.18)',
      zIndex: '40',
      transform: 'translateX(-105%)',
      transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      padding: '24px 16px 32px',
      overflowY: 'auto',
      pointerEvents: 'none',
    } as unknown as CSSStyleDeclaration);
    document.body.appendChild(this.drawerContainer);

    // 汉堡按钮（小屏）
    this.mobileToggle = document.createElement('button');
    Object.assign(this.mobileToggle.style, {
      position: 'fixed',
      top: '14px',
      right: '14px',
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, rgba(0,180,216,0.85), rgba(0,119,182,0.85))',
      color: '#fff',
      border: 'none',
      cursor: 'pointer',
      display: 'none',
      zIndex: '50',
      boxShadow: '0 4px 14px rgba(0,180,216,0.35)',
    } as CSSStyleDeclaration);
    this.mobileToggle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    `;
    this.mobileToggle.addEventListener('click', () => this.setMobileDrawer(!this.mobileOpen));
    document.body.appendChild(this.mobileToggle);

    this.container = document.createElement('div');
    this.buildStructure();

    this.applyResponsiveLayout();
    this.mqLg.addEventListener('change', () => this.applyResponsiveLayout());
    this.mqMd.addEventListener('change', () => this.applyResponsiveLayout());
    window.addEventListener('resize', () => this.applyResponsiveLayout());
  }

  private applyResponsiveLayout(): void {
    const w = window.innerWidth;
    if (w < 768) {
      // 小屏：抽屉
      this.mobileToggle.style.display = 'flex';
      this.mobileToggle.style.alignItems = 'center';
      this.mobileToggle.style.justifyContent = 'center';
      if (this.drawerContainer && this.container.parentElement !== this.drawerContainer) {
        this.drawerContainer.appendChild(this.container);
      }
      // 底部容器保持为空
      if (!this.root.contains(this.container)) {
        // already in drawer
      }
      // 确保父容器不再显示container
      if (this.root.contains(this.container) && this.container.parentElement === this.root) {
        this.root.removeChild(this.container);
      }
      // 抽屉自适应样式
      this.container.style.cssText = `
        position:relative !important;
        left:auto !important; right:auto !important;
        bottom:auto !important;
        transform:none !important;
        width:100% !important;
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      `;
    } else if (w <= 1200) {
      // 中屏：底部折叠
      this.mobileToggle.style.display = 'none';
      this.setMobileDrawer(false);
      if (this.root && !this.root.contains(this.container)) {
        this.root.appendChild(this.container);
      }
      this.collapsed = true;
      this.applyBottomStyle();
    } else {
      // 大屏：全功能底部栏
      this.mobileToggle.style.display = 'none';
      this.setMobileDrawer(false);
      if (this.root && !this.root.contains(this.container)) {
        this.root.appendChild(this.container);
      }
      this.collapsed = false;
      this.applyBottomStyle();
    }
  }

  private setMobileDrawer(open: boolean): void {
    this.mobileOpen = open;
    if (this.drawerContainer) {
      this.drawerContainer.style.transform = open ? 'translateX(0)' : 'translateX(-105%)';
      this.drawerContainer.style.pointerEvents = open ? 'auto' : 'none';
    }
  }

  private applyBottomStyle(): void {
    this.container.style.position = 'fixed';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.bottom = '28px';
    this.container.style.background = 'rgba(255,255,255,0.08)';
    this.container.style.backdropFilter = 'blur(10px)';
    (this.container.style as any).WebkitBackdropFilter = 'blur(10px)';
    this.container.style.border = '1px solid rgba(255,255,255,0.12)';
    this.container.style.borderRadius = '16px';
    this.container.style.boxShadow = '0 10px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)';
    this.container.style.padding = this.collapsed ? '10px 16px' : '18px 24px';
    this.container.style.width = this.collapsed ? 'auto' : 'min(1160px, calc(100% - 48px))';
    this.container.style.zIndex = '30';
    this.container.style.transition = 'all 0.3s ease';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = this.collapsed ? '0' : '14px';

    // 折叠态：中屏
    const small: HTMLElement = this.container.querySelector('.cp-small') as HTMLElement;
    const full: HTMLElement = this.container.querySelector('.cp-full') as HTMLElement;
    if (this.collapsed) {
      if (small) small.style.display = 'flex';
      if (full) full.style.display = 'none';
    } else {
      if (small) small.style.display = 'none';
      if (full) full.style.display = 'block';
    }
  }

  // ========== 构建DOM ==========
  private buildStructure(): void {
    this.container.innerHTML = '';

    // 中屏折叠态的小图标栏
    const smallRow = document.createElement('div');
    smallRow.className = 'cp-small';
    smallRow.style.cssText = 'display:none; gap:10px; align-items:center;';
    smallRow.innerHTML = this.iconsRowHTML();
    this.container.appendChild(smallRow);

    // 完整功能区
    const full = document.createElement('div');
    full.className = 'cp-full';
    full.innerHTML = this.fullPanelHTML();
    this.container.appendChild(full);

    // 绑定引用
    this.playBtn = full.querySelector('#cp-play') as HTMLButtonElement;
    this.resetBtn = full.querySelector('#cp-reset') as HTMLButtonElement;
    this.timeSlider = full.querySelector('#cp-time') as HTMLInputElement;
    this.timeLabel = full.querySelector('#cp-time-label') as HTMLElement;
    this.speedGroup = full.querySelector('#cp-speed-group') as HTMLElement;
    this.viewBtn = full.querySelector('#cp-view') as HTMLButtonElement;
    this.heatBtn = full.querySelector('#cp-heat') as HTMLButtonElement;
    this.statsEl = full.querySelector('#cp-stats') as HTMLElement;

    this.bindActions(full);

    // 折叠态绑定（复制到smallRow也有效）
    this.bindSmallRowActions(smallRow);
  }

  private iconsRowHTML(): string {
    return `
      <button data-act="play" title="播放/暂停" class="icon-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      </button>
      <button data-act="reset" title="重置" class="icon-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
      <button data-act="view" title="视角切换" class="icon-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button data-act="heat" title="热力图" class="icon-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s1 1 1 2c0 1 1 1 1 0 0-3 1-7 1-7Z"/></svg>
      </button>
      <div class="time-chip" style="margin-left:12px; color:#9ed4ff; font-size:13px; letter-spacing:0.5px;">T <span data-time="label">00/72</span></div>
    `;
  }

  private fullPanelHTML(): string {
    const speedBtns = SPEED_OPTIONS.map(s => `
      <button type="button" data-speed="${s}" class="speed-btn ${s === 1 ? 'active' : ''}">${s}x</button>
    `).join('');

    return `
      <style>
        .tp-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          padding: 10px 16px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
          color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,180,216,0.25), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: all 0.2s ease;
        }
        .tp-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(0,180,216,0.45), 0 0 0 3px rgba(0,180,216,0.18); }
        .tp-btn:active { transform: translateY(0); }
        .tp-btn.ghost {
          background: rgba(255,255,255,0.08);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        }
        .tp-btn.ghost:hover { background: rgba(255,255,255,0.16); box-shadow: 0 4px 18px rgba(0,0,0,0.3), 0 0 0 3px rgba(0,180,216,0.14); }
        .tp-btn.ghost.on { background: linear-gradient(135deg, rgba(239,68,68,0.85), rgba(249,115,22,0.85)); box-shadow: 0 4px 16px rgba(239,68,68,0.35); }
        .tp-btn svg { flex-shrink: 0; }
        .cp-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .cp-row + .cp-row { margin-top: 12px; }
        .time-wrap { flex:1; min-width:260px; }
        .time-label-row { display:flex; justify-content:space-between; margin-bottom:6px; color:#b6d5ff; font-size:12px; }
        input[type=range].tp-range {
          -webkit-appearance:none; appearance:none; width:100%; height:6px;
          background: linear-gradient(90deg, #00b4d8 0%, #0077b6 var(--val,0%), rgba(255,255,255,0.12) var(--val,0%));
          border-radius: 99px; outline: none; cursor:pointer;
        }
        input[type=range].tp-range::-webkit-slider-thumb {
          -webkit-appearance:none; appearance:none;
          width:18px; height:18px; border-radius:50%;
          background: linear-gradient(135deg, #90e0ef, #00b4d8);
          box-shadow: 0 0 0 4px rgba(0,180,216,0.18), 0 2px 10px rgba(0,180,216,0.6);
          cursor:pointer; border: 2px solid #fff;
          transition: transform 0.15s ease;
        }
        input[type=range].tp-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        input[type=range].tp-range::-moz-range-thumb {
          width:18px; height:18px; border-radius:50%;
          background: linear-gradient(135deg, #90e0ef, #00b4d8);
          box-shadow: 0 0 0 4px rgba(0,180,216,0.18), 0 2px 10px rgba(0,180,216,0.6);
          cursor:pointer; border: 2px solid #fff;
        }
        .speed-group { display:inline-flex; background: rgba(255,255,255,0.06); border-radius:10px; padding:3px; gap:3px; }
        .speed-btn {
          padding: 7px 12px; font-size: 12px; font-weight:600; color:#b8ccf5;
          border-radius: 8px; border:none; background: transparent; cursor:pointer;
          transition: all 0.2s ease;
        }
        .speed-btn:hover { color:#fff; background: rgba(255,255,255,0.08); }
        .speed-btn.active { background: linear-gradient(135deg, #00b4d8, #0077b6); color:#fff; box-shadow:0 2px 8px rgba(0,180,216,0.4); }
        .stats-bar { display:flex; gap:18px; flex-wrap:wrap; color:#c7ddff; font-size:12px; }
        .stat-item { display:flex; flex-direction:column; gap:2px; }
        .stat-label { color: rgba(180,200,255,0.55); font-size:11px; letter-spacing:0.5px; text-transform: uppercase; }
        .stat-value { font-size:16px; font-weight:600; color:#e6f3ff; }
        .stat-value.hi { color:#ff7676; }
        .stat-value.mid { color:#ffb454; }
        .stat-value.lo { color:#9fd6ff; }
        .cat-pill { display:inline-flex; align-items:center; padding: 3px 10px; border-radius: 99px; font-size:12px; font-weight:700; background: rgba(0,0,0,0.3); }
        .cat-pill.cat-0 { color:#9fd6ff; box-shadow: inset 0 0 0 1px rgba(159,214,255,0.4); }
        .cat-pill.cat-1 { color:#d6f0ff; box-shadow: inset 0 0 0 1px rgba(159,214,255,0.6); }
        .cat-pill.cat-2 { color:#ffd580; box-shadow: inset 0 0 0 1px rgba(255,213,128,0.5); }
        .cat-pill.cat-3 { color:#ff9f5a; box-shadow: inset 0 0 0 1px rgba(255,159,90,0.55); }
        .cat-pill.cat-4 { color:#ff7a6a; box-shadow: inset 0 0 0 1px rgba(255,122,106,0.55); }
        .cat-pill.cat-5 { color:#ff4d6a; box-shadow: inset 0 0 0 1px rgba(255,77,106,0.65), 0 0 14px rgba(255,77,106,0.4); }

        .icon-btn {
          width: 38px; height:38px; border-radius:10px; border:none;
          background: rgba(255,255,255,0.08);
          color:#cfe4ff; display:inline-flex; align-items:center; justify-content:center;
          cursor: pointer; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
          transition: all 0.2s ease;
        }
        .icon-btn:hover { background: rgba(0,180,216,0.25); color:#fff; transform: translateY(-1px); box-shadow: inset 0 0 0 1px rgba(0,180,216,0.55), 0 6px 18px rgba(0,180,216,0.3); }
        .icon-btn.on { background: linear-gradient(135deg, #00b4d8, #0077b6); box-shadow: 0 4px 14px rgba(0,180,216,0.4); color:#fff; }
        .time-chip { padding:6px 12px; border-radius: 99px; background: rgba(0,180,216,0.14); border: 1px solid rgba(0,180,216,0.35); font-variant-numeric: tabular-nums; }
        .divider-v { width:1px; height:22px; background: rgba(255,255,255,0.15); margin: 0 2px; }
        .drawer-section-title { font-size: 11px; text-transform: uppercase; color: rgba(180,200,255,0.55); letter-spacing: 1px; margin: 18px 2px 8px; }
      </style>

      <div class="cp-row">
        <button id="cp-play" type="button" class="tp-btn" title="播放 / 暂停">
          <svg id="cp-play-ico" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          <span id="cp-play-txt">播放</span>
        </button>
        <button id="cp-reset" type="button" class="tp-btn ghost" title="重置到起点">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
          <span>重置</span>
        </button>
        <div class="divider-v"></div>
        <div class="speed-group" id="cp-speed-group" role="group" aria-label="播放速度">
          ${speedBtns}
        </div>
        <div style="flex:1"></div>
        <button id="cp-heat" type="button" class="tp-btn ghost on" title="显示/隐藏灾情热力图">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s1 1 1 2c0 1 1 1 1 0 0-3 1-7 1-7Z"/></svg>
          <span>热力图</span>
        </button>
        <button id="cp-view" type="button" class="tp-btn ghost" title="在3D和2D俯视视角间切换">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>2D 俯视</span>
        </button>
      </div>

      <div class="cp-row">
        <div class="time-wrap">
          <div class="time-label-row">
            <span>台风生命周期时间轴</span>
            <span id="cp-time-label" style="font-weight:600; font-variant-numeric: tabular-nums;">T+00 h / 共 72 h</span>
          </div>
          <input id="cp-time" class="tp-range" type="range" min="0" max="71" step="1" value="0" style="--val:0%;"/>
        </div>
      </div>

      <div class="cp-row" style="padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1);">
        <div id="cp-stats" class="stats-bar" style="flex:1;">
          ${this.initialStatsHTML()}
        </div>
      </div>
    `;
  }

  private initialStatsHTML(): string {
    return `
      <div class="stat-item">
        <div class="stat-label">风速 km/h</div>
        <div class="stat-value lo" data-stat="wind">—</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">气压 hPa</div>
        <div class="stat-value" data-stat="pres">—</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">等级</div>
        <div class="stat-value"><span class="cat-pill cat-0" data-stat="cat">TD</span></div>
      </div>
      <div class="stat-item">
        <div class="stat-label">中心位置</div>
        <div class="stat-value" style="font-size: 14px; font-variant-numeric: tabular-nums;" data-stat="pos">—</div>
      </div>
    `;
  }

  private bindActions(full: HTMLElement): void {
    this.playBtn.addEventListener('click', () => {
      this.setPlaying(!this.isPlaying);
      if (this.isPlaying) this.events.onPlay?.(); else this.events.onPause?.();
    });
    this.resetBtn.addEventListener('click', () => {
      this.events.onReset?.();
      this.updateTimeStep(0);
    });
    // 时间滑块
    let dragging = false;
    this.timeSlider.addEventListener('mousedown', () => { dragging = true; });
    this.timeSlider.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    this.timeSlider.addEventListener('input', () => {
      const v = +this.timeSlider.value;
      const pct = (v / 71) * 100;
      this.timeSlider.style.setProperty('--val', pct + '%');
      this.updateTimeLabel(v);
    });
    this.timeSlider.addEventListener('change', () => {
      const v = +this.timeSlider.value;
      dragging = false;
      this.events.onTimeStepChange?.(v);
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    // 速度按钮
    this.speedGroup.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.dataset.speed !== undefined) {
        const v = parseFloat(t.dataset.speed);
        this.setSpeed(v);
        this.events.onSpeedChange?.(v);
      }
    });
    // 热力图
    this.heatBtn.addEventListener('click', () => {
      this.heatmapEnabled = !this.heatmapEnabled;
      this.heatBtn.classList.toggle('on', this.heatmapEnabled);
      this.events.onHeatmapToggle?.(this.heatmapEnabled);
    });
    // 视角
    this.viewBtn.addEventListener('click', () => {
      this.viewMode = this.viewMode === 'perspective3d' ? 'ortho2d' : 'perspective3d';
      const txt = this.viewBtn.querySelector('span')!;
      txt.textContent = this.viewMode === 'perspective3d' ? '2D 俯视' : '3D 透视';
      this.events.onViewToggle?.(this.viewMode);
    });
  }

  private bindSmallRowActions(row: HTMLElement): void {
    row.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!t) return;
      const act = t.dataset.act!;
      switch (act) {
        case 'play':
          this.setPlaying(!this.isPlaying);
          if (this.isPlaying) this.events.onPlay?.(); else this.events.onPause?.();
          break;
        case 'reset':
          this.events.onReset?.();
          this.updateTimeStep(0);
          break;
        case 'view': {
          this.viewMode = this.viewMode === 'perspective3d' ? 'ortho2d' : 'perspective3d';
          this.events.onViewToggle?.(this.viewMode);
          break;
        }
        case 'heat':
          this.heatmapEnabled = !this.heatmapEnabled;
          t.classList.toggle('on', this.heatmapEnabled);
          this.events.onHeatmapToggle?.(this.heatmapEnabled);
          break;
      }
    });
  }

  // ========== 公共API ==========

  setPlaying(v: boolean): void {
    this.isPlaying = v;
    const ico = this.playBtn.querySelector('#cp-play-ico');
    const txt = this.playBtn.querySelector('#cp-play-txt');
    if (v) {
      ico!.innerHTML = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';
      txt!.textContent = '暂停';
    } else {
      ico!.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
      txt!.textContent = '播放';
    }
  }

  setSpeed(mult: number): void {
    this.currentSpeedMult = mult;
    const btns = this.speedGroup.querySelectorAll<HTMLButtonElement>('.speed-btn');
    btns.forEach(b => b.classList.toggle('active', Math.abs(parseFloat(b.dataset.speed!) - mult) < 0.01));
  }

  updateTimeStep(step: number): void {
    step = Math.max(0, Math.min(71, Math.round(step)));
    this.timeSlider.value = String(step);
    const pct = (step / 71) * 100;
    this.timeSlider.style.setProperty('--val', pct + '%');
    this.updateTimeLabel(step);
    // 同步到小图标栏
    const chip = this.container.querySelector<HTMLElement>('[data-time="label"]');
    if (chip) chip.textContent = `${String(step).padStart(2, '0')}/72`;
  }

  private updateTimeLabel(step: number): void {
    this.timeLabel.textContent = `T+${String(step).padStart(2, '0')} h / 共 72 h`;
  }

  updateStats(s: StatsSnapshot): void {
    const wind = this.statsEl.querySelector<HTMLElement>('[data-stat="wind"]')!;
    const pres = this.statsEl.querySelector<HTMLElement>('[data-stat="pres"]')!;
    const cat = this.statsEl.querySelector<HTMLElement>('[data-stat="cat"]')!;
    const pos = this.statsEl.querySelector<HTMLElement>('[data-stat="pos"]')!;

    wind.textContent = s.windSpeed.toFixed(0);
    wind.className = 'stat-value ' + (s.windSpeed >= 180 ? 'hi' : s.windSpeed >= 140 ? 'mid' : 'lo');
    pres.textContent = s.pressure.toFixed(1);

    const names = ['TD', 'TS', 'CAT-1', 'CAT-2', 'CAT-3', 'CAT-4', 'CAT-5'];
    cat.textContent = names[Math.min(Math.max(s.category, 0), 5)];
    cat.className = `cat-pill cat-${Math.min(Math.max(s.category, 0), 5)}`;
    const latH = s.lat >= 0 ? 'N' : 'S';
    const lngH = s.lng >= 0 ? 'E' : 'W';
    pos.textContent = `${Math.abs(s.lat).toFixed(1)}°${latH}, ${Math.abs(s.lng).toFixed(1)}°${lngH}`;
  }

  /**
   * 灾害等级样式工具
   */
  static disasterLabel(level: DisasterLevel): { name: string; color: string; bg: string } {
    switch (level) {
      case 3: return { name: '红色预警', color: '#ff4d4d', bg: 'rgba(255,77,77,0.16)' };
      case 2: return { name: '橙色预警', color: '#ff8a3d', bg: 'rgba(255,138,61,0.16)' };
      default: return { name: '黄色预警', color: '#ffd23d', bg: 'rgba(255,210,61,0.16)' };
    }
  }
}
