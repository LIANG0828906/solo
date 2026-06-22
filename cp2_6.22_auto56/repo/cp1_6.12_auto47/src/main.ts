import { AirQualityRenderer } from './renderer';
import { AqiChart } from './chart';
import type { StationData } from './dataSimulator';

interface WsMessage {
  type: string;
  data: StationData[];
}

function getAqiLevel(aqi: number): { label: string; color: string; class: string } {
  if (aqi <= 50) return { label: '优', color: '#00e400', class: 'aqi-good' };
  if (aqi <= 100) return { label: '良', color: '#ffff00', class: 'aqi-moderate' };
  if (aqi <= 150) return { label: '轻度污染', color: '#ff7e00', class: 'aqi-unhealthy-sensitive' };
  if (aqi <= 200) return { label: '中度污染', color: '#ff0000', class: 'aqi-unhealthy' };
  return { label: '重度污染', color: '#8f3f97', class: 'aqi-hazardous' };
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function triggerFadeAnimation(el: HTMLElement): void {
  el.classList.remove('updated');
  void el.offsetWidth;
  el.classList.add('updated');
}

let renderer: AirQualityRenderer | null = null;
let chart: AqiChart | null = null;
let chartMobile: AqiChart | null = null;
let currentStations: StationData[] = [];
let ws: WebSocket | null = null;
let reconnectTimer: number | null = null;

function updateLeftPanel(stations: StationData[]): void {
  if (stations.length === 0) return;

  const avgAqi = Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length);
  const activeCount = stations.length;
  const lastUpdate = stations.reduce((max, s) => Math.max(max, s.timestamp), 0);

  const avgEl = document.getElementById('avg-aqi-value') as HTMLElement;
  const avgItem = document.getElementById('avg-aqi-item') as HTMLElement;
  const level = getAqiLevel(avgAqi);
  avgEl.textContent = avgAqi.toString();
  avgEl.className = 'info-value ' + level.class;
  triggerFadeAnimation(avgItem);

  const activeEl = document.getElementById('active-stations-value') as HTMLElement;
  const activeItem = document.getElementById('active-stations-item') as HTMLElement;
  activeEl.textContent = `${activeCount} / 10`;
  triggerFadeAnimation(activeItem);

  const timeEl = document.getElementById('last-update-value') as HTMLElement;
  const timeItem = document.getElementById('last-update-item') as HTMLElement;
  timeEl.textContent = formatTime(lastUpdate);
  triggerFadeAnimation(timeItem);
}

function updateHoverPanel(station: StationData | null, x: number, y: number): void {
  const panel = document.getElementById('hover-panel') as HTMLElement;
  if (!station) {
    panel.classList.remove('visible');
    return;
  }

  (document.getElementById('hp-name') as HTMLElement).textContent = station.name;
  (document.getElementById('hp-aqi') as HTMLElement).textContent = station.aqi.toString();

  const level = getAqiLevel(station.aqi);
  const levelEl = document.getElementById('hp-level') as HTMLElement;
  levelEl.textContent = level.label;
  levelEl.style.backgroundColor = level.color;

  (document.getElementById('hp-pm25') as HTMLElement).textContent = `${station.pm25} μg/m³`;
  (document.getElementById('hp-pm10') as HTMLElement).textContent = `${station.pm10} μg/m³`;
  (document.getElementById('hp-o3') as HTMLElement).textContent = `${station.o3} μg/m³`;
  (document.getElementById('hp-time') as HTMLElement).textContent = `更新于 ${formatTime(station.timestamp)}`;

  const offsetX = 18;
  const offsetY = -10;
  const panelW = 240;
  const panelH = 180;
  let left = x + offsetX;
  let top = y + offsetY;

  if (left + panelW > window.innerWidth) {
    left = x - panelW - offsetX;
  }
  if (top + panelH > window.innerHeight) {
    top = y - panelH - offsetY;
  }

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.classList.add('visible');
}

function setConnectionStatus(connected: boolean, text: string): void {
  const dot = document.getElementById('status-dot') as HTMLElement;
  const textEl = document.getElementById('status-text') as HTMLElement;
  if (connected) {
    dot.classList.add('connected');
  } else {
    dot.classList.remove('connected');
  }
  textEl.textContent = text;
}

function setupMobileTabs(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll<HTMLElement>('.tab-content').forEach((tc) => tc.classList.remove('active'));
      const target = document.getElementById(`tab-${tab}`);
      if (target) target.classList.add('active');
    });
  });
}

function connectWebSocket(): void {
  setConnectionStatus(false, '连接中...');

  try {
    ws = new WebSocket('ws://localhost:8080');
  } catch (e) {
    console.error('WebSocket connection error:', e);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[Main] WebSocket connected');
    setConnectionStatus(true, '数据连接正常');
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg: WsMessage = JSON.parse(event.data);
      if (msg.type === 'stationsUpdate' && Array.isArray(msg.data)) {
        currentStations = msg.data;
        if (renderer) {
          renderer.updateAllStations(currentStations);
        }
        if (chart) {
          chart.updateData(currentStations);
        }
        if (chartMobile) {
          chartMobile.updateData(currentStations);
        }
        updateLeftPanel(currentStations);
      }
    } catch (err) {
      console.error('[Main] Failed to parse WebSocket message:', err);
    }
  };

  ws.onerror = (event: Event) => {
    console.error('[Main] WebSocket error:', event);
    setConnectionStatus(false, '连接异常');
  };

  ws.onclose = () => {
    console.log('[Main] WebSocket disconnected');
    setConnectionStatus(false, '已断开，正在重连...');
    scheduleReconnect();
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
  }
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, 3000);
}

function onStationClick(stationId: string | null): void {
  if (chart) chart.setSelectedStation(stationId);
  if (chartMobile) chartMobile.setSelectedStation(stationId);
}

function onStationHover(station: StationData | null, x: number, y: number): void {
  updateHoverPanel(station, x, y);
}

function init(): void {
  const container = document.getElementById('scene-container') as HTMLElement;
  const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

  if (!container || !canvas) {
    console.error('[Main] Required DOM elements not found');
    return;
  }

  renderer = new AirQualityRenderer(container, canvas, {
    onStationClick,
    onStationHover,
  });

  const chartCanvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
  if (chartCanvas) {
    chart = new AqiChart(chartCanvas);
  }

  const mobileChartCanvas = document.getElementById('chart-canvas-mobile') as HTMLCanvasElement;
  if (mobileChartCanvas) {
    chartMobile = new AqiChart(mobileChartCanvas);
  }

  setupMobileTabs();
  connectWebSocket();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
