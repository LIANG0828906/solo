import { updateAllFlows, getBlockFlow } from './cityModel';
import { getSelectedBlock } from './main';

interface TrafficResponse {
  time: string;
  blocks: number[][];
}

let speed = 1;
let timeIndex = 4;
let threshold = 50;
let lastPollTime = 0;
const POLL_INTERVAL = 1000;

const TOTAL_TIME_SLOTS = 64;
const START_HOUR = 7;
const END_HOUR = 23;

let flowHistory: number[][][] = [];
const HISTORY_LENGTH = 12;

for (let i = 0; i < 8; i++) {
  flowHistory[i] = [];
  for (let j = 0; j < 8; j++) {
    flowHistory[i][j] = [];
  }
}

let simulatedTimeAccumulator = 0;

export function initController(): void {
  setupSliders();
  setupInfoCard();
  startDataPolling();
}

function setupSliders(): void {
  const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
  const speedValue = document.getElementById('speed-value') as HTMLElement;
  const speedFill = document.getElementById('speed-fill') as HTMLElement;

  const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
  const timeValue = document.getElementById('time-value') as HTMLElement;
  const timeFill = document.getElementById('time-fill') as HTMLElement;
  const currentTimeDisplay = document.getElementById('current-time') as HTMLElement;

  const thresholdSlider = document.getElementById('threshold-slider') as HTMLInputElement;
  const thresholdValue = document.getElementById('threshold-value') as HTMLElement;
  const thresholdFill = document.getElementById('threshold-fill') as HTMLElement;

  speedSlider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    speed = value;
    speedValue.textContent = `${value.toFixed(1)}x`;
    const percent = ((value - 0.5) / 3.5) * 100;
    speedFill.style.width = `${percent}%`;
  });

  timeSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    timeIndex = value;
    const timeStr = indexToTime(value);
    timeValue.textContent = timeStr;
    currentTimeDisplay.textContent = timeStr;
    const percent = (value / TOTAL_TIME_SLOTS) * 100;
    timeFill.style.width = `${percent}%`;
    fetchDataByTime(timeStr);
  });

  thresholdSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    threshold = value;
    thresholdValue.textContent = value.toString();
    const percent = value;
    thresholdFill.style.width = `${percent}%`;
  });
}

function setupInfoCard(): void {
  const closeCard = document.getElementById('close-card') as HTMLElement;
  const infoCard = document.getElementById('info-card') as HTMLElement;

  closeCard.addEventListener('click', (e) => {
    e.stopPropagation();
    infoCard.classList.remove('visible');
  });
}

function indexToTime(index: number): string {
  const totalMinutes = START_HOUR * 60 + index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function startDataPolling(): void {
  lastPollTime = performance.now();
  
  function poll() {
    const now = performance.now();
    const delta = now - lastPollTime;
    
    simulatedTimeAccumulator += delta * speed;
    
    if (simulatedTimeAccumulator >= POLL_INTERVAL) {
      simulatedTimeAccumulator -= POLL_INTERVAL;
      
      timeIndex++;
      if (timeIndex > TOTAL_TIME_SLOTS) {
        timeIndex = 0;
      }
      
      const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
      const timeValue = document.getElementById('time-value') as HTMLElement;
      const timeFill = document.getElementById('time-fill') as HTMLElement;
      const currentTimeDisplay = document.getElementById('current-time') as HTMLElement;
      
      timeSlider.value = timeIndex.toString();
      const timeStr = indexToTime(timeIndex);
      timeValue.textContent = timeStr;
      currentTimeDisplay.textContent = timeStr;
      const percent = (timeIndex / TOTAL_TIME_SLOTS) * 100;
      timeFill.style.width = `${percent}%`;
      
      fetchDataByTime(timeStr);
    }
    
    requestAnimationFrame(poll);
  }
  
  poll();
}

async function fetchDataByTime(timeStr: string): Promise<void> {
  try {
    const response = await fetch(`/api/traffic?time=${timeStr}`);
    const data: TrafficResponse = await response.json();
    
    if (data.blocks) {
      updateAllFlows(data.blocks);
      updateHistory(data.blocks);
      updateSelectedBlockInfo();
    }
  } catch (error) {
    generateMockData(timeStr);
  }
}

function generateMockData(timeStr: string): void {
  const blocks: number[][] = [];
  const timeParts = timeStr.split(':');
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  const timeValue = hour + minute / 60;
  
  const morningPeak = Math.exp(-Math.pow((timeValue - 8.5) / 1.5, 2));
  const eveningPeak = Math.exp(-Math.pow((timeValue - 18.5) / 2, 2));
  const baseFlow = 20 + morningPeak * 50 + eveningPeak * 45;
  
  for (let i = 0; i < 8; i++) {
    blocks[i] = [];
    for (let j = 0; j < 8; j++) {
      const phase = (i + j * 0.7) * 0.5;
      const variation = Math.sin(timeValue * 0.3 + phase) * 15;
      const noise = (Math.random() - 0.5) * 10;
      let flow = Math.round(baseFlow + variation + noise + (i + j) * 2);
      flow = Math.max(5, Math.min(100, flow));
      blocks[i][j] = flow;
    }
  }
  
  updateAllFlows(blocks);
  updateHistory(blocks);
  updateSelectedBlockInfo();
}

function updateHistory(blocks: number[][]): void {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      flowHistory[i][j].push(blocks[i][j]);
      if (flowHistory[i][j].length > HISTORY_LENGTH) {
        flowHistory[i][j].shift();
      }
    }
  }
}

function updateSelectedBlockInfo(): void {
  const selected = getSelectedBlock();
  if (!selected) return;
  
  const flow = getBlockFlow(selected.row, selected.col);
  const flowValueEl = document.getElementById('flow-value') as HTMLElement;
  const flowStatusEl = document.getElementById('flow-status') as HTMLElement;
  
  flowValueEl.textContent = Math.round(flow).toString();
  
  flowStatusEl.className = 'info-status';
  if (flow < threshold * 0.6) {
    flowStatusEl.classList.add('smooth');
    flowStatusEl.textContent = '畅通';
  } else if (flow < threshold) {
    flowStatusEl.classList.add('moderate');
    flowStatusEl.textContent = '缓行';
  } else {
    flowStatusEl.classList.add('congested');
    flowStatusEl.textContent = '拥堵';
  }
  
  drawTrendChart(selected.row, selected.col);
}

function drawTrendChart(row: number, col: number): void {
  const svg = document.getElementById('trend-chart') as SVGSVGElement;
  const history = flowHistory[row][col];
  
  if (history.length < 2) return;
  
  const padding = { left: 20, right: 10, top: 10, bottom: 15 };
  const width = 240 - padding.left - padding.right;
  const height = 80 - padding.top - padding.bottom;
  
  let points = '';
  const maxVal = 100;
  const minVal = 0;
  
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    const value = history[i] !== undefined ? history[i] : 0;
    const x = padding.left + (i / (HISTORY_LENGTH - 1)) * width;
    const y = padding.top + height - ((value - minVal) / (maxVal - minVal)) * height;
    
    if (i === 0) {
      points += `${x},${y}`;
    } else {
      points += ` ${x},${y}`;
    }
  }
  
  let areaPoints = `${padding.left},${padding.top + height} ${points} ${padding.left + width},${padding.top + height}`;
  
  const currentX = padding.left + ((history.length - 1) / (HISTORY_LENGTH - 1)) * width;
  const currentVal = history[history.length - 1] || 0;
  const currentY = padding.top + height - ((currentVal - minVal) / (maxVal - minVal)) * height;
  
  let color = '#00ff88';
  if (currentVal > threshold) {
    color = '#ff3366';
  } else if (currentVal > threshold * 0.6) {
    color = '#ffdd00';
  }
  
  svg.innerHTML = `
    <defs>
      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    
    <line x1="${padding.left}" y1="${padding.top + height * 0.25}" x2="${padding.left + width}" y2="${padding.top + height * 0.25}" 
          stroke="#2a4a6a" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="${padding.left}" y1="${padding.top + height * 0.5}" x2="${padding.left + width}" y2="${padding.top + height * 0.5}" 
          stroke="#2a4a6a" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="${padding.left}" y1="${padding.top + height * 0.75}" x2="${padding.left + width}" y2="${padding.top + height * 0.75}" 
          stroke="#2a4a6a" stroke-width="1" stroke-dasharray="3,3"/>
    
    <polygon points="${areaPoints}" fill="url(#areaGradient)"/>
    
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              filter="drop-shadow(0 0 4px ${color})"/>
    
    <circle cx="${currentX}" cy="${currentY}" r="5" fill="${color}" 
            filter="drop-shadow(0 0 6px ${color})">
      <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    
    <text x="${padding.left}" y="${padding.top + height + 10}" fill="#5a7a9a" font-size="9">12点前</text>
    <text x="${padding.left + width - 15}" y="${padding.top + height + 10}" fill="#5a7a9a" font-size="9">现在</text>
  `;
}

export function getSpeed(): number {
  return speed;
}

export function getThreshold(): number {
  return threshold;
}

export function getCurrentTime(): string {
  return indexToTime(timeIndex);
}
