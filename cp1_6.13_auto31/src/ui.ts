import { KaleidoParams, MirrorMode, UICallbacks } from './types';

const MIRROR_LABELS: Record<MirrorMode, string> = {
  none: '无镜像',
  horizontal: '左右镜像',
  vertical: '上下镜像',
  quad: '四重镜像'
};

export class UIManager {
  private canvasWrapper: HTMLElement;
  private uploadOverlay: HTMLElement;
  private fileInput: HTMLInputElement;
  private exportBtn: HTMLButtonElement;
  private ringCountSlider: HTMLInputElement;
  private speedSlider: HTMLInputElement;
  private mirrorSelect: HTMLSelectElement;
  private dividerSlider: HTMLInputElement;
  private ringCountValue: HTMLElement;
  private speedValue: HTMLElement;
  private mirrorValue: HTMLElement;
  private dividerValue: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private modalOverlay: HTMLElement;
  private modalClose: HTMLElement;
  private resolutionOptions: HTMLElement;
  private confirmExportBtn: HTMLButtonElement;
  private progressWrap: HTMLElement;
  private progressRing: SVGElement;
  private selectedResolution: number = 512;

  private callbacks: UICallbacks;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;
    this.canvasWrapper = document.getElementById('canvas-wrapper') as HTMLElement;
    this.uploadOverlay = document.getElementById('upload-overlay') as HTMLElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    this.ringCountSlider = document.getElementById('slider-ringCount') as HTMLInputElement;
    this.speedSlider = document.getElementById('slider-rotationSpeedBase') as HTMLInputElement;
    this.mirrorSelect = document.getElementById('select-mirrorMode') as HTMLSelectElement;
    this.dividerSlider = document.getElementById('slider-dividerOpacity') as HTMLInputElement;
    this.ringCountValue = document.getElementById('value-ringCount') as HTMLElement;
    this.speedValue = document.getElementById('value-rotationSpeedBase') as HTMLElement;
    this.mirrorValue = document.getElementById('value-mirrorMode') as HTMLElement;
    this.dividerValue = document.getElementById('value-dividerOpacity') as HTMLElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.modalOverlay = document.getElementById('modal-overlay') as HTMLElement;
    this.modalClose = document.getElementById('modal-close') as HTMLElement;
    this.resolutionOptions = document.getElementById('resolution-options') as HTMLElement;
    this.confirmExportBtn = document.getElementById('confirm-export-btn') as HTMLButtonElement;
    this.progressWrap = document.getElementById('progress-wrap') as HTMLElement;
    this.progressRing = document.getElementById('progress-ring-fg') as SVGElement;

    this.bindEvents();
    this.updateValues({
      ringCount: 8,
      rotationSpeedBase: 2,
      mirrorMode: 'none',
      dividerOpacity: 0.6
    });
  }

  private bindEvents(): void {
    this.uploadOverlay.addEventListener('click', () => this.fileInput.click());
    this.canvasWrapper.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('#export-btn')) return;
      if (this.uploadOverlay.classList.contains('hidden')) return;
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.callbacks.onImageUpload(file);
      this.fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach(evt => {
      this.canvasWrapper.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.uploadOverlay.classList.remove('hidden');
        this.uploadOverlay.classList.add('dragging');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      this.canvasWrapper.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.uploadOverlay.classList.remove('dragging');
      });
    });

    this.canvasWrapper.addEventListener('drop', (e) => {
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) {
        this.callbacks.onImageUpload(file);
      }
    });

    this.ringCountSlider.addEventListener('input', () => {
      const v = parseInt(this.ringCountSlider.value, 10);
      this.callbacks.onParamsChange({ ringCount: v });
    });

    this.speedSlider.addEventListener('input', () => {
      const v = parseFloat(this.speedSlider.value);
      this.callbacks.onParamsChange({ rotationSpeedBase: v });
    });

    this.mirrorSelect.addEventListener('change', () => {
      const v = this.mirrorSelect.value as MirrorMode;
      this.callbacks.onParamsChange({ mirrorMode: v });
      this.triggerMirrorTransition();
    });

    this.dividerSlider.addEventListener('input', () => {
      const v = parseInt(this.dividerSlider.value, 10) / 100;
      this.callbacks.onParamsChange({ dividerOpacity: v });
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onReset();
    });

    this.exportBtn.addEventListener('click', () => {
      this.callbacks.onExportRequest();
      this.openModal();
    });

    this.modalClose.addEventListener('click', () => {
      this.callbacks.onExportCancel();
      this.closeModal();
    });

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.callbacks.onExportCancel();
        this.closeModal();
      }
    });

    this.resolutionOptions.querySelectorAll('.resolution-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.resolutionOptions.querySelectorAll('.resolution-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.selectedResolution = parseInt((opt as HTMLElement).dataset.resolution || '512', 10);
      });
    });

    this.confirmExportBtn.addEventListener('click', () => {
      this.callbacks.onExportConfirm(this.selectedResolution);
    });
  }

  private triggerMirrorTransition(): void {
    this.canvasWrapper.classList.add('mirror-transition');
    setTimeout(() => {
      this.canvasWrapper.classList.remove('mirror-transition');
    }, 500);
  }

  updateValues(params: Partial<KaleidoParams>): void {
    if (params.ringCount !== undefined) {
      this.ringCountSlider.value = String(params.ringCount);
      this.ringCountValue.textContent = String(params.ringCount);
    }
    if (params.rotationSpeedBase !== undefined) {
      this.speedSlider.value = String(params.rotationSpeedBase);
      this.speedValue.textContent = params.rotationSpeedBase.toFixed(1) + 'x';
    }
    if (params.mirrorMode !== undefined) {
      this.mirrorSelect.value = params.mirrorMode;
      this.mirrorValue.textContent = MIRROR_LABELS[params.mirrorMode];
    }
    if (params.dividerOpacity !== undefined) {
      const pct = Math.round(params.dividerOpacity * 100);
      this.dividerSlider.value = String(pct);
      this.dividerValue.textContent = pct + '%';
    }
  }

  hideUploadOverlay(): void {
    this.uploadOverlay.classList.add('hidden');
    this.exportBtn.disabled = false;
  }

  showUploadOverlay(): void {
    this.uploadOverlay.classList.remove('hidden');
    this.exportBtn.disabled = true;
  }

  openModal(): void {
    this.modalOverlay.classList.add('active');
    this.progressWrap.classList.add('hidden');
    this.progressRing.classList.remove('complete');
    this.confirmExportBtn.disabled = false;
    this.confirmExportBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      确认下载 PNG
    `;
  }

  closeModal(): void {
    this.modalOverlay.classList.remove('active');
  }

  startProgress(): void {
    this.progressWrap.classList.remove('hidden');
    this.confirmExportBtn.disabled = true;
    this.confirmExportBtn.textContent = '正在生成...';
    this.setProgress(0);
  }

  setProgress(progress: number): void {
    const circumference = 188.496;
    const offset = circumference * (1 - progress);
    this.progressRing.style.strokeDashoffset = String(offset);
    if (progress >= 1) {
      this.progressRing.classList.add('complete');
    }
  }

  finishProgress(filename: string): void {
    this.confirmExportBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      已下载：${filename}
    `;
    setTimeout(() => {
      this.closeModal();
    }, 1200);
  }
}
