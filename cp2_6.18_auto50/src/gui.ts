import GUI from 'lil-gui';
import { PRESET_COLORS, GRID_SIZE } from './sceneManager';
import type { EditMode } from './interaction';

export interface GUIState {
  color: string;
  brushSize: number;
  mode: EditMode;
}

export interface GUIActions {
  onClearScene: () => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onModeChange: (mode: EditMode) => void;
}

export class GUIManager {
  private gui: GUI;
  private state: GUIState;
  private actions: GUIActions;
  private infoController?: { voxelCount: string };

  constructor(state: GUIState, actions: GUIActions) {
    this.state = state;
    this.actions = actions;

    this.gui = new GUI({
      title: 'VoxelForge',
      width: 220,
      container: document.body
    });

    this.applyCustomStyles();
    this.buildPanel();
  }

  private applyCustomStyles(): void {
    const rootEl = this.gui.domElement;
    rootEl.style.position = 'absolute';
    rootEl.style.top = '12px';
    rootEl.style.left = '12px';
    rootEl.style.background = '#222222';
    rootEl.style.borderRadius = '8px';
    rootEl.style.padding = '0';
    rootEl.style.color = '#EEEEEE';
    rootEl.style.fontSize = '14px';
    rootEl.style.fontFamily = "'Consolas', 'Monaco', 'Courier New', monospace";
    rootEl.style.overflow = 'hidden';
    rootEl.style.zIndex = '1000';
    rootEl.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';

    const styleId = 'voxelforge-gui-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .lil-gui {
          --background-color: #222222 !important;
          --widget-color: #333333 !important;
          --focus-color: #444444 !important;
          --hover-color: #3a3a3a !important;
          --text-color: #EEEEEE !important;
          --title-background-color: #2a2a2a !important;
          --title-text-color: #FFFFFF !important;
          --number-color: #5AC8FA !important;
          --string-color: #34C759 !important;
          --font-size: 14px !important;
          --input-font-size: 13px !important;
          --padding: 8px !important;
          --spacing: 6px !important;
          --widget-height: 26px !important;
          --name-width: 40% !important;
          --slider-knob-width: 12px !important;
        }
        .lil-gui .title {
          background: linear-gradient(90deg, #2a2a2a, #333333) !important;
          padding: 10px 12px !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          letter-spacing: 0.5px !important;
          border-bottom: 1px solid #333 !important;
        }
        .lil-gui .controller {
          padding: 6px 12px !important;
          min-height: 34px !important;
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
          transition: background-color 0.15s ease;
        }
        .lil-gui .controller:hover {
          background: rgba(255,255,255,0.03) !important;
        }
        .lil-gui .controller.name {
          color: #CCCCCC !important;
          font-size: 13px !important;
        }
        .lil-gui .controller.boolean .widget,
        .lil-gui .controller.option .widget {
          cursor: pointer;
        }
        .lil-gui .controller.button .widget {
          border-radius: 6px !important;
          background: linear-gradient(180deg, #444, #3a3a3a) !important;
          transition: all 0.15s ease !important;
          border: 1px solid #555 !important;
          color: #fff !important;
        }
        .lil-gui .controller.button .widget:hover {
          background: linear-gradient(180deg, #555, #4a4a4a) !important;
          border-color: #666 !important;
        }
        .lil-gui .slider {
          border-radius: 13px !important;
          background: #1a1a1a !important;
        }
        .lil-gui .slider > .fill {
          background: linear-gradient(90deg, #007AFF, #5AC8FA) !important;
          border-radius: 13px !important;
        }
        .lil-gui .slider > .knob {
          background: #fff !important;
          border: 2px solid #007AFF !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3) !important;
        }
        .lil-gui .children {
          padding: 0 !important;
          border-top: none !important;
        }
        .lil-gui.root.closed {
          min-height: 40px !important;
        }
        .color-swatch-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          padding: 8px 12px 12px;
        }
        .color-swatch {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 6px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.15s ease;
          box-sizing: border-box;
          position: relative;
        }
        .color-swatch:hover {
          transform: scale(1.1);
          z-index: 10;
        }
        .color-swatch.selected {
          border-color: #FFFFFF;
          box-shadow: 0 0 0 2px #007AFF, 0 2px 8px rgba(0,0,0,0.4);
        }
        .section-label {
          padding: 10px 12px 4px;
          font-size: 12px;
          font-weight: 600;
          color: #888888;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .info-display {
          padding: 8px 12px 12px;
          font-size: 12px;
          color: #999;
        }
        .info-display .stat {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .info-display .stat-value {
          color: #5AC8FA;
          font-weight: 600;
        }
        .clear-btn {
          margin: 8px 12px 12px;
          width: calc(100% - 24px);
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          background: linear-gradient(180deg, #FF3B30, #D70015);
          color: #fff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(255,59,48,0.3);
        }
        .clear-btn:hover {
          background: linear-gradient(180deg, #FF5A50, #E91025);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,59,48,0.4);
        }
        .clear-btn:active {
          transform: translateY(0);
        }
        .mode-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 8px 12px 12px;
        }
        .mode-btn {
          padding: 8px 4px;
          border: 1px solid #444;
          border-radius: 6px;
          background: #333;
          color: #ccc;
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }
        .mode-btn:hover {
          background: #3d3d3d;
          border-color: #555;
        }
        .mode-btn.active-place {
          background: linear-gradient(180deg, #34C759, #28A745);
          color: #fff;
          border-color: #34C759;
        }
        .mode-btn.active-remove {
          background: linear-gradient(180deg, #FF3B30, #D70015);
          color: #fff;
          border-color: #FF3B30;
        }
        .mode-btn.active-view {
          background: linear-gradient(180deg, #007AFF, #0056CC);
          color: #fff;
          border-color: #007AFF;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private buildPanel(): void {
    this.addColorPicker();
    this.addBrushSizeSlider();
    this.addModeButtons();
    this.addClearButton();
    this.addInfoDisplay();
  }

  private addColorPicker(): void {
    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '方块颜色';
    this.gui.domElement.querySelector('.children')?.appendChild(label);

    const container = document.createElement('div');
    container.className = 'color-swatch-container';

    PRESET_COLORS.forEach((color) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      if (color === this.state.color) {
        swatch.classList.add('selected');
      }
      swatch.style.background = color;
      swatch.dataset.color = color;
      swatch.title = color;

      swatch.addEventListener('click', () => {
        this.state.color = color;
        container.querySelectorAll('.color-swatch').forEach(el => {
          el.classList.remove('selected');
        });
        swatch.classList.add('selected');
        this.actions.onColorChange(color);
      });

      container.appendChild(swatch);
    });

    this.gui.domElement.querySelector('.children')?.appendChild(container);
  }

  private addBrushSizeSlider(): void {
    this.gui.add(this.state, 'brushSize', 1, 5, 1)
      .name('画刷大小')
      .onChange((value: number) => {
        this.actions.onBrushSizeChange(Math.round(value));
      });
  }

  private addModeButtons(): void {
    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '编辑模式';
    this.gui.domElement.querySelector('.children')?.appendChild(label);

    const container = document.createElement('div');
    container.className = 'mode-buttons';

    const modes: { key: EditMode; label: string }[] = [
      { key: 'place', label: '放置' },
      { key: 'remove', label: '移除' },
      { key: 'view', label: '查看' }
    ];

    modes.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.textContent = label;
      btn.dataset.mode = key;

      if (key === this.state.mode) {
        btn.classList.add(`active-${key}`);
      }

      btn.addEventListener('click', () => {
        this.state.mode = key;
        container.querySelectorAll('.mode-btn').forEach(el => {
          el.classList.remove('active-place', 'active-remove', 'active-view');
        });
        btn.classList.add(`active-${key}`);
        this.actions.onModeChange(key);
      });

      container.appendChild(btn);
    });

    this.gui.domElement.querySelector('.children')?.appendChild(container);
  }

  private addClearButton(): void {
    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '场景操作';
    this.gui.domElement.querySelector('.children')?.appendChild(label);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-btn';
    clearBtn.textContent = '🗑 清空场景（保留地面）';
    clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有已放置的方块吗？')) {
        this.actions.onClearScene();
      }
    });
    this.gui.domElement.querySelector('.children')?.appendChild(clearBtn);
  }

  private addInfoDisplay(): void {
    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '信息统计';
    this.gui.domElement.querySelector('.children')?.appendChild(label);

    const info = document.createElement('div');
    info.className = 'info-display';
    info.innerHTML = `
      <div class="stat">
        <span>网格大小</span>
        <span class="stat-value">${GRID_SIZE}×${GRID_SIZE}×${GRID_SIZE}</span>
      </div>
      <div class="stat">
        <span>当前方块数</span>
        <span class="stat-value" id="voxel-count-stat">${GRID_SIZE * GRID_SIZE}</span>
      </div>
      <div class="stat">
        <span>最大方块数</span>
        <span class="stat-value">8000</span>
      </div>
    `;
    this.gui.domElement.querySelector('.children')?.appendChild(info);
  }

  public updateVoxelCount(count: number): void {
    const el = document.getElementById('voxel-count-stat');
    if (el) {
      el.textContent = count.toString();
    }
  }

  public dispose(): void {
    this.gui.destroy();
  }
}
