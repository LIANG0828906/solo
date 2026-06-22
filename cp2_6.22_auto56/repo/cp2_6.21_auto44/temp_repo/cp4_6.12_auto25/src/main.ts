import { Editor } from './Editor';
import { Renderer } from './Renderer';
import { Preview } from './Preview';
import { ToolType } from './types';

class EventBus {
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }
}

const eventBus = new EventBus();

let editor: Editor;
let renderer: Renderer;
let preview: Preview;
let currentMode: 'editor' | 'preview' = 'editor';

const toolbarTools: { type: ToolType; label: string; icon: string }[] = [
  { type: ToolType.SELECT, label: '选择', icon: '👆' },
  { type: ToolType.GRASS, label: '草地', icon: '🌿' },
  { type: ToolType.DIRT, label: '土地', icon: '🟫' },
  { type: ToolType.STONE, label: '石墙', icon: '🧱' },
  { type: ToolType.COIN, label: '金币', icon: '🪙' },
  { type: ToolType.ENEMY, label: '敌人', icon: '🍄' },
  { type: ToolType.HEALTH, label: '生命', icon: '❤️' },
];

function init(): void {
  const editorCanvas = document.getElementById('editor-canvas') as HTMLCanvasElement;
  const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;

  editor = new Editor();
  renderer = new Renderer(editorCanvas, editor);
  preview = new Preview(previewCanvas);

  setupToolbar();
  setupCanvasEvents();
  setupButtons();
  setupKeyboardShortcuts();
  setupResizeHandler();

  renderer.startAnimation();

  eventBus.on('toolChanged', (tool: ToolType) => {
    editor.setTool(tool);
    updateToolbarUI(tool);
  });

  eventBus.on('editorUpdated', () => {
  });

  eventBus.on('previewStart', () => {
    if (!editor.canPreview()) {
      alert('所有敌人必须至少有3个路径点才能预览！');
      return;
    }
    switchToPreview();
  });

  eventBus.on('previewStop', () => {
    switchToEditor();
  });
}

function setupToolbar(): void {
  const toolbar = document.getElementById('toolbar-tools') as HTMLDivElement;
  if (!toolbar) return;

  toolbar.innerHTML = '';

  toolbarTools.forEach(tool => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.dataset.tool = tool.type;
    btn.innerHTML = `<span class="tool-icon">${tool.icon}</span><span class="tool-label">${tool.label}</span>`;
    btn.addEventListener('click', () => {
      eventBus.emit('toolChanged', tool.type);
    });
    toolbar.appendChild(btn);
  });

  updateToolbarUI(ToolType.SELECT);
}

function updateToolbarUI(activeTool: ToolType): void {
  const buttons = document.querySelectorAll('.tool-btn');
  buttons.forEach(btn => {
    if ((btn as HTMLElement).dataset.tool === activeTool) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setupCanvasEvents(): void {
  const canvas = renderer.getCanvas();

  canvas.addEventListener('mousemove', (e) => {
    if (currentMode !== 'editor') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    const tileSize = editor.getTileSize();
    const gridX = Math.floor(mouseX / tileSize);
    const gridY = Math.floor(mouseY / tileSize);

    if (gridX >= 0 && gridX < editor.getGridWidth() && gridY >= 0 && gridY < editor.getGridHeight()) {
      editor.setHoveredTile({ x: gridX, y: gridY });
    } else {
      editor.setHoveredTile(null);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    editor.setHoveredTile(null);
  });

  canvas.addEventListener('click', (e) => {
    if (currentMode !== 'editor') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    const tileSize = editor.getTileSize();
    const gridX = Math.floor(mouseX / tileSize);
    const gridY = Math.floor(mouseY / tileSize);

    editor.handleClick(gridX, gridY);
  });

  canvas.addEventListener('contextmenu', (e) => {
    if (currentMode !== 'editor') return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    const tileSize = editor.getTileSize();
    const gridX = Math.floor(mouseX / tileSize);
    const gridY = Math.floor(mouseY / tileSize);

    editor.handleRightClick(gridX, gridY);
  });
}

function setupButtons(): void {
  const previewBtn = document.getElementById('btn-preview');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      eventBus.emit('previewStart');
    });
  }

  const backBtn = document.getElementById('btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      eventBus.emit('previewStop');
    });
  }

  const saveBtn = document.getElementById('btn-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      editor.saveToLocalStorage();
    });
  }

  const loadBtn = document.getElementById('btn-load');
  if (loadBtn) {
    loadBtn.addEventListener('click', () => {
      editor.loadFromLocalStorage();
    });
  }

  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const level = editor.exportLevel();
      const json = JSON.stringify(level, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        alert('关卡JSON已复制到剪贴板！');
      }).catch(() => {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'level.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }
}

function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    if (currentMode !== 'editor') return;
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      editor.undo();
    }

    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case '1': eventBus.emit('toolChanged', ToolType.SELECT); break;
        case '2': eventBus.emit('toolChanged', ToolType.GRASS); break;
        case '3': eventBus.emit('toolChanged', ToolType.DIRT); break;
        case '4': eventBus.emit('toolChanged', ToolType.STONE); break;
        case '5': eventBus.emit('toolChanged', ToolType.COIN); break;
        case '6': eventBus.emit('toolChanged', ToolType.ENEMY); break;
        case '7': eventBus.emit('toolChanged', ToolType.HEALTH); break;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (currentMode === 'preview' && e.key === 'Escape') {
      eventBus.emit('previewStop');
    }
  });
}

function setupResizeHandler(): void {
  const handleResize = () => {
    const isNarrow = window.innerWidth < 850;
    const container = document.querySelector('.app-container');
    if (container) {
      if (isNarrow) {
        container.classList.add('narrow');
      } else {
        container.classList.remove('narrow');
      }
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();
}

function switchToPreview(): void {
  const editorContainer = document.querySelector('.editor-container') as HTMLElement;
  const previewContainer = document.querySelector('.preview-container') as HTMLElement;
  const toolbar = document.querySelector('.toolbar') as HTMLElement;

  if (editorContainer) {
    editorContainer.style.opacity = '0';
    editorContainer.style.transition = 'opacity 0.3s ease-out';
  }
  if (toolbar) {
    toolbar.style.opacity = '0';
    toolbar.style.transition = 'opacity 0.3s ease-out';
  }

  setTimeout(() => {
    if (editorContainer) editorContainer.style.display = 'none';
    if (toolbar) toolbar.style.display = 'none';
    if (previewContainer) {
      previewContainer.style.display = 'flex';
      previewContainer.style.opacity = '0';
      requestAnimationFrame(() => {
        previewContainer.style.opacity = '1';
        previewContainer.style.transition = 'opacity 0.3s ease-out';
      });
    }

    const level = editor.exportLevel();
    preview.start(level);
    currentMode = 'preview';
  }, 300);
}

function switchToEditor(): void {
  const editorContainer = document.querySelector('.editor-container') as HTMLElement;
  const previewContainer = document.querySelector('.preview-container') as HTMLElement;
  const toolbar = document.querySelector('.toolbar') as HTMLElement;

  preview.stop();
  currentMode = 'editor';

  if (previewContainer) {
    previewContainer.style.opacity = '0';
    previewContainer.style.transition = 'opacity 0.3s ease-out';
  }

  setTimeout(() => {
    if (previewContainer) previewContainer.style.display = 'none';
    if (editorContainer) {
      editorContainer.style.display = 'flex';
      editorContainer.style.opacity = '0';
      requestAnimationFrame(() => {
        editorContainer.style.opacity = '1';
        editorContainer.style.transition = 'opacity 0.3s ease-out';
      });
    }
    if (toolbar) {
      toolbar.style.display = 'flex';
      toolbar.style.opacity = '0';
      requestAnimationFrame(() => {
        toolbar.style.opacity = '1';
        toolbar.style.transition = 'opacity 0.3s ease-out';
      });
    }
  }, 300);
}

document.addEventListener('DOMContentLoaded', init);
