import { CanvasDrawing } from './canvas';
import { recognizeShape } from './recognizer';
import { SVGManager } from './svgManager';
import { UIPanel } from './uiPanel';
import { eventBus } from './eventBus';
import { ToolType } from './types';

const canvas = document.getElementById('drawCanvas') as HTMLCanvasElement;
const toolbar = document.getElementById('toolbar')!;
const canvasDrawing = new CanvasDrawing(canvas, eventBus);
const svgManager = new SVGManager();
const uiPanel = new UIPanel(svgManager);

let undoBadge: HTMLElement | null = null;
let redoBadge: HTMLElement | null = null;

function createToolbar(): void {
  const tools: { id: ToolType; label: string; icon: string }[] = [
    { id: 'pencil', label: '铅笔', icon: '✏️' },
    { id: 'eraser', label: '橡皮擦', icon: '🧹' },
  ];

  for (const tool of tools) {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn' + (tool.id === 'pencil' ? ' active' : '');
    btn.textContent = tool.icon;
    btn.title = tool.label;
    btn.dataset.tool = tool.id;
    btn.addEventListener('click', () => {
      toolbar.querySelectorAll('.toolbar-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      canvasDrawing.setTool(tool.id);
      canvas.style.cursor = tool.id === 'eraser' ? 'cell' : 'crosshair';
    });
    toolbar.appendChild(btn);
  }

  const divider = document.createElement('div');
  Object.assign(divider.style, {
    width: '1px',
    height: '28px',
    background: '#D0D0D0',
    margin: '0 4px',
  });
  toolbar.appendChild(divider);

  const undoBtn = document.createElement('button');
  undoBtn.className = 'toolbar-btn';
  undoBtn.innerHTML = '↩';
  undoBtn.title = '撤销 (Ctrl+Z)';
  undoBadge = document.createElement('span');
  undoBadge.className = 'badge';
  undoBadge.style.display = 'none';
  undoBtn.appendChild(undoBadge);
  undoBtn.addEventListener('click', () => {
    svgManager.undo();
  });
  toolbar.appendChild(undoBtn);

  const redoBtn = document.createElement('button');
  redoBtn.className = 'toolbar-btn';
  redoBtn.innerHTML = '↪';
  redoBtn.title = '重做 (Ctrl+Y)';
  redoBadge = document.createElement('span');
  redoBadge.className = 'badge';
  redoBadge.style.display = 'none';
  redoBtn.appendChild(redoBadge);
  redoBtn.addEventListener('click', () => {
    svgManager.redo();
  });
  toolbar.appendChild(redoBtn);

  const divider2 = document.createElement('div');
  Object.assign(divider2.style, {
    width: '1px',
    height: '28px',
    background: '#D0D0D0',
    margin: '0 4px',
  });
  toolbar.appendChild(divider2);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'toolbar-btn';
  clearBtn.textContent = '🗑';
  clearBtn.title = '清空画布';
  clearBtn.addEventListener('click', () => {
    canvasDrawing.clearCanvas();
    uiPanel.clearSelection();
  });
  toolbar.appendChild(clearBtn);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'toolbar-btn';
  exportBtn.textContent = '💾';
  exportBtn.title = '导出SVG';
  exportBtn.addEventListener('click', () => {
    svgManager.exportDownload();
  });
  toolbar.appendChild(exportBtn);

  updateBadges();
}

function updateBadges(): void {
  const undoCount = svgManager.getUndoCount();
  const redoCount = svgManager.getRedoCount();

  if (undoBadge) {
    if (undoCount > 0) {
      undoBadge.textContent = String(undoCount);
      undoBadge.style.display = 'flex';
    } else {
      undoBadge.style.display = 'none';
    }
  }

  if (redoBadge) {
    if (redoCount > 0) {
      redoBadge.textContent = String(redoCount);
      redoBadge.style.display = 'flex';
    } else {
      redoBadge.style.display = 'none';
    }
  }
}

eventBus.on('svg:updated', () => {
  updateBadges();
});

eventBus.on('stroke:complete', (stroke: any) => {
  if (stroke.points.length < 2) return;

  const shape = recognizeShape(stroke.points);
  svgManager.addShape(shape);
});

eventBus.on('stroke:removed', () => {
  updateBadges();
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      svgManager.undo();
    } else if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault();
      svgManager.redo();
    }
  }
});

createToolbar();
