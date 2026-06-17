import { Engine } from './engine';
import { Renderer } from './renderer';

interface UIState {
  particleCount: number;
  particleSize: number;
  forceStrength: number;
  trailLength: number;
  bgColor: string;
}

export class UI {
  private engine: Engine;
  private renderer: Renderer;
  private panel!: HTMLDivElement;
  private fpsDisplay!: HTMLDivElement;
  private warningEl!: HTMLDivElement;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private isCollapsed = false;
  private state: UIState = {
    particleCount: 2000,
    particleSize: 2,
    forceStrength: 0.3,
    trailLength: 5,
    bgColor: '#0A0A1A',
  };

  constructor(engine: Engine, renderer: Renderer) {
    this.engine = engine;
    this.renderer = renderer;
  }

  createPanel(): void {
    this.createFPSDisplay();
    this.createWarning();

    const panel = document.createElement('div');
    panel.id = 'pf-panel';
    this.panel = panel;
    this.applyPanelStyle(panel);

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;cursor:move;user-select:none;';
    header.id = 'pf-panel-header';

    const title = document.createElement('span');
    title.textContent = 'ParticleFlow';
    title.style.cssText = 'color:#fff;font-size:16px;font-weight:600;letter-spacing:0.5px;';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '▾';
    toggleBtn.style.cssText = 'background:none;border:none;color:#00DDFF;font-size:18px;cursor:pointer;transition:transform 0.3s ease-out;padding:0;line-height:1;';
    toggleBtn.id = 'pf-toggle-btn';

    header.appendChild(title);
    header.appendChild(toggleBtn);
    panel.appendChild(header);

    const content = document.createElement('div');
    content.id = 'pf-panel-content';
    content.style.cssText = 'transition:max-height 0.3s ease-out,opacity 0.3s ease-out;overflow:hidden;';

    const controls: [string, string, number, number, number, number, string][] = [
      ['粒子数量', 'particleCount', 500, 5000, 500, this.state.particleCount, ''],
      ['粒子大小', 'particleSize', 1, 6, 0.5, this.state.particleSize, 'px'],
      ['力场强度', 'forceStrength', 0.1, 1.0, 0.1, this.state.forceStrength, ''],
      ['拖尾长度', 'trailLength', 0, 15, 1, this.state.trailLength, '帧'],
    ];

    for (const [label, key, min, max, step, value, unit] of controls) {
      const row = this.createSliderRow(label, key, min, max, step, value, unit);
      content.appendChild(row);
    }

    const bgRow = this.createColorRow('背景色', 'bgColor', this.state.bgColor);
    content.appendChild(bgRow);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重置';
    resetBtn.style.cssText = `
      width:100%;padding:8px 0;margin-top:12px;
      background:rgba(0,221,255,0.15);border:1px solid rgba(0,221,255,0.3);
      color:#00DDFF;border-radius:6px;cursor:pointer;font-size:13px;
      transition:background 0.15s ease-in-out,border-color 0.15s ease-in-out;
    `;
    resetBtn.addEventListener('mouseenter', () => {
      resetBtn.style.background = 'rgba(0,221,255,0.25)';
      resetBtn.style.borderColor = 'rgba(0,221,255,0.5)';
    });
    resetBtn.addEventListener('mouseleave', () => {
      resetBtn.style.background = 'rgba(0,221,255,0.15)';
      resetBtn.style.borderColor = 'rgba(0,221,255,0.3)';
    });
    resetBtn.addEventListener('click', () => {
      this.engine.resetParticles();
    });
    content.appendChild(resetBtn);

    panel.appendChild(content);
    document.body.appendChild(panel);

    this.bindDrag(header, panel);
    this.bindToggle(toggleBtn, content);
  }

  private createSliderRow(
    label: string,
    key: string,
    min: number,
    max: number,
    step: number,
    value: number,
    unit: string
  ): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;margin-bottom:10px;';

    const lbl = document.createElement('label');
    lbl.textContent = label;
    lbl.style.cssText = 'color:rgba(255,255,255,0.7);font-size:12px;text-align:left;';

    const right = document.createElement('div');
    right.style.cssText = 'display:flex;align-items:center;gap:6px;';

    const valSpan = document.createElement('span');
    valSpan.textContent = value + unit;
    valSpan.style.cssText = 'color:#AABBCC;font-size:12px;min-width:36px;text-align:right;font-variant-numeric:tabular-nums;';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.style.cssText = this.sliderCSS();
    slider.id = `pf-${key}`;

    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valSpan.textContent = v + unit;
      this.applySliderValue(key, v);
    });

    right.appendChild(slider);
    right.appendChild(valSpan);
    row.appendChild(lbl);
    row.appendChild(right);
    return row;
  }

  private createColorRow(label: string, key: string, value: string): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;margin-bottom:10px;';

    const lbl = document.createElement('label');
    lbl.textContent = label;
    lbl.style.cssText = 'color:rgba(255,255,255,0.7);font-size:12px;text-align:left;';

    const rightCol = document.createElement('div');
    rightCol.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:6px;';

    const pickerRow = document.createElement('div');
    pickerRow.style.cssText = 'display:flex;align-items:center;gap:6px;';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = value;
    picker.style.cssText = `
      width:32px;height:24px;border:1px solid rgba(255,255,255,0.15);
      border-radius:4px;cursor:pointer;background:transparent;padding:0;
    `;
    picker.id = `pf-${key}`;

    const applyColor = (c: string) => {
      this.state.bgColor = c;
      this.renderer.bgColor = c;
      picker.value = c;
    };

    picker.addEventListener('input', () => {
      applyColor(picker.value);
    });

    pickerRow.appendChild(picker);

    const presets = document.createElement('div');
    presets.style.cssText = 'display:flex;gap:6px;';
    const presetColors: [string, string][] = [
      ['深蓝', '#0A0A1A'],
      ['暗紫', '#1A0A1A'],
      ['墨绿', '#0A1A10'],
      ['纯黑', '#000000'],
    ];

    for (const [name, hex] of presetColors) {
      const swatch = document.createElement('button');
      swatch.title = name;
      swatch.style.cssText = `
        width:20px;height:20px;border-radius:4px;border:1px solid #444;
        background:${hex};cursor:pointer;padding:0;
        transition:transform 0.15s ease-in-out,border-color 0.15s ease-in-out;
      `;
      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.15)';
        swatch.style.borderColor = '#00DDFF';
      });
      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = 'scale(1)';
        swatch.style.borderColor = '#444';
      });
      swatch.addEventListener('click', () => applyColor(hex));
      presets.appendChild(swatch);
    }

    rightCol.appendChild(pickerRow);
    rightCol.appendChild(presets);

    row.appendChild(lbl);
    row.appendChild(rightCol);
    return row;
  }

  private sliderCSS(): string {
    return `
      -webkit-appearance:none;appearance:none;width:100px;height:4px;
      border-radius:2px;background:#2A2A3A;outline:none;cursor:pointer;
      transition:background 0.15s ease-in-out;
    `;
  }

  private applySliderValue(key: string, value: number): void {
    switch (key) {
      case 'particleCount':
        this.state.particleCount = value;
        this.engine.setParticleCount(value);
        break;
      case 'particleSize':
        this.state.particleSize = value;
        this.engine.setParticleSizeRange(value, value + 2);
        break;
      case 'forceStrength':
        this.state.forceStrength = value;
        this.engine.forceStrength = value;
        break;
      case 'trailLength':
        this.state.trailLength = value;
        this.engine.trailLength = value;
        break;
    }
  }

  private applyPanelStyle(panel: HTMLDivElement): void {
    panel.style.cssText = `
      position:fixed;width:250px;
      background:rgba(20,20,30,0.85);
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:12px;padding:20px;
      top:120px;right:20px;
      z-index:1000;
      transition:all 0.15s ease-in-out;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    `;

    const style = document.createElement('style');
    style.textContent = `
      #pf-panel input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance:none;appearance:none;
        width:14px;height:14px;border-radius:50%;
        background:#00DDFF;cursor:pointer;
        border:none;
        transition:transform 0.15s ease-in-out;
      }
      #pf-panel input[type="range"]::-webkit-slider-thumb:hover {
        transform:scale(1.2);
      }
      #pf-panel input[type="range"]::-moz-range-thumb {
        width:14px;height:14px;border-radius:50%;
        background:#00DDFF;cursor:pointer;
        border:none;
      }
      @media (max-width:767px) {
        #pf-panel {
          width:100%!important;height:auto!important;
          top:auto!important;right:0!important;
          bottom:0!important;left:0!important;
          border-radius:12px 12px 0 0!important;
          padding:16px!important;
        }
        #pf-panel > div:last-child {
          display:flex;flex-direction:column;gap:10px;
        }
        #pf-panel .pf-slider-row {
          grid-template-columns:1fr!important;
        }
      }
      @keyframes pf-warning-blink {
        0%,100%{opacity:1}
        50%{opacity:0.3}
      }
    `;
    document.head.appendChild(style);
  }

  private createFPSDisplay(): void {
    const el = document.createElement('div');
    el.id = 'pf-fps';
    el.style.cssText = `
      position:fixed;top:12px;left:12px;z-index:999;
      font:14px/1.4 'Courier New',monospace;color:#00FF88;
      background:rgba(0,0,0,0.5);border-radius:4px;padding:4px 8px;
      pointer-events:none;
    `;
    el.textContent = 'FPS: --';
    document.body.appendChild(el);
    this.fpsDisplay = el;
  }

  private createWarning(): void {
    const el = document.createElement('div');
    el.id = 'pf-warning';
    el.style.cssText = `
      color:#FF4444;font-size:12px;
      animation:pf-warning-blink 1s infinite;
      margin-top:8px;display:none;
    `;
    el.textContent = '⚠ FPS过低，正在自动降低粒子数量';
    this.warningEl = el;
  }

  private bindDrag(header: HTMLDivElement, panel: HTMLDivElement): void {
    header.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).id === 'pf-toggle-btn') return;
      this.isDragging = true;
      this.dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
      this.dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
    });

    const onMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const x = e.clientX - this.dragOffsetX;
      const y = e.clientY - this.dragOffsetY;
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
      panel.style.right = 'auto';
    };

    const onUp = () => {
      this.isDragging = false;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private bindToggle(btn: HTMLButtonElement, content: HTMLDivElement): void {
    btn.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        (content as HTMLElement).style.maxHeight = '0';
        (content as HTMLElement).style.opacity = '0';
        btn.textContent = '▸';
        btn.style.transform = 'rotate(0deg)';
      } else {
        (content as HTMLElement).style.maxHeight = '500px';
        (content as HTMLElement).style.opacity = '1';
        btn.textContent = '▾';
        btn.style.transform = 'rotate(0deg)';
      }
    });
    (content as HTMLElement).style.maxHeight = '500px';
    (content as HTMLElement).style.opacity = '1';
  }

  updateFPS(fps: number): void {
    this.fpsDisplay.textContent = `FPS: ${Math.round(fps)}`;
    if (fps < 30) {
      this.fpsDisplay.style.color = '#FF4444';
    } else {
      this.fpsDisplay.style.color = '#00FF88';
    }
  }

  showFPSWarning(show: boolean): void {
    if (this.warningEl.parentNode) return;
    if (show) {
      const content = this.panel.querySelector('#pf-panel-content');
      if (content) {
        content.appendChild(this.warningEl);
      }
      this.warningEl.style.display = 'block';
    } else {
      this.warningEl.style.display = 'none';
      if (this.warningEl.parentNode) {
        this.warningEl.parentNode.removeChild(this.warningEl);
      }
    }
  }

  bindEvents(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      const type = e.shiftKey ? 'repel' : 'attract';
      this.engine.applyForce(e.clientX, e.clientY, type);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.engine.forceField) {
        const type = e.shiftKey ? 'repel' : 'attract';
        this.engine.applyForce(e.clientX, e.clientY, type);
      }
    });

    const release = () => {
      this.engine.clearForce();
    };
    canvas.addEventListener('mouseup', release);
    canvas.addEventListener('mouseleave', release);

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.engine.applyForce(t.clientX, t.clientY, 'attract');
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.engine.applyForce(t.clientX, t.clientY, 'attract');
    }, { passive: false });

    canvas.addEventListener('touchend', release);
  }
}
