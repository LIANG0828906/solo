import { CanvasEngine, Stroke } from './canvasEngine';

const MAX_HISTORY = 10;

export class ExportHandler {
  private engine: CanvasEngine;
  history: Stroke[][] = [];
  private historyIndex = -1;
  private currentSVG = '';
  private undoBtn: HTMLButtonElement | null = null;

  constructor(engine: CanvasEngine) {
    this.engine = engine;
  }

  saveHistory(): void {
    const current = this.engine.getStrokes();
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(current);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
    this.updateUndoButtonState();
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  undo(): void {
    if (!this.canUndo()) return;
    this.historyIndex--;
    const prev = this.history[this.historyIndex];
    if (prev) {
      this.engine.restoreStrokes(prev);
    } else {
      this.engine.clear();
    }
    this.updateUndoButtonState();
  }

  clear(): Promise<void> {
    this.saveHistory();
    return this.engine.clear(true);
  }

  exportSVG(): string {
    this.currentSVG = this.engine.toSVG();
    this.showModal();
    return this.currentSVG;
  }

  bindToolbar(container: HTMLElement): void {
    container.innerHTML = '';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'tool-btn';
    clearBtn.textContent = '清空画布';
    clearBtn.addEventListener('click', () => {
      this.clear();
    });

    const undoBtn = document.createElement('button');
    undoBtn.className = 'tool-btn';
    undoBtn.textContent = '撤销上一步';
    undoBtn.disabled = !this.canUndo();
    undoBtn.addEventListener('click', () => {
      this.undo();
    });
    this.undoBtn = undoBtn;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'tool-btn';
    saveBtn.textContent = '保存为 SVG';
    saveBtn.addEventListener('click', () => {
      this.exportSVG();
    });

    container.appendChild(clearBtn);
    container.appendChild(undoBtn);
    container.appendChild(saveBtn);

    this.engine.setOnChange(() => {
      this.updateUndoButtonState();
    });
  }

  private updateUndoButtonState(): void {
    if (this.undoBtn) {
      this.undoBtn.disabled = !this.canUndo();
    }
  }

  showModal(): void {
    const overlay = document.getElementById('modalOverlay');
    const preview = document.getElementById('modalPreview');
    const cancelBtn = document.getElementById('modalCancel');
    const downloadBtn = document.getElementById('modalDownload');

    if (!overlay || !preview || !cancelBtn || !downloadBtn) return;

    preview.innerHTML = this.currentSVG;

    overlay.classList.add('active');

    const closeModal = (): void => {
      overlay.classList.remove('active');
    };

    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    };

    downloadBtn.onclick = () => {
      this.downloadSVG();
      closeModal();
    };
  }

  downloadSVG(): void {
    const blob = new Blob([this.currentSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handwriting_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
