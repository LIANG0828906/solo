import type { BuildingInfo } from './sceneBuilder';

const CARD_HTML = `
  <button class="card-close" id="card-close" aria-label="关闭">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
  <div class="card-glow"></div>
  <div class="card-icon" id="card-icon">🏛️</div>
  <div class="card-title" id="card-title">建筑名称</div>
  <span class="card-tag" id="card-tag">教学楼</span>
  <div class="card-stats">
    <div class="stat-item">
      <span class="stat-label">楼层数</span>
      <span class="stat-value" id="card-floors">-</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">类型</span>
      <span class="stat-value" id="card-type">-</span>
    </div>
  </div>
  <div class="card-desc-label">功能描述</div>
  <div class="card-description" id="card-desc">建筑功能描述内容将显示在这里。</div>
  <div class="card-footer">
    <span class="card-hint">按 ESC 键关闭</span>
  </div>
`;

const ADDITIONAL_STYLE = `
  .card-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 14px;
    background: radial-gradient(circle at 20% 10%, rgba(0, 188, 212, 0.18), transparent 55%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  #info-card.visible .card-glow {
    opacity: 1;
  }
  .card-close svg {
    display: block;
  }
  .card-footer {
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid rgba(77, 208, 225, 0.1);
    display: flex;
    justify-content: flex-end;
  }
  .card-hint {
    font-size: 10px;
    color: #455a64;
    letter-spacing: 1.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .card-hint::before {
    content: 'ESC';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    background: rgba(77, 208, 225, 0.1);
    border: 1px solid rgba(77, 208, 225, 0.3);
    border-radius: 4px;
    font-family: monospace;
    font-size: 9px;
    color: #4dd0e1;
    font-weight: 600;
  }
  #info-card::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #4dd0e1, #00bcd4, #80deea, transparent);
    border-radius: 14px 14px 0 0;
    opacity: 0.7;
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(400px); }
  }
  .scanline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(180deg, transparent, rgba(77, 208, 225, 0.15), transparent);
    animation: scanline 3.5s linear infinite;
    pointer-events: none;
    border-radius: 14px;
    overflow: hidden;
  }
  .mode-value {
    position: relative;
    display: inline-block;
  }
  .mode-value::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #00bcd4, #4dd0e1, #80deea);
    border-radius: 2px;
    box-shadow: 0 0 8px rgba(77, 208, 225, 0.6);
  }
  .control-panel {
    position: relative;
    overflow: hidden;
  }
  .control-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #00bcd4, #4dd0e1);
    border-radius: 10px 0 0 10px;
  }
  .fps-bar {
    width: 40px;
    height: 4px;
    background: rgba(77, 208, 225, 0.15);
    border-radius: 2px;
    margin-top: 4px;
    overflow: hidden;
  }
  .fps-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ef5350, #ffb74d, #66bb6a);
    width: 100%;
    transition: width 0.3s ease, background 0.3s ease;
  }
  #loading-screen::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(0, 188, 212, 0.12), transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(128, 222, 234, 0.1), transparent 45%);
    pointer-events: none;
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 12px rgba(77, 208, 225, 0.8); }
    50% { box-shadow: 0 0 24px rgba(77, 208, 225, 1), 0 0 36px rgba(0, 188, 212, 0.5); }
  }
  .progress-bar {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  .hints-panel {
    position: relative;
    overflow: hidden;
  }
  .hints-panel::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(77, 208, 225, 0.4), transparent);
  }
  .key-cap {
    position: relative;
    overflow: hidden;
  }
  .key-cap::after {
    content: '';
    position: absolute;
    top: 0;
    left: -50%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(77, 208, 225, 0.3), transparent);
    animation: key-shine 2.5s ease-in-out infinite;
  }
  @keyframes key-shine {
    0% { left: -50%; }
    50%, 100% { left: 150%; }
  }
  .hint-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 16px;
    background: rgba(77, 208, 225, 0.15);
  }
  .hint-item {
    position: relative;
  }
  #fps-counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 68px;
  }
`;

export class UIManager {
  private infoCard: HTMLElement | null = null;
  private cardIcon: HTMLElement | null = null;
  private cardTitle: HTMLElement | null = null;
  private cardTag: HTMLElement | null = null;
  private cardFloors: HTMLElement | null = null;
  private cardType: HTMLElement | null = null;
  private cardDesc: HTMLElement | null = null;
  private cardClose: HTMLElement | null = null;
  private modeDisplay: HTMLElement | null = null;
  private fpsCounter: HTMLElement | null = null;
  private fpsBarFill: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private progressText: HTMLElement | null = null;
  private loadingScreen: HTMLElement | null = null;

  public onClose?: () => void;
  private currentBuildingId: string | null = null;
  private isVisible = false;
  private cardCreated = false;

  constructor() {
    this.injectStyles();
    this.mountStaticElements();
    this.createInfoCard();
    this.bindCardEvents();
  }

  private injectStyles(): void {
    const styleId = 'dynamic-ui-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = ADDITIONAL_STYLE;
    document.head.appendChild(style);
  }

  private mountStaticElements(): void {
    const container = document.getElementById('app');
    if (!container) return;

    if (!document.getElementById('ui-controls')) {
      const controls = document.createElement('div');
      controls.id = 'ui-controls';
      controls.innerHTML = `
        <div class="control-panel">
          <div class="mode-label">当前模式</div>
          <div class="mode-value" id="mode-display">第一人称漫游</div>
        </div>
      `;
      container.appendChild(controls);
    }

    if (!document.getElementById('ui-hints')) {
      const hints = document.createElement('div');
      hints.id = 'ui-hints';
      hints.innerHTML = `
        <div class="hints-panel">
          <div class="hint-item"><span class="key-cap">W</span><span class="key-cap">A</span><span class="key-cap">S</span><span class="key-cap">D</span>移动</div>
          <div class="hint-item"><span class="key-cap">V</span>切换视角</div>
          <div class="hint-item"><span class="key-cap">拖拽</span>旋转俯瞰</div>
          <div class="hint-item"><span class="key-cap">点击</span>建筑信息</div>
          <div class="hint-item"><span class="key-cap">ESC</span>关闭卡片</div>
        </div>
      `;
      container.appendChild(hints);
    }

    if (!document.getElementById('fps-counter')) {
      const fps = document.createElement('div');
      fps.id = 'fps-counter';
      fps.innerHTML = `
        <div>FPS: <span id="fps-value">--</span></div>
        <div class="fps-bar"><div class="fps-bar-fill" id="fps-bar-fill"></div></div>
      `;
      container.appendChild(fps);
    }

    if (!document.getElementById('loading-screen')) {
      const loading = document.createElement('div');
      loading.id = 'loading-screen';
      loading.innerHTML = `
        <div class="loading-title">CAMPUS EXPLORER</div>
        <div class="loading-subtitle">虚拟校园漫游系统初始化中</div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" id="progress-bar"></div>
        </div>
        <div class="progress-text" id="progress-text">准备资源 0%</div>
      `;
      container.appendChild(loading);
    }

    this.modeDisplay = document.getElementById('mode-display');
    this.fpsCounter = document.getElementById('fps-value');
    this.fpsBarFill = document.getElementById('fps-bar-fill');
    this.progressBar = document.getElementById('progress-bar');
    this.progressText = document.getElementById('progress-text');
    this.loadingScreen = document.getElementById('loading-screen');
  }

  private createInfoCard(): void {
    if (this.cardCreated) return;

    const existing = document.getElementById('info-card');
    if (existing) {
      existing.remove();
    }

    const container = document.getElementById('app');
    if (!container) return;

    const card = document.createElement('div');
    card.id = 'info-card';
    card.innerHTML = CARD_HTML;

    const scanline = document.createElement('div');
    scanline.className = 'scanline';
    card.appendChild(scanline);

    container.appendChild(card);
    this.cardCreated = true;

    this.infoCard = card;
    this.cardIcon = document.getElementById('card-icon');
    this.cardTitle = document.getElementById('card-title');
    this.cardTag = document.getElementById('card-tag');
    this.cardFloors = document.getElementById('card-floors');
    this.cardType = document.getElementById('card-type');
    this.cardDesc = document.getElementById('card-desc');
    this.cardClose = document.getElementById('card-close');
  }

  private bindCardEvents(): void {
    if (this.cardClose) {
      this.cardClose.addEventListener('click', () => this.hideCard());
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isVisible) {
        this.hideCard();
      }
    });

    if (this.infoCard) {
      this.infoCard.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  setProgress(loaded: number, total: number, stage: string): void {
    if (!this.progressBar || !this.progressText) return;
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    this.progressBar.style.width = `${pct}%`;
    this.progressText.textContent = `${stage} ${pct}%`;
  }

  hideLoading(delay = 400): void {
    if (!this.progressBar || !this.progressText || !this.loadingScreen) return;
    this.progressBar.style.width = '100%';
    this.progressText.textContent = '场景加载完成 100%';
    setTimeout(() => {
      this.loadingScreen!.classList.add('hidden');
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = 'none';
        }
      }, 700);
    }, delay);
  }

  setMode(mode: 'firstPerson' | 'overhead'): void {
    if (!this.modeDisplay) return;
    const text = mode === 'firstPerson' ? '第一人称漫游' : '俯瞰漫游模式';
    this.modeDisplay.style.transition = 'none';
    this.modeDisplay.style.opacity = '0';
    this.modeDisplay.style.transform = 'translateY(-4px)';
    requestAnimationFrame(() => {
      if (!this.modeDisplay) return;
      this.modeDisplay.textContent = text;
      this.modeDisplay.style.transition = '';
      this.modeDisplay.style.opacity = '';
      this.modeDisplay.style.transform = '';
    });
  }

  updateFPS(fps: number): void {
    if (this.fpsCounter) {
      this.fpsCounter.textContent = fps.toFixed(0);
    }
    if (this.fpsBarFill) {
      const pct = Math.min(100, (fps / 75) * 100);
      this.fpsBarFill.style.width = `${pct}%`;
      if (fps >= 55) {
        this.fpsBarFill.style.background = 'linear-gradient(90deg, #66bb6a, #81c784)';
        if (this.fpsCounter) this.fpsCounter.style.color = '#66bb6a';
      } else if (fps >= 35) {
        this.fpsBarFill.style.background = 'linear-gradient(90deg, #4dd0e1, #80deea)';
        if (this.fpsCounter) this.fpsCounter.style.color = '#4dd0e1';
      } else if (fps >= 30) {
        this.fpsBarFill.style.background = 'linear-gradient(90deg, #ffb74d, #ffcc80)';
        if (this.fpsCounter) this.fpsCounter.style.color = '#ffb74d';
      } else {
        this.fpsBarFill.style.background = 'linear-gradient(90deg, #ef5350, #e57373)';
        if (this.fpsCounter) this.fpsCounter.style.color = '#ef5350';
      }
    }
  }

  showCard(info: BuildingInfo): void {
    if (!this.infoCard || !this.cardIcon || !this.cardTitle || !this.cardTag ||
        !this.cardFloors || !this.cardType || !this.cardDesc) {
      return;
    }

    if (this.currentBuildingId === info.id && this.isVisible) {
      this.flashCard();
      return;
    }

    this.currentBuildingId = info.id;

    this.cardIcon.textContent = info.icon || '🏛️';
    this.cardTitle.textContent = info.name;
    this.cardTag.textContent = info.tag || info.type;
    this.cardFloors.textContent = `${info.floors} 层`;
    this.cardType.textContent = info.type;
    this.cardDesc.textContent = info.description;

    if (!this.isVisible) {
      requestAnimationFrame(() => {
        this.infoCard!.classList.add('visible');
        this.isVisible = true;
      });
    } else {
      this.flashCard();
    }
  }

  private flashCard(): void {
    if (!this.infoCard) return;
    this.infoCard.style.transition = 'none';
    this.infoCard.style.opacity = '0.35';
    this.infoCard.style.transform = 'translateY(-50%) translateX(10px) scale(0.98)';
    requestAnimationFrame(() => {
      if (!this.infoCard) return;
      this.infoCard.style.transition = '';
      this.infoCard.style.opacity = '';
      this.infoCard.style.transform = '';
    });
  }

  hideCard(): void {
    if (!this.isVisible || !this.infoCard) return;
    this.infoCard.classList.remove('visible');
    this.isVisible = false;
    this.currentBuildingId = null;
    this.onClose?.();
  }

  getIsCardVisible(): boolean {
    return this.isVisible;
  }
}
