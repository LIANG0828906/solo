import { gameState } from './gameState';
import { tradeManager } from './tradeManager';
import type { Commodity, TransportMission, ShipUpgrade, NewsEvent } from './types';

type PanelType = 'trade' | 'missions' | 'upgrades' | 'cargo';

class UILayer {
  private container: HTMLElement;
  private topBar: HTMLElement;
  private bottomPanel: HTMLElement;
  private leftPanel: HTMLElement;
  private rightPanel: HTMLElement;
  private tradePanel: HTMLElement;
  private missionPanel: HTMLElement;
  private upgradePanel: HTMLElement;
  private cargoPanel: HTMLElement;
  private newsContainer: HTMLElement;
  private hamburgerMenu: HTMLElement;
  private quantityInputs: Map<string, HTMLInputElement> = new Map();
  private activePanel: PanelType = 'trade';
  private isMobile: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ui-layer';
    this.applyStyles(this.container, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1000',
      fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif'
    });

    this.createStyles();

    this.topBar = this.createTopBar();
    this.bottomPanel = this.createBottomPanel();
    this.leftPanel = this.createLeftPanel();
    this.rightPanel = this.createRightPanel();
    this.newsContainer = this.createNewsContainer();
    this.hamburgerMenu = this.createHamburgerMenu();

    this.tradePanel = this.createTradePanel();
    this.missionPanel = this.createMissionPanel();
    this.upgradePanel = this.createUpgradePanel();
    this.cargoPanel = this.createCargoPanel();

    this.rightPanel.appendChild(this.tradePanel);
    this.rightPanel.appendChild(this.missionPanel);
    this.rightPanel.appendChild(this.upgradePanel);
    this.rightPanel.appendChild(this.cargoPanel);

    this.container.appendChild(this.topBar);
    this.container.appendChild(this.bottomPanel);
    this.container.appendChild(this.leftPanel);
    this.container.appendChild(this.rightPanel);
    this.container.appendChild(this.newsContainer);
    this.container.appendChild(this.hamburgerMenu);

    document.body.appendChild(this.container);

    this.setupEventListeners();
    this.switchPanel('trade');
    this.checkMobileViewport();
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes slideInLeft {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes checkmark {
        0% { stroke-dashoffset: 50; }
        100% { stroke-dashoffset: 0; }
      }
      
      @keyframes coinDrop {
        0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(50px) rotate(360deg); opacity: 0; }
      }
      
      @keyframes ripple {
        0% { transform: scale(0); opacity: 0.8; }
        100% { transform: scale(5); opacity: 0; }
      }
      
      .ui-enter-down {
        animation: slideInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .ui-enter-up {
        animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .ui-enter-left {
        animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .ui-enter-right {
        animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .trade-btn {
        background: linear-gradient(135deg, #10b981, #3b82f6);
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      
      .trade-btn.buy-btn {
        background: linear-gradient(135deg, #ef4444, #8b5cf6);
      }
      
      .trade-btn.buy-btn:hover {
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
      }
      
      .trade-btn.sell-btn {
        background: linear-gradient(135deg, #10b981, #3b82f6);
      }
      
      .trade-btn.sell-btn:hover {
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      }
      
      .trade-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
      }
      
      .trade-btn:active {
        transform: scale(0.95);
      }
      
      .trade-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        animation: ripple 0.6s linear forwards;
        pointer-events: none;
      }
      
      .glass-panel {
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
      }
      
      .commodity-card {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.3s ease-out;
      }
      
      .commodity-card:hover {
        background: rgba(51, 65, 85, 0.9);
        border-color: rgba(59, 130, 246, 0.5);
        transform: translateX(4px);
      }
      
      .mission-card {
        background: rgba(30, 41, 59, 0.8);
        border: 2px solid #fbbf24;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.3s ease-out;
      }
      
      .mission-card.completed {
        border-color: #10b981;
        opacity: 0.7;
      }
      
      .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transition: width 0.3s ease-out;
      }
      
      .progress-fill.fuel {
        background: linear-gradient(90deg, #f59e0b, #ef4444);
      }
      
      .tab-btn {
        background: rgba(30, 41, 59, 0.6);
        border: none;
        padding: 12px 20px;
        color: #94a3b8;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease-out;
        border-radius: 8px 8px 0 0;
      }
      
      .tab-btn.active {
        background: rgba(15, 23, 42, 0.75);
        color: #fbbf24;
      }
      
      .tab-btn:hover:not(.active) {
        background: rgba(51, 65, 85, 0.6);
        color: #e2e8f0;
      }
      
      .news-alert {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 8px;
        animation: slideInRight 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
      }
      
      .checkmark-svg {
        width: 24px;
        height: 24px;
      }
      
      .checkmark-svg path {
        stroke-dasharray: 50;
        stroke-dashoffset: 0;
        animation: checkmark 0.5s ease-out forwards;
      }
      
      .coin-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: middle;
      }
      
      .price-up { color: #10b981; }
      .price-down { color: #ef4444; }
      .price-stable { color: #94a3b8; }
      
      .price-tag {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: white;
      }
      
      .buy-price-tag {
        background: #ef4444;
      }
      
      .sell-price-tag {
        background: #10b981;
      }
      
      .price-tags-container {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        align-items: center;
      }
      
      .hamburger {
        display: none;
        flex-direction: column;
        gap: 5px;
        cursor: pointer;
        padding: 10px;
        pointer-events: auto;
      }
      
      .hamburger span {
        width: 25px;
        height: 3px;
        background: #e2e8f0;
        border-radius: 2px;
        transition: all 0.3s ease;
        transform-origin: center;
      }
      
      .hamburger.active span:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }
      
      .hamburger.active span:nth-child(2) {
        opacity: 0;
        transform: scaleX(0);
      }
      
      .hamburger.active span:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
      }
      
      @media (max-width: 768px) {
        .hamburger {
          display: flex;
        }
        
        .bottom-panel {
          transform: translateX(-50%) translateY(calc(100% - 60px));
          transition: transform 0.3s ease;
        }
        
        .bottom-panel.expanded {
          transform: translateX(-50%) translateY(0);
        }
        
        .right-panel {
          width: calc(100% - 20px) !important;
          max-height: 50vh !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private applyStyles(element: HTMLElement, styles: Record<string, string>): void {
    Object.assign(element.style, styles);
  }

  private checkMobileViewport(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.bottomPanel.classList.remove('expanded');
      this.hamburgerMenu.classList.remove('active');
    }
  }

  private createTopBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'ui-enter-down';
    this.applyStyles(bar, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'auto',
      animationDelay: '0.1s',
      opacity: '0'
    });

    const missionContainer = document.createElement('div');
    missionContainer.id = 'mission-bar';
    this.applyStyles(missionContainer, {
      display: 'flex',
      gap: '12px',
      maxWidth: '800px',
      overflowX: 'auto',
      padding: '8px',
      scrollbarWidth: 'thin'
    });

    const placeholder = document.createElement('div');
    placeholder.textContent = '暂无运输任务';
    this.applyStyles(placeholder, {
      color: '#94a3b8',
      fontSize: '14px',
      padding: '8px 16px'
    });
    missionContainer.appendChild(placeholder);

    bar.appendChild(missionContainer);
    return bar;
  }

  private createBottomPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'bottom-panel ui-enter-up glass-panel';
    this.applyStyles(panel, {
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      display: 'flex',
      gap: '24px',
      alignItems: 'center',
      pointerEvents: 'auto',
      animationDelay: '0.3s',
      opacity: '0',
      maxWidth: '90vw'
    });

    const creditsDisplay = document.createElement('div');
    creditsDisplay.id = 'credits-display';
    this.applyStyles(creditsDisplay, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#fbbf24',
      fontSize: '20px',
      fontWeight: '600'
    });
    creditsDisplay.innerHTML = `<span class="coin-icon"></span><span id="credits-value">${gameState.getCredits()}</span>`;

    const fuelDisplay = document.createElement('div');
    fuelDisplay.id = 'fuel-display';
    this.applyStyles(fuelDisplay, {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '150px'
    });
    
    const fuelLabel = document.createElement('div');
    this.applyStyles(fuelLabel, {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#94a3b8',
      fontSize: '12px'
    });
    fuelLabel.innerHTML = `<span>燃料</span><span id="fuel-value">${gameState.getShip().fuel}/${gameState.getShip().maxFuel}</span>`;
    
    const fuelBar = document.createElement('div');
    fuelBar.className = 'progress-bar';
    const fuelFill = document.createElement('div');
    fuelFill.id = 'fuel-fill';
    fuelFill.className = 'progress-fill fuel';
    fuelFill.style.width = `${(gameState.getShip().fuel / gameState.getShip().maxFuel) * 100}%`;
    fuelBar.appendChild(fuelFill);
    
    fuelDisplay.appendChild(fuelLabel);
    fuelDisplay.appendChild(fuelBar);

    const cargoDisplay = document.createElement('div');
    cargoDisplay.id = 'cargo-display';
    this.applyStyles(cargoDisplay, {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minWidth: '150px'
    });
    
    const cargoLabel = document.createElement('div');
    this.applyStyles(cargoLabel, {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#94a3b8',
      fontSize: '12px'
    });
    const cargoUsed = gameState.getCurrentCargoWeight();
    const cargoMax = gameState.getShip().cargoCapacity;
    cargoLabel.innerHTML = `<span>货仓</span><span id="cargo-value">${cargoUsed}/${cargoMax}</span>`;
    
    const cargoBar = document.createElement('div');
    cargoBar.className = 'progress-bar';
    const cargoFill = document.createElement('div');
    cargoFill.id = 'cargo-fill';
    cargoFill.className = 'progress-fill';
    cargoFill.style.width = `${(cargoUsed / cargoMax) * 100}%`;
    cargoBar.appendChild(cargoFill);
    
    cargoDisplay.appendChild(cargoLabel);
    cargoDisplay.appendChild(cargoBar);

    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'status-display';
    this.applyStyles(statusDisplay, {
      color: '#10b981',
      fontSize: '14px',
      fontWeight: '500'
    });
    statusDisplay.textContent = '停泊中';

    panel.appendChild(creditsDisplay);
    panel.appendChild(fuelDisplay);
    panel.appendChild(cargoDisplay);
    panel.appendChild(statusDisplay);

    return panel;
  }

  private createLeftPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'ui-enter-left glass-panel';
    this.applyStyles(panel, {
      position: 'absolute',
      left: '20px',
      top: '100px',
      width: '280px',
      padding: '20px',
      pointerEvents: 'auto',
      animationDelay: '0.2s',
      opacity: '0',
      maxHeight: 'calc(100vh - 200px)',
      overflowY: 'auto'
    });

    const currentPlanetId = gameState.getShip().currentPlanetId;
    const currentPlanet = currentPlanetId 
      ? gameState.getPlanet(currentPlanetId)
      : null;

    const title = document.createElement('div');
    this.applyStyles(title, {
      color: '#e2e8f0',
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });
    title.innerHTML = `<span>📍</span><span id="current-planet-name">${currentPlanet?.name || '飞行中'}</span>`;

    const tabs = document.createElement('div');
    this.applyStyles(tabs, {
      display: 'flex',
      gap: '4px',
      marginBottom: '16px',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    });

    const tradeTab = this.createTabBtn('交易', 'trade', true);
    const missionTab = this.createTabBtn('任务', 'missions');
    const upgradeTab = this.createTabBtn('升级', 'upgrades');
    const cargoTab = this.createTabBtn('货仓', 'cargo');

    tabs.appendChild(tradeTab);
    tabs.appendChild(missionTab);
    tabs.appendChild(upgradeTab);
    tabs.appendChild(cargoTab);

    const infoBox = document.createElement('div');
    infoBox.id = 'planet-info';
    this.applyStyles(infoBox, {
      background: 'rgba(51, 65, 85, 0.5)',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      fontSize: '13px',
      color: '#94a3b8'
    });
    infoBox.innerHTML = currentPlanet 
      ? `<div>类型: ${currentPlanet.isStation ? '🛰️ 空间站' : '🪐 星球'}</div>
         <div>直径: ${(currentPlanet.size * 2).toFixed(1)} 单位</div>`
      : '<div>飞船正在航行中...</div>';

    panel.appendChild(title);
    panel.appendChild(tabs);
    panel.appendChild(infoBox);

    return panel;
  }

  private createTabBtn(label: string, panel: PanelType, active: boolean = false): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', (e) => {
      this.addRippleEffect(btn, e as MouseEvent);
      this.switchPanel(panel);
    });
    return btn;
  }

  private createRightPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'ui-enter-right glass-panel';
    this.applyStyles(panel, {
      position: 'absolute',
      right: '20px',
      top: '100px',
      width: '380px',
      pointerEvents: 'auto',
      animationDelay: '0.4s',
      opacity: '0',
      maxHeight: 'calc(100vh - 200px)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    });
    return panel;
  }

  private createTradePanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'trade-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none',
      flex: '1'
    });

    const title = document.createElement('div');
    this.applyStyles(title, {
      color: '#fbbf24',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px'
    });
    title.textContent = '📦 商品交易';

    const container = document.createElement('div');
    container.id = 'commodities-container';
    this.applyStyles(container, {
      flex: '1',
      overflowY: 'auto'
    });

    panel.appendChild(title);
    panel.appendChild(container);
    return panel;
  }

  private createMissionPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'mission-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none',
      flex: '1'
    });

    const title = document.createElement('div');
    this.applyStyles(title, {
      color: '#fbbf24',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px'
    });
    title.textContent = '📋 运输任务';

    const container = document.createElement('div');
    container.id = 'missions-container';
    this.applyStyles(container, {
      flex: '1',
      overflowY: 'auto'
    });

    panel.appendChild(title);
    panel.appendChild(container);
    return panel;
  }

  private createUpgradePanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'upgrade-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none',
      flex: '1'
    });

    const title = document.createElement('div');
    this.applyStyles(title, {
      color: '#fbbf24',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px'
    });
    title.textContent = '🔧 飞船升级';

    const hint = document.createElement('div');
    hint.id = 'upgrade-hint';
    this.applyStyles(hint, {
      color: '#94a3b8',
      fontSize: '13px',
      padding: '12px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      marginBottom: '16px'
    });
    hint.textContent = '⚠️ 只有在空间站才能购买升级';

    const container = document.createElement('div');
    container.id = 'upgrades-container';
    this.applyStyles(container, {
      flex: '1',
      overflowY: 'auto'
    });

    panel.appendChild(title);
    panel.appendChild(hint);
    panel.appendChild(container);
    return panel;
  }

  private createCargoPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'cargo-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none',
      flex: '1'
    });

    const title = document.createElement('div');
    this.applyStyles(title, {
      color: '#fbbf24',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px'
    });
    title.textContent = '🚚 货仓清单';

    const container = document.createElement('div');
    container.id = 'cargo-container';
    this.applyStyles(container, {
      flex: '1',
      overflowY: 'auto'
    });

    panel.appendChild(title);
    panel.appendChild(container);
    return panel;
  }

  private createNewsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'news-container';
    this.applyStyles(container, {
      position: 'absolute',
      top: '80px',
      right: '20px',
      width: '320px',
      pointerEvents: 'auto',
      zIndex: '1001'
    });
    return container;
  }

  private createHamburgerMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'hamburger';
    this.applyStyles(menu, {
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '1002'
    });
    menu.innerHTML = '<span></span><span></span><span></span>';
    
    menu.addEventListener('click', () => {
      menu.classList.toggle('active');
      this.bottomPanel.classList.toggle('expanded');
    });
    
    return menu;
  }

  private setupEventListeners(): void {
    window.addEventListener('news-alert', (e: Event) => {
      const customEvent = e as CustomEvent;
      this.showNews(customEvent.detail.event);
    });

    window.addEventListener('resize', () => {
      this.checkMobileViewport();
    });

    gameState.subscribe(() => this.refresh());
  }

  private switchPanel(panel: PanelType): void {
    this.activePanel = panel;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if ((btn as HTMLElement).textContent === this.getPanelLabel(panel)) {
        btn.classList.add('active');
      }
    });

    this.tradePanel.style.display = panel === 'trade' ? 'flex' : 'none';
    this.missionPanel.style.display = panel === 'missions' ? 'flex' : 'none';
    this.upgradePanel.style.display = panel === 'upgrades' ? 'flex' : 'none';
    this.cargoPanel.style.display = panel === 'cargo' ? 'flex' : 'none';

    this.refresh();
  }

  private getPanelLabel(panel: PanelType): string {
    const labels: Record<PanelType, string> = {
      trade: '交易',
      missions: '任务',
      upgrades: '升级',
      cargo: '货仓'
    };
    return labels[panel];
  }

  private addRippleEffect(btn: HTMLElement, e: MouseEvent): void {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  public showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    const colors: Record<string, string> = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #3b82f6, #6366f1)'
    };
    
    this.applyStyles(toast, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '16px 32px',
      background: colors[type],
      color: 'white',
      borderRadius: '12px',
      fontWeight: '600',
      zIndex: '10000',
      animation: 'fadeIn 0.3s ease-out',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      pointerEvents: 'none'
    });
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  private showNews(event: NewsEvent): void {
    const alert = document.createElement('div');
    alert.className = 'news-alert';
    
    this.applyStyles(alert, {
      pointerEvents: 'auto',
      cursor: 'pointer'
    });
    
    alert.innerHTML = `
      <div style="font-weight:600; margin-bottom:4px;">📰 ${event.title}</div>
      <div style="font-size:13px; opacity:0.9;">${event.description}</div>
    `;
    
    this.newsContainer.appendChild(alert);
    
    alert.addEventListener('click', () => {
      alert.style.opacity = '0';
      alert.style.transition = 'opacity 0.3s';
      setTimeout(() => alert.remove(), 300);
    });
    
    setTimeout(() => {
      if (alert.parentNode) {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s';
        setTimeout(() => alert.remove(), 500);
      }
    }, 8000);
  }

  private refresh(): void {
    this.updateStatusDisplay();
    this.updateCreditsDisplay();
    this.updateFuelDisplay();
    this.updateCargoDisplay();
    this.updateCurrentPlanetInfo();

    switch (this.activePanel) {
      case 'trade':
        this.renderTradePanel();
        break;
      case 'missions':
        this.renderMissionPanel();
        break;
      case 'upgrades':
        this.renderUpgradePanel();
        break;
      case 'cargo':
        this.renderCargoPanel();
        break;
    }
    this.renderMissionBar();
  }

  private updateStatusDisplay(): void {
    const statusEl = document.getElementById('status-display');
    if (statusEl) {
      const ship = gameState.getShip();
      if (ship.isFlying) {
        statusEl.textContent = '🚀 飞行中';
        statusEl.style.color = '#f59e0b';
      } else {
        statusEl.textContent = '🛬 停泊中';
        statusEl.style.color = '#10b981';
      }
    }
  }

  private updateCreditsDisplay(): void {
    const creditsValue = document.getElementById('credits-value');
    if (creditsValue) {
      creditsValue.textContent = `${gameState.getCredits()}`;
    }
  }

  private updateFuelDisplay(): void {
    const fuelValue = document.getElementById('fuel-value');
    const fuelFill = document.getElementById('fuel-fill') as HTMLElement;
    const ship = gameState.getShip();
    if (fuelValue) {
      fuelValue.textContent = `${Math.floor(ship.fuel)}/${ship.maxFuel}`;
    }
    if (fuelFill) {
      fuelFill.style.width = `${(ship.fuel / ship.maxFuel) * 100}%`;
    }
  }

  private updateCargoDisplay(): void {
    const cargoValue = document.getElementById('cargo-value');
    const cargoFill = document.getElementById('cargo-fill') as HTMLElement;
    const used = gameState.getCurrentCargoWeight();
    const max = gameState.getShip().cargoCapacity;
    if (cargoValue) {
      cargoValue.textContent = `${used}/${max}`;
    }
    if (cargoFill) {
      cargoFill.style.width = `${(used / max) * 100}%`;
    }
  }

  private updateCurrentPlanetInfo(): void {
    const nameEl = document.getElementById('current-planet-name');
    const infoEl = document.getElementById('planet-info');
    const currentPlanetId = gameState.getShip().currentPlanetId;
    const planet = currentPlanetId ? gameState.getPlanet(currentPlanetId) : null;
    
    if (nameEl) {
      nameEl.textContent = planet?.name || '飞行中';
    }
    if (infoEl) {
      if (planet) {
        infoEl.innerHTML = `
          <div>类型: ${planet.isStation ? '🛰️ 空间站' : '🪐 星球'}</div>
          <div>直径: ${(planet.size * 2).toFixed(1)} 单位</div>
        `;
      } else {
        infoEl.innerHTML = '<div>飞船正在航行中...</div>';
      }
    }
  }

  private renderTradePanel(): void {
    const container = document.getElementById('commodities-container');
    if (!container) return;
    
    container.innerHTML = '';
    this.quantityInputs.clear();

    const currentPlanetId = gameState.getShip().currentPlanetId;
    if (!currentPlanetId || gameState.getShip().isFlying) {
      container.innerHTML = '<div style="color:#94a3b8; padding:20px; text-align:center;">请先降落到星球才能交易</div>';
      return;
    }

    const planet = gameState.getPlanet(currentPlanetId);
    if (!planet) return;

    const commodities = Array.from(planet.commodities.values());
    
    commodities.forEach(commodity => {
      const card = document.createElement('div');
      card.className = 'commodity-card';
      
      const trend = tradeManager.getPriceTrend(currentPlanetId, commodity.id);
      const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
      const trendClass = `price-${trend}`;
      const cargoQty = gameState.getCargoQuantity(commodity.id);
      const buyPrice = Math.round(commodity.currentPrice * 1.1);
      const sellPrice = commodity.currentPrice;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">${commodity.icon}</span>
            <div>
              <div style="color:#e2e8f0; font-weight:600;">${commodity.name}</div>
              <div style="font-size:12px; color:#64748b;">库存: ${commodity.supply}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <span class="price-up" style="font-size:20px; margin-right:4px;">${trendIcon}</span>
            <div class="price-tags-container">
              <span class="price-tag buy-price-tag">买入 ${buyPrice}</span>
            </div>
            <div style="margin-top:4px;">
              <span class="price-tag sell-price-tag">卖出 ${sellPrice}</span>
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-top:4px;">持有: ${cargoQty}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="number" min="1" value="1" 
            style="flex:1; padding:8px 12px; background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#e2e8f0; font-size:14px; outline:none;"
            id="qty-${commodity.id}" />
          <button class="trade-btn buy-btn" data-action="buy" data-id="${commodity.id}">买入</button>
          <button class="trade-btn sell-btn" data-action="sell" data-id="${commodity.id}">卖出</button>
        </div>
      `;

      container.appendChild(card);

      const input = card.querySelector(`#qty-${commodity.id}`) as HTMLInputElement;
      this.quantityInputs.set(commodity.id, input);

      card.querySelectorAll('.trade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.addRippleEffect(btn as HTMLElement, e as MouseEvent);
          const action = (btn as HTMLElement).dataset.action as 'buy' | 'sell';
          const id = (btn as HTMLElement).dataset.id!;
          const qty = parseInt(this.quantityInputs.get(id)?.value || '1', 10);
          
          if (qty <= 0 || isNaN(qty)) return;

          const t0 = performance.now();
          let result;
          if (action === 'buy') {
            result = tradeManager.buyCommodity(currentPlanetId, id, qty);
          } else {
            result = tradeManager.sellCommodity(currentPlanetId, id, qty);
          }
          const t1 = performance.now();
          console.log(`[性能] 交易计算耗时: ${(t1 - t0).toFixed(2)}ms`);

          this.showToast(result.message, result.success ? 'success' : 'error');
        });
      });
    });
  }

  private renderMissionPanel(): void {
    const container = document.getElementById('missions-container');
    if (!container) return;
    
    container.innerHTML = '';

    const missions = gameState.getMissions();
    const activeMissions = missions.filter(m => !m.completed);
    const completedMissions = missions.filter(m => m.completed);

    if (activeMissions.length === 0 && completedMissions.length === 0) {
      container.innerHTML = '<div style="color:#94a3b8; padding:20px; text-align:center;">暂无任务，降落到星球查看可接任务</div>';
      return;
    }

    const renderMission = (mission: TransportMission) => {
      const card = document.createElement('div');
      card.className = 'mission-card' + (mission.completed ? ' completed' : '');
      
      const accepted = mission.accepted;
      const timeLeft = mission.accepted && !mission.completed
        ? Math.max(0, Math.floor(mission.timeLimit - (gameState.getState().gameTime - mission.startTime)))
        : null;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">📦</span>
            <div style="color:#e2e8f0; font-weight:600;">
              ${mission.quantity} 单位 ${mission.commodityName}
            </div>
          </div>
          <div style="color:#fbbf24; font-weight:700;">
            <span class="coin-icon"></span>${mission.reward}
          </div>
        </div>
        <div style="color:#94a3b8; font-size:13px; margin-bottom:8px;">
          <div>🚀 从: ${mission.originPlanetName}</div>
          <div>🎯 到: ${mission.targetPlanetName}</div>
          ${timeLeft !== null ? `<div style="color:${timeLeft < 30 ? '#ef4444' : '#f59e0b'};">⏱️ 剩余: ${timeLeft}秒</div>` : ''}
        </div>
        ${mission.completed ? `
          <div style="color:#10b981; display:flex; align-items:center; gap:8px;">
            <svg class="checkmark-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            任务已完成
          </div>
        ` : accepted ? `
          <div style="color:#6366f1; font-weight:500;">✅ 已接受</div>
        ` : `
          <button class="trade-btn" data-mission="${mission.id}">接受任务</button>
        `}
      `;

      const acceptBtn = card.querySelector(`[data-mission="${mission.id}"]`);
      if (acceptBtn) {
        acceptBtn.addEventListener('click', (e) => {
          this.addRippleEffect(acceptBtn as HTMLElement, e as MouseEvent);
          const result = tradeManager.acceptMission(mission.id);
          this.showToast(result.message, result.success ? 'success' : 'error');
          if (result.success) {
            const event = new CustomEvent('mission-accepted');
            window.dispatchEvent(event);
          }
        });
      }

      container.appendChild(card);
    };

    activeMissions.forEach(renderMission);
    if (completedMissions.length > 0) {
      const separator = document.createElement('div');
      separator.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1); margin:16px 0;';
      container.appendChild(separator);
      const label = document.createElement('div');
      label.style.cssText = 'color:#64748b; font-size:13px; margin-bottom:12px;';
      label.textContent = '已完成任务';
      container.appendChild(label);
      completedMissions.slice(-3).forEach(renderMission);
    }
  }

  private renderUpgradePanel(): void {
    const container = document.getElementById('upgrades-container');
    const hint = document.getElementById('upgrade-hint');
    if (!container) return;

    const currentPlanetId = gameState.getShip().currentPlanetId;
    const currentPlanet = currentPlanetId ? gameState.getPlanet(currentPlanetId) : null;
    const isAtStation = currentPlanet?.isStation === true && !gameState.getShip().isFlying;

    if (hint) {
      hint.style.display = isAtStation ? 'none' : 'block';
    }

    container.innerHTML = '';

    const upgrades = gameState.getUpgrades();
    
    upgrades.forEach(upgrade => {
      const card = document.createElement('div');
      card.className = 'commodity-card';
      
      const canPurchase = isAtStation && !upgrade.purchased && gameState.getCredits() >= upgrade.cost;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:28px;">${upgrade.icon}</span>
            <div>
              <div style="color:#e2e8f0; font-weight:600;">${upgrade.name}</div>
              <div style="color:#94a3b8; font-size:12px;">${upgrade.description}</div>
            </div>
          </div>
          <div style="color:${upgrade.purchased ? '#10b981' : '#fbbf24'}; font-weight:700;">
            ${upgrade.purchased ? '✅ 已购买' : `<span class="coin-icon"></span>${upgrade.cost}`}
          </div>
        </div>
        ${upgrade.purchased ? '' : `
          <button class="trade-btn" data-upgrade="${upgrade.id}" ${canPurchase ? '' : 'disabled'} style="width:100%;">
            购买升级
          </button>
        `}
      `;

      container.appendChild(card);

      const purchaseBtn = card.querySelector(`[data-upgrade="${upgrade.id}"]`);
      if (purchaseBtn) {
        purchaseBtn.addEventListener('click', (e) => {
          this.addRippleEffect(purchaseBtn as HTMLElement, e as MouseEvent);
          const result = tradeManager.purchaseUpgrade(upgrade.id);
          this.showToast(result.message, result.success ? 'success' : 'error');
        });
      }
    });
  }

  private renderCargoPanel(): void {
    const container = document.getElementById('cargo-container');
    if (!container) return;

    container.innerHTML = '';

    const cargo = gameState.getShip().cargo;
    const totalWeight = gameState.getCurrentCargoWeight();
    const maxWeight = gameState.getShip().cargoCapacity;

    const stats = document.createElement('div');
    stats.className = 'commodity-card';
    stats.innerHTML = `
      <div style="display:flex; justify-content:space-between; color:#e2e8f0; margin-bottom:8px;">
        <span>📦 货仓容量</span>
        <span style="color:#fbbf24; font-weight:600;">${totalWeight} / ${maxWeight}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(totalWeight / maxWeight) * 100}%;"></div>
      </div>
    `;
    container.appendChild(stats);

    if (cargo.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#94a3b8; padding:20px; text-align:center;';
      empty.textContent = '货仓空空如也';
      container.appendChild(empty);
      return;
    }

    let totalValue = 0;

    cargo.forEach(item => {
      const commodity = COMMODITY_LOOKUP.get(item.commodityId);
      const currentPlanetId = gameState.getShip().currentPlanetId;
      const currentPrice = currentPlanetId 
        ? tradeManager.getCommodityPrice(currentPlanetId, item.commodityId) 
        : null;
      
      const itemValue = item.quantity * (currentPrice || item.purchasePrice);
      totalValue += itemValue;
      const profit = currentPrice 
        ? Math.round((currentPrice - item.purchasePrice) * item.quantity)
        : null;

      const card = document.createElement('div');
      card.className = 'commodity-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">${commodity?.icon || '📦'}</span>
            <div>
              <div style="color:#e2e8f0; font-weight:600;">${commodity?.name || item.commodityId}</div>
              <div style="color:#64748b; font-size:12px;">
                成本: ${Math.round(item.purchasePrice)} × ${item.quantity}
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="color:#fbbf24; font-weight:600;">${itemValue}</div>
            ${profit !== null ? `
              <div style="font-size:12px; color:${profit >= 0 ? '#10b981' : '#ef4444'};">
                ${profit >= 0 ? '+' : ''}${profit}
              </div>
            ` : ''}
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    const totalCard = document.createElement('div');
    totalCard.style.cssText = 'margin-top:16px; padding:12px; background:rgba(51,65,85,0.5); border-radius:8px; text-align:right;';
    totalCard.innerHTML = `<div style="color:#94a3b8; font-size:13px;">总估值</div>
      <div style="color:#fbbf24; font-size:20px; font-weight:700;">
        <span class="coin-icon"></span>${Math.round(totalValue)}
      </div>`;
    container.appendChild(totalCard);
  }

  private renderMissionBar(): void {
    const bar = document.getElementById('mission-bar');
    if (!bar) return;

    const activeMissions = tradeManager.getActiveMissions();
    
    if (activeMissions.length === 0) {
      bar.innerHTML = '<div style="color:#94a3b8; font-size:14px; padding:8px 16px;">暂无运输任务</div>';
      return;
    }

    bar.innerHTML = '';
    activeMissions.forEach(mission => {
      const card = document.createElement('div');
      const targetPlanet = gameState.getPlanet(mission.targetPlanetId);
      const timeLeft = Math.max(0, Math.floor(mission.timeLimit - (gameState.getState().gameTime - mission.startTime)));
      const urgent = timeLeft < 30;

      card.className = 'mission-card';
      this.applyStyles(card, {
        minWidth: '200px',
        padding: '8px 12px',
        marginBottom: '0',
        fontSize: '12px',
        borderColor: urgent ? '#ef4444' : '#fbbf24'
      });
      
      card.innerHTML = `
        <div style="color:#fbbf24; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          📦 ${mission.quantity} × ${mission.commodityName}
        </div>
        <div style="color:#94a3b8; font-size:11px; margin-top:4px;">
          → ${targetPlanet?.name || '未知'}
        </div>
        <div style="color:${urgent ? '#ef4444' : '#f59e0b'}; font-size:11px; margin-top:4px;">
          ⏱️ ${timeLeft}s | 💰 ${mission.reward}
        </div>
      `;
      bar.appendChild(card);
    });
  }

  public update(): void {
    this.updateFuelDisplay();
    this.updateStatusDisplay();
    const ship = gameState.getShip();
    if (ship.isFlying) {
      this.renderMissionBar();
    }
  }

  public dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

const COMMODITY_LOOKUP = new Map<string, { id: string; name: string; icon: string }>([
  ['ore', { id: 'ore', name: '矿石', icon: '⛏️' }],
  ['fuel', { id: 'fuel', name: '燃料', icon: '⛽' }],
  ['food', { id: 'food', name: '食物', icon: '🍎' }],
  ['tech', { id: 'tech', name: '科技组件', icon: '🔧' }],
  ['medicine', { id: 'medicine', name: '医疗品', icon: '💊' }]
]);

export { UILayer };
