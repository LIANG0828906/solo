export interface ControlPanelCallbacks {
  onTwistSpeedChange: (value: number) => void;
  onColorSpeedChange: (value: 'slow' | 'medium' | 'fast') => void;
  onRecoveryTimeChange: (value: number) => void;
  onPresetChange: (preset: 'dream' | 'lava' | 'aurora') => void;
}

export class ControlPanel {
  private container: HTMLDivElement;
  private callbacks: ControlPanelCallbacks;

  constructor(callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.init();
  }

  private init(): void {
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 100;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      width: 280px;
      color: #E8E8E8;
      font-size: 13px;
      user-select: none;
      border: 1px solid rgba(255, 255, 255, 0.06);
    `;

    this.container.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: #66FCF1;">AuraWeave 控制台</h3>
      
      <div style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>扭曲速度</span>
          <span id="twistSpeedValue" style="color: #66FCF1;">1.0x</span>
        </div>
        <input type="range" id="twistSpeed" min="0.1" max="3" step="0.1" value="1" style="width: 100%;" />
      </div>

      <div style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>颜色过渡</span>
          <span id="colorSpeedValue" style="color: #66FCF1;">中</span>
        </div>
        <input type="range" id="colorSpeed" min="0" max="2" step="1" value="1" style="width: 100%;" />
      </div>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>粒子恢复时长</span>
          <span id="recoveryTimeValue" style="color: #66FCF1;">1.5s</span>
        </div>
        <input type="range" id="recoveryTime" min="0.5" max="3" step="0.1" value="1.5" style="width: 100%;" />
      </div>

      <div style="margin-bottom: 4px;">
        <div style="margin-bottom: 10px; font-weight: 500;">预设场景</div>
        <div style="display: flex; gap: 8px;">
          <button data-preset="dream" class="preset-btn" style="flex: 1;">幽蓝梦境</button>
          <button data-preset="lava" class="preset-btn" style="flex: 1;">炽热岩浆</button>
          <button data-preset="aurora" class="preset-btn" style="flex: 1;">极光星云</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
        outline: none;
        cursor: pointer;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #66FCF1, #45A29E, #9463FF);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 8px rgba(102, 252, 241, 0.4);
        transition: transform 0.15s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #66FCF1, #45A29E, #9463FF);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 0 8px rgba(102, 252, 241, 0.4);
      }
      .preset-btn {
        padding: 8px 4px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        color: #E8E8E8;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.25s ease;
        font-family: inherit;
      }
      .preset-btn:hover {
        background: rgba(102, 252, 241, 0.1);
        border-color: rgba(102, 252, 241, 0.3);
        color: #66FCF1;
      }
      .preset-btn.active {
        background: rgba(102, 252, 241, 0.15);
        border-color: #66FCF1;
        color: #66FCF1;
        box-shadow: 0 0 10px rgba(102, 252, 241, 0.2);
      }
    `;
    document.head.appendChild(style);

    document.getElementById('app')!.appendChild(this.container);
    this.bindEvents();

    const defaultBtn = this.container.querySelector('[data-preset="dream"]') as HTMLButtonElement;
    defaultBtn.classList.add('active');
  }

  private bindEvents(): void {
    const twistSpeed = document.getElementById('twistSpeed') as HTMLInputElement;
    const twistSpeedValue = document.getElementById('twistSpeedValue') as HTMLSpanElement;
    twistSpeed.addEventListener('input', () => {
      const val = parseFloat(twistSpeed.value);
      twistSpeedValue.textContent = val.toFixed(1) + 'x';
      this.callbacks.onTwistSpeedChange(val);
    });

    const colorSpeed = document.getElementById('colorSpeed') as HTMLInputElement;
    const colorSpeedValue = document.getElementById('colorSpeedValue') as HTMLSpanElement;
    const labels: ('slow' | 'medium' | 'fast')[] = ['slow', 'medium', 'fast'];
    const labelTexts = ['慢', '中', '快'];
    colorSpeed.addEventListener('input', () => {
      const idx = parseInt(colorSpeed.value);
      colorSpeedValue.textContent = labelTexts[idx];
      this.callbacks.onColorSpeedChange(labels[idx]);
    });

    const recoveryTime = document.getElementById('recoveryTime') as HTMLInputElement;
    const recoveryTimeValue = document.getElementById('recoveryTimeValue') as HTMLSpanElement;
    recoveryTime.addEventListener('input', () => {
      const val = parseFloat(recoveryTime.value);
      recoveryTimeValue.textContent = val.toFixed(1) + 's';
      this.callbacks.onRecoveryTimeChange(val);
    });

    const presetBtns = this.container.querySelectorAll('.preset-btn') as NodeListOf<HTMLButtonElement>;
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onPresetChange(btn.dataset.preset as 'dream' | 'lava' | 'aurora');
      });
    });
  }
}
