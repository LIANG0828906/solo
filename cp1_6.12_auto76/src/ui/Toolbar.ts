import { ElementType } from '../renderer/SceneManager';

export interface ToolConfig {
  type: ElementType;
  name: string;
  icon: string;
  className: string;
}

export class Toolbar {
  private container: HTMLElement;
  private tools: ToolConfig[] = [
    { type: 'residential', name: '低层住宅', icon: '🏠', className: 'residential' },
    { type: 'office', name: '高层写字楼', icon: '🏢', className: 'office' },
    { type: 'commercial', name: '商业裙楼', icon: '🏪', className: 'commercial' },
    { type: 'tree', name: '行道树', icon: '🌳', className: 'tree' },
    { type: 'lamp', name: '路灯', icon: '💡', className: 'lamp' }
  ];

  private selectedType: ElementType | null = null;
  private onSelectCallback?: (type: ElementType | null) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public onSelect(callback: (type: ElementType | null) => void): void {
    this.onSelectCallback = callback;
  }

  private render(): void {
    this.container.innerHTML = '';

    for (const tool of this.tools) {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.dataset.type = tool.type;
      btn.innerHTML = `
        <span class="tool-icon ${tool.className}">${tool.icon}</span>
        <span>${tool.name}</span>
      `;

      btn.addEventListener('click', () => {
        this.selectTool(tool.type);
      });

      this.container.appendChild(btn);
    }
  }

  private selectTool(type: ElementType): void {
    if (this.selectedType === type) {
      this.selectedType = null;
    } else {
      this.selectedType = type;
    }

    const buttons = this.container.querySelectorAll('.tool-btn');
    buttons.forEach((btn) => {
      const btnType = (btn as HTMLElement).dataset.type;
      if (btnType === this.selectedType) {
        (btn as HTMLElement).classList.add('active');
      } else {
        (btn as HTMLElement).classList.remove('active');
      }
    });

    if (this.onSelectCallback) {
      this.onSelectCallback(this.selectedType);
    }
  }

  public getSelectedType(): ElementType | null {
    return this.selectedType;
  }
}
