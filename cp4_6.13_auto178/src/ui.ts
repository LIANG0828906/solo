export interface UIConfig {
  sensitivity: number;
  particleCount: number;
}

export interface UICallbacks {
  onSensitivityChange: (value: number) => void;
  onParticleCountChange: (value: number) => void;
  onReset: () => void;
}

export class UIController {
  private sensitivitySlider: HTMLInputElement;
  private sensitivityValue: HTMLSpanElement;
  private particleSlider: HTMLInputElement;
  private particleValue: HTMLSpanElement;
  private resetButton: HTMLButtonElement;
  private panel: HTMLDivElement;
  private dragHandle: HTMLDivElement;
  private permissionPrompt: HTMLDivElement;
  private permissionBtn: HTMLButtonElement;
  private fpsCounter: HTMLDivElement;
  private callbacks: UICallbacks;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private frameCount = 0;
  private lastFpsTime = 0;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.sensitivitySlider = document.getElementById('sensitivity-slider') as HTMLInputElement;
    this.sensitivityValue = document.getElementById('sensitivity-value') as HTMLSpanElement;
    this.particleSlider = document.getElementById('particle-slider') as HTMLInputElement;
    this.particleValue = document.getElementById('particle-value') as HTMLSpanElement;
    this.resetButton = document.getElementById('reset-btn') as HTMLButtonElement;
    this.panel = document.getElementById('control-panel') as HTMLDivElement;
    this.dragHandle = document.getElementById('panel-drag-handle') as HTMLDivElement;
    this.permissionPrompt = document.getElementById('permission-prompt') as HTMLDivElement;
    this.permissionBtn = document.getElementById('permission-btn') as HTMLButtonElement;
    this.fpsCounter = document.getElementById('fps-counter') as HTMLDivElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.sensitivitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.sensitivityValue.textContent = value.toFixed(2);
      this.callbacks.onSensitivityChange(value);
    });

    this.particleSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.particleValue.textContent = value.toString();
      this.callbacks.onParticleCountChange(value);
    });

    this.resetButton.addEventListener('click', () => {
      this.callbacks.onReset();
    });

    this.dragHandle.addEventListener('mousedown', (e) => {
      this.startDrag(e);
    });

    this.dragHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.startDrag({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      this.onDrag(e);
    });

    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      this.onDrag({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }, { passive: true });

    document.addEventListener('mouseup', () => {
      this.endDrag();
    });

    document.addEventListener('touchend', () => {
      this.endDrag();
    });
  }

  private startDrag(e: MouseEvent): void {
    this.isDragging = true;
    this.panel.classList.add('dragging');

    const rect = this.panel.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;
  }

  private onDrag(e: MouseEvent): void {
    if (!this.isDragging) return;

    let newX = e.clientX - this.dragOffsetX;
    let newY = e.clientY - this.dragOffsetY;

    newX = Math.max(0, Math.min(window.innerWidth - this.panel.offsetWidth, newX));
    newY = Math.max(0, Math.min(window.innerHeight - this.panel.offsetHeight, newY));

    this.panel.style.left = `${newX}px`;
    this.panel.style.top = `${newY}px`;
    this.panel.style.right = 'auto';
    this.panel.style.bottom = 'auto';
  }

  private endDrag(): void {
    this.isDragging = false;
    this.panel.classList.remove('dragging');
  }

  public showPermissionPrompt(): void {
    this.permissionPrompt.style.display = 'block';
  }

  public hidePermissionPrompt(): void {
    this.permissionPrompt.style.display = 'none';
  }

  public onPermissionRequest(callback: () => void): void {
    this.permissionBtn.addEventListener('click', callback);
  }

  public updateFps(currentTime: number): void {
    this.frameCount++;
    if (currentTime - this.lastFpsTime >= 1000) {
      this.fpsCounter.textContent = `FPS: ${this.frameCount}`;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }
  }

  public getConfig(): UIConfig {
    return {
      sensitivity: parseFloat(this.sensitivitySlider.value),
      particleCount: parseInt(this.particleSlider.value)
    };
  }
}
