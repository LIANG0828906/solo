import type { Controller } from './controller';
import type { PresetType, SculptParams } from './types';

export class UIManager {
  private controller: Controller;
  private btnRecord: HTMLButtonElement;
  private btnSnapshot: HTMLButtonElement;
  private btnReset: HTMLButtonElement;
  private presetBtns: NodeListOf<HTMLButtonElement>;
  private sliderDisplacement: HTMLInputElement;
  private sliderRotation: HTMLInputElement;
  private sliderTrail: HTMLInputElement;
  private valDisplacement: HTMLElement;
  private valRotation: HTMLElement;
  private valTrail: HTMLElement;
  private overlayDisp: HTMLElement;
  private overlayRot: HTMLElement;
  private overlayTrail: HTMLElement;

  constructor(controller: Controller) {
    this.controller = controller;

    this.btnRecord = document.getElementById('btn-record') as HTMLButtonElement;
    this.btnSnapshot = document.getElementById('btn-snapshot') as HTMLButtonElement;
    this.btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
    this.presetBtns = document.querySelectorAll('.preset-btn') as NodeListOf<HTMLButtonElement>;
    this.sliderDisplacement = document.getElementById('slider-displacement') as HTMLInputElement;
    this.sliderRotation = document.getElementById('slider-rotation') as HTMLInputElement;
    this.sliderTrail = document.getElementById('slider-trail') as HTMLInputElement;
    this.valDisplacement = document.getElementById('val-displacement') as HTMLElement;
    this.valRotation = document.getElementById('val-rotation') as HTMLElement;
    this.valTrail = document.getElementById('val-trail') as HTMLElement;
    this.overlayDisp = document.getElementById('overlay-displacement') as HTMLElement;
    this.overlayRot = document.getElementById('overlay-rotation') as HTMLElement;
    this.overlayTrail = document.getElementById('overlay-trail') as HTMLElement;
  }

  init(): void {
    this.btnRecord.addEventListener('click', () => this.toggleRecording());
    this.btnSnapshot.addEventListener('click', () => this.takeSnapshot());
    this.btnReset.addEventListener('click', () => this.reset());

    this.sliderDisplacement.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.controller.setParameter('maxDisplacement', val);
      this.updateParamDisplay('maxDisplacement', val);
    });

    this.sliderRotation.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.controller.setParameter('rotationSpeed', val);
      this.updateParamDisplay('rotationSpeed', val);
    });

    this.sliderTrail.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      this.controller.setParameter('trailLength', val);
      this.updateParamDisplay('trailLength', val);
    });

    this.presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset as PresetType;
        this.controller.setParameter('preset', preset);
        this.updatePresetActiveState(preset);
      });
    });

    this.updateAllDisplays();
  }

  private updateParamDisplay(name: keyof SculptParams, value: number): void {
    const formatted = value.toFixed(2);
    const formattedInt = value.toString();
    if (name === 'maxDisplacement') {
      this.valDisplacement.textContent = formatted;
      this.overlayDisp.textContent = formatted;
    } else if (name === 'rotationSpeed') {
      this.valRotation.textContent = formatted;
      this.overlayRot.textContent = formatted;
    } else if (name === 'trailLength') {
      this.valTrail.textContent = formattedInt;
      this.overlayTrail.textContent = formattedInt;
    }
  }

  private updateAllDisplays(): void {
    const disp = this.controller.getParameter('maxDisplacement') as number;
    const rot = this.controller.getParameter('rotationSpeed') as number;
    const trail = this.controller.getParameter('trailLength') as number;
    this.updateParamDisplay('maxDisplacement', disp);
    this.updateParamDisplay('rotationSpeed', rot);
    this.updateParamDisplay('trailLength', trail);
    const preset = this.controller.getParameter('preset') as PresetType;
    this.updatePresetActiveState(preset);
  }

  private updatePresetActiveState(preset: PresetType): void {
    this.presetBtns.forEach((btn) => {
      if (btn.dataset.preset === preset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private async toggleRecording(): Promise<void> {
    if (this.controller.isRecording()) {
      this.controller.stopRecording();
      this.btnRecord.textContent = '开始录音';
      this.btnRecord.classList.remove('recording');
    } else {
      this.btnRecord.classList.add('loading');
      this.btnRecord.disabled = true;
      try {
        await this.controller.startRecording();
        if (this.controller.isRecording()) {
          this.btnRecord.textContent = '停止录音';
          this.btnRecord.classList.add('recording');
        }
      } catch (e) {
        console.warn('Failed to start recording:', e);
      }
      this.btnRecord.classList.remove('loading');
      this.btnRecord.disabled = false;
    }
  }

  private takeSnapshot(): void {
    if (this.btnSnapshot.classList.contains('loading')) return;

    this.btnSnapshot.classList.add('loading');
    this.btnSnapshot.disabled = true;

    const clearLoading = () => {
      this.btnSnapshot.classList.remove('loading');
      this.btnSnapshot.disabled = false;
    };

    try {
      this.controller.takeSnapshot(clearLoading);
    } catch (e) {
      console.warn('Snapshot failed:', e);
      clearLoading();
    }
  }

  private async reset(): Promise<void> {
    if (this.btnReset.classList.contains('loading')) return;

    this.btnReset.classList.add('loading');
    this.btnReset.disabled = true;

    try {
      await this.controller.reset();
      this.sliderDisplacement.value = '2.0';
      this.sliderRotation.value = '0.5';
      this.sliderTrail.value = '30';
      this.controller.setParameter('preset', 'crystal');
      this.updateAllDisplays();
    } catch (e) {
      console.warn('Reset failed:', e);
    }

    this.btnReset.classList.remove('loading');
    this.btnReset.disabled = false;
  }
}
