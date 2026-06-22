import { GearParams } from '../scene/GearGenerator';
import { SceneManager } from '../scene/SceneManager';

export interface GearUIState {
  id: string;
  params: GearParams;
}

export class UIManager {
  private sceneManager: SceneManager;
  private panel: HTMLElement;
  private gearList: HTMLElement;
  private gearStates: Map<string, GearUIState> = new Map();
  private selectedGearIds: string[] = [];
  private meshButton: HTMLButtonElement | null = null;
  private gearLabels: Map<string, HTMLElement> = new Map();
  private uiContainer: HTMLElement;
  private rotatingGearId: string | null = null;
  private lastMouseX = 0;

  constructor(container: HTMLElement, uiContainer: HTMLElement, sceneManager: SceneManager) {
    this.uiContainer = uiContainer;
    this.sceneManager = sceneManager;

    this.panel = this.createPanel();
    this.gearList = this.createGearList();

    const header = this.createHeader();
    this.panel.appendChild(header);
    this.panel.appendChild(this.gearList);

    const addButton = this.createAddButton();
    this.panel.appendChild(addButton);

    this.meshButton = this.createMeshButton();
    this.panel.appendChild(this.meshButton);

    const helpText = this.createHelpText();
    this.panel.appendChild(helpText);

    container.appendChild(this.panel);

    this.setupSceneCallbacks();
    this.setupGlobalMouseEvents();
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 280px;
      max-height: calc(100vh - 40px);
      background: #0F172A;
      border-radius: 8px;
      border: 1px solid #334155;
      padding: 16px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      z-index: 100;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    `;
    return panel;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.innerHTML = `
      <h1 style="color: #F1F5F9; font-size: 18px; font-weight: 600; margin-bottom: 4px;">齿轮传动设计器</h1>
      <p style="color: #94A3B8; font-size: 12px;">构建和测试齿轮传动机构</p>
    `;
    return header;
  }

  private createGearList(): HTMLElement {
    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
      min-height: 0;
    `;
    return list;
  }

  private createAddButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '+ 添加齿轮';
    button.style.cssText = `
      width: 100%;
      padding: 10px 16px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.1s ease;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = '#2563EB';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#3B82F6';
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1.0)';
    });
    button.addEventListener('click', () => {
      button.style.transform = 'scale(1.0)';
      this.addGear();
    });

    return button;
  }

  private createMeshButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '🔗 啮合选中齿轮';
    button.disabled = true;
    button.style.cssText = `
      width: 100%;
      padding: 10px 16px;
      background: #475569;
      color: #94A3B8;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: not-allowed;
      transition: all 0.1s ease;
    `;

    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.background = '#059669';
      }
    });
    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.background = '#10B981';
      }
    });
    button.addEventListener('mousedown', () => {
      if (!button.disabled) {
        button.style.transform = 'scale(0.95)';
      }
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1.0)';
    });
    button.addEventListener('click', () => {
      button.style.transform = 'scale(1.0)';
      this.meshSelectedGears();
    });

    return button;
  }

  private createHelpText(): HTMLElement {
    const help = document.createElement('div');
    help.style.cssText = `
      padding-top: 8px;
      border-top: 1px solid #334155;
      color: #64748B;
      font-size: 11px;
      line-height: 1.6;
    `;
    help.innerHTML = `
      <div><strong style="color: #94A3B8;">操作提示：</strong></div>
      <div>• 点击齿轮选中，Shift/Ctrl多选</div>
      <div>• 拖拽齿轮移动位置（自动吸附）</div>
      <div>• 选中齿轮后按 R 键 + 鼠标拖动旋转</div>
      <div>• 选中两个齿轮后点击啮合</div>
      <div>• 滚轮缩放场景</div>
    `;
    return help;
  }

  private setupSceneCallbacks(): void {
    this.sceneManager.onGearSelect = (selectedIds) => {
      this.selectedGearIds = selectedIds;
      this.updateMeshButtonState();
      this.updateGearCardsSelection();
    };

    this.sceneManager.onGearUpdate = (gearId) => {
      this.updateGearLabel(gearId);
    };

    this.sceneManager.onWarning = (message) => {
      this.showWarning(message);
    };
  }

  private setupGlobalMouseEvents(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        if (this.selectedGearIds.length > 0 && !this.rotatingGearId) {
          this.rotatingGearId = this.selectedGearIds[0];
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.rotatingGearId = null;
      }
    });

    this.sceneManager.renderer.domElement.addEventListener('mousedown', (e) => {
      this.lastMouseX = e.clientX;
    });

    this.sceneManager.renderer.domElement.addEventListener('mousemove', (e) => {
      if (this.rotatingGearId && e.buttons === 1) {
        const deltaX = e.clientX - this.lastMouseX;
        this.sceneManager.rotateGear(this.rotatingGearId, deltaX * 0.01);
        this.lastMouseX = e.clientX;
      }
    });
  }

  private addGear(): void {
    const defaultParams: GearParams = {
      teeth: 20,
      module: 2,
      pressureAngle: 20,
      color: '#374151'
    };

    const gearId = this.sceneManager.createGear(defaultParams);

    this.gearStates.set(gearId, {
      id: gearId,
      params: { ...defaultParams }
    });

    this.createGearCard(gearId);
    this.createGearLabel(gearId);
    this.updateMeshButtonState();
  }

  private createGearCard(gearId: string): void {
    const state = this.gearStates.get(gearId);
    if (!state) return;

    const card = document.createElement('div');
    card.id = `card-${gearId}`;
    card.style.cssText = `
      background: #1E293B;
      border-radius: 8px;
      padding: 12px;
      border: 1px solid #334155;
      transition: border-color 0.2s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    `;

    const title = document.createElement('span');
    title.style.cssText = 'color: #F1F5F9; font-size: 13px; font-weight: 500;';
    title.textContent = `齿轮 ${gearId.split('_')[1]}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.style.cssText = `
      background: none;
      border: none;
      color: #64748B;
      cursor: pointer;
      font-size: 16px;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.1s ease;
    `;
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.background = '#DC2626';
      deleteBtn.style.color = 'white';
    });
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.background = 'none';
      deleteBtn.style.color = '#64748B';
    });
    deleteBtn.addEventListener('click', () => {
      this.removeGear(gearId);
    });

    header.appendChild(title);
    header.appendChild(deleteBtn);
    card.appendChild(header);

    const inputs = [
      { label: '齿数 (Z)', key: 'teeth', min: 8, max: 60, step: 1, type: 'number' as const },
      { label: '模数 (m)', key: 'module', min: 1, max: 5, step: 0.5, type: 'number' as const },
    ];

    inputs.forEach(({ label, key, min, max, step, type }) => {
      const row = this.createInputRow(
        label,
        state.params[key as keyof GearParams] as number,
        min,
        max,
        step,
        type,
        (value) => {
          this.updateGearParam(gearId, key as keyof GearParams, value);
        }
      );
      card.appendChild(row);
    });

    const pressureRow = this.createSelectRow(
      '压力角',
      [
        { value: 14.5, label: '14.5°' },
        { value: 20, label: '20°' }
      ],
      state.params.pressureAngle,
      (value) => {
        this.updateGearParam(gearId, 'pressureAngle', value);
      }
    );
    card.appendChild(pressureRow);

    const colorRow = this.createColorInput(
      '颜色',
      state.params.color,
      (value) => {
        this.updateGearParam(gearId, 'color', value);
      }
    );
    card.appendChild(colorRow);

    this.gearList.appendChild(card);
  }

  private createInputRow(
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    type: 'number',
    onChange: (value: number) => void
  ): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom: 8px;';

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      color: #94A3B8;
      font-size: 11px;
      margin-bottom: 4px;
    `;
    labelEl.textContent = label;

    const input = document.createElement('input');
    input.type = type;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.style.cssText = `
      width: 100%;
      padding: 6px 10px;
      background: #0F172A;
      border: 1px solid #475569;
      border-radius: 6px;
      color: #F1F5F9;
      font-size: 13px;
      outline: none;
      transition: all 0.15s ease;
      box-sizing: border-box;
    `;

    input.addEventListener('focus', () => {
      input.style.borderColor = '#3B82F6';
      input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#475569';
      input.style.boxShadow = 'none';
    });

    input.addEventListener('change', () => {
      let val = parseFloat(input.value);
      if (isNaN(val)) val = min;
      val = Math.max(min, Math.min(max, val));
      input.value = String(val);
      onChange(val);
    });

    row.appendChild(labelEl);
    row.appendChild(input);
    return row;
  }

  private createSelectRow(
    label: string,
    options: { value: number; label: string }[],
    value: number,
    onChange: (value: number) => void
  ): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom: 8px;';

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      color: #94A3B8;
      font-size: 11px;
      margin-bottom: 4px;
    `;
    labelEl.textContent = label;

    const select = document.createElement('select');
    select.style.cssText = `
      width: 100%;
      padding: 6px 10px;
      background: #0F172A;
      border: 1px solid #475569;
      border-radius: 6px;
      color: #F1F5F9;
      font-size: 13px;
      outline: none;
      cursor: pointer;
      transition: all 0.15s ease;
      box-sizing: border-box;
    `;

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = String(opt.value);
      option.textContent = opt.label;
      if (opt.value === value) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('focus', () => {
      select.style.borderColor = '#3B82F6';
      select.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
    });
    select.addEventListener('blur', () => {
      select.style.borderColor = '#475569';
      select.style.boxShadow = 'none';
    });

    select.addEventListener('change', () => {
      onChange(parseFloat(select.value));
    });

    row.appendChild(labelEl);
    row.appendChild(select);
    return row;
  }

  private createColorInput(
    label: string,
    value: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom: 4px;';

    const labelEl = document.createElement('label');
    labelEl.style.cssText = `
      display: block;
      color: #94A3B8;
      font-size: 11px;
      margin-bottom: 4px;
    `;
    labelEl.textContent = label;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    const colorPreview = document.createElement('div');
    colorPreview.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: ${value};
      border: 1px solid #475569;
      flex-shrink: 0;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = '#374151';
    input.style.cssText = `
      flex: 1;
      padding: 6px 10px;
      background: #0F172A;
      border: 1px solid #475569;
      border-radius: 6px;
      color: #F1F5F9;
      font-size: 13px;
      outline: none;
      transition: all 0.15s ease;
      box-sizing: border-box;
    `;

    input.addEventListener('focus', () => {
      input.style.borderColor = '#3B82F6';
      input.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#475569';
      input.style.boxShadow = 'none';
    });

    input.addEventListener('change', () => {
      let color = input.value.trim();
      if (!color.startsWith('#')) color = '#' + color;
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        colorPreview.style.background = color;
        onChange(color);
      } else {
        input.value = value;
      }
    });

    wrapper.appendChild(colorPreview);
    wrapper.appendChild(input);
    row.appendChild(labelEl);
    row.appendChild(wrapper);
    return row;
  }

  private updateGearParam(gearId: string, key: keyof GearParams, value: number | string): void {
    const state = this.gearStates.get(gearId);
    if (!state) return;

    (state.params as unknown as Record<string, unknown>)[key] = value;
    this.sceneManager.updateGear(gearId, state.params);
    this.updateGearLabel(gearId);
  }

  private removeGear(gearId: string): void {
    const card = document.getElementById(`card-${gearId}`);
    if (card) card.remove();

    const label = this.gearLabels.get(gearId);
    if (label) label.remove();
    this.gearLabels.delete(gearId);

    this.sceneManager.deleteGear(gearId);
    this.gearStates.delete(gearId);

    this.selectedGearIds = this.selectedGearIds.filter(id => id !== gearId);
    this.updateMeshButtonState();
  }

  private updateGearCardsSelection(): void {
    this.gearStates.forEach((_, gearId) => {
      const card = document.getElementById(`card-${gearId}`);
      if (card) {
        if (this.selectedGearIds.includes(gearId)) {
          card.style.borderColor = '#3B82F6';
          card.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';
        } else {
          card.style.borderColor = '#334155';
          card.style.boxShadow = 'none';
        }
      }
    });
  }

  private updateMeshButtonState(): void {
    if (!this.meshButton) return;

    if (this.selectedGearIds.length === 2) {
      this.meshButton.disabled = false;
      this.meshButton.style.background = '#10B981';
      this.meshButton.style.color = 'white';
      this.meshButton.style.cursor = 'pointer';
    } else {
      this.meshButton.disabled = true;
      this.meshButton.style.background = '#475569';
      this.meshButton.style.color = '#94A3B8';
      this.meshButton.style.cursor = 'not-allowed';
    }
  }

  private meshSelectedGears(): void {
    if (this.selectedGearIds.length !== 2) return;

    const [gear1Id, gear2Id] = this.selectedGearIds;
    this.sceneManager.meshGears(gear1Id, gear2Id);
  }

  private createGearLabel(gearId: string): void {
    const state = this.gearStates.get(gearId);
    if (!state) return;

    const label = document.createElement('div');
    label.className = 'gear-label';
    label.textContent = `Z:${state.params.teeth} m:${state.params.module}`;
    this.uiContainer.appendChild(label);
    this.gearLabels.set(gearId, label);
  }

  private updateGearLabel(gearId: string): void {
    const state = this.gearStates.get(gearId);
    const label = this.gearLabels.get(gearId);
    if (!state || !label) return;

    label.textContent = `Z:${state.params.teeth} m:${state.params.module}`;
  }

  private showWarning(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'warning-toast';
    toast.textContent = `⚠️ ${message}`;
    this.uiContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  updateLabels(): void {
    this.gearLabels.forEach((label, gearId) => {
      const pos = this.sceneManager.getScreenPosition(gearId);
      if (pos) {
        label.style.left = `${pos.x}px`;
        label.style.top = `${pos.y}px`;
        label.style.display = 'block';
      } else {
        label.style.display = 'none';
      }
    });
  }
}
