import type { EnergyType } from '../model/data';

type FloorValue = number | 'all';

interface Callbacks {
  onFloor: (f: FloorValue) => void;
  onType: (t: EnergyType) => void;
  onTime: (h: number) => void;
}

const TYPE_LABELS: Record<EnergyType, { label: string; unit: string; icon: string }> = {
  electricity: { label: '电力', unit: 'kW·h', icon: '⚡' },
  water: { label: '水', unit: 'm³', icon: '💧' },
  gas: { label: '燃气', unit: 'm³', icon: '🔥' }
};

export class ControlPanel {
  private container: HTMLElement | null = null;
  private root: HTMLDivElement | null = null;
  private callbacks: Callbacks = { onFloor: () => {}, onType: () => {}, onTime: () => {} };

  private currentFloor: FloorValue = 'all';
  private currentType: EnergyType = 'electricity';
  private currentTime = 24;
  private totalFloors = 5;

  private statsEl: HTMLDivElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.root = document.createElement('div');
    this.root.className = 'control-panel';
    this.root.innerHTML = `
      <style>
        .control-panel {
          position: absolute;
          top: 24px;
          left: 24px;
          width: 340px;
          padding: 22px 24px 20px;
          background: rgba(26, 39, 51, 0.55);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          border: 1px solid rgba(0, 229, 255, 0.25);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.04);
          color: #e6f1ff;
          user-select: none;
        }
        .cp-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #00e5ff;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 229, 255, 0.15);
        }
        .cp-title::before {
          content: '';
          display: inline-block;
          width: 8px; height: 8px;
          background: #00e5ff;
          border-radius: 50%;
          box-shadow: 0 0 10px #00e5ff;
          animation: cpBlink 1.6s ease-in-out infinite;
        }
        @keyframes cpBlink { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        .cp-section { margin-bottom: 18px; }
        .cp-label {
          font-size: 11px;
          letter-spacing: 1.5px;
          color: #7fb0d9;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .cp-floor-select {
          width: 100%;
          padding: 9px 12px;
          background: rgba(15, 25, 35, 0.7);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 8px;
          color: #e6f1ff;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2300e5ff' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px;
        }
        .cp-floor-select:hover { border-color: rgba(0, 229, 255, 0.55); box-shadow: 0 0 0 3px rgba(0,229,255,0.08); }
        .cp-type-group {
          display: flex;
          gap: 6px;
          background: rgba(15, 25, 35, 0.55);
          border-radius: 10px;
          padding: 4px;
          border: 1px solid rgba(0, 229, 255, 0.12);
        }
        .cp-type-btn {
          flex: 1;
          padding: 9px 6px;
          border: none;
          background: transparent;
          color: #7fb0d9;
          font-family: inherit;
          font-size: 12px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.22s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .cp-type-btn:hover { color: #e6f1ff; transform: translateY(-1px); }
        .cp-type-btn .icon { font-size: 15px; }
        .cp-type-btn.active {
          background: linear-gradient(135deg, rgba(0,229,255,0.22), rgba(0,229,255,0.08));
          color: #00e5ff;
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.22), inset 0 0 0 1px rgba(0,229,255,0.35);
        }
        .cp-time-wrap { display: flex; flex-direction: column; gap: 6px; }
        .cp-time-row { display: flex; justify-content: space-between; font-size: 11px; color: #7fb0d9; }
        .cp-time-row span:last-child { color: #00e5ff; font-weight: 600; }
        .cp-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 4px;
          background: linear-gradient(to right, #00e5ff var(--val,50%), rgba(127,176,217,0.2) var(--val,50%));
          border-radius: 3px; outline: none; cursor: pointer;
        }
        .cp-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px;
          background: #00e5ff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,229,255,0.7);
          cursor: pointer; transition: transform 0.15s ease;
        }
        .cp-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
        .cp-slider::-moz-range-thumb {
          width: 16px; height: 16px;
          background: #00e5ff; border: none;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,229,255,0.7);
          cursor: pointer;
        }
        .cp-stats {
          margin-top: 6px;
          padding-top: 14px;
          border-top: 1px solid rgba(0, 229, 255, 0.12);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .cp-stat { display: flex; flex-direction: column; gap: 2px; }
        .cp-stat-label { font-size: 10px; color: #7fb0d9; letter-spacing: 1px; text-transform: uppercase; }
        .cp-stat-value { font-size: 18px; font-weight: 600; color: #00e5ff; font-variant-numeric: tabular-nums; }
        .cp-stat-value.warn { color: #ff6b35; }
        .cp-legend {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(0, 229, 255, 0.12);
        }
        .cp-legend-bar {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(to right, #00e5ff, #7dd3fc, #ff6b35);
          box-shadow: 0 0 10px rgba(0,229,255,0.2);
        }
        .cp-legend-labels {
          display: flex; justify-content: space-between;
          font-size: 10px; color: #7fb0d9;
          margin-top: 5px;
        }
      </style>
      <div class="cp-title">楼宇能耗监控中心</div>
      <div class="cp-section">
        <div class="cp-label">楼层选择</div>
        <select class="cp-floor-select"></select>
      </div>
      <div class="cp-section">
        <div class="cp-label">能耗类型</div>
        <div class="cp-type-group"></div>
      </div>
      <div class="cp-section">
        <div class="cp-label">时间范围</div>
        <div class="cp-time-wrap">
          <div class="cp-time-row"><span>历史时长</span><span class="cp-time-val">24 小时</span></div>
          <input type="range" class="cp-slider" min="1" max="24" step="1" value="24" />
        </div>
      </div>
      <div class="cp-stats"></div>
      <div class="cp-legend">
        <div class="cp-label" style="margin-bottom:8px;">能耗色阶</div>
        <div class="cp-legend-bar"></div>
        <div class="cp-legend-labels">
          <span>低能耗</span><span>高能耗</span>
        </div>
      </div>
    `;
    container.appendChild(this.root);

    this.bindEvents();
    this.renderFloorOptions();
    this.renderTypeButtons();
    this.renderStats();
    this.updateSliderFill();
  }

  private bindEvents(): void {
    if (!this.root) return;
    const select = this.root.querySelector('.cp-floor-select') as HTMLSelectElement;
    select.addEventListener('change', e => {
      const v = (e.target as HTMLSelectElement).value;
      this.currentFloor = v === 'all' ? 'all' : Number(v);
      this.callbacks.onFloor(this.currentFloor);
    });

    const slider = this.root.querySelector('.cp-slider') as HTMLInputElement;
    slider.addEventListener('input', e => {
      const v = Number((e.target as HTMLInputElement).value);
      this.currentTime = v;
      this.updateSliderFill();
      const timeVal = this.root?.querySelector('.cp-time-val');
      if (timeVal) timeVal.textContent = `${v} 小时`;
      this.callbacks.onTime(v);
    });
  }

  private updateSliderFill(): void {
    const slider = this.root?.querySelector('.cp-slider') as HTMLInputElement | undefined;
    if (!slider) return;
    const pct = ((Number(slider.value) - 1) / 23) * 100;
    slider.style.setProperty('--val', `${pct}%`);
  }

  private renderFloorOptions(): void {
    const select = this.root?.querySelector('.cp-floor-select') as HTMLSelectElement | undefined;
    if (!select) return;
    select.innerHTML = `<option value="all">全部楼层</option>` +
      Array.from({ length: this.totalFloors }, (_, i) =>
        `<option value="${i}">第 ${i + 1} 层</option>`
      ).join('');
  }

  private renderTypeButtons(): void {
    const group = this.root?.querySelector('.cp-type-group') as HTMLDivElement | undefined;
    if (!group) return;
    group.innerHTML = '';
    (Object.keys(TYPE_LABELS) as EnergyType[]).forEach(type => {
      const btn = document.createElement('button');
      btn.className = 'cp-type-btn' + (type === this.currentType ? ' active' : '');
      btn.innerHTML = `<span class="icon">${TYPE_LABELS[type].icon}</span><span>${TYPE_LABELS[type].label}</span>`;
      btn.addEventListener('click', () => {
        this.currentType = type;
        group.querySelectorAll('.cp-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onType(type);
      });
      group.appendChild(btn);
    });
  }

  private renderStats(): void {
    const box = this.root?.querySelector('.cp-stats') as HTMLDivElement | undefined;
    if (!box) return;
    box.innerHTML = `
      <div class="cp-stat"><span class="cp-stat-label">当前能耗</span><span class="cp-stat-value cp-val-cur">--</span></div>
      <div class="cp-stat"><span class="cp-stat-label">异常房间</span><span class="cp-stat-value cp-val-anomaly warn">0</span></div>
    `;
    this.statsEl = box;
  }

  setTotalFloors(n: number): void {
    this.totalFloors = n;
    this.renderFloorOptions();
  }

  updateStats(current: number, unit: string, anomalyCount: number): void {
    if (!this.statsEl) return;
    const cur = this.statsEl.querySelector('.cp-val-cur');
    const an = this.statsEl.querySelector('.cp-val-anomaly');
    if (cur) cur.textContent = `${current.toFixed(1)} ${unit}`;
    if (an) an.textContent = String(anomalyCount);
  }

  getTypeLabel(type: EnergyType) { return TYPE_LABELS[type]; }

  onFloorChange(cb: (f: FloorValue) => void): void { this.callbacks.onFloor = cb; }
  onTypeChange(cb: (t: EnergyType) => void): void { this.callbacks.onType = cb; }
  onTimeRangeChange(cb: (h: number) => void): void { this.callbacks.onTime = cb; }
}
