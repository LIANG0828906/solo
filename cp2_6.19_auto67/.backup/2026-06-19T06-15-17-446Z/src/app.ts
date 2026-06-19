import { AudioEngine, EffectType, EffectParams } from './audioEngine';
import { WaveformRenderer, TransitionConfig } from './waveformRenderer';
import { SpectrumRenderer } from './spectrumRenderer';

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`找不到元素: #${id}`);
  return el;
};

document.addEventListener('DOMContentLoaded', () => {
  const engine = new AudioEngine();

  const waveformCanvas = $<HTMLCanvasElement>('waveformCanvas');
  const spectrumCanvas = $<HTMLCanvasElement>('spectrumCanvas');

  const waveformRenderer = new WaveformRenderer(waveformCanvas);
  const spectrumRenderer = new SpectrumRenderer(spectrumCanvas);
  if (engine.analyser) {
    spectrumRenderer.setAnalyser(engine.analyser);
  }

  spectrumRenderer.startRenderLoop();
  waveformRenderer.startRenderLoop();

  const fileInput = $<HTMLInputElement>('fileInput');
  const playBtn = $<HTMLButtonElement>('playBtn');
  const stopBtn = $<HTMLButtonElement>('stopBtn');
  const clearRegionBtn = $<HTMLButtonElement>('clearRegionBtn');
  const volumeSlider = $<HTMLInputElement>('volumeSlider');
  const echoSlider = $<HTMLInputElement>('echoSlider');
  const lowpassSlider = $<HTMLInputElement>('lowpassSlider');
  const volumeValue = $('volumeValue');
  const echoValue = $('echoValue');
  const lowpassValue = $('lowpassValue');
  const progressInfo = $('progressInfo');
  const durationInfo = $('durationInfo');
  const selectionInfo = $('selectionInfo');
  const fileInfo = $('fileInfo');
  const loadingOverlay = $('loadingOverlay');
  const waveformEmpty = $('waveformEmpty');

  let isDragging = false;
  let dragStartRatio = -1;
  let currentStartRatio = -1;
  let currentEndRatio = -1;

  const showLoading = () => loadingOverlay.classList.add('active');
  const hideLoading = () => loadingOverlay.classList.remove('active');

  let currentVolume = 1;
  let currentEcho = 0;
  let currentLowpass = 5000;

  function resetEffectUI(): void {
    currentVolume = 1;
    currentEcho = 0;
    currentLowpass = 5000;
    volumeSlider.value = '1';
    echoSlider.value = '0';
    lowpassSlider.value = '5000';
    updateEffectLabels();
  }

  function updateEffectLabels(): void {
    volumeValue.textContent = `${currentVolume.toFixed(2)}x`;
    echoValue.textContent = currentEcho > 0 ? `${currentEcho} ms` : '0 ms';
    lowpassValue.textContent = currentLowpass >= 5000 ? '关闭' : `${currentLowpass} Hz`;
  }

  function setControlsEnabled(enabled: boolean): void {
    playBtn.disabled = !enabled;
    stopBtn.disabled = !enabled;
    volumeSlider.disabled = !enabled;
    echoSlider.disabled = !enabled;
    lowpassSlider.disabled = !enabled;
    clearRegionBtn.disabled = !enabled;
    if (enabled) {
      waveformEmpty.style.display = 'none';
    }
  }

  async function applyCurrentEffects(animate = true): Promise<void> {
    if (!engine.decodedBuffer) return;
    const params: EffectParams = {
      volume: currentVolume,
      echoDelay: currentEcho,
      lowpassFreq: currentLowpass
    };
    try {
      const result = await engine.applyEffect('volume', params);
      const data = engine.getSampleData(0);
      const config: TransitionConfig | undefined = animate
        ? { delayMs: result.processingDelayMs }
        : undefined;
      waveformRenderer.setWaveformData(data, animate, config);
      updateDurationDisplay();
      updateSelectionFromEngine();
    } catch (e) {
      console.error('应用效果失败', e);
    }
  }

  function updateDurationDisplay(): void {
    const dur = engine.getDuration();
    durationInfo.textContent = `· 时长 ${formatTime(dur)}`;
  }

  function updateProgressDisplay(current: number, total: number): void {
    progressInfo.textContent = `${formatTime(current)} / ${formatTime(total)}`;
    if (total > 0) {
      waveformRenderer.setIndicator(current / total);
    }
  }

  function updateSelectionFromEngine(): void {
    const region = engine.selectedRegion;
    const total = engine.getDuration();
    if (region && total > 0) {
      currentStartRatio = region.startSec / total;
      currentEndRatio = region.endSec / total;
      waveformRenderer.setSelectionByRatio(currentStartRatio, currentEndRatio);
      selectionInfo.style.display = 'inline-block';
      selectionInfo.textContent = `选区: ${formatTime(region.startSec)} ~ ${formatTime(region.endSec)}`;
    } else {
      currentStartRatio = -1;
      currentEndRatio = -1;
      waveformRenderer.clearSelection();
      selectionInfo.style.display = 'none';
    }
  }

  engine.onProgress((cur, total) => {
    updateProgressDisplay(cur, total);
  });

  engine.onPlaybackEnd(() => {
    playBtn.textContent = '▶';
    waveformRenderer.clearIndicator();
    updateProgressDisplay(engine.selectedRegion ? engine.selectedRegion.startSec : 0, engine.getDuration());
  });

  fileInput.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      showLoading();
      await engine.loadFile(file);
      const data = engine.getSampleData(0);
      waveformRenderer.setWaveformData(data, false);
      waveformRenderer.setDuration(engine.getDuration());
      updateDurationDisplay();
      updateProgressDisplay(0, engine.getDuration());
      setControlsEnabled(true);
      resetEffectUI();
      updateSelectionFromEngine();
      fileInfo.innerHTML = `已加载: <strong>${file.name}</strong> · ${formatFileSize(file.size)}`;
      playBtn.textContent = '▶';
      waveformRenderer.clearIndicator();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载失败';
      fileInfo.innerHTML = `<span style="color:#ef4444;">${msg}</span>`;
      setControlsEnabled(false);
    } finally {
      hideLoading();
      fileInput.value = '';
    }
  });

  playBtn.addEventListener('click', () => {
    if (engine.isPlaying) {
      engine.pause();
      playBtn.textContent = '▶';
    } else {
      engine.play();
      playBtn.textContent = '⏸';
    }
  });

  stopBtn.addEventListener('click', () => {
    engine.stop();
    playBtn.textContent = '▶';
    waveformRenderer.clearIndicator();
    updateProgressDisplay(engine.selectedRegion ? engine.selectedRegion.startSec : 0, engine.getDuration());
  });

  clearRegionBtn.addEventListener('click', () => {
    engine.clearRegion();
    updateSelectionFromEngine();
    if (!engine.isPlaying) {
      updateProgressDisplay(0, engine.getDuration());
    }
  });

  function getMouseRatio(evt: MouseEvent | Touch): number {
    return waveformRenderer.getSelectionRatio(evt.clientX);
  }

  waveformCanvas.addEventListener('mousedown', (e) => {
    if (!engine.decodedBuffer) return;
    isDragging = true;
    dragStartRatio = getMouseRatio(e);
    currentStartRatio = dragStartRatio;
    currentEndRatio = dragStartRatio;
    waveformRenderer.setSelectionByRatio(currentStartRatio, currentEndRatio);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const ratio = getMouseRatio(e);
    currentEndRatio = ratio;
    waveformRenderer.setSelectionByRatio(currentStartRatio, currentEndRatio);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    const total = engine.getDuration();
    if (currentStartRatio >= 0 && currentEndRatio >= 0 && total > 0) {
      let s = currentStartRatio;
      let e = currentEndRatio;
      if (s > e) [s, e] = [e, s];
      const len = e - s;
      if (len > 0.002) {
        engine.selectRegion(s * total, e * total);
      } else {
        engine.clearRegion();
        if (!engine.isPlaying) {
          engine.resetPauseOffset(0);
          updateProgressDisplay(0, engine.getDuration());
        }
      }
    }
    updateSelectionFromEngine();
  });

  waveformCanvas.addEventListener('touchstart', (e) => {
    if (!engine.decodedBuffer) return;
    const t = e.touches[0];
    if (!t) return;
    isDragging = true;
    dragStartRatio = getMouseRatio(t);
    currentStartRatio = dragStartRatio;
    currentEndRatio = dragStartRatio;
    waveformRenderer.setSelectionByRatio(currentStartRatio, currentEndRatio);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    if (!t) return;
    const ratio = getMouseRatio(t);
    currentEndRatio = ratio;
    waveformRenderer.setSelectionByRatio(currentStartRatio, currentEndRatio);
  });

  window.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const total = engine.getDuration();
    if (currentStartRatio >= 0 && currentEndRatio >= 0 && total > 0) {
      let s = currentStartRatio;
      let ee = currentEndRatio;
      if (s > ee) [s, ee] = [ee, s];
      const len = ee - s;
      if (len > 0.002) {
        engine.selectRegion(s * total, ee * total);
      } else {
        engine.clearRegion();
      }
    }
    updateSelectionFromEngine();
  });

  let effectDebounceId: number | null = null;

  function scheduleEffectUpdate(type: EffectType): void {
    if (effectDebounceId !== null) {
      clearTimeout(effectDebounceId);
    }
    effectDebounceId = window.setTimeout(() => {
      void applyCurrentEffects(true);
      effectDebounceId = null;
    }, 150);
    void type;
  }

  volumeSlider.addEventListener('input', () => {
    currentVolume = parseFloat(volumeSlider.value);
    updateEffectLabels();
    scheduleEffectUpdate('volume');
  });

  echoSlider.addEventListener('input', () => {
    currentEcho = parseInt(echoSlider.value, 10);
    updateEffectLabels();
    scheduleEffectUpdate('echo');
  });

  lowpassSlider.addEventListener('input', () => {
    currentLowpass = parseInt(lowpassSlider.value, 10);
    updateEffectLabels();
    scheduleEffectUpdate('lowpass');
  });

  const resizeObserver = new ResizeObserver(() => {
    waveformRenderer.resize();
    spectrumRenderer.resize();
    if (engine.decodedBuffer) {
      const data = engine.getSampleData(0);
      waveformRenderer.setWaveformData(data, false);
      updateSelectionFromEngine();
    }
  });

  resizeObserver.observe(waveformCanvas.parentElement!);
  resizeObserver.observe(spectrumCanvas.parentElement!);

  window.addEventListener('beforeunload', () => {
    spectrumRenderer.stopRenderLoop();
    waveformRenderer.stopRenderLoop();
    engine.stop();
  });

  updateEffectLabels();
  updateProgressDisplay(0, 0);
});
