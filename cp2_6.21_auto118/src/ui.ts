import { COLOR_LIST } from './config';
import { grid } from './grid';
import { interaction } from './interaction';
import { getScene, CameraView } from './scene';

class UIManager {
  private toolbar: HTMLDivElement | null = null;
  private colorButtons: HTMLButtonElement[] = [];
  private currentColor: string = '#ff4444';
  private countEl: HTMLSpanElement | null = null;
  private viewSelect: HTMLSelectElement | null = null;
  private modeIndicator: HTMLDivElement | null = null;

  init(container: HTMLElement): void {
    this.createToolbar(container);
    this.bindEvents();

    grid.onCountChange(this.updateCount);
    this.updateCount(grid.getCount());
  }

  private createToolbar(container: HTMLElement): void {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'voxel-toolbar';
    this.toolbar.style.cssText = `
      position: absolute;
      left: 20px;
      top: 20px;
      width: 220px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      color: white;
      font-size: 13px;
      z-index: 10;
      user-select: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const title = document.createElement('div');
    title.textContent = '积木搭建';
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 14px;
      color: #fff;
      letter-spacing: 0.5px;
    `;
    this.toolbar.appendChild(title);

    this.modeIndicator = document.createElement('div');
    this.modeIndicator.className = 'mode-indicator';
    this.modeIndicator.textContent = '当前模式：放置';
    this.modeIndicator.style.cssText = `
      padding: 6px 10px;
      background: rgba(68, 204, 68, 0.2);
      border: 1px solid rgba(68, 204, 68, 0.4);
      border-radius: 6px;
      margin-bottom: 14px;
      font-size: 12px;
      color: #44cc44;
      text-align: center;
      transition: all 0.2s ease;
    `;
    this.toolbar.appendChild(this.modeIndicator);

    const colorLabel = document.createElement('div');
    colorLabel.textContent = '颜色选择';
    colorLabel.style.cssText = `
      font-size: 12px;
      color: #aaa;
      margin-bottom: 8px;
    `;
    this.toolbar.appendChild(colorLabel);

    const colorPalette = document.createElement('div');
    colorPalette.className = 'color-palette';
    colorPalette.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    `;

    for (const color of COLOR_LIST) {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.dataset.color = color.value;
      btn.style.cssText = `
        width: 28px;
        height: 28px;
        border: 2px solid transparent;
        border-radius: 50%;
        background: ${color.value};
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      `;

      if (color.value === this.currentColor) {
        btn.style.borderColor = '#fff';
        btn.style.transform = 'scale(1.1)';
      }

      btn.addEventListener('click', () => this.selectColor(color.value, btn));
      colorPalette.appendChild(btn);
      this.colorButtons.push(btn);
    }
    this.toolbar.appendChild(colorPalette);

    const btnRow1 = document.createElement('div');
    btnRow1.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    `;

    const undoBtn = this.createToolButton('撤销', '↶');
    undoBtn.addEventListener('click', () => interaction.undo());
    btnRow1.appendChild(undoBtn);

    const redoBtn = this.createToolButton('重做', '↷');
    redoBtn.addEventListener('click', () => interaction.redo());
    btnRow1.appendChild(redoBtn);

    this.toolbar.appendChild(btnRow1);

    const clearBtn = this.createToolButton('清空场景', '🗑', true);
    clearBtn.style.width = '100%';
    clearBtn.style.marginBottom = '14px';
    clearBtn.addEventListener('click', () => this.handleClear());
    this.toolbar.appendChild(clearBtn);

    const viewLabel = document.createElement('div');
    viewLabel.textContent = '视角切换';
    viewLabel.style.cssText = `
      font-size: 12px;
      color: #aaa;
      margin-bottom: 8px;
    `;
    this.toolbar.appendChild(viewLabel);

    this.viewSelect = document.createElement('select');
    this.viewSelect.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      margin-bottom: 16px;
      outline: none;
    `;

    const viewOptions: { value: CameraView; label: string }[] = [
      { value: 'free', label: '自由视角' },
      { value: 'front', label: '正视图' },
      { value: 'side', label: '侧视图' },
      { value: 'top', label: '俯视图' },
      { value: 'perspective', label: '透视图' },
      { value: 'bookmark', label: '自定义书签' }
    ];

    for (const opt of viewOptions) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      this.viewSelect.appendChild(option);
    }

    this.viewSelect.addEventListener('change', (e) => {
      const scene = getScene();
      if (scene) {
        scene.setView((e.target as HTMLSelectElement).value as CameraView);
      }
    });
    this.toolbar.appendChild(this.viewSelect);

    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin-bottom: 12px;
    `;
    this.toolbar.appendChild(divider);

    const countRow = document.createElement('div');
    countRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const countLabel = document.createElement('span');
    countLabel.textContent = '方块数量';
    countLabel.style.cssText = `
      font-size: 12px;
      color: #888;
    `;

    this.countEl = document.createElement('span');
    this.countEl.className = 'voxel-count';
    this.countEl.textContent = '0';
    this.countEl.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    `;

    countRow.appendChild(countLabel);
    countRow.appendChild(this.countEl);
    this.toolbar.appendChild(countRow);

    const hint = document.createElement('div');
    hint.textContent = 'R键切换模式 · 拖拽旋转 · 滚轮缩放';
    hint.style.cssText = `
      font-size: 11px;
      color: #666;
      text-align: center;
      margin-top: 12px;
      line-height: 1.5;
    `;
    this.toolbar.appendChild(hint);

    container.appendChild(this.toolbar);
  }

  private createToolButton(label: string, icon: string, isDanger: boolean = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = `<span style="margin-right: 6px;">${icon}</span>${label}`;
    const bgColor = isDanger ? 'rgba(255, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    const borderColor = isDanger ? 'rgba(255, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.2)';
    const hoverBg = isDanger ? 'rgba(255, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.2)';
    const textColor = isDanger ? '#ff6b6b' : '#fff';

    btn.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      background: ${bgColor};
      color: ${textColor};
      border: 1px solid ${borderColor};
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = hoverBg;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = bgColor;
    });

    return btn;
  }

  private selectColor(color: string, btn: HTMLButtonElement): void {
    this.currentColor = color;
    interaction.setColor(color);

    for (const b of this.colorButtons) {
      b.style.borderColor = 'transparent';
      b.style.transform = 'scale(1)';
    }
    btn.style.borderColor = '#fff';
    btn.style.transform = 'scale(1.1)';
  }

  private handleClear(): void {
    if (grid.getCount() === 0) return;

    if (confirm('确定要清空所有方块吗？此操作可以撤销。')) {
      interaction.clearAll();
    }
  }

  private updateCount = (count: number): void => {
    if (this.countEl) {
      this.countEl.textContent = count.toString();
    }
  };

  private bindEvents(): void {
    interaction.onModeChange((mode) => {
      if (this.modeIndicator) {
        if (mode === 'place') {
          this.modeIndicator.textContent = '当前模式：放置';
          this.modeIndicator.style.background = 'rgba(68, 204, 68, 0.2)';
          this.modeIndicator.style.borderColor = 'rgba(68, 204, 68, 0.4)';
          this.modeIndicator.style.color = '#44cc44';
        } else {
          this.modeIndicator.textContent = '当前模式：移除 (框选批量删除)';
          this.modeIndicator.style.background = 'rgba(255, 68, 68, 0.2)';
          this.modeIndicator.style.borderColor = 'rgba(255, 68, 68, 0.4)';
          this.modeIndicator.style.color = '#ff6b6b';
        }
      }
    });
  }
}

export const ui = new UIManager();
