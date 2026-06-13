import { eventBus, EventType, CanvasClickPayload } from '../events/eventBus';
import { StatsSnapshot, Animal } from '../core/ecosystem';

const COLORS = {
  plant: '#7ec850',
  herbivore: '#4caf50',
  carnivore: '#e53935',
  primary: '#2d5a27',
  secondary: '#8b5e3c',
  background: '#f5efe6',
  cardBg: '#ffffff',
  text: '#2c2c2c',
  textLight: '#6b6b6b',
  grid: 'rgba(45, 90, 39, 0.1)',
  border: 'rgba(45, 90, 39, 0.15)',
};

type ToolMode = 'none' | 'placeBush' | 'placeFruitTree' | 'removePlant' | 'spawnHerbivore' | 'spawnCarnivore';

interface LineChartData {
  plant: number[];
  herbivore: number[];
  carnivore: number[];
  displayPlant: number[];
  displayHerbivore: number[];
  displayCarnivore: number[];
  animProgress: number;
  lastUpdate: number;
}

export class ControlPanel {
  private container: HTMLElement;
  private currentSnapshot: StatsSnapshot | null = null;
  private history: StatsSnapshot[] = [];
  private selectedAnimal: Animal | null = null;
  private toolMode: ToolMode = 'none';
  private chartCanvas: HTMLCanvasElement | null = null;
  private chartCtx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private chartData: LineChartData = {
    plant: [],
    herbivore: [],
    carnivore: [],
    displayPlant: [],
    displayHerbivore: [],
    displayCarnivore: [],
    animProgress: 1,
    lastUpdate: 0,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupEventBus();
    this.render();
    this.startChartAnimation();
  }

  private setupEventBus(): void {
    eventBus.on(EventType.ECOSYSTEM_TICK, (payload) => {
      this.currentSnapshot = payload as StatsSnapshot;
      this.updateStats();
    });

    eventBus.on(EventType.ECOSYSTEM_SNAPSHOT, (payload) => {
      this.history = payload as StatsSnapshot[];
      this.updateChartData();
    });

    eventBus.on(EventType.ECOSYSTEM_STATE, (payload) => {
      const state = payload as { snapshot: StatsSnapshot };
      this.currentSnapshot = state.snapshot;
      this.updateStats();
    });

    eventBus.on(EventType.ECOSYSTEM_ANIMAL_SELECTED, (payload) => {
      this.selectedAnimal = payload as Animal | null;
      this.updateSelectedAnimal();
    });

    eventBus.on(EventType.UI_CANVAS_CLICK, (payload) => {
      this.handleCanvasClick(payload as CanvasClickPayload);
    });
  }

  private handleCanvasClick(payload: CanvasClickPayload): void {
    if (this.toolMode === 'none') return;
    const { x, y } = payload;

    switch (this.toolMode) {
      case 'placeBush':
        eventBus.emit(EventType.UI_PLACE_PLANT, { x, y, plantType: 'bush' });
        break;
      case 'placeFruitTree':
        eventBus.emit(EventType.UI_PLACE_PLANT, { x, y, plantType: 'fruitTree' });
        break;
      case 'removePlant':
        eventBus.emit(EventType.UI_REMOVE_PLANT, { x, y });
        break;
      case 'spawnHerbivore':
        eventBus.emit(EventType.UI_SPAWN_ANIMAL, { x, y, animalType: 'herbivore' });
        break;
      case 'spawnCarnivore':
        eventBus.emit(EventType.UI_SPAWN_ANIMAL, { x, y, animalType: 'carnivore' });
        break;
    }
  }

  private setToolMode(mode: ToolMode): void {
    this.toolMode = mode;
    this.updateToolButtons();
  }

  private updateToolButtons(): void {
    const buttons = this.container.querySelectorAll('.tool-btn');
    buttons.forEach((btn) => {
      const mode = (btn as HTMLElement).dataset.mode as ToolMode;
      if (mode === this.toolMode) {
        (btn as HTMLElement).classList.add('active');
      } else {
        (btn as HTMLElement).classList.remove('active');
      }
    });
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 20px;
      gap: 16px;
      overflow-y: auto;
      background: ${COLORS.background};
      font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
    `;

    const resourceSection = this.createResourceSection();
    const statsSection = this.createStatsSection();
    const chartSection = this.createChartSection();
    const selectedSection = this.createSelectedSection();

    this.container.appendChild(resourceSection);
    this.container.appendChild(statsSection);
    this.container.appendChild(chartSection);
    this.container.appendChild(selectedSection);

    this.setupStyles();
  }

  private setupStyles(): void {
    const styleId = 'control-panel-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: ${COLORS.primary};
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-title::before {
        content: '';
        width: 4px;
        height: 16px;
        background: ${COLORS.primary};
        border-radius: 2px;
      }
      .resource-points {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: linear-gradient(135deg, ${COLORS.primary}, #3d7a35);
        border-radius: 10px;
        color: #fff;
        margin-bottom: 14px;
        box-shadow: 0 4px 12px rgba(45, 90, 39, 0.3);
      }
      .resource-icon {
        font-size: 22px;
      }
      .resource-value {
        font-size: 20px;
        font-weight: 700;
      }
      .resource-label {
        font-size: 12px;
        opacity: 0.85;
      }
      .tool-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .tool-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 6px;
        background: ${COLORS.cardBg};
        border: 2px solid ${COLORS.border};
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 11px;
        color: ${COLORS.text};
      }
      .tool-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        border-color: ${COLORS.primary};
      }
      .tool-btn.active {
        background: ${COLORS.primary};
        color: #fff;
        border-color: ${COLORS.primary};
        box-shadow: 0 4px 12px rgba(45, 90, 39, 0.4);
      }
      .tool-btn .icon {
        font-size: 20px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      @media (max-width: 1200px) {
        .stats-grid { grid-template-columns: 1fr; }
        .tool-grid { grid-template-columns: repeat(2, 1fr); }
      }
      .stat-card {
        background: ${COLORS.cardBg};
        border-radius: 12px;
        padding: 14px;
        border: 1px solid ${COLORS.border};
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
        border-color: ${COLORS.primary};
      }
      .stat-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .stat-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      .stat-count {
        font-size: 24px;
        font-weight: 700;
        color: ${COLORS.text};
        line-height: 1;
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 11px;
        color: ${COLORS.textLight};
      }
      .stat-lifespan {
        font-size: 11px;
        color: ${COLORS.primary};
        font-weight: 500;
        margin-top: 4px;
      }
      .chart-container {
        background: ${COLORS.cardBg};
        border-radius: 12px;
        padding: 16px;
        border: 1px solid ${COLORS.border};
      }
      .chart-title {
        font-size: 13px;
        font-weight: 600;
        color: ${COLORS.text};
        margin-bottom: 12px;
      }
      .chart-legend {
        display: flex;
        gap: 16px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: ${COLORS.textLight};
      }
      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      #line-chart {
        width: 100%;
        height: 160px;
        display: block;
      }
      .selected-panel {
        background: ${COLORS.cardBg};
        border-radius: 12px;
        padding: 16px;
        border: 1px solid ${COLORS.border};
      }
      .selected-empty {
        text-align: center;
        color: ${COLORS.textLight};
        font-size: 12px;
        padding: 20px;
      }
      .selected-info {
        font-size: 12px;
        color: ${COLORS.text};
      }
      .selected-title {
        font-size: 14px;
        font-weight: 600;
        color: ${COLORS.primary};
        margin-bottom: 10px;
      }
      .selected-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px dashed ${COLORS.border};
      }
      .selected-row:last-child {
        border-bottom: none;
      }
      .selected-label {
        color: ${COLORS.textLight};
      }
      .selected-value {
        font-weight: 500;
        color: ${COLORS.text};
      }
    `;
    document.head.appendChild(style);
  }

  private createResourceSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'resource-section';
    section.innerHTML = `
      <div class="section-title">资源操作</div>
      <div class="resource-points">
        <span class="resource-icon">💎</span>
        <div>
          <div class="resource-value" id="resource-points">${this.currentSnapshot?.resourcePoints ?? 100}</div>
          <div class="resource-label">可用资源点</div>
        </div>
      </div>
      <div class="tool-grid">
        <button class="tool-btn" data-mode="placeBush" title="放置灌木 (消耗10点)">
          <span class="icon">🌿</span>
          <span>灌木</span>
        </button>
        <button class="tool-btn" data-mode="placeFruitTree" title="放置果树 (消耗25点)">
          <span class="icon">🌳</span>
          <span>果树</span>
        </button>
        <button class="tool-btn" data-mode="removePlant" title="移除植物 (返还5点)">
          <span class="icon">🪓</span>
          <span>移除</span>
        </button>
        <button class="tool-btn" data-mode="spawnHerbivore" title="投放食草动物 (消耗20点)">
          <span class="icon">🐰</span>
          <span>食草</span>
        </button>
        <button class="tool-btn" data-mode="spawnCarnivore" title="投放食肉动物 (消耗40点)">
          <span class="icon">🦊</span>
          <span>食肉</span>
        </button>
        <button class="tool-btn" data-mode="none" title="取消选择">
          <span class="icon">✋</span>
          <span>取消</span>
        </button>
      </div>
    `;

    const buttons = section.querySelectorAll('.tool-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as ToolMode;
        this.setToolMode(mode);
      });
    });

    return section;
  }

  private createStatsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'stats-section';
    section.innerHTML = `
      <div class="section-title">物种统计</div>
      <div class="stats-grid">
        <div class="stat-card" data-type="plant">
          <div class="stat-card-header">
            <div class="stat-icon" style="background: rgba(126, 200, 80, 0.2);">🌿</div>
            <div>
              <div class="stat-count" id="plant-count">${this.currentSnapshot?.plantCount ?? 0}</div>
              <div class="stat-label">植物</div>
            </div>
          </div>
          <div class="stat-lifespan">—</div>
        </div>
        <div class="stat-card" data-type="herbivore">
          <div class="stat-card-header">
            <div class="stat-icon" style="background: rgba(76, 175, 80, 0.2);">🐰</div>
            <div>
              <div class="stat-count" id="herbivore-count">${this.currentSnapshot?.herbivoreCount ?? 0}</div>
              <div class="stat-label">食草动物</div>
            </div>
          </div>
          <div class="stat-lifespan" id="herbivore-lifespan">平均寿命: —</div>
        </div>
        <div class="stat-card" data-type="carnivore">
          <div class="stat-card-header">
            <div class="stat-icon" style="background: rgba(229, 57, 53, 0.2);">🦊</div>
            <div>
              <div class="stat-count" id="carnivore-count">${this.currentSnapshot?.carnivoreCount ?? 0}</div>
              <div class="stat-label">食肉动物</div>
            </div>
          </div>
          <div class="stat-lifespan" id="carnivore-lifespan">平均寿命: —</div>
        </div>
      </div>
    `;
    return section;
  }

  private createChartSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'chart-section';
    section.innerHTML = `
      <div class="section-title">种群趋势</div>
      <div class="chart-container">
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: ${COLORS.plant};"></span>
            <span>植物</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: ${COLORS.herbivore};"></span>
            <span>食草动物</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: ${COLORS.carnivore};"></span>
            <span>食肉动物</span>
          </div>
        </div>
        <canvas id="line-chart"></canvas>
      </div>
    `;

    setTimeout(() => {
      this.chartCanvas = section.querySelector('#line-chart') as HTMLCanvasElement;
      if (this.chartCanvas) {
        this.chartCtx = this.chartCanvas.getContext('2d');
        this.resizeChart();
        const ro = new ResizeObserver(() => this.resizeChart());
        ro.observe(this.chartCanvas);
      }
    }, 0);

    return section;
  }

  private createSelectedSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'selected-section';
    section.id = 'selected-section';
    section.innerHTML = `
      <div class="section-title">选中单位</div>
      <div class="selected-panel">
        <div class="selected-empty" id="selected-empty">
          点击地图上的动物查看详情
        </div>
        <div class="selected-info" id="selected-info" style="display: none;"></div>
      </div>
    `;
    return section;
  }

  private resizeChart(): void {
    if (!this.chartCanvas) return;
    const rect = this.chartCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.chartCanvas.width = rect.width * dpr;
    this.chartCanvas.height = rect.height * dpr;
    this.chartCtx?.scale(dpr, dpr);
    this.renderChart();
  }

  private updateStats(): void {
    if (!this.currentSnapshot) return;

    const resourceEl = document.getElementById('resource-points');
    if (resourceEl) resourceEl.textContent = String(this.currentSnapshot.resourcePoints);

    const plantEl = document.getElementById('plant-count');
    if (plantEl) plantEl.textContent = String(this.currentSnapshot.plantCount);

    const herbEl = document.getElementById('herbivore-count');
    if (herbEl) herbEl.textContent = String(this.currentSnapshot.herbivoreCount);

    const carnEl = document.getElementById('carnivore-count');
    if (carnEl) carnEl.textContent = String(this.currentSnapshot.carnivoreCount);

    const herbLife = document.getElementById('herbivore-lifespan');
    if (herbLife) {
      const span = this.currentSnapshot.avgHerbivoreLifespan > 0
        ? `平均寿命: ${this.currentSnapshot.avgHerbivoreLifespan} | 当前: ${this.currentSnapshot.avgHerbivoreAge}`
        : '平均寿命: —';
      herbLife.textContent = span;
    }

    const carnLife = document.getElementById('carnivore-lifespan');
    if (carnLife) {
      const span = this.currentSnapshot.avgCarnivoreLifespan > 0
        ? `平均寿命: ${this.currentSnapshot.avgCarnivoreLifespan} | 当前: ${this.currentSnapshot.avgCarnivoreAge}`
        : '平均寿命: —';
      carnLife.textContent = span;
    }

    const chartTitle = this.container.querySelector('.chart-title');
    if (chartTitle && !chartTitle.textContent) {
      chartTitle.textContent = `资源存量 | 💧 ${this.currentSnapshot.waterAmount} | 🌱 ${this.currentSnapshot.grassAmount} | 🫐 ${this.currentSnapshot.berryAmount}`;
    } else if (chartTitle) {
      chartTitle.textContent = `资源存量 | 💧 ${this.currentSnapshot.waterAmount} | 🌱 ${this.currentSnapshot.grassAmount} | 🫐 ${this.currentSnapshot.berryAmount}`;
    }
  }

  private updateChartData(): void {
    const plant: number[] = [];
    const herbivore: number[] = [];
    const carnivore: number[] = [];

    for (const snap of this.history) {
      plant.push(snap.plantCount);
      herbivore.push(snap.herbivoreCount);
      carnivore.push(snap.carnivoreCount);
    }

    while (plant.length < 30) plant.unshift(0);
    while (herbivore.length < 30) herbivore.unshift(0);
    while (carnivore.length < 30) carnivore.unshift(0);

    this.chartData.plant = plant;
    this.chartData.herbivore = herbivore;
    this.chartData.carnivore = carnivore;
    this.chartData.animProgress = 0;
    this.chartData.lastUpdate = performance.now();

    if (this.chartData.displayPlant.length === 0) {
      this.chartData.displayPlant = [...plant];
      this.chartData.displayHerbivore = [...herbivore];
      this.chartData.displayCarnivore = [...carnivore];
    }
  }

  private startChartAnimation(): void {
    let lastTime = performance.now();
    const loop = (t: number) => {
      const dt = t - lastTime;
      lastTime = t;
      this.updateChartAnimation(dt);
      this.renderChart();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private updateChartAnimation(dt: number): void {
    const transitionDuration = 200;
    if (this.chartData.animProgress < 1) {
      this.chartData.animProgress = Math.min(1, this.chartData.animProgress + dt / transitionDuration);
      const t = this.easeInOut(this.chartData.animProgress);

      for (let i = 0; i < 30; i++) {
        this.chartData.displayPlant[i] = this.lerp(
          this.chartData.displayPlant[i] ?? 0,
          this.chartData.plant[i] ?? 0,
          t
        );
        this.chartData.displayHerbivore[i] = this.lerp(
          this.chartData.displayHerbivore[i] ?? 0,
          this.chartData.herbivore[i] ?? 0,
          t
        );
        this.chartData.displayCarnivore[i] = this.lerp(
          this.chartData.displayCarnivore[i] ?? 0,
          this.chartData.carnivore[i] ?? 0,
          t
        );
      }
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private renderChart(): void {
    if (!this.chartCtx || !this.chartCanvas) return;

    const ctx = this.chartCtx;
    const rect = this.chartCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const padding = { top: 10, right: 10, bottom: 10, left: 25 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
    }

    const allValues = [
      ...this.chartData.displayPlant,
      ...this.chartData.displayHerbivore,
      ...this.chartData.displayCarnivore,
    ];
    const maxVal = Math.max(1, ...allValues);
    const yScale = chartH / (maxVal * 1.2);

    ctx.fillStyle = COLORS.textLight;
    ctx.font = '10px "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal * 1.2 * i) / 4);
      const y = padding.top + chartH - (chartH * i) / 4;
      ctx.fillText(String(val), padding.left - 4, y);
    }

    this.drawSmoothLine(ctx, this.chartData.displayPlant, COLORS.plant, padding, chartW, chartH, yScale);
    this.drawSmoothLine(ctx, this.chartData.displayHerbivore, COLORS.herbivore, padding, chartW, chartH, yScale);
    this.drawSmoothLine(ctx, this.chartData.displayCarnivore, COLORS.carnivore, padding, chartW, chartH, yScale);
  }

  private drawSmoothLine(
    ctx: CanvasRenderingContext2D,
    data: number[],
    color: string,
    padding: { top: number; right: number; bottom: number; left: number },
    chartW: number,
    chartH: number,
    yScale: number
  ): void {
    if (data.length < 2) return;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (chartW * i) / (data.length - 1);
      const y = padding.top + chartH - (data[i] ?? 0) * yScale;
      points.push({ x, y });
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length >= 2) {
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    }
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private updateSelectedAnimal(): void {
    const emptyEl = document.getElementById('selected-empty');
    const infoEl = document.getElementById('selected-info');

    if (!this.selectedAnimal) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (infoEl) infoEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (infoEl) {
      infoEl.style.display = 'block';
      const typeName = this.selectedAnimal.type === 'herbivore' ? '🌿 食草动物' : '🦊 食肉动物';
      const stateMap: Record<string, string> = {
        idle: '休息中',
        foraging: '觅食中',
        fleeing: '逃跑中',
        hunting: '捕猎中',
        eating: '进食中',
        moving: '移动中',
        pursuing: '追击中',
      };
      const state = stateMap[this.selectedAnimal.state] || this.selectedAnimal.state;
      const target =
        this.selectedAnimal.targetX !== null && this.selectedAnimal.targetY !== null
          ? `(${this.selectedAnimal.targetX + 1}, ${this.selectedAnimal.targetY + 1})`
          : '无';

      infoEl.innerHTML = `
        <div class="selected-title">${typeName}</div>
        <div class="selected-row">
          <span class="selected-label">生命值</span>
          <span class="selected-value">${Math.round(this.selectedAnimal.health)} / ${this.selectedAnimal.maxHealth}</span>
        </div>
        <div class="selected-row">
          <span class="selected-label">体力值</span>
          <span class="selected-value">${Math.round(this.selectedAnimal.stamina)} / ${this.selectedAnimal.maxStamina}</span>
        </div>
        <div class="selected-row">
          <span class="selected-label">当前状态</span>
          <span class="selected-value">${state}</span>
        </div>
        <div class="selected-row">
          <span class="selected-label">目标位置</span>
          <span class="selected-value">${target}</span>
        </div>
        <div class="selected-row">
          <span class="selected-label">年龄</span>
          <span class="selected-value">${this.selectedAnimal.age} / ${this.selectedAnimal.maxAge}</span>
        </div>
      `;
    }
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
