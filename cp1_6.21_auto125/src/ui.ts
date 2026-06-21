import { PortData, PortHoverEvent } from './ports';
import { formatTime, setSpeed, resetTimeline } from './timeline';

let timeDisplayElement: HTMLElement | null = null;
let portPanelElement: HTMLElement | null = null;
let portNameElement: HTMLElement | null = null;
let tideValueElement: HTMLElement | null = null;
let speedSliderElement: HTMLInputElement | null = null;
let speedValueElement: HTMLElement | null = null;
let resetButtonElement: HTMLButtonElement | null = null;

let currentHoveredPort: PortHoverEvent | null = null;
let latestPortData: Map<number, PortData> = new Map();
let ws: WebSocket | null = null;

type TideUpdateCallback = (data: PortData) => void;
type ResetCallback = () => void;

let tideUpdateCallbacks: TideUpdateCallback[] = [];
let resetCallbacks: ResetCallback[] = [];

export function initUI(): void {
  timeDisplayElement = document.getElementById('time-display');
  portPanelElement = document.getElementById('port-panel');
  portNameElement = document.getElementById('port-name');
  tideValueElement = document.getElementById('tide-value');
  speedSliderElement = document.getElementById('speed-slider') as HTMLInputElement;
  speedValueElement = document.getElementById('speed-value');
  resetButtonElement = document.getElementById('reset-btn') as HTMLButtonElement;

  setupEventListeners();
  connectWebSocket();
}

function setupEventListeners(): void {
  if (speedSliderElement) {
    speedSliderElement.addEventListener('input', onSpeedChange);
  }

  if (resetButtonElement) {
    resetButtonElement.addEventListener('click', onResetClick);
  }
}

function connectWebSocket(): void {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.hostname}:8080`;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      attemptReconnect();
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      attemptReconnect();
    };
  } catch (e) {
    console.error('Failed to connect WebSocket:', e);
    attemptReconnect();
  }
}

let reconnectAttempts = 0;
function attemptReconnect(): void {
  if (reconnectAttempts < 5) {
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
    setTimeout(() => {
      console.log(`Attempting to reconnect... (${reconnectAttempts}/5)`);
      connectWebSocket();
    }, delay);
  }
}

function handleWebSocketMessage(message: any): void {
  switch (message.type) {
    case 'init':
    case 'tideUpdate':
      handleTideUpdate(message);
      updateTimeDisplay(message.time);
      break;
    case 'reset':
      handleReset(message);
      break;
  }
}

function handleTideUpdate(message: { data: PortData[]; time: number }): void {
  if (!message.data || !Array.isArray(message.data)) return;

  message.data.forEach((portData: PortData) => {
    latestPortData.set(portData.portIndex, portData);
    tideUpdateCallbacks.forEach((callback) => callback(portData));
  });

  if (currentHoveredPort) {
    const latestData = latestPortData.get(currentHoveredPort.portIndex);
    if (latestData) {
      updatePortPanel(latestData);
    }
  }
}

function handleReset(message: { data: PortData[]; time: number }): void {
  latestPortData.clear();
  handleTideUpdate(message);
  updateTimeDisplay(0);
  resetCallbacks.forEach((callback) => callback());
}

function updateTimeDisplay(timeHours: number): void {
  if (timeDisplayElement) {
    timeDisplayElement.textContent = formatTime(timeHours);
  }
}

export function handlePortHover(event: PortHoverEvent | null): void {
  currentHoveredPort = event;

  if (!portPanelElement) return;

  if (event) {
    const latestData = latestPortData.get(event.portIndex);
    if (latestData) {
      updatePortPanel(latestData);
    } else {
      if (portNameElement) portNameElement.textContent = event.portName;
      if (tideValueElement) {
        tideValueElement.textContent = '--';
        tideValueElement.style.color = '#FFFFFF';
      }
    }

    const panelWidth = 200;
    const panelHeight = 120;
    const offsetY = 6;

    let screenX = event.screenPosition.x - panelWidth / 2;
    let screenY = event.screenPosition.y - panelHeight - offsetY - 20;

    screenX = Math.max(20, Math.min(window.innerWidth - panelWidth - 20, screenX));
    screenY = Math.max(20, Math.min(window.innerHeight - panelHeight - 20, screenY));

    portPanelElement.style.left = `${screenX}px`;
    portPanelElement.style.top = `${screenY}px`;
    portPanelElement.classList.add('show');
  } else {
    portPanelElement.classList.remove('show');
  }
}

function updatePortPanel(portData: PortData): void {
  if (portNameElement) {
    portNameElement.textContent = portData.portName;
  }

  if (tideValueElement) {
    const tideHeight = portData.tideHeight;
    tideValueElement.textContent = `${tideHeight >= 0 ? '+' : ''}${tideHeight.toFixed(2)}m`;
    tideValueElement.style.color = getTideColor(tideHeight);
  }
}

function getTideColor(tideHeight: number): string {
  const normalizedHeight = Math.max(-1, Math.min(1, tideHeight / 3));
  
  if (normalizedHeight <= -0.5) {
    return '#FFFFFF';
  } else if (normalizedHeight >= 0.5) {
    return '#FF4444';
  } else {
    const t = (normalizedHeight + 0.5);
    const r = Math.round(255 * t);
    const g = Math.round(255 * (1 - t * 0.5));
    const b = Math.round(255 * (1 - t));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function onSpeedChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const speed = parseFloat(target.value);
  setSpeed(speed);
  
  if (speedValueElement) {
    speedValueElement.textContent = `${speed.toFixed(1)}x`;
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'setSpeed',
      speed: speed,
    }));
  }
}

function onResetClick(): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'reset',
    }));
  }

  resetTimeline();
  if (speedSliderElement) {
    speedSliderElement.value = '10';
    if (speedValueElement) {
      speedValueElement.textContent = '10.0x';
    }
  }
}

export function onTideUpdate(callback: TideUpdateCallback): void {
  tideUpdateCallbacks.push(callback);
}

export function onReset(callback: ResetCallback): void {
  resetCallbacks.push(callback);
}

export function getLatestPortData(portIndex: number): PortData | undefined {
  return latestPortData.get(portIndex);
}
