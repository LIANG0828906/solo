import { applyFilter, FilterType } from './filter.js';
import {
  getDOMRefs,
  DOMRefs,
  showPreview,
  renderTypewriterText,
  renderStaticText,
  setActiveFilter,
  updateFontSizeDisplay,
  showFullscreen,
  hideFullscreen,
  showLoading,
  setExportButtonEnabled,
} from './ui.js';
import { exportCard, triggerDownload, generateTimestampFilename } from './export.js';

interface AppState {
  imageSrc: string | null;
  quote: string;
  filter: FilterType;
  fontSize: number;
}

const state: AppState = {
  imageSrc: null,
  quote: '',
  filter: 'warm',
  fontSize: 28,
};

let refs: DOMRefs | null = null;
let debounceTimer: number | null = null;

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: number | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  } as T;
}

function getPreviewWidth(): number {
  if (!refs) return 800;
  return refs.previewContainer.clientWidth || 800;
}

function reRenderSubtitleStatic(): void {
  if (!refs || !state.imageSrc) return;
  const width = getPreviewWidth();
  renderStaticText(refs.subtitleText, state.quote, state.fontSize, width);
}

function reRenderSubtitleTypewriter(): void {
  if (!refs || !state.imageSrc) return;
  const width = getPreviewWidth();
  renderTypewriterText(refs.subtitleText, state.quote, state.fontSize, width);
}

const debouncedRerender = debounce(reRenderSubtitleStatic, 50);

function handleFileSelect(file: File): void {
  if (!refs) return;
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const src = e.target?.result as string;
    if (!src) return;
    state.imageSrc = src;
    state.quote = '';
    refs!.quoteInput.value = '';
    showPreview(refs!, src, state.filter, state.fontSize).then(() => {
      setExportButtonEnabled(refs!.exportBtn, true);
    });
  };
  reader.readAsDataURL(file);
}

function initUploadEvents(): void {
  if (!refs) return;

  refs.uploadArea.addEventListener('click', () => {
    refs!.fileInput.click();
  });

  refs.fileInput.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  });

  refs.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    refs!.uploadArea.classList.add('dragover');
  });

  refs.uploadArea.addEventListener('dragleave', () => {
    refs!.uploadArea.classList.remove('dragover');
  });

  refs.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    refs!.uploadArea.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  });
}

function initQuoteInput(): void {
  if (!refs) return;

  refs.quoteInput.addEventListener('input', (e) => {
    const target = e.target as HTMLTextAreaElement;
    const newQuote = target.value;
    const wasEmpty = state.quote.length === 0;
    const gotShorter = newQuote.length < state.quote.length;
    state.quote = newQuote;

    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    if (gotShorter || wasEmpty) {
      reRenderSubtitleTypewriter();
    } else {
      debouncedRerender();
      debounceTimer = window.setTimeout(() => {
        reRenderSubtitleTypewriter();
      }, 800);
    }
  });
}

function initFilterButtons(): void {
  if (!refs) return;

  refs.filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter as FilterType;
      if (!filter || filter === state.filter) return;

      state.filter = filter;
      setActiveFilter(refs!.filterBtns, filter);
      if (state.imageSrc) {
        applyFilter(refs!.previewImage, filter);
      }
    });
  });
}

function initFontSlider(): void {
  if (!refs) return;

  refs.fontSlider.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const size = parseInt(target.value, 10);
    state.fontSize = size;
    updateFontSizeDisplay(refs!.fontValue, size);
    reRenderSubtitleStatic();
  });
}

async function handleExport(): Promise<void> {
  if (!refs || !state.imageSrc) return;

  setExportButtonEnabled(refs.exportBtn, false);

  try {
    showFullscreen(refs, state.imageSrc, state.quote, state.filter, state.fontSize);

    const start = performance.now();

    const blob = await exportCard(
      state.imageSrc,
      state.quote,
      state.filter,
      state.fontSize
    );

    const elapsed = performance.now() - start;
    const minDisplayTime = 400;
    const waitTime = Math.max(0, minDisplayTime - elapsed);

    window.setTimeout(() => {
      showLoading(refs!, false);
      triggerDownload(blob, generateTimestampFilename());

      window.setTimeout(() => {
        hideFullscreen(refs!);
        setExportButtonEnabled(refs!.exportBtn, true);
      }, 600);
    }, waitTime);
  } catch (err) {
    console.error('导出失败:', err);
    alert('导出失败，请重试');
    hideFullscreen(refs);
    setExportButtonEnabled(refs.exportBtn, true);
  }
}

function initExportButton(): void {
  if (!refs) return;

  setExportButtonEnabled(refs.exportBtn, false);
  refs.exportBtn.addEventListener('click', handleExport);
}

function initFullscreenClose(): void {
  if (!refs) return;

  refs.fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === refs!.fullscreenOverlay) {
      hideFullscreen(refs!);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && refs!.fullscreenOverlay.classList.contains('active')) {
      hideFullscreen(refs!);
    }
  });
}

function initResizeHandler(): void {
  let resizeTimer: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimer !== null) {
      window.cancelAnimationFrame(resizeTimer);
    }
    resizeTimer = window.requestAnimationFrame(() => {
      reRenderSubtitleStatic();
    });
  });
}

function init(): void {
  refs = getDOMRefs();

  initUploadEvents();
  initQuoteInput();
  initFilterButtons();
  initFontSlider();
  initExportButton();
  initFullscreenClose();
  initResizeHandler();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
