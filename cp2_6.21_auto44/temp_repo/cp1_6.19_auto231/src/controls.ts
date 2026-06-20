import { Settings } from './starfield';

const settings: Settings = {
  rotationSpeed: 0.03,
  twinkleAmount: 2,
  trailDuration: 12,
  starCount: 100000,
  isMobile: false,
};

let panelVisible = true;

export function initControls(container: HTMLElement, onSettingsChange?: () => void): void {
  settings.isMobile = window.innerWidth < 768;
  settings.starCount = settings.isMobile ? 30000 : 100000;

  const style = document.createElement('style');
  style.textContent = `
    .control-panel {
      position: fixed;
      left: 20px;
      bottom: 20px;
      width: 240px;
      height: 200px;
      background: rgba(10, 20, 40, 0.7);
      border: 1px solid #1A3A5C;
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(10px);
      z-index: 1000;
      transition: all 0.3s ease;
    }
    .control-panel.hidden {
      display: none;
    }
    .control-title {
      color: #E0E0E0;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .control-group {
      margin-bottom: 16px;
    }
    .control-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #E0E0E0;
      font-size: 12px;
      margin-bottom: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .control-value {
      color: #FF6B6B;
      font-weight: 500;
    }
    .slider-container {
      position: relative;
      width: 180px;
      height: 6px;
    }
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 180px;
      height: 6px;
      background: linear-gradient(to right, #1A3A5C, #2A5A8C);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      background: #FF6B6B;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(255, 107, 107, 0.6);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 12px rgba(255, 107, 107, 0.8);
    }
    input[type="range"]::-moz-range-thumb {
      width: 14px;
      height: 14px;
      background: #FF6B6B;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 8px rgba(255, 107, 107, 0.6);
    }
    .mobile-toggle {
      display: none;
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(10, 20, 40, 0.8);
      border: 1px solid #1A3A5C;
      color: #FF6B6B;
      font-size: 24px;
      cursor: pointer;
      z-index: 1001;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    .mobile-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
    }
    @media (max-width: 767px) {
      .control-panel {
        left: 50%;
        bottom: 90px;
        transform: translateX(-50%);
        width: 280px;
      }
      .control-panel.hidden {
        display: none;
      }
      .control-panel.floating {
        animation: floatIn 0.3s ease;
      }
      .mobile-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .slider-container, input[type="range"] {
        width: 220px;
      }
    }
    @keyframes floatIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = `control-panel ${settings.isMobile ? 'hidden' : ''}`;
  panel.innerHTML = `
    <div class="control-title">星图控制</div>
    <div class="control-group">
      <div class="control-label">
        <span>旋转速度</span>
        <span class="control-value" id="rotation-value">0.03 rad/s</span>
      </div>
      <div class="slider-container">
        <input type="range" id="rotation-slider" min="0" max="0.1" step="0.001" value="0.03">
      </div>
    </div>
    <div class="control-group">
      <div class="control-label">
        <span>闪烁幅度</span>
        <span class="control-value" id="twinkle-value">2 px</span>
      </div>
      <div class="slider-container">
        <input type="range" id="twinkle-slider" min="0" max="5" step="0.1" value="2">
      </div>
    </div>
    <div class="control-group">
      <div class="control-label">
        <span>轨迹时长</span>
        <span class="control-value" id="trail-value">12 秒</span>
      </div>
      <div class="slider-container">
        <input type="range" id="trail-slider" min="2" max="20" step="1" value="12">
      </div>
    </div>
  `;
  container.appendChild(panel);

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'mobile-toggle';
  toggleBtn.innerHTML = '⚙';
  toggleBtn.addEventListener('click', () => {
    panelVisible = !panelVisible;
    if (panelVisible) {
      panel.classList.remove('hidden');
      panel.classList.add('floating');
    } else {
      panel.classList.add('hidden');
      panel.classList.remove('floating');
    }
  });
  container.appendChild(toggleBtn);

  const rotationSlider = panel.querySelector('#rotation-slider') as HTMLInputElement;
  const rotationValue = panel.querySelector('#rotation-value') as HTMLElement;
  const twinkleSlider = panel.querySelector('#twinkle-slider') as HTMLInputElement;
  const twinkleValue = panel.querySelector('#twinkle-value') as HTMLElement;
  const trailSlider = panel.querySelector('#trail-slider') as HTMLInputElement;
  const trailValue = panel.querySelector('#trail-value') as HTMLElement;

  rotationSlider.addEventListener('input', () => {
    settings.rotationSpeed = parseFloat(rotationSlider.value);
    rotationValue.textContent = `${settings.rotationSpeed.toFixed(3)} rad/s`;
    onSettingsChange?.();
  });

  twinkleSlider.addEventListener('input', () => {
    settings.twinkleAmount = parseFloat(twinkleSlider.value);
    twinkleValue.textContent = `${settings.twinkleAmount.toFixed(1)} px`;
    onSettingsChange?.();
  });

  trailSlider.addEventListener('input', () => {
    settings.trailDuration = parseInt(trailSlider.value);
    trailValue.textContent = `${settings.trailDuration} 秒`;
    onSettingsChange?.();
  });

  window.addEventListener('resize', () => {
    const wasMobile = settings.isMobile;
    settings.isMobile = window.innerWidth < 768;
    settings.starCount = settings.isMobile ? 30000 : 100000;
    
    if (wasMobile !== settings.isMobile) {
      if (settings.isMobile) {
        panel.classList.add('hidden');
        panel.classList.remove('floating');
        panelVisible = false;
      } else {
        panel.classList.remove('hidden');
        panel.classList.remove('floating');
        panelVisible = true;
      }
      onSettingsChange?.();
    }
  });
}

export function getSettings(): Settings {
  return { ...settings };
}

export function updateSettings(newSettings: Partial<Settings>): void {
  Object.assign(settings, newSettings);
}
