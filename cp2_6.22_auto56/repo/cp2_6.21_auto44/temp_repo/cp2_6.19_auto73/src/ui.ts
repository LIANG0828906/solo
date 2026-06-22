export interface BuildingInfo {
  id: number;
  name: string;
  floors: number;
  usage: string;
}

export type TimeChangeCallback = (time: number) => void;
export type BuildingSelectCallback = (info: BuildingInfo | null) => void;

const BUILDING_NAMES = [
  '市民中心', '金融大厦', '科技园区A', '商业综合体', '文化艺术馆',
  '国际酒店', '行政办公楼', '研发中心', '购物中心', '会展中心',
  '数据中心', '医院综合楼', '教育园区', '物流枢纽', '体育场馆',
  '住宅公寓A', '写字楼B座', '创意产业园', '图书馆', '大剧院',
  '高铁站', '科技园B', '商务酒店', '生态住宅', '媒体中心'
];

const BUILDING_USAGES = [
  '商业办公', '政府机构', '科研教育', '医疗健康', '文化艺术',
  '酒店服务', '交通枢纽', '住宅公寓', '体育运动', '物流仓储'
];

export function generateBuildingInfo(id: number): BuildingInfo {
  const name = BUILDING_NAMES[id % BUILDING_NAMES.length];
  const floors = Math.floor(Math.random() * 25) + 5;
  const usage = BUILDING_USAGES[Math.floor(Math.random() * BUILDING_USAGES.length)];
  return { id, name, floors, usage };
}

export class UIManager {
  private container: HTMLElement;
  private sliderContainer!: HTMLDivElement;
  private slider!: HTMLInputElement;
  private timeLabel!: HTMLDivElement;
  private infoPanel!: HTMLDivElement;
  private timeChangeCallback: TimeChangeCallback | null = null;
  private buildingSelectCallback: BuildingSelectCallback | null = null;
  private currentTime: number = 12;
  private isPanelVisible: boolean = false;

  /**
   * 数据流：构造函数接收来自 main.ts 的容器 DOM 引用
   * 用于挂载时间滑块和信息面板等 UI 元素
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.initStyles();
    this.createTimeSlider();
    this.createInfoPanel();
  }

  private initStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .time-slider-container {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        max-width: 700px;
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .time-slider-wrapper {
        width: 100%;
        height: 48px;
        background: rgba(20, 30, 60, 0.55);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border-radius: 24px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      .time-slider-icon {
        color: #ffd700;
        font-size: 18px;
        flex-shrink: 0;
      }
      .time-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        background: linear-gradient(to right, #1a1a3e, #4a6fa5, #ffd700, #4a6fa5, #1a1a3e);
        outline: none;
        cursor: pointer;
      }
      .time-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: radial-gradient(circle, #fff, #ffd700);
        cursor: pointer;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
        border: 2px solid #fff;
        transition: transform 0.1s ease;
      }
      .time-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
      .time-slider::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: radial-gradient(circle, #fff, #ffd700);
        cursor: pointer;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
        border: 2px solid #fff;
        transition: transform 0.1s ease;
      }
      .time-label {
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        min-width: 60px;
        text-align: center;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.5px;
        transition: all 0.1s ease;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
      }
      .time-ticks {
        display: flex;
        justify-content: space-between;
        width: calc(100% - 100px);
        padding: 0 8px;
      }
      .time-tick {
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
      }
      .info-panel {
        position: fixed;
        top: 50%;
        right: 24px;
        width: 260px;
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 12px;
        padding: 24px;
        z-index: 100;
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
        pointer-events: auto;
        transform: translateY(-50%) translateX(calc(100% + 40px));
        opacity: 0;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                    opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .info-panel.visible {
        transform: translateY(-50%) translateX(0);
        opacity: 1;
      }
      .info-panel-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      .info-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
      }
      .info-item:last-child {
        margin-bottom: 0;
      }
      .info-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(100, 149, 237, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }
      .info-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .info-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
      .info-value {
        font-size: 15px;
        font-weight: 500;
        color: #fff;
      }
      .info-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.15s ease;
      }
      .info-close-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  private createTimeSlider(): void {
    this.sliderContainer = document.createElement('div');
    this.sliderContainer.className = 'time-slider-container';

    const wrapper = document.createElement('div');
    wrapper.className = 'time-slider-wrapper';

    const icon = document.createElement('span');
    icon.className = 'time-slider-icon';
    icon.textContent = '☀';

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.className = 'time-slider';
    this.slider.min = '6';
    this.slider.max = '18';
    this.slider.step = '0.1';
    this.slider.value = '12';

    this.timeLabel = document.createElement('div');
    this.timeLabel.className = 'time-label';
    this.updateTimeLabel(12);

    /**
     * 数据流：滑块 input 事件 → 获取时间值 → 更新 UI 标签
     * → 调用 timeChangeCallback → 传递给 main.ts → LightManager.updateSunPosition
     */
    this.slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.currentTime = value;
      this.updateTimeLabel(value);
      this.timeChangeCallback?.(value);
    });

    wrapper.appendChild(icon);
    wrapper.appendChild(this.slider);
    wrapper.appendChild(this.timeLabel);

    const ticks = document.createElement('div');
    ticks.className = 'time-ticks';
    ['06:00', '09:00', '12:00', '15:00', '18:00'].forEach((t) => {
      const tick = document.createElement('span');
      tick.className = 'time-tick';
      tick.textContent = t;
      ticks.appendChild(tick);
    });

    this.sliderContainer.appendChild(wrapper);
    this.sliderContainer.appendChild(ticks);
    this.container.appendChild(this.sliderContainer);
  }

  private createInfoPanel(): void {
    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'info-panel';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'info-close-btn';
    closeBtn.innerHTML = '✕';

    /**
     * 数据流：关闭按钮点击 → 隐藏信息面板
     * → 调用 buildingSelectCallback(null) → 通知 BuildingManager 取消选中
     */
    closeBtn.addEventListener('click', () => {
      this.hideInfoPanel();
      this.buildingSelectCallback?.(null);
    });

    const title = document.createElement('div');
    title.className = 'info-panel-title';
    title.id = 'info-panel-title';
    title.textContent = '建筑信息';

    this.infoPanel.appendChild(closeBtn);
    this.infoPanel.appendChild(title);
    this.container.appendChild(this.infoPanel);
  }

  private updateTimeLabel(hours: number): void {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    this.timeLabel.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * 数据流：注册时间变化回调，供 main.ts 监听
   * UIManager → (time:number) → main.ts → LightManager / 背景更新
   */
  public onTimeChange(callback: TimeChangeCallback): void {
    this.timeChangeCallback = callback;
  }

  /**
   * 数据流：注册建筑选择回调，用于通知外部取消选中
   * 当用户点击关闭按钮时触发 → BuildingManager 清除选中状态
   */
  public onBuildingSelect(callback: BuildingSelectCallback): void {
    this.buildingSelectCallback = callback;
  }

  /**
   * 数据流：BuildingManager.onBuildingClick → main.ts → UIManager.showBuildingInfo
   * 接收 BuildingInfo → 渲染属性列表 → 添加 visible 类 → 触发 CSS 滑入动画（200ms 缓出）
   */
  public showBuildingInfo(info: BuildingInfo): void {
    const existingItems = this.infoPanel.querySelectorAll('.info-item');
    existingItems.forEach((item) => item.remove());

    const titleEl = this.infoPanel.querySelector('#info-panel-title') as HTMLElement;
    titleEl.textContent = info.name;

    const items = [
      { icon: '🏢', label: '建筑编号', value: `#${(info.id + 1).toString().padStart(3, '0')}` },
      { icon: '📐', label: '楼层数', value: `${info.floors} 层` },
      { icon: '🎯', label: '用途类型', value: info.usage }
    ];

    items.forEach((item) => {
      const infoItem = document.createElement('div');
      infoItem.className = 'info-item';
      infoItem.innerHTML = `
        <div class="info-icon">${item.icon}</div>
        <div class="info-content">
          <div class="info-label">${item.label}</div>
          <div class="info-value">${item.value}</div>
        </div>
      `;
      this.infoPanel.appendChild(infoItem);
    });

    if (!this.isPanelVisible) {
      requestAnimationFrame(() => {
        this.infoPanel.classList.add('visible');
        this.isPanelVisible = true;
      });
    }
  }

  /**
   * 数据流：点击空白 / 切换建筑 / 关闭按钮 → hideInfoPanel
   * 移除 visible 类 → 触发 CSS 滑出动画（200ms 缓出）→ 面板移动到右侧并淡出
   */
  public hideInfoPanel(): void {
    if (this.isPanelVisible) {
      this.infoPanel.classList.remove('visible');
      this.isPanelVisible = false;
    }
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }
}
