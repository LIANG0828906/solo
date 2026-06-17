import { useStore } from '../../store';

export class UIController {
  private container: HTMLElement;
  private onDateChange?: (day: number) => void;
  private onTimeChange?: (hour: number) => void;
  private onLatChange?: (lat: number) => void;
  private onLngChange?: (lng: number) => void;
  private onLoadBuilding?: () => void;
  private onTopView?: () => void;
  private onPersonView?: () => void;
  private onEditToggle?: (edit: boolean) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createPanel();
  }

  setCallbacks(callbacks: {
    onDateChange?: (day: number) => void;
    onTimeChange?: (hour: number) => void;
    onLatChange?: (lat: number) => void;
    onLngChange?: (lng: number) => void;
    onLoadBuilding?: () => void;
    onTopView?: () => void;
    onPersonView?: () => void;
    onEditToggle?: (edit: boolean) => void;
  }): void {
    this.onDateChange = callbacks.onDateChange;
    this.onTimeChange = callbacks.onTimeChange;
    this.onLatChange = callbacks.onLatChange;
    this.onLngChange = callbacks.onLngChange;
    this.onLoadBuilding = callbacks.onLoadBuilding;
    this.onTopView = callbacks.onTopView;
    this.onPersonView = callbacks.onPersonView;
    this.onEditToggle = callbacks.onEditToggle;
  }

  private createPanel(): void {
    const store = useStore.getState();

    const panel = document.createElement('div');
    panel.id = 'control-panel';
    panel.innerHTML = `
      <style>
        #control-panel {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 300px;
          background: rgba(18, 30, 54, 0.9);
          border-radius: 12px;
          padding: 16px;
          z-index: 200;
          color: #c8d6e5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          transition: all 0.2s ease-out;
        }
        @media (max-width: 768px) {
          #control-panel { width: 100%; top: 0; left: 0; border-radius: 0; }
          #chart-container { bottom: 0 !important; right: 0 !important; width: 100% !important; }
        }
        .panel-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        .control-group {
          margin-bottom: 8px;
        }
        .control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          color: #8899aa;
          font-size: 11px;
        }
        .control-value {
          color: #4A90D9;
          font-weight: 600;
          font-size: 13px;
        }
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #1a2744;
          outline: none;
          transition: all 0.2s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 8px;
          background: #4A90D9;
          cursor: pointer;
          transition: all 0.2s ease-out;
          box-shadow: 0 0 6px rgba(74,144,217,0.4);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          width: 20px;
          height: 20px;
          border-radius: 10px;
          background: #5BA0E9;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 8px;
          background: #4A90D9;
          cursor: pointer;
          border: none;
        }
        input[type="number"] {
          width: 70px;
          background: #0d1829;
          border: 1px solid #2a3b5c;
          color: #c8d6e5;
          border-radius: 4px;
          padding: 3px 6px;
          font-size: 12px;
          text-align: center;
          outline: none;
          transition: border-color 0.2s ease-out;
        }
        input[type="number"]:focus {
          border-color: #4A90D9;
        }
        .coord-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .coord-field {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .coord-field label {
          font-size: 11px;
          color: #8899aa;
          min-width: 20px;
        }
        .coord-field input {
          width: 60px;
          background: #0d1829;
          border: 1px solid #2a3b5c;
          color: #c8d6e5;
          border-radius: 4px;
          padding: 3px 6px;
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s ease-out;
        }
        .coord-field input:focus {
          border-color: #4A90D9;
        }
        .btn {
          height: 36px;
          border-radius: 6px;
          border: none;
          background: #4A90D9;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease-out;
          padding: 0 16px;
        }
        .btn:hover {
          background: #5BA0E9;
        }
        .btn:active {
          transform: scale(0.95);
          background: #3A80C9;
        }
        .btn-row {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .btn-sm {
          flex: 1;
          min-width: 0;
          height: 32px;
          border-radius: 6px;
          border: none;
          background: #4A90D9;
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease-out;
          padding: 0 8px;
          white-space: nowrap;
        }
        .btn-sm:hover { background: #5BA0E9; }
        .btn-sm:active { transform: scale(0.95); background: #3A80C9; }
        .btn-sm.active { background: #2a6cb8; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); }
        .shadow-info {
          margin-top: 8px;
          padding: 8px;
          background: rgba(10,22,40,0.6);
          border-radius: 6px;
          font-size: 11px;
          color: #8899aa;
        }
        .shadow-info span { color: #FFD700; font-weight: 600; }
      </style>
      <div class="panel-title">☀ 日照模拟器</div>
      <div class="control-group">
        <div class="control-label">
          <span>日期（第N天）</span>
          <span class="control-value" id="date-display">第182天 (7月1日)</span>
        </div>
        <input type="range" id="date-slider" min="1" max="365" value="${store.dayOfYear}" />
      </div>
      <div class="control-group">
        <div class="control-label">
          <span>时间</span>
          <span class="control-value" id="time-display">12:00</span>
        </div>
        <input type="range" id="time-slider" min="6" max="18" step="1" value="${store.hour}" />
      </div>
      <div class="control-group">
        <div class="control-label"><span>经纬度</span></div>
        <div class="coord-row">
          <div class="coord-field">
            <label>纬</label>
            <input type="number" id="lat-input" value="${store.latitude}" step="0.1" min="-90" max="90" />
          </div>
          <div class="coord-field">
            <label>经</label>
            <input type="number" id="lng-input" value="${store.longitude}" step="0.1" min="-180" max="180" />
          </div>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn" id="load-btn" style="width:100%">加载建筑</button>
      </div>
      <div class="btn-row">
        <button class="btn-sm" id="top-view-btn">顶视图</button>
        <button class="btn-sm" id="person-view-btn">人视图</button>
        <button class="btn-sm" id="edit-btn">编辑模式</button>
      </div>
      <div class="shadow-info" id="shadow-info">
        阴影面积：<span id="shadow-area">0</span> m² &nbsp;|&nbsp;
        光照强度：<span id="light-intensity">0.00</span>
      </div>
    `;

    this.container.appendChild(panel);
    this.bindEvents();
  }

  private bindEvents(): void {
    const dateSlider = document.getElementById('date-slider') as HTMLInputElement;
    const dateDisplay = document.getElementById('date-display')!;
    const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
    const timeDisplay = document.getElementById('time-display')!;
    const latInput = document.getElementById('lat-input') as HTMLInputElement;
    const lngInput = document.getElementById('lng-input') as HTMLInputElement;
    const loadBtn = document.getElementById('load-btn') as HTMLButtonElement;
    const topViewBtn = document.getElementById('top-view-btn') as HTMLButtonElement;
    const personViewBtn = document.getElementById('person-view-btn') as HTMLButtonElement;
    const editBtn = document.getElementById('edit-btn') as HTMLButtonElement;

    dateSlider.addEventListener('input', () => {
      const day = parseInt(dateSlider.value);
      dateDisplay.textContent = this.formatDay(day);
      useStore.getState().setDayOfYear(day);
      this.onDateChange?.(day);
    });

    timeSlider.addEventListener('input', () => {
      const hour = parseInt(timeSlider.value);
      timeDisplay.textContent = `${String(hour).padStart(2, '0')}:00`;
      useStore.getState().setHour(hour);
      this.onTimeChange?.(hour);
    });

    latInput.addEventListener('change', () => {
      const lat = parseFloat(latInput.value);
      useStore.getState().setLatitude(lat);
      this.onLatChange?.(lat);
    });

    lngInput.addEventListener('change', () => {
      const lng = parseFloat(lngInput.value);
      useStore.getState().setLongitude(lng);
      this.onLngChange?.(lng);
    });

    loadBtn.addEventListener('click', () => {
      this.onLoadBuilding?.();
    });

    topViewBtn.addEventListener('click', () => {
      this.onTopView?.();
    });

    personViewBtn.addEventListener('click', () => {
      this.onPersonView?.();
    });

    editBtn.addEventListener('click', () => {
      const store = useStore.getState();
      const newEdit = !store.editMode;
      useStore.getState().setEditMode(newEdit);
      editBtn.classList.toggle('active', newEdit);
      editBtn.textContent = newEdit ? '退出编辑' : '编辑模式';
      this.onEditToggle?.(newEdit);
    });
  }

  private formatDay(day: number): string {
    const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    let remaining = day;
    for (let i = 0; i < 12; i++) {
      if (remaining <= months[i]) {
        return `第${day}天 (${monthNames[i]}${remaining}日)`;
      }
      remaining -= months[i];
    }
    return `第${day}天`;
  }

  updateShadowInfo(area: number, intensity: number): void {
    const areaEl = document.getElementById('shadow-area');
    const intensityEl = document.getElementById('light-intensity');
    if (areaEl) areaEl.textContent = Math.round(area).toString();
    if (intensityEl) intensityEl.textContent = intensity.toFixed(2);
  }

  updateDateDisplay(day: number): void {
    const el = document.getElementById('date-display');
    const slider = document.getElementById('date-slider') as HTMLInputElement;
    if (el) el.textContent = this.formatDay(day);
    if (slider) slider.value = day.toString();
  }

  updateTimeDisplay(hour: number): void {
    const el = document.getElementById('time-display');
    const slider = document.getElementById('time-slider') as HTMLInputElement;
    if (el) el.textContent = `${String(hour).padStart(2, '0')}:00`;
    if (slider) slider.value = hour.toString();
  }
}
