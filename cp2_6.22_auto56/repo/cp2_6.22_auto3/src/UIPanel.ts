import { MonsterState } from './MonsterAnimator';

export interface UIParams {
  speed: number;
  branchProbability: number;
}

export class UIPanel {
  private controlPanel: HTMLElement;
  private infoPanel: HTMLElement;
  private params: UIParams;
  private onSpeedChange: (speed: number) => void;
  private onProbabilityChange: (prob: number) => void;
  private onStart: () => void;
  private onStop: () => void;
  private onReset: () => void;
  private onClear: () => void;
  private lastUpdateTime: number = 0;
  private destroyed: boolean = false;
  private smoothDisplaySpeed: number = 0;
  private speedEasing: number = 0.15;
  private boundCleanup: (() => void) | null = null;

  constructor(
    controlPanelId: string,
    infoPanelId: string,
    callbacks: {
      onSpeedChange: (speed: number) => void;
      onProbabilityChange: (prob: number) => void;
      onStart: () => void;
      onStop: () => void;
      onReset: () => void;
      onClear: () => void;
    }
  ) {
    this.controlPanel = document.getElementById(controlPanelId)!;
    this.infoPanel = document.getElementById(infoPanelId)!;
    this.params = { speed: 100, branchProbability: 0.5 };
    this.onSpeedChange = callbacks.onSpeedChange;
    this.onProbabilityChange = callbacks.onProbabilityChange;
    this.onStart = callbacks.onStart;
    this.onStop = callbacks.onStop;
    this.onReset = callbacks.onReset;
    this.onClear = callbacks.onClear;

    this.renderControlPanel();
    this.renderInfoPanel();

    this.boundCleanup = () => this.destroy();
    window.addEventListener('beforeunload', this.boundCleanup);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.boundCleanup) {
      window.removeEventListener('beforeunload', this.boundCleanup);
      this.boundCleanup = null;
    }
  }

  private renderControlPanel(): void {
    this.controlPanel.innerHTML = `
      <h2>路径控制面板</h2>
      <label for="speedSlider">怪物速度: <span id="speedValue">100</span> px/s</label>
      <input type="range" id="speedSlider" min="20" max="300" value="100" step="5" />
      <label for="probSlider">分支概率（子节点1）: <span id="probValue">0.50</span></label>
      <input type="range" id="probSlider" min="0" max="1" value="0.5" step="0.05" />
      <div class="row">
        <button id="startBtn">开始预览</button>
        <button id="stopBtn">暂停</button>
      </div>
      <div class="row">
        <button id="resetBtn">重置怪物</button>
        <button id="clearBtn">清空路径</button>
      </div>
      <div class="hint">
        点击画布空白处添加节点<br>
        拖拽节点调整位置<br>
        选中节点后点击空白处添加子节点<br>
        分支节点（B）有多条子路径
      </div>
    `;

    const speedSlider = this.controlPanel.querySelector('#speedSlider') as HTMLInputElement;
    const speedValue = this.controlPanel.querySelector('#speedValue') as HTMLElement;
    speedSlider.addEventListener('input', () => {
      this.params.speed = Number(speedSlider.value);
      speedValue.textContent = String(this.params.speed);
      this.onSpeedChange(this.params.speed);
    });

    const probSlider = this.controlPanel.querySelector('#probSlider') as HTMLInputElement;
    const probValue = this.controlPanel.querySelector('#probValue') as HTMLElement;
    probSlider.addEventListener('input', () => {
      this.params.branchProbability = Number(probSlider.value);
      probValue.textContent = this.params.branchProbability.toFixed(2);
      this.onProbabilityChange(this.params.branchProbability);
    });

    (this.controlPanel.querySelector('#startBtn') as HTMLElement).addEventListener('click', this.onStart);
    (this.controlPanel.querySelector('#stopBtn') as HTMLElement).addEventListener('click', this.onStop);
    (this.controlPanel.querySelector('#resetBtn') as HTMLElement).addEventListener('click', this.onReset);
    (this.controlPanel.querySelector('#clearBtn') as HTMLElement).addEventListener('click', this.onClear);
  }

  private renderInfoPanel(): void {
    this.infoPanel.innerHTML = `
      <h2>实时数据</h2>
      <div class="info-row">速度: <span id="infoSpeed">0.00</span> px/s</div>
      <div class="info-row">位置 X: <span id="infoPosX">0</span></div>
      <div class="info-row">位置 Y: <span id="infoPosY">0</span></div>
      <div class="info-row">状态: <span id="infoStatus">待机</span></div>
      <div class="info-row">节点数: <span id="infoNodeCount">0</span></div>
    `;
  }

  update(state: MonsterState, nodeCount: number, isActive: boolean, currentTime: number): void {
    if (this.destroyed) return;

    this.smoothDisplaySpeed += (state.measuredSpeed - this.smoothDisplaySpeed) * this.speedEasing;

    if (currentTime - this.lastUpdateTime >= 1000) {
      this.lastUpdateTime = currentTime;

      const speedEl = this.infoPanel.querySelector('#infoSpeed') as HTMLElement;
      const posXEl = this.infoPanel.querySelector('#infoPosX') as HTMLElement;
      const posYEl = this.infoPanel.querySelector('#infoPosY') as HTMLElement;
      const statusEl = this.infoPanel.querySelector('#infoStatus') as HTMLElement;
      const nodeCountEl = this.infoPanel.querySelector('#infoNodeCount') as HTMLElement;

      if (speedEl) speedEl.textContent = this.smoothDisplaySpeed.toFixed(2);
      if (posXEl) posXEl.textContent = Math.round(state.x).toString();
      if (posYEl) posYEl.textContent = Math.round(state.y).toString();
      if (statusEl) statusEl.textContent = isActive ? '移动中' : '待机';
      if (nodeCountEl) nodeCountEl.textContent = String(nodeCount);
    }
  }

  getParams(): UIParams {
    return this.params;
  }
}
