import * as d3 from 'd3';
import { TimeRange } from '../core/data-loader';

export interface UIPanelConfig {
  container: HTMLElement;
  onTimeRangeChange?: (range: TimeRange) => void;
  onAutoRotateToggle?: (enabled: boolean) => void;
}

export interface StatsData {
  totalAttacks: number;
  topCountries: Array<{
    country: string;
    countryCode: string;
    frequency: number;
    percentage: number;
  }>;
  minFrequency: number;
  maxFrequency: number;
  currentTimeRange: TimeRange;
}

export class UIPanel {
  private container: HTMLElement;
  private panel: HTMLDivElement;
  private isCollapsed: boolean = false;
  private autoRotateEnabled: boolean = true;

  private onTimeRangeChange?: (range: TimeRange) => void;
  private onAutoRotateToggle?: (enabled: boolean) => void;

  private totalCountEl: HTMLDivElement | null = null;
  private topListEl: HTMLDivElement | null = null;
  private legendEl: HTMLDivElement | null = null;
  private toggleBtn: HTMLButtonElement | null = null;
  private timeButtons: Map<TimeRange, HTMLButtonElement> = new Map();
  private rotateBtn: HTMLButtonElement | null = null;

  private previousTotal: number = 0;
  private currentStats: StatsData | null = null;

  private colorScale: d3.ScaleLinear<string, string>;

  constructor(config: UIPanelConfig) {
    this.container = config.container;
    this.onTimeRangeChange = config.onTimeRangeChange;
    this.onAutoRotateToggle = config.onAutoRotateToggle;

    this.colorScale = d3.scaleLinear<string>()
      .domain([0, 0.25, 0.5, 0.75, 1])
      .range(['#0066ff', '#00ccff', '#00ffcc', '#ffcc00', '#ff3355'])
      .clamp(true);

    this.injectStyles();
    this.createPanel();
  }

  private injectStyles(): void {
    const styleId = 'cyber-panel-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .cyber-panel {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 340px;
        z-index: 500;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, rgba(0, 20, 40, 0.72), rgba(0, 30, 60, 0.62));
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border-right: 1px solid rgba(0, 200, 255, 0.25);
        box-shadow: 4px 0 30px rgba(0, 100, 200, 0.15),
                    inset -1px 0 0 rgba(0, 150, 255, 0.1);
        transform: translateX(0);
        transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                    width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .cyber-panel.collapsed {
        transform: translateX(-330px);
        width: 340px;
      }

      @media (max-width: 1600px) {
        .cyber-panel { width: 300px; }
        .cyber-panel.collapsed { transform: translateX(-290px); }
      }

      .panel-header {
        padding: 22px 24px 18px;
        border-bottom: 1px solid rgba(0, 150, 255, 0.2);
        position: relative;
        background: linear-gradient(180deg, rgba(0, 100, 180, 0.15), transparent);
      }

      .panel-title {
        font-size: 18px;
        font-weight: 600;
        color: #00e5ff;
        letter-spacing: 2.5px;
        text-shadow: 0 0 12px rgba(0, 229, 255, 0.5),
                     0 0 24px rgba(0, 229, 255, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .panel-title-icon {
        width: 22px;
        height: 22px;
        background: conic-gradient(from 0deg, #00e5ff, #0066ff, #00e5ff);
        border-radius: 50%;
        position: relative;
        animation: spin-icon 4s linear infinite;
      }

      @keyframes spin-icon {
        to { transform: rotate(360deg); }
      }

      .panel-title-icon::after {
        content: '';
        position: absolute;
        inset: 4px;
        background: rgba(0, 10, 25, 0.9);
        border-radius: 50%;
      }

      .panel-subtitle {
        font-size: 11px;
        color: #5a8aa0;
        margin-top: 6px;
        letter-spacing: 3px;
        text-transform: uppercase;
      }

      .panel-toggle {
        position: absolute;
        right: -14px;
        top: 50%;
        transform: translateY(-50%);
        width: 28px;
        height: 60px;
        background: linear-gradient(180deg, rgba(0, 40, 80, 0.9), rgba(0, 20, 50, 0.95));
        border: 1px solid rgba(0, 180, 255, 0.4);
        border-left: none;
        border-radius: 0 8px 8px 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00e5ff;
        font-size: 14px;
        box-shadow: 2px 0 15px rgba(0, 100, 200, 0.3);
        transition: all 0.3s ease;
      }

      .panel-toggle:hover {
        background: linear-gradient(180deg, rgba(0, 80, 150, 0.9), rgba(0, 40, 90, 0.95));
        box-shadow: 2px 0 20px rgba(0, 180, 255, 0.5);
      }

      .panel-toggle svg {
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .cyber-panel.collapsed .panel-toggle svg {
        transform: rotate(180deg);
      }

      .panel-body {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 150, 255, 0.4) transparent;
      }

      .panel-body::-webkit-scrollbar {
        width: 4px;
      }

      .panel-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .panel-body::-webkit-scrollbar-thumb {
        background: rgba(0, 150, 255, 0.3);
        border-radius: 2px;
      }

      .section-label {
        font-size: 10px;
        color: #5a8aa0;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-label::before {
        content: '';
        width: 6px;
        height: 6px;
        background: #00e5ff;
        border-radius: 50%;
        box-shadow: 0 0 8px #00e5ff;
      }

      .section {
        margin-bottom: 28px;
      }

      .time-range-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .time-btn {
        padding: 10px 6px;
        background: rgba(0, 40, 80, 0.4);
        border: 1px solid rgba(0, 150, 255, 0.2);
        border-radius: 6px;
        color: #8ab4c7;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        letter-spacing: 1px;
      }

      .time-btn:hover {
        background: rgba(0, 80, 150, 0.4);
        border-color: rgba(0, 200, 255, 0.5);
        color: #c0e8f5;
      }

      .time-btn.active {
        background: linear-gradient(135deg, rgba(0, 150, 255, 0.3), rgba(0, 100, 200, 0.2));
        border-color: rgba(0, 229, 255, 0.7);
        color: #00e5ff;
        box-shadow: 0 0 15px rgba(0, 180, 255, 0.3),
                    inset 0 0 10px rgba(0, 150, 255, 0.1);
        text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
      }

      .stats-card {
        background: linear-gradient(135deg, rgba(0, 60, 120, 0.25), rgba(0, 30, 70, 0.2));
        border: 1px solid rgba(0, 150, 255, 0.2);
        border-radius: 10px;
        padding: 18px;
        position: relative;
        overflow: hidden;
      }

      .stats-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.08), transparent);
        animation: card-sweep 4s ease-in-out infinite;
      }

      @keyframes card-sweep {
        0%, 100% { left: -100%; }
        50% { left: 100%; }
      }

      .stats-label {
        font-size: 11px;
        color: #5a8aa0;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .stats-value {
        font-size: 38px;
        font-weight: 700;
        font-family: 'Consolas', 'Courier New', monospace;
        background: linear-gradient(135deg, #00e5ff, #00aaff, #00e5ff);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1.1;
        text-shadow: 0 0 30px rgba(0, 200, 255, 0.3);
        letter-spacing: 1px;
      }

      .stats-sub {
        margin-top: 8px;
        font-size: 11px;
        color: #6a9ab0;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .live-dot {
        width: 6px;
        height: 6px;
        background: #00ff88;
        border-radius: 50%;
        animation: live-pulse 1.5s ease-in-out infinite;
        box-shadow: 0 0 8px #00ff88;
      }

      @keyframes live-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }

      .top-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .top-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: rgba(0, 40, 80, 0.3);
        border: 1px solid rgba(0, 100, 180, 0.15);
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .top-item:hover {
        background: rgba(0, 60, 120, 0.4);
        border-color: rgba(0, 180, 255, 0.3);
        transform: translateX(3px);
      }

      .top-rank {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        font-family: 'Consolas', monospace;
        flex-shrink: 0;
      }

      .top-rank.rank-1 {
        background: linear-gradient(135deg, #ff3355, #ff6644);
        color: #fff;
        box-shadow: 0 0 12px rgba(255, 60, 80, 0.4);
      }

      .top-rank.rank-2 {
        background: linear-gradient(135deg, #ff8833, #ffaa44);
        color: #fff;
        box-shadow: 0 0 12px rgba(255, 140, 60, 0.4);
      }

      .top-rank.rank-3 {
        background: linear-gradient(135deg, #ffcc00, #ffdd44);
        color: #443300;
        box-shadow: 0 0 12px rgba(255, 200, 60, 0.4);
      }

      .top-rank.rank-4, .top-rank.rank-5 {
        background: rgba(0, 100, 180, 0.3);
        color: #00e5ff;
        border: 1px solid rgba(0, 150, 255, 0.3);
      }

      .top-info {
        flex: 1;
        min-width: 0;
      }

      .top-country {
        font-size: 12.5px;
        font-weight: 600;
        color: #d0e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .top-bar-wrap {
        margin-top: 5px;
        height: 4px;
        background: rgba(0, 50, 100, 0.4);
        border-radius: 2px;
        overflow: hidden;
      }

      .top-bar-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.4s ease;
      }

      .top-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        flex-shrink: 0;
      }

      .top-freq {
        font-size: 13px;
        font-weight: 700;
        font-family: 'Consolas', monospace;
        color: #00e5ff;
      }

      .top-pct {
        font-size: 10px;
        color: #6a9ab0;
      }

      .legend-container {
        background: rgba(0, 30, 60, 0.4);
        border: 1px solid rgba(0, 100, 180, 0.2);
        border-radius: 8px;
        padding: 14px;
      }

      .legend-gradient {
        height: 10px;
        border-radius: 5px;
        margin-bottom: 8px;
      }

      .legend-labels {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #7aacbf;
        font-family: 'Consolas', monospace;
        letter-spacing: 0.5px;
      }

      .legend-labels span {
        position: relative;
      }

      .legend-center {
        text-align: center;
      }

      .controls-row {
        display: flex;
        gap: 8px;
      }

      .control-btn {
        flex: 1;
        padding: 10px 12px;
        background: rgba(0, 40, 80, 0.4);
        border: 1px solid rgba(0, 150, 255, 0.25);
        border-radius: 6px;
        color: #8ab4c7;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .control-btn:hover {
        background: rgba(0, 80, 150, 0.4);
        border-color: rgba(0, 200, 255, 0.5);
        color: #c0e8f5;
      }

      .control-btn.active {
        background: linear-gradient(135deg, rgba(0, 150, 255, 0.25), rgba(0, 100, 200, 0.15));
        border-color: rgba(0, 229, 255, 0.6);
        color: #00e5ff;
        box-shadow: 0 0 12px rgba(0, 180, 255, 0.25);
      }

      .panel-footer {
        padding: 14px 24px;
        border-top: 1px solid rgba(0, 150, 255, 0.15);
        font-size: 10px;
        color: #4a7080;
        letter-spacing: 2px;
        text-align: center;
        background: linear-gradient(0deg, rgba(0, 40, 80, 0.2), transparent);
      }

      .pulse-counter {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #00e5ff;
        border-radius: 50%;
        margin-right: 6px;
        animation: live-pulse 1.2s ease-in-out infinite;
        box-shadow: 0 0 6px #00e5ff;
      }
    `;

    document.head.appendChild(style);
  }

  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.className = 'cyber-panel';

    this.panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">
          <div class="panel-title-icon"></div>
          <span>CYBER SHIELD</span>
        </div>
        <div class="panel-subtitle">Global Threat Monitor</div>
        <button class="panel-toggle" aria-label="toggle panel">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="panel-body">
        <div class="section">
          <div class="section-label">Time Window</div>
          <div class="time-range-selector" id="timeSelector">
            <button class="time-btn active" data-range="24h">24 HOURS</button>
            <button class="time-btn" data-range="7d">7 DAYS</button>
            <button class="time-btn" data-range="30d">30 DAYS</button>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Attack Overview</div>
          <div class="stats-card">
            <div class="stats-label">Total Incidents</div>
            <div class="stats-value" id="totalCount">0</div>
            <div class="stats-sub">
              <span class="live-dot"></span>
              <span id="liveIndicator">LIVE MONITORING ACTIVE</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Top Affected Regions</div>
          <div class="top-list" id="topList"></div>
        </div>

        <div class="section">
          <div class="section-label">Threat Intensity</div>
          <div class="legend-container">
            <div class="legend-gradient" id="legendGradient"></div>
            <div class="legend-labels">
              <span id="legendMin">0</span>
              <span class="legend-center" id="legendMid">MEDIUM</span>
              <span id="legendMax">MAX</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-label">View Controls</div>
          <div class="controls-row">
            <button class="control-btn active" id="rotateBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              ROTATE
            </button>
          </div>
        </div>
      </div>
      <div class="panel-footer">
        <span class="pulse-counter"></span>
        THREAT INTELLIGENCE v2.4
      </div>
    `;

    this.container.appendChild(this.panel);

    this.cacheElements();
    this.bindEvents();
    this.setupLegendGradient();
  }

  private cacheElements(): void {
    this.totalCountEl = this.panel.querySelector('#totalCount');
    this.topListEl = this.panel.querySelector('#topList');
    this.legendEl = this.panel.querySelector('#legendGradient');
    this.toggleBtn = this.panel.querySelector('.panel-toggle');
    this.rotateBtn = this.panel.querySelector('#rotateBtn');

    const timeBtns = this.panel.querySelectorAll('.time-btn') as NodeListOf<HTMLButtonElement>;
    timeBtns.forEach(btn => {
      const range = btn.dataset.range as TimeRange;
      if (range) {
        this.timeButtons.set(range, btn);
      }
    });
  }

  private bindEvents(): void {
    this.toggleBtn?.addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.panel.classList.toggle('collapsed', this.isCollapsed);
    });

    this.timeButtons.forEach((btn, range) => {
      btn.addEventListener('click', () => {
        this.setActiveTimeRange(range);
      });
    });

    this.rotateBtn?.addEventListener('click', () => {
      this.autoRotateEnabled = !this.autoRotateEnabled;
      this.rotateBtn?.classList.toggle('active', this.autoRotateEnabled);
      this.onAutoRotateToggle?.(this.autoRotateEnabled);
    });
  }

  private setupLegendGradient(): void {
    if (!this.legendEl) return;

    const stops: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      stops.push(`${this.colorScale(t)} ${t * 100}%`);
    }

    this.legendEl.style.background = `linear-gradient(90deg, ${stops.join(', ')})`;
    this.legendEl.style.boxShadow = `0 0 15px rgba(0, 180, 255, 0.2)`;
  }

  public setActiveTimeRange(range: TimeRange): void {
    this.timeButtons.forEach((btn, r) => {
      btn.classList.toggle('active', r === range);
    });
    this.onTimeRangeChange?.(range);
  }

  public updateStats(stats: StatsData): void {
    this.currentStats = stats;
    this.animateTotal(stats.totalAttacks);
    this.renderTopList(stats.topCountries);
    this.updateLegendLabels(stats.minFrequency, stats.maxFrequency);
  }

  private animateTotal(target: number): void {
    if (!this.totalCountEl) return;

    const start = this.previousTotal;
    const duration = 800;
    const startTime = performance.now();
    const ease = d3.easeCubicOut;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = ease(t);
      const value = Math.round(start + (target - start) * eased);
      this.totalCountEl!.textContent = d3.format(',')(value);

      if (t < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
    this.previousTotal = target;
  }

  private renderTopList(countries: StatsData['topCountries']): void {
    if (!this.topListEl) return;

    const maxFreq = countries[0]?.frequency ?? 1;

    const maxPercentage = d3.max(countries, d => d.percentage) ?? 1;

    const html = countries.map((c, i) => {
      const rank = i + 1;
      const pctWidth = maxPercentage > 0 ? (c.percentage / maxPercentage * 100) : 0;
      const freqNorm = maxFreq > 0 ? c.frequency / maxFreq : 0;
      const barColor = this.colorScale(freqNorm);

      return `
        <div class="top-item">
          <div class="top-rank rank-${rank}">${rank}</div>
          <div class="top-info">
            <div class="top-country">${c.country}</div>
            <div class="top-bar-wrap">
              <div class="top-bar-fill" style="width: ${pctWidth}%; background: linear-gradient(90deg, ${barColor}88, ${barColor});"></div>
            </div>
          </div>
          <div class="top-meta">
            <div class="top-freq">${d3.format(',')(c.frequency)}</div>
            <div class="top-pct">${c.percentage.toFixed(1)}%</div>
          </div>
        </div>
      `;
    }).join('');

    this.topListEl.innerHTML = html;
  }

  private updateLegendLabels(min: number, max: number): void {
    const minEl = this.panel.querySelector('#legendMin') as HTMLElement | null;
    const maxEl = this.panel.querySelector('#legendMax') as HTMLElement | null;

    if (minEl) {
      minEl.textContent = d3.format(',')(Math.round(min));
    }
    if (maxEl) {
      maxEl.textContent = d3.format(',')(Math.round(max));
    }
  }

  public isPanelCollapsed(): boolean {
    return this.isCollapsed;
  }

  public setCollapsed(collapsed: boolean): void {
    this.isCollapsed = collapsed;
    this.panel.classList.toggle('collapsed', collapsed);
  }

  public destroy(): void {
    this.panel.remove();
  }
}
