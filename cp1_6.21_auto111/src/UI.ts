import {
  getFlowAtTime,
  getHistoryFlows,
  predictTrend,
  getAverageFlow,
  getMaxFlowIntersection,
  Intersection
} from './trafficData';
import { Scene3D, ViewMode } from './scene3D';

export class UI {
  private container: HTMLElement;
  private scene3D: Scene3D;
  private currentHour: number = 8;
  private isPlaying: boolean = false;
  private selectedIntersection: Intersection | null = null;
  private infoPanel: HTMLElement | null = null;
  private timeSlider: HTMLInputElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private playBtn: HTMLElement | null = null;

  constructor(container: HTMLElement, scene3D: Scene3D) {
    this.container = container;
    this.scene3D = scene3D;
    this.buildUI();
    this.bindEvents();
  }

  private buildUI(): void {
    this.createSearchInput();
    this.createSummaryPanel();
    this.createViewToolbar();
    this.createTimeSlider();
    this.createInfoPanel();
    this.applyStyles();
  }

  private createSearchInput(): void {
    const inputWrapper = document.createElement('div');
    inputWrapper.id = 'search-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'city-input';
    input.placeholder = '输入城市名称...';
    input.value = '上海';

    inputWrapper.appendChild(input);
    this.container.appendChild(inputWrapper);
  }

  private createSummaryPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'summary-panel';

    const title = document.createElement('div');
    title.className = 'summary-title';
    title.textContent = '实时数据摘要';

    const timeRow = document.createElement('div');
    timeRow.className = 'summary-row';
    timeRow.innerHTML = `<span>当前时间</span><span id="summary-time" class="mono">08:00</span>`;

    const avgRow = document.createElement('div');
    avgRow.className = 'summary-row';
    avgRow.innerHTML = `<span>平均流量</span><span id="summary-avg" class="mono">0</span>`;

    const maxRow = document.createElement('div');
    maxRow.className = 'summary-row';
    maxRow.innerHTML = `<span>最高路口</span><span id="summary-max" class="mono">-</span>`;

    const congestRow = document.createElement('div');
    congestRow.className = 'summary-row';
    congestRow.innerHTML = `<span>拥堵指数</span><span id="summary-congest" class="mono">0%</span>`;

    panel.appendChild(title);
    panel.appendChild(timeRow);
    panel.appendChild(avgRow);
    panel.appendChild(maxRow);
    panel.appendChild(congestRow);

    this.container.appendChild(panel);
  }

  private createViewToolbar(): void {
    const toolbar = document.createElement('div');
    toolbar.id = 'view-toolbar';

    const topBtn = document.createElement('button');
    topBtn.className = 'view-btn active';
    topBtn.dataset.view = 'top';
    topBtn.innerHTML = this.getViewIcon('top');
    topBtn.title = '俯视视角';

    const followBtn = document.createElement('button');
    followBtn.className = 'view-btn';
    followBtn.dataset.view = 'follow';
    followBtn.innerHTML = this.getViewIcon('follow');
    followBtn.title = '跟随视角';

    const roamBtn = document.createElement('button');
    roamBtn.className = 'view-btn';
    roamBtn.dataset.view = 'roam';
    roamBtn.innerHTML = this.getViewIcon('roam');
    roamBtn.title = '漫游视角';

    toolbar.appendChild(topBtn);
    toolbar.appendChild(followBtn);
    toolbar.appendChild(roamBtn);

    this.container.appendChild(toolbar);
  }

  private getViewIcon(view: string): string {
    switch (view) {
      case 'top':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
          <circle cx="12" cy="12" r="9" stroke-dasharray="2 2"/>
        </svg>`;
      case 'follow':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>`;
      case 'roam':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12a7 7 0 0 1 14 0"/>
          <path d="M12 5a7 7 0 0 1 7 7"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>`;
      default:
        return '';
    }
  }

  private createTimeSlider(): void {
    const timeControl = document.createElement('div');
    timeControl.id = 'time-control';

    const playBtn = document.createElement('button');
    playBtn.id = 'play-btn';
    playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>`;
    playBtn.title = '播放';
    this.playBtn = playBtn;

    const sliderWrapper = document.createElement('div');
    sliderWrapper.id = 'slider-wrapper';

    const timeDisplay = document.createElement('span');
    timeDisplay.id = 'time-display';
    timeDisplay.className = 'mono';
    timeDisplay.textContent = '06:00';
    this.timeDisplay = timeDisplay;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'time-slider';
    slider.min = '6';
    slider.max = '22';
    slider.step = '0.1';
    slider.value = '8';
    this.timeSlider = slider;

    const endTime = document.createElement('span');
    endTime.id = 'end-time';
    endTime.className = 'mono';
    endTime.textContent = '22:00';

    sliderWrapper.appendChild(timeDisplay);
    sliderWrapper.appendChild(slider);
    sliderWrapper.appendChild(endTime);

    timeControl.appendChild(playBtn);
    timeControl.appendChild(sliderWrapper);

    this.container.appendChild(timeControl);
  }

  private createInfoPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'info-panel';
    panel.style.display = 'none';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'info-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = '关闭';

    const nameLabel = document.createElement('div');
    nameLabel.id = 'info-name';
    nameLabel.className = 'info-name';

    const flowRow = document.createElement('div');
    flowRow.className = 'info-row';
    flowRow.innerHTML = `<span>当前流量</span><span id="info-flow" class="mono">0</span>`;

    const chartLabel = document.createElement('div');
    chartLabel.className = 'info-chart-label';
    chartLabel.textContent = '历史流量';

    const canvas = document.createElement('canvas');
    canvas.id = 'history-chart';
    canvas.width = 200;
    canvas.height = 60;

    const trendRow = document.createElement('div');
    trendRow.className = 'info-row';
    trendRow.innerHTML = `<span>预测趋势</span><span id="info-trend">-</span>`;

    panel.appendChild(closeBtn);
    panel.appendChild(nameLabel);
    panel.appendChild(flowRow);
    panel.appendChild(chartLabel);
    panel.appendChild(canvas);
    panel.appendChild(trendRow);

    this.container.appendChild(panel);
    this.infoPanel = panel;
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #search-input-wrapper {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
      }
      #city-input {
        width: 320px;
        height: 40px;
        border-radius: 8px;
        background-color: #F3F4F6;
        border: 2px solid transparent;
        padding: 0 16px;
        font-size: 14px;
        font-family: system-ui, sans-serif;
        color: #1E293B;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      #city-input:focus {
        border-color: #6366F1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
      }
      #city-input::placeholder {
        color: #94A3B8;
      }
      #summary-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 200px;
        height: 120px;
        background-color: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 12px 14px;
        z-index: 100;
        border: 1px solid rgba(99, 102, 241, 0.2);
        transition: transform 0.2s ease;
      }
      .summary-title {
        font-size: 13px;
        font-weight: 600;
        color: #94A3B8;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #CBD5E1;
        margin-bottom: 4px;
      }
      .summary-row span:last-child {
        color: #22D3EE;
        font-weight: 600;
      }
      .mono {
        font-family: 'Courier New', monospace;
      }
      #view-toolbar {
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 100;
      }
      .view-btn {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background-color: #1E293B;
        border: none;
        color: #94A3B8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        border: 1px solid rgba(99, 102, 241, 0.15);
      }
      .view-btn:hover {
        background-color: #334155;
        color: #E2E8F0;
        transform: scale(1.05);
      }
      .view-btn.active {
        background-color: #6366F1;
        color: white;
        border-color: #6366F1;
      }
      #time-control {
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 100;
        width: 80%;
        max-width: 700px;
      }
      #play-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #6366F1;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        padding-left: 3px;
      }
      #play-btn:hover {
        background-color: #818CF8;
        transform: scale(1.05);
      }
      #play-btn.playing {
        background-color: #EF4444;
      }
      #slider-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        background-color: rgba(30, 41, 59, 0.8);
        padding: 10px 16px;
        border-radius: 10px;
        border: 1px solid rgba(99, 102, 241, 0.2);
      }
      #time-display, #end-time {
        font-size: 12px;
        color: #94A3B8;
        min-width: 45px;
        text-align: center;
      }
      #time-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: #334155;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }
      #time-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #6366F1;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        transition: transform 0.2s ease;
      }
      #time-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
      #time-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #6366F1;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
      }
      #info-panel {
        position: absolute;
        width: 240px;
        height: 160px;
        background-color: rgba(30, 41, 59, 0.9);
        backdrop-filter: blur(12px);
        border-radius: 12px;
        padding: 14px 16px;
        z-index: 200;
        color: white;
        border: 1px solid rgba(99, 102, 241, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #info-close-btn {
        position: absolute;
        top: 8px;
        left: 10px;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: #94A3B8;
        font-size: 20px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        transition: color 0.2s ease;
      }
      #info-close-btn:hover {
        color: #EF4444;
      }
      .info-name {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 8px;
        margin-left: 28px;
        color: #F1F5F9;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #94A3B8;
        margin-bottom: 6px;
      }
      .info-row span:last-child {
        color: #22D3EE;
        font-weight: 600;
      }
      .info-chart-label {
        font-size: 11px;
        color: #64748B;
        margin-top: 6px;
        margin-bottom: 2px;
      }
      #history-chart {
        width: 200px;
        height: 60px;
        display: block;
      }
      #info-trend.上升 {
        color: #EF4444 !important;
      }
      #info-trend.下降 {
        color: #22C55E !important;
      }
      #info-trend.平稳 {
        color: #EAB308 !important;
      }
    `;
    document.head.appendChild(style);
  }

  private bindEvents(): void {
    const cityInput = document.getElementById('city-input') as HTMLInputElement;
    if (cityInput) {
      cityInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        console.log('城市:', target.value);
      });
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('搜索城市:', cityInput.value);
        }
      });
    }

    if (this.timeSlider) {
      this.timeSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.setTime(value);
      });
    }

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => {
        this.togglePlay();
      });
    }

    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = (btn as HTMLElement).dataset.view as ViewMode;
        this.setViewMode(view);
      });
    });

    const closeBtn = document.getElementById('info-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideInfoPanel();
      });
    }

    this.scene3D.setOnColumnClick((intersection) => {
      this.showInfoPanel(intersection);
    });
  }

  public setTime(hour: number): void {
    this.currentHour = hour;
    this.scene3D.setTime(hour);

    if (this.timeDisplay) {
      const h = Math.floor(hour);
      const m = Math.floor((hour - h) * 60);
      this.timeDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    if (this.timeSlider && document.activeElement !== this.timeSlider) {
      this.timeSlider.value = hour.toString();
    }
  }

  public togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    if (this.playBtn) {
      if (this.isPlaying) {
        this.playBtn.classList.add('playing');
        this.playBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>`;
        this.playBtn.title = '暂停';
      } else {
        this.playBtn.classList.remove('playing');
        this.playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>`;
        this.playBtn.title = '播放';
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private setViewMode(view: ViewMode): void {
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach((btn) => {
      if ((btn as HTMLElement).dataset.view === view) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.scene3D.setViewMode(view);

    if (view === 'follow' && this.selectedIntersection) {
      this.scene3D.followIntersection(this.selectedIntersection);
    }
  }

  public showInfoPanel(intersection: Intersection): void {
    this.selectedIntersection = intersection;

    if (!this.infoPanel) return;

    const nameEl = document.getElementById('info-name');
    const flowEl = document.getElementById('info-flow');
    const trendEl = document.getElementById('info-trend');

    if (nameEl) nameEl.textContent = intersection.name;

    const flow = getFlowAtTime(intersection, this.currentHour);
    if (flowEl) flowEl.textContent = Math.round(flow).toString();

    const trend = predictTrend(intersection, this.currentHour);
    if (trendEl) {
      trendEl.textContent = trend;
      trendEl.className = '';
      trendEl.classList.add(trend);
    }

    this.drawHistoryChart(intersection);

    this.infoPanel.style.display = 'block';
    this.positionInfoPanel(intersection);

    if (this.scene3D.getViewMode() === 'follow') {
      this.scene3D.followIntersection(intersection);
    }
  }

  private positionInfoPanel(intersection: Intersection): void {
    if (!this.infoPanel) return;

    const canvas = this.container.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const x = rect.width / 2 + intersection.x * 30 + 20;
    const y = rect.height / 2 - 30;

    const panelX = Math.max(20, Math.min(rect.width - 260, x));
    const panelY = Math.max(80, Math.min(rect.height - 200, y));

    this.infoPanel.style.left = `${panelX}px`;
    this.infoPanel.style.top = `${panelY}px`;
  }

  public hideInfoPanel(): void {
    if (this.infoPanel) {
      this.infoPanel.style.display = 'none';
    }
    this.selectedIntersection = null;
  }

  private drawHistoryChart(intersection: Intersection): void {
    const canvas = document.getElementById('history-chart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const history = getHistoryFlows(intersection, this.currentHour, 24);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    history.forEach((flow, i) => {
      const x = (i / (history.length - 1)) * canvas.width;
      const y = canvas.height - (flow / 100) * canvas.height;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = ((i - 1) / (history.length - 1)) * canvas.width;
        const prevY = canvas.height - (history[i - 1] / 100) * canvas.height;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
      }
    });

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    history.forEach((flow, i) => {
      const x = (i / (history.length - 1)) * canvas.width;
      const y = canvas.height - (flow / 100) * canvas.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = ((i - 1) / (history.length - 1)) * canvas.width;
        const prevY = canvas.height - (history[i - 1] / 100) * canvas.height;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
      }
    });
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  public updateSummary(): void {
    const timeEl = document.getElementById('summary-time');
    const avgEl = document.getElementById('summary-avg');
    const maxEl = document.getElementById('summary-max');
    const congestEl = document.getElementById('summary-congest');

    const hour = this.currentHour;
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);

    if (timeEl) {
      timeEl.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const avgFlow = getAverageFlow(hour);
    if (avgEl) {
      avgEl.textContent = avgFlow.toFixed(1);
    }

    const maxInfo = getMaxFlowIntersection(hour);
    if (maxEl) {
      maxEl.textContent = `${maxInfo.name} ${maxInfo.flow.toFixed(0)}`;
    }

    const congestionIndex = (avgFlow / 100) * 100;
    if (congestEl) {
      congestEl.textContent = `${congestionIndex.toFixed(1)}%`;
    }

    if (this.selectedIntersection && this.infoPanel) {
      const flowEl = document.getElementById('info-flow');
      const trendEl = document.getElementById('info-trend');
      const flow = getFlowAtTime(this.selectedIntersection, hour);
      if (flowEl) flowEl.textContent = Math.round(flow).toString();
      const trend = predictTrend(this.selectedIntersection, hour);
      if (trendEl) {
        trendEl.textContent = trend;
        trendEl.className = '';
        trendEl.classList.add(trend);
      }
      this.drawHistoryChart(this.selectedIntersection);
    }
  }
}
