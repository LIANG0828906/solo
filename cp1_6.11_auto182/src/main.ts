import { generateFrames, computeFrameCount, type FrameData, type WalkParams } from './spiritProcessor';
import { exportSpriteSheet, exportGif } from './exporter';

const MAX_FILE_SIZE = 500 * 1024;

interface AppState {
  originalImage: HTMLImageElement | null;
  originalData: ImageData | null;
  frames: FrameData[];
  params: WalkParams;
  playing: boolean;
  currentFrame: number;
  lastFrameSwitchTime: number;
  accumulatedTime: number;
  rafId: number | null;
  regenerateScheduled: boolean;
  fileNamePrefix: string;
}

const state: AppState = {
  originalImage: null,
  originalData: null,
  frames: [],
  params: {
    stride: 20,
    armSwing: 15,
    frameRate: 8,
  },
  playing: true,
  currentFrame: 0,
  lastFrameSwitchTime: 0,
  accumulatedTime: 0,
  rafId: null,
  regenerateScheduled: false,
  fileNamePrefix: 'pixel-walk',
};

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const elements = {
  uploadZone: $('uploadZone') as HTMLDivElement,
  fileInput: $('fileInput') as HTMLInputElement,
  fileName: $('fileName') as HTMLDivElement,
  uploadStatus: $('uploadStatus') as HTMLDivElement,
  stride: $('stride') as HTMLInputElement,
  strideVal: $('strideVal') as HTMLSpanElement,
  armSwing: $('armSwing') as HTMLInputElement,
  armSwingVal: $('armSwingVal') as HTMLSpanElement,
  frameRate: $('frameRate') as HTMLInputElement,
  frameRateVal: $('frameRateVal') as HTMLSpanElement,
  togglePlay: $('togglePlay') as HTMLButtonElement,
  genStatus: $('genStatus') as HTMLDivElement,
  exportSheet: $('exportSheet') as HTMLButtonElement,
  exportGif: $('exportGif') as HTMLButtonElement,
  exportStatus: $('exportStatus') as HTMLDivElement,
  mainCanvas: $('mainCanvas') as HTMLCanvasElement,
  previewCanvas: $('previewCanvas') as HTMLCanvasElement,
  previewWrap: $('previewWrap') as HTMLDivElement,
  emptyHint: $('emptyHint') as HTMLDivElement,
  frameCountLabel: $('frameCountLabel') as HTMLDivElement,
  loader: $('loader') as HTMLDivElement,
  hamburger: $('hamburger') as HTMLButtonElement,
  panel: $('panel') as HTMLElement,
  panelOverlay: $('panelOverlay') as HTMLDivElement,
};

function setStatus(el: HTMLElement, text: string, type: '' | 'error' | 'success' = ''): void {
  el.textContent = text;
  el.classList.remove('error', 'success');
  if (type) el.classList.add(type);
}

function setLoader(active: boolean): void {
  if (active) elements.loader.classList.add('active');
  else elements.loader.classList.remove('active');
}

function updateSliderLabels(): void {
  elements.strideVal.textContent = `${state.params.stride}px`;
  elements.armSwingVal.textContent = `${state.params.armSwing}°`;
  elements.frameRateVal.textContent = `${state.params.frameRate} FPS`;
}

function updatePlayButton(): void {
  elements.togglePlay.innerHTML = state.playing ? '⏸ 暂停预览' : '▶ 播放预览';
}

function setExportButtonsEnabled(enabled: boolean): void {
  elements.exportSheet.disabled = !enabled;
  elements.exportGif.disabled = !enabled;
}

function drawMainPreview(): void {
  const mainCtx = elements.mainCanvas.getContext('2d')!;
  mainCtx.imageSmoothingEnabled = false;
  const canvas = elements.mainCanvas;

  if (!state.originalImage) {
    canvas.width = 320;
    canvas.height = 320;
    mainCtx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const img = state.originalImage;
  const maxSide = 320;
  const scale = Math.min(maxSide / img.width, maxSide / img.height, 4);
  const dispW = Math.max(1, Math.floor(img.width * scale));
  const dispH = Math.max(1, Math.floor(img.height * scale));
  canvas.width = dispW;
  canvas.height = dispH;
  mainCtx.clearRect(0, 0, dispW, dispH);
  mainCtx.drawImage(img, 0, 0, dispW, dispH);
}

function updatePreviewSize(): void {
  if (state.frames.length === 0) return;
  const f = state.frames[0];
  const maxSide = 128;
  const scale = Math.min(maxSide / f.width, maxSide / f.height, 6);
  elements.previewCanvas.width = Math.max(1, Math.floor(f.width * scale));
  elements.previewCanvas.height = Math.max(1, Math.floor(f.height * scale));
}

function drawFrameOnPreview(frameIdx: number): void {
  if (state.frames.length === 0) return;
  const idx = Math.max(0, Math.min(state.frames.length - 1, frameIdx));
  const frame = state.frames[idx];
  const previewCtx = elements.previewCanvas.getContext('2d')!;
  previewCtx.imageSmoothingEnabled = false;

  const tmp = document.createElement('canvas');
  tmp.width = frame.width;
  tmp.height = frame.height;
  (tmp.getContext('2d')!).putImageData(frame.imageData, 0, 0);

  previewCtx.clearRect(0, 0, elements.previewCanvas.width, elements.previewCanvas.height);
  previewCtx.drawImage(tmp, 0, 0, elements.previewCanvas.width, elements.previewCanvas.height);

  elements.frameCountLabel.textContent = `${idx + 1} / ${state.frames.length}`;
}

function previewLoop(timestamp: number): void {
  if (!state.lastFrameSwitchTime) state.lastFrameSwitchTime = timestamp;
  const delta = timestamp - state.lastFrameSwitchTime;
  state.lastFrameSwitchTime = timestamp;

  if (state.playing && state.frames.length > 0) {
    state.accumulatedTime += delta;
    const frameDuration = 1000 / state.params.frameRate;
    while (state.accumulatedTime >= frameDuration) {
      state.accumulatedTime -= frameDuration;
      state.currentFrame = (state.currentFrame + 1) % state.frames.length;
    }
    drawFrameOnPreview(state.currentFrame);
  }

  state.rafId = requestAnimationFrame(previewLoop);
}

function scheduleRegenerate(): void {
  if (state.regenerateScheduled) return;
  if (!state.originalData) return;
  state.regenerateScheduled = true;
  requestAnimationFrame(() => {
    state.regenerateScheduled = false;
    regenerateFrames();
  });
}

function regenerateFrames(): void {
  if (!state.originalData) return;
  setLoader(true);
  setStatus(elements.genStatus, '生成帧序列中...');
  const t0 = performance.now();

  try {
    state.frames = generateFrames(state.originalData, state.params);
    state.currentFrame = 0;
    state.accumulatedTime = 0;
    updatePreviewSize();
    drawFrameOnPreview(0);
    elements.previewWrap.style.display = 'flex';
    elements.emptyHint.style.display = 'none';
    setExportButtonsEnabled(true);

    const elapsed = Math.round(performance.now() - t0);
    const fc = state.frames.length;
    setStatus(elements.genStatus, `✓ 生成 ${fc} 帧 · ${elapsed}ms`, 'success');
  } catch (e) {
    console.error(e);
    setStatus(elements.genStatus, '生成失败: ' + (e instanceof Error ? e.message : '未知错误'), 'error');
  } finally {
    setLoader(false);
  }
}

function readImageFromFile(file: File): Promise<{ img: HTMLImageElement; data: ImageData }> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('文件超过 500KB 限制'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          resolve({ img, data });
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('图片解码失败'));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function handleFile(file: File): Promise<void> {
  if (!/image\/(png|gif)/.test(file.type)) {
    setStatus(elements.uploadStatus, '仅支持 PNG 或 GIF 格式', 'error');
    return;
  }
  setStatus(elements.uploadStatus, '读取图片中...');
  elements.fileName.textContent = file.name;
  state.fileNamePrefix = file.name.replace(/\.[^.]+$/, '') || 'pixel-walk';
  try {
    const { img, data } = await readImageFromFile(file);
    state.originalImage = img;
    state.originalData = data;
    setStatus(elements.uploadStatus, `✓ ${img.naturalWidth}×${img.naturalHeight}`, 'success');
    drawMainPreview();
    regenerateFrames();
  } catch (e) {
    console.error(e);
    setStatus(elements.uploadStatus, (e instanceof Error ? e.message : '处理失败'), 'error');
  }
}

function bindUploadEvents(): void {
  elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  });

  ['dragenter', 'dragover'].forEach((ev) => {
    elements.uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.uploadZone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    elements.uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.uploadZone.classList.remove('dragover');
    });
  });
  elements.uploadZone.addEventListener('drop', (e) => {
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  });

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());
}

function bindSliderEvents(): void {
  elements.stride.addEventListener('input', () => {
    const v = parseInt(elements.stride.value, 10);
    if (Number.isFinite(v)) {
      state.params.stride = v;
      updateSliderLabels();
      scheduleRegenerate();
    }
  });
  elements.armSwing.addEventListener('input', () => {
    const v = parseInt(elements.armSwing.value, 10);
    if (Number.isFinite(v)) {
      state.params.armSwing = v;
      updateSliderLabels();
      scheduleRegenerate();
    }
  });
  elements.frameRate.addEventListener('input', () => {
    const v = parseInt(elements.frameRate.value, 10);
    if (Number.isFinite(v)) {
      const prev = state.params.frameRate;
      state.params.frameRate = v;
      updateSliderLabels();
      if (computeFrameCount(v) !== computeFrameCount(prev)) {
        scheduleRegenerate();
      }
    }
  });
}

function bindPlayEvents(): void {
  elements.togglePlay.addEventListener('click', () => {
    state.playing = !state.playing;
    updatePlayButton();
  });
}

function bindExportEvents(): void {
  elements.exportSheet.addEventListener('click', async () => {
    if (state.frames.length === 0) return;
    setStatus(elements.exportStatus, '生成精灵表...');
    try {
      await exportSpriteSheet(state.frames, state.fileNamePrefix);
      setStatus(elements.exportStatus, '✓ 精灵表已下载', 'success');
    } catch (e) {
      setStatus(elements.exportStatus, '导出失败: ' + (e instanceof Error ? e.message : '未知'), 'error');
    }
  });

  elements.exportGif.addEventListener('click', async () => {
    if (state.frames.length === 0) return;
    setStatus(elements.exportStatus, 'GIF 编码中 (0%)...');
    elements.exportGif.disabled = true;
    try {
      await exportGif(state.frames, state.params, state.fileNamePrefix, (p) => {
        setStatus(elements.exportStatus, `GIF 编码中 (${Math.round(p * 100)}%)...`);
      });
      setStatus(elements.exportStatus, '✓ GIF 已下载', 'success');
    } catch (e) {
      setStatus(elements.exportStatus, '导出失败: ' + (e instanceof Error ? e.message : '未知'), 'error');
    } finally {
      elements.exportGif.disabled = false;
    }
  });
}

function bindResponsive(): void {
  const toggle = (open: boolean) => {
    if (open) {
      elements.panel.classList.add('open');
      elements.panelOverlay.classList.add('active');
    } else {
      elements.panel.classList.remove('open');
      elements.panelOverlay.classList.remove('active');
    }
  };
  elements.hamburger.addEventListener('click', () => {
    toggle(!elements.panel.classList.contains('open'));
  });
  elements.panelOverlay.addEventListener('click', () => toggle(false));

  const mq = window.matchMedia('(max-width: 767px)');
  const onChange = () => {
    if (!mq.matches) toggle(false);
  };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
}

function init(): void {
  drawMainPreview();
  updateSliderLabels();
  updatePlayButton();
  setExportButtonsEnabled(false);

  bindUploadEvents();
  bindSliderEvents();
  bindPlayEvents();
  bindExportEvents();
  bindResponsive();

  state.rafId = requestAnimationFrame(previewLoop);
}

document.addEventListener('DOMContentLoaded', init);
