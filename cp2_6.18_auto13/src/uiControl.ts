// ============================================================================
// uiControl.ts - UI控制面板模块
// 职责：渲染UI控制面板元素，管理用户交互事件，通过事件总线向渲染模块发送指令
// 调用关系：
//   - emit('filterChange', range)      →  renderer.ts  应用温度过滤
//   - emit('viewChange', view)         →  renderer.ts  切换视角
//   - emit('timelinePlay', play)       →  renderer.ts  播放/暂停时间轴
//   - emit('timelineHour', hour)       →  renderer.ts  跳转到指定小时
//   - on('statsUpdate', ...)           ←  renderer.ts  更新统计信息
//   - on('timelineProgress', ...)      ←  renderer.ts  更新进度条
//   - on('currentTimeUpdate', ...)     ←  renderer.ts  更新时间显示
// 数据流向：用户操作 → 事件总线发送指令 → 渲染模块响应执行
// ============================================================================

import { eventBus } from './eventBus';

export class UIControl {
  private rangeMin: HTMLInputElement;
  private rangeMax: HTMLInputElement;
  private rangeFill: HTMLElement;
  private rangeMinDisplay: HTMLElement;
  private rangeMaxDisplay: HTMLElement;
  private playBtn: HTMLElement;
  private timelineProgress: HTMLElement;
  private timelineThumb: HTMLElement;
  private currentTimeDisplay: HTMLElement;
  private controlPanel: HTMLElement;
  private menuToggle: HTMLElement;
  private presetButtons: NodeListOf<HTMLElement>;

  private isPlaying: boolean = false;
  private currentHour: number = 0;

  constructor() {
    // 获取DOM元素
    this.rangeMin = document.getElementById('range-min') as HTMLInputElement;
    this.rangeMax = document.getElementById('range-max') as HTMLInputElement;
    this.rangeFill = document.getElementById('range-fill') as HTMLElement;
    this.rangeMinDisplay = document.getElementById(
      'range-min-display'
    ) as HTMLElement;
    this.rangeMaxDisplay = document.getElementById(
      'range-max-display'
    ) as HTMLElement;
    this.playBtn = document.getElementById('play-btn') as HTMLElement;
    this.timelineProgress = document.getElementById(
      'timeline-progress'
    ) as HTMLElement;
    this.timelineThumb = document.getElementById(
      'timeline-thumb'
    ) as HTMLElement;
    this.currentTimeDisplay = document.getElementById(
      'current-time'
    ) as HTMLElement;
    this.controlPanel = document.getElementById(
      'control-panel'
    ) as HTMLElement;
    this.menuToggle = document.getElementById(
      'menu-toggle'
    ) as HTMLElement;
    this.presetButtons = document.querySelectorAll('.preset-btn');

    if (
      !this.rangeMin ||
      !this.rangeMax ||
      !this.rangeFill ||
      !this.rangeMinDisplay ||
      !this.rangeMaxDisplay ||
      !this.playBtn ||
      !this.timelineProgress ||
      !this.timelineThumb ||
      !this.currentTimeDisplay ||
      !this.controlPanel ||
      !this.menuToggle
    ) {
      throw new Error('UI elements not found');
    }

    // 初始化事件监听
    this.setupEventListeners();

    // 注册事件总线监听
    this.registerEventBusListeners();

    // 初始化滑块填充位置
    this.updateRangeSliderFill();
  }

  // 设置UI事件监听
  private setupEventListeners(): void {
    // 温度范围滑块
    this.rangeMin.addEventListener('input', () => {
      let minVal = parseFloat(this.rangeMin.value);
      const maxVal = parseFloat(this.rangeMax.value);
      if (minVal > maxVal - 1) {
        minVal = maxVal - 1;
        this.rangeMin.value = minVal.toString();
      }
      this.updateRangeSliderFill();
      this.updateRangeDisplay();
      eventBus.emit('filterChange', { min: minVal, max: maxVal });
    });

    this.rangeMax.addEventListener('input', () => {
      const minVal = parseFloat(this.rangeMin.value);
      let maxVal = parseFloat(this.rangeMax.value);
      if (maxVal < minVal + 1) {
        maxVal = minVal + 1;
        this.rangeMax.value = maxVal.toString();
      }
      this.updateRangeSliderFill();
      this.updateRangeDisplay();
      eventBus.emit('filterChange', { min: minVal, max: maxVal });
    });

    // 播放按钮
    this.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    // 时间轴轨道点击跳转
    const timelineTrack = this.timelineProgress.parentElement;
    if (timelineTrack) {
      timelineTrack.addEventListener('click', (e) => {
        const rect = timelineTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = clickX / rect.width;
        const hour = Math.round(ratio * 23);
        this.jumpToHour(hour);
      });
    }

    // 移动端菜单切换
    this.menuToggle.addEventListener('click', () => {
      this.controlPanel.classList.toggle('open');
    });

    // 预设视角按钮
    this.presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view) {
          eventBus.emit('viewChange', view);
        }
      });
    });

    // 响应式处理
    window.addEventListener('resize', () => {
      this.handleResponsive();
    });
    this.handleResponsive();
  }

  // 注册事件总线监听
  private registerEventBusListeners(): void {
    // 统计信息更新
    eventBus.on(
      'statsUpdate',
      (stats: {
        avgTemp: number;
        maxTemp: number;
        minTemp: number;
        activeBars?: number;
        totalBars?: number;
      }) => {
        const avgTempEl = document.getElementById('avg-temp');
        const maxTempEl = document.getElementById('max-temp');
        const minTempEl = document.getElementById('min-temp');
        const activeBarsEl = document.getElementById('active-bars');

        if (avgTempEl) avgTempEl.textContent = `${stats.avgTemp}°C`;
        if (maxTempEl) maxTempEl.textContent = `${stats.maxTemp}°C`;
        if (minTempEl) minTempEl.textContent = `${stats.minTemp}°C`;
        if (activeBarsEl) {
          activeBarsEl.textContent = `${stats.activeBars ?? stats.totalBars ?? '--'}`;
        }
      }
    );

    // 时间轴进度更新
    eventBus.on('timelineProgress', (progress: number) => {
      this.updateTimelineProgress(progress);
    });

    // 当前时间更新
    eventBus.on('currentTimeUpdate', (hour: number) => {
      this.currentHour = hour;
      this.updateTimeDisplay(hour);
    });
  }

  // 更新双滑块填充区域
  private updateRangeSliderFill(): void {
    const minVal = parseFloat(this.rangeMin.value);
    const maxVal = parseFloat(this.rangeMax.value);
    const minRange = parseFloat(this.rangeMin.min);
    const maxRange = parseFloat(this.rangeMax.max);

    const leftPercent = ((minVal - minRange) / (maxRange - minRange)) * 100;
    const rightPercent = ((maxVal - minRange) / (maxRange - minRange)) * 100;

    this.rangeFill.style.left = `${leftPercent}%`;
    this.rangeFill.style.width = `${rightPercent - leftPercent}%`;
  }

  // 更新范围显示
  private updateRangeDisplay(): void {
    this.rangeMinDisplay.textContent = `${parseFloat(this.rangeMin.value).toFixed(1)}°C`;
    this.rangeMaxDisplay.textContent = `${parseFloat(this.rangeMax.value).toFixed(1)}°C`;
  }

  // 切换播放状态
  private togglePlay(): void {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.playBtn.textContent = '❚❚';
      this.playBtn.classList.add('playing');
    } else {
      this.playBtn.textContent = '▶';
      this.playBtn.classList.remove('playing');
    }

    eventBus.emit('timelinePlay', this.isPlaying);
  }

  // 跳转到指定小时
  private jumpToHour(hour: number): void {
    const clampedHour = Math.max(0, Math.min(23, hour));
    this.currentHour = clampedHour;
    this.updateTimeDisplay(clampedHour);
    this.updateTimelineProgress(clampedHour / 23);
    eventBus.emit('timelineHour', clampedHour);
  }

  // 更新时间轴进度
  private updateTimelineProgress(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const percent = clampedProgress * 100;
    this.timelineProgress.style.width = `${percent}%`;
    this.timelineThumb.style.left = `${percent}%`;
  }

  // 更新时间显示
  private updateTimeDisplay(hour: number): void {
    const hourStr = hour.toString().padStart(2, '0');
    this.currentTimeDisplay.textContent = `${hourStr}:00`;
  }

  // 响应式处理
  private handleResponsive(): void {
    if (window.innerWidth <= 768) {
      this.controlPanel.classList.remove('open');
    } else {
      this.controlPanel.classList.remove('open');
    }
  }

  // 获取当前过滤范围
  public getFilterRange(): { min: number; max: number } {
    return {
      min: parseFloat(this.rangeMin.value),
      max: parseFloat(this.rangeMax.value),
    };
  }

  // 获取当前播放状态
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // 获取当前小时
  public getCurrentHour(): number {
    return this.currentHour;
  }
}
