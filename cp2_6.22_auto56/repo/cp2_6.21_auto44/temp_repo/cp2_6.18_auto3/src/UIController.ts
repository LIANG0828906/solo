import { TerrainGenerator } from './TerrainGenerator';

export interface UICallbacks {
  onSmooth: () => void;
  onReset: () => void;
  onExport: () => void;
  onTextureChange: (index: number) => void;
  onBrushRadiusChange: (radius: number) => void;
  onBrushStrengthChange: (strength: number) => void;
}

export class UIController {
  private container: HTMLElement;
  private terrainGenerator: TerrainGenerator;
  private callbacks: UICallbacks;

  private brushRadiusSlider?: HTMLInputElement;
  private brushStrengthSlider?: HTMLInputElement;
  private brushRadiusValue?: HTMLSpanElement;
  private brushStrengthValue?: HTMLSpanElement;
  private brushStrengthHeaderValue?: HTMLSpanElement;
  private hoverHeightInfo?: HTMLDivElement;
  private hoverPositionValue?: HTMLSpanElement;
  private hoverHeightValue?: HTMLSpanElement;
  private textureSelect?: HTMLSelectElement;

  constructor(
    container: HTMLElement,
    terrainGenerator: TerrainGenerator,
    callbacks: UICallbacks
  ) {
    this.container = container;
    this.terrainGenerator = terrainGenerator;
    this.callbacks = callbacks;

    this.buildUI();
  }

  private buildUI(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '地形编辑器';
    this.container.appendChild(title);

    const sizeInfo = document.createElement('div');
    sizeInfo.className = 'panel-header';
    sizeInfo.textContent = `地形尺寸：${this.terrainGenerator.size} × ${this.terrainGenerator.size} 格`;
    this.container.appendChild(sizeInfo);

    this.hoverHeightInfo = document.createElement('div');
    this.hoverHeightInfo.className = 'panel-header';
    this.hoverHeightInfo.style.marginBottom = '16px';
    this.hoverHeightInfo.style.color = '#888888';
    this.hoverHeightInfo.textContent = '位置: -- | 高度: --';
    this.container.appendChild(this.hoverHeightInfo);

    const strengthInfo = document.createElement('div');
    strengthInfo.className = 'panel-header';
    strengthInfo.style.marginBottom = '16px';
    strengthInfo.textContent = '笔刷强度：';
    this.brushStrengthHeaderValue = document.createElement('span');
    this.brushStrengthHeaderValue.textContent = this.terrainGenerator.brushStrength.toFixed(1) + 'x';
    this.brushStrengthHeaderValue.style.color = '#6C63FF';
    this.brushStrengthHeaderValue.style.fontWeight = '600';
    strengthInfo.appendChild(this.brushStrengthHeaderValue);
    this.container.appendChild(strengthInfo);

    const divider1 = document.createElement('div');
    divider1.className = 'section-divider';
    this.container.appendChild(divider1);

    const brushGroup = this.createBrushGroup();
    this.container.appendChild(brushGroup);

    const divider2 = document.createElement('div');
    divider2.className = 'section-divider';
    this.container.appendChild(divider2);

    const textureGroup = this.createTextureGroup();
    this.container.appendChild(textureGroup);

    const divider3 = document.createElement('div');
    divider3.className = 'section-divider';
    this.container.appendChild(divider3);

    const strengthSliderGroup = this.createStrengthSliderGroup();
    this.container.appendChild(strengthSliderGroup);

    const divider4 = document.createElement('div');
    divider4.className = 'section-divider';
    this.container.appendChild(divider4);

    const actionsGroup = this.createActionsGroup();
    this.container.appendChild(actionsGroup);

    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    this.container.appendChild(spacer);

    const exportBtn = this.createExportButton();
    this.container.appendChild(exportBtn);

    const info = document.createElement('div');
    info.className = 'info-text';
    info.innerHTML = `
      <p>操作提示：</p>
      <p>• 左键拖拽：抬高地形</p>
      <p>• Shift+左键：降低地形</p>
      <p>• 右键拖拽：平移视角</p>
      <p>• 滚轮：缩放视角</p>
    `;
    this.container.appendChild(info);
  }

  private createBrushGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '笔刷设置';
    group.appendChild(label);

    const radiusContainer = document.createElement('div');
    radiusContainer.className = 'brush-indicator';
    radiusContainer.innerHTML = '<span>半径</span>';
    this.brushRadiusValue = document.createElement('span');
    this.brushRadiusValue.textContent = this.terrainGenerator.brushRadius.toFixed(1);
    radiusContainer.appendChild(this.brushRadiusValue);
    group.appendChild(radiusContainer);

    this.brushRadiusSlider = document.createElement('input');
    this.brushRadiusSlider.type = 'range';
    this.brushRadiusSlider.min = '1';
    this.brushRadiusSlider.max = '10';
    this.brushRadiusSlider.step = '0.5';
    this.brushRadiusSlider.value = this.terrainGenerator.brushRadius.toString();
    this.brushRadiusSlider.addEventListener('input', () => {
      const value = parseFloat(this.brushRadiusSlider!.value);
      this.callbacks.onBrushRadiusChange(value);
      if (this.brushRadiusValue) {
        this.brushRadiusValue.textContent = value.toFixed(1);
      }
    });
    group.appendChild(this.brushRadiusSlider);

    return group;
  }

  private createStrengthSliderGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '笔刷强度';
    group.appendChild(label);

    const strengthContainer = document.createElement('div');
    strengthContainer.className = 'brush-indicator';
    strengthContainer.innerHTML = '<span>强度</span>';
    this.brushStrengthValue = document.createElement('span');
    this.brushStrengthValue.textContent = this.terrainGenerator.brushStrength.toFixed(1) + 'x';
    strengthContainer.appendChild(this.brushStrengthValue);
    group.appendChild(strengthContainer);

    this.brushStrengthSlider = document.createElement('input');
    this.brushStrengthSlider.type = 'range';
    this.brushStrengthSlider.min = '0.1';
    this.brushStrengthSlider.max = '2.0';
    this.brushStrengthSlider.step = '0.1';
    this.brushStrengthSlider.value = this.terrainGenerator.brushStrength.toString();
    this.brushStrengthSlider.addEventListener('input', () => {
      const value = parseFloat(this.brushStrengthSlider!.value);
      this.callbacks.onBrushStrengthChange(value);
      const displayText = value.toFixed(1) + 'x';
      if (this.brushStrengthValue) {
        this.brushStrengthValue.textContent = displayText;
      }
      if (this.brushStrengthHeaderValue) {
        this.brushStrengthHeaderValue.textContent = displayText;
      }
    });
    group.appendChild(this.brushStrengthSlider);

    return group;
  }

  private createTextureGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '纹理选择';
    group.appendChild(label);

    this.textureSelect = document.createElement('select');
    const textures = [
      { value: '0', label: '草地纹理' },
      { value: '1', label: '沙漠纹理' },
      { value: '2', label: '雪地纹理' },
      { value: '3', label: '岩石纹理' }
    ];

    textures.forEach(t => {
      const option = document.createElement('option');
      option.value = t.value;
      option.textContent = t.label;
      this.textureSelect!.appendChild(option);
    });

    this.textureSelect.value = this.terrainGenerator.textureIndex.toString();
    this.textureSelect.addEventListener('change', () => {
      const index = parseInt(this.textureSelect!.value);
      this.callbacks.onTextureChange(index);
    });

    group.appendChild(this.textureSelect);

    return group;
  }

  private createActionsGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '地形操作';
    group.appendChild(label);

    const smoothBtn = document.createElement('button');
    smoothBtn.className = 'btn';
    smoothBtn.textContent = '平滑地形';
    smoothBtn.addEventListener('click', () => this.callbacks.onSmooth());
    group.appendChild(smoothBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-danger';
    resetBtn.textContent = '重置地形';
    resetBtn.addEventListener('click', () => {
      if (confirm('确定要重置地形吗？所有修改将丢失。')) {
        this.callbacks.onReset();
      }
    });
    group.appendChild(resetBtn);

    return group;
  }

  private createExportButton(): HTMLElement {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.textContent = '导出地形数据';
    exportBtn.addEventListener('click', () => this.callbacks.onExport());
    return exportBtn;
  }

  public updateTextureSelection(index: number): void {
    if (this.textureSelect) {
      this.textureSelect.value = index.toString();
    }
  }

  public updateBrushRadius(radius: number): void {
    if (this.brushRadiusSlider) {
      this.brushRadiusSlider.value = radius.toString();
    }
    if (this.brushRadiusValue) {
      this.brushRadiusValue.textContent = radius.toFixed(1);
    }
  }

  public updateBrushStrength(strength: number): void {
    const displayText = strength.toFixed(1) + 'x';
    if (this.brushStrengthSlider) {
      this.brushStrengthSlider.value = strength.toString();
    }
    if (this.brushStrengthValue) {
      this.brushStrengthValue.textContent = displayText;
    }
    if (this.brushStrengthHeaderValue) {
      this.brushStrengthHeaderValue.textContent = displayText;
    }
  }

  public updateHoverInfo(gridX: number | null, gridZ: number | null, height: number | null): void {
    if (!this.hoverHeightInfo) return;

    if (gridX === null || gridZ === null || height === null) {
      this.hoverHeightInfo.textContent = '位置: -- | 高度: --';
    } else {
      this.hoverHeightInfo.innerHTML = `位置: (${gridX}, ${gridZ}) | 高度: ${height.toFixed(2)}`;
    }
  }
}
