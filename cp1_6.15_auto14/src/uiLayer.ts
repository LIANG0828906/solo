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
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(4); opacity: 0; }
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
        animation: ripple 0.6s linear;
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
      }
      
      @media (max-width: 768px) {
        .hamburger {
          display: flex;
        }
        
        .bottom-panel {
          transform: translateY(calc(100% - 60px));
          transition: transform 0.3s ease;
        }
        
        .bottom-panel.expanded {
          transform: translateY(0);
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
      marginBottom: '16px'
    });

    const tabsConfig: { id: PanelType; label: string; icon: string }[] = [
      { id: 'trade', label: '交易', icon: '💱' },
      { id: 'missions', label: '任务', icon: '📋' },
      { id: 'upgrades', label: '升级', icon: '⬆️' },
      { id: 'cargo', label: '货仓', icon: '📦' }
    ];

    tabsConfig.forEach((tab, index) => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
      btn.dataset.panel = tab.id;
      btn.innerHTML = `<span>${tab.icon}</span> ${tab.label}`;
      btn.addEventListener('click', () => this.switchPanel(tab.id));
      tabs.appendChild(btn);
    });

    panel.appendChild(title);
    panel.appendChild(tabs);

    return panel;
  }

  private createRightPanel(): HTMLElement {
    const panel = document.createElement('div');
    this.applyStyles(panel, {
      position: 'absolute',
      right: '20px',
      top: '180px',
      width: '350px',
      maxHeight: 'calc(100vh - 280px)',
      overflowY: 'auto',
      pointerEvents: 'auto'
    });

    return panel;
  }

  private createTradePanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'trade-panel';
    panel.className = 'glass-panel ui-enter-right';
    this.applyStyles(panel, {
      padding: '20px',
      opacity: '0',
      animationDelay: '0.4s'
    });

    const header = document.createElement('div');
    this.applyStyles(header, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    });
    header.innerHTML = `
      <h3 style="margin: 0; color: #e2e8f0; font-size: 16px;">商品列表</h3>
      <span id="trade-planet-name" style="color: #94a3b8; font-size: 14px;"></span>
    `;

    const commodityList = document.createElement('div');
    commodityList.id = 'commodity-list';

    panel.appendChild(header);
    panel.appendChild(commodityList);

    return panel;
  }

  private createMissionPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'mission-panel';
    panel.className = 'glass-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none'
    });

    const header = document.createElement('h3');
    this.applyStyles(header, {
      margin: '0 0 20px 0',
      color: '#e2e8f0',
      fontSize: '16px'
    });
    header.textContent = '运输任务';

    const missionList = document.createElement('div');
    missionList.id = 'mission-list';

    panel.appendChild(header);
    panel.appendChild(missionList);

    return panel;
  }

  private createUpgradePanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'upgrade-panel';
    panel.className = 'glass-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none'
    });

    const header = document.createElement('h3');
    this.applyStyles(header, {
      margin: '0 0 20px 0',
      color: '#e2e8f0',
      fontSize: '16px'
    });
    header.textContent = '飞船升级';

    const warning = document.createElement('div');
    warning.id = 'upgrade-warning';
    this.applyStyles(warning, {
      color: '#f59e0b',
      fontSize: '12px',
      marginBottom: '16px',
      padding: '8px',
      background: 'rgba(245, 158, 11, 0.1)',
      borderRadius: '8px',
      display: 'none'
    });
    warning.textContent = '⚠️ 请在空间站停靠以购买升级';

    const upgradeList = document.createElement('div');
    upgradeList.id = 'upgrade-list';

    panel.appendChild(header);
    panel.appendChild(warning);
    panel.appendChild(upgradeList);

    return panel;
  }

  private createCargoPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'cargo-panel';
    panel.className = 'glass-panel';
    this.applyStyles(panel, {
      padding: '20px',
      display: 'none'
    });

    const header = document.createElement('h3');
    this.applyStyles(header, {
      margin: '0 0 20px 0',
      color: '#e2e8f0',
      fontSize: '16px'
    });
    header.textContent = '货仓内容';

    const cargoList = document.createElement('div');
    cargoList.id = 'cargo-list';

    panel.appendChild(header);
    panel.appendChild(cargoList);

    return panel;
  }

  private createNewsContainer(): HTMLElement {
    const container = document.createElement('div');
    this.applyStyles(container, {
      position: 'absolute',
      top: '80px',
      right: '20px',
      width: '300px',
      pointerEvents: 'auto'
    });
    return container;
  }

  private createHamburgerMenu(): HTMLElement {
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    this.applyStyles(hamburger, {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      zIndex: '1001'
    });
    
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    
    hamburger.addEventListener('click', () => {
      this.bottomPanel.classList.toggle('expanded');
    });

    return hamburger;
  }

  private switchPanel(panel: PanelType): void {
    this.activePanel = panel;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.panel === panel);
    });

    this.tradePanel.style.display = panel === 'trade' ? 'block' : 'none';
    this.missionPanel.style.display = panel === 'missions' ? 'block' : 'none';
    this.upgradePanel.style.display = panel === 'upgrades' ? 'block' : 'none';
    this.cargoPanel.style.display = panel === 'cargo' ? 'block' : 'none';

    this.updateAllPanels();
  }

  private createRipple(button: HTMLElement, event: MouseEvent): void {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  private updateCredits(): void {
    const creditsEl = document.getElementById('credits-value');
    if (creditsEl) {
      const oldValue = parseInt(creditsEl.textContent || '0');
      const newValue = gameState.getCredits();
      
      if (newValue > oldValue) {
        creditsEl.style.color = '#10b981';
        setTimeout(() => creditsEl.style.color = '#fbbf24', 500);
      } else if (newValue < oldValue) {
        creditsEl.style.color = '#ef4444';
        setTimeout(() => creditsEl.style.color = '#fbbf24', 500);
      }
      
      this.animateNumber(creditsEl, oldValue, newValue, 500);
    }
  }

  private animateNumber(element: HTMLElement, start: number, end: number, duration: number): void {
    const startTime = Date.now();
    
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);
      element.textContent = current.toString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }

  private updateFuel(): void {
    const ship = gameState.getShip();
    const fuelEl = document.getElementById('fuel-value');
    const fuelFill = document.getElementById('fuel-fill');
    
    if (fuelEl) {
      fuelEl.textContent = `${Math.round(ship.fuel)}/${ship.maxFuel}`;
    }
    if (fuelFill) {
      fuelFill.style.width = `${(ship.fuel / ship.maxFuel) * 100}%`;
    }
  }

  private updateCargo(): void {
    const cargoUsed = gameState.getCurrentCargoWeight();
    const cargoMax = gameState.getShip().cargoCapacity;
    
    const cargoEl = document.getElementById('cargo-value');
    const cargoFill = document.getElementById('cargo-fill');
    
    if (cargoEl) {
      cargoEl.textContent = `${cargoUsed}/${cargoMax}`;
    }
    if (cargoFill) {
      cargoFill.style.width = `${(cargoUsed / cargoMax) * 100}%`;
    }
  }

  private updateStatus(): void {
    const statusEl = document.getElementById('status-display');
    if (!statusEl) return;
    
    const ship = gameState.getShip();
    
    if (ship.isFlying) {
      statusEl.textContent = '飞行中...';
      statusEl.style.color = '#3b82f6';
    } else if (ship.currentPlanetId) {
      const planet = gameState.getPlanet(ship.currentPlanetId);
      statusEl.textContent = `停泊在 ${planet?.name || ''}`;
      statusEl.style.color = '#10b981';
    }
  }

  private updateCurrentPlanet(): void {
    const planetNameEl = document.getElementById('current-planet-name');
    const tradePlanetNameEl = document.getElementById('trade-planet-name');
    
    const currentPlanetId = gameState.getShip().currentPlanetId;
    const selectedPlanetId = gameState.getSelectedPlanetId();
    const displayPlanetId = selectedPlanetId || currentPlanetId;
    
    if (displayPlanetId) {
      const planet = gameState.getPlanet(displayPlanetId);
      if (planetNameEl) planetNameEl.textContent = planet?.name || '未知';
      if (tradePlanetNameEl) tradePlanetNameEl.textContent = planet?.name || '';
    } else if (planetNameEl) {
      planetNameEl.textContent = '飞行中';
    }
  }

  private updateTradePanel(): void {
    const list = document.getElementById('commodity-list');
    if (!list) return;

    list.innerHTML = '';
    this.quantityInputs.clear();

    const currentPlanetId = gameState.getShip().currentPlanetId;
    const selectedPlanetId = gameState.getSelectedPlanetId();
    const displayPlanetId = selectedPlanetId || currentPlanetId;

    if (!displayPlanetId) {
      list.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">飞行中无法交易</div>';
      return;
    }

    const planet = gameState.getPlanet(displayPlanetId);
    if (!planet) return;

    const isAtPlanet = currentPlanetId === displayPlanetId && !gameState.getShip().isFlying;

    const commodities = tradeManager.getPlanetCommodities(displayPlanetId);
    
    if (commodities.length === 0) {
      list.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">该星球暂无商品</div>';
      return;
    }

    commodities.forEach(commodity => {
      const card = this.createCommodityCard(commodity, isAtPlanet);
      list.appendChild(card);
    });
  }

  private createCommodityCard(commodity: Commodity, canTrade: boolean): HTMLElement {
    const card = document.createElement('div');
    card.className = 'commodity-card';

    const trend = tradeManager.getPriceTrend(
      gameState.getShip().currentPlanetId || '',
      commodity.id
    );
    const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
    const trendClass = `price-${trend}`;

    const cargoQuantity = gameState.getCargoQuantity(commodity.id);

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 24px;">${commodity.icon}</span>
          <div>
            <div style="color: #e2e8f0; font-weight: 600;">${commodity.name}</div>
            <div style="color: #94a3b8; font-size: 12px;">库存: ${commodity.supply}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #fbbf24; font-weight: 600; font-size: 18px;">
            <span class="coin-icon"></span>${commodity.currentPrice.toFixed(0)}
          </div>
          <div class="${trendClass}" style="font-size: 12px;">${trendIcon}</div>
        </div>
      </div>
      ${cargoQuantity > 0 ? `<div style="color: #64748b; font-size: 12px; margin-bottom: 12px;">持有: ${cargoQuantity} 单位</div>` : ''}
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="number" 
               id="qty-${commodity.id}" 
               min="1" 
               max="${Math.min(commodity.supply, 999)}" 
               value="1"
               style="flex: 1; padding: 8px 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; width: 80px;">
        <button class="trade-btn" data-action="buy" data-commodity="${commodity.id}" ${!canTrade ? 'disabled' : ''}>
          买入
        </button>
        <button class="trade-btn" data-action="sell" data-commodity="${commodity.id}" ${!canTrade || cargoQuantity === 0 ? 'disabled' : ''}>
          卖出
        </button>
      </div>
    `;

    const qtyInput = card.querySelector(`#qty-${commodity.id}`) as HTMLInputElement;
    if (qtyInput) {
      this.quantityInputs.set(commodity.id, qtyInput);
    }

    card.querySelectorAll('.trade-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.createRipple(btn as HTMLElement, e as MouseEvent);
        const action = (btn as HTMLElement).dataset.action;
        const commodityId = (btn as HTMLElement).dataset.commodity;
        const quantity = parseInt(qtyInput?.value || '1');
        
        if (action && commodityId && this.displayPlanetId) {
          this.handleTrade(action as 'buy' | 'sell', commodityId, quantity);
        }
      });
    });

    return card;
  }

  private get displayPlanetId(): string | undefined {
    const currentPlanetId = gameState.getShip().currentPlanetId;
    const selectedPlanetId = gameState.getSelectedPlanetId();
    return selectedPlanetId || currentPlanetId || undefined;
  }

  private handleTrade(action: 'buy' | 'sell', commodityId: string, quantity: number): void {
    const planetId = gameState.getShip().currentPlanetId;
    if (!planetId) return;

    const startTime = performance.now();

    if (action === 'buy') {
      const result = tradeManager.buyCommodity(planetId, commodityId, quantity);
      this.showToast(result.message, result.success ? 'success' : 'error');
    } else {
      const result = tradeManager.sellCommodity(planetId, commodityId, quantity);
      this.showToast(result.message, result.success ? 'success' : 'error');
    }

    const endTime = performance.now();
    console.log(`交易处理时间: ${(endTime - startTime).toFixed(2)}ms`);
  }

  private updateMissionPanel(): void {
    const list = document.getElementById('mission-list');
    if (!list) return;

    list.innerHTML = '';

    const currentPlanetId = gameState.getShip().currentPlanetId;
    const availableMissions = gameState.getMissions().filter(m => !m.accepted && m.originPlanetId === currentPlanetId);
    const activeMissions = gameState.getMissions().filter(m => m.accepted && !m.completed);
    const completedMissions = gameState.getMissions().filter(m => m.completed);

    if (availableMissions.length === 0 && activeMissions.length === 0 && completedMissions.length === 0) {
      list.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">暂无任务</div>';
      return;
    }

    if (availableMissions.length > 0) {
      const section = document.createElement('div');
      section.innerHTML = '<div style="color: #fbbf24; font-weight: 600; margin-bottom: 12px;">📋 可接任务</div>';
      availableMissions.forEach(mission => {
        section.appendChild(this.createMissionCard(mission, false));
      });
      list.appendChild(section);
    }

    if (activeMissions.length > 0) {
      const section = document.createElement('div');
      section.innerHTML = '<div style="color: #3b82f6; font-weight: 600; margin: 20px 0 12px 0;">🚀 进行中</div>';
      activeMissions.forEach(mission => {
        section.appendChild(this.createMissionCard(mission, false));
      });
      list.appendChild(section);
    }

    if (completedMissions.length > 0) {
      const section = document.createElement('div');
      section.innerHTML = '<div style="color: #10b981; font-weight: 600; margin: 20px 0 12px 0;">✅ 已完成</div>';
      completedMissions.forEach(mission => {
        section.appendChild(this.createMissionCard(mission, true));
      });
      list.appendChild(section);
    }
  }

  private createMissionCard(mission: TransportMission, completed: boolean): HTMLElement {
    const card = document.createElement('div');
    card.className = `mission-card ${completed ? 'completed' : ''}`;

    const canAccept = !mission.accepted && 
      gameState.getShip().currentPlanetId === mission.originPlanetId &&
      !gameState.getShip().isFlying;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div>
          <div style="color: #e2e8f0; font-weight: 600; margin-bottom: 4px;">
            ${completed ? '<svg class="checkmark-svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> ' : ''}
            运输 ${mission.quantity} 单位 ${mission.commodityName}
          </div>
          <div style="color: #94a3b8; font-size: 13px;">
            从 <span style="color: #60a5fa;">${mission.originPlanetName}</span> → 到 <span style="color: #f472b6;">${mission.targetPlanetName}</span>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #fbbf24; font-weight: 600; font-size: 16px;">
            <span class="coin-icon"></span>${mission.reward}
          </div>
        </div>
      </div>
      ${!mission.accepted && !completed ? `
        <button class="trade-btn" data-mission="${mission.id}" ${!canAccept ? 'disabled' : ''} style="width: 100%;">
          ${canAccept ? '接受任务' : '请先前往出发星球'}
        </button>
      ` : ''}
      ${mission.accepted && !completed ? `
        <div style="color: #64748b; font-size: 12px;">任务进行中...</div>
      ` : ''}
    `;

    const acceptBtn = card.querySelector(`[data-mission="${mission.id}"]`);
    if (acceptBtn) {
      acceptBtn.addEventListener('click', (e) => {
        this.createRipple(acceptBtn as HTMLElement, e as MouseEvent);
        const result = tradeManager.acceptMission(mission.id);
        this.showToast(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
          const event = new CustomEvent('mission-accepted', {
            detail: { mission }
          });
          window.dispatchEvent(event);
        }
      });
    }

    return card;
  }

  private updateUpgradePanel(): void {
    const list = document.getElementById('upgrade-list');
    const warning = document.getElementById('upgrade-warning');
    if (!list) return;

    list.innerHTML = '';

    const planetId = gameState.getShip().currentPlanetId;
    const currentPlanet = planetId 
      ? gameState.getPlanet(planetId)
      : null;
    const isAtStation = !!(currentPlanet?.isStation && !gameState.getShip().isFlying);

    if (warning) {
      warning.style.display = isAtStation ? 'none' : 'block';
    }

    const availableUpgrades = tradeManager.getAvailableUpgrades();
    const purchasedUpgrades = tradeManager.getPurchasedUpgrades();

    if (availableUpgrades.length === 0 && purchasedUpgrades.length === 0) {
      list.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">暂无升级选项</div>';
      return;
    }

    if (availableUpgrades.length > 0) {
      const section = document.createElement('div');
      section.innerHTML = '<div style="color: #fbbf24; font-weight: 600; margin-bottom: 12px;">⬆️ 可购买升级</div>';
      availableUpgrades.forEach(upgrade => {
        section.appendChild(this.createUpgradeCard(upgrade, isAtStation));
      });
      list.appendChild(section);
    }

    if (purchasedUpgrades.length > 0) {
      const section = document.createElement('div');
      section.innerHTML = '<div style="color: #10b981; font-weight: 600; margin: 20px 0 12px 0;">✅ 已购买</div>';
      purchasedUpgrades.forEach(upgrade => {
        section.appendChild(this.createUpgradeCard(upgrade, false, true));
      });
      list.appendChild(section);
    }
  }

  private createUpgradeCard(upgrade: ShipUpgrade, canPurchase: boolean, purchased = false): HTMLElement {
    const card = document.createElement('div');
    card.className = 'commodity-card';
    if (purchased) card.style.opacity = '0.6';

    const typeColors: Record<string, string> = {
      cargo: '#10b981',
      engine: '#f59e0b',
      shield: '#3b82f6'
    };

    const typeNames: Record<string, string> = {
      cargo: '货仓',
      engine: '引擎',
      shield: '护盾'
    };

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 32px;">${upgrade.icon}</span>
          <div>
            <div style="color: #e2e8f0; font-weight: 600;">${upgrade.name}</div>
            <div style="color: #94a3b8; font-size: 13px;">${upgrade.description}</div>
            <div style="color: ${typeColors[upgrade.type]}; font-size: 12px; margin-top: 4px;">
              ${typeNames[upgrade.type]} +${Math.round((upgrade.multiplier - 1) * 100)}%
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          ${!purchased ? `
            <div style="color: #fbbf24; font-weight: 600; font-size: 18px;">
              <span class="coin-icon"></span>${upgrade.cost}
            </div>
          ` : `
            <div style="color: #10b981; font-weight: 600;">已拥有</div>
          `}
        </div>
      </div>
      ${!purchased ? `
        <button class="trade-btn" data-upgrade="${upgrade.id}" ${!canPurchase || gameState.getCredits() < upgrade.cost ? 'disabled' : ''} style="width: 100%;">
          ${!canPurchase ? '请在空间站停靠' : gameState.getCredits() < upgrade.cost ? '资金不足' : '购买升级'}
        </button>
      ` : ''}
    `;

    const purchaseBtn = card.querySelector(`[data-upgrade="${upgrade.id}"]`);
    if (purchaseBtn) {
      purchaseBtn.addEventListener('click', (e) => {
        this.createRipple(purchaseBtn as HTMLElement, e as MouseEvent);
        const result = tradeManager.purchaseUpgrade(upgrade.id);
        this.showToast(result.message, result.success ? 'success' : 'error');
      });
    }

    return card;
  }

  private updateCargoPanel(): void {
    const list = document.getElementById('cargo-list');
    if (!list) return;

    list.innerHTML = '';

    const cargo = gameState.getShip().cargo;
    const cargoUsed = gameState.getCurrentCargoWeight();
    const cargoMax = gameState.getShip().cargoCapacity;

    if (cargo.length === 0) {
      list.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">货仓为空</div>';
      return;
    }

    const summary = document.createElement('div');
    summary.style.cssText = `
      background: rgba(30, 41, 59, 0.8);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
    `;
    summary.innerHTML = `
      <span style="color: #94a3b8;">货仓使用率</span>
      <span style="color: ${cargoUsed / cargoMax > 0.8 ? '#ef4444' : '#10b981'}; font-weight: 600;">
        ${Math.round((cargoUsed / cargoMax) * 100)}%
      </span>
    `;
    list.appendChild(summary);

    cargo.forEach(item => {
      const card = document.createElement('div');
      card.className = 'commodity-card';
      
      const commodityInfo = this.getCommodityInfo(item.commodityId);
      const shipPlanetId = gameState.getShip().currentPlanetId;
      const currentPrice = shipPlanetId
        ? tradeManager.getCommodityPrice(shipPlanetId, item.commodityId)
        : null;
      const profit = currentPrice ? (currentPrice - item.purchasePrice) * item.quantity : 0;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px;">${commodityInfo?.icon || '📦'}</span>
            <div>
              <div style="color: #e2e8f0; font-weight: 600;">${commodityInfo?.name || item.commodityId}</div>
              <div style="color: #94a3b8; font-size: 13px;">
                ${item.quantity} 单位 · 成本: ${item.purchasePrice.toFixed(0)}/单位
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            ${currentPrice ? `
              <div style="color: ${profit >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">
                ${profit >= 0 ? '+' : ''}${profit.toFixed(0)}
              </div>
              <div style="color: #64748b; font-size: 12px;">当前价: ${currentPrice.toFixed(0)}</div>
            ` : `
              <div style="color: #64748b; font-size: 12px;">飞行中</div>
            `}
          </div>
        </div>
      `;

      list.appendChild(card);
    });
  }

  private getCommodityInfo(commodityId: string): { name: string; icon: string } | null {
    const commodities = [
      { id: 'ore', name: '矿石', icon: '⛏️' },
      { id: 'fuel', name: '燃料', icon: '⛽' },
      { id: 'food', name: '食物', icon: '🍎' },
      { id: 'tech', name: '科技组件', icon: '🔧' },
      { id: 'medicine', name: '医疗品', icon: '💊' }
    ];
    return commodities.find(c => c.id === commodityId) || null;
  }

  private updateAllPanels(): void {
    this.updateCredits();
    this.updateFuel();
    this.updateCargo();
    this.updateStatus();
    this.updateCurrentPlanet();

    if (this.activePanel === 'trade') this.updateTradePanel();
    if (this.activePanel === 'missions') this.updateMissionPanel();
    if (this.activePanel === 'upgrades') this.updateUpgradePanel();
    if (this.activePanel === 'cargo') this.updateCargoPanel();
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    
    const colors = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };

    this.applyStyles(toast, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.5)',
      background: colors[type],
      color: 'white',
      padding: '16px 32px',
      borderRadius: '12px',
      fontWeight: '600',
      fontSize: '16px',
      zIndex: '2000',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
    });

    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  private showNewsAlert(event: NewsEvent): void {
    const alert = document.createElement('div');
    alert.className = 'news-alert';
    
    alert.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">📰 ${event.title}</div>
      <div style="font-size: 13px; opacity: 0.9;">${event.description}</div>
    `;

    this.newsContainer.appendChild(alert);

    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateX(100%)';
      alert.style.transition = 'all 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  }

  private updateMissionBar(): void {
    const bar = document.getElementById('mission-bar');
    if (!bar) return;

    const activeMissions = gameState.getMissions().filter(m => m.accepted && !m.completed);

    if (activeMissions.length === 0) {
      bar.innerHTML = '<div style="color: #94a3b8; font-size: 14px; padding: 8px 16px;">暂无运输任务</div>';
      return;
    }

    bar.innerHTML = '';
    activeMissions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'mission-card';
      this.applyStyles(card, {
        minWidth: '250px',
        padding: '12px 16px',
        marginBottom: '0',
        animation: 'pulse 2s infinite'
      });

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🚀</span>
          <div>
            <div style="color: #e2e8f0; font-weight: 600; font-size: 14px;">
              ${mission.originPlanetName} → ${mission.targetPlanetName}
            </div>
            <div style="color: #fbbf24; font-size: 12px;">
              ${mission.quantity} ${mission.commodityName} · <span class="coin-icon"></span>${mission.reward}
            </div>
          </div>
        </div>
      `;

      bar.appendChild(card);
    });
  }

  private setupEventListeners(): void {
    gameState.subscribe(() => {
      this.updateAllPanels();
      this.updateMissionBar();
    });

    window.addEventListener('news-alert', (e) => {
      const customEvent = e as CustomEvent;
      this.showNewsAlert(customEvent.detail.event);
    });

    window.addEventListener('planet-arrived', () => {
      this.updateAllPanels();
      this.showToast('已抵达目标星球！', 'success');
    });
  }

  public update(): void {
  }

  public dispose(): void {
    document.body.removeChild(this.container);
  }
}

export { UILayer };
