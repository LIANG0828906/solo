import { applyFilter, FilterType } from './filter.js';

export interface UIState {
  currentFilter: FilterType;
  fontSize: number;
  imageLoaded: boolean;
  quote: string;
  imageSrc: string | null;
}

export interface DOMRefs {
  uploadArea: HTMLDivElement;
  fileInput: HTMLInputElement;
  previewContainer: HTMLDivElement;
  previewImage: HTMLImageElement;
  subtitleOverlay: HTMLDivElement;
  subtitleText: HTMLDivElement;
  inputContainer: HTMLDivElement;
  quoteInput: HTMLTextAreaElement;
  toolbar: HTMLDivElement;
  filterBtns: NodeListOf<HTMLButtonElement>;
  fontSlider: HTMLInputElement;
  fontValue: HTMLSpanElement;
  exportBtn: HTMLButtonElement;
  fullscreenOverlay: HTMLDivElement;
  fullscreenContent: HTMLDivElement;
  fullscreenImage: HTMLImageElement;
  fullscreenSubtitleText: HTMLDivElement;
  loadingContainer: HTMLDivElement;
}

let typewriterTimer: number | null = null;

export function getDOMRefs(): DOMRefs {
  return {
    uploadArea: document.getElementById('uploadArea') as HTMLDivElement,
    fileInput: document.getElementById('fileInput') as HTMLInputElement,
    previewContainer: document.getElementById('previewContainer') as HTMLDivElement,
    previewImage: document.getElementById('previewImage') as HTMLImageElement,
    subtitleOverlay: document.getElementById('subtitleOverlay') as HTMLDivElement,
    subtitleText: document.getElementById('subtitleText') as HTMLDivElement,
    inputContainer: document.getElementById('inputContainer') as HTMLDivElement,
    quoteInput: document.getElementById('quoteInput') as HTMLTextAreaElement,
    toolbar: document.getElementById('toolbar') as HTMLDivElement,
    filterBtns: document.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>,
    fontSlider: document.getElementById('fontSlider') as HTMLInputElement,
    fontValue: document.getElementById('fontValue') as HTMLSpanElement,
    exportBtn: document.getElementById('exportBtn') as HTMLButtonElement,
    fullscreenOverlay: document.getElementById('fullscreenOverlay') as HTMLDivElement,
    fullscreenContent: document.getElementById('fullscreenContent') as HTMLDivElement,
    fullscreenImage: document.getElementById('fullscreenImage') as HTMLImageElement,
    fullscreenSubtitleText: document.getElementById('fullscreenSubtitleText') as HTMLDivElement,
    loadingContainer: document.getElementById('loadingContainer') as HTMLDivElement,
  };
}

export function calculateAdaptiveFontSize(containerWidth: number, baseSize: number): number {
  const minPx = 14;
  const maxPx = 72;
  const scale = containerWidth / 400;
  const scaled = baseSize * scale;
  return Math.max(minPx, Math.min(maxPx, scaled));
}

export function clearTypewriter(): void {
  if (typewriterTimer !== null) {
    window.clearTimeout(typewriterTimer);
    typewriterTimer = null;
  }
}

export function renderTypewriterText(
  element: HTMLDivElement,
  text: string,
  fontSize: number,
  containerWidth: number,
  onComplete?: () => void
): void {
  clearTypewriter();
  element.innerHTML = '';
  element.style.fontSize = `${calculateAdaptiveFontSize(containerWidth, fontSize)}px`;

  if (!text) {
    onComplete?.();
    return;
  }

  const words = text.split(/(\s+|\n)/);
  const charDelay = 80;
  let globalIndex = 0;

  words.forEach((word) => {
    if (!word) return;

    if (word === '\n') {
      const br = document.createElement('br');
      element.appendChild(br);
      return;
    }

    if (/^\s+$/.test(word)) {
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'char show';
      spaceSpan.innerHTML = word.replace(/ /g, '&nbsp;');
      element.appendChild(spaceSpan);
      globalIndex += word.length;
      return;
    }

    const wordSpan = document.createElement('span');
    wordSpan.style.display = 'inline-block';
    wordSpan.style.whiteSpace = 'nowrap';

    const chars = Array.from(word);
    chars.forEach((char, charIndex) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char;
      wordSpan.appendChild(span);

      const currentIndex = globalIndex + charIndex;
      typewriterTimer = window.setTimeout(() => {
        span.classList.add('show');
      }, currentIndex * charDelay);
    });

    element.appendChild(wordSpan);
    globalIndex += chars.length;
  });

  const totalChars = Array.from(text).length;
  typewriterTimer = window.setTimeout(() => {
    onComplete?.();
  }, totalChars * charDelay);
}

export function renderStaticText(
  element: HTMLDivElement,
  text: string,
  fontSize: number,
  containerWidth: number
): void {
  clearTypewriter();
  element.style.fontSize = `${calculateAdaptiveFontSize(containerWidth, fontSize)}px`;

  if (!text) {
    element.innerHTML = '';
    return;
  }

  const words = text.split(/(\s+|\n)/);
  let html = '';

  for (const word of words) {
    if (!word) continue;

    if (word === '\n') {
      html += '<br/>';
      continue;
    }

    if (/^\s+$/.test(word)) {
      html += `<span class="char show">${word.replace(/ /g, '&nbsp;')}</span>`;
      continue;
    }

    html += '<span style="display:inline-block;white-space:nowrap;">';
    const chars = Array.from(word);
    for (const char of chars) {
      html += `<span class="char show">${escapeHtml(char)}</span>`;
    }
    html += '</span>';
  }

  element.innerHTML = html;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function setActiveFilter(
  filterBtns: NodeListOf<HTMLButtonElement>,
  filter: FilterType
): void {
  filterBtns.forEach((btn) => {
    const btnFilter = btn.dataset.filter as FilterType;
    if (btnFilter === filter) {
      btn.classList.add('active');
      btn.style.transform = 'scale(1.1)';
    } else {
      btn.classList.remove('active');
      btn.style.transform = '';
    }
  });
}

export function updateFontSizeDisplay(
  fontValue: HTMLSpanElement,
  size: number
): void {
  fontValue.textContent = `${size}px`;
}

export function showPreview(
  refs: DOMRefs,
  imageSrc: string,
  initialFilter: FilterType,
  initialFontSize: number
): Promise<void> {
  return new Promise((resolve) => {
    refs.uploadArea.style.display = 'none';

    const img = refs.previewImage;
    img.onload = () => {
      refs.previewContainer.classList.add('show');
      requestAnimationFrame(() => {
        refs.previewContainer.classList.add('enter');
      });
      applyFilter(img, initialFilter);
      setActiveFilter(refs.filterBtns, initialFilter);
      updateFontSizeDisplay(refs.fontValue, initialFontSize);

      const onAnimEnd = () => {
        refs.inputContainer.classList.add('show');
        refs.toolbar.classList.add('show');
        img.removeEventListener('animationend', onAnimEnd);
        resolve();
      };

      img.addEventListener('animationend', onAnimEnd, { once: true });

      window.setTimeout(() => {
        onAnimEnd();
      }, 600);
    };
    img.src = imageSrc;
  });
}

export function showFullscreen(
  refs: DOMRefs,
  imageSrc: string,
  quote: string,
  filter: FilterType,
  fontSize: number
): void {
  refs.fullscreenImage.src = imageSrc;
  applyFilter(refs.fullscreenImage, filter);

  const fullWidth = refs.fullscreenContent.clientWidth || 800;
  renderStaticText(refs.fullscreenSubtitleText, quote, fontSize, fullWidth);

  refs.fullscreenOverlay.classList.add('active');
  refs.loadingContainer.style.display = 'flex';
}

export function hideFullscreen(refs: DOMRefs): void {
  refs.fullscreenOverlay.classList.remove('active');
  window.setTimeout(() => {
    refs.loadingContainer.style.display = 'none';
  }, 300);
}

export function showLoading(refs: DOMRefs, show: boolean): void {
  refs.loadingContainer.style.display = show ? 'flex' : 'none';
}

export function setExportButtonEnabled(btn: HTMLButtonElement, enabled: boolean): void {
  btn.disabled = !enabled;
}
