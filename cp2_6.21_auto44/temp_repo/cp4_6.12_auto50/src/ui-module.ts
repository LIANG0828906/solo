import {
  eventBus,
  ScoreUpdateEvent,
  StorageUpdateEvent,
  ResourcesUpdateEvent,
  UpgradeAvailableEvent,
  GameWinEvent,
  UpgradeEvent,
} from './event-bus';

export class UIModule {
  private container: HTMLElement;
  private scoreBoard!: HTMLDivElement;
  private resourcesPanel!: HTMLDivElement;
  private upgradePanel!: HTMLDivElement;
  private winOverlay!: HTMLDivElement;

  private currentScore = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.buildUI();
    this.setupEventListeners();
  }

  private buildUI() {
    this.container.innerHTML = '';

    this.scoreBoard = document.createElement('div');
    this.scoreBoard.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(42, 32, 25, 0.9);
      border: 2px solid #2a2019;
      border-radius: 8px;
      padding: 14px 20px;
      color: #d4a017;
      font-family: 'Courier New', monospace;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    this.scoreBoard.innerHTML = `
      <div style="font-size:12px;opacity:0.7;margin-bottom:4px;">得分 SCORE</div>
      <div id="score-value" style="font-size:32px;font-weight:bold;color:#ffd700;margin-bottom:8px;">0</div>
      <div style="font-size:11px;opacity:0.8;line-height:1.6;">
        <div>用时: <span id="time-value" style="color:#c67c4e;">00:00</span></div>
        <div>处理件数: <span id="items-value" style="color:#c67c4e;">0</span></div>
        <div>目标: <span style="color:#4cd964;">500</span></div>
      </div>
    `;
    this.container.appendChild(this.scoreBoard);

    this.resourcesPanel = document.createElement('div');
    this.resourcesPanel.style.cssText = `
      position: absolute;
      top: 400px;
      right: 18px;
      background: rgba(42, 32, 25, 0.9);
      border: 2px solid #2a2019;
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-family: 'Courier New', monospace;
      width: 310px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    this.resourcesPanel.innerHTML = `
      <div style="font-size:13px;color:#c67c4e;font-weight:bold;margin-bottom:8px;text-align:center;">
        ⚙ 加工产出
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div style="text-align:center;background:rgba(76,175,80,0.2);border:1px solid #4caf50;border-radius:6px;padding:6px;">
          <div style="font-size:10px;opacity:0.7;">再生塑料</div>
          <div id="res-plastic" style="font-size:18px;font-weight:bold;color:#4caf50;">0</div>
        </div>
        <div style="text-align:center;background:rgba(158,158,158,0.2);border:1px solid #9e9e9e;border-radius:6px;padding:6px;">
          <div style="font-size:10px;opacity:0.7;">再生铜锭</div>
          <div id="res-metal" style="font-size:18px;font-weight:bold;color:#bdbdbd;">0</div>
        </div>
        <div style="text-align:center;background:rgba(230,198,25,0.2);border:1px solid #e6c619;border-radius:6px;padding:6px;">
          <div style="font-size:10px;opacity:0.7;">再生纸浆</div>
          <div id="res-paper" style="font-size:18px;font-weight:bold;color:#e6c619;">0</div>
        </div>
      </div>
    `;
    this.container.appendChild(this.resourcesPanel);

    this.upgradePanel = document.createElement('div');
    this.upgradePanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(42, 32, 25, 0.92);
      border: 2px solid #2a2019;
      border-radius: 8px;
      padding: 14px 16px;
      font-family: 'Courier New', monospace;
      width: 260px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    this.upgradePanel.innerHTML = `
      <div style="text-align:center;color:#d4a017;font-weight:bold;font-size:14px;margin-bottom:10px;">
        ⬆ 设 备 升 级
      </div>
      <div id="upgrade-buttons" style="display:flex;flex-direction:column;gap:8px;"></div>
    `;
    this.container.appendChild(this.upgradePanel);

    this.winOverlay = document.createElement('div');
    this.winOverlay.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.65);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 100;
    `;
    this.winOverlay.innerHTML = `
      <div id="win-card" style="
        background: #fff;
        border: 3px solid #d4a017;
        border-radius: 16px;
        padding: 40px 60px;
        text-align: center;
        font-family: 'Courier New', monospace;
        box-shadow: 0 10px 40px rgba(212,160,23,0.4);
        transform: scale(0.3);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease;
      ">
        <div style="font-size:80px;margin-bottom:10px;">🏆</div>
        <div style="font-size:32px;font-weight:bold;color:#d4a017;margin-bottom:20px;">恭 喜 通 关!</div>
        <div style="color:#4a3b32;font-size:16px;line-height:2;margin-bottom:25px;">
          <div>总用时: <span id="win-time" style="color:#c67c4e;font-weight:bold;">00:00</span></div>
          <div>总处理件数: <span id="win-items" style="color:#c67c4e;font-weight:bold;">0</span></div>
          <div>最终得分: <span id="win-score" style="color:#4cd964;font-weight:bold;">0</span></div>
        </div>
        <button id="restart-btn" style="
          background: linear-gradient(180deg, #ffd700, #d4a017);
          border: 2px solid #a07c10;
          border-radius: 8px;
          padding: 12px 30px;
          color: #2a2019;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(212,160,23,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        ">再 来 一 局</button>
      </div>
    `;
    this.container.appendChild(this.winOverlay);

    const restartBtn = this.winOverlay.querySelector('#restart-btn')!;
    restartBtn.addEventListener('mouseenter', () => {
      (restartBtn as HTMLElement).style.transform = 'scale(1.05)';
      (restartBtn as HTMLElement).style.boxShadow = '0 6px 16px rgba(212,160,23,0.6)';
    });
    restartBtn.addEventListener('mouseleave', () => {
      (restartBtn as HTMLElement).style.transform = 'scale(1)';
      (restartBtn as HTMLElement).style.boxShadow = '0 4px 10px rgba(212,160,23,0.4)';
    });
    restartBtn.addEventListener('click', () => {
      this.hideWinPanel();
      eventBus.emit('game:reset');
    });

    this.renderUpgradeButtons({
      belt: false,
      processor: false,
      storage: false,
      beltLevel: 0,
      processorLevel: 0,
      storageLevel: 0,
      nextCost: { belt: 100, processor: 100, storage: 100 },
      score: 0,
    });
  }

  private setupEventListeners() {
    eventBus.on('score:update', (d: ScoreUpdateEvent) => this.updateScore(d));
    eventBus.on('resources:update', (d: ResourcesUpdateEvent) => this.updateResources(d));
    eventBus.on('upgrade:available', (d: UpgradeAvailableEvent) => this.renderUpgradeButtons(d));
    eventBus.on('game:win', (d: GameWinEvent) => this.showWinPanel(d));
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private updateScore(d: ScoreUpdateEvent) {
    this.currentScore = d.score;
    const sv = this.scoreBoard.querySelector('#score-value');
    const tv = this.scoreBoard.querySelector('#time-value');
    const iv = this.scoreBoard.querySelector('#items-value');
    if (sv) sv.textContent = String(d.score);
    if (tv) tv.textContent = this.formatTime(d.elapsedTime);
    if (iv) iv.textContent = String(d.totalItems);
  }

  private updateResources(d: ResourcesUpdateEvent) {
    const rp = this.resourcesPanel.querySelector('#res-plastic');
    const rm = this.resourcesPanel.querySelector('#res-metal');
    const rpa = this.resourcesPanel.querySelector('#res-paper');
    if (rp) rp.textContent = String(d.plasticPellets);
    if (rm) rm.textContent = String(d.metalIngots);
    if (rpa) rpa.textContent = String(d.paperPulp);
  }

  private renderUpgradeButtons(d: UpgradeAvailableEvent) {
    const container = this.upgradePanel.querySelector('#upgrade-buttons')!;
    const equipments: Array<{ key: 'belt' | 'processor' | 'storage'; name: string; desc: string }> = [
      { key: 'belt', name: '分拣传送带', desc: '速度 +20%' },
      { key: 'processor', name: '加工机', desc: '效率 +15%' },
      { key: 'storage', name: '储料仓', desc: '容量 +30%' },
    ];

    container.innerHTML = equipments
      .map((eq) => {
        const level =
          eq.key === 'belt' ? d.beltLevel : eq.key === 'processor' ? d.processorLevel : d.storageLevel;
        const available =
          eq.key === 'belt' ? d.belt : eq.key === 'processor' ? d.processor : d.storage;
        const cost = d.nextCost[eq.key];
        const maxed = level >= 3;
        const canAfford = d.score >= cost;

        const bgStyle = maxed
          ? 'background: linear-gradient(180deg, #5a4a40, #3d2f26); opacity: 0.6; cursor: not-allowed;'
          : available
          ? `background: linear-gradient(180deg, #ffd700, #d4a017); cursor: pointer;
             animation: pulse-glow 0.3s ease-in-out infinite alternate;`
          : canAfford
          ? 'background: linear-gradient(180deg, #7a7a7a, #5a5a5a); cursor: pointer;'
          : 'background: linear-gradient(180deg, #5a4a40, #3d2f26); opacity: 0.7; cursor: not-allowed;';

        const textColor = maxed ? '#999' : available ? '#2a2019' : '#fff';
        const levelStars = '★'.repeat(level) + '☆'.repeat(3 - level);

        const btnLabel = maxed
          ? '已达最高级'
          : available
          ? `升级 (${cost} 分)`
          : canAfford
          ? `升级 (${cost} 分)`
          : `需要 ${cost} 分`;

        return `
          <button data-eq="${eq.key}" style="
            ${bgStyle}
            border: 2px solid #2a2019;
            border-radius: 8px;
            padding: 8px 12px;
            font-family: 'Courier New', monospace;
            color: ${textColor};
            font-weight: bold;
            font-size: 12px;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 3px;
            transition: transform 0.15s, box-shadow 0.15s;
            ${available ? 'box-shadow: 0 0 12px rgba(255,215,0,0.5);' : ''}
          ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span>${eq.name}</span>
              <span style="font-size:10px;color:${available ? '#2a2019' : '#d4a017'};">${levelStars}</span>
            </div>
            <div style="font-size:10px;opacity:0.8;font-weight:normal;">${eq.desc}</div>
            <div style="font-size:11px;text-align:right;margin-top:2px;">${btnLabel}</div>
          </button>
        `;
      })
      .join('');

    container.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const eq = btn.getAttribute('data-eq') as 'belt' | 'processor' | 'storage';
        eventBus.emit('upgrade:request', { equipment: eq });
      });
    });

    if (!document.getElementById('upgrade-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'upgrade-pulse-style';
      style.textContent = `
        @keyframes pulse-glow {
          from { box-shadow: 0 0 8px rgba(255,215,0,0.4); }
          to { box-shadow: 0 0 20px rgba(255,215,0,0.9); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private showWinPanel(d: GameWinEvent) {
    this.winOverlay.style.display = 'flex';
    const wt = this.winOverlay.querySelector('#win-time');
    const wi = this.winOverlay.querySelector('#win-items');
    const ws = this.winOverlay.querySelector('#win-score');
    if (wt) wt.textContent = this.formatTime(d.elapsedTime);
    if (wi) wi.textContent = String(d.totalItems);
    if (ws) ws.textContent = String(this.currentScore);

    requestAnimationFrame(() => {
      const card = this.winOverlay.querySelector('#win-card') as HTMLElement;
      if (card) {
        card.style.transform = 'scale(1)';
        card.style.opacity = '1';
      }
    });
  }

  private hideWinPanel() {
    const card = this.winOverlay.querySelector('#win-card') as HTMLElement;
    if (card) {
      card.style.transform = 'scale(0.3)';
      card.style.opacity = '0';
    }
    setTimeout(() => {
      this.winOverlay.style.display = 'none';
    }, 300);
  }
}
