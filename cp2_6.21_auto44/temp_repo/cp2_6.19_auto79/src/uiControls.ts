import type {
  CellData,
  NumericFeature,
  AxisMapping,
  SelectionStats
} from './types';
import { FEATURE_LABELS } from './types';

interface UIControlsOptions {
  onAxisChange: (mapping: Partial<AxisMapping>) => void;
  onClearSelection: () => void;
}

export class UIControls {
  private container: HTMLElement;
  private options: UIControlsOptions;
  private axisMapping: AxisMapping = {
    x: 'diameter',
    y: 'fluorescence',
    z: 'viability'
  };

  private leftPanel!: HTMLElement;
  private rightPanel!: HTMLElement;
  private hoverTooltip!: HTMLElement;
  private modal!: HTMLElement;
  private modalBackdrop!: HTMLElement;
  private hamburger!: HTMLElement;
  private leftDrawerOverlay!: HTMLElement;
  private rightDrawerOverlay!: HTMLElement;

  private statsContent!: HTMLElement;
  private cellListContent!: HTMLElement;

  constructor(container: HTMLElement, options: UIControlsOptions) {
    this.container = container;
    this.options = options;
    this.createLayout();
    this.createLoadingOverlay();
    this.bindGlobalEvents();
  }

  private createLayout(): void {
    this.container.style.cssText = `
      display: flex;
      width: 100vw;
      height: 100vh;
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    `;

    this.hamburger = document.createElement('div');
    this.hamburger.className = 'hamburger-menu';
    this.hamburger.innerHTML = `
      <div></div>
      <div></div>
      <div></div>
    `;
    this.hamburger.style.cssText = `
      display: none;
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      cursor: pointer;
      padding: 10px;
      background: rgba(22, 33, 62, 0.9);
      border-radius: 8px;
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    `;
    this.hamburger.querySelectorAll('div').forEach((div) => {
      div.style.cssText = `
        width: 24px;
        height: 2px;
        background: #e0e0e0;
        margin: 5px 0;
        transition: all 0.2s ease;
      `;
    });
    this.hamburger.addEventListener('click', () => this.toggleLeftPanel());
    this.container.appendChild(this.hamburger);

    this.createLeftPanel();
    this.createRightPanel();
    this.createCanvasContainer();
    this.createHoverTooltip();
    this.createModal();
    this.createResponsiveListeners();
  }

  private createLeftPanel(): void {
    this.leftPanel = document.createElement('div');
    this.leftPanel.className = 'left-panel';
    this.leftPanel.style.cssText = `
      width: 280px;
      background: #16213e;
      padding: 20px;
      box-sizing: border-box;
      border-radius: 10px;
      margin: 10px;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex-shrink: 0;
      transition: transform 0.3s ease;
      overflow-y: auto;
    `;

    const title = document.createElement('h2');
    title.textContent = '轴映射控制';
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #e0e0e0;
    `;
    this.leftPanel.appendChild(title);

    const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
    const axisLabels = { x: 'X 轴', y: 'Y 轴', z: 'Z 轴' };

    axes.forEach((axis, index) => {
      if (index > 0) {
        const divider = document.createElement('div');
        divider.style.cssText = `
          height: 1px;
          background: #0f3460;
          margin: 4px 0;
        `;
        this.leftPanel.appendChild(divider);
      }

      const group = document.createElement('div');
      group.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;

      const label = document.createElement('label');
      label.textContent = axisLabels[axis];
      label.style.cssText = `
        font-size: 14px;
        color: #b0b0c0;
      `;
      group.appendChild(label);

      const select = document.createElement('select');
      select.dataset.axis = axis;
      select.style.cssText = `
        background: #0f3460;
        color: #e0e0e0;
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 10px 12px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
      `;

      const features: NumericFeature[] = ['diameter', 'fluorescence', 'viability'];
      features.forEach((feature) => {
        const option = document.createElement('option');
        option.value = feature;
        option.textContent = FEATURE_LABELS[feature];
        if (this.axisMapping[axis] === feature) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const axis = target.dataset.axis as 'x' | 'y' | 'z';
        const value = target.value as NumericFeature;
        this.axisMapping[axis] = value;
        this.options.onAxisChange({ [axis]: value });
      });

      const style = document.createElement('style');
      style.textContent = `
        select:hover {
          border-color: #e94560 !important;
        }
        select option:hover {
          text-decoration: underline;
        }
      `;
      group.appendChild(style);
      group.appendChild(select);
      this.leftPanel.appendChild(group);
    });

    const hintDivider = document.createElement('div');
    hintDivider.style.cssText = `
      height: 1px;
      background: #0f3460;
      margin: 4px 0;
    `;
    this.leftPanel.appendChild(hintDivider);

    const hint = document.createElement('div');
    hint.innerHTML = `
      <strong style="color: #e94560;">操作提示</strong>
      <ul style="margin: 8px 0 0 16px; padding: 0; font-size: 12px; color: #a0a0b0; line-height: 1.8;">
        <li>拖拽旋转场景视角</li>
        <li>滚轮缩放视图</li>
        <li>Shift+拖拽框选细胞</li>
        <li>ESC 取消选择</li>
        <li>点击查看细胞详情</li>
      </ul>
    `;
    hint.style.cssText = `
      padding: 12px;
      background: rgba(15, 52, 96, 0.5);
      border-radius: 6px;
    `;
    this.leftPanel.appendChild(hint);

    this.leftDrawerOverlay = document.createElement('div');
    this.leftDrawerOverlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
      transition: opacity 0.3s ease;
    `;
    this.leftDrawerOverlay.addEventListener('click', () => this.toggleLeftPanel());

    this.container.appendChild(this.leftDrawerOverlay);
    this.container.appendChild(this.leftPanel);
  }

  private createRightPanel(): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      margin: 10px;
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '✕';
    toggleBtn.title = '收起统计面板';
    toggleBtn.style.cssText = `
      align-self: flex-end;
      background: #16213e;
      color: #e0e0e0;
      border: none;
      border-radius: 6px 6px 0 0;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      margin-bottom: -1px;
    `;
    toggleBtn.addEventListener('mouseenter', () => {
      toggleBtn.style.background = '#e94560';
    });
    toggleBtn.addEventListener('mouseleave', () => {
      toggleBtn.style.background = '#16213e';
    });

    this.rightPanel = document.createElement('div');
    this.rightPanel.className = 'right-panel';
    this.rightPanel.style.cssText = `
      width: 300px;
      background: #16213e;
      padding: 20px;
      box-sizing: border-box;
      border-radius: 10px;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.3s ease;
      overflow: hidden;
      max-height: calc(100vh - 40px);
    `;

    const title = document.createElement('h2');
    title.textContent = '选择统计';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #e0e0e0;
    `;
    this.rightPanel.appendChild(title);

    this.statsContent = document.createElement('div');
    this.statsContent.innerHTML = `
      <div style="color: #808090; text-align: center; padding: 40px 20px;">
        按住 Shift 键拖拽<br>框选细胞进行统计
      </div>
    `;
    this.statsContent.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    this.rightPanel.appendChild(this.statsContent);

    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 1px;
      background: #0f3460;
    `;
    this.rightPanel.appendChild(divider);

    const listTitle = document.createElement('h3');
    listTitle.textContent = '选中细胞列表';
    listTitle.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #b0b0c0;
    `;
    this.rightPanel.appendChild(listTitle);

    this.cellListContent = document.createElement('div');
    this.cellListContent.style.cssText = `
      flex: 1;
      overflow-y: auto;
      min-height: 150px;
      max-height: 300px;
      padding-right: 4px;
    `;
    this.rightPanel.appendChild(this.cellListContent);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清除选择';
    clearBtn.style.cssText = `
      width: 100%;
      background: linear-gradient(135deg, #e94560, #0f3460);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.transform = 'translateY(-2px)';
      clearBtn.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.4)';
    });
    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.transform = 'translateY(0)';
      clearBtn.style.boxShadow = 'none';
    });
    clearBtn.addEventListener('click', () => {
      this.options.onClearSelection();
    });
    this.rightPanel.appendChild(clearBtn);

    toggleBtn.addEventListener('click', () => this.toggleRightPanel());
    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(this.rightPanel);

    this.rightDrawerOverlay = document.createElement('div');
    this.rightDrawerOverlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
      transition: opacity 0.3s ease;
    `;
    this.rightDrawerOverlay.addEventListener('click', () => this.toggleRightPanel());

    this.container.appendChild(this.rightDrawerOverlay);
    this.container.appendChild(wrapper);
  }

  private createCanvasContainer(): void {
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'canvas-container';
    canvasContainer.style.cssText = `
      flex: 1;
      position: relative;
      min-width: 0;
    `;
    this.container.appendChild(canvasContainer);
  }

  private createHoverTooltip(): void {
    this.hoverTooltip = document.createElement('div');
    this.hoverTooltip.className = 'hover-tooltip';
    this.hoverTooltip.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #e0e0e0;
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', monospace;
      line-height: 1.8;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 100;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    document.body.appendChild(this.hoverTooltip);
  }

  private createModal(): void {
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    this.modal = document.createElement('div');
    this.modal.className = 'cell-modal';
    this.modal.style.cssText = `
      background: rgba(22, 33, 62, 0.95);
      border-radius: 16px;
      padding: 32px;
      min-width: 360px;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    `;

    const title = document.createElement('h2');
    title.textContent = '细胞详情';
    title.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #e0e0e0;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #808090;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = '#e94560';
      closeBtn.style.background = 'rgba(233, 69, 96, 0.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = '#808090';
      closeBtn.style.background = 'none';
    });
    closeBtn.addEventListener('click', () => this.closeModal());

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.modal.appendChild(header);

    const content = document.createElement('div');
    content.id = 'modal-content';
    content.style.cssText = `
      font-size: 14px;
      line-height: 2;
    `;
    this.modal.appendChild(content);

    this.modalBackdrop.appendChild(this.modal);
    this.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.modalBackdrop) {
        this.closeModal();
      }
    });
    document.body.appendChild(this.modalBackdrop);
  }

  private createLoadingOverlay(): void {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      transition: opacity 0.5s ease;
    `;

    const loadingCanvas = document.createElement('canvas');
    loadingCanvas.id = 'loading-canvas';
    loadingCanvas.width = 100;
    loadingCanvas.height = 100;
    overlay.appendChild(loadingCanvas);

    const text = document.createElement('div');
    text.textContent = '加载数据中...';
    text.style.cssText = `
      position: absolute;
      color: #e0e0e0;
      font-size: 14px;
      margin-top: 120px;
    `;
    overlay.appendChild(text);

    document.body.appendChild(overlay);
    this.animateLoadingRing(loadingCanvas);
  }

  private animateLoadingRing(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    let rotation = 0;

    const animate = () => {
      const overlay = document.getElementById('loading-overlay');
      if (!overlay) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation);

      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.restore();
      rotation += 0.05;

      if (overlay.style.display !== 'none') {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  public hideLoading(): void {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 500);
    }
  }

  public showHoverTooltip(cell: CellData | null): void {
    if (!cell) {
      this.hoverTooltip.style.opacity = '0';
      return;
    }

    this.hoverTooltip.innerHTML = `
      <div style="color: #e94560; font-weight: 600; margin-bottom: 8px;">
        细胞 #${cell.id} · ${cell.cellType}
      </div>
      <div><span style="color: #808090;">直径:</span> ${cell.diameter.toFixed(1)} μm</div>
      <div><span style="color: #808090;">荧光强度:</span> ${cell.fluorescence.toFixed(0)}</div>
      <div><span style="color: #808090;">活性标记:</span> ${cell.viability.toFixed(1)}%</div>
    `;
    this.hoverTooltip.style.opacity = '1';
  }

  public showModal(cell: CellData): void {
    const content = document.getElementById('modal-content')!;
    content.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #0f3460;">
          <td style="padding: 12px 0; color: #808090;">细胞ID</td>
          <td style="padding: 12px 0; color: #e0e0e0; font-weight: 600;">#${cell.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #0f3460;">
          <td style="padding: 12px 0; color: #808090;">细胞类型</td>
          <td style="padding: 12px 0; color: #e94560; font-weight: 600;">${cell.cellType}</td>
        </tr>
        <tr style="border-bottom: 1px solid #0f3460;">
          <td style="padding: 12px 0; color: #808090;">细胞直径</td>
          <td style="padding: 12px 0; color: #e0e0e0; font-family: 'Consolas', monospace;">${cell.diameter.toFixed(2)} μm</td>
        </tr>
        <tr style="border-bottom: 1px solid #0f3460;">
          <td style="padding: 12px 0; color: #808090;">荧光强度</td>
          <td style="padding: 12px 0; color: #e0e0e0; font-family: 'Consolas', monospace;">${cell.fluorescence.toFixed(0)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #808090;">活性标记</td>
          <td style="padding: 12px 0; color: ${cell.viability > 70 ? '#4ade80' : cell.viability > 40 ? '#fbbf24' : '#f87171'}; font-family: 'Consolas', monospace; font-weight: 600;">${cell.viability.toFixed(1)}%</td>
        </tr>
      </table>
    `;

    this.modalBackdrop.style.display = 'flex';
    requestAnimationFrame(() => {
      this.modalBackdrop.style.opacity = '1';
      this.modal.style.transform = 'scale(1)';
    });
  }

  private closeModal(): void {
    this.modalBackdrop.style.opacity = '0';
    this.modal.style.transform = 'scale(0.9)';
    setTimeout(() => {
      this.modalBackdrop.style.display = 'none';
    }, 300);
  }

  public updateStats(stats: SelectionStats | null): void {
    if (!stats) {
      this.statsContent.innerHTML = `
        <div style="color: #808090; text-align: center; padding: 40px 20px;">
          按住 Shift 键拖拽<br>框选细胞进行统计
        </div>
      `;
      this.cellListContent.innerHTML = '';
      return;
    }

    this.statsContent.innerHTML = `
      <div style="background: linear-gradient(135deg, #e94560, #0f3460); padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: white;">${stats.count}</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">选中细胞数</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: rgba(15, 52, 96, 0.5); padding: 12px; border-radius: 6px;">
          <div style="font-size: 11px; color: #808090;">平均直径</div>
          <div style="font-size: 18px; font-weight: 600; color: #e0e0e0; font-family: 'Consolas', monospace;">${stats.avgDiameter.toFixed(1)} <span style="font-size: 12px; color: #808090;">μm</span></div>
        </div>
        <div style="background: rgba(15, 52, 96, 0.5); padding: 12px; border-radius: 6px;">
          <div style="font-size: 11px; color: #808090;">平均荧光</div>
          <div style="font-size: 18px; font-weight: 600; color: #e0e0e0; font-family: 'Consolas', monospace;">${stats.avgFluorescence.toFixed(0)}</div>
        </div>
        <div style="background: rgba(15, 52, 96, 0.5); padding: 12px; border-radius: 6px; grid-column: span 2;">
          <div style="font-size: 11px; color: #808090;">平均活性</div>
          <div style="font-size: 18px; font-weight: 600; color: ${stats.avgViability > 70 ? '#4ade80' : stats.avgViability > 40 ? '#fbbf24' : '#f87171'}; font-family: 'Consolas', monospace;">${stats.avgViability.toFixed(1)}%</div>
        </div>
      </div>
    `;

    this.cellListContent.innerHTML = stats.selectedCells
      .map((cell) => `
        <div style="padding: 10px; border-radius: 6px; margin-bottom: 4px; background: rgba(15, 52, 96, 0.3); display: flex; justify-content: space-between; align-items: center; transition: all 0.15s ease; cursor: pointer;" 
             onmouseover="this.style.background='rgba(15, 52, 96, 0.7)'" 
             onmouseout="this.style.background='rgba(15, 52, 96, 0.3)'">
          <span style="font-family: 'Consolas', monospace; color: #e0e0e0;">#${cell.id}</span>
          <span style="color: #e94560; font-size: 12px;">${cell.cellType}</span>
        </div>
      `)
      .join('');
  }

  private toggleLeftPanel(): void {
    const isMobile = window.innerWidth < 900;
    if (isMobile) {
      if (this.leftPanel.style.transform === 'translateX(0px)') {
        this.leftPanel.style.transform = 'translateX(-100%)';
        this.leftDrawerOverlay.style.display = 'none';
        this.leftDrawerOverlay.style.opacity = '0';
      } else {
        this.leftPanel.style.transform = 'translateX(0)';
        this.leftDrawerOverlay.style.display = 'block';
        requestAnimationFrame(() => {
          this.leftDrawerOverlay.style.opacity = '1';
        });
      }
    }
  }

  private toggleRightPanel(): void {
    const isMobile = window.innerWidth < 900;
    if (isMobile) {
      if (this.rightPanel.style.transform === 'translateX(0px)') {
        this.rightPanel.style.transform = 'translateX(100%)';
        this.rightDrawerOverlay.style.display = 'none';
        this.rightDrawerOverlay.style.opacity = '0';
      } else {
        this.rightPanel.style.transform = 'translateX(0)';
        this.rightDrawerOverlay.style.display = 'block';
        requestAnimationFrame(() => {
          this.rightDrawerOverlay.style.opacity = '1';
        });
      }
    } else {
      if (this.rightPanel.style.maxHeight === '0px') {
        this.rightPanel.style.maxHeight = 'calc(100vh - 40px)';
        this.rightPanel.style.padding = '20px';
        this.rightPanel.style.opacity = '1';
      } else {
        this.rightPanel.style.maxHeight = '0px';
        this.rightPanel.style.padding = '0 20px';
        this.rightPanel.style.opacity = '0';
      }
    }
  }

  private createResponsiveListeners(): void {
    const handleResize = () => {
      const isMobile = window.innerWidth < 900;
      if (isMobile) {
        this.hamburger.style.display = 'block';
        this.leftPanel.style.position = 'fixed';
        this.leftPanel.style.left = '0';
        this.leftPanel.style.top = '0';
        this.leftPanel.style.height = '100vh';
        this.leftPanel.style.transform = 'translateX(-100%)';
        this.leftPanel.style.margin = '0';
        this.leftPanel.style.borderRadius = '0 10px 10px 0';
        this.leftPanel.style.zIndex = '999';

        this.rightPanel.style.position = 'fixed';
        this.rightPanel.style.right = '0';
        this.rightPanel.style.top = '0';
        this.rightPanel.style.height = '100vh';
        this.rightPanel.style.transform = 'translateX(100%)';
        this.rightPanel.style.margin = '0';
        this.rightPanel.style.borderRadius = '10px 0 0 10px';
        this.rightPanel.style.zIndex = '999';
        this.rightPanel.style.maxHeight = '100vh';
      } else {
        this.hamburger.style.display = 'none';
        this.leftPanel.style.position = 'static';
        this.leftPanel.style.transform = 'translateX(0)';
        this.leftPanel.style.margin = '10px';
        this.leftPanel.style.borderRadius = '10px';
        this.leftPanel.style.height = 'auto';

        this.rightPanel.style.position = 'static';
        this.rightPanel.style.transform = 'translateX(0)';
        this.rightPanel.style.margin = '10px';
        this.rightPanel.style.borderRadius = '10px';
        this.rightPanel.style.height = 'auto';

        this.leftDrawerOverlay.style.display = 'none';
        this.rightDrawerOverlay.style.display = 'none';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  private bindGlobalEvents(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }
}
