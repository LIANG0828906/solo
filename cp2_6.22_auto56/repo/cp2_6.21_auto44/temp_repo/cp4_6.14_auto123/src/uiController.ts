import * as THREE from 'three';

export interface TracePath {
  id: string;
  index: number;
  points: THREE.Vector3[];
  length: number;
  avgDiameter: number;
  line: THREE.Line | null;
  highlightMeshes: THREE.Mesh[];
}

export class UIController {
  private controlPanel: HTMLDivElement;
  private measurementPanel: HTMLDivElement;
  private toastContainer: HTMLDivElement;
  private paths: TracePath[] = [];
  private onResetView: (() => void) | null = null;
  private onClearAll: (() => void) | null = null;
  private onClearPath: ((pathId: string) => void) | null = null;
  private onExport: (() => void) | null = null;

  constructor() {
    this.controlPanel = this.createControlPanel();
    this.measurementPanel = this.createMeasurementPanel();
    this.toastContainer = this.createToastContainer();
    document.body.appendChild(this.controlPanel);
    document.body.appendChild(this.measurementPanel);
    document.body.appendChild(this.toastContainer);
  }

  private createControlPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'control-panel';
    panel.style.cssText = `
      position: fixed; top: 16px; left: 16px; width: 200px; z-index: 100;
      background: rgba(30,41,59,0.8); border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(8px); border-radius: 8px; padding: 12px;
      display: flex; flex-direction: column; gap: 8px;
    `;

    const title = document.createElement('div');
    title.textContent = '控制面板';
    title.style.cssText = `
      color: #e2e8f0; font-size: 13px; font-weight: 600;
      margin-bottom: 4px; letter-spacing: 0.5px;
    `;
    panel.appendChild(title);

    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg> 重置视角`;
    resetBtn.style.cssText = `
      width: 100%; height: 36px; background: #334155; border: none; border-radius: 8px;
      color: #e2e8f0; font-size: 13px; cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 6px; transition: all 0.15s ease;
    `;
    resetBtn.addEventListener('mouseenter', () => { resetBtn.style.background = '#475569'; });
    resetBtn.addEventListener('mouseleave', () => { resetBtn.style.background = '#334155'; });
    resetBtn.addEventListener('mousedown', () => { resetBtn.style.transform = 'scale(0.95)'; });
    resetBtn.addEventListener('mouseup', () => { resetBtn.style.transform = 'scale(1)'; });
    resetBtn.addEventListener('click', () => { this.onResetView?.(); });
    panel.appendChild(resetBtn);

    const clearAllBtn = document.createElement('button');
    clearAllBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> 清除所有标注`;
    clearAllBtn.style.cssText = `
      width: 100%; height: 36px; background: #334155; border: none; border-radius: 8px;
      color: #e2e8f0; font-size: 13px; cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 6px; transition: all 0.15s ease;
    `;
    clearAllBtn.addEventListener('mouseenter', () => { clearAllBtn.style.background = '#475569'; });
    clearAllBtn.addEventListener('mouseleave', () => { clearAllBtn.style.background = '#334155'; });
    clearAllBtn.addEventListener('mousedown', () => { clearAllBtn.style.transform = 'scale(0.95)'; });
    clearAllBtn.addEventListener('mouseup', () => { clearAllBtn.style.transform = 'scale(1)'; });
    clearAllBtn.addEventListener('click', () => { this.onClearAll?.(); });
    panel.appendChild(clearAllBtn);

    const modeIndicator = document.createElement('div');
    modeIndicator.id = 'mode-indicator';
    modeIndicator.textContent = '浏览模式';
    modeIndicator.style.cssText = `
      color: #94a3b8; font-size: 11px; text-align: center; margin-top: 4px;
      padding: 4px 8px; background: rgba(59,130,246,0.15); border-radius: 4px;
      transition: all 0.2s ease-out;
    `;
    panel.appendChild(modeIndicator);

    return panel;
  }

  private createMeasurementPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'measurement-panel';
    panel.style.cssText = `
      position: fixed; bottom: 16px; right: 16px; width: 240px; z-index: 100;
      background: rgba(30,41,59,0.8); border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(8px); border-radius: 8px; padding: 12px;
      max-height: calc(100vh - 32px); overflow-y: auto;
    `;

    const title = document.createElement('div');
    title.textContent = '测量结果';
    title.style.cssText = `
      color: #e2e8f0; font-size: 13px; font-weight: 600;
      margin-bottom: 8px; letter-spacing: 0.5px;
    `;
    panel.appendChild(title);

    const pathList = document.createElement('div');
    pathList.id = 'path-list';
    panel.appendChild(pathList);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `margin-top: 8px; display: flex; flex-direction: column; gap: 6px;`;

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '导出全部标注';
    exportBtn.style.cssText = `
      width: 100%; height: 32px; background: #22c55e; border: none; border-radius: 6px;
      color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;
      transition: all 0.15s ease;
    `;
    exportBtn.addEventListener('mousedown', () => { exportBtn.style.transform = 'scale(0.95)'; });
    exportBtn.addEventListener('mouseup', () => { exportBtn.style.transform = 'scale(1)'; });
    exportBtn.addEventListener('click', () => { this.onExport?.(); });
    btnContainer.appendChild(exportBtn);

    panel.appendChild(btnContainer);
    return panel;
  }

  private createToastContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; top: 16px; right: 16px; z-index: 200;
      display: flex; flex-direction: column; gap: 8px;
    `;
    return container;
  }

  setCallbacks(callbacks: {
    onResetView?: () => void;
    onClearAll?: () => void;
    onClearPath?: (pathId: string) => void;
    onExport?: () => void;
  }) {
    this.onResetView = callbacks.onResetView || null;
    this.onClearAll = callbacks.onClearAll || null;
    this.onClearPath = callbacks.onClearPath || null;
    this.onExport = callbacks.onExport || null;
  }

  addPathResult(path: TracePath) {
    this.paths.push(path);
    this.renderPathList();
  }

  removePathResult(pathId: string) {
    this.paths = this.paths.filter(p => p.id !== pathId);
    this.renderPathList();
  }

  clearAllPaths() {
    this.paths = [];
    this.renderPathList();
  }

  private renderPathList() {
    const list = document.getElementById('path-list');
    if (!list) return;
    list.innerHTML = '';

    this.paths.forEach((path) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 6px; padding: 8px; margin-bottom: 6px;
        transition: all 0.2s ease-out;
      `;

      const header = document.createElement('div');
      header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;`;
      const pathNum = document.createElement('span');
      pathNum.textContent = `路径 #${path.index}`;
      pathNum.style.cssText = `color: #e2e8f0; font-size: 12px; font-weight: 600;`;
      header.appendChild(pathNum);

      const clearBtn = document.createElement('button');
      clearBtn.innerHTML = '&times;';
      clearBtn.style.cssText = `
        background: none; border: none; color: #94a3b8; font-size: 14px;
        cursor: pointer; padding: 0 4px; line-height: 1; transition: color 0.15s ease;
      `;
      clearBtn.addEventListener('mouseenter', () => { clearBtn.style.color = '#ef4444'; });
      clearBtn.addEventListener('mouseleave', () => { clearBtn.style.color = '#94a3b8'; });
      clearBtn.addEventListener('click', () => { this.onClearPath?.(path.id); });
      header.appendChild(clearBtn);

      item.appendChild(header);

      const lengthRow = document.createElement('div');
      lengthRow.innerHTML = `<span style="color:#94a3b8;font-size:11px;">长度：</span><span style="color:#a78bfa;font-family:Monaco,monospace;font-size:16px;">${path.length.toFixed(2)}</span><span style="color:#94a3b8;font-size:11px;"> μm</span>`;
      item.appendChild(lengthRow);

      const diamRow = document.createElement('div');
      diamRow.innerHTML = `<span style="color:#94a3b8;font-size:11px;">直径：</span><span style="color:#a78bfa;font-family:Monaco,monospace;font-size:16px;">${path.avgDiameter.toFixed(2)}</span><span style="color:#94a3b8;font-size:11px;"> μm</span>`;
      item.appendChild(diamRow);

      list.appendChild(item);
    });
  }

  setMode(mode: 'browse' | 'tracing') {
    const indicator = document.getElementById('mode-indicator');
    if (indicator) {
      if (mode === 'tracing') {
        indicator.textContent = '描记模式';
        indicator.style.background = 'rgba(167,139,250,0.2)';
        indicator.style.color = '#a78bfa';
      } else {
        indicator.textContent = '浏览模式';
        indicator.style.background = 'rgba(59,130,246,0.15)';
        indicator.style.color = '#94a3b8';
      }
    }
  }

  showToast(message: string, duration: number = 2000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      background: #1e293b; color: #22c55e; padding: 10px 16px; border-radius: 6px;
      font-size: 13px; border: 1px solid rgba(255,255,255,0.1);
      opacity: 0; transform: translateX(20px);
      transition: all 0.2s ease-out;
    `;
    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  getPaths(): TracePath[] {
    return this.paths;
  }
}
