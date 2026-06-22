import {
  generateSignature,
  updateStrokeAnimation,
  resetStrokeAnimation,
  completeStrokeAnimation,
  SignatureParams,
  StrokeData
} from './svgGenerator';
import { exportToPng } from './export';

interface AppState {
  params: SignatureParams;
  strokes: StrokeData[];
  isAnimating: boolean;
  animationFrame: number | null;
}

const state: AppState = {
  params: {
    text: '张三',
    speed: 1.0,
    jitter: 2,
    connection: 0.7,
    bleed: 0.5
  },
  strokes: [],
  isAnimating: false,
  animationFrame: null
};

let updateDebounceTimer: number | null = null;

function debounceUpdate(): void {
  if (updateDebounceTimer !== null) {
    clearTimeout(updateDebounceTimer);
  }
  updateDebounceTimer = window.setTimeout(() => {
    updateSignature();
  }, 30);
}

function validateText(text: string): string {
  let chineseCount = 0;
  let englishCount = 0;
  let result = '';
  
  for (const char of text) {
    const code = char.charCodeAt(0);
    const isChineseChar = code >= 0x4E00 && code <= 0x9FFF;
    
    if (isChineseChar) {
      if (chineseCount < 10) {
        result += char;
        chineseCount++;
      }
    } else {
      if (englishCount < 20) {
        result += char;
        englishCount++;
      }
    }
  }
  
  return result;
}

function updateSignature(): void {
  const startTime = performance.now();
  
  const result = generateSignature(state.params);
  state.strokes = result.strokes;
  
  const svgContainer = document.getElementById('svg-container');
  if (svgContainer) {
    svgContainer.innerHTML = result.svg;
    completeStrokeAnimation(svgContainer.querySelector('svg') as SVGSVGElement);
  }
  
  const endTime = performance.now();
  console.debug(`Signature generated in ${(endTime - startTime).toFixed(2)}ms`);
}

function previewAnimation(): void {
  if (state.isAnimating) {
    stopAnimation();
    return;
  }
  
  const svgElement = document.querySelector('#svg-container svg') as SVGSVGElement;
  if (!svgElement || state.strokes.length === 0) return;
  
  state.isAnimating = true;
  
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.textContent = '停止动画';
    playBtn.classList.add('is-active');
  }
  
  resetStrokeAnimation(svgElement, state.strokes);
  
  const totalDuration = state.strokes.reduce((acc, s) => acc + s.duration, 0);
  const startTime = performance.now();
  
  function animate(currentTime: number) {
    if (!state.isAnimating) return;
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / totalDuration);
    
    updateStrokeAnimation(svgElement, state.strokes, progress);
    
    if (progress < 1) {
      state.animationFrame = requestAnimationFrame(animate);
    } else {
      stopAnimation();
    }
  }
  
  state.animationFrame = requestAnimationFrame(animate);
}

function stopAnimation(): void {
  state.isAnimating = false;
  
  if (state.animationFrame !== null) {
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
  
  const svgElement = document.querySelector('#svg-container svg') as SVGSVGElement;
  if (svgElement) {
    completeStrokeAnimation(svgElement);
  }
  
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.textContent = '预览动画';
    playBtn.classList.remove('is-active');
  }
}

async function handleExport(): Promise<void> {
  const svgElement = document.querySelector('#svg-container svg') as SVGSVGElement;
  if (!svgElement) return;
  
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement | null;
  if (exportBtn) {
    exportBtn.textContent = '导出中...';
    exportBtn.disabled = true;
  }
  
  const startTime = performance.now();
  
  try {
    await exportToPng(svgElement, 2);
    const endTime = performance.now();
    console.debug(`PNG exported in ${(endTime - startTime).toFixed(2)}ms`);
  } catch (error) {
    console.error('Export failed:', error);
    alert('导出失败，请重试');
  } finally {
    if (exportBtn) {
      exportBtn.textContent = '导出 PNG';
      exportBtn.disabled = false;
    }
  }
}

function updateSliderProgress(slider: HTMLInputElement): void {
  const value = parseFloat(slider.value);
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const percentage = ((value - min) / (max - min)) * 100;
  slider.style.setProperty('--progress', `${percentage}%`);
}

function updateSliderLabel(slider: HTMLInputElement, label: HTMLElement, unit: string = ''): void {
  const value = parseFloat(slider.value);
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const percentage = ((value - min) / (max - min)) * 100;
  
  let displayValue: string;
  if (unit === '%') {
    displayValue = `${Math.round(value)}%`;
  } else if (unit === 'x') {
    displayValue = `${value.toFixed(1)}x`;
  } else if (unit === 'px') {
    displayValue = `${value.toFixed(1)}px`;
  } else {
    displayValue = value.toString();
  }
  
  label.textContent = displayValue;
  
  const trackWidth = slider.clientWidth;
  const thumbWidth = 20;
  const labelWidth = label.offsetWidth || 50;
  const leftPos = (percentage / 100) * (trackWidth - thumbWidth) + thumbWidth / 2 - labelWidth / 2;
  const clampedLeft = Math.max(0, Math.min(trackWidth - labelWidth, leftPos));
  
  label.style.left = `${clampedLeft}px`;
}

function setupSliderEvents(): void {
  const sliders = [
    { id: 'speed-slider', label: 'speed-label', unit: 'x', param: 'speed' as const },
    { id: 'jitter-slider', label: 'jitter-label', unit: 'px', param: 'jitter' as const },
    { id: 'connection-slider', label: 'connection-label', unit: '%', param: 'connection' as const },
    { id: 'bleed-slider', label: 'bleed-label', unit: 'px', param: 'bleed' as const }
  ];
  
  sliders.forEach(({ id, label, unit, param }) => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const labelEl = document.getElementById(label) as HTMLElement;
    
    if (!slider || !labelEl) return;
    
    slider.addEventListener('input', () => {
      let value = parseFloat(slider.value);
      if (param === 'connection') {
        value = value / 100;
      }
      state.params[param] = value;
      updateSliderProgress(slider);
      updateSliderLabel(slider, labelEl, unit);
      debounceUpdate();
    });
    
    slider.addEventListener('mousedown', () => {
      labelEl.classList.add('is-dragging');
      updateSliderProgress(slider);
      updateSliderLabel(slider, labelEl, unit);
    });
    
    slider.addEventListener('touchstart', () => {
      labelEl.classList.add('is-dragging');
      updateSliderProgress(slider);
      updateSliderLabel(slider, labelEl, unit);
    });
    
    const stopDragging = () => {
      labelEl.classList.remove('is-dragging');
    };
    
    slider.addEventListener('mouseup', stopDragging);
    slider.addEventListener('mouseleave', stopDragging);
    slider.addEventListener('touchend', stopDragging);
    slider.addEventListener('touchcancel', stopDragging);
    
    window.addEventListener('resize', () => {
      updateSliderLabel(slider, labelEl, unit);
    });
  });
}

function setupInputEvents(): void {
  const textInput = document.getElementById('text-input') as HTMLInputElement;
  
  if (textInput) {
    textInput.value = state.params.text;
    
    textInput.addEventListener('input', () => {
      const validated = validateText(textInput.value);
      if (validated !== textInput.value) {
        textInput.value = validated;
      }
      state.params.text = validated || '签名';
      debounceUpdate();
    });
  }
}

function setupButtonEvents(): void {
  const playBtn = document.getElementById('play-btn');
  const exportBtn = document.getElementById('export-btn');
  
  if (playBtn) {
    playBtn.addEventListener('click', previewAnimation);
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport);
  }
}

function initSliderLabels(): void {
  const sliders = [
    { id: 'speed-slider', label: 'speed-label', unit: 'x' },
    { id: 'jitter-slider', label: 'jitter-label', unit: 'px' },
    { id: 'connection-slider', label: 'connection-label', unit: '%' },
    { id: 'bleed-slider', label: 'bleed-label', unit: 'px' }
  ];
  
  requestAnimationFrame(() => {
    sliders.forEach(({ id, label, unit }) => {
      const slider = document.getElementById(id) as HTMLInputElement;
      const labelEl = document.getElementById(label) as HTMLElement;
      if (slider && labelEl) {
        updateSliderProgress(slider);
        updateSliderLabel(slider, labelEl, unit);
      }
    });
  });
}

function createApp(): void {
  const app = document.getElementById('app');
  if (!app) return;
  
  app.innerHTML = `
    <div class="card">
      <h1 class="title">手写签名生成器</h1>
      
      <div class="svg-wrapper">
        <div id="svg-container" class="svg-container"></div>
      </div>
      
      <div class="controls">
        <div class="input-group">
          <label for="text-input" class="input-label">签名文字</label>
          <input 
            type="text" 
            id="text-input" 
            class="text-input" 
            placeholder="请输入签名文字"
            maxlength="30"
          />
          <span class="input-hint">最多 10 个中文字符或 20 个英文字符</span>
        </div>
        
        <div class="slider-row">
          <div class="slider-group">
            <div class="slider-header">
              <label for="speed-slider" class="slider-label">书写速度</label>
              <span id="speed-label" class="value-label">1.0x</span>
            </div>
            <input 
              type="range" 
              id="speed-slider" 
              class="custom-slider" 
              min="0.5" 
              max="3.0" 
              step="0.1" 
              value="1.0"
            />
          </div>
          
          <div class="slider-group">
            <div class="slider-header">
              <label for="jitter-slider" class="slider-label">笔画抖动</label>
              <span id="jitter-label" class="value-label">2.0px</span>
            </div>
            <input 
              type="range" 
              id="jitter-slider" 
              class="custom-slider" 
              min="0" 
              max="8" 
              step="0.5" 
              value="2"
            />
          </div>
        </div>
        
        <div class="slider-row">
          <div class="slider-group">
            <div class="slider-header">
              <label for="connection-slider" class="slider-label">连笔程度</label>
              <span id="connection-label" class="value-label">70%</span>
            </div>
            <input 
              type="range" 
              id="connection-slider" 
              class="custom-slider" 
              min="30" 
              max="100" 
              step="5" 
              value="70"
            />
          </div>
          
          <div class="slider-group">
            <div class="slider-header">
              <label for="bleed-slider" class="slider-label">墨水渗透</label>
              <span id="bleed-label" class="value-label">0.5px</span>
            </div>
            <input 
              type="range" 
              id="bleed-slider" 
              class="custom-slider" 
              min="0" 
              max="5" 
              step="0.5" 
              value="0.5"
            />
          </div>
        </div>
        
        <div class="button-row">
          <button id="play-btn" class="btn btn-secondary">
            预览动画
          </button>
          <button id="export-btn" class="btn btn-primary">
            导出 PNG
          </button>
        </div>
      </div>
    </div>
  `;
}

function init(): void {
  createApp();
  setupInputEvents();
  setupSliderEvents();
  setupButtonEvents();
  updateSignature();
  initSliderLabels();
}

document.addEventListener('DOMContentLoaded', init);
