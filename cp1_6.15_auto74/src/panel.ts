import { FoodCategory, CATEGORY_CONFIG, FilterCriteria } from './data';

type FilterChangeCallback = (criteria: FilterCriteria) => void;

let onFilterChange: FilterChangeCallback | null = null;
let selectedCategories: FoodCategory[] = [];
let priceRange: [number, number] = [5, 50];
let selectedQueueRanges: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];
let panelOpen = false;

const categories = Object.keys(CATEGORY_CONFIG) as FoodCategory[];

export function initPanel(changeHandler: FilterChangeCallback): void {
  onFilterChange = changeHandler;

  renderCategoryTags();
  initPriceSlider();
  initQueueOptions();
  initPanelToggle();
  emitChange();
}

function emitChange(): void {
  if (onFilterChange) {
    onFilterChange({
      categories: selectedCategories,
      priceRange,
      queueRanges: selectedQueueRanges,
    });
  }
}

function renderCategoryTags(): void {
  const container = document.getElementById('category-tags');
  if (!container) return;

  container.innerHTML = '';
  categories.forEach((cat) => {
    const cfg = CATEGORY_CONFIG[cat];
    const tag = document.createElement('button');
    tag.className = 'category-tag';
    tag.setAttribute('data-category', cat);
    tag.innerHTML = `<span class="tag-emoji">${cfg.emoji}</span><span class="tag-label">${cat}</span>`;

    if (selectedCategories.includes(cat)) {
      tag.classList.add('active');
      tag.style.background = cfg.color;
      tag.style.color = '#fff';
    }

    tag.addEventListener('click', () => {
      const idx = selectedCategories.indexOf(cat);
      if (idx >= 0) {
        selectedCategories.splice(idx, 1);
        tag.classList.remove('active');
        tag.style.background = '';
        tag.style.color = '';
      } else {
        selectedCategories.push(cat);
        tag.classList.add('active');
        tag.style.background = cfg.color;
        tag.style.color = '#fff';
      }
      emitChange();
    });

    container.appendChild(tag);
  });
}

function initPriceSlider(): void {
  const slider = document.getElementById('price-slider');
  const track = document.getElementById('range-track');
  const thumbLeft = document.getElementById('thumb-left') as HTMLDivElement;
  const thumbRight = document.getElementById('thumb-right') as HTMLDivElement;
  const minLabel = document.getElementById('price-min-label');
  const maxLabel = document.getElementById('price-max-label');

  if (!slider || !track || !thumbLeft || !thumbRight || !minLabel || !maxLabel) return;

  const MIN = 5;
  const MAX = 50;
  let dragging: 'left' | 'right' | null = null;

  function posFromValue(val: number): number {
    return ((val - MIN) / (MAX - MIN)) * 100;
  }

  function valueFromPos(percent: number): number {
    return Math.round(MIN + (percent / 100) * (MAX - MIN));
  }

  function updateTrack(): void {
    const leftPct = posFromValue(priceRange[0]);
    const rightPct = posFromValue(priceRange[1]);
    thumbLeft.style.left = leftPct + '%';
    thumbRight.style.left = rightPct + '%';
    track.style.left = leftPct + '%';
    track.style.width = (rightPct - leftPct) + '%';
    minLabel.textContent = '¥' + priceRange[0];
    maxLabel.textContent = '¥' + priceRange[1];
  }

  function onPointerDown(e: PointerEvent, side: 'left' | 'right'): void {
    e.preventDefault();
    dragging = side;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    const rect = slider.getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    const val = valueFromPos(pct);

    if (dragging === 'left') {
      priceRange[0] = Math.min(val, priceRange[1] - 1);
    } else {
      priceRange[1] = Math.max(val, priceRange[0] + 1);
    }
    updateTrack();
    emitChange();
  }

  function onPointerUp(): void {
    dragging = null;
  }

  thumbLeft.addEventListener('pointerdown', (e) => onPointerDown(e, 'left'));
  thumbRight.addEventListener('pointerdown', (e) => onPointerDown(e, 'right'));
  slider.addEventListener('pointermove', onPointerMove);
  slider.addEventListener('pointerup', onPointerUp);

  updateTrack();
}

function initQueueOptions(): void {
  const toggle = document.getElementById('queue-toggle');
  const options = document.getElementById('queue-options');
  const icon = document.getElementById('queue-collapse-icon');

  if (!toggle || !options || !icon) return;

  let collapsed = false;

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    options.style.maxHeight = collapsed ? '0' : '200px';
    options.style.opacity = collapsed ? '0' : '1';
    icon.textContent = collapsed ? '▸' : '▾';
  });

  const checkboxes = options.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      selectedQueueRanges = [];
      checkboxes.forEach((c) => {
        if ((c as HTMLInputElement).checked) {
          selectedQueueRanges.push((c as HTMLInputElement).value as 'short' | 'medium' | 'long');
        }
      });
      emitChange();
    });
  });
}

function initPanelToggle(): void {
  const toggleBtn = document.getElementById('panel-toggle');
  const closeBtn = document.getElementById('panel-close');
  const panel = document.getElementById('filter-panel');
  const overlay = document.getElementById('overlay');

  if (!toggleBtn || !closeBtn || !panel || !overlay) return;

  function openPanel(): void {
    panelOpen = true;
    panel.classList.add('open');
    overlay.classList.add('active');
  }

  function closePanel(): void {
    panelOpen = false;
    panel.classList.remove('open');
    overlay.classList.remove('active');
  }

  toggleBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
}

export function isPanelOpen(): boolean {
  return panelOpen;
}
