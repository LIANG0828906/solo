import type { SeismicRecord } from '../data/SeismicData';

export type DateChangeCallback = (date: Date) => void;

export class Timeline {
  private container: HTMLElement;
  private slider: HTMLInputElement;
  private dateDisplay: HTMLElement;
  private playButton: HTMLButtonElement;
  private minDate: Date;
  private maxDate: Date;
  private currentDate: Date;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private daysPerSecond: number = 30;
  private onDateChange: DateChangeCallback;
  private allRecords: SeismicRecord[];

  constructor(
    containerId: string,
    allRecords: SeismicRecord[],
    onDateChange: DateChangeCallback
  ) {
    this.allRecords = allRecords;
    this.onDateChange = onDateChange;
    
    const times = allRecords.map(r => r.time.getTime());
    this.minDate = new Date(Math.min(...times));
    this.maxDate = new Date(Math.max(...times));
    this.currentDate = new Date(this.maxDate.getTime());
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    
    this.slider = this.createSlider();
    this.dateDisplay = this.createDateDisplay();
    this.playButton = this.createPlayButton();
    
    this.createUI();
    this.bindEvents();
    this.updateDateDisplay();
  }

  private createUI(): void {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '12px';
    wrapper.style.padding = '20px 24px';
    wrapper.style.background = 'rgba(255, 255, 255, 0.1)';
    wrapper.style.backdropFilter = 'blur(20px)';
    wrapper.style.borderRadius = '16px';
    wrapper.style.border = '1px solid rgba(255, 255, 255, 0.15)';
    wrapper.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
    wrapper.style.transform = 'translateY(100%)';
    wrapper.style.opacity = '0';
    wrapper.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    wrapper.id = 'timeline-wrapper';
    
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'center';
    topRow.style.gap = '16px';
    topRow.style.justifyContent = 'space-between';
    
    const dateLabel = document.createElement('div');
    dateLabel.innerHTML = `
      <span style="color: rgba(255,255,255,0.6); font-size: 12px;">当前日期</span>
    `;
    dateLabel.style.display = 'flex';
    dateLabel.style.flexDirection = 'column';
    dateLabel.style.gap = '4px';
    dateLabel.appendChild(this.dateDisplay);
    
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '12px';
    controls.appendChild(this.playButton);
    
    topRow.appendChild(dateLabel);
    topRow.appendChild(controls);
    
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.gap = '12px';
    
    const minDateLabel = document.createElement('span');
    minDateLabel.textContent = this.formatDate(this.minDate);
    minDateLabel.style.color = 'rgba(255,255,255,0.5)';
    minDateLabel.style.fontSize = '12px';
    minDateLabel.style.minWidth = '100px';
    
    const maxDateLabel = document.createElement('span');
    maxDateLabel.textContent = this.formatDate(this.maxDate);
    maxDateLabel.style.color = 'rgba(255,255,255,0.5)';
    maxDateLabel.style.fontSize = '12px';
    maxDateLabel.style.minWidth = '100px';
    maxDateLabel.style.textAlign = 'right';
    
    sliderContainer.appendChild(minDateLabel);
    sliderContainer.appendChild(this.slider);
    sliderContainer.appendChild(maxDateLabel);
    
    wrapper.appendChild(topRow);
    wrapper.appendChild(sliderContainer);
    this.container.appendChild(wrapper);
    
    requestAnimationFrame(() => {
      wrapper.style.transform = 'translateY(0)';
      wrapper.style.opacity = '1';
    });
  }

  private createSlider(): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1000';
    slider.value = '1000';
    slider.style.flex = '1';
    slider.style.height = '6px';
    slider.style.appearance = 'none';
    slider.style.background = 'rgba(255,255,255,0.15)';
    slider.style.borderRadius = '3px';
    slider.style.outline = 'none';
    slider.style.cursor = 'pointer';
    
    const style = document.createElement('style');
    style.textContent = `
      #timeline-wrapper input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        border-radius: 50%;
        cursor: grab;
        box-shadow: 0 2px 8px rgba(0, 212, 255, 0.5);
        transition: all 0.2s;
      }
      #timeline-wrapper input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 16px rgba(0, 212, 255, 0.8);
      }
      #timeline-wrapper input[type="range"]::-webkit-slider-thumb:active {
        cursor: grabbing;
      }
      #timeline-wrapper input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #00d4ff, #0099cc);
        border-radius: 50%;
        cursor: grab;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 212, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
    
    return slider;
  }

  private createDateDisplay(): HTMLElement {
    const display = document.createElement('div');
    display.style.color = '#ffffff';
    display.style.fontSize = '24px';
    display.style.fontWeight = '600';
    display.style.letterSpacing = '1px';
    return display;
  }

  private createPlayButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '▶ 播放';
    button.style.padding = '10px 20px';
    button.style.background = 'linear-gradient(135deg, #00d4ff, #0099cc)';
    button.style.border = 'none';
    button.style.borderRadius = '10px';
    button.style.color = '#ffffff';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.3s';
    button.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.4)';
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.6)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0, 212, 255, 0.4)';
    });
    
    return button;
  }

  private bindEvents(): void {
    this.slider.addEventListener('input', (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      this.updateDateFromSlider(value);
    });
    
    this.slider.addEventListener('change', (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      this.updateDateFromSlider(value);
      this.onDateChange(this.currentDate);
    });
    
    this.playButton.addEventListener('click', () => {
      this.togglePlay();
    });
  }

  private updateDateFromSlider(value: number): void {
    const t = value / 1000;
    const minTime = this.minDate.getTime();
    const maxTime = this.maxDate.getTime();
    const newTime = minTime + t * (maxTime - minTime);
    
    const newDate = new Date(newTime);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate.getTime() !== this.currentDate.getTime()) {
      this.currentDate = newDate;
      this.updateDateDisplay();
      this.onDateChange(this.currentDate);
    }
  }

  private updateDateDisplay(): void {
    this.dateDisplay.textContent = this.formatDate(this.currentDate);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    
    if (this.isPlaying) {
      this.playButton.textContent = '⏸ 暂停';
      this.lastUpdateTime = performance.now();
      this.animate();
    } else {
      this.playButton.textContent = '▶ 播放';
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  private animate(): void {
    if (!this.isPlaying) return;
    
    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
    
    const daysToAdd = deltaTime * this.daysPerSecond;
    const currentSliderValue = Number(this.slider.value);
    const maxTime = this.maxDate.getTime();
    const minTime = this.minDate.getTime();
    const totalDays = (maxTime - minTime) / (24 * 60 * 60 * 1000);
    
    const sliderIncrement = (daysToAdd / totalDays) * 1000;
    let newSliderValue = currentSliderValue + sliderIncrement;
    
    if (newSliderValue >= 1000) {
      newSliderValue = 0;
    }
    
    this.slider.value = String(Math.floor(newSliderValue));
    this.updateDateFromSlider(Math.floor(newSliderValue));
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  public getCurrentDate(): Date {
    return new Date(this.currentDate);
  }

  public filterRecordsByDate(records: SeismicRecord[], date: Date): SeismicRecord[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return records.filter(r => {
      const recordTime = r.time.getTime();
      return recordTime >= targetDate.getTime() && recordTime < nextDay.getTime();
    });
  }

  public dispose(): void {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.container.innerHTML = '';
  }
}
