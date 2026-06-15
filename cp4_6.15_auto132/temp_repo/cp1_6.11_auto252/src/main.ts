import { 
  createFurnaceState, 
  setTargetTemperature, 
  addHerb, 
  performAlchemy, 
  resetFurnace,
  updateFurnace,
  getAncientTime,
  type FurnaceState
} from './furnace';

import { 
  HERBS, 
  getElementName, 
  getElementClass,
  saveToLocalStorage,
  loadFromLocalStorage,
  type Herb,
  type AlchemyResult
} from './danfang';

import { 
  createRenderContext, 
  render, 
  resizeCanvas,
  getFurnaceDimensions,
  drawManualChart,
  type RenderContext
} from './render';

interface DragState {
  isDragging: boolean;
  herb: Herb | null;
  ghostElement: HTMLElement | null;
}

let furnaceState: FurnaceState;
let renderContext: RenderContext;
let dragState: DragState = {
  isDragging: false,
  herb: null,
  ghostElement: null
};

let lastTime = 0;
let animationId: number;

function init(): void {
  furnaceState = createFurnaceState();
  
  const canvas = document.getElementById('furnace-canvas') as HTMLCanvasElement;
  const rippleCanvas = document.getElementById('ripple-overlay') as HTMLCanvasElement;
  
  if (!canvas || !rippleCanvas) {
    console.error('Canvas elements not found');
    return;
  }
  
  renderContext = createRenderContext(canvas, rippleCanvas);
  
  setupHerbCabinet();
  setupEventListeners();
  updateUI();
  
  lastTime = performance.now();
  gameLoop(lastTime);
  
  window.addEventListener('resize', handleResize);
  handleResize();
}

function setupHerbCabinet(): void {
  const cabinet = document.getElementById('herb-cabinet');
  if (!cabinet) return;
  
  HERBS.forEach(herb => {
    const item = document.createElement('div');
    item.className = 'herb-item';
    item.draggable = true;
    item.dataset.herbId = herb.id;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'herb-name';
    nameSpan.textContent = herb.name;
    
    const elementSpan = document.createElement('span');
    elementSpan.className = `herb-element ${getElementClass(herb.element)}`;
    elementSpan.textContent = getElementName(herb.element);
    
    item.appendChild(nameSpan);
    item.appendChild(elementSpan);
    
    item.addEventListener('dragstart', (e) => handleDragStart(e, herb, item));
    item.addEventListener('dragend', handleDragEnd);
    
    cabinet.appendChild(item);
  });
}

function setupEventListeners(): void {
  const tempSlider = document.getElementById('temp-slider') as HTMLInputElement;
  const alchemyBtn = document.getElementById('alchemy-btn');
  const manualBtn = document.getElementById('manual-btn');
  const resultClose = document.getElementById('result-close');
  const canvas = document.getElementById('furnace-canvas') as HTMLCanvasElement;
  const rippleCanvas = document.getElementById('ripple-overlay') as HTMLCanvasElement;
  
  if (tempSlider) {
    tempSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      setTargetTemperature(furnaceState, value);
      updateTemperatureDisplay();
    });
  }
  
  if (alchemyBtn) {
    alchemyBtn.addEventListener('click', handleAlchemy);
  }
  
  if (manualBtn) {
    manualBtn.addEventListener('click', toggleManual);
  }
  
  if (resultClose) {
    resultClose.addEventListener('click', hideResult);
  }
  
  if (canvas) {
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);
  }
  
  if (rippleCanvas) {
    rippleCanvas.addEventListener('dragover', handleDragOver);
    rippleCanvas.addEventListener('dragleave', handleDragLeave);
    rippleCanvas.addEventListener('drop', handleDrop);
  }
  
  document.addEventListener('dragover', (e) => {
    if (dragState.isDragging) {
      e.preventDefault();
      updateDragGhost(e);
    }
  });
}

function handleDragStart(e: DragEvent, herb: Herb, element: HTMLElement): void {
  e.dataTransfer?.setData('text/plain', herb.id);
  e.dataTransfer!.effectAllowed = 'copy';
  
  dragState.isDragging = true;
  dragState.herb = herb;
  
  createDragGhost(herb.name, e.clientX, e.clientY);
  
  if (e.dataTransfer) {
    const blankCanvas = document.createElement('canvas');
    blankCanvas.width = 1;
    blankCanvas.height = 1;
    e.dataTransfer.setDragImage(blankCanvas, 0, 0);
  }
}

function handleDragEnd(e: DragEvent): void {
  dragState.isDragging = false;
  dragState.herb = null;
  removeDragGhost();
  
  const canvas = document.getElementById('furnace-canvas');
  canvas?.classList.remove('drag-over');
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
  
  const canvas = document.getElementById('furnace-canvas');
  canvas?.classList.add('drag-over');
  
  if (dragState.isDragging) {
    updateDragGhost(e);
  }
}

function handleDragLeave(e: DragEvent): void {
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (!relatedTarget || !relatedTarget.closest('#canvas-container')) {
    const canvas = document.getElementById('furnace-canvas');
    canvas?.classList.remove('drag-over');
  }
}

function handleDrop(e: DragEvent): void {
  e.preventDefault();
  
  const canvas = document.getElementById('furnace-canvas') as HTMLCanvasElement;
  canvas?.classList.remove('drag-over');
  
  const herbId = e.dataTransfer?.getData('text/plain');
  const herb = HERBS.find(h => h.id === herbId);
  
  if (!herb || !canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const dropX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const dropY = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  const startX = Math.max(0, Math.min(canvas.width, dropX - 100));
  const startY = 50;
  
  const dims = getFurnaceDimensions(renderContext);
  const targetX = dims.centerX + (Math.random() - 0.5) * dims.furnaceWidth * 0.3;
  const targetY = dims.liquidY;
  
  addHerb(furnaceState, herb, startX, startY, targetX, targetY);
  updateIngredientsList();
  
  dragState.isDragging = false;
  dragState.herb = null;
  removeDragGhost();
}

function createDragGhost(name: string, x: number, y: number): void {
  removeDragGhost();
  
  const ghost = document.createElement('div');
  ghost.id = 'drag-ghost';
  ghost.textContent = name;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  
  document.body.appendChild(ghost);
  dragState.ghostElement = ghost;
}

function updateDragGhost(e: DragEvent): void {
  if (dragState.ghostElement) {
    dragState.ghostElement.style.left = `${e.clientX}px`;
    dragState.ghostElement.style.top = `${e.clientY}px`;
  }
}

function removeDragGhost(): void {
  if (dragState.ghostElement) {
    dragState.ghostElement.remove();
    dragState.ghostElement = null;
  }
}

function handleAlchemy(): void {
  const result = performAlchemy(furnaceState);
  
  saveToLocalStorage(
    furnaceState.herbs, 
    furnaceState.temperature, 
    furnaceState.tempHistory,
    result
  );
  
  showResult(result);
  
  setTimeout(() => {
    resetFurnace(furnaceState);
    updateIngredientsList();
  }, 3000);
}

function showResult(result: AlchemyResult): void {
  const scroll = document.getElementById('result-scroll');
  const title = document.getElementById('result-title');
  const grade = document.getElementById('result-grade');
  const effect = document.getElementById('result-effect');
  const canvasContainer = document.getElementById('canvas-container');
  
  if (!scroll || !title || !grade || !effect || !canvasContainer) return;
  
  scroll.classList.remove('show');
  
  if (result.success) {
    title.textContent = '丹成';
    title.style.color = '#8B4513';
    
    const gradeNames: Record<string, string> = {
      fan: '凡品',
      ling: '灵品',
      xian: '仙品'
    };
    
    grade.textContent = `【${result.name}】${gradeNames[result.grade]}`;
    grade.className = `grade-${result.grade}`;
    effect.textContent = result.effect;
  } else {
    if (result.name === '炸炉') {
      title.textContent = '炸炉！';
      title.style.color = '#DC143C';
      canvasContainer.classList.add('shake');
      setTimeout(() => canvasContainer.classList.remove('shake'), 500);
    } else {
      title.textContent = '丹方失效';
      title.style.color = '#DC143C';
    }
    
    grade.textContent = '丹炉炸裂，丹方失效';
    grade.className = 'grade-fail';
    effect.textContent = result.reason || '';
  }
  
  requestAnimationFrame(() => {
    scroll.classList.add('show');
  });
}

function hideResult(): void {
  const scroll = document.getElementById('result-scroll');
  scroll?.classList.remove('show');
}

function toggleManual(): void {
  const scroll = document.getElementById('manual-scroll');
  if (!scroll) return;
  
  const isOpen = scroll.classList.contains('show');
  
  if (isOpen) {
    scroll.classList.remove('show');
  } else {
    loadManualData();
    scroll.classList.add('show');
  }
}

function loadManualData(): void {
  const entry = loadFromLocalStorage();
  const herbsEl = document.getElementById('manual-herbs');
  const canvas = document.getElementById('manual-canvas') as HTMLCanvasElement;
  
  if (!herbsEl || !canvas) return;
  
  if (!entry) {
    herbsEl.textContent = '暂无记录';
    drawManualChart(canvas, []);
    return;
  }
  
  const gradeNames: Record<string, string> = {
    fan: '凡品',
    ling: '灵品',
    xian: '仙品',
    fail: '失败'
  };
  
  let html = '';
  html += `<div>药材：${entry.herbs.join('、')}</div>`;
  html += `<div>炉温：${entry.temperature}°C</div>`;
  html += `<div>结果：${entry.result.name}（${gradeNames[entry.result.grade]}）</div>`;
  if (entry.result.effect) {
    html += `<div>功效：${entry.result.effect}</div>`;
  }
  
  herbsEl.innerHTML = html;
  drawManualChart(canvas, entry.tempHistory);
}

function updateUI(): void {
  updateTemperatureDisplay();
  updateTimeDisplay();
  updateIngredientsList();
  
  setTimeout(updateUI, 1000);
}

function updateTemperatureDisplay(): void {
  const display = document.getElementById('temperature-display');
  if (display) {
    display.textContent = Math.round(furnaceState.temperature).toString();
  }
}

function updateTimeDisplay(): void {
  const display = document.getElementById('time-display');
  if (display) {
    display.textContent = getAncientTime();
  }
}

function updateIngredientsList(): void {
  const list = document.getElementById('ingredients-list');
  if (!list) return;
  
  list.innerHTML = '';
  furnaceState.herbs.forEach(herb => {
    const item = document.createElement('div');
    item.className = 'ingredient-item';
    item.textContent = `${herb.name}（${getElementName(herb.element)}）`;
    list.appendChild(item);
  });
}

function handleResize(): void {
  const canvas = document.getElementById('furnace-canvas') as HTMLCanvasElement;
  const rippleCanvas = document.getElementById('ripple-overlay') as HTMLCanvasElement;
  
  if (canvas && rippleCanvas) {
    resizeCanvas(canvas, rippleCanvas);
    renderContext = createRenderContext(canvas, rippleCanvas);
  }
}

function gameLoop(currentTime: number): void {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  const dims = getFurnaceDimensions(renderContext);
  
  updateFurnace(
    furnaceState,
    dims.centerX,
    dims.centerY,
    dims.furnaceWidth,
    dims.liquidY,
    deltaTime
  );
  
  render(renderContext, furnaceState);
  
  animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', init);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
