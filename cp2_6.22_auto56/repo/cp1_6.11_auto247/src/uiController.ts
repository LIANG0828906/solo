import { ModelManager, StepId } from './modelManager.js';
import { ParticleSystem } from './particleSystem.js';

export class UIController {
  private _modelManager: ModelManager;
  private _particleSystem: ParticleSystem;

  private _stepButtons: Map<StepId, HTMLButtonElement> = new Map();
  private _progressBar: HTMLElement | null = null;
  private _pouringControl: HTMLElement | null = null;
  private _angleSlider: HTMLInputElement | null = null;
  private _angleValue: HTMLElement | null = null;
  private _hintText: HTMLElement | null = null;
  private _goldenFlash: HTMLElement | null = null;

  private _sliderActive: boolean = false;

  private static readonly _stepOrder: StepId[] = [
    'wax_model',
    'clay_shell',
    'dewaxing',
    'pouring',
    'cooling',
    'polishing'
  ];

  private static readonly _stepHints: Record<StepId, string> = {
    wax_model: '正在塑造蜡模，细心勾勒鼎的形制与纹饰……',
    clay_shell: '层层敷泥包裹蜡模，阴干后形成坚固的外范……',
    dewaxing: '高温烘烤，蜡模融化成蒸汽缓缓逸出，留下空范……',
    pouring: '请拖动右侧滑块调整浇包倾角，将铜液平稳注入型腔',
    cooling: '铜液在范中缓缓冷却，静待合金凝固成形……',
    polishing: '敲碎外范，磨砺鼎身，千年宝鼎终将重见天日……'
  };

  constructor(modelManager: ModelManager, particleSystem: ParticleSystem) {
    this._modelManager = modelManager;
    this._particleSystem = particleSystem;
  }

  public init(): void {
    this._queryDom();
    this._bindStepButtons();
    this._bindSlider();
  }

  public attachUpdate(sceneManager: { onUpdate: (cb: (dt: number) => void) => void }): void {
    sceneManager.onUpdate((dt) => this._particleSystem.update(dt));
  }

  private _queryDom(): void {
    document.querySelectorAll<HTMLButtonElement>('.step-btn').forEach((btn) => {
      const step = btn.dataset.step as StepId;
      if (step) this._stepButtons.set(step, btn);
    });
    this._progressBar = document.getElementById('progress-bar');
    this._pouringControl = document.getElementById('pouring-control');
    this._angleSlider = document.getElementById('angle-slider') as HTMLInputElement | null;
    this._angleValue = document.getElementById('angle-value');
    this._hintText = document.getElementById('hint-text');
    this._goldenFlash = document.getElementById('golden-flash');
  }

  private _bindStepButtons(): void {
    this._stepButtons.forEach((btn, step) => {
      btn.addEventListener('click', () => this._onStepClick(step));
    });
  }

  private _bindSlider(): void {
    if (!this._angleSlider) return;
    this._angleSlider.addEventListener('pointerdown', () => {
      this._sliderActive = true;
    });
    this._angleSlider.addEventListener('pointermove', () => {
      if (!this._sliderActive) return;
      this._updateAngleFromSlider();
    });
    this._angleSlider.addEventListener('pointerup', () => {
      this._sliderActive = false;
    });
    this._angleSlider.addEventListener('pointerleave', () => {
      if (this._sliderActive) {
        this._sliderActive = false;
      }
    });
    this._angleSlider.addEventListener('input', () => {
      if (this._modelManager.activeStep === 'pouring') {
        this._updateAngleFromSlider();
      }
    });
  }

  private _updateAngleFromSlider(): void {
    if (!this._angleSlider) return;
    const v = Number(this._angleSlider.value);
    this._modelManager.setPourAngle(v);
    if (this._angleValue) {
      this._angleValue.textContent = `${Math.round(v)}°`;
    }
  }

  private _onStepClick(step: StepId): void {
    if (!this._modelManager.canStartStep(step)) return;

    this._setActiveButton(step);
    this._showHint(UIController._stepHints[step]);

    if (step === 'pouring') {
      this._showPouringControl(true);
      if (this._angleSlider) {
        this._angleSlider.value = '0';
      }
      this._modelManager.setPourAngle(0);
      if (this._angleValue) this._angleValue.textContent = '0°';
    }

    this._modelManager.startStep(step, {
      onProgress: () => {},
      onComplete: () => this._onStepComplete(step)
    });
  }

  private _onStepComplete(step: StepId): void {
    const idx = UIController._stepOrder.indexOf(step);
    const progress = ((idx + 1) / UIController._stepOrder.length) * 100;
    if (this._progressBar) {
      this._progressBar.style.width = `${progress}%`;
    }

    const btn = this._stepButtons.get(step);
    if (btn) btn.classList.remove('active');

    const nextIdx = idx + 1;
    if (nextIdx < UIController._stepOrder.length) {
      const nextStep = UIController._stepOrder[nextIdx];
      const nextBtn = this._stepButtons.get(nextStep);
      if (nextBtn) nextBtn.disabled = false;
    }

    if (step === 'pouring') {
      this._showPouringControl(false);
    }

    if (step === 'polishing') {
      this._triggerGoldenFlash();
      this._showHint('青铜鼎铸造完成！—— 失蜡铸鼎，千年技艺');
    } else {
      this._showHint(`步骤完成：${this._getStepLabel(step)}，请继续下一步`);
    }
  }

  private _getStepLabel(step: StepId): string {
    const labels: Record<StepId, string> = {
      wax_model: '制蜡模',
      clay_shell: '裹泥壳',
      dewaxing: '烤脱蜡',
      pouring: '浇铜液',
      cooling: '待冷却',
      polishing: '磨成鼎'
    };
    return labels[step];
  }

  private _setActiveButton(step: StepId): void {
    this._stepButtons.forEach((b) => b.classList.remove('active'));
    const btn = this._stepButtons.get(step);
    if (btn) btn.classList.add('active');
  }

  private _showPouringControl(visible: boolean): void {
    if (!this._pouringControl) return;
    if (visible) {
      this._pouringControl.classList.add('visible');
    } else {
      this._pouringControl.classList.remove('visible');
    }
  }

  private _showHint(text: string): void {
    if (!this._hintText) return;
    this._hintText.style.opacity = '0';
    setTimeout(() => {
      if (this._hintText) {
        this._hintText.textContent = text;
        this._hintText.style.opacity = '1';
      }
    }, 200);
  }

  private _triggerGoldenFlash(): void {
    if (!this._goldenFlash) return;
    this._goldenFlash.classList.remove('flash');
    void this._goldenFlash.offsetWidth;
    this._goldenFlash.classList.add('flash');
  }
}
