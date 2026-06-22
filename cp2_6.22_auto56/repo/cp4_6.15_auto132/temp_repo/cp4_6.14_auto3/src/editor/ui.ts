import { SceneManager } from './sceneManager';

export class EditorUI {
  private sceneManager: SceneManager;
  private toolbarEl: HTMLElement;
  private propertiesEl: HTMLElement;
  private selectedInfoEl: HTMLElement;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.toolbarEl = document.getElementById('toolbar')!;
    this.propertiesEl = document.getElementById('properties')!;
    this.selectedInfoEl = document.getElementById('selectedBrickInfo')!;
  }

  init(): void {
    this.setupColorButtons();
    this.setupToolbarButtons();
    this.setupCanvasEvents();
    this.sceneManager.onSelectionChange = (info) => {
      this.updateProperties(info);
    };
  }

  private setupColorButtons(): void {
    const btns = this.toolbarEl.querySelectorAll('.color-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = (btn as HTMLElement).dataset.color as 'red' | 'blue' | 'green';
        this.sceneManager.setCurrentColor(color);
      });
    });
  }

  private setupToolbarButtons(): void {
    document.getElementById('saveBtn')!.addEventListener('click', () => {
      const bricks = this.sceneManager.exportLevel();
      const json = JSON.stringify({ name: '自定义关卡', bricks }, null, 2);
      console.log('=== 关卡数据 ===');
      console.log(json);
      alert('关卡数据已输出到控制台(F12查看)');
    });

    document.getElementById('loadBtn')!.addEventListener('click', () => {
      const json = prompt('请粘贴关卡JSON数据:');
      if (!json) return;
      try {
        const data = JSON.parse(json);
        if (data.bricks && Array.isArray(data.bricks)) {
          this.sceneManager.importLevel(data.bricks);
        } else {
          alert('JSON格式错误: 缺少bricks数组');
        }
      } catch {
        alert('JSON解析失败，请检查格式');
      }
    });

    document.getElementById('clearBtn')!.addEventListener('click', () => {
      if (confirm('确定清空所有砖块?')) {
        this.sceneManager.clearGrid();
      }
    });
  }

  private setupCanvasEvents(): void {
    const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;

    canvas.addEventListener('click', (e) => {
      this.sceneManager.handleClick(e.clientX, e.clientY);
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.sceneManager.handleRightClick(e.clientX, e.clientY);
    });
  }

  private updateProperties(info: { x: number; y: number; color: string; hp: number } | null): void {
    if (!info) {
      this.selectedInfoEl.innerHTML = '未选中砖块';
      return;
    }
    const colorName: Record<string, string> = { red: '红', blue: '蓝', green: '绿' };
    this.selectedInfoEl.innerHTML =
      `坐标: (${info.x}, ${info.y})<br>` +
      `颜色: ${colorName[info.color] || info.color}<br>` +
      `血量: ${info.hp}`;
  }
}
