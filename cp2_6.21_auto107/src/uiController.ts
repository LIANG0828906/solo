import { SimParams, CollisionEvent, ParamChangeCallback, CollisionLogCallback } from './types';

export class UIController {
  private gravitySlider: HTMLInputElement;
  private speedSlider: HTMLInputElement;
  private elasticitySlider: HTMLInputElement;
  private gravityValue: HTMLElement;
  private speedValue: HTMLElement;
  private elasticityValue: HTMLElement;
  private eventLogContainer: HTMLElement;
  private fpsElement: HTMLElement;

  private onParamChange: ParamChangeCallback | null;
  private onCollisionLog: CollisionLogCallback | null;
  private maxLogEntries: number;

  constructor() {
    this.gravitySlider = document.getElementById('gravity') as HTMLInputElement;
    this.speedSlider = document.getElementById('speed') as HTMLInputElement;
    this.elasticitySlider = document.getElementById('elasticity') as HTMLInputElement;
    this.gravityValue = document.getElementById('gravity-value')!;
    this.speedValue = document.getElementById('speed-value')!;
    this.elasticityValue = document.getElementById('elasticity-value')!;
    this.eventLogContainer = document.getElementById('event-log')!;
    this.fpsElement = document.getElementById('fps')!;
    this.onParamChange = null;
    this.onCollisionLog = null;
    this.maxLogEntries = 50;

    this.bindSliders();
  }

  private bindSliders(): void {
    this.gravitySlider.addEventListener('input', () => {
      const val = parseFloat(this.gravitySlider.value);
      this.gravityValue.textContent = val.toFixed(1);
      this.emitParams();
    });

    this.speedSlider.addEventListener('input', () => {
      const val = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = val.toFixed(1) + 'x';
      this.emitParams();
    });

    this.elasticitySlider.addEventListener('input', () => {
      const val = parseFloat(this.elasticitySlider.value);
      this.elasticityValue.textContent = val.toFixed(2);
      this.emitParams();
    });
  }

  private emitParams(): void {
    if (!this.onParamChange) return;
    const params: SimParams = {
      gravity: parseFloat(this.gravitySlider.value),
      speedMultiplier: parseFloat(this.speedSlider.value),
      elasticity: parseFloat(this.elasticitySlider.value),
    };
    this.onParamChange(params);
  }

  setParamChangeCallback(cb: ParamChangeCallback): void {
    this.onParamChange = cb;
  }

  setCollisionLogCallback(cb: CollisionLogCallback): void {
    this.onCollisionLog = cb;
  }

  appendCollisionEvents(events: CollisionEvent[]): void {
    const logBody = this.eventLogContainer;
    for (const evt of events) {
      const entry = document.createElement('div');
      entry.className = 'log-entry';

      const time = document.createElement('span');
      time.className = 'timestamp';
      const date = new Date(evt.timestamp);
      time.textContent = `${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;

      const colorA = document.createElement('span');
      colorA.className = 'color-tag';
      colorA.style.backgroundColor = `rgb(${Math.round(evt.colorA.r * 255)},${Math.round(evt.colorA.g * 255)},${Math.round(evt.colorA.b * 255)})`;

      const pidA = document.createElement('span');
      pidA.className = 'pid';
      pidA.textContent = `P${evt.idA}`;

      const sep = document.createElement('span');
      sep.textContent = ' ⟷ ';

      const colorB = document.createElement('span');
      colorB.className = 'color-tag';
      colorB.style.backgroundColor = `rgb(${Math.round(evt.colorB.r * 255)},${Math.round(evt.colorB.g * 255)},${Math.round(evt.colorB.b * 255)})`;

      const pidB = document.createElement('span');
      pidB.className = 'pid';
      pidB.textContent = `P${evt.idB}`;

      entry.appendChild(time);
      entry.appendChild(document.createTextNode(' '));
      entry.appendChild(colorA);
      entry.appendChild(pidA);
      entry.appendChild(sep);
      entry.appendChild(colorB);
      entry.appendChild(pidB);

      logBody.appendChild(entry);

      while (logBody.children.length > this.maxLogEntries + 1) {
        logBody.removeChild(logBody.children[1]);
      }
    }
    logBody.scrollTop = logBody.scrollHeight;
  }

  updateFPS(fps: number): void {
    this.fpsElement.textContent = `${fps} FPS`;
  }
}
