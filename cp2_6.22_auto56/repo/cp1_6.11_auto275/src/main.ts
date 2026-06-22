// ============================================================
// main.ts - 应用入口模块
// 职责：初始化画布和应用状态，协调design模块和simulate模块
// 数据流向：UI事件 → 状态更新 → 调用design/simulate模块 → 刷新UI
// 依赖：design.ts, simulate.ts, utils.ts
// ============================================================

import { DesignModule, type BlockLayer } from './design.js';
import { SimulateModule, type SimulateRenderOptions } from './simulate.js';
import {
  CN_NUMERALS,
  PIGMENT_COLORS
} from './utils.js';

interface AppState {
  printOrder: number[];
  layerColors: Record<number, string>;
  layerOpacities: Record<number, number>;
  activeSlotIndex: number;
  activeView: 'main' | 'design';
  isSimulating: boolean;
  globalOpacity: number;
}

const state: AppState = {
  printOrder: [0, 1, 2, 3],
  layerColors: { 0: '#D4322E', 1: '#2E8B57', 2: '#4169E1', 3: '#DAA520' },
  layerOpacities: { 0: 0.8, 1: 0.8, 2: 0.8, 3: 0.8 },
  activeSlotIndex: 0,
  activeView: 'main',
  isSimulating: false,
  globalOpacity: 0.8
};

let designModule: DesignModule;
let simulateModule: SimulateModule;

const $ = (id: string): HTMLElement | null => document.getElementById(id);

function getSimulateOptions(): SimulateRenderOptions {
  return {
    printOrder: state.printOrder,
    layerColors: state.layerColors,
    layerOpacities: state.layerOpacities,
    getColoredLayerCanvas: (id, c, o) => designModule.createColoredLayerCanvas(id, c, o),
    getLayer: (id) => designModule.getLayer(id)
  };
}

function refreshPreview(): void {
  if (!state.isSimulating) {
    simulateModule.renderStaticPreview(getSimulateOptions());
  }
}

function updateStatusText(text: string): void {
  const el = $('statusText');
  if (el) el.textContent = text;
}

function updateColorInfo(): void {
  const el = $('colorInfo');
  const slotId = state.activeSlotIndex;
  const hex = state.layerColors[slotId];
  const pig = PIGMENT_COLORS.find(p => p.hex === hex);
  const name = pig ? pig.name : '未选择';
  const layer = designModule.getLayer(slotId);
  const content = layer?.hasContent ? '✓ 已雕刻' : '（空白版）';
  if (el) el.innerHTML = `版${CN_NUMERALS[slotId]}<br>${name} ${hex}<br><span style="font-size:12px;color:#8B5A2B">${content}</span>`;
}

function updateOrderDisplay(): void {
  const el = $('orderValue');
  if (el) el.textContent = state.printOrder.map(i => CN_NUMERALS[i]).join('→');
}

function updateOpacitySliderUI(): void {
  const slider = $('opacitySlider') as HTMLInputElement | null;
  const value = $('opacityValue');
  if (slider) slider.value = String(Math.round(state.globalOpacity * 100));
  if (value) value.textContent = `${Math.round(state.globalOpacity * 100)}%`;
}

function refreshSlotThumbnails(): void {
  const slots = document.querySelectorAll<HTMLElement>('.block-slot');
  slots.forEach(slot => {
    const idx = Number(slot.dataset.slotIndex ?? '0');
    const thumb = designModule.getThumbnailCanvas(idx);
    const layer = designModule.getLayer(idx);
    slot.classList.toggle('active', idx === state.activeSlotIndex);

    const emptyEl = slot.querySelector('.slot-empty');
    let thumbEl = slot.querySelector('img.slot-thumb') as HTMLImageElement | null;
    let badgeEl = slot.querySelector('.slot-order-badge') as HTMLElement | null;

    if (!badgeEl) {
      badgeEl = document.createElement('div');
      badgeEl.className = 'slot-order-badge';
      slot.appendChild(badgeEl);
    }
    const orderIdx = state.printOrder.indexOf(idx);
    badgeEl.textContent = String(orderIdx + 1);
    badgeEl.style.display = 'flex';

    if (layer?.hasContent && thumb) {
      if (emptyEl) emptyEl.remove();
      if (!thumbEl) {
        thumbEl = document.createElement('img');
        thumbEl.className = 'slot-thumb';
        slot.appendChild(thumbEl);
      }
      thumbEl.src = thumb.toDataURL('image/png');
    } else {
      if (thumbEl) thumbEl.remove();
      if (!emptyEl) {
        const e = document.createElement('span');
        e.className = 'slot-empty';
        e.textContent = '空白';
        slot.appendChild(e);
      }
    }

    const borderColor = state.layerColors[idx];
    if (layer?.hasContent && borderColor) {
      slot.style.borderBottomColor = borderColor;
      slot.style.borderBottomWidth = '4px';
    } else {
      slot.style.borderBottomColor = '';
      slot.style.borderBottomWidth = '';
    }
  });

  const colorOptions = document.querySelectorAll<HTMLElement>('.color-option');
  colorOptions.forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === state.layerColors[state.activeSlotIndex]);
  });
}

function openDesignView(): void {
  state.activeView = 'design';
  designModule.loadLayerForEditing(state.activeSlotIndex);
  const overlay = $('designOverlay');
  const title = $('designTitle');
  if (title) title.textContent = `雕版设计 - 第${CN_NUMERALS[state.activeSlotIndex]}版`;
  if (overlay) overlay.classList.add('visible');
  updateStatusText(`正在设计第${CN_NUMERALS[state.activeSlotIndex]}版`);

  const brushBtns = document.querySelectorAll<HTMLElement>('.brush-btn');
  brushBtns.forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.brush) === designModule.getBrushSize());
  });
}

function closeDesignView(): void {
  state.activeView = 'main';
  designModule.clearEditing();
  const overlay = $('designOverlay');
  if (overlay) overlay.classList.remove('visible');
  simulateModule.invalidateColoredLayerCache(state.activeSlotIndex);
  refreshSlotThumbnails();
  updateColorInfo();
  refreshPreview();
  updateStatusText(`版${CN_NUMERALS[state.activeSlotIndex]}设计完成`);
}

function bindSlotEvents(): void {
  const slots = document.querySelectorAll<HTMLElement>('.block-slot');
  slots.forEach(slot => {
    slot.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.slot-order-badge')) return;
      const idx = Number(slot.dataset.slotIndex ?? '0');
      state.activeSlotIndex = idx;
      refreshSlotThumbnails();
      updateColorInfo();
      updateOpacitySliderUI();
      if (!state.isSimulating) openDesignView();
    });

    slot.addEventListener('dragstart', (e: DragEvent) => {
      if (state.isSimulating) { e.preventDefault(); return; }
      const idx = Number(slot.dataset.slotIndex ?? '0');
      slot.classList.add('dragging');
      const dt = e.dataTransfer;
      if (dt) {
        dt.effectAllowed = 'move';
        dt.setData('text/plain', String(idx));
        try {
          const dragCanvas = designModule.getThumbnailCanvas(idx);
          if (dragCanvas) {
            dragCanvas.toBlob(blob => {
              if (blob && dt) {
                const img = new Image();
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                  dt.setDragImage(img, 40, 60);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                };
                img.src = url;
              }
            }, 'image/png');
          }
        } catch { /* ignore drag image issues */ }
      }
      state.activeSlotIndex = idx;
      refreshSlotThumbnails();
      updateStatusText('拖拽调整印刷顺序...');
    });

    slot.addEventListener('dragend', () => {
      slot.classList.remove('dragging');
      document.querySelectorAll('.block-slot').forEach(s => s.classList.remove('drag-over'));
    });

    slot.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (state.isSimulating) return;
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      if (state.isSimulating) return;
      const dt = e.dataTransfer;
      if (!dt) return;
      const fromId = Number(dt.getData('text/plain'));
      const toId = Number(slot.dataset.slotIndex ?? '0');
      if (Number.isNaN(fromId) || fromId === toId) return;

      const fromOrder = state.printOrder.indexOf(fromId);
      const toOrder = state.printOrder.indexOf(toId);
      if (fromOrder === -1 || toOrder === -1) return;
      state.printOrder.splice(fromOrder, 1);
      state.printOrder.splice(toOrder, 0, fromId);

      simulateModule.invalidateColoredLayerCache();
      refreshSlotThumbnails();
      updateOrderDisplay();
      refreshPreview();
      updateStatusText(`印刷顺序已更新：${state.printOrder.map(i => CN_NUMERALS[i]).join('→')}`);
    });
  });
}

function bindColorPickerEvents(): void {
  const options = document.querySelectorAll<HTMLElement>('.color-option');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const hex = opt.dataset.color;
      if (!hex) return;
      state.layerColors[state.activeSlotIndex] = hex;
      simulateModule.invalidateColoredLayerCache(state.activeSlotIndex);
      refreshSlotThumbnails();
      updateColorInfo();
      refreshPreview();
      const pig = PIGMENT_COLORS.find(p => p.hex === hex);
      updateStatusText(`已为版${CN_NUMERALS[state.activeSlotIndex]}选择颜料：${pig?.name ?? hex}`);
    });
  });
}

function bindBrushButtonEvents(): void {
  const btns = document.querySelectorAll<HTMLElement>('.brush-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = Number(btn.dataset.brush);
      if (size === 2 || size === 5 || size === 8) {
        designModule.setBrushSize(size);
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });
}

function bindSliderEvents(): void {
  const slider = $('opacitySlider') as HTMLInputElement | null;
  if (!slider) return;
  let debounceId: number | null = null;

  slider.addEventListener('input', () => {
    const val = Number(slider.value) / 100;
    state.globalOpacity = val;
    state.printOrder.forEach(id => {
      state.layerOpacities[id] = val;
    });
    const valueEl = $('opacityValue');
    if (valueEl) valueEl.textContent = `${slider.value}%`;

    if (debounceId !== null) clearTimeout(debounceId);
    debounceId = window.setTimeout(() => {
      simulateModule.invalidateColoredLayerCache();
      refreshPreview();
    }, 30);
  });
}

function bindControlButtons(): void {
  const simulateBtn = $('simulateBtn') as HTMLButtonElement | null;
  const resetBtn = $('resetBtn') as HTMLButtonElement | null;
  const designClose = $('designClose');
  const progressEl = $('scrollProgress');

  if (designClose) {
    designClose.addEventListener('click', closeDesignView);
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', () => {
      if (state.isSimulating) return;
      const anyContent = state.printOrder.some(id => {
        const l = designModule.getLayer(id);
        return l?.hasContent;
      });
      if (!anyContent) {
        updateStatusText('⚠ 请先设计至少一版雕版图案');
        return;
      }

      state.isSimulating = true;
      simulateBtn.disabled = true;
      if (resetBtn) resetBtn.disabled = true;
      if (progressEl) {
        progressEl.classList.add('visible');
        progressEl.textContent = '准备开始...';
      }

      simulateModule.startScrollAnimation({
        ...getSimulateOptions(),
        perLayerDuration: 2000,
        interLayerGap: 500,
        onProgress: (msg, stage) => {
          if (progressEl) progressEl.textContent = `[第${stage + 1}/4版] ${msg}`;
          updateStatusText(msg);
        },
        onComplete: () => {
          state.isSimulating = false;
          if (simulateBtn) simulateBtn.disabled = false;
          if (resetBtn) resetBtn.disabled = false;
          setTimeout(() => {
            if (progressEl) progressEl.classList.remove('visible');
          }, 1500);
          updateStatusText('✦ 套色印花模拟完成 ✦');
        }
      });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      simulateModule.cancelAnimation();
      state.isSimulating = false;
      if (simulateBtn) simulateBtn.disabled = false;
      resetBtn.disabled = false;
      if (progressEl) progressEl.classList.remove('visible');

      designModule.resetAllLayers();
      state.printOrder = [0, 1, 2, 3];
      state.layerColors = { 0: '#D4322E', 1: '#2E8B57', 2: '#4169E1', 3: '#DAA520' };
      state.globalOpacity = 0.8;
      state.printOrder.forEach(id => state.layerOpacities[id] = 0.8);

      simulateModule.invalidateColoredLayerCache();
      refreshSlotThumbnails();
      updateOrderDisplay();
      updateOpacitySliderUI();
      updateColorInfo();
      simulateModule.renderBlankCloth();
      updateStatusText('已重置，请重新设计雕版');
    });
  }
}

function bindKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.activeView === 'design') {
      closeDesignView();
    }
    if ((e.key === 'Enter' || e.key === ' ') && state.activeView === 'design' && e.target === document.body) {
      e.preventDefault();
      closeDesignView();
    }
    if (e.key >= '1' && e.key <= '4' && state.activeView === 'main') {
      const idx = Number(e.key) - 1;
      state.activeSlotIndex = idx;
      refreshSlotThumbnails();
      updateColorInfo();
      updateOpacitySliderUI();
    }
  });
}

function handleResponsiveLayout(): void {
  // CSS媒体查询处理主要响应式逻辑
  // JS可在此处理画布缩放等辅助逻辑
  refreshPreview();
}

function init(): void {
  designModule = new DesignModule({
    canvasId: 'designCanvas',
    onLayerUpdate: (layer: BlockLayer) => {
      simulateModule.invalidateColoredLayerCache(layer.id);
    }
  });

  simulateModule = new SimulateModule('mainCanvas');

  state.printOrder.forEach(id => state.layerOpacities[id] = state.globalOpacity);

  bindSlotEvents();
  bindColorPickerEvents();
  bindBrushButtonEvents();
  bindSliderEvents();
  bindControlButtons();
  bindKeyboardShortcuts();

  window.addEventListener('resize', () => {
    clearTimeout((window as any).__resizeTimer);
    (window as any).__resizeTimer = setTimeout(handleResponsiveLayout, 150);
  });

  refreshSlotThumbnails();
  updateOrderDisplay();
  updateOpacitySliderUI();
  updateColorInfo();
  updateStatusText('点击左侧槽位开始设计雕版 ✎');
  refreshPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
