import type { EngineContext } from './particleEngine';
import { parseTextToParticles, setTargetColor, startDispersing } from './particleEngine';
import type { CanvasDimensions, AppState } from './types';
import type { RendererHandle } from './particleRenderer';

export interface DomHandle {
  bind: (root: HTMLElement) => void;
  getCanvasRef: () => HTMLCanvasElement | null;
  getDimensions: () => CanvasDimensions;
  onResize: () => void;
  setGeneratorDisabled: (d: boolean) => void;
  setDisperserDisabled: (d: boolean) => void;
  setFps: (fps: number) => void;
  getInputText: () => string;
  getColorHex: () => string;
  addStateListener: (cb: (s: AppState) => void) => () => void;
  notifyState: (s: AppState) => void;
}

export function createDomController(
  engineCtx: EngineContext,
  renderer: RendererHandle
): DomHandle {
  let canvasEl: HTMLCanvasElement | null = null;
  let inputEl: HTMLInputElement | null = null;
  let generateBtn: HTMLButtonElement | null = null;
  let disperseBtn: HTMLButtonElement | null = null;
  let colorInput: HTMLInputElement | null = null;
  let fpsDisplay: HTMLElement | null = null;
  let charCountEl: HTMLElement | null = null;
  const canvasWrapRef = { current: null as HTMLElement | null };
  const stateListeners: Array<(s: AppState) => void> = [];

  function addStateListener(cb: (s: AppState) => void): () => void {
    stateListeners.push(cb);
    return () => {
      const i = stateListeners.indexOf(cb);
      if (i >= 0) stateListeners.splice(i, 1);
    };
  }

  function notifyState(s: AppState): void {
    for (const cb of stateListeners) cb(s);
  }

  function getDimensions(): CanvasDimensions {
    const wrap = canvasWrapRef.current;
    if (!wrap) return { width: 800, height: 480, dpr: 1 };
    const w = wrap.clientWidth;
    const isMobile = window.innerWidth < 768;
    const ratio = isMobile ? 0.75 : 0.6;
    const h = Math.max(320, Math.floor(w * ratio));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    return { width: w, height: h, dpr };
  }

  function onResize(): void {
    const dims = getDimensions();
    renderer.updateDimensions(dims);
  }

  function setGeneratorDisabled(d: boolean): void {
    if (generateBtn) generateBtn.disabled = d;
  }

  function setDisperserDisabled(d: boolean): void {
    if (disperseBtn) disperseBtn.disabled = d;
  }

  function setFps(fps: number): void {
    if (fpsDisplay) fpsDisplay.textContent = `FPS: ${fps}`;
  }

  function getInputText(): string {
    return inputEl ? inputEl.value.trim() : '';
  }

  function getColorHex(): string {
    return colorInput ? colorInput.value : '#FFD700';
  }

  function handleGenerate(): void {
    const text = getInputText();
    if (!text) {
      if (inputEl) {
        inputEl.classList.add('shake');
        setTimeout(() => inputEl?.classList.remove('shake'), 500);
      }
      return;
    }
    const now = performance.now();
    const color = getColorHex();
    setTargetColor(engineCtx, color);
    parseTextToParticles(engineCtx, text, now);
    notifyState(engineCtx.state);
    setDisperserDisabled(false);
  }

  function handleDisperse(): void {
    if (engineCtx.state !== 'flying_in' && engineCtx.state !== 'stable') return;
    const now = performance.now();
    startDispersing(engineCtx, now);
    notifyState(engineCtx.state);
    setDisperserDisabled(true);
    setTimeout(() => {
      if (engineCtx.state === 'idle') {
        setDisperserDisabled(true);
        notifyState('idle');
      }
    }, 2100);
  }

  function handleInput(): void {
    if (!inputEl || !charCountEl) return;
    const val = inputEl.value;
    if (val.length > 40) {
      inputEl.value = val.slice(0, 40);
    }
    charCountEl.textContent = `${inputEl.value.length}/40`;
  }

  function handleKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  function pollState(): void {
    requestAnimationFrame(function tick() {
      notifyState(engineCtx.state);
      if (engineCtx.state === 'idle') {
        setDisperserDisabled(true);
      }
      pollState();
    });
  }

  function bind(root: HTMLElement): void {
    canvasEl = root.querySelector('#particle-canvas');
    canvasWrapRef.current = root.querySelector('#canvas-wrapper');
    inputEl = root.querySelector('#text-input') as HTMLInputElement | null;
    generateBtn = root.querySelector('#generate-btn') as HTMLButtonElement | null;
    disperseBtn = root.querySelector('#disperse-btn') as HTMLButtonElement | null;
    colorInput = root.querySelector('#color-picker') as HTMLInputElement | null;
    fpsDisplay = root.querySelector('#fps-display');
    charCountEl = root.querySelector('#char-count');
    if (inputEl) {
      inputEl.addEventListener('input', handleInput);
      inputEl.addEventListener('keydown', handleKey);
      inputEl.maxLength = 40;
    }
    if (generateBtn) {
      generateBtn.addEventListener('click', handleGenerate);
    }
    if (disperseBtn) {
      disperseBtn.addEventListener('click', handleDisperse);
      disperseBtn.disabled = true;
    }
    if (colorInput) {
      colorInput.value = '#FFD700';
      colorInput.addEventListener('input', () => {
        setTargetColor(engineCtx, getColorHex());
        if (engineCtx.state === 'stable' || engineCtx.state === 'flying_in') {
          for (const p of engineCtx.particles) {
            p.targetColor = { ...engineCtx.targetColor, a: 1 };
          }
        }
      });
    }
    if (canvasEl) {
      renderer.setCanvas(canvasEl);
    }
    window.addEventListener('resize', onResize);
    onResize();
    setTimeout(pollState, 200);
  }

  function getCanvasRef(): HTMLCanvasElement | null {
    return canvasEl;
  }

  return {
    bind,
    getCanvasRef,
    getDimensions,
    onResize,
    setGeneratorDisabled,
    setDisperserDisabled,
    setFps,
    getInputText,
    getColorHex,
    addStateListener,
    notifyState
  };
}
