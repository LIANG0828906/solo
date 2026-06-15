import { WaterLevelData, HistoryRecord, THRESHOLDS, LOCATION_KEYS, LOCATION_LABELS } from './types';

export class UIManager {
  private container: HTMLElement;
  private leftPanel!: HTMLElement;
  private rightPanel!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private tooltip!: HTMLDivElement;
  private alertBoxes: Map<string, HTMLElement> = new Map();
  private sliders: Map<string, HTMLInputElement> = new Map();
  private valueDisplays: Map<string, HTMLElement> = new Map();
  private historyRecords: HistoryRecord[] = [];
  private levelChangeCallback: ((location: string, value: number) => void) | null = null;
  private scaleClickCallback: ((scaleValue: number) => void) | null = null;
  private dragging: { panel: HTMLElement; offsetX: number; offsetY: number } | null = null;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundResize: () => void;
  private injectedStyle: HTMLStyleElement;
  private canvasWidth = 250;
  private canvasHeight = 340;
  private hoveredPoint: { x: number; y: number; value: number; time: string; color: string } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundResize = this.onResize.bind(this);
    this.injectedStyle = this.injectStyles();
    this.createTooltip();
    this.createLeftPanel();
    this.createAlertBoxes();
    this.createRightPanel();
    window.addEventListener('resize', this.boundResize);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private injectStyles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = [
      'input[type=range].water-gauge-slider::-webkit-slider-runnable-track {',
      '  height: 4px;',
      '  background: linear-gradient(to right, #8B6914, #CD853F);',
      '  border-radius: 2px;',
      '}',
      'input[type=range].water-gauge-slider::-webkit-slider-thumb {',
      '  -webkit-appearance: none;',
      '  width: 14px;',
      '  height: 14px;',
      '  background: #CD853F;',
      '  border: 2px solid #FFD700;',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  margin-top: -5px;',
      '}',
      'input[type=range].water-gauge-slider {',
      '  -webkit-appearance: none;',
      '  width: 100%;',
      '  height: 4px;',
      '  background: transparent;',
      '  outline: none;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
    return style;
  }

  private createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = 'white';
    tooltip.style.borderRadius = '8px';
    tooltip.style.border = '2px solid #4A2C1A';
    tooltip.style.padding = '6px 10px';
    tooltip.style.fontSize = '12px';
    tooltip.style.color = '#4A2C1A';
    tooltip.style.zIndex = '300';
    tooltip.style.display = 'none';
    tooltip.style.transition = 'opacity 0.2s';
    tooltip.style.whiteSpace = 'pre-line';
    tooltip.style.fontFamily = "'楷体', 'KaiTi', serif";
    this.tooltip = tooltip;
    document.body.appendChild(tooltip);
  }

  private createLeftPanel() {
    const panel = document.createElement('div');
    const vw = window.innerWidth;
    const w = Math.min(280, Math.max(220, vw * 0.25));
    panel.style.position = 'fixed';
    panel.style.left = '20px';
    panel.style.top = '50%';
    panel.style.transform = 'translateY(-50%)';
    panel.style.width = w + 'px';
    panel.style.height = '180px';
    panel.style.background = 'linear-gradient(135deg, #6B4C3B 0%, #5C4033 40%, #4A3328 100%)';
    panel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)';
    panel.style.border = '2px solid #8B6914';
    panel.style.borderRadius = '8px';
    panel.style.padding = '15px';
    panel.style.zIndex = '100';

    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
    header.style.paddingBottom = '8px';
    header.style.marginBottom = '12px';
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    header.addEventListener('mousedown', (e) => this.startDrag(e, panel));

    const title = document.createElement('div');
    title.textContent = '水则';
    title.style.color = 'white';
    title.style.fontFamily = "'ZCOOL KuaiLe', '楷体', 'KaiTi', serif";
    title.style.fontSize = '22px';
    title.style.letterSpacing = '8px';
    title.style.textAlign = 'center';
    header.appendChild(title);
    panel.appendChild(header);

    const initialLevels: WaterLevelData = { upstream: 40, midstream: 35, downstream: 30 };

    for (const key of LOCATION_KEYS) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.marginBottom = '8px';
      row.style.gap = '8px';

      const label = document.createElement('span');
      label.textContent = LOCATION_LABELS[key];
      label.style.color = 'white';
      label.style.fontSize = '13px';
      label.style.fontFamily = "'楷体', 'KaiTi', serif";
      label.style.minWidth = '32px';
      row.appendChild(label);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '150';
      slider.step = '1';
      slider.value = String(initialLevels[key]);
      slider.className = 'water-gauge-slider';
      slider.style.flex = '1';
      slider.addEventListener('input', () => {
        const val = Number(slider.value);
        display.textContent = val + '尺';
        if (this.levelChangeCallback) {
          this.levelChangeCallback(key, val);
        }
      });
      this.sliders.set(key, slider);
      row.appendChild(slider);

      const display = document.createElement('span');
      display.textContent = initialLevels[key] + '尺';
      display.style.color = 'white';
      display.style.fontSize = '14px';
      display.style.minWidth = '35px';
      display.style.textAlign = 'right';
      display.style.fontFamily = "'楷体', 'KaiTi', serif";
      this.valueDisplays.set(key, display);
      row.appendChild(display);

      panel.appendChild(row);
    }

    this.leftPanel = panel;
    this.container.appendChild(panel);
  }

  private createAlertBoxes() {
    const tops = [20, 120, 220];
    LOCATION_KEYS.forEach((key, i) => {
      const box = document.createElement('div');
      box.style.position = 'fixed';
      box.style.right = '-200px';
      box.style.top = tops[i] + 'px';
      box.style.width = '80px';
      box.style.height = '80px';
      box.style.borderRadius = '50%';
      box.style.background = 'radial-gradient(circle, rgba(205,133,63,0.95) 0%, rgba(205,133,63,0.8) 100%)';
      box.style.border = '2px solid #8B6914';
      box.style.display = 'flex';
      box.style.alignItems = 'center';
      box.style.justifyContent = 'center';
      box.style.zIndex = '200';
      box.style.transition = 'right 0.5s ease-out';

      const text = document.createElement('span');
      text.textContent = LOCATION_LABELS[key] + '水位超限，请立即检查堤防！';
      text.style.color = 'white';
      text.style.fontFamily = "'宋体', 'SimSun', serif";
      text.style.fontSize = '11px';
      text.style.lineHeight = '1.3';
      text.style.textAlign = 'center';
      text.style.padding = '8px';
      box.appendChild(text);

      this.alertBoxes.set(key, box);
      this.container.appendChild(box);
    });
  }

  private createRightPanel() {
    const panel = document.createElement('div');
    const vw = window.innerWidth;
    const w = Math.min(360, Math.max(280, vw * 0.25));
    const h = Math.min(400, Math.round(400 * w / 280));
    panel.style.position = 'fixed';
    panel.style.right = '20px';
    panel.style.top = '50%';
    panel.style.transform = 'translateY(-50%)';
    panel.style.width = w + 'px';
    panel.style.height = h + 'px';
    panel.style.background = 'linear-gradient(180deg, #F5F0E1 0%, #EDE4CC 100%)';
    panel.style.border = '2px solid #C2B280';
    panel.style.borderRadius = '6px';
    panel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15), inset 0 0 30px rgba(194,178,128,0.1)';
    panel.style.zIndex = '100';

    const header = document.createElement('div');
    header.textContent = '水位记录';
    header.style.fontFamily = "'楷体', 'KaiTi', serif";
    header.style.fontSize = '16px';
    header.style.color = '#4A2C1A';
    header.style.borderBottom = '1px solid #C2B280';
    header.style.padding = '10px 15px';
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    header.addEventListener('mousedown', (e) => this.startDrag(e, panel));
    panel.appendChild(header);

    const canvasContainer = document.createElement('div');
    canvasContainer.style.padding = '10px 15px';
    canvasContainer.style.display = 'flex';
    canvasContainer.style.justifyContent = 'center';

    const canvas = document.createElement('canvas');
    this.canvasWidth = Math.round(w - 30);
    this.canvasHeight = Math.round(h - 60);
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    canvas.style.borderRadius = '4px';
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    canvasContainer.appendChild(canvas);
    panel.appendChild(canvasContainer);

    canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    canvas.addEventListener('mouseout', () => {
      this.hoveredPoint = null;
      this.tooltip.style.display = 'none';
      this.drawChart();
    });

    this.rightPanel = panel;
    this.container.appendChild(panel);
  }

  private onCanvasMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.historyRecords.length === 0) {
      this.hoveredPoint = null;
      this.tooltip.style.display = 'none';
      return;
    }

    const lineChartHeight = this.canvasHeight * 0.6;
    const padding = { left: 35, right: 15, top: 15, bottom: 25 };
    const chartW = this.canvasWidth - padding.left - padding.right;
    const chartH = lineChartHeight - padding.top - padding.bottom;
    const n = this.historyRecords.length;

    let closest: { x: number; y: number; value: number; time: string; color: string } | null = null;
    let minDist = 15;

    const colors: Record<string, string> = { upstream: '#CC3333', midstream: '#2E6E8E', downstream: '#4A7C59' };

    for (const key of LOCATION_KEYS) {
      for (let i = 0; i < n; i++) {
        const x = padding.left + (i / Math.max(n - 1, 1)) * chartW;
        const val = this.historyRecords[i].values[key as keyof WaterLevelData];
        const y = padding.top + (1 - val / 150) * chartH;
        const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = { x, y, value: val, time: this.historyRecords[i].time, color: colors[key] };
        }
      }
    }

    if (closest) {
      this.hoveredPoint = closest;
      this.tooltip.style.display = 'block';
      this.tooltip.style.opacity = '1';
      this.tooltip.textContent = `水位: ${closest.value}尺\n时间: ${closest.time}`;
      const canvasRect = this.canvas.getBoundingClientRect();
      this.tooltip.style.left = (canvasRect.left + closest.x + 10) + 'px';
      this.tooltip.style.top = (canvasRect.top + closest.y - 30) + 'px';
    } else {
      this.hoveredPoint = null;
      this.tooltip.style.display = 'none';
    }

    this.drawChart();
  }

  private drawChart() {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    ctx.clearRect(0, 0, w, h);

    const lineH = h * 0.6;
    const barH = h * 0.4;
    const padding = { left: 35, right: 15, top: 15, bottom: 25 };
    const chartW = w - padding.left - padding.right;
    const lineChartH = lineH - padding.top - padding.bottom;

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * lineChartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      const label = 150 - (i / 5) * 150;
      ctx.fillStyle = '#8B7355';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(label)), padding.left - 5, y + 3);
    }
    ctx.setLineDash([]);
    ctx.restore();

    const n = this.historyRecords.length;
    if (n === 0) {
      ctx.fillStyle = '#8B7355';
      ctx.font = '14px "楷体", serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', w / 2, lineH / 2);
      this.drawBarChart(ctx, w, lineH, barH, padding);
      return;
    }

    const colors: Record<string, string> = { upstream: '#CC3333', midstream: '#2E6E8E', downstream: '#4A7C59' };

    for (const key of LOCATION_KEYS) {
      ctx.beginPath();
      ctx.strokeStyle = colors[key];
      ctx.lineWidth = 2;
      for (let i = 0; i < n; i++) {
        const x = padding.left + (i / Math.max(n - 1, 1)) * chartW;
        const val = this.historyRecords[i].values[key as keyof WaterLevelData];
        const y = padding.top + (1 - val / 150) * lineChartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        const x = padding.left + (i / Math.max(n - 1, 1)) * chartW;
        const val = this.historyRecords[i].values[key as keyof WaterLevelData];
        const y = padding.top + (1 - val / 150) * lineChartH;

        if (this.hoveredPoint &&
            Math.abs(x - this.hoveredPoint.x) < 2 &&
            Math.abs(y - this.hoveredPoint.y) < 2 &&
            colors[key] === this.hoveredPoint.color) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#FFD700';
          ctx.fill();
          ctx.strokeStyle = colors[key];
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = colors[key];
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = '#8B7355';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const x = padding.left + (i / Math.max(n - 1, 1)) * chartW;
      const timeStr = this.historyRecords[i].time;
      ctx.fillText(timeStr, x, lineH - 3);
    }

    this.drawBarChart(ctx, w, lineH, barH, padding);
  }

  private drawBarChart(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    offsetY: number,
    barAreaH: number,
    padding: { left: number; right: number; top: number; bottom: number }
  ) {
    const barPad = { left: 35, right: 15, top: 20, bottom: 20 };
    const barChartW = canvasW - barPad.left - barPad.right;
    const barChartH = barAreaH - barPad.top - barPad.bottom;
    const n = this.historyRecords.length;

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = offsetY + barPad.top + (i / 3) * barChartH;
      ctx.beginPath();
      ctx.moveTo(barPad.left, y);
      ctx.lineTo(barPad.left + barChartW, y);
      ctx.stroke();
      const label = 150 - (i / 3) * 150;
      ctx.fillStyle = '#8B7355';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(label)), barPad.left - 5, y + 3);
    }
    ctx.setLineDash([]);
    ctx.restore();

    if (n === 0) return;

    const barWidth = 15;
    const gap = 5;
    const totalBarWidth = n * barWidth + (n - 1) * gap;
    const startX = barPad.left + (barChartW - totalBarWidth) / 2;

    for (let i = 0; i < n; i++) {
      const v = this.historyRecords[i].values;
      const maxVal = Math.max(v.upstream, v.midstream, v.downstream);
      const barPixelH = (maxVal / 150) * barChartH;
      const x = startX + i * (barWidth + gap);
      const y = offsetY + barPad.top + barChartH - barPixelH;

      const gradient = ctx.createLinearGradient(x, y + barPixelH, x, y);
      gradient.addColorStop(0, '#8B0000');
      gradient.addColorStop(1, '#FF8C00');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barPixelH);

      ctx.fillStyle = '#4A2C1A';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(maxVal)), x + barWidth / 2, y - 3);
    }
  }

  private startDrag(e: MouseEvent, panel: HTMLElement) {
    const rect = panel.getBoundingClientRect();
    const currentTop = rect.top;
    const currentLeft = rect.left;
    panel.style.top = currentTop + 'px';
    panel.style.left = currentLeft + 'px';
    panel.style.right = 'auto';
    panel.style.transform = 'none';

    this.dragging = {
      panel,
      offsetX: e.clientX - currentLeft,
      offsetY: e.clientY - currentTop
    };
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.dragging) return;
    const { panel, offsetX, offsetY } = this.dragging;
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    const maxLeft = window.innerWidth - panel.offsetWidth;
    const maxTop = window.innerHeight - panel.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
    panel.style.right = 'auto';
    panel.style.transform = 'none';
  }

  private onMouseUp() {
    this.dragging = null;
  }

  private onResize() {
    const vw = window.innerWidth;
    const leftW = Math.min(280, Math.max(220, vw * 0.25));
    const rightW = Math.min(360, Math.max(280, vw * 0.25));
    const rightH = Math.min(400, Math.round(400 * rightW / 280));

    this.leftPanel.style.width = leftW + 'px';
    this.rightPanel.style.width = rightW + 'px';
    this.rightPanel.style.height = rightH + 'px';

    this.canvasWidth = Math.round(rightW - 30);
    this.canvasHeight = Math.round(rightH - 60);
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.drawChart();
  }

  setWaterLevels(levels: WaterLevelData): void {
    for (const key of LOCATION_KEYS) {
      const slider = this.sliders.get(key);
      const display = this.valueDisplays.get(key);
      if (slider) slider.value = String(levels[key]);
      if (display) display.textContent = levels[key] + '尺';
    }
  }

  addHistoryRecord(record: HistoryRecord): void {
    this.historyRecords.push(record);
    if (this.historyRecords.length > 10) {
      this.historyRecords.shift();
    }
    this.drawChart();
  }

  showAlert(location: string): void {
    const box = this.alertBoxes.get(location);
    if (box) {
      box.style.right = '20px';
    }
  }

  hideAlert(location: string): void {
    const box = this.alertBoxes.get(location);
    if (box) {
      box.style.right = '-200px';
    }
  }

  onLevelChange(cb: (location: string, value: number) => void): void {
    this.levelChangeCallback = cb;
  }

  onScaleClick(cb: (scaleValue: number) => void): void {
    this.scaleClickCallback = cb;
  }

  update(): void {}

  dispose(): void {
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    if (this.injectedStyle.parentNode) {
      this.injectedStyle.parentNode.removeChild(this.injectedStyle);
    }
    if (this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    if (this.leftPanel.parentNode) {
      this.leftPanel.parentNode.removeChild(this.leftPanel);
    }
    if (this.rightPanel.parentNode) {
      this.rightPanel.parentNode.removeChild(this.rightPanel);
    }
    this.alertBoxes.forEach((box) => {
      if (box.parentNode) box.parentNode.removeChild(box);
    });
    this.sliders.clear();
    this.valueDisplays.clear();
    this.alertBoxes.clear();
    this.historyRecords = [];
    this.levelChangeCallback = null;
    this.scaleClickCallback = null;
  }
}
