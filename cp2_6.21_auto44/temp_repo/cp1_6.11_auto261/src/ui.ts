import * as THREE from 'three';
import { EngravingSystem, EngraveParams } from './engraving';

const CHAR_EXAMPLES: Record<string, string[]> = {
  '篆书': ['山', '水', '風', '雲', '龍', '鳳', '天', '地', '日', '月'],
  '隶书': ['永', '和', '九', '年', '歲', '在', '癸', '丑', '暮', '春'],
  '楷书': ['大', '道', '之', '行', '天', '下', '為', '公', '仁', '義'],
  '行书': ['蘭', '亭', '序', '修', '禊', '事', '也', '群', '賢', '畢'],
};

let weatheringAuto = 0;
let weatheringAutoTimer = 0;
let engravingSystem: EngravingSystem;

export function createUI(
  container: HTMLElement,
  engraveSys: EngravingSystem,
  rubbingsCanvas: HTMLCanvasElement
): void {
  engravingSystem = engraveSys;

  const style = document.createElement('style');
  style.textContent = `
    .ui-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 140px;
      background: linear-gradient(to top, rgba(42, 32, 20, 0.95), rgba(42, 32, 20, 0.8));
      border-top: 2px solid #5A4A3A;
      display: flex;
      color: #E8D5B7;
      font-family: 'KaiTi', 'STKaiti', serif;
      font-size: 14px;
      z-index: 100;
      backdrop-filter: blur(4px);
    }
    .ui-section {
      flex: 1;
      padding: 8px 12px;
      overflow-y: auto;
    }
    .ui-section-title {
      font-size: 13px;
      color: #DAA520;
      margin-bottom: 6px;
      text-align: center;
      border-bottom: 1px solid #5A4A3A;
      padding-bottom: 4px;
    }
    .char-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;
    }
    .char-item {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(60, 50, 40, 0.8);
      border: 1px solid #5A4A3A;
      border-radius: 3px;
      cursor: pointer;
      font-size: 18px;
      color: #E8D5B7;
      transition: all 0.2s;
    }
    .char-item:hover {
      background: rgba(90, 75, 60, 0.9);
      border-color: #DAA520;
    }
    .char-item.selected {
      border-color: #DAA520;
      border-width: 2px;
      box-shadow: 0 0 8px rgba(218, 165, 32, 0.5);
      background: rgba(90, 75, 60, 0.9);
    }
    .font-tab {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
      justify-content: center;
    }
    .font-tab-btn {
      padding: 2px 8px;
      background: rgba(60, 50, 40, 0.8);
      border: 1px solid #5A4A3A;
      color: #E8D5B7;
      cursor: pointer;
      border-radius: 3px;
      font-size: 12px;
      font-family: 'KaiTi', 'STKaiti', serif;
    }
    .font-tab-btn.active {
      background: #DAA520;
      color: #2A1E10;
      border-color: #DAA520;
    }
    .slider-group {
      margin-bottom: 8px;
    }
    .slider-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 3px;
    }
    .slider-track {
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      background: linear-gradient(to right, #8B7355, #D2B48C, #8B7355);
      border-radius: 4px;
      outline: none;
    }
    .slider-track::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      background: radial-gradient(circle at 40% 40%, #D4A043, #B87333);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    .weathering-section {
      position: fixed;
      top: 16px;
      right: 16px;
      background: rgba(42, 32, 20, 0.9);
      border: 1px solid #5A4A3A;
      border-radius: 6px;
      padding: 10px 14px;
      color: #E8D5B7;
      font-family: 'KaiTi', 'STKaiti', serif;
      font-size: 13px;
      z-index: 100;
      min-width: 180px;
    }
    .weathering-section .title {
      color: #DAA520;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .auto-weather-bar {
      position: fixed;
      bottom: 148px;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(42, 32, 20, 0.6);
      z-index: 100;
    }
    .auto-weather-fill {
      height: 100%;
      background: linear-gradient(to right, #D2B48C, #8B7355);
      transition: width 0.5s;
    }
    .rubbings-panel {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      pointer-events: none;
    }
    .rubbings-scroll {
      background: #F5E6C8;
      border: 2px solid #8B7355;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .tool-hover-info {
      position: fixed;
      padding: 4px 10px;
      background: rgba(42, 32, 20, 0.9);
      color: #E8D5B7;
      font-family: 'KaiTi', 'STKaiti', serif;
      font-size: 13px;
      border-radius: 4px;
      border: 1px solid #5A4A3A;
      pointer-events: none;
      z-index: 200;
      display: none;
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'ui-panel';

  const leftSection = document.createElement('div');
  leftSection.className = 'ui-section';
  leftSection.innerHTML = '<div class="ui-section-title">碑帖字库</div>';
  const fontTabs = document.createElement('div');
  fontTabs.className = 'font-tab';
  const charGrid = document.createElement('div');
  charGrid.className = 'char-grid';

  let currentFont = '篆书';
  let selectedChar: string | null = null;

  const fontNames = Object.keys(CHAR_EXAMPLES);
  fontNames.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'font-tab-btn' + (name === currentFont ? ' active' : '');
    btn.textContent = name;
    btn.addEventListener('click', () => {
      currentFont = name;
      fontTabs.querySelectorAll('.font-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChars();
    });
    fontTabs.appendChild(btn);
  });

  function renderChars(): void {
    charGrid.innerHTML = '';
    const chars = CHAR_EXAMPLES[currentFont] || [];
    chars.forEach(ch => {
      const item = document.createElement('div');
      item.className = 'char-item' + (ch === selectedChar ? ' selected' : '');
      item.textContent = ch;
      item.addEventListener('click', () => {
        selectedChar = ch;
        charGrid.querySelectorAll('.char-item').forEach(c => c.classList.remove('selected'));
        item.classList.add('selected');
        engravingSystem.setParams({ selectedChar: ch });
      });
      charGrid.appendChild(item);
    });
  }

  leftSection.appendChild(fontTabs);
  leftSection.appendChild(charGrid);
  renderChars();

  const midSection = document.createElement('div');
  midSection.className = 'ui-section';
  midSection.innerHTML = '<div class="ui-section-title">刻字预览</div>';
  const previewDiv = document.createElement('div');
  previewDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:80px;';
  const previewText = document.createElement('div');
  previewText.style.cssText = 'font-size:48px;color:#999;font-family:KaiTi,STKaiti,serif;opacity:0.6;text-shadow:1px 1px 2px rgba(0,0,0,0.5);';
  previewText.textContent = '選';
  previewDiv.appendChild(previewText);
  midSection.appendChild(previewDiv);

  const rightSection = document.createElement('div');
  rightSection.className = 'ui-section';
  rightSection.innerHTML = '<div class="ui-section-title">凿刻参数</div>';

  function createSlider(label: string, min: number, max: number, value: number, step: number, onChange: (v: number) => void): HTMLDivElement {
    const group = document.createElement('div');
    group.className = 'slider-group';
    const labelDiv = document.createElement('div');
    labelDiv.className = 'slider-label';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.textContent = String(value);
    labelDiv.appendChild(labelSpan);
    labelDiv.appendChild(valueSpan);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.step = String(step);
    input.className = 'slider-track';
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      valueSpan.textContent = String(v);
      onChange(v);
    });
    group.appendChild(labelDiv);
    group.appendChild(input);
    return group;
  }

  const angleSlider = createSlider('刻刀角度 (°)', 0, 45, 15, 1, v => {
    engravingSystem.setParams({ angle: v });
  });
  rightSection.appendChild(angleSlider);

  const forceSlider = createSlider('凿击力度', 1, 10, 5, 1, v => {
    engravingSystem.setParams({ force: v });
    previewText.style.opacity = String(0.3 + v * 0.07);
  });
  rightSection.appendChild(forceSlider);

  const speedGroup = document.createElement('div');
  speedGroup.className = 'slider-group';
  speedGroup.innerHTML = '<div class="slider-label"><span>落刀速度</span><span>中</span></div>';
  const speedBtns = document.createElement('div');
  speedBtns.style.cssText = 'display:flex;gap:4px;';
  const speedOpts: Array<{ label: string; value: 'slow' | 'medium' | 'fast' }> = [
    { label: '慢', value: 'slow' },
    { label: '中', value: 'medium' },
    { label: '快', value: 'fast' },
  ];
  speedOpts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'font-tab-btn' + (opt.value === 'medium' ? ' active' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      speedBtns.querySelectorAll('.font-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      speedGroup.querySelector('.slider-label span:last-child')!.textContent = opt.label;
      engravingSystem.setParams({ speed: opt.value });
    });
    speedBtns.appendChild(btn);
  });
  speedGroup.appendChild(speedBtns);
  rightSection.appendChild(speedGroup);

  panel.appendChild(leftSection);
  panel.appendChild(midSection);
  panel.appendChild(rightSection);
  container.appendChild(panel);

  const weatherDiv = document.createElement('div');
  weatherDiv.className = 'weathering-section';
  weatherDiv.innerHTML = '<div class="title">风化模拟</div>';
  const weatherSlider = createSlider('风化度', 0, 100, 0, 1, v => {
    engravingSystem.applyWeathering(v / 100);
  });
  weatherDiv.appendChild(weatherSlider);
  container.appendChild(weatherDiv);

  const autoBar = document.createElement('div');
  autoBar.className = 'auto-weather-bar';
  const autoFill = document.createElement('div');
  autoFill.className = 'auto-weather-fill';
  autoFill.style.width = '0%';
  autoBar.appendChild(autoFill);
  container.appendChild(autoBar);

  const rubbingsDiv = document.createElement('div');
  rubbingsDiv.className = 'rubbings-panel';
  const scrollDiv = document.createElement('div');
  scrollDiv.className = 'rubbings-scroll';
  rubbingsCanvas.style.display = 'block';
  scrollDiv.appendChild(rubbingsCanvas);
  rubbingsDiv.appendChild(scrollDiv);
  container.appendChild(rubbingsDiv);

  setInterval(() => {
    weatheringAutoTimer += 1;
    if (weatheringAutoTimer >= 20) {
      weatheringAutoTimer = 0;
      weatheringAuto = Math.min(100, weatheringAuto + 1);
      const slider = weatherDiv.querySelector('input[type=range]') as HTMLInputElement;
      if (slider) slider.value = String(weatheringAuto);
      const valSpan = weatherDiv.querySelector('.slider-label span:last-child') as HTMLSpanElement;
      if (valSpan) valSpan.textContent = String(weatheringAuto);
      autoFill.style.width = weatheringAuto + '%';
      engravingSystem.applyWeathering(weatheringAuto / 100);
    }
  }, 1000);

  const hoverInfo = document.createElement('div');
  hoverInfo.className = 'tool-hover-info';
  container.appendChild(hoverInfo);

  document.addEventListener('mousemove', (e) => {
    hoverInfo.style.display = 'none';
  });
}

export function updateAutoWeather(dt: number): void {
}
