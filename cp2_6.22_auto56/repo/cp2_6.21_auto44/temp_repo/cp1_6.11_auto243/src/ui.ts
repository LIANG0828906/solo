import { PapermakingProcess, PapermakingStep, ProcessParams, PaperQuality } from './papermaking';

type ParamChangeCb = (params: ProcessParams) => void;
type StepClickCb = (step: PapermakingStep) => void;
type StartClickCb = () => void;
type ScreenshotCb = () => void;

interface DOMRefs {
  scoreValue: HTMLElement;
  scoreDetail: HTMLElement;
  fpsMonitor: HTMLElement;
  screenshotBtn: HTMLButtonElement;
  statusBar: HTMLElement;
  stepName: HTMLElement;
  progressBar: HTMLElement;
  startBtn: HTMLButtonElement;
  transitionOverlay: HTMLElement;
  soakingSlider: HTMLElement;
  pulpingSlider: HTMLElement;
  pressingSlider: HTMLElement;
  soakingInput: HTMLInputElement;
  pulpingInput: HTMLInputElement;
  pressingInput: HTMLInputElement;
  soakingVal: HTMLElement;
  pulpingVal: HTMLElement;
  pressingVal: HTMLElement;
}

export class UIController {
  private dom: DOMRefs;
  private process: PapermakingProcess | null = null;

  private paramChangeCb: ParamChangeCb | null = null;
  private stepClickCb: StepClickCb | null = null;
  private startClickCb: StartClickCb | null = null;
  private screenshotCb: ScreenshotCb | null = null;

  private params: ProcessParams = {
    soakingDuration: 5,
    pulpingCount: 9,
    pressingForce: 5,
  };

  private transitionTimer: number | null = null;

  constructor() {
    this.dom = this.collectDOM();
    this.bindEvents();
    this.updateSliderAvailability(PapermakingStep.SOAKING);
  }

  private collectDOM(): DOMRefs {
    const $ = (id: string) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`DOM not found: #${id}`);
      return el;
    };
    return {
      scoreValue: $('score-value'),
      scoreDetail: $('score-detail'),
      fpsMonitor: $('fps-monitor'),
      screenshotBtn: $('screenshot-btn') as HTMLButtonElement,
      statusBar: $('step-status-bar'),
      stepName: $('current-step-name'),
      progressBar: $('progress-bar'),
      startBtn: $('start-btn') as HTMLButtonElement,
      transitionOverlay: $('transition-overlay'),
      soakingSlider: $('slider-soaking'),
      pulpingSlider: $('slider-pulping'),
      pressingSlider: $('slider-pressing'),
      soakingInput: $('input-soaking') as HTMLInputElement,
      pulpingInput: $('input-pulping') as HTMLInputElement,
      pressingInput: $('input-pressing') as HTMLInputElement,
      soakingVal: $('val-soaking'),
      pulpingVal: $('val-pulping'),
      pressingVal: $('val-pressing'),
    };
  }

  private bindEvents(): void {
    const { soakingInput, pulpingInput, pressingInput } = this.dom;

    soakingInput.addEventListener('input', () => {
      const v = parseInt(soakingInput.value, 10);
      this.params.soakingDuration = v;
      this.dom.soakingVal.textContent = String(v);
      this.emitParams();
    });

    pulpingInput.addEventListener('input', () => {
      const v = parseInt(pulpingInput.value, 10);
      this.params.pulpingCount = v;
      this.dom.pulpingVal.textContent = String(v);
      this.emitParams();
    });

    pressingInput.addEventListener('input', () => {
      const v = parseInt(pressingInput.value, 10);
      this.params.pressingForce = v;
      this.dom.pressingVal.textContent = String(v);
      this.emitParams();
    });

    this.dom.statusBar.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.stamp') as HTMLElement | null;
      if (!target) return;
      const step = parseInt(target.dataset.step || '0', 10) as PapermakingStep;
      if (this.stepClickCb) this.stepClickCb(step);
    });

    this.dom.startBtn.addEventListener('click', () => {
      if (this.startClickCb) this.startClickCb();
    });

    this.dom.screenshotBtn.addEventListener('click', () => {
      if (this.screenshotCb) this.screenshotCb();
    });
  }

  private emitParams(): void {
    if (this.paramChangeCb) this.paramChangeCb({ ...this.params });
  }

  bindProcess(process: PapermakingProcess): void {
    this.process = process;
  }

  onParamChange(cb: ParamChangeCb): void {
    this.paramChangeCb = cb;
    this.emitParams();
  }

  onStepClick(cb: StepClickCb): void {
    this.stepClickCb = cb;
  }

  onStartClick(cb: StartClickCb): void {
    this.startClickCb = cb;
  }

  onScreenshot(cb: ScreenshotCb): void {
    this.screenshotCb = cb;
  }

  getParams(): ProcessParams {
    return { ...this.params };
  }

  updateFPS(fps: number): void {
    this.dom.fpsMonitor.textContent = `FPS: ${fps.toFixed(0)}`;
    this.dom.fpsMonitor.style.color = fps < 50 ? '#D32F2F' : '#5a7a1c';
  }

  updateQuality(q: PaperQuality): void {
    this.dom.scoreValue.textContent = q.totalScore >= 0 ? String(q.totalScore) : '--';
    const ratio = Math.max(0, Math.min(1, q.totalScore / 100));
    const good = { r: 76, g: 175, b: 80 };
    const bad = { r: 255, g: 87, b: 34 };
    const r = Math.round(bad.r + (good.r - bad.r) * ratio);
    const g = Math.round(bad.g + (good.g - bad.g) * ratio);
    const b = Math.round(bad.b + (good.b - bad.b) * ratio);
    this.dom.scoreValue.style.color = `rgb(${r}, ${g}, ${b})`;

    const parts: string[] = [];
    if (q.softness > 0) parts.push(`软化 ${q.softness}`);
    if (q.uniformity > 0) parts.push(`匀度 ${q.uniformity}`);
    if (q.smoothness > 0) parts.push(`平滑 ${q.smoothness}`);
    if (q.thickness > 0) parts.push(`厚度 ${q.thickness}`);
    this.dom.scoreDetail.textContent = parts.length ? parts.join(' · ') : '等待开始…';
  }

  updateStepState(current: PapermakingStep, completed: PapermakingStep[]): void {
    this.dom.stepName.textContent = PapermakingProcess.getStepName(current);

    const stamps = this.dom.statusBar.querySelectorAll('.stamp');
    stamps.forEach(el => {
      const step = parseInt((el as HTMLElement).dataset.step || '0', 10) as PapermakingStep;
      el.classList.remove('current', 'completed');
      if (step === current) el.classList.add('current');
      else if (completed.includes(step)) el.classList.add('completed');
    });

    this.updateSliderAvailability(current);
    this.updateStartButtonState(false);
  }

  private updateSliderAvailability(current: PapermakingStep): void {
    const { soakingSlider, pulpingSlider, pressingSlider } = this.dom;
    const enable = (el: HTMLElement, enable: boolean) => {
      if (enable) { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
      else { el.style.opacity = '0.4'; el.style.pointerEvents = 'none'; }
    };
    enable(soakingSlider, current === PapermakingStep.SOAKING);
    enable(pulpingSlider, current === PapermakingStep.PULPING);
    enable(pressingSlider, current === PapermakingStep.PRESSING);
  }

  updateStartButtonState(running: boolean): void {
    if (running) {
      this.dom.startBtn.disabled = true;
      this.dom.startBtn.textContent = '进行中…';
    } else {
      this.dom.startBtn.disabled = false;
      this.dom.startBtn.textContent = '开始';
    }
  }

  updateProgress(progress: number): void {
    this.dom.progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
  }

  runTransition(onMiddle: () => void): void {
    if (this.transitionTimer !== null) window.clearTimeout(this.transitionTimer);
    const overlay = this.dom.transitionOverlay;
    overlay.classList.add('active');
    this.transitionTimer = window.setTimeout(() => {
      onMiddle();
      window.setTimeout(() => {
        overlay.classList.remove('active');
        this.transitionTimer = null;
      }, 800);
    }, 800);
  }

  showTemporaryMsg(text: string, durationMs = 1500): void {
    const div = document.createElement('div');
    div.textContent = text;
    Object.assign(div.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(198, 40, 40, 0.9)',
      color: '#F5F0E1',
      padding: '14px 28px',
      borderRadius: '10px',
      fontFamily: "'ZCOOL XiaoWei', serif",
      fontSize: '18px',
      letterSpacing: '3px',
      zIndex: '200',
      pointerEvents: 'none',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      opacity: '0',
      transition: 'opacity 0.3s ease',
    });
    document.getElementById('app')?.appendChild(div);
    requestAnimationFrame(() => { div.style.opacity = '1'; });
    window.setTimeout(() => {
      div.style.opacity = '0';
      window.setTimeout(() => div.remove(), 300);
    }, durationMs);
  }
}
