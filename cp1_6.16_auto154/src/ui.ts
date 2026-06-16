import { BuildingBlock, WindParams, SimulationResult, SceneSnapshot } from './types';
import { useAppStore, generateId } from './store';

const BUILDING_COLORS = [
  '#B0BEC5',
  '#90CAF9',
  '#80CBC4',
  '#CE93D8',
  '#FFAB91',
  '#A5D6A7',
];

const DIRECTION_LABELS: Record<number, string> = {
  0: '东',
  45: '东南',
  90: '南',
  135: '西南',
  180: '西',
  225: '西北',
  270: '北',
  315: '东北',
};

function getDirectionLabel(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const candidates = Object.keys(DIRECTION_LABELS).map(Number);
  let best = candidates[0];
  let minDiff = 360;
  for (const c of candidates) {
    let d = Math.abs(norm - c);
    if (d > 180) d = 360 - d;
    if (d < minDiff) {
      minDiff = d;
      best = c;
    }
  }
  return DIRECTION_LABELS[best];
}

function createSvgIcon(pathData: string, viewBox = '0 0 24 24'): string {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;flex-shrink:0;fill:currentColor">${pathData}</svg>`;
}

const ICONS = {
  building: createSvgIcon('<path d="M3 21h18V9l-6-6H3v18zm2-2v-6h4v6H5zm6 0v-8h4v8h-4zm6 0v-6h4v6h-4zM8 9H5V5h3v4z"/>'),
  simulate: createSvgIcon('<path d="M4 4v2h5.2C8.5 7.6 7 9.2 7 11c0 2.8 2.2 5 5 5h5v-2h-5c-1.7 0-3-1.3-3-3s1.3-3 3-3h5l-2.5 2.5L19 7.5 15.5 4H4zm2 13c0 1.7 1.3 3 3 3h8v-2H9c-1.7 0-3-1.3-3-3s1.3-3 3-3h5v-2H9c-2.8 0-5 2.2-5 5z"/>'),
  streamline: createSvgIcon('<path d="M3 12c3-6 9-6 12 0s9 6 6 0c-1.5-3-3.7-4.5-6-3-3 2-3 6 0 6M2 7c3-5 10-4 12 2 1.5 4.5 6 6 6 6"/>', '0 0 26 24'),
  contour: createSvgIcon('<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-2.5-11c-.8 0-1.5.7-1.5 1.5S8.7 12 9.5 12 11 11.3 11 10.5 10.3 9 9.5 9zm5 0c-.8 0-1.5.7-1.5 1.5S13.7 12 14.5 12s1.5-.7 1.5-1.5S15.3 9 14.5 9zm-2.5 5.5c-2 0-3.5 1-4.5 2.2.9.7 2.3 1.3 4.5 1.3s3.6-.6 4.5-1.3c-1-1.2-2.5-2.2-4.5-2.2z"/>'),
  export: createSvgIcon('<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>'),
  import: createSvgIcon('<path d="M5 15h4v-3h6v3h4l-7 7-7-7zm4-11v8H5l7-7 7 7h-4V4H9z"/>'),
  trash: createSvgIcon('<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>'),
  clear: createSvgIcon('<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>'),
  wind: createSvgIcon('<path d="M14.5 17c0 1.38-1.12 2.5-2.5 2.5v-1c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5H3v-1h9c1.93 0 3.5 1.57 3.5 3.5zM21 7.5C21 5.57 19.43 4 17.5 4c-.89 0-1.69.35-2.28.92L15 5.14C15.61 4.45 16.49 4 17.5 4 19.43 4 21 5.57 21 7.5S19.43 11 17.5 11h-11v-1h11c1.93 0 3.5-1.57 3.5-3.5zM17.5 14H3v-1h14.5c.83 0 1.5-.67 1.5-1.5S18.33 10 17.5 10c-.49 0-.93.23-1.23.6L15.5 10.14C16.17 9.45 16.94 9 17.5 9c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5z"/>'),
  arrow: createSvgIcon('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'),
  speed: createSvgIcon('<path d="M20.39 8.56l-1.24 1.24c.52.79.84 1.72.84 2.74 0 2.76-2.24 5-5 5-1.02 0-1.95-.32-2.74-.84l-1.24 1.24c1.04.77 2.35 1.23 3.78 1.24 3.87-.01 7-3.14 7-7.01 0-1.43-.46-2.74-1.23-3.78zM12 4.5C7.03 4.5 3 8.53 3 13.5h1.5C4.5 9.36 7.86 6 12 6V4.5zm.5 9h-1V7h1v6.5zM19 13.5c0-3.87-3.13-7-7-7V5c4.69 0 8.5 3.81 8.5 8.5H19z"/>'),
};

export class UIManager {
  private app: HTMLElement;
  private viewportContainer: HTMLElement;
  private resultPanel: HTMLElement | null = null;
  private fileInput: HTMLInputElement;

  constructor(app: HTMLElement, viewportContainer: HTMLElement) {
    this.app = app;
    this.viewportContainer = viewportContainer;

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    this.app.appendChild(this.fileInput);

    this.buildToolPanel();
    this.buildViewportChrome();
    this.buildResultPanel();

    this.fileInput.addEventListener('change', this.onFileSelected);

    useAppStore.subscribe((state, prev) => {
      if (state.buildings !== prev.buildings || state.selectedBuildingId !== prev.selectedBuildingId) {
        this.updateBuildingList();
      }
      if (state.resultPanelOpen !== prev.resultPanelOpen) {
        this.toggleResultPanel(state.resultPanelOpen);
      }
      if (state.simulationResult !== prev.simulationResult) {
        this.updateResultPanel(state.simulationResult);
      }
      if (state.windParams !== prev.windParams) {
        this.updateWindUI(state.windParams);
      }
      if (state.visualizationMode !== prev.visualizationMode) {
        this.updateVisModeButtons(state.visualizationMode);
      }
      if (state.isSimulating !== prev.isSimulating) {
        this.updateSimulateButton(state.isSimulating);
      }
      if (state.mouseCoord !== prev.mouseCoord) {
        this.updateStatusCoord(state.mouseCoord.x, state.mouseCoord.z);
      }
      if (state.fps !== prev.fps) {
        this.updateStatusFPS(state.fps);
      }
    });
  }

  private buildToolPanel(): void {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width:280px;flex-shrink:0;background:#263238;display:flex;flex-direction:column;
      border-right:1px solid #37474F;box-shadow:2px 0 12px rgba(0,0,0,0.3);
      font-family:'Inter',sans-serif;color:#ECEFF1;overflow:hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding:20px 18px 16px;border-bottom:1px solid #37474F;
      background:linear-gradient(135deg,#1565C0 0%,#0D47A1 100%);
    `;
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;color:#4FC3F7;">
          ${ICONS.wind}
        </div>
        <div>
          <div style="font-size:15px;font-weight:700;letter-spacing:0.3px;">WindFlow Assessor</div>
          <div style="font-size:11px;color:#90CAF9;opacity:0.85;margin-top:1px;">建筑风环境快速评估</div>
        </div>
      </div>
    `;
    panel.appendChild(header);

    const scrollArea = document.createElement('div');
    scrollArea.style.cssText = 'flex:1;overflow-y:auto;overflow-x:hidden;';
    panel.appendChild(scrollArea);

    scrollArea.appendChild(this.buildWindSection());
    scrollArea.appendChild(this.buildBuildingSection());
    scrollArea.appendChild(this.buildActionSection());

    panel.appendChild(this.buildFooter());

    this.app.insertBefore(panel, this.viewportContainer);
  }

  private buildWindSection(): HTMLElement {
    const state = useAppStore.getState();
    const section = this.createSection('风环境参数', ICONS.wind);

    const windCard = document.createElement('div');
    windCard.style.cssText = `
      background:#1E2A32;border:1px solid #37474F;border-radius:10px;padding:14px;margin-bottom:6px;
    `;

    const dirRow = document.createElement('div');
    dirRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:14px;';
    dirRow.innerHTML = `
      <div id="windDirCompass" style="width:56px;height:56px;border-radius:50%;background:#0A1929;border:2px solid #1976D2;display:flex;align-items:center;justify-content:center;position:relative;flex-shrink:0;">
        <div id="windDirArrow" style="position:absolute;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:18px solid #4FC3F7;top:8px;transform-origin:50% 20px;"></div>
        <span style="font-size:9px;color:#90A4AE;z-index:1;">N</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">
          <span style="font-size:11px;color:#90A4AE;display:flex;align-items:center;gap:4px;">${ICONS.arrow} 风向</span>
          <span id="windDirLabel" style="font-size:16px;font-weight:700;color:#4FC3F7;">${getDirectionLabel(state.windParams.direction)} · ${state.windParams.direction.toFixed(0)}°</span>
        </div>
        <input id="windDirSlider" type="range" min="0" max="360" step="1" value="${state.windParams.direction}"
          style="width:100%;accent-color:#4FC3F7;margin-top:4px;cursor:pointer;" />
      </div>
    `;
    windCard.appendChild(dirRow);

    const speedRow = document.createElement('div');
    speedRow.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
    speedRow.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-size:11px;color:#90A4AE;display:flex;align-items:center;gap:4px;">${ICONS.speed} 风速</span>
        <span id="windSpeedLabel" style="font-size:16px;font-weight:700;color:#66BB6A;">${state.windParams.speed.toFixed(1)} m/s</span>
      </div>
      <input id="windSpeedSlider" type="range" min="0" max="20" step="0.5" value="${state.windParams.speed}"
        style="width:100%;accent-color:#66BB6A;cursor:pointer;" />
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#546E7A;margin-top:-2px;">
        <span>静风 0</span>
        <span>强风 20</span>
      </div>
    `;
    windCard.appendChild(speedRow);
    section.appendChild(windCard);

    const dirSlider = dirRow.querySelector('#windDirSlider') as HTMLInputElement;
    const speedSlider = speedRow.querySelector('#windSpeedSlider') as HTMLInputElement;

    dirSlider.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      useAppStore.getState().setWindParams({ direction: v });
    });
    speedSlider.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      useAppStore.getState().setWindParams({ speed: v });
    });

    return section;
  }

  private buildBuildingSection(): HTMLElement {
    const section = this.createSection('建筑体块', ICONS.building);

    const countInfo = document.createElement('div');
    countInfo.style.cssText = `
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 12px;background:#1E2A32;border-radius:8px;margin-bottom:10px;
      border:1px solid #37474F;
    `;
    const state = useAppStore.getState();
    countInfo.innerHTML = `
      <span style="font-size:12px;color:#90A4AE;">场景体块</span>
      <span style="font-size:14px;font-weight:700;"><span id="buildingCount" style="color:${state.buildings.length >= 6 ? '#EF5350' : '#4FC3F7'}">${state.buildings.length}</span><span style="color:#546E7A">/6</span></span>
    `;
    section.appendChild(countInfo);

    const addBtn = document.createElement('button');
    addBtn.id = 'addBuildingBtn';
    addBtn.style.cssText = `
      width:100%;padding:11px 14px;border-radius:8px;border:1px dashed #4FC3F7;
      background:rgba(79,195,247,0.08);color:#4FC3F7;font-family:'Inter',sans-serif;
      font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;
      justify-content:center;gap:8px;transition:all .18s;margin-bottom:12px;
    `;
    addBtn.innerHTML = `<span style="font-size:18px;line-height:1;">+</span> 添加建筑体块`;
    addBtn.addEventListener('mouseenter', () => {
      addBtn.style.background = 'rgba(79,195,247,0.18)';
      addBtn.style.transform = 'translateY(-1px)';
    });
    addBtn.addEventListener('mouseleave', () => {
      addBtn.style.background = 'rgba(79,195,247,0.08)';
      addBtn.style.transform = 'translateY(0)';
    });
    addBtn.addEventListener('click', () => this.addBuildingAtCenter());
    section.appendChild(addBtn);

    const listTitle = document.createElement('div');
    listTitle.style.cssText = 'font-size:11px;color:#78909C;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;';
    listTitle.textContent = '体块列表';
    section.appendChild(listTitle);

    const list = document.createElement('div');
    list.id = 'buildingList';
    list.style.cssText = 'display:flex;flex-direction:column;gap:4px;padding-bottom:4px;';
    section.appendChild(list);

    this.updateBuildingList();

    return section;
  }

  private buildActionSection(): HTMLElement {
    const section = this.createSection('模拟与可视化', ICONS.simulate);

    const simBtn = document.createElement('button');
    simBtn.id = 'simulateBtn';
    simBtn.style.cssText = `
      width:100%;padding:14px 16px;border-radius:10px;border:none;
      background:linear-gradient(135deg,#1976D2 0%,#00BCD4 100%);color:white;
      font-family:'Inter',sans-serif;font-size:14px;font-weight:700;cursor:pointer;
      display:flex;align-items:center;justify-content:center;gap:10px;
      box-shadow:0 4px 14px rgba(25,118,210,0.4);transition:all .18s;margin-bottom:14px;
      letter-spacing:0.3px;
    `;
    simBtn.innerHTML = `${ICONS.simulate}<span>开始风环境模拟</span>`;
    simBtn.addEventListener('mouseenter', () => {
      simBtn.style.transform = 'translateY(-1px)';
      simBtn.style.boxShadow = '0 6px 18px rgba(25,118,210,0.5)';
    });
    simBtn.addEventListener('mouseleave', () => {
      simBtn.style.transform = 'translateY(0)';
      simBtn.style.boxShadow = '0 4px 14px rgba(25,118,210,0.4)';
    });
    simBtn.addEventListener('click', () => this.onSimulate());
    section.appendChild(simBtn);

    const visLabel = document.createElement('div');
    visLabel.style.cssText = 'font-size:11px;color:#78909C;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:600;';
    visLabel.textContent = '可视化方式';
    section.appendChild(visLabel);

    const visGroup = document.createElement('div');
    visGroup.style.cssText = `
      display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;
    `;

    const makeVisBtn = (id: string, icon: string, label: string, mode: 'streamline' | 'contour') => {
      const b = document.createElement('button');
      b.id = id;
      b.dataset.mode = mode;
      b.style.cssText = `
        padding:10px 8px;border-radius:8px;border:1px solid #37474F;background:#1E2A32;
        color:#90A4AE;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;
        cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;
        transition:all .15s;
      `;
      if (useAppStore.getState().visualizationMode === mode) {
        b.style.borderColor = '#4FC3F7';
        b.style.background = 'rgba(79,195,247,0.12)';
        b.style.color = '#4FC3F7';
      }
      b.innerHTML = `${icon}<span>${label}</span>`;
      b.addEventListener('click', () => {
        useAppStore.getState().setVisualizationMode(mode);
        const res = useAppStore.getState().simulationResult;
        if (res) {
          const event = new CustomEvent('rerender-visualization', { detail: mode });
          document.dispatchEvent(event);
        }
      });
      return b;
    };

    visGroup.appendChild(makeVisBtn('visStreamline', ICONS.streamline, '流线图', 'streamline'));
    visGroup.appendChild(makeVisBtn('visContour', ICONS.contour, '彩色云图', 'contour'));
    section.appendChild(visGroup);

    const snapLabel = document.createElement('div');
    snapLabel.style.cssText = 'font-size:11px;color:#78909C;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:600;';
    snapLabel.textContent = '场景快照';
    section.appendChild(snapLabel);

    const snapBtns = document.createElement('div');
    snapBtns.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;';

    const exportBtn = document.createElement('button');
    exportBtn.style.cssText = this.toolBtnStyle();
    exportBtn.innerHTML = `${ICONS.export}<span>导出快照</span>`;
    exportBtn.addEventListener('mouseenter', () => this.setBtnHover(exportBtn, true));
    exportBtn.addEventListener('mouseleave', () => this.setBtnHover(exportBtn, false));
    exportBtn.addEventListener('click', () => this.exportSnapshot());

    const importBtn = document.createElement('button');
    importBtn.style.cssText = this.toolBtnStyle();
    importBtn.innerHTML = `${ICONS.import}<span>加载快照</span>`;
    importBtn.addEventListener('mouseenter', () => this.setBtnHover(importBtn, true));
    importBtn.addEventListener('mouseleave', () => this.setBtnHover(importBtn, false));
    importBtn.addEventListener('click', () => this.fileInput.click());

    snapBtns.appendChild(exportBtn);
    snapBtns.appendChild(importBtn);
    section.appendChild(snapBtns);

    const clearBtn = document.createElement('button');
    clearBtn.style.cssText = `
      width:100%;padding:10px 14px;border-radius:8px;border:1px solid #37474F;
      background:transparent;color:#EF5350;font-family:'Inter',sans-serif;font-size:12px;
      font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;
      gap:8px;transition:all .15s;
    `;
    clearBtn.innerHTML = `${ICONS.clear}<span>清空场景</span>`;
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.background = 'rgba(239,83,80,0.1)';
      clearBtn.style.borderColor = '#EF5350';
    });
    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.background = 'transparent';
      clearBtn.style.borderColor = '#37474F';
    });
    clearBtn.addEventListener('click', () => {
      if (confirm('确定清空场景中所有建筑体块和模拟结果？')) {
        useAppStore.getState().clearScene();
      }
    });
    section.appendChild(clearBtn);

    return section;
  }

  private buildFooter(): HTMLElement {
    const f = document.createElement('div');
    f.style.cssText = `
      padding:10px 16px;border-top:1px solid #37474F;background:#1E2A32;
      font-size:10px;color:#546E7A;display:flex;justify-content:space-between;
    `;
    f.innerHTML = `
      <span>v1.0.0 · 势流面元法</span>
      <span>© WindFlow 2026</span>
    `;
    return f;
  }

  private toolBtnStyle(): string {
    return `
      padding:10px 10px;border-radius:8px;border:1px solid #37474F;background:#1E2A32;
      color:#B0BEC5;font-family:'Inter',sans-serif;font-size:12px;font-weight:500;
      cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;
      transition:all .15s;
    `;
  }

  private setBtnHover(btn: HTMLElement, on: boolean): void {
    if (on) {
      btn.style.background = '#37474F';
      btn.style.color = '#ECEFF1';
    } else {
      btn.style.background = '#1E2A32';
      btn.style.color = '#B0BEC5';
    }
  }

  private createSection(title: string, icon: string): HTMLElement {
    const s = document.createElement('div');
    s.style.cssText = 'padding:16px 16px 8px;';

    const h = document.createElement('div');
    h.style.cssText = `
      display:flex;align-items:center;gap:8px;margin-bottom:12px;
      font-size:12px;font-weight:700;color:#ECEFF1;letter-spacing:0.3px;
    `;
    h.innerHTML = `<span style="color:#4FC3F7;">${icon}</span>${title}`;
    s.appendChild(h);

    return s;
  }

  private buildViewportChrome(): void {
    const statusBar = document.createElement('div');
    statusBar.id = 'statusBar';
    statusBar.style.cssText = `
      position:absolute;left:0;right:0;bottom:0;height:40px;
      background:rgba(30,30,30,0.72);backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      display:flex;justify-content:space-between;align-items:center;
      padding:0 18px;font-family:'Inter',sans-serif;font-size:12px;
      color:#E3F2FD;border-top:1px solid rgba(79,195,247,0.25);
      pointer-events:none;z-index:10;
    `;

    const state = useAppStore.getState();
    statusBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:#4FC3F7;box-shadow:0 0 8px #4FC3F7;"></span>
        <span style="color:#90A4AE;">坐标：</span>
        <span id="coordLabel" style="font-weight:600;font-family:'JetBrains Mono',monospace;color:#4FC3F7;">${state.mouseCoord.x.toFixed(2)}, ${state.mouseCoord.z.toFixed(2)}</span>
      </div>
      <div style="display:flex;gap:20px;align-items:center;">
        <div style="color:#78909C;font-size:11px;">💡 双击地面放置 · 拖拽手柄调整</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="color:#90A4AE;">FPS：</span>
          <span id="fpsLabel" style="font-weight:700;font-family:'JetBrains Mono',monospace;color:#66BB6A;">${state.fps}</span>
        </div>
      </div>
    `;
    this.viewportContainer.style.position = 'relative';
    this.viewportContainer.appendChild(statusBar);
  }

  private buildResultPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'resultPanel';
    panel.style.cssText = `
      position:absolute;top:0;right:0;bottom:40px;width:320px;background:#FAFAFA;
      box-shadow:-4px 0 24px rgba(0,0,0,0.25);
      transform:translateX(340px);transition:transform .35s cubic-bezier(.4,0,.2,1);
      z-index:20;display:flex;flex-direction:column;
      font-family:'Inter',sans-serif;color:#263238;border-left:1px solid #E0E0E0;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding:20px 22px 16px;background:linear-gradient(135deg,#1565C0,#0288D1);color:white;
      position:relative;
    `;
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:10px;opacity:0.75;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;">Simulation Report</div>
          <div style="font-size:18px;font-weight:700;">风环境模拟结果</div>
        </div>
        <button id="closePanel" style="background:rgba(255,255,255,0.15);border:none;color:white;width:28px;height:28px;border-radius:7px;cursor:pointer;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;">×</button>
      </div>
      <div id="simTime" style="margin-top:8px;font-size:11px;opacity:0.7;">—</div>
    `;
    panel.appendChild(header);

    const closeBtn = header.querySelector('#closePanel') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => useAppStore.getState().setResultPanelOpen(false));

    const scroll = document.createElement('div');
    scroll.style.cssText = 'flex:1;overflow-y:auto;padding:18px 22px 24px;';
    panel.appendChild(scroll);

    const summaryTitle = document.createElement('div');
    summaryTitle.style.cssText = 'font-size:11px;color:#546E7A;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:10px;';
    summaryTitle.textContent = '整体统计';
    scroll.appendChild(summaryTitle);

    const statGrid = document.createElement('div');
    statGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px;';

    const makeStatCard = (id: string, label: string, unit: string, color: string) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background:white;border:1px solid #ECEFF1;border-radius:10px;padding:12px;
        box-shadow:0 1px 3px rgba(0,0,0,0.04);
      `;
      card.innerHTML = `
        <div style="font-size:10px;color:#78909C;font-weight:500;margin-bottom:4px;">${label}</div>
        <div style="display:flex;align-items:baseline;gap:3px;">
          <span id="${id}" style="font-size:20px;font-weight:800;color:${color};font-family:'JetBrains Mono',monospace;">—</span>
          <span style="font-size:11px;color:#90A4AE;">${unit}</span>
        </div>
      `;
      return card;
    };

    statGrid.appendChild(makeStatCard('statMaxRatio', '最大风速比', '×', '#E53935'));
    statGrid.appendChild(makeStatCard('statAvg', '平均风速', 'm/s', '#1E88E5'));
    scroll.appendChild(statGrid);

    const chartTitle = document.createElement('div');
    chartTitle.style.cssText = 'font-size:11px;color:#546E7A;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:12px;';
    chartTitle.textContent = '各体块风速统计';
    scroll.appendChild(chartTitle);

    const chartCard = document.createElement('div');
    chartCard.id = 'chartCard';
    chartCard.style.cssText = `
      background:white;border:1px solid #ECEFF1;border-radius:10px;padding:16px;
      box-shadow:0 1px 3px rgba(0,0,0,0.04);min-height:160px;
    `;
    scroll.appendChild(chartCard);

    const emptyChart = document.createElement('div');
    emptyChart.id = 'emptyChart';
    emptyChart.style.cssText = `
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:30px 10px;color:#90A4AE;font-size:12px;gap:8px;
    `;
    emptyChart.innerHTML = `
      <div style="font-size:28px;opacity:0.3;">📊</div>
      <div>暂无建筑数据</div>
    `;
    chartCard.appendChild(emptyChart);

    this.viewportContainer.appendChild(panel);
    this.resultPanel = panel;
  }

  private updateWindUI(p: WindParams): void {
    const dirLabel = document.getElementById('windDirLabel');
    const dirArrow = document.getElementById('windDirArrow') as HTMLElement;
    const dirSlider = document.getElementById('windDirSlider') as HTMLInputElement;
    const speedLabel = document.getElementById('windSpeedLabel');
    const speedSlider = document.getElementById('windSpeedSlider') as HTMLInputElement;

    if (dirLabel) dirLabel.textContent = `${getDirectionLabel(p.direction)} · ${p.direction.toFixed(0)}°`;
    if (dirArrow) dirArrow.style.transform = `rotate(${p.direction - 270}deg)`;
    if (dirSlider && document.activeElement !== dirSlider) dirSlider.value = String(p.direction);
    if (speedLabel) speedLabel.textContent = `${p.speed.toFixed(1)} m/s`;
    if (speedSlider && document.activeElement !== speedSlider) speedSlider.value = String(p.speed);
  }

  private updateVisModeButtons(mode: 'streamline' | 'contour'): void {
    ['visStreamline', 'visContour'].forEach((id) => {
      const b = document.getElementById(id) as HTMLButtonElement | null;
      if (!b) return;
      const isActive = (mode === 'streamline' && id === 'visStreamline') || (mode === 'contour' && id === 'visContour');
      if (isActive) {
        b.style.borderColor = '#4FC3F7';
        b.style.background = 'rgba(79,195,247,0.12)';
        b.style.color = '#4FC3F7';
      } else {
        b.style.borderColor = '#37474F';
        b.style.background = '#1E2A32';
        b.style.color = '#90A4AE';
      }
    });
  }

  private updateSimulateButton(simulating: boolean): void {
    const btn = document.getElementById('simulateBtn') as HTMLButtonElement | null;
    if (!btn) return;
    if (simulating) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.style.cursor = 'progress';
      btn.innerHTML = `<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;"></div><span>模拟计算中...</span>`;
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.innerHTML = `${ICONS.simulate}<span>开始风环境模拟</span>`;
    }
  }

  private updateBuildingList(): void {
    const list = document.getElementById('buildingList');
    const countSpan = document.getElementById('buildingCount');
    const addBtn = document.getElementById('addBuildingBtn') as HTMLButtonElement | null;
    const state = useAppStore.getState();

    if (countSpan) {
      countSpan.textContent = String(state.buildings.length);
      countSpan.style.color = state.buildings.length >= 6 ? '#EF5350' : '#4FC3F7';
    }
    if (addBtn) addBtn.disabled = state.buildings.length >= 6;

    if (!list) return;
    list.innerHTML = '';

    state.buildings.forEach((b, idx) => {
      const item = document.createElement('div');
      const isSel = b.id === state.selectedBuildingId;
      item.style.cssText = `
        display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:7px;
        background:${isSel ? 'rgba(79,195,247,0.12)' : 'transparent'};
        border:1px solid ${isSel ? '#4FC3F7' : 'transparent'};
        cursor:pointer;transition:all .12s;
      `;
      item.addEventListener('mouseenter', () => {
        if (!isSel) item.style.background = 'rgba(255,255,255,0.04)';
      });
      item.addEventListener('mouseleave', () => {
        if (!isSel) item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        useAppStore.getState().selectBuilding(b.id);
      });

      item.innerHTML = `
        <div style="width:18px;height:18px;border-radius:4px;background:${b.color};border:1px solid rgba(0,0,0,0.2);flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;color:${isSel ? '#4FC3F7' : '#ECEFF1'};">建筑 #${idx + 1}</div>
          <div style="font-size:10px;color:#78909C;font-family:'JetBrains Mono',monospace;margin-top:1px;">${b.width.toFixed(1)}×${b.depth.toFixed(1)}×${b.height.toFixed(1)}m</div>
        </div>
        <button class="delBtn" data-id="${b.id}" style="background:transparent;border:none;color:#546E7A;width:24px;height:24px;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;">
          ${ICONS.trash}
        </button>
      `;

      const del = item.querySelector('.delBtn') as HTMLButtonElement;
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        useAppStore.getState().removeBuilding(b.id);
      });
      del.addEventListener('mouseenter', () => {
        del.style.background = 'rgba(239,83,80,0.12)';
        del.style.color = '#EF5350';
      });
      del.addEventListener('mouseleave', () => {
        del.style.background = 'transparent';
        del.style.color = '#546E7A';
      });

      list.appendChild(item);
    });

    if (state.buildings.length === 0) {
      const hint = document.createElement('div');
      hint.style.cssText = `
        padding:18px 12px;text-align:center;color:#546E7A;font-size:11px;
        border:1px dashed #37474F;border-radius:8px;line-height:1.6;
      `;
      hint.innerHTML = `双击地面或点击上方按钮添加<br/>最多支持放置 <b style="color:#4FC3F7">6 个</b> 体块`;
      list.appendChild(hint);
    }
  }

  private addBuildingAtCenter(x = 0, z = 0): void {
    const state = useAppStore.getState();
    if (state.buildings.length >= 6) {
      alert('已达到最大建筑体块数量（6）');
      return;
    }
    const color = BUILDING_COLORS[state.buildings.length % BUILDING_COLORS.length];
    const building: BuildingBlock = {
      id: generateId(),
      x: x !== 0 ? x : (Math.random() - 0.5) * 4,
      z: z !== 0 ? z : (Math.random() - 0.5) * 4,
      width: 2.5,
      depth: 2.5,
      height: 3,
      color,
      selected: true,
    };
    useAppStore.getState().addBuilding(building);
  }

  public addBuildingAt(x: number, z: number): void {
    this.addBuildingAtCenter(x, z);
  }

  private onSimulate(): void {
    const state = useAppStore.getState();
    if (state.buildings.length === 0) {
      alert('请先放置至少一个建筑体块');
      return;
    }
    document.dispatchEvent(new CustomEvent('trigger-simulation'));
  }

  private updateStatusCoord(x: number, z: number): void {
    const l = document.getElementById('coordLabel');
    if (l) l.textContent = `${x.toFixed(2)}, ${z.toFixed(2)}`;
  }

  private updateStatusFPS(fps: number): void {
    const l = document.getElementById('fpsLabel') as HTMLElement | null;
    if (!l) return;
    l.textContent = String(fps);
    if (fps >= 50) l.style.color = '#66BB6A';
    else if (fps >= 30) l.style.color = '#FFB74D';
    else l.style.color = '#EF5350';
  }

  private toggleResultPanel(open: boolean): void {
    if (!this.resultPanel) return;
    this.resultPanel.style.transform = open ? 'translateX(0)' : 'translateX(340px)';
  }

  private updateResultPanel(r: SimulationResult | null): void {
    if (!r) return;
    const state = useAppStore.getState();

    const maxRatio = document.getElementById('statMaxRatio');
    const avgEl = document.getElementById('statAvg');
    const timeEl = document.getElementById('simTime');
    const chartCard = document.getElementById('chartCard');

    if (maxRatio) maxRatio.textContent = r.maxVelocityRatio.toFixed(2);
    if (avgEl) avgEl.textContent = r.avgVelocity.toFixed(2);
    if (timeEl) {
      const d = new Date(r.timestamp);
      timeEl.textContent = `完成时间 ${d.toLocaleTimeString()}`;
    }

    if (chartCard && state.buildings.length > 0) {
      chartCard.innerHTML = '';
      this.renderBarChart(chartCard, state.buildings, r.buildingStats);
    }
  }

  private renderBarChart(container: HTMLElement, buildings: BuildingBlock[], stats: { buildingId: string; windwardVelocity: number; leewardVelocity: number }[]): void {
    const maxV = Math.max(
      ...stats.map((s) => Math.max(s.windwardVelocity, s.leewardVelocity)),
      1
    );

    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;gap:16px;margin-bottom:14px;font-size:11px;color:#546E7A;';
    legend.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#1E88E5;"></span>迎风面</div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#E53935;opacity:0.65;"></span>背风面</div>
    `;
    container.appendChild(legend);

    buildings.forEach((b, idx) => {
      const stat = stats.find((s) => s.buildingId === b.id);
      if (!stat) return;

      const row = document.createElement('div');
      row.style.cssText = 'margin-bottom:12px;';
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
          <span style="width:12px;height:12px;border-radius:3px;background:${b.color};border:1px solid rgba(0,0,0,0.15);"></span>
          <span style="font-size:11px;font-weight:600;color:#263238;">建筑 #${idx + 1}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;padding-left:20px;">
          <div class="barWrap" data-val="${stat.windwardVelocity.toFixed(2)}" style="display:flex;align-items:center;gap:8px;position:relative;">
            <div class="barFill" style="height:14px;width:${(stat.windwardVelocity / maxV) * 100}%;background:linear-gradient(90deg,#64B5F6,#1976D2);border-radius:3px;min-width:2px;"></div>
            <span style="font-size:10px;color:#1976D2;font-weight:700;font-family:'JetBrains Mono',monospace;flex-shrink:0;">${stat.windwardVelocity.toFixed(2)} m/s</span>
          </div>
          <div class="barWrap" data-val="${stat.leewardVelocity.toFixed(2)}" style="display:flex;align-items:center;gap:8px;position:relative;">
            <div class="barFill" style="height:14px;width:${(stat.leewardVelocity / maxV) * 100}%;background:linear-gradient(90deg,#EF9A9A,#E53935);opacity:0.65;border-radius:3px;min-width:2px;"></div>
            <span style="font-size:10px;color:#C62828;font-weight:700;font-family:'JetBrains Mono',monospace;flex-shrink:0;">${stat.leewardVelocity.toFixed(2)} m/s</span>
          </div>
        </div>
      `;

      const wraps = row.querySelectorAll('.barWrap');
      wraps.forEach((w) => {
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position:absolute;bottom:100%;left:50%;transform:translateX(-50%);
          background:#263238;color:white;padding:4px 8px;border-radius:4px;
          font-size:10px;white-space:nowrap;opacity:0;pointer-events:none;
          transition:opacity .15s;z-index:100;margin-bottom:4px;font-family:'JetBrains Mono',monospace;
        `;
        tooltip.textContent = `${(w as HTMLElement).dataset.val} m/s`;
        w.appendChild(tooltip);
        w.addEventListener('mouseenter', () => { tooltip.style.opacity = '1'; });
        w.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
      });

      container.appendChild(row);
    });
  }

  private exportSnapshot(): void {
    const snap = useAppStore.getState().exportSnapshot();
    const json = JSON.stringify(snap, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `windflow_snapshot_${new Date(snap.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private onFileSelected = async (): Promise<void> => {
    const file = this.fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const snap = JSON.parse(text) as SceneSnapshot;
      if (!snap.buildings || !snap.windParams) throw new Error('无效的快照文件');
      useAppStore.getState().loadSnapshot(snap);
      alert('快照加载成功！');
    } catch (e) {
      alert('加载快照失败：' + (e as Error).message);
    }
    this.fileInput.value = '';
  };

  private injectAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      input[type=range] {
        -webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:#37474F;outline:none;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;
        background:currentColor;border:2px solid #263238;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;
      }
      input[type=range]::-moz-range-thumb {
        width:14px;height:14px;border-radius:50%;background:currentColor;
        border:2px solid #263238;cursor:pointer;
      }
      #buildingList::-webkit-scrollbar, #resultPanel ::-webkit-scrollbar, .toolScroll::-webkit-scrollbar { width:4px; }
      #buildingList::-webkit-scrollbar-thumb, #resultPanel ::-webkit-scrollbar-thumb, .toolScroll::-webkit-scrollbar-thumb {
        background:#37474F;border-radius:2px;
      }
    `;
    document.head.appendChild(style);
  }

  public initialize(): void {
    this.injectAnimations();
    this.updateWindUI(useAppStore.getState().windParams);
  }
}
