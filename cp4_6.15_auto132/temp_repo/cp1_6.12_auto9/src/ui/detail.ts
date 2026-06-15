import * as d3 from 'd3';
import type { EnergyDataPoint, EnergyType } from '../model/data';
import type { RoomInfo } from '../model/building';

export class DetailPanel {
  private container: HTMLElement | null = null;
  private root: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private closeCb: () => void = () => {};
  private visible = false;
  private currentRoomId: string | null = null;
  private currentData: EnergyDataPoint[] = [];

  mount(container: HTMLElement): void {
    this.container = container;
    this.root = document.createElement('div');
    this.root.className = 'detail-panel';
    this.root.innerHTML = `
      <style>
        .detail-panel {
          position: absolute;
          top: 0; right: 0;
          width: 380px; height: 100%;
          background: rgba(15, 25, 35, 0.78);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          border-left: 1px solid rgba(0, 229, 255, 0.22);
          box-shadow: -8px 0 32px rgba(0,0,0,0.5);
          transform: translateX(100%);
          opacity: 0;
          transition: transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease;
          display: flex; flex-direction: column;
          color: #e6f1ff;
          z-index: 20;
          pointer-events: auto;
        }
        .detail-panel.show { transform: translateX(0); opacity: 1; }
        .dp-header {
          padding: 22px 24px 18px;
          display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 1px solid rgba(0,229,255,0.15);
        }
        .dp-title { display: flex; flex-direction: column; gap: 6px; }
        .dp-room-id {
          font-size: 12px; letter-spacing: 2px; color: #00e5ff;
          text-transform: uppercase;
        }
        .dp-room-name { font-size: 19px; font-weight: 600; color: #e6f1ff; }
        .dp-close {
          width: 34px; height: 34px;
          background: rgba(0,229,255,0.08);
          border: 1px solid rgba(0,229,255,0.25);
          color: #7fb0d9;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .dp-close:hover { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.5); color: #ff6b35; transform: rotate(90deg); }
        .dp-body { padding: 22px 24px; flex: 1; overflow-y: auto; }
        .dp-body::-webkit-scrollbar { width: 4px; }
        .dp-body::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.25); border-radius: 2px; }
        .dp-status {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: rgba(0,229,255,0.06);
          border: 1px solid rgba(0,229,255,0.2);
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .dp-status.warn {
          background: rgba(255,107,53,0.08);
          border-color: rgba(255,107,53,0.4);
        }
        .dp-status-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #00e5ff;
          box-shadow: 0 0 8px #00e5ff;
        }
        .dp-status.warn .dp-status-dot {
          background: #ff3b30;
          box-shadow: 0 0 12px #ff3b30;
          animation: dpPulse 0.9s ease-in-out infinite;
        }
        @keyframes dpPulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.5);opacity:0.5;} }
        .dp-status-text { font-size: 13px; }
        .dp-status-text b { color: inherit; }
        .dp-status.warn .dp-status-text b { color: #ff6b35; }
        .dp-metrics {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin-bottom: 20px;
        }
        .dp-metric {
          padding: 14px;
          background: rgba(26, 39, 51, 0.7);
          border: 1px solid rgba(0,229,255,0.12);
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        .dp-metric:hover { border-color: rgba(0,229,255,0.35); transform: translateY(-1px); }
        .dp-metric-label { font-size: 10px; letter-spacing: 1.5px; color: #7fb0d9; text-transform: uppercase; margin-bottom: 5px; }
        .dp-metric-value { font-size: 22px; font-weight: 600; color: #00e5ff; font-variant-numeric: tabular-nums; }
        .dp-metric-unit { font-size: 11px; color: #7fb0d9; margin-left: 4px; font-weight: 400; }
        .dp-chart-section { }
        .dp-chart-title { font-size: 11px; letter-spacing: 1.5px; color: #7fb0d9; text-transform: uppercase; margin-bottom: 10px; }
        .dp-canvas-wrap {
          background: rgba(10, 20, 32, 0.8);
          border: 1px solid rgba(0,229,255,0.15);
          border-radius: 10px;
          padding: 12px;
          position: relative;
          overflow: hidden;
        }
        .dp-canvas-wrap::before {
          content: ''; position: absolute; inset: 0;
          background:
            linear-gradient(transparent 95%, rgba(0,229,255,0.08) 95%) 0 0/100% 20px,
            linear-gradient(90deg, transparent 95%, rgba(0,229,255,0.08) 95%) 0 0/20px 100%;
          pointer-events: none;
        }
        .dp-canvas { width: 100%; height: 180px; display: block; }
        .dp-type-switch {
          display: flex; gap: 6px; margin-bottom: 16px;
        }
        .dp-type-btn {
          flex: 1; padding: 7px;
          background: rgba(15,25,35,0.6);
          border: 1px solid rgba(0,229,255,0.15);
          color: #7fb0d9;
          border-radius: 7px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dp-type-btn:hover { color: #e6f1ff; }
        .dp-type-btn.active {
          background: rgba(0,229,255,0.15);
          border-color: rgba(0,229,255,0.5);
          color: #00e5ff;
        }
      </style>
      <div class="dp-header">
        <div class="dp-title">
          <span class="dp-room-id dp-rid">ROOM ID</span>
          <span class="dp-room-name dp-rname">房间名称</span>
        </div>
        <button class="dp-close" title="关闭">✕</button>
      </div>
      <div class="dp-body">
        <div class="dp-status">
          <span class="dp-status-dot"></span>
          <span class="dp-status-text">运行状态：<b>正常</b></span>
        </div>
        <div class="dp-type-switch"></div>
        <div class="dp-metrics">
          <div class="dp-metric">
            <div class="dp-metric-label">当前值</div>
            <div class="dp-metric-value"><span class="dp-val-cur">--</span><span class="dp-metric-unit dp-unit">kW·h</span></div>
          </div>
          <div class="dp-metric">
            <div class="dp-metric-label">24h 均值</div>
            <div class="dp-metric-value"><span class="dp-val-avg">--</span><span class="dp-metric-unit dp-unit">kW·h</span></div>
          </div>
          <div class="dp-metric">
            <div class="dp-metric-label">峰值</div>
            <div class="dp-metric-value"><span class="dp-val-max">--</span><span class="dp-metric-unit dp-unit">kW·h</span></div>
          </div>
          <div class="dp-metric">
            <div class="dp-metric-label">谷值</div>
            <div class="dp-metric-value"><span class="dp-val-min">--</span><span class="dp-metric-unit dp-unit">kW·h</span></div>
          </div>
        </div>
        <div class="dp-chart-section">
          <div class="dp-chart-title">24 小时能耗趋势</div>
          <div class="dp-canvas-wrap">
            <canvas class="dp-canvas"></canvas>
          </div>
        </div>
      </div>
    `;
    container.appendChild(this.root);

    this.canvas = this.root.querySelector('.dp-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');

    this.root.querySelector('.dp-close')?.addEventListener('click', () => this.hide());
  }

  show(roomId: string, info: RoomInfo): void {
    if (!this.root) return;
    this.currentRoomId = roomId;
    const rid = this.root.querySelector('.dp-rid') as HTMLElement;
    const rname = this.root.querySelector('.dp-rname') as HTMLElement;
    if (rid) rid.textContent = `ROOM · ${info.id}`;
    if (rname) rname.textContent = info.name;
    this.root.classList.add('show');
    this.visible = true;
  }

  hide(): void {
    if (!this.root) return;
    this.root.classList.remove('show');
    this.visible = false;
    this.currentRoomId = null;
    this.closeCb();
  }

  isVisible(): boolean { return this.visible; }
  getCurrentRoomId(): string | null { return this.currentRoomId; }

  onClose(cb: () => void): void { this.closeCb = cb; }

  setupTypeSwitch(types: EnergyType[], initial: EnergyType, onChange: (t: EnergyType) => void): void {
    const box = this.root?.querySelector('.dp-type-switch');
    if (!box) return;
    const labels: Record<EnergyType, string> = { electricity: '电力', water: '水', gas: '燃气' };
    box.innerHTML = '';
    types.forEach(t => {
      const b = document.createElement('button');
      b.className = 'dp-type-btn' + (t === initial ? ' active' : '');
      b.textContent = labels[t];
      b.addEventListener('click', () => {
        box.querySelectorAll('.dp-type-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        onChange(t);
      });
      box.appendChild(b);
    });
  }

  update(
    data: EnergyDataPoint[],
    current: number,
    anomaly: boolean,
    unit: string,
    type: EnergyType
  ): void {
    if (!this.root) return;
    this.currentData = data;
    const status = this.root.querySelector('.dp-status') as HTMLElement;
    const statusText = status?.querySelector('.dp-status-text b');
    if (status) {
      status.classList.toggle('warn', anomaly);
      if (statusText) statusText.textContent = anomaly ? '异常报警' : '正常';
    }
    const unitEls = this.root.querySelectorAll('.dp-unit');
    unitEls.forEach(el => { (el as HTMLElement).textContent = unit; });
    const cur = this.root.querySelector('.dp-val-cur');
    const avg = this.root.querySelector('.dp-val-avg');
    const max = this.root.querySelector('.dp-val-max');
    const min = this.root.querySelector('.dp-val-min');
    const values = data.map(d => d.value);
    if (cur) cur.textContent = current.toFixed(1);
    if (avg) avg.textContent = (d3.mean(values) ?? 0).toFixed(1);
    if (max) max.textContent = (d3.max(values) ?? 0).toFixed(1);
    if (min) min.textContent = (d3.min(values) ?? 0).toFixed(1);

    this.drawChart(data, anomaly, type);
  }

  private drawChart(data: EnergyDataPoint[], anomaly: boolean, type: EnergyType): void {
    if (!this.canvas || !this.ctx || data.length < 2) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (this.canvas.width !== rect.width * dpr || this.canvas.height !== rect.height * dpr) {
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    const pad = { t: 10, r: 10, b: 22, l: 34 };
    ctx.clearRect(0, 0, W, H);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [number, number])
      .range([pad.l, W - pad.r]);
    const yMin = (d3.min(data, d => d.value) ?? 0) * 0.85;
    const yMax = (d3.max(data, d => d.value) ?? 1) * 1.15;
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([H - pad.b, pad.t]);

    ctx.strokeStyle = 'rgba(0,229,255,0.1)';
    ctx.lineWidth = 1;
    const yTicks = yScale.ticks(4);
    yTicks.forEach(t => {
      const y = yScale(t);
      ctx.beginPath();
      ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    });

    ctx.fillStyle = '#7fb0d9';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yTicks.forEach(t => {
      ctx.fillText(t.toFixed(0), pad.l - 6, yScale(t));
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = xScale.ticks(4);
    xTicks.forEach(t => {
      const date = new Date(t);
      const label = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      ctx.fillText(label, xScale(t), H - pad.b + 6);
    });

    const lineColor = anomaly ? '#ff6b35' : '#00e5ff';
    const line = d3.line<EnergyDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    const pathData = line(data);
    if (!pathData) { ctx.restore(); return; }

    const area = d3.area<EnergyDataPoint>()
      .x(d => xScale(d.timestamp))
      .y0(H - pad.b)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    const areaData = area(data);
    if (areaData) {
      const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
      grad.addColorStop(0, anomaly ? 'rgba(255,107,53,0.45)' : 'rgba(0,229,255,0.4)');
      grad.addColorStop(1, anomaly ? 'rgba(255,107,53,0)' : 'rgba(0,229,255,0)');
      ctx.fillStyle = grad;
      const p2 = new Path2D(areaData);
      ctx.fill(p2);
    }

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 8;
    const p = new Path2D(pathData);
    ctx.stroke(p);
    ctx.shadowBlur = 0;

    const last = data[data.length - 1];
    ctx.beginPath();
    ctx.arc(xScale(last.timestamp), yScale(last.value), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
