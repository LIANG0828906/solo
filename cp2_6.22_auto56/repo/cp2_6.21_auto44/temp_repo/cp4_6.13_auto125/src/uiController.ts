import { LightSource } from './lightSource';
import { Mirror } from './mirror';
import { Renderer, RendererSettings } from './renderer';
import { RGBColor } from './types';

export class UIController {
  public lights: LightSource[];
  public mirrors: Mirror[];
  public renderer: Renderer;
  public settings: RendererSettings;
  public requestRender: () => void = () => {};

  private colorInfoEl: HTMLElement;
  private colorSwatchEl: HTMLElement;
  private colorValueEl: HTMLElement;
  private lightControlsEl: HTMLElement;
  private opacitySliderEl: HTMLInputElement;
  private opacityValueEl: HTMLElement;
  private showRayPathsEl: HTMLInputElement;
  private addRectBtn: HTMLButtonElement;
  private addTriBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private fpsValueEl: HTMLElement;
  private canvasWrapperEl: HTMLElement;

  private initialLightsSnapshot: string = '';
  private initialMirrorsSnapshot: string = '';

  constructor(
    lights: LightSource[],
    mirrors: Mirror[],
    renderer: Renderer,
    settings: RendererSettings
  ) {
    this.lights = lights;
    this.mirrors = mirrors;
    this.renderer = renderer;
    this.settings = settings;

    this.colorInfoEl = document.getElementById('color-info')!;
    this.colorSwatchEl = document.getElementById('colorSwatch')!;
    this.colorValueEl = document.getElementById('colorValue')!;
    this.lightControlsEl = document.getElementById('lightControls')!;
    this.opacitySliderEl = document.getElementById('mirrorOpacity') as HTMLInputElement;
    this.opacityValueEl = document.getElementById('opacityValue')!;
    this.showRayPathsEl = document.getElementById('showRayPaths') as HTMLInputElement;
    this.addRectBtn = document.getElementById('addRectMirror') as HTMLButtonElement;
    this.addTriBtn = document.getElementById('addTriMirror') as HTMLButtonElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    this.fpsValueEl = document.getElementById('fpsValue')!;
    this.canvasWrapperEl = document.querySelector('.canvas-wrapper')!;

    this.saveInitialState();
    this.buildLightControls();
    this.bindEvents();
    this.updateOpacityDisplay();
  }

  private saveInitialState(): void {
    this.initialLightsSnapshot = JSON.stringify(this.lights.map(l => ({
      x: l.x, y: l.y, angle: l.angle, coneAngle: l.coneAngle,
      color: { ...l.color }, enabled: l.enabled, name: l.name
    })));
    this.initialMirrorsSnapshot = JSON.stringify(this.mirrors.map(m => ({
      x: m.x, y: m.y, width: m.width, height: m.height, angle: m.angle, shape: m.shape
    })));
  }

  buildLightControls(): void {
    this.lightControlsEl.innerHTML = '';
    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      const card = document.createElement('div');
      card.className = 'light-card';
      card.innerHTML = `
        <div class="light-card-header">
          <div class="light-card-title">
            <span class="light-dot" style="background:${light.getCSSColor()}; color:${light.getCSSColor()}"></span>
            <span>${light.name}</span>
          </div>
          <button class="light-toggle ${light.enabled ? 'active' : ''}" data-light-id="${light.id}"></button>
        </div>
        <div class="control-row">
          <label>颜色</label>
          <input type="color" value="${light.getHexColor()}" data-color-id="${light.id}" />
        </div>
        <div class="control-row">
          <label>光束朝向 (°)</label>
          <div class="number-input">
            <input type="number" min="0" max="360" step="1" value="${Math.round(light.angle)}" data-angle-id="${light.id}" />
            <span class="unit">°</span>
          </div>
        </div>
        <div class="control-row">
          <label>锥形角度 (°)</label>
          <div class="slider-row">
            <input type="range" min="5" max="120" step="1" value="${light.coneAngle}" data-cone-id="${light.id}" />
            <span data-cone-val="${light.id}">${Math.round(light.coneAngle)}°</span>
          </div>
        </div>
      `;
      this.lightControlsEl.appendChild(card);
    }
    this.bindLightControlEvents();
  }

  private bindLightControlEvents(): void {
    this.lightControlsEl.querySelectorAll('.light-toggle').forEach(btn => {
      const id = Number((btn as HTMLElement).dataset.lightId);
      (btn as HTMLElement).addEventListener('click', () => {
        const light = this.lights.find(l => l.id === id);
        if (!light) return;
        light.enabled = !light.enabled;
        btn.classList.toggle('active', light.enabled);
        this.requestRender();
      });
    });

    this.lightControlsEl.querySelectorAll('input[type="color"]').forEach(input => {
      const id = Number((input as HTMLInputElement).dataset.colorId);
      (input as HTMLInputElement).addEventListener('input', (e) => {
        const light = this.lights.find(l => l.id === id);
        if (!light) return;
        light.setHexColor((e.target as HTMLInputElement).value);
        const dot = this.lightControlsEl.querySelector(`.light-toggle[data-light-id="${id}"]`)
          ?.closest('.light-card')?.querySelector('.light-dot') as HTMLElement;
        if (dot) {
          dot.style.background = light.getCSSColor();
          dot.style.color = light.getCSSColor();
        }
        this.requestRender();
      });
    });

    this.lightControlsEl.querySelectorAll('input[type="number"][data-angle-id]').forEach(input => {
      const id = Number((input as HTMLInputElement).dataset.angleId);
      (input as HTMLInputElement).addEventListener('input', (e) => {
        const light = this.lights.find(l => l.id === id);
        if (!light) return;
        const v = Number((e.target as HTMLInputElement).value);
        if (!isNaN(v)) {
          light.angle = Math.max(0, Math.min(360, v));
          this.requestRender();
        }
      });
    });

    this.lightControlsEl.querySelectorAll('input[type="range"][data-cone-id]').forEach(input => {
      const id = Number((input as HTMLInputElement).dataset.coneId);
      (input as HTMLInputElement).addEventListener('input', (e) => {
        const light = this.lights.find(l => l.id === id);
        if (!light) return;
        const v = Number((e.target as HTMLInputElement).value);
        light.coneAngle = v;
        const valEl = this.lightControlsEl.querySelector(`span[data-cone-val="${id}"]`);
        if (valEl) valEl.textContent = `${Math.round(v)}°`;
        this.requestRender();
      });
    });
  }

  private bindEvents(): void {
    this.opacitySliderEl.addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      this.settings.mirrorOpacity = v;
      for (const m of this.mirrors) m.opacity = v;
      this.updateOpacityDisplay();
      this.requestRender();
    });

    this.showRayPathsEl.addEventListener('change', (e) => {
      this.settings.showRayPaths = (e.target as HTMLInputElement).checked;
      this.requestRender();
    });

    this.addRectBtn.addEventListener('click', () => {
      const m = new Mirror(400, 300, 120, 14, 0, 'rectangle');
      m.opacity = this.settings.mirrorOpacity;
      this.mirrors.push(m);
      this.requestRender();
    });

    this.addTriBtn.addEventListener('click', () => {
      const m = new Mirror(400, 300, 100, 70, 0, 'triangle');
      m.opacity = this.settings.mirrorOpacity;
      this.mirrors.push(m);
      this.requestRender();
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetScene();
    });
  }

  updateOpacityDisplay(): void {
    this.opacityValueEl.textContent = this.settings.mirrorOpacity.toFixed(2);
  }

  resetScene(): void {
    try {
      const lightData = JSON.parse(this.initialLightsSnapshot) as Array<{
        x: number; y: number; angle: number; coneAngle: number;
        color: RGBColor; enabled: boolean; name: string;
      }>;
      const mirrorData = JSON.parse(this.initialMirrorsSnapshot) as Array<{
        x: number; y: number; width: number; height: number; angle: number; shape: 'rectangle' | 'triangle';
      }>;

      for (let i = 0; i < this.lights.length && i < lightData.length; i++) {
        const d = lightData[i];
        this.lights[i].x = d.x;
        this.lights[i].y = d.y;
        this.lights[i].angle = d.angle;
        this.lights[i].coneAngle = d.coneAngle;
        this.lights[i].color = { ...d.color };
        this.lights[i].enabled = d.enabled;
      }

      this.mirrors.splice(0, this.mirrors.length);
      for (const d of mirrorData) {
        const m = new Mirror(d.x, d.y, d.width, d.height, d.angle, d.shape);
        m.opacity = this.settings.mirrorOpacity;
        this.mirrors.push(m);
      }
      this.buildLightControls();
      this.renderer.selectedObjectId = null;
      this.renderer.hoveredObjectId = null;
      this.requestRender();
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }

  updateColorInfo(screenX: number, screenY: number, canvasX: number, canvasY: number): void {
    const color = this.renderer.sampleColorAt(canvasX, canvasY);
    if (!color) {
      this.colorInfoEl.classList.add('hidden');
      return;
    }
    this.colorInfoEl.classList.remove('hidden');
    const rect = this.canvasWrapperEl.getBoundingClientRect();
    const relX = screenX - rect.left + 16;
    const relY = screenY - rect.top - 40;
    const clampedX = Math.max(4, Math.min(rect.width - this.colorInfoEl.offsetWidth - 4, relX));
    const clampedY = Math.max(4, Math.min(rect.height - this.colorInfoEl.offsetHeight - 4, Math.max(4, relY)));
    this.colorInfoEl.style.left = `${clampedX}px`;
    this.colorInfoEl.style.top = `${clampedY}px`;

    const css = `rgb(${color.r},${color.g},${color.b})`;
    this.colorSwatchEl.style.background = css;
    (this.colorSwatchEl as HTMLElement).style.color = css;
    this.colorValueEl.textContent = `RGB(${color.r},${color.g},${color.b})`;
  }

  hideColorInfo(): void {
    this.colorInfoEl.classList.add('hidden');
  }

  updateFPS(fps: number): void {
    this.fpsValueEl.textContent = Math.round(fps).toString();
    this.fpsValueEl.classList.remove('low', 'warn');
    if (fps < 20) this.fpsValueEl.classList.add('low');
    else if (fps < 30) this.fpsValueEl.classList.add('warn');
  }
}
