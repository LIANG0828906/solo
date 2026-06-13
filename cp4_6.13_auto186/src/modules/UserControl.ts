import type { VisualizerConfig, ColorScheme } from '../types';
import { DEPTH_LEVELS } from '../types';

export interface UserControlCallbacks {
  onConfigChange: (config: VisualizerConfig) => void;
  onTimeChange: (index: number) => void;
}

export class UserControl {
  private config: VisualizerConfig;
  private callbacks: UserControlCallbacks;
  private layerButtons: HTMLButtonElement[] = [];
  private timePoints: string[] = [];

  private uploadZone: HTMLElement;
  private fileInput: HTMLInputElement;
  private controlPanel: HTMLElement;
  private velocitySlider: HTMLInputElement;
  private velocityValue: HTMLElement;
  private colorSchemeSelect: HTMLSelectElement;
  private autoRotateCheckbox: HTMLInputElement;
  private particlesToggle: HTMLInputElement;
  private layerSwitchesContainer: HTMLElement;
  private timelineContainer: HTMLElement;
  private timelineSlider: HTMLInputElement;
  private timelineValue: HTMLElement;

  onFileUpload: ((file: File) => void) | null = null;

  constructor(callbacks: UserControlCallbacks) {
    this.callbacks = callbacks;
    this.config = {
      visibleLayers: Array(DEPTH_LEVELS.length).fill(true) as boolean[],
      velocityScale: 1,
      colorScheme: 'thermal',
      autoRotate: false,
      showParticles: true,
    };

    this.uploadZone = document.getElementById('upload-zone')!;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.controlPanel = document.getElementById('control-panel')!;
    this.velocitySlider = document.getElementById('velocity-slider') as HTMLInputElement;
    this.velocityValue = document.getElementById('velocity-value')!;
    this.colorSchemeSelect = document.getElementById('color-scheme') as HTMLSelectElement;
    this.autoRotateCheckbox = document.getElementById('auto-rotate') as HTMLInputElement;
    this.particlesToggle = document.getElementById('particles-toggle') as HTMLInputElement;
    this.layerSwitchesContainer = document.getElementById('layer-switches')!;
    this.timelineContainer = document.getElementById('timeline-container')!;
    this.timelineSlider = document.getElementById('timeline-slider') as HTMLInputElement;
    this.timelineValue = document.getElementById('timeline-value')!;

    this.initUploadZone();
    this.initLayerButtons();
    this.initControls();
  }

  private initUploadZone() {
    this.uploadZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        if (this.onFileUpload) {
          this.onFileUpload(file);
        }
      }
    });

    this.uploadZone.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadZone.classList.add('drag-over');
    });

    this.uploadZone.addEventListener('dragleave', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadZone.classList.remove('drag-over');
    });

    this.uploadZone.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadZone.classList.remove('drag-over');

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.csv') || file.type === 'text/csv') {
          if (this.onFileUpload) {
            this.onFileUpload(file);
          }
        }
      }
    });
  }

  private initLayerButtons() {
    this.layerSwitchesContainer.innerHTML = '';
    this.layerButtons = [];

    DEPTH_LEVELS.forEach((depth, idx) => {
      const btn = document.createElement('button');
      btn.className = 'layer-btn active';
      btn.textContent = `${depth}m`;
      btn.dataset.layerIndex = idx.toString();

      btn.addEventListener('click', () => {
        const isActive = btn.classList.toggle('active');
        this.config.visibleLayers[idx] = isActive;
        this.emitConfigChange();
      });

      this.layerButtons.push(btn);
      this.layerSwitchesContainer.appendChild(btn);
    });
  }

  private initControls() {
    this.velocitySlider.addEventListener('input', () => {
      const val = parseFloat(this.velocitySlider.value);
      this.config.velocityScale = val;
      this.velocityValue.textContent = `${val.toFixed(1)}x`;
      this.emitConfigChange();
    });

    this.colorSchemeSelect.addEventListener('change', () => {
      this.config.colorScheme = this.colorSchemeSelect.value as ColorScheme;
      this.emitConfigChange();
    });

    this.autoRotateCheckbox.addEventListener('change', () => {
      this.config.autoRotate = this.autoRotateCheckbox.checked;
      this.emitConfigChange();
    });

    this.particlesToggle.addEventListener('change', () => {
      this.config.showParticles = this.particlesToggle.checked;
      this.emitConfigChange();
    });

    this.timelineSlider.addEventListener('input', () => {
      const idx = parseInt(this.timelineSlider.value, 10);
      this.timelineValue.textContent = this.timePoints[idx] || `T${idx + 1}`;
      this.callbacks.onTimeChange(idx);
    });
  }

  private emitConfigChange() {
    this.callbacks.onConfigChange({ ...this.config });
  }

  showControlPanel() {
    this.controlPanel.classList.remove('hidden');
  }

  setTimeline(timePoints: string[]) {
    this.timePoints = timePoints;
    if (timePoints.length > 1) {
      this.timelineContainer.classList.remove('hidden');
      this.timelineSlider.max = (timePoints.length - 1).toString();
      this.timelineSlider.value = '0';
      this.timelineValue.textContent = timePoints[0] || 'T1';
    } else {
      this.timelineContainer.classList.add('hidden');
    }
  }

  setUploadZoneLoaded(filename: string) {
    const titleEl = this.uploadZone.querySelector('.upload-title');
    const subtitleEl = this.uploadZone.querySelector('.upload-subtitle');
    if (titleEl) titleEl.textContent = filename;
    if (subtitleEl) subtitleEl.textContent = '点击重新上传';
    this.uploadZone.classList.add('loaded');
  }

  dispose() {
    this.layerButtons.forEach(btn => {
      btn.removeEventListener('click', () => {});
    });
  }
}
