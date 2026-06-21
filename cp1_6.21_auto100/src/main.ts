import { WaterfallController } from './WaterfallController';
import { DataPoint } from './dataParser';
import './style.css';

let controller: WaterfallController | null = null;
let currentData: DataPoint[] = [];

const elements = {
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  manualInput: document.getElementById('manual-input') as HTMLTextAreaElement,
  csvUpload: document.getElementById('csv-upload') as HTMLInputElement,
  submitBtn: document.getElementById('submit-btn') as HTMLButtonElement,
  speedControl: document.getElementById('speed-control') as HTMLInputElement,
  speedValue: document.getElementById('speed-value') as HTMLSpanElement,
  pauseBtn: document.getElementById('pause-btn') as HTMLButtonElement,
  togglePanel: document.getElementById('toggle-panel') as HTMLButtonElement,
  expandPanel: document.getElementById('expand-panel') as HTMLButtonElement,
  sidePanel: document.getElementById('side-panel') as HTMLDivElement,
  collapsedIcon: document.getElementById('collapsed-icon') as HTMLDivElement,
  message: document.getElementById('message') as HTMLDivElement,
  timestamp: document.getElementById('timestamp') as HTMLSpanElement,
  latestValue: document.getElementById('latest-value') as HTMLSpanElement,
  tooltip: document.getElementById('tooltip') as HTMLDivElement,
  tooltipContent: document.querySelector('.tooltip-content') as HTMLDivElement
};

function init(): void {
  if (!elements.canvas) {
    console.error('Canvas element not found');
    return;
  }

  controller = new WaterfallController(elements.canvas);
  
  controller.setOnColumnSelect(handleColumnSelect);
  
  setupEventListeners();
  updateInfoPanel();
  loadDemoData();
}

function setupEventListeners(): void {
  elements.submitBtn.addEventListener('click', handleSubmit);
  elements.csvUpload.addEventListener('change', handleCsvUpload);
  elements.speedControl.addEventListener('input', handleSpeedChange);
  elements.pauseBtn.addEventListener('click', handlePauseToggle);
  elements.togglePanel.addEventListener('click', collapsePanel);
  elements.expandPanel.addEventListener('click', expandPanel);
  
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      handlePauseToggle();
    }
  });
}

async function handleSubmit(): Promise<void> {
  const rawText = elements.manualInput.value.trim();
  
  if (!rawText) {
    showMessage('请输入数值或上传CSV文件', 'error');
    return;
  }
  
  try {
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '解析中...';
    
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rawText })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      currentData = result.data;
      controller?.setData(currentData);
      showMessage(`成功解析 ${currentData.length} 个数据点`, 'success');
      collapsePanel();
    } else {
      showMessage(result.error || '解析失败', 'error');
    }
  } catch (error) {
    console.error('Parse error:', error);
    showMessage('网络错误，请确保后端服务已启动', 'error');
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = '解析数据';
  }
}

async function handleCsvUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = '解析中...';
    
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ csvContent: text })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      currentData = result.data;
      controller?.setData(currentData);
      showMessage(`成功解析 ${currentData.length} 个数据点`, 'success');
      collapsePanel();
    } else {
      showMessage(result.error || '解析失败', 'error');
    }
  } catch (error) {
    console.error('CSV parse error:', error);
    showMessage('解析CSV文件失败', 'error');
  } finally {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = '解析数据';
    input.value = '';
  }
}

function handleSpeedChange(): void {
  const speed = parseFloat(elements.speedControl.value);
  elements.speedValue.textContent = speed.toFixed(1);
  controller?.setScrollSpeed(speed);
}

function handlePauseToggle(): void {
  if (!controller) return;
  
  const isPaused = controller.togglePause();
  elements.pauseBtn.textContent = isPaused ? '▶ 继续' : '⏸ 暂停';
}

function collapsePanel(): void {
  elements.sidePanel.classList.remove('expanded');
  elements.sidePanel.classList.add('collapsed');
  elements.collapsedIcon.classList.remove('hidden');
}

function expandPanel(): void {
  elements.sidePanel.classList.remove('collapsed');
  elements.sidePanel.classList.add('expanded');
  elements.collapsedIcon.classList.add('hidden');
}

function showMessage(text: string, type: 'success' | 'error'): void {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`;
  
  setTimeout(() => {
    elements.message.className = 'message';
  }, 3000);
}

function handleColumnSelect(data: DataPoint | null): void {
  if (data) {
    showTooltip(data);
  } else {
    hideTooltip();
  }
}

function showTooltip(data: DataPoint): void {
  elements.tooltipContent.textContent = `数值: ${data.originalValue.toFixed(2)}`;
  elements.tooltip.classList.remove('hidden');
  
  document.addEventListener('mousemove', updateTooltipPosition);
}

function hideTooltip(): void {
  elements.tooltip.classList.add('hidden');
  document.removeEventListener('mousemove', updateTooltipPosition);
}

function updateTooltipPosition(e: MouseEvent): void {
  elements.tooltip.style.left = `${e.clientX + 15}px`;
  elements.tooltip.style.top = `${e.clientY - 40}px`;
}

function updateInfoPanel(): void {
  if (controller) {
    const latest = controller.getLatestData();
    if (latest) {
      elements.timestamp.textContent = new Date(latest.timestamp).toLocaleTimeString();
      elements.latestValue.textContent = latest.originalValue.toFixed(2);
    }
  }
  requestAnimationFrame(updateInfoPanel);
}

async function loadDemoData(): Promise<void> {
  const demoValues = generateDemoData(30);
  elements.manualInput.value = demoValues.join(', ');
  
  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rawText: demoValues.join(', ') })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      currentData = result.data;
      controller?.setData(currentData);
    }
  } catch {
    console.log('Backend not available, using client-side parsing');
  }
}

function generateDemoData(count: number): number[] {
  const data: number[] = [];
  let value = 50;
  
  for (let i = 0; i < count; i++) {
    value += (Math.random() - 0.5) * 20;
    value = Math.max(5, Math.min(100, value));
    data.push(Math.round(value * 10) / 10);
  }
  
  return data;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { controller, currentData };
