import axios from 'axios';
import type { OceanCurrent, TemperatureGrid, OceanCurrentData, LocationInfo } from './types';
import { OceanFlowRenderer } from './oceanFlow';
import { HeatmapRenderer } from './heatmap';

type DataCallback = (
  currents: OceanCurrent[],
  tempGrid: TemperatureGrid
) => void;

type ResetViewCallback = () => void;

export class UIController {
  private container: HTMLElement;
  private oceanFlow: OceanFlowRenderer;
  private heatmap: HeatmapRenderer;
  private onDataUpdate: DataCallback;
  private onResetView: ResetViewCallback;
  private currentMonthOffset: number = 0;
  private infoCard: HTMLElement | null = null;
  private controlPanel: HTMLElement;
  private timelineContainer: HTMLElement;
  private lastFetchTime: number = 0;
  private cachedCurrents: OceanCurrent[] | null = null;
  private cachedTempGrid: TemperatureGrid | null = null;
  private fetchInterval: number = 10000;
  private floatingBtn: HTMLElement | null = null;

  constructor(
    container: HTMLElement,
    oceanFlow: OceanFlowRenderer,
    heatmap: HeatmapRenderer,
    onDataUpdate: DataCallback,
    onResetView: ResetViewCallback
  ) {
    this.container = container;
    this.oceanFlow = oceanFlow;
    this.heatmap = heatmap;
    this.onDataUpdate = onDataUpdate;
    this.onResetView = onResetView;
    this.controlPanel = this.createControlPanel();
    this.timelineContainer = this.createTimeline();
    this.setupResponsiveLayout();
    this.startDataPolling();
    this.fetchInitialData();
  }

  private createControlPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'control-panel glass-panel';
    panel.id = 'control-panel';
    panel.style.cssText = `
      position: absolute;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      width: 240px;
      padding: 20px;
      z-index: 100;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #E0E0FF; border-bottom: 1px solid rgba(100, 200, 255, 0.2); padding-bottom: 10px;';
    title.textContent = '控制面板';
    panel.appendChild(title);

    const opacitySection = document.createElement('div');
    opacitySection.style.marginBottom = '20px';
    
    const opacityLabel = document.createElement('div');
    opacityLabel.style.cssText = 'font-size: 13px; margin-bottom: 8px; color: #B0B0CC; display: flex; justify-content: space-between;';
    const opacityText = document.createElement('span');
    opacityText.textContent = '热力图透明度';
    const opacityValue = document.createElement('span');
    opacityValue.id = 'opacity-value';
    opacityValue.textContent = '70%';
    opacityLabel.appendChild(opacityText);
    opacityLabel.appendChild(opacityValue);
    opacitySection.appendChild(opacityLabel);

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0.2';
    opacitySlider.max = '1.0';
    opacitySlider.step = '0.05';
    opacitySlider.value = '0.7';
    opacitySlider.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(100, 200, 255, 0.2);
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    `;
    
    const sliderStyle = document.createElement('style');
    sliderStyle.textContent = `
      #control-panel input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px; height: 16px; border-radius: 50%;
        background: linear-gradient(135deg, #4A90FF, #2563EB);
        cursor: pointer; box-shadow: 0 2px 8px rgba(74, 144, 255, 0.4);
        transition: all 0.2s ease;
      }
      #control-panel input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(74, 144, 255, 0.6);
      }
      .control-btn {
        width: 100%; padding: 10px 16px; border: none; border-radius: 8px;
        background: rgba(74, 144, 255, 0.2); color: #E0E0FF; font-size: 13px;
        cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        backdrop-filter: blur(5px); border: 1px solid rgba(100, 200, 255, 0.2);
      }
      .control-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(74, 144, 255, 0.3);
        background: rgba(74, 144, 255, 0.3);
      }
      .control-btn.active {
        background: linear-gradient(135deg, #4A90FF, #2563EB);
        border-color: rgba(100, 200, 255, 0.5);
      }
      .switch-btn {
        display: flex; align-items: center; justify-content: space-between;
      }
      .switch-indicator {
        width: 40px; height: 20px; border-radius: 10px;
        background: rgba(255, 255, 255, 0.1); position: relative;
        transition: all 0.3s ease;
      }
      .switch-indicator::after {
        content: ''; position: absolute; top: 2px; left: 2px;
        width: 16px; height: 16px; border-radius: 50%;
        background: rgba(255, 255, 255, 0.6); transition: all 0.3s ease;
      }
      .switch-btn.active .switch-indicator {
        background: linear-gradient(135deg, #4A90FF, #2563EB);
      }
      .switch-btn.active .switch-indicator::after {
        left: 22px; background: white;
      }
    `;
    document.head.appendChild(sliderStyle);
    
    opacitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.heatmap.setOpacity(value);
      opacityValue.textContent = `${Math.round(value * 100)}%`;
    });
    opacitySection.appendChild(opacitySlider);
    panel.appendChild(opacitySection);

    const currentToggle = document.createElement('button');
    currentToggle.className = 'control-btn switch-btn active';
    currentToggle.style.marginBottom = '12px';
    currentToggle.innerHTML = `
      <span>显示洋流</span>
      <div class="switch-indicator"></div>
    `;
    currentToggle.addEventListener('click', () => {
      const isActive = currentToggle.classList.contains('active');
      if (isActive) {
        currentToggle.classList.remove('active');
        this.oceanFlow.setVisible(false);
      } else {
        currentToggle.classList.add('active');
        this.oceanFlow.setVisible(true);
      }
    });
    panel.appendChild(currentToggle);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'control-btn';
    resetBtn.textContent = '重置视角';
    resetBtn.addEventListener('click', () => {
      this.onResetView();
    });
    panel.appendChild(resetBtn);

    this.container.appendChild(panel);
    return panel;
  }

  private createTimeline(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'timeline-container glass-panel';
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 800px;
      padding: 16px 24px;
      z-index: 100;
    `;

    const months: string[] = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const now = new Date();
    
    const label = document.createElement('div');
    label.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; color: #B0B0CC;';
    
    const startLabel = document.createElement('span');
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 12);
    startLabel.textContent = `${startDate.getFullYear()}年${months[startDate.getMonth()]}`;
    
    const currentLabel = document.createElement('span');
    currentLabel.id = 'current-month-label';
    currentLabel.style.cssText = 'font-weight: 600; color: #E0E0FF;';
    currentLabel.textContent = `${now.getFullYear()}年${months[now.getMonth()]}（当前）`;
    
    const endLabel = document.createElement('span');
    endLabel.textContent = `${now.getFullYear()}年${months[now.getMonth()]}`;
    
    label.appendChild(startLabel);
    label.appendChild(currentLabel);
    label.appendChild(endLabel);
    container.appendChild(label);

    const sliderWrap = document.createElement('div');
    sliderWrap.style.position = 'relative';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '12';
    slider.step = '1';
    slider.value = '12';
    slider.id = 'timeline-slider';
    slider.style.cssText = `
      width: 100%; height: 8px; border-radius: 4px;
      background: linear-gradient(90deg, rgba(74, 144, 255, 0.3), rgba(100, 200, 255, 0.5));
      outline: none; -webkit-appearance: none; cursor: pointer;
    `;
    
    const timelineStyle = document.createElement('style');
    timelineStyle.textContent = `
      #timeline-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px; height: 20px; border-radius: 50%;
        background: linear-gradient(135deg, #4A90FF, #2563EB);
        cursor: pointer; box-shadow: 0 2px 10px rgba(74, 144, 255, 0.5);
        border: 2px solid rgba(255, 255, 255, 0.8);
        transition: all 0.2s ease;
      }
      #timeline-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 4px 16px rgba(74, 144, 255, 0.7);
      }
    `;
    document.head.appendChild(timelineStyle);

    let isDragging = false;
    slider.addEventListener('mousedown', () => { isDragging = true; });
    slider.addEventListener('mouseup', () => { isDragging = false; });
    slider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.currentMonthOffset = 12 - value;
      
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() - this.currentMonthOffset);
      currentLabel.textContent = `${targetDate.getFullYear()}年${months[targetDate.getMonth()]}`;
      
      this.fetchHistoricalData(this.currentMonthOffset);
    });
    
    sliderWrap.appendChild(slider);
    container.appendChild(sliderWrap);

    this.container.appendChild(container);
    return container;
  }

  private setupResponsiveLayout(): void {
    const checkWidth = () => {
      const width = window.innerWidth;
      
      if (this.floatingBtn) {
        this.floatingBtn.remove();
        this.floatingBtn = null;
      }
      
      if (width < 768) {
        this.controlPanel.style.display = 'none';
        this.controlPanel.classList.remove('top-bar');
        this.controlPanel.style.top = '';
        this.controlPanel.style.right = '';
        this.controlPanel.style.transform = '';
        this.controlPanel.style.width = '240px';
        
        this.floatingBtn = document.createElement('button');
        this.floatingBtn.className = 'glass-panel';
        this.floatingBtn.style.cssText = `
          position: fixed; bottom: 100px; right: 20px; z-index: 200;
          width: 56px; height: 56px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; cursor: pointer; color: #E0E0FF;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
          border: 1px solid rgba(100, 200, 255, 0.3);
        `;
        this.floatingBtn.innerHTML = '⚙';
        this.floatingBtn.addEventListener('click', () => {
          if (this.controlPanel.style.display === 'none' || this.controlPanel.style.display === '') {
            this.controlPanel.style.display = 'block';
            this.controlPanel.style.position = 'fixed';
            this.controlPanel.style.top = '50%';
            this.controlPanel.style.right = '20px';
            this.controlPanel.style.transform = 'translateY(-50%)';
          } else {
            this.controlPanel.style.display = 'none';
          }
        });
        document.body.appendChild(this.floatingBtn);
      } else if (width <= 1280) {
        this.controlPanel.style.display = 'flex';
        this.controlPanel.style.flexWrap = 'wrap';
        this.controlPanel.style.alignItems = 'center';
        this.controlPanel.style.gap = '16px';
        this.controlPanel.style.top = '20px';
        this.controlPanel.style.right = '20px';
        this.controlPanel.style.left = '20px';
        this.controlPanel.style.transform = 'none';
        this.controlPanel.style.width = 'auto';
        this.controlPanel.style.bottom = 'auto';
        
        const titleEl = this.controlPanel.querySelector('div:first-child');
        if (titleEl) {
          (titleEl as HTMLElement).style.marginBottom = '0';
          (titleEl as HTMLElement).style.borderBottom = 'none';
          (titleEl as HTMLElement).style.paddingBottom = '0';
          (titleEl as HTMLElement).style.borderRight = '1px solid rgba(100, 200, 255, 0.2)';
          (titleEl as HTMLElement).style.paddingRight = '16px';
          (titleEl as HTMLElement).style.marginRight = '16px';
        }
        
        const sections = this.controlPanel.querySelectorAll('div, button');
        sections.forEach((sec) => {
          (sec as HTMLElement).style.marginBottom = '0';
        });
      } else {
        this.controlPanel.style.display = 'block';
        this.controlPanel.style.top = '50%';
        this.controlPanel.style.right = '20px';
        this.controlPanel.style.left = 'auto';
        this.controlPanel.style.transform = 'translateY(-50%)';
        this.controlPanel.style.width = '240px';
      }
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
  }

  private async fetchInitialData(): Promise<void> {
    try {
      const [currentsRes, tempRes] = await Promise.all([
        axios.get<OceanCurrentData>('/api/ocean-currents'),
        axios.get<TemperatureGrid>('/api/temperature-grid')
      ]);
      
      this.cachedCurrents = currentsRes.data.currents;
      this.cachedTempGrid = tempRes.data;
      this.onDataUpdate(currentsRes.data.currents, tempRes.data);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      this.useMockData();
    }
  }

  private async fetchHistoricalData(monthOffset: number): Promise<void> {
    try {
      const [currentsRes, tempRes] = await Promise.all([
        axios.get<OceanCurrentData>('/api/ocean-currents', { params: { monthOffset } }),
        axios.get<TemperatureGrid>('/api/temperature-grid', { params: { monthOffset } })
      ]);
      
      this.onDataUpdate(currentsRes.data.currents, tempRes.data);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
    }
  }

  private startDataPolling(): void {
    setInterval(async () => {
      if (this.currentMonthOffset !== 0) return;
      
      try {
        const [currentsRes, tempRes] = await Promise.all([
          axios.get<OceanCurrentData>('/api/ocean-currents'),
          axios.get<TemperatureGrid>('/api/temperature-grid')
        ]);
        
        this.cachedCurrents = currentsRes.data.currents;
        this.cachedTempGrid = tempRes.data;
        this.onDataUpdate(currentsRes.data.currents, tempRes.data);
      } catch (err) {
        console.error('Polling failed:', err);
      }
    }, this.fetchInterval);
  }

  private useMockData(): void {
    const mockCurrents: OceanCurrent[] = [
      { id: '1', name: '墨西哥湾流', nameEn: 'Gulf Stream', start: { lat: 25, lng: -80 }, end: { lat: 50, lng: -20 }, speed: 2.5, temperature: 25, isWarm: true, waypoints: [{ lat: 35, lng: -65 }, { lat: 45, lng: -40 }] },
      { id: '2', name: '黑潮', nameEn: 'Kuroshio', start: { lat: 15, lng: 125 }, end: { lat: 45, lng: 165 }, speed: 2.2, temperature: 24, isWarm: true, waypoints: [{ lat: 28, lng: 135 }, { lat: 38, lng: 150 }] },
      { id: '3', name: '北大西洋漂流', nameEn: 'North Atlantic Drift', start: { lat: 45, lng: -40 }, end: { lat: 65, lng: 0 }, speed: 1.2, temperature: 15, isWarm: true },
      { id: '4', name: '秘鲁寒流', nameEn: 'Humboldt Current', start: { lat: -5, lng: -80 }, end: { lat: -35, lng: -75 }, speed: 1.8, temperature: 14, isWarm: false },
      { id: '5', name: '加利福尼亚寒流', nameEn: 'California Current', start: { lat: 45, lng: -130 }, end: { lat: 20, lng: -115 }, speed: 1.5, temperature: 13, isWarm: false },
      { id: '6', name: '东澳暖流', nameEn: 'East Australian Current', start: { lat: -15, lng: 155 }, end: { lat: -40, lng: 155 }, speed: 1.6, temperature: 22, isWarm: true },
      { id: '7', name: '巴西暖流', nameEn: 'Brazil Current', start: { lat: -10, lng: -35 }, end: { lat: -40, lng: -55 }, speed: 1.4, temperature: 23, isWarm: true },
      { id: '8', name: '本格拉寒流', nameEn: 'Benguela Current', start: { lat: -5, lng: 10 }, end: { lat: -30, lng: 5 }, speed: 1.3, temperature: 12, isWarm: false },
      { id: '9', name: '索马里洋流', nameEn: 'Somali Current', start: { lat: -5, lng: 45 }, end: { lat: 15, lng: 55 }, speed: 2.0, temperature: 20, isWarm: true },
      { id: '10', name: '阿拉斯加暖流', nameEn: 'Alaska Current', start: { lat: 45, lng: -135 }, end: { lat: 60, lng: -150 }, speed: 1.1, temperature: 10, isWarm: true },
      { id: '11', name: '亲潮', nameEn: 'Oyashio', start: { lat: 60, lng: 160 }, end: { lat: 38, lng: 145 }, speed: 1.7, temperature: 5, isWarm: false },
      { id: '12', name: '拉布拉多寒流', nameEn: 'Labrador Current', start: { lat: 70, lng: -60 }, end: { lat: 42, lng: -55 }, speed: 1.6, temperature: 3, isWarm: false },
      { id: '13', name: '西澳寒流', nameEn: 'West Australian Current', start: { lat: -10, lng: 105 }, end: { lat: -35, lng: 110 }, speed: 1.2, temperature: 15, isWarm: false },
      { id: '14', name: '莫桑比克暖流', nameEn: 'Mozambique Current', start: { lat: -10, lng: 35 }, end: { lat: -30, lng: 33 }, speed: 1.5, temperature: 24, isWarm: true },
      { id: '15', name: '马达加斯加暖流', nameEn: 'Madagascar Current', start: { lat: -10, lng: 50 }, end: { lat: -30, lng: 45 }, speed: 1.4, temperature: 23, isWarm: true },
      { id: '16', name: '厄加勒斯暖流', nameEn: 'Agulhas Current', start: { lat: -25, lng: 35 }, end: { lat: -40, lng: 25 }, speed: 2.0, temperature: 22, isWarm: true },
      { id: '17', name: '南赤道暖流', nameEn: 'South Equatorial Current', start: { lat: -5, lng: -30 }, end: { lat: -10, lng: 170 }, speed: 0.8, temperature: 26, isWarm: true },
      { id: '18', name: '北赤道暖流', nameEn: 'North Equatorial Current', start: { lat: 10, lng: -30 }, end: { lat: 15, lng: 170 }, speed: 0.7, temperature: 27, isWarm: true },
      { id: '19', name: '赤道逆流', nameEn: 'Equatorial Counter Current', start: { lat: 3, lng: -180 }, end: { lat: 5, lng: 0 }, speed: 0.9, temperature: 27, isWarm: true },
      { id: '20', name: '南极绕极流', nameEn: 'Antarctic Circumpolar', start: { lat: -55, lng: -180 }, end: { lat: -60, lng: 180 }, speed: 1.0, temperature: 2, isWarm: false },
      { id: '21', name: '北大西洋暖流', nameEn: 'North Atlantic Current', start: { lat: 40, lng: -40 }, end: { lat: 60, lng: -10 }, speed: 1.3, temperature: 16, isWarm: true },
      { id: '22', name: '北太平洋暖流', nameEn: 'North Pacific Current', start: { lat: 35, lng: 160 }, end: { lat: 50, lng: -140 }, speed: 0.9, temperature: 14, isWarm: true },
      { id: '23', name: '湾流', nameEn: 'Florida Current', start: { lat: 23, lng: -82 }, end: { lat: 30, lng: -70 }, speed: 2.8, temperature: 26, isWarm: true },
      { id: '24', name: '对马暖流', nameEn: 'Tsushima Current', start: { lat: 30, lng: 130 }, end: { lat: 42, lng: 135 }, speed: 1.2, temperature: 20, isWarm: true },
      { id: '25', name: '黄海暖流', nameEn: 'Yellow Sea Warm Current', start: { lat: 32, lng: 125 }, end: { lat: 38, lng: 122 }, speed: 0.8, temperature: 16, isWarm: true },
      { id: '26', name: '南海暖流', nameEn: 'South China Sea Warm Current', start: { lat: 10, lng: 110 }, end: { lat: 22, lng: 118 }, speed: 0.7, temperature: 27, isWarm: true },
      { id: '27', name: '挪威海流', nameEn: 'Norwegian Current', start: { lat: 60, lng: 0 }, end: { lat: 72, lng: 15 }, speed: 0.8, temperature: 8, isWarm: true },
      { id: '28', name: '斯瓦尔巴德暖流', nameEn: 'Spitsbergen Current', start: { lat: 65, lng: 10 }, end: { lat: 80, lng: 20 }, speed: 0.6, temperature: 4, isWarm: true },
      { id: '29', name: '东格陵兰寒流', nameEn: 'East Greenland Current', start: { lat: 80, lng: -10 }, end: { lat: 60, lng: -40 }, speed: 0.9, temperature: -1, isWarm: false },
      { id: '30', name: '西格陵兰暖流', nameEn: 'West Greenland Current', start: { lat: 60, lng: -50 }, end: { lat: 78, lng: -60 }, speed: 0.7, temperature: 3, isWarm: true }
    ];

    const mockPoints: { lat: number; lng: number; temperature: number }[] = [];
    for (let lat = -88; lat <= 88; lat += 2) {
      for (let lng = -178; lng <= 178; lng += 2) {
        const baseTemp = 32 - Math.abs(lat) * 0.55;
        const variation = Math.sin(lng * Math.PI / 180) * 3 + Math.cos(lat * 2 * Math.PI / 180) * 2;
        const temp = Math.max(0, Math.min(32, baseTemp + variation + (Math.random() - 0.5) * 2));
        mockPoints.push({ lat, lng, temperature: Math.round(temp * 10) / 10, timestamp: Date.now() });
      }
    }

    const mockTempGrid: TemperatureGrid = {
      data: mockPoints,
      timestamp: Date.now(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };

    this.cachedCurrents = mockCurrents;
    this.cachedTempGrid = mockTempGrid;
    this.onDataUpdate(mockCurrents, mockTempGrid);
  }

  showInfoCard(
    lat: number,
    lng: number,
    screenX: number,
    screenY: number,
    info: LocationInfo
  ): void {
    this.hideInfoCard();

    this.infoCard = document.createElement('div');
    this.infoCard.className = 'info-card glass-panel';
    this.infoCard.style.cssText = `
      position: absolute;
      left: ${screenX}px;
      top: ${screenY}px;
      transform: translate(-50%, -100%) scale(0.5);
      transform-origin: bottom center;
      width: 280px;
      padding: 18px;
      z-index: 150;
      opacity: 0;
      margin-bottom: 20px;
      animation: cardIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `;

    const keyframes = document.createElement('style');
    keyframes.textContent = `
      @keyframes cardIn {
        0% { opacity: 0; transform: translate(-50%, -100%) scale(0.5); }
        100% { opacity: 1; transform: translate(-50%, calc(-100% - 10px)) scale(1); }
      }
      @keyframes cardOut {
        0% { opacity: 1; transform: translate(-50%, calc(-100% - 10px)) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -100%) scale(0.7); }
      }
    `;
    document.head.appendChild(keyframes);

    const closeBtn = document.createElement('div');
    closeBtn.style.cssText = `
      position: absolute; top: 8px; right: 12px; cursor: pointer;
      width: 24px; height: 24px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: #B0B0CC; transition: all 0.2s;
    `;
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideInfoCard();
    });
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 100, 100, 0.3)';
      closeBtn.style.color = '#FF6B6B';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#B0B0CC';
    });
    this.infoCard.appendChild(closeBtn);

    const coordRow = document.createElement('div');
    coordRow.style.cssText = 'margin-bottom: 14px;';
    const coordLabel = document.createElement('div');
    coordLabel.style.cssText = 'font-size: 11px; color: #8080A0; margin-bottom: 4px;';
    coordLabel.textContent = '坐标';
    const coordValue = document.createElement('div');
    coordValue.style.cssText = 'font-size: 14px; color: #E0E0FF; font-weight: 500;';
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    coordValue.textContent = `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
    coordRow.appendChild(coordLabel);
    coordRow.appendChild(coordValue);
    this.infoCard.appendChild(coordRow);

    const tempRow = document.createElement('div');
    tempRow.style.cssText = 'margin-bottom: 14px;';
    const tempLabel = document.createElement('div');
    tempLabel.style.cssText = 'font-size: 11px; color: #8080A0; margin-bottom: 4px;';
    tempLabel.textContent = '海面温度';
    const tempValue = document.createElement('div');
    const tempColor = info.temperature > 20 ? '#FF8C42' : info.temperature > 10 ? '#FFD93D' : '#4ECDC4';
    tempValue.style.cssText = `font-size: 22px; font-weight: 700; color: ${tempColor};`;
    tempValue.textContent = `${info.temperature.toFixed(1)}°C`;
    tempRow.appendChild(tempLabel);
    tempRow.appendChild(tempValue);
    this.infoCard.appendChild(tempRow);

    if (info.nearbyCurrents.length > 0) {
      const currentRow = document.createElement('div');
      currentRow.style.cssText = 'margin-bottom: 14px;';
      const currentLabel = document.createElement('div');
      currentLabel.style.cssText = 'font-size: 11px; color: #8080A0; margin-bottom: 8px;';
      currentLabel.textContent = '附近洋流';
      currentRow.appendChild(currentLabel);
      
      for (const cur of info.nearbyCurrents) {
        const curItem = document.createElement('div');
        curItem.style.cssText = 'display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(100, 200, 255, 0.1); border-radius: 6px; margin-bottom: 6px; font-size: 12px;';
        const curName = document.createElement('span');
        curName.textContent = cur.name;
        curName.style.color = '#B0D4FF';
        const curDir = document.createElement('span');
        curDir.textContent = cur.direction;
        curDir.style.color = '#80CBC4';
        curItem.appendChild(curName);
        curItem.appendChild(curDir);
        currentRow.appendChild(curItem);
      }
      this.infoCard.appendChild(currentRow);
    }

    const trendRow = document.createElement('div');
    trendRow.style.marginBottom = '0';
    const trendLabel = document.createElement('div');
    trendLabel.style.cssText = 'font-size: 11px; color: #8080A0; margin-bottom: 10px;';
    trendLabel.textContent = '5天温度趋势';
    trendRow.appendChild(trendLabel);

    const chart = document.createElement('div');
    chart.style.cssText = 'display: flex; align-items: flex-end; gap: 6px; height: 50px; padding: 0 4px;';
    
    const minT = Math.min(...info.trend);
    const maxT = Math.max(...info.trend);
    const range = maxT - minT || 1;

    for (let i = 0; i < info.trend.length; i++) {
      const bar = document.createElement('div');
      const t = info.trend[i];
      const normalizedH = 0.3 + ((t - minT) / range) * 0.7;
      const hue = 210 - ((t - 0) / 32) * 210;
      bar.style.cssText = `
        flex: 1; height: ${normalizedH * 100}%;
        background: linear-gradient(180deg, hsl(${hue}, 80%, 65%), hsl(${hue}, 80%, 45%));
        border-radius: 3px 3px 0 0; position: relative;
        transition: all 0.3s ease; min-height: 10px;
      `;
      bar.title = `第${i + 1}天: ${t.toFixed(1)}°C`;
      bar.addEventListener('mouseenter', () => {
        bar.style.transform = 'scaleY(1.05)';
      });
      bar.addEventListener('mouseleave', () => {
        bar.style.transform = 'scaleY(1)';
      });
      chart.appendChild(bar);
    }
    trendRow.appendChild(chart);
    this.infoCard.appendChild(trendRow);

    this.infoCard.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    this.container.appendChild(this.infoCard);

    const closeHandler = (e: Event) => {
      if (!this.infoCard) return;
      const target = e.target as Node;
      if (this.infoCard.contains(target)) return;
      this.hideInfoCard();
      document.removeEventListener('click', closeHandler, true);
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler, true);
    }, 100);
  }

  hideInfoCard(): void {
    if (this.infoCard) {
      this.infoCard.style.animation = 'cardOut 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards';
      const card = this.infoCard;
      setTimeout(() => {
        if (card.parentNode) {
          card.parentNode.removeChild(card);
        }
      }, 300);
      this.infoCard = null;
    }
  }

  getLocationInfo(lat: number, lng: number): LocationInfo {
    const temperature = this.heatmap.getTemperatureAt(lat, lng);
    const nearbyCurrents = this.oceanFlow.getNearbyCurrents(lat, lng, 20);
    
    const trend: number[] = [];
    for (let i = 0; i < 5; i++) {
      const dayVariation = Math.sin(i * 0.8) * 1.5 + (Math.random() - 0.5) * 1;
      trend.push(Math.round((temperature + dayVariation) * 10) / 10);
    }

    return {
      lat,
      lng,
      temperature: Math.round(temperature * 10) / 10,
      nearbyCurrents,
      trend
    };
  }
}
