import type { CityWeatherData, WeatherUpdate } from './types';
import { searchCities, getPresetCities } from './weatherData';

export type CitySelectCallback = (cityName: string) => void;
export type ActionCallback = () => void;
export type SpeedChangeCallback = (speed: number) => void;
export type SeekCallback = (time: number) => void;

export class UIOverlay {
  private tempValueEl!: HTMLElement;
  private rainProgressEl!: HTMLElement;
  private rainValueEl!: HTMLElement;
  private windValueEl!: HTMLElement;
  private windArrowEl!: HTMLElement;
  private currentTimeEl!: HTMLElement;
  private playPauseBtn!: HTMLButtonElement;
  private timelineProgressEl!: HTMLElement;
  private timelinePointerEl!: HTMLElement;
  private timelineTrackEl!: HTMLElement;
  private speedBtns!: NodeListOf<HTMLButtonElement>;
  private resetViewBtn!: HTMLButtonElement;
  private citySearchEl!: HTMLInputElement;
  private citySuggestionsEl!: HTMLElement;
  private tempChartCanvas!: HTMLCanvasElement;
  private tempChartCtx!: CanvasRenderingContext2D;

  private weatherData: CityWeatherData | null = null;
  private lastHourIndex: number = -1;
  private lastTemperature: string = '';
  private lastWindSpeed: string = '';
  private windRotationInterval: number | null = null;
  private currentWindDirection: number = 0;
  private isDragging: boolean = false;

  private onCitySelectCallback: CitySelectCallback | null = null;
  private onPlayPauseCallback: ActionCallback | null = null;
  private onSpeedChangeCallback: SpeedChangeCallback | null = null;
  private onSeekCallback: SeekCallback | null = null;
  private onResetViewCallback: ActionCallback | null = null;

  constructor() {
    this.initElements();
    this.initEventListeners();
    this.initTempChart();
    this.startWindRotation();
  }

  private initElements(): void {
    this.tempValueEl = document.getElementById('temp-value')!;
    this.rainProgressEl = document.getElementById('rain-progress')!;
    this.rainValueEl = document.getElementById('rain-value')!;
    this.windValueEl = document.getElementById('wind-value')!;
    this.windArrowEl = document.getElementById('wind-arrow')!;
    this.currentTimeEl = document.getElementById('current-time')!;
    this.playPauseBtn = document.getElementById('play-pause') as HTMLButtonElement;
    this.timelineProgressEl = document.getElementById('timeline-progress')!;
    this.timelinePointerEl = document.getElementById('timeline-pointer')!;
    this.timelineTrackEl = document.getElementById('timeline-track')!;
    this.speedBtns = document.querySelectorAll('.speed-btn') as NodeListOf<HTMLButtonElement>;
    this.resetViewBtn = document.getElementById('reset-view') as HTMLButtonElement;
    this.citySearchEl = document.getElementById('city-search') as HTMLInputElement;
    this.citySuggestionsEl = document.getElementById('city-suggestions')!;
    this.tempChartCanvas = document.getElementById('temp-chart') as HTMLCanvasElement;
    this.tempChartCtx = this.tempChartCanvas.getContext('2d')!;
  }

  private initEventListeners(): void {
    this.citySearchEl.addEventListener('input', this.handleSearchInput.bind(this));
    this.citySearchEl.addEventListener('focus', this.handleSearchFocus.bind(this));
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    this.playPauseBtn.addEventListener('click', () => {
      this.onPlayPauseCallback?.();
    });

    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseInt(btn.dataset.speed || '1');
        this.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onSpeedChangeCallback?.(speed);
      });
    });

    this.timelineTrackEl.addEventListener('mousedown', this.handleTimelineMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleTimelineMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleTimelineMouseUp.bind(this));

    this.timelineTrackEl.addEventListener('touchstart', this.handleTimelineTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTimelineTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTimelineTouchEnd.bind(this));

    this.resetViewBtn.addEventListener('click', () => {
      this.onResetViewCallback?.();
    });
  }

  private initTempChart(): void {
    this.resizeTempChart();
    window.addEventListener('resize', this.resizeTempChart.bind(this));
  }

  private resizeTempChart(): void {
    const rect = this.tempChartCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.tempChartCanvas.width = rect.width * dpr;
    this.tempChartCanvas.height = rect.height * dpr;
    this.tempChartCtx.scale(dpr, dpr);
    this.drawTempChart();
  }

  private drawTempChart(): void {
    const rect = this.tempChartCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const ctx = this.tempChartCtx;

    ctx.clearRect(0, 0, width, height);

    if (!this.weatherData || this.weatherData.hours.length === 0) return;

    const padding = { top: 20, right: 15, bottom: 25, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const temps = this.weatherData.hours.map(h => h.temperature);
    const minTemp = Math.min(...temps) - 2;
    const maxTemp = Math.max(...temps) + 2;
    const tempRange = maxTemp - minTemp;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartHeight / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      const tempValue = maxTemp - (tempRange / 3) * i;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px Roboto';
      ctx.textAlign = 'right';
      ctx.fillText(`${tempValue.toFixed(0)}°`, padding.left - 6, y + 4);
    }

    ctx.beginPath();
    this.weatherData.hours.forEach((hour, i) => {
      const x = padding.left + (i / (this.weatherData!.hours.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((hour.temperature - minTemp) / tempRange) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(79, 195, 247, 0.3)');
    gradient.addColorStop(1, 'rgba(79, 195, 247, 0.02)');

    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'center';
    for (let i = 0; i < this.weatherData.hours.length; i += 6) {
      const x = padding.left + (i / (this.weatherData.hours.length - 1)) * chartWidth;
      ctx.fillText(`${i.toString().padStart(2, '0')}:00`, x, height - 8);
    }
  }

  private startWindRotation(): void {
    this.windRotationInterval = window.setInterval(() => {
      this.windArrowEl.style.transform = `rotate(${this.currentWindDirection}deg)`;
    }, 1000);
  }

  private handleSearchInput(): void {
    const query = this.citySearchEl.value;
    const results = query ? searchCities(query) : getPresetCities();
    this.renderSuggestions(results);
  }

  private handleSearchFocus(): void {
    if (!this.citySearchEl.value) {
      this.renderSuggestions(getPresetCities());
    } else {
      this.handleSearchInput();
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.citySuggestionsEl.classList.add('hidden');
    }
  }

  private renderSuggestions(cities: string[]): void {
    if (cities.length === 0) {
      this.citySuggestionsEl.classList.add('hidden');
      return;
    }

    this.citySuggestionsEl.innerHTML = '';
    cities.forEach(city => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = city;
      item.addEventListener('click', () => {
        this.citySearchEl.value = city;
        this.citySuggestionsEl.classList.add('hidden');
        this.onCitySelectCallback?.(city);
      });
      this.citySuggestionsEl.appendChild(item);
    });
    this.citySuggestionsEl.classList.remove('hidden');
  }

  private handleTimelineMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.handleTimelineSeek(e.clientX);
  }

  private handleTimelineMouseMove(e: MouseEvent): void {
    if (this.isDragging) {
      this.handleTimelineSeek(e.clientX);
    }
  }

  private handleTimelineMouseUp(): void {
    this.isDragging = false;
  }

  private handleTimelineTouchStart(e: TouchEvent): void {
    this.isDragging = true;
    if (e.touches[0]) {
      this.handleTimelineSeek(e.touches[0].clientX);
    }
  }

  private handleTimelineTouchMove(e: TouchEvent): void {
    if (this.isDragging && e.touches[0]) {
      this.handleTimelineSeek(e.touches[0].clientX);
    }
  }

  private handleTimelineTouchEnd(): void {
    this.isDragging = false;
  }

  private handleTimelineSeek(clientX: number): void {
    const rect = this.timelineTrackEl.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = progress * 24;
    this.onSeekCallback?.(time);
  }

  public setWeatherData(data: CityWeatherData): void {
    this.weatherData = data;
    this.lastHourIndex = -1;
    this.drawTempChart();
  }

  public update(update: WeatherUpdate): void {
    const { currentData, nextData, progress, timeIndex } = update;

    const temp = THREE_Math_lerp(currentData.temperature, nextData.temperature, progress);
    const precip = THREE_Math_lerp(currentData.precipitation, nextData.precipitation, progress);
    const windSpeed = THREE_Math_lerp(currentData.windSpeed, nextData.windSpeed, progress);
    this.currentWindDirection = THREE_lerpAngle(currentData.windDirection, nextData.windDirection, progress);

    const tempStr = `${temp.toFixed(1)}°C`;
    if (tempStr !== this.lastTemperature) {
      this.animateValue(this.tempValueEl, tempStr);
      this.lastTemperature = tempStr;
    }

    this.rainProgressEl.style.width = `${precip}%`;
    this.rainValueEl.textContent = `${precip.toFixed(0)}%`;

    const windStr = `${windSpeed.toFixed(1)} m/s`;
    if (windStr !== this.lastWindSpeed) {
      this.animateValue(this.windValueEl, windStr);
      this.lastWindSpeed = windStr;
    }

    const hour = Math.floor(update.timeIndex);
    const minute = Math.floor((update.timeIndex - hour) * 60);
    this.currentTimeEl.textContent = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const timelineProgress = (update.timeIndex / 24) * 100;
    this.timelineProgressEl.style.width = `${timelineProgress}%`;
    this.timelinePointerEl.style.left = `${timelineProgress}%`;

    if (timeIndex !== this.lastHourIndex) {
      this.lastHourIndex = timeIndex;
    }
  }

  private animateValue(element: HTMLElement, newValue: string): void {
    element.classList.remove('flip-animation');
    void element.offsetWidth;
    element.textContent = newValue;
    element.classList.add('flip-animation');
  }

  public setPlaying(playing: boolean): void {
    this.playPauseBtn.textContent = playing ? '❚❚' : '▶';
  }

  public onCitySelect(callback: CitySelectCallback): void {
    this.onCitySelectCallback = callback;
  }

  public onPlayPause(callback: ActionCallback): void {
    this.onPlayPauseCallback = callback;
  }

  public onSpeedChange(callback: SpeedChangeCallback): void {
    this.onSpeedChangeCallback = callback;
  }

  public onSeek(callback: SeekCallback): void {
    this.onSeekCallback = callback;
  }

  public onResetView(callback: ActionCallback): void {
    this.onResetViewCallback = callback;
  }

  public destroy(): void {
    if (this.windRotationInterval !== null) {
      clearInterval(this.windRotationInterval);
    }
  }
}

function THREE_Math_lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function THREE_lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return a + diff * t;
}
