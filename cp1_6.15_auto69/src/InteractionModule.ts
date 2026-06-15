import axios from 'axios';
import type { BuildingData, HeatLevel } from './BuildingModule';
import type { BuildingHistory, ApiTemperatureResponse, ApiBuildingsResponse, BuildingModule } from './types';
import { getHeatLevel, temperatureToColor } from './BuildingModule';

const API_BASE = 'http://localhost:3002';

export class InteractionModule {
  private buildingModule: BuildingModule;
  private infoPanel: HTMLElement;

  constructor(buildingModule: BuildingModule, infoPanel: HTMLElement) {
    this.buildingModule = buildingModule;
    this.infoPanel = infoPanel;
    this.buildingModule.setClickHandler(this.handleBuildingClick.bind(this));
  }

  private async handleBuildingClick(building: BuildingData, temperature: number): Promise<void> {
    try {
      const response = await axios.get<BuildingHistory>(`${API_BASE}/api/history`, {
        params: { id: building.id },
      });
      this.renderInfoPanel(building, temperature, response.data);
    } catch (e) {
      this.renderInfoPanel(building, temperature, null);
    }
  }

  private renderInfoPanel(building: BuildingData, temperature: number, history: BuildingHistory | null): void {
    const heatLevel = getHeatLevel(temperature);
    const heatLabel = heatLevel === 'low' ? '低' : heatLevel === 'medium' ? '中' : '高';
    const tempColor = temperatureToColor(temperature);
    const tempColorHex = '#' + tempColor.getHexString();

    let chartHTML = '';
    if (history) {
      chartHTML = `
        <div class="chart-container">
          <canvas id="temp-chart" width="600" height="250"></canvas>
        </div>
      `;
    }

    this.infoPanel.innerHTML = `
      <h2>建筑信息</h2>
      <div class="info-row">
        <span class="info-key">地址</span>
        <span class="info-value">${building.address}</span>
      </div>
      <div class="info-row">
        <span class="info-key">当前温度</span>
        <span class="info-value" style="color: ${tempColorHex}; font-size: 20px; font-weight: 700;">
          ${temperature.toFixed(1)}°C
        </span>
      </div>
      <div class="info-row">
        <span class="info-key">热岛等级</span>
        <span class="heat-level ${heatLevel}">${heatLabel}</span>
      </div>
      <div class="info-row">
        <span class="info-key">建筑尺寸</span>
        <span class="info-value">${building.size.width.toFixed(1)} × ${building.size.height.toFixed(1)} × ${building.size.depth.toFixed(1)} m</span>
      </div>
      ${chartHTML}
    `;

    if (history) {
      requestAnimationFrame(() => this.drawTemperatureChart(history));
    }
  }

  private drawTemperatureChart(history: BuildingHistory): void {
    const canvas = document.getElementById('temp-chart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 18, right: 12, bottom: 28, left: 38 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(26, 26, 46, 0.4)';
    ctx.fillRect(padding.left, padding.top, chartW, chartH);

    const temps = history.temperatures;
    const minT = Math.min(...temps) - 2;
    const maxT = Math.max(...temps) + 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      const t = maxT - ((maxT - minT) * i) / 4;
      ctx.fillStyle = '#9999bb';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${t.toFixed(0)}°`, padding.left - 6, y + 4);
    }

    const hours = [0, 4, 8, 12, 16, 20, 23];
    ctx.fillStyle = '#9999bb';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (const hh of hours) {
      const x = padding.left + (chartW * hh) / 23;
      ctx.fillText(`${hh.toString().padStart(2, '0')}:00`, x, h - 10);
    }

    const points: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i < history.hours.length; i++) {
      const x = padding.left + (chartW * history.hours[i]) / 23;
      const y = padding.top + chartH - (chartH * (temps[i] - minT)) / (maxT - minT);
      points.push({ x, y, t: temps[i] });
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midT = (p1.t + p2.t) / 2;
      const c = temperatureToColor(midT);
      const grad = ctx.createLinearGradient(p1.x, 0, p2.x, 0);
      grad.addColorStop(0, `rgba(${c.r * 255},${c.g * 255},${c.b * 255},1)`);
      grad.addColorStop(1, `rgba(${temperatureToColor(p2.t).r * 255},${temperatureToColor(p2.t).g * 255},${temperatureToColor(p2.t).b * 255},1)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    const selectedId = this.buildingModule.getSelectedBuildingId();
    if (selectedId) {
      const currentTime = parseFloat((document.getElementById('time-slider') as HTMLInputElement)?.value || '14');
      const idx = Math.round(currentTime);
      if (idx >= 0 && idx < points.length) {
        const p = points[Math.min(idx, points.length - 1)];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        const c = temperatureToColor(p.t);
        ctx.fillStyle = `rgb(${c.r * 255},${c.g * 255},${c.b * 255})`;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  public refreshChart(): void {
    const selectedId = this.buildingModule.getSelectedBuildingId();
    if (!selectedId) return;
    const building = this.buildingModule.getBuildingData(selectedId);
    const temp = this.buildingModule.getBuildingTemperature(selectedId);
    if (building) {
      this.handleBuildingClick(building, temp);
    }
  }

  public static async fetchBuildings(): Promise<BuildingData[]> {
    const response = await axios.get<ApiBuildingsResponse>(`${API_BASE}/api/buildings`);
    return response.data.buildings;
  }

  public static async fetchTemperatures(time: number): Promise<ApiTemperatureResponse> {
    const response = await axios.get<ApiTemperatureResponse>(`${API_BASE}/api/temperature`, {
      params: { time },
    });
    return response.data;
  }
}

export { API_BASE };
export type { HeatLevel };
