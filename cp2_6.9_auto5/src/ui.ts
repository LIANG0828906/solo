import type { LightSource, GlobalConfig } from './types.js';
import {
  CANVAS_SIZE,
  MAX_LIGHTS,
  DEFAULT_LIGHT_RADIUS,
  DEFAULT_BRIGHTNESS,
  DEFAULT_SATURATION
} from './types.js';
import { render, renderLightMarkers, getLightAtPosition } from './renderer.js';

export class LightSculptureUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private lights: LightSource[] = [];
  private config: GlobalConfig = {
    attenuation: 2,
    ambientIntensity: 0.05,
    roughness: 0.3,
    backgroundColor: '#2d2d2d'
  };
  private selectedLightId: number | null = null;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private nextLightId = 0;
  private renderPending = false;
  private lastRenderTime = 0;
  private readonly minRenderInterval = 20;

  private leftPanel!: HTMLElement;
  private rightPanel!: HTMLElement;
  private saveBtn!: HTMLButtonElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');
    this.ctx = ctx;
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
  }

  init(initialLights: LightSource[], panels: {
    leftPanel: HTMLElement;
    rightPanel: HTMLElement;
    saveBtn: HTMLButtonElement;
  }): void {
    this.leftPanel = panels.leftPanel;
    this.rightPanel = panels.rightPanel;
    this.saveBtn = panels.saveBtn;
    
    this.lights = initialLights.map(l => ({ ...l, id: this.nextLightId++ }));
    
    this.bindCanvasEvents();
    this.buildLeftPanel();
    this.buildRightPanel();
    this.bindSaveButton();
    
    this.requestRender();
  }

  private bindCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseDown({ ...touch, button: 0 } as MouseEvent);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseMove(touch);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleMouseUp();
    }, { passive: false });
  }

  private getCanvasPos(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);
    const clickedLight = getLightAtPosition(this.lights, pos.x, pos.y);
    
    if (clickedLight) {
      this.selectedLightId = clickedLight.id;
      this.isDragging = true;
      this.dragOffsetX = pos.x - clickedLight.x;
      this.dragOffsetY = pos.y - clickedLight.y;
      this.updateSelectedHighlight();
    } else if (this.lights.length < MAX_LIGHTS) {
      const hue = Math.floor(Math.random() * 360);
      const newLight: LightSource = {
        id: this.nextLightId++,
        x: pos.x,
        y: pos.y,
        hue,
        brightness: DEFAULT_BRIGHTNESS,
        radius: DEFAULT_LIGHT_RADIUS
      };
      this.lights.push(newLight);
      this.selectedLightId = newLight.id;
      this.buildLeftPanel();
      this.requestRender();
    }
  }

  private handleMouseMove(e: { clientX: number; clientY: number }): void {
    if (!this.isDragging || this.selectedLightId === null) return;
    
    const pos = this.getCanvasPos(e);
    const light = this.lights.find(l => l.id === this.selectedLightId);
    if (!light) return;
    
    light.x = Math.max(0, Math.min(CANVAS_SIZE, pos.x - this.dragOffsetX));
    light.y = Math.max(0, Math.min(CANVAS_SIZE, pos.y - this.dragOffsetY));
    
    this.updateSliderPosition(light.id, light.x, light.y);
    this.requestRender(true);
  }

  private handleMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.requestRender(false);
    }
  }

  private buildLeftPanel(): void {
    this.leftPanel.innerHTML = `
      <h3 class="panel-title">光源管理 (${this.lights.length}/${MAX_LIGHTS})</h3>
      <div class="light-list">
        ${this.lights.map(light => this.createLightItem(light)).join('')}
      </div>
    `;
    
    this.lights.forEach(light => {
      const hueSlider = this.leftPanel.querySelector(`#hue-${light.id}`) as HTMLInputElement;
      const brightnessSlider = this.leftPanel.querySelector(`#brightness-${light.id}`) as HTMLInputElement;
      const radiusSlider = this.leftPanel.querySelector(`#radius-${light.id}`) as HTMLInputElement;
      const deleteBtn = this.leftPanel.querySelector(`#delete-${light.id}`) as HTMLButtonElement;
      const item = this.leftPanel.querySelector(`#light-item-${light.id}`) as HTMLElement;
      
      if (hueSlider) {
        hueSlider.addEventListener('input', (e) => {
          const value = Number((e.target as HTMLInputElement).value);
          light.hue = value;
          this.updateLightPreview(light);
          this.requestRender();
        });
      }
      
      if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
          const value = Number((e.target as HTMLInputElement).value);
          light.brightness = value;
          this.updateLightPreview(light);
          this.requestRender();
        });
      }
      
      if (radiusSlider) {
        radiusSlider.addEventListener('input', (e) => {
          const value = Number((e.target as HTMLInputElement).value);
          light.radius = value;
          this.updateLightPreview(light);
          this.requestRender();
        });
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          this.lights = this.lights.filter(l => l.id !== light.id);
          if (this.selectedLightId === light.id) {
            this.selectedLightId = null;
          }
          this.buildLeftPanel();
          this.requestRender();
        });
      }
      
      if (item) {
        item.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('button, input')) return;
          this.selectedLightId = light.id;
          this.updateSelectedHighlight();
          this.requestRender();
        });
      }
    });
    
    this.updateSelectedHighlight();
  }

  private createLightItem(light: LightSource): string {
    const color = `hsl(${light.hue}, ${DEFAULT_SATURATION}%, ${light.brightness}%)`;
    const isSelected = this.selectedLightId === light.id;
    return `
      <div class="light-item ${isSelected ? 'selected' : ''}" id="light-item-${light.id}">
        <div class="light-header">
          <div class="light-preview" id="preview-${light.id}" style="background: ${color}"></div>
          <span class="light-label">光源 #${light.id + 1}</span>
          <button class="delete-btn" id="delete-${light.id}" title="删除">×</button>
        </div>
        <div class="slider-group">
          <label>色相 <span class="slider-value">${light.hue}°</span></label>
          <input type="range" id="hue-${light.id}" min="0" max="360" value="${light.hue}" class="slider hue-slider">
        </div>
        <div class="slider-group">
          <label>亮度 <span class="slider-value">${light.brightness}%</span></label>
          <input type="range" id="brightness-${light.id}" min="10" max="100" value="${light.brightness}" class="slider">
        </div>
        <div class="slider-group">
          <label>半径 <span class="slider-value">${light.radius}px</span></label>
          <input type="range" id="radius-${light.id}" min="4" max="16" value="${light.radius}" class="slider">
        </div>
        <div class="light-position" id="pos-${light.id}">
          位置: (${Math.round(light.x)}, ${Math.round(light.y)})
        </div>
      </div>
    `;
  }

  private updateLightPreview(light: LightSource): void {
    const preview = this.leftPanel.querySelector(`#preview-${light.id}`) as HTMLElement;
    const hueValue = this.leftPanel.querySelector(`#hue-${light.id}`)?.parentElement?.querySelector('.slider-value');
    const brightnessValue = this.leftPanel.querySelector(`#brightness-${light.id}`)?.parentElement?.querySelector('.slider-value');
    const radiusValue = this.leftPanel.querySelector(`#radius-${light.id}`)?.parentElement?.querySelector('.slider-value');
    
    if (preview) {
      preview.style.background = `hsl(${light.hue}, ${DEFAULT_SATURATION}%, ${light.brightness}%)`;
    }
    if (hueValue) hueValue.textContent = `${light.hue}°`;
    if (brightnessValue) brightnessValue.textContent = `${light.brightness}%`;
    if (radiusValue) radiusValue.textContent = `${light.radius}px`;
  }

  private updateSliderPosition(id: number, x: number, y: number): void {
    const posEl = this.leftPanel.querySelector(`#pos-${id}`);
    if (posEl) {
      posEl.textContent = `位置: (${Math.round(x)}, ${Math.round(y)})`;
    }
  }

  private updateSelectedHighlight(): void {
    const items = this.leftPanel.querySelectorAll('.light-item');
    items.forEach(item => {
      const id = Number(item.id.replace('light-item-', ''));
      if (id === this.selectedLightId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  private buildRightPanel(): void {
    this.rightPanel.innerHTML = `
      <h3 class="panel-title">全局参数</h3>
      <div class="slider-group">
        <label>光照衰减指数 <span class="slider-value">${this.config.attenuation}</span></label>
        <input type="range" id="attenuation" min="1" max="5" step="0.1" value="${this.config.attenuation}" class="slider">
      </div>
      <div class="slider-group">
        <label>环境光强度 <span class="slider-value">${this.config.ambientIntensity.toFixed(2)}</span></label>
        <input type="range" id="ambient" min="0" max="0.5" step="0.01" value="${this.config.ambientIntensity}" class="slider">
      </div>
      <div class="slider-group">
        <label>材质粗糙度 <span class="slider-value">${this.config.roughness.toFixed(2)}</span></label>
        <input type="range" id="roughness" min="0" max="1" step="0.01" value="${this.config.roughness}" class="slider">
      </div>
      <div class="slider-group">
        <label>背景色</label>
        <div class="bg-selector">
          <button class="bg-btn ${this.config.backgroundColor === '#2d2d2d' ? 'active' : ''}" data-color="#2d2d2d" style="background: #2d2d2d"></button>
          <button class="bg-btn ${this.config.backgroundColor === '#000000' ? 'active' : ''}" data-color="#000000" style="background: #000000"></button>
        </div>
      </div>
    `;
    
    const attenuationSlider = this.rightPanel.querySelector('#attenuation') as HTMLInputElement;
    const ambientSlider = this.rightPanel.querySelector('#ambient') as HTMLInputElement;
    const roughnessSlider = this.rightPanel.querySelector('#roughness') as HTMLInputElement;
    const bgBtns = this.rightPanel.querySelectorAll('.bg-btn');
    
    attenuationSlider.addEventListener('input', (e) => {
      this.config.attenuation = Number((e.target as HTMLInputElement).value);
      attenuationSlider.parentElement!.querySelector('.slider-value')!.textContent = this.config.attenuation.toString();
      this.requestRender();
    });
    
    ambientSlider.addEventListener('input', (e) => {
      this.config.ambientIntensity = Number((e.target as HTMLInputElement).value);
      ambientSlider.parentElement!.querySelector('.slider-value')!.textContent = this.config.ambientIntensity.toFixed(2);
      this.requestRender();
    });
    
    roughnessSlider.addEventListener('input', (e) => {
      this.config.roughness = Number((e.target as HTMLInputElement).value);
      roughnessSlider.parentElement!.querySelector('.slider-value')!.textContent = this.config.roughness.toFixed(2);
      this.requestRender();
    });
    
    bgBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.config.backgroundColor = (btn as HTMLElement).dataset.color || '#2d2d2d';
        bgBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.requestRender();
      });
    });
  }

  private bindSaveButton(): void {
    this.saveBtn.addEventListener('click', () => {
      this.saveAsPNG();
    });
  }

  private saveAsPNG(): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_SIZE;
    tempCanvas.height = CANVAS_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    render(tempCtx, this.lights, this.config, false);
    
    const link = document.createElement('a');
    link.download = `light-sculpture-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }

  private requestRender(isDragging: boolean = false): void {
    if (this.renderPending) return;
    
    const now = performance.now();
    const timeSinceLastRender = now - this.lastRenderTime;
    
    if (timeSinceLastRender >= this.minRenderInterval) {
      this.performRender(isDragging);
    } else {
      this.renderPending = true;
      setTimeout(() => {
        this.renderPending = false;
        this.performRender(isDragging);
      }, this.minRenderInterval - timeSinceLastRender);
    }
  }

  private performRender(isDragging: boolean): void {
    this.lastRenderTime = performance.now();
    this.canvas.style.background = this.config.backgroundColor;
    render(this.ctx, this.lights, this.config, isDragging || this.isDragging);
    renderLightMarkers(this.ctx, this.lights, this.selectedLightId);
  }
}
