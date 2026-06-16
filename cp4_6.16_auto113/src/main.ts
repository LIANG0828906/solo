import { CanvasRenderer } from './renderer';
import { InteractionManager } from './interaction';
import { useCanvasStore } from './store';
import type { FilterType } from './types';

const canvas = document.getElementById('emoji-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

const renderer = new CanvasRenderer(canvas);
const interaction = new InteractionManager(canvas, renderer);

const state = useCanvasStore.getState();

function initUI(): void {
  initEmojiCategories();
  initColorPicker();
  initSizeSlider();
  initFilterButtons();
  initExportButton();
  initEmojiPalette();
  updateColorIndicator(state.currentColor);
}

function initEmojiCategories(): void {
  const categoriesContainer = document.getElementById('emoji-categories');
  if (!categoriesContainer) return;

  const categories = state.categories;

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.dataset.category = cat.name;
    btn.textContent = cat.icon;
    btn.title = cat.name;

    if (cat.name === state.currentCategory) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      state.setCurrentCategory(cat.name);
      updateCategoryButtons();
      updateEmojiPalette();
    });

    categoriesContainer.appendChild(btn);
  });
}

function updateCategoryButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.category-btn');
  buttons.forEach((btn) => {
    if (btn.dataset.category === state.currentCategory) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function initEmojiPalette(): void {
  updateEmojiPalette();
}

function updateEmojiPalette(): void {
  const palette = document.getElementById('emoji-palette');
  if (!palette) return;

  palette.innerHTML = '';

  const category = state.categories.find((c) => c.name === state.currentCategory);
  if (!category) return;

  category.emojis.forEach((emoji) => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;

    if (emoji === state.currentEmoji) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      state.setCurrentEmoji(emoji);
      updateEmojiPalette();
    });

    palette.appendChild(btn);
  });
}

function initColorPicker(): void {
  const colorIndicator = document.getElementById('color-indicator');
  const colorPicker = document.getElementById('color-picker-popup') as HTMLElement;
  const hueSlider = document.getElementById('hue-slider') as HTMLInputElement;
  const saturationSlider = document.getElementById('saturation-slider') as HTMLInputElement;
  const lightnessSlider = document.getElementById('lightness-slider') as HTMLInputElement;

  if (!colorIndicator || !colorPicker || !hueSlider || !saturationSlider || !lightnessSlider) return;

  colorIndicator.addEventListener('click', (e) => {
    e.stopPropagation();
    colorPicker.classList.toggle('visible');
  });

  document.addEventListener('click', (e) => {
    if (!colorPicker.contains(e.target as Node) && e.target !== colorIndicator) {
      colorPicker.classList.remove('visible');
    }
  });

  const updateColor = () => {
    const h = parseInt(hueSlider.value);
    const s = parseInt(saturationSlider.value);
    const l = parseInt(lightnessSlider.value);
    const color = `hsl(${h}, ${s}%, ${l}%)`;
    state.setCurrentColor(color);
    updateColorIndicator(color);
  };

  hueSlider.addEventListener('input', updateColor);
  saturationSlider.addEventListener('input', updateColor);
  lightnessSlider.addEventListener('input', updateColor);
}

function updateColorIndicator(color: string): void {
  const colorIndicator = document.getElementById('color-indicator');
  if (colorIndicator) {
    colorIndicator.style.backgroundColor = color;
  }
}

function initSizeSlider(): void {
  const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;
  const sizeValue = document.getElementById('size-value');

  if (!sizeSlider || !sizeValue) return;

  sizeSlider.value = state.currentSize.toString();
  sizeValue.textContent = `${state.currentSize}px`;

  sizeSlider.addEventListener('input', () => {
    const size = parseInt(sizeSlider.value);
    state.setCurrentSize(size);
    sizeValue.textContent = `${size}px`;
  });
}

function initFilterButtons(): void {
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('.filter-btn');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter as FilterType;
      state.setCurrentFilter(filter);

      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function initExportButton(): void {
  const exportBtn = document.getElementById('export-btn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    exportAsHTML();
  });
}

function exportAsHTML(): void {
  const storeState = useCanvasStore.getState();
  const emojis = storeState.emojis;
  const filter = storeState.currentFilter;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  emojis.forEach((e) => {
    const half = e.size / 2;
    minX = Math.min(minX, e.x - half);
    maxX = Math.max(maxX, e.x + half);
    minY = Math.min(minY, e.y - half);
    maxY = Math.max(maxY, e.y + half);
  });

  const padding = 40;
  const width = Math.max(400, maxX - minX + padding * 2);
  const height = Math.max(300, maxY - minY + padding * 2);
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  let emojiHTML = '';
  emojis.forEach((e) => {
    const x = e.x + offsetX;
    const y = e.y + offsetY;
    emojiHTML += `<div style="position:absolute;left:${x - e.size / 2}px;top:${y - e.size / 2}px;font-size:${e.size}px;color:${e.color};font-family:serif;user-select:none;">${e.emoji}</div>`;
  });

  let filterStyle = '';
  if (filter === 'sepia') {
    filterStyle = 'filter: sepia(0.8);';
  } else if (filter === 'gaussianBlur') {
    filterStyle = 'filter: blur(2px);';
  } else if (filter === 'neon') {
    filterStyle = 'filter: hue-rotate(180deg) saturate(1.5);';
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EmojiCanvas 作品</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .artwork {
      position: relative;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      ${filterStyle}
    }
    .title {
      position: absolute;
      bottom: -50px;
      left: 50%;
      transform: translateX(-50%);
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="artwork" style="width:${width}px;height:${height}px;">
    ${emojiHTML}
    <div class="title">由 EmojiCanvas 创作 ✨</div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'emoji-canvas-artwork.html';
  a.click();
  URL.revokeObjectURL(url);
}

initUI();

export { renderer, interaction };
