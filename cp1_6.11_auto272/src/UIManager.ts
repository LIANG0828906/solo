import { KilnSimulator, FiringState } from './KilnSimulator';
import { DataExporter } from './DataExporter';

export class UIManager {
  private kilnSimulator: KilnSimulator;
  private dataExporter: DataExporter;
  private selectedGlaze: string = '#B8860B';
  private brushSize: number = 15;
  private isPainting: boolean = false;
  private temperatureHistory: { time: number; temp: number }[] = [];
  private chartCanvas: HTMLCanvasElement;
  private chartCtx: CanvasRenderingContext2D;
  private startTime: number = 0;
  private chartUpdateTimer: number = 0;

  private tempDisplay: HTMLElement;
  private tempSlider: HTMLInputElement;
  private rateSlider: HTMLInputElement;
  private rateValue: HTMLElement;
  private brushSizeSlider: HTMLInputElement;
  private brushSizeValue: HTMLElement;
  private currentTempDisplay: HTMLElement;
  private currentRateDisplay: HTMLElement;
  private btnStart: HTMLButtonElement;
  private btnPause: HTMLButtonElement;
  private btnCool: HTMLButtonElement;
  private reportPanel: HTMLElement;
  private leftPanel: HTMLElement;
  private rightPanel: HTMLElement;
  private mobileMenuBtn: HTMLElement;

  private onPaintCallback?: (uvX: number, uvY: number, radius: number, color: string) => void;
  private onResetCallback?: () => void;

  constructor(kilnSimulator: KilnSimulator, dataExporter: DataExporter) {
    this.kilnSimulator = kilnSimulator;
    this.dataExporter = dataExporter;

    this.chartCanvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
    this.chartCtx = this.chartCanvas.getContext('2d')!;

    this.tempDisplay = document.getElementById('temp-display')!;
    this.tempSlider = document.getElementById('temp-slider') as HTMLInputElement;
    this.rateSlider = document.getElementById('rate-slider') as HTMLInputElement;
    this.rateValue = document.getElementById('rate-value')!;
    this.brushSizeSlider = document.getElementById('brush-size') as HTMLInputElement;
    this.brushSizeValue = document.getElementById('brush-size-value')!;
    this.currentTempDisplay = document.getElementById('current-temp')!;
    this.currentRateDisplay = document.getElementById('current-rate')!;
    this.btnStart = document.getElementById('btn-start') as HTMLButtonElement;
    this.btnPause = document.getElementById('btn-pause') as HTMLButtonElement;
    this.btnCool = document.getElementById('btn-cool') as HTMLButtonElement;
    this.reportPanel = document.getElementById('report-panel')!;
    this.leftPanel = document.getElementById('left-panel')!;
    this.rightPanel = document.getElementById('right-panel')!;
    this.mobileMenuBtn = document.getElementById('mobile-menu-btn')!;

    this.resizeChart();
    this.setupEventListeners();
    this.setupKilnCallbacks();
    this.drawChart();
  }

  private resizeChart(): void {
    const container = document.getElementById('chart-container')!;
    const rect = container.getBoundingClientRect();
    this.chartCanvas.width = rect.width * window.devicePixelRatio;
    this.chartCanvas.height = rect.height * window.devicePixelRatio;
    this.chartCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private setupEventListeners(): void {
    document.querySelectorAll('.glaze-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.glaze-btn').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
        this.selectedGlaze = (e.currentTarget as HTMLElement).dataset.color || '#B8860B';
      });
    });

    this.brushSizeSlider.addEventListener('input', (e) => {
      this.brushSize = parseInt((e.target as HTMLInputElement).value);
      this.brushSizeValue.textContent = `${this.brushSize} 单位`;
    });

    this.tempSlider.addEventListener('input', (e) => {
      const temp = parseInt((e.target as HTMLInputElement).value);
      this.tempDisplay.textContent = `${temp}°C`;
    });

    this.rateSlider.addEventListener('input', (e) => {
      const rate = parseInt((e.target as HTMLInputElement).value);
      this.rateValue.textContent = `${rate} °C/s`;
      this.kilnSimulator.heatRate = rate;
    });

    this.btnStart.addEventListener('click', () => {
      this.startFiring();
    });

    this.btnPause.addEventListener('click', () => {
      this.togglePause();
    });

    this.btnCool.addEventListener('click', () => {
      this.startCooling();
    });

    this.mobileMenuBtn.addEventListener('click', () => {
      this.leftPanel.classList.toggle('open');
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this.reset();
      }
    });

    window.addEventListener('resize', () => {
      this.resizeChart();
      this.drawChart();
    });
  }

  private setupKilnCallbacks(): void {
    this.kilnSimulator.onTemperatureChange = (temp) => {
      this.tempDisplay.textContent = `${Math.round(temp)}°C`;
      this.currentTempDisplay.textContent = Math.round(temp).toString();

      const state = this.kilnSimulator.state;
      let rate = 0;
      if (state === 'heating') {
        rate = this.kilnSimulator.heatRate;
      } else if (state === 'cooling') {
        rate = -this.kilnSimulator.coolingRate;
      }
      this.currentRateDisplay.textContent = rate.toFixed(1);

      this.dataExporter.updateMaxTemp(temp);
    };

    this.kilnSimulator.onStateChange = (state) => {
      this.updateButtonStates(state);

      if (state === 'complete') {
        this.showReport();
      }
    };
  }

  private updateButtonStates(state: FiringState): void {
    switch (state) {
      case 'idle':
        this.btnStart.disabled = false;
        this.btnPause.disabled = true;
        this.btnCool.disabled = true;
        this.btnStart.textContent = '开始烧制';
        this.btnPause.textContent = '暂停';
        break;
      case 'heating':
        this.btnStart.disabled = true;
        this.btnPause.disabled = false;
        this.btnCool.disabled = false;
        this.btnPause.textContent = '暂停';
        break;
      case 'holding':
        this.btnStart.disabled = false;
        this.btnPause.disabled = false;
        this.btnCool.disabled = false;
        this.btnPause.textContent = '继续';
        break;
      case 'cooling':
        this.btnStart.disabled = true;
        this.btnPause.disabled = false;
        this.btnCool.disabled = true;
        this.btnPause.textContent = '暂停';
        break;
      case 'complete':
        this.btnStart.disabled = false;
        this.btnPause.disabled = true;
        this.btnCool.disabled = true;
        this.btnStart.textContent = '重新烧制';
        break;
    }
  }

  private startFiring(): void {
    if (this.kilnSimulator.state === 'complete' || this.kilnSimulator.state === 'idle') {
      this.temperatureHistory = [];
      this.startTime = performance.now();
      this.dataExporter.reset();
      this.reportPanel.style.display = 'none';
    }

    const targetTemp = parseInt(this.tempSlider.value);
    this.kilnSimulator.heatRate = parseInt(this.rateSlider.value);
    this.kilnSimulator.startFiring(targetTemp);
  }

  private togglePause(): void {
    this.kilnSimulator.pause();
  }

  private startCooling(): void {
    this.kilnSimulator.startCooling();
  }

  private showReport(): void {
    const report = this.dataExporter.getReport();

    document.getElementById('report-max-temp')!.textContent = `${report.maxTemperature}°C`;
    document.getElementById('report-hold-time')!.textContent = `${report.holdDuration.toFixed(1)} 秒`;
    document.getElementById('report-glazes')!.textContent = `${report.glazeTypes.length || 4} 种`;
    document.getElementById('report-crack-density')!.textContent = `${this.kilnSimulator.getCrackDensity()} 条`;

    this.reportPanel.style.display = 'block';

    this.dataExporter.setCrackDensity(this.kilnSimulator.getCrackDensity());
    this.dataExporter.setTotalTime(this.kilnSimulator.elapsedTime);
    this.dataExporter.setCoolingRate(this.kilnSimulator.coolingRate);
  }

  private reset(): void {
    this.kilnSimulator.reset();
    this.dataExporter.reset();
    this.temperatureHistory = [];
    this.reportPanel.style.display = 'none';
    this.btnStart.textContent = '开始烧制';
    this.updateButtonStates('idle');
    this.drawChart();

    if (this.onResetCallback) {
      this.onResetCallback();
    }
  }

  public update(deltaTime: number): void {
    if (this.kilnSimulator.state === 'idle' || this.kilnSimulator.state === 'complete') return;

    this.chartUpdateTimer += deltaTime;

    if (this.chartUpdateTimer >= 0.5) {
      this.chartUpdateTimer = 0;
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.temperatureHistory.push({
        time: elapsed,
        temp: this.kilnSimulator.temperature
      });

      if (this.temperatureHistory.length > 200) {
        this.temperatureHistory = this.temperatureHistory.slice(-200);
      }

      this.drawChart();
    }

    if (this.kilnSimulator.state === 'holding') {
      this.dataExporter.addHoldTime(deltaTime);
    }
  }

  private drawChart(): void {
    const width = this.chartCanvas.width / window.devicePixelRatio;
    const height = this.chartCanvas.height / window.devicePixelRatio;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    this.chartCtx.clearRect(0, 0, width, height);

    this.chartCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.chartCtx.fillRect(0, 0, width, height);

    this.chartCtx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    this.chartCtx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      this.chartCtx.beginPath();
      this.chartCtx.moveTo(padding.left, y);
      this.chartCtx.lineTo(width - padding.right, y);
      this.chartCtx.stroke();

      const tempLabel = Math.round(1250 - (1250 - 25) * (i / 5));
      this.chartCtx.fillStyle = '#D4AF37';
      this.chartCtx.font = '10px KaiTi, serif';
      this.chartCtx.textAlign = 'right';
      this.chartCtx.fillText(`${tempLabel}°`, padding.left - 5, y + 3);
    }

    if (this.temperatureHistory.length < 2) {
      this.chartCtx.fillStyle = '#D4AF37';
      this.chartCtx.font = '12px KaiTi, serif';
      this.chartCtx.textAlign = 'center';
      this.chartCtx.fillText('等待烧制开始...', width / 2, height / 2);
      return;
    }

    const maxTime = Math.max(30, this.temperatureHistory[this.temperatureHistory.length - 1].time);

    const gradient = this.chartCtx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(139, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.1)');

    this.chartCtx.beginPath();
    this.chartCtx.moveTo(padding.left, height - padding.bottom);

    for (let i = 0; i < this.temperatureHistory.length; i++) {
      const point = this.temperatureHistory[i];
      const x = padding.left + (point.time / maxTime) * chartWidth;
      const y = padding.top + chartHeight - ((point.temp - 25) / (1250 - 25)) * chartHeight;

      if (i === 0) {
        this.chartCtx.lineTo(x, y);
      } else {
        this.chartCtx.lineTo(x, y);
      }
    }

    const lastPoint = this.temperatureHistory[this.temperatureHistory.length - 1];
    const lastX = padding.left + (lastPoint.time / maxTime) * chartWidth;
    this.chartCtx.lineTo(lastX, height - padding.bottom);
    this.chartCtx.closePath();
    this.chartCtx.fillStyle = gradient;
    this.chartCtx.fill();

    this.chartCtx.beginPath();
    this.chartCtx.strokeStyle = '#8B0000';
    this.chartCtx.lineWidth = 2;

    for (let i = 0; i < this.temperatureHistory.length; i++) {
      const point = this.temperatureHistory[i];
      const x = padding.left + (point.time / maxTime) * chartWidth;
      const y = padding.top + chartHeight - ((point.temp - 25) / (1250 - 25)) * chartHeight;

      if (i === 0) {
        this.chartCtx.moveTo(x, y);
      } else {
        this.chartCtx.lineTo(x, y);
      }
    }

    this.chartCtx.stroke();

    this.chartCtx.fillStyle = '#D4AF37';
    this.chartCtx.font = '10px KaiTi, serif';
    this.chartCtx.textAlign = 'center';
    this.chartCtx.fillText('时间 (秒)', width / 2, height - 8);
  }

  public setPaintCallback(callback: (uvX: number, uvY: number, radius: number, color: string) => void): void {
    this.onPaintCallback = callback;
  }

  public setResetCallback(callback: () => void): void {
    this.onResetCallback = callback;
  }

  public getSelectedGlaze(): string {
    return this.selectedGlaze;
  }

  public getBrushSize(): number {
    return this.brushSize;
  }

  public getIsPainting(): boolean {
    return this.isPainting;
  }

  public setIsPainting(value: boolean): void {
    this.isPainting = value;
  }

  public addTemperaturePoint(time: number, temp: number): void {
    this.temperatureHistory.push({ time, temp });
  }

  public resetChart(): void {
    this.temperatureHistory = [];
    this.startTime = performance.now();
    this.drawChart();
  }
}
