import { WindParams } from './sceneBuilder';

export interface InteractionCallbacks {
  onWindChange: (params: WindParams) => void;
  onReset: () => void;
  onLightToggle: (enabled: boolean) => void;
  onImageUpload: (file: File) => void;
}

export class InteractionHandler {
  private callbacks: InteractionCallbacks;
  
  private windDirection: { x: number; z: number } = { x: 1, z: 0 };
  private windStrength: number = 3;
  
  private isDraggingWindDisc: boolean = false;
  private isPanelCollapsed: boolean = false;
  
  private controlPanel: HTMLElement;
  private panelToggle: HTMLElement;
  private windDisc: HTMLElement;
  private windArrow: HTMLElement;
  private windSlider: HTMLInputElement;
  private windValue: HTMLElement;
  private lightToggle: HTMLElement;
  private resetButton: HTMLElement;
  private uploadArea: HTMLElement;
  private fileInput: HTMLInputElement;
  private colorPalette: HTMLElement;
  private imagePreview: HTMLElement;

  constructor(callbacks: InteractionCallbacks) {
    this.callbacks = callbacks;
    
    this.controlPanel = document.getElementById('control-panel')!;
    this.panelToggle = document.getElementById('panel-toggle')!;
    this.windDisc = document.getElementById('wind-disc')!;
    this.windArrow = document.getElementById('wind-arrow')!;
    this.windSlider = document.getElementById('wind-slider')! as HTMLInputElement;
    this.windValue = document.getElementById('wind-value')!;
    this.lightToggle = document.getElementById('light-toggle')!;
    this.resetButton = document.getElementById('reset-button')!;
    this.uploadArea = document.getElementById('upload-area')!;
    this.fileInput = document.getElementById('file-input')! as HTMLInputElement;
    this.colorPalette = document.getElementById('color-palette')!;
    this.imagePreview = document.getElementById('image-preview')!;
    
    this.setupEventListeners();
    this.updateWindArrow();
  }

  private setupEventListeners(): void {
    this.panelToggle.addEventListener('click', this.togglePanel.bind(this));
    
    this.windDisc.addEventListener('mousedown', this.onWindDiscMouseDown.bind(this));
    document.addEventListener('mousemove', this.onWindDiscMouseMove.bind(this));
    document.addEventListener('mouseup', this.onWindDiscMouseUp.bind(this));
    
    this.windDisc.addEventListener('touchstart', this.onWindDiscTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onWindDiscTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onWindDiscTouchEnd.bind(this));
    
    this.windSlider.addEventListener('input', this.onWindSliderChange.bind(this));
    
    this.lightToggle.addEventListener('click', this.onLightToggleClick.bind(this));
    
    this.resetButton.addEventListener('click', this.onResetClick.bind(this));
    
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', this.onFileSelected.bind(this));
    
    this.uploadArea.addEventListener('dragover', this.onDragOver.bind(this));
    this.uploadArea.addEventListener('dragleave', this.onDragLeave.bind(this));
    this.uploadArea.addEventListener('drop', this.onDrop.bind(this));
  }

  private togglePanel(): void {
    this.isPanelCollapsed = !this.isPanelCollapsed;
    
    if (this.isPanelCollapsed) {
      this.controlPanel.classList.add('collapsed');
      this.panelToggle.textContent = '›';
      this.panelToggle.title = '展开面板';
    } else {
      this.controlPanel.classList.remove('collapsed');
      this.panelToggle.textContent = '‹';
      this.panelToggle.title = '收起面板';
    }
  }

  private onWindDiscMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this.isDraggingWindDisc = true;
    this.updateWindDirection(e.clientX, e.clientY);
  }

  private onWindDiscMouseMove(e: MouseEvent): void {
    if (!this.isDraggingWindDisc) return;
    this.updateWindDirection(e.clientX, e.clientY);
  }

  private onWindDiscMouseUp(): void {
    this.isDraggingWindDisc = false;
  }

  private onWindDiscTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      this.isDraggingWindDisc = true;
      this.updateWindDirection(e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  private onWindDiscTouchMove(e: TouchEvent): void {
    if (!this.isDraggingWindDisc || e.touches.length === 0) return;
    e.preventDefault();
    this.updateWindDirection(e.touches[0].clientX, e.touches[0].clientY);
  }

  private onWindDiscTouchEnd(): void {
    this.isDraggingWindDisc = false;
  }

  private updateWindDirection(clientX: number, clientY: number): void {
    const rect = this.windDisc.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 5) return;
    
    const normalizedX = dx / distance;
    const normalizedZ = dy / distance;
    
    this.windDirection = { x: normalizedX, z: normalizedZ };
    this.updateWindArrow();
    this.notifyWindChange();
  }

  private updateWindArrow(): void {
    const angle = Math.atan2(this.windDirection.z, this.windDirection.x) * (180 / Math.PI);
    this.windArrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  }

  private onWindSliderChange(): void {
    this.windStrength = parseFloat(this.windSlider.value);
    this.windValue.textContent = this.windStrength.toFixed(1);
    this.notifyWindChange();
  }

  private notifyWindChange(): void {
    this.callbacks.onWindChange({
      direction: { ...this.windDirection },
      strength: this.windStrength
    });
  }

  private onLightToggleClick(): void {
    const isActive = this.lightToggle.classList.contains('active');
    const newState = !isActive;
    
    if (newState) {
      this.lightToggle.classList.add('active');
    } else {
      this.lightToggle.classList.remove('active');
    }
    
    this.callbacks.onLightToggle(newState);
  }

  private onResetClick(): void {
    this.callbacks.onReset();
  }

  private onFileSelected(e: Event): void {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
    }
  }

  private onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.uploadArea.classList.add('drag-over');
  }

  private onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.uploadArea.classList.remove('drag-over');
  }

  private onDrop(e: DragEvent): void {
    e.preventDefault();
    this.uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFile(e.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      alert('请上传 JPEG 或 PNG 格式的图片');
      return;
    }
    
    this.showImagePreview(file);
    this.callbacks.onImageUpload(file);
  }

  private showImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target?.result as string;
      img.className = 'preview-img';
      this.imagePreview.innerHTML = '';
      this.imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  public updateColorPalette(colors: string[]): void {
    this.colorPalette.innerHTML = '';
    
    for (const color of colors) {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.title = color;
      this.colorPalette.appendChild(swatch);
    }
  }

  public getWindParams(): WindParams {
    return {
      direction: { ...this.windDirection },
      strength: this.windStrength
    };
  }

  public dispose(): void {
    this.panelToggle.removeEventListener('click', this.togglePanel.bind(this));
    
    this.windDisc.removeEventListener('mousedown', this.onWindDiscMouseDown.bind(this));
    document.removeEventListener('mousemove', this.onWindDiscMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onWindDiscMouseUp.bind(this));
    
    this.windDisc.removeEventListener('touchstart', this.onWindDiscTouchStart.bind(this));
    document.removeEventListener('touchmove', this.onWindDiscTouchMove.bind(this));
    document.removeEventListener('touchend', this.onWindDiscTouchEnd.bind(this));
    
    this.windSlider.removeEventListener('input', this.onWindSliderChange.bind(this));
    
    this.lightToggle.removeEventListener('click', this.onLightToggleClick.bind(this));
    
    this.resetButton.removeEventListener('click', this.onResetClick.bind(this));
    
    this.fileInput.removeEventListener('change', this.onFileSelected.bind(this));
    
    this.uploadArea.removeEventListener('dragover', this.onDragOver.bind(this));
    this.uploadArea.removeEventListener('dragleave', this.onDragLeave.bind(this));
    this.uploadArea.removeEventListener('drop', this.onDrop.bind(this));
  }
}
