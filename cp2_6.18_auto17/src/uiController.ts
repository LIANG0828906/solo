import { eventBus } from './eventBus'
import { GameEngine } from './gameEngine'
import { TowerSystem } from './towerSystem'
import {
  TowerType,
  Tower,
  TOWER_CONFIGS,
  TOTAL_WAVES,
  INITIAL_GOLD,
  INITIAL_LIVES
} from './types'

export class UIController {
  private gameEngine: GameEngine
  private towerSystem: TowerSystem
  private container: HTMLElement

  private topBar!: HTMLElement
  private towerToolbar!: HTMLElement
  private wavePanel!: HTMLElement
  private upgradeModal!: HTMLElement
  private countdownOverlay!: HTMLElement
  private gameOverModal!: HTMLElement
  private victoryModal!: HTMLElement
  private mobileMenuBtn!: HTMLElement
  private mobileMenu!: HTMLElement
  private mobileMenuOverlay!: HTMLElement

  private goldDisplay!: HTMLElement
  private livesDisplay!: HTMLElement
  private waveDisplay!: HTMLElement
  private countdownDisplay!: HTMLElement
  private remainingDisplay!: HTMLElement
  private normalCountDisplay!: HTMLElement
  private eliteCountDisplay!: HTMLElement

  private selectedTowerType: TowerType | null = null
  private isMobile: boolean = false

  constructor(container: HTMLElement, gameEngine: GameEngine, towerSystem: TowerSystem) {
    this.container = container
    this.gameEngine = gameEngine
    this.towerSystem = towerSystem

    this.createUI()
    this.checkMobile()
    this.registerEvents()
    window.addEventListener('resize', this.checkMobile.bind(this))
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 1024
    this.updateLayout()
  }

  private updateLayout(): void {
    if (!this.towerToolbar || !this.wavePanel || !this.mobileMenuBtn) return

    if (this.isMobile) {
      this.towerToolbar.classList.add('mobile-hidden')
      this.wavePanel.classList.add('mobile-hidden')
      this.mobileMenuBtn.classList.remove('mobile-hidden')
    } else {
      this.towerToolbar.classList.remove('mobile-hidden')
      this.wavePanel.classList.remove('mobile-hidden')
      this.mobileMenuBtn.classList.add('mobile-hidden')
      if (this.mobileMenu && this.mobileMenuOverlay) {
        this.closeMobileMenu()
      }
    }
  }

  private createUI(): void {
    this.createStyles()
    this.createTopBar()
    this.createTowerToolbar()
    this.createWavePanel()
    this.createUpgradeModal()
    this.createCountdownOverlay()
    this.createGameOverModal()
    this.createVictoryModal()
    this.createMobileMenu()
  }

  private createStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      * {
        box-sizing: border-box;
      }

      .game-ui {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        font-family: monospace;
        color: #ffffff;
      }

      .game-ui > * {
        pointer-events: auto;
      }

      .top-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: #12121E;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        border-bottom: 1px solid #2A2A3A;
        z-index: 100;
      }

      .top-bar-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
      }

      .top-bar-label {
        color: #888;
        font-size: 14px;
      }

      .top-bar-value {
        font-weight: bold;
        font-size: 20px;
      }

      .gold-value {
        color: #FFD700;
      }

      .lives-value {
        color: #FF4444;
      }

      .wave-value {
        color: #00FF88;
      }

      .tower-toolbar {
        position: absolute;
        top: 80px;
        left: 16px;
        width: 200px;
        background: #1A1A2E;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #2A2A3A;
        z-index: 100;
      }

      .toolbar-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 12px;
        color: #00FF88;
      }

      .tower-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin-bottom: 8px;
        background: #12121E;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.1s ease;
      }

      .tower-item:hover {
        background: #2A2A3A;
        transform: translateX(4px);
      }

      .tower-item:active {
        transform: scale(0.95);
      }

      .tower-item.selected {
        border-color: #00FF88;
        background: rgba(0, 255, 136, 0.1);
      }

      .tower-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .tower-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .tower-icon.machinegun {
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
      }

      .tower-icon.flame {
        background: linear-gradient(135deg, #FF5722, #D84315);
      }

      .tower-icon.slow {
        background: linear-gradient(135deg, #2196F3, #1565C0);
      }

      .tower-info {
        flex: 1;
      }

      .tower-name {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 2px;
      }

      .tower-cost {
        font-size: 12px;
        color: #FFD700;
      }

      .tower-stats {
        font-size: 10px;
        color: #888;
        margin-top: 4px;
      }

      .wave-panel {
        position: absolute;
        top: 80px;
        right: 16px;
        width: 250px;
        background: #1A1A2E;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #2A2A3A;
        z-index: 100;
      }

      .panel-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 12px;
        color: #00FF88;
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #2A2A3A;
      }

      .stat-row:last-child {
        border-bottom: none;
      }

      .stat-label {
        color: #888;
        font-size: 14px;
      }

      .stat-value {
        font-weight: bold;
        font-size: 16px;
      }

      .zombie-type {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .zombie-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .zombie-dot.normal {
        background: #7CB342;
      }

      .zombie-dot.elite {
        background: #B71C1C;
        box-shadow: 0 0 8px #B71C1C;
      }

      .start-wave-btn {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        background: linear-gradient(135deg, #00FF88, #00CC6A);
        border: none;
        border-radius: 8px;
        color: #0D0D1A;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        font-family: monospace;
        transition: all 0.1s ease;
      }

      .start-wave-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
      }

      .start-wave-btn:active {
        transform: scale(0.95);
      }

      .countdown-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 120px;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
        z-index: 200;
        pointer-events: none;
        animation: pulse 1s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
        }
      }

      .countdown-overlay.hidden {
        display: none;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 300;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal-overlay.hidden {
        display: none;
      }

      .modal {
        background: #1A1A2E;
        border-radius: 16px;
        width: 400px;
        padding: 24px;
        border: 1px solid #2A2A3A;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 16px;
        color: #00FF88;
        text-align: center;
      }

      .tower-info-section {
        background: #12121E;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 14px;
      }

      .info-label {
        color: #888;
      }

      .info-value {
        font-weight: bold;
      }

      .info-value.up {
        color: #00FF88;
      }

      .upgrade-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #00FF88, #00CC6A);
        border: none;
        border-radius: 8px;
        color: #0D0D1A;
        font-weight: bold;
        font-size: 16px;
        cursor: pointer;
        font-family: monospace;
        transition: all 0.1s ease;
        margin-bottom: 8px;
      }

      .upgrade-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
      }

      .upgrade-btn:active:not(:disabled) {
        transform: scale(0.95);
      }

      .upgrade-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .close-btn {
        width: 100%;
        padding: 12px;
        background: #2A2A3A;
        border: none;
        border-radius: 8px;
        color: #ffffff;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        font-family: monospace;
        transition: all 0.1s ease;
      }

      .close-btn:hover {
        background: #3A3A4A;
      }

      .close-btn:active {
        transform: scale(0.95);
      }

      .max-level {
        text-align: center;
        color: #FFD700;
        font-size: 14px;
        padding: 8px;
        margin-bottom: 8px;
      }

      .game-over-content, .victory-content {
        text-align: center;
      }

      .game-over-title {
        font-size: 48px;
        font-weight: bold;
        color: #FF4444;
        margin-bottom: 16px;
      }

      .victory-title {
        font-size: 48px;
        font-weight: bold;
        color: #00FF88;
        margin-bottom: 16px;
      }

      .final-stats {
        background: #12121E;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .restart-btn {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, #00FF88, #00CC6A);
        border: none;
        border-radius: 8px;
        color: #0D0D1A;
        font-weight: bold;
        font-size: 16px;
        cursor: pointer;
        font-family: monospace;
        transition: all 0.1s ease;
      }

      .restart-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
      }

      .restart-btn:active {
        transform: scale(0.95);
      }

      .mobile-menu-btn {
        position: absolute;
        top: 70px;
        left: 16px;
        width: 50px;
        height: 50px;
        background: #1A1A2E;
        border: 1px solid #2A2A3A;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 100;
        font-size: 24px;
        transition: all 0.1s ease;
      }

      .mobile-menu-btn:active {
        transform: scale(0.95);
      }

      .mobile-menu-btn.mobile-hidden {
        display: none;
      }

      .mobile-menu {
        position: absolute;
        top: 0;
        left: 0;
        width: 60%;
        height: 100%;
        background: #1A1A2E;
        border-right: 1px solid #2A2A3A;
        z-index: 500;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        overflow-y: auto;
        padding: 16px;
      }

      .mobile-menu.open {
        transform: translateX(0);
      }

      .mobile-menu-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #2A2A3A;
      }

      .mobile-menu-title {
        font-size: 20px;
        font-weight: bold;
        color: #00FF88;
      }

      .mobile-close-btn {
        background: none;
        border: none;
        color: #ffffff;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
      }

      .mobile-section {
        margin-bottom: 24px;
      }

      .mobile-section-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 12px;
        color: #00FF88;
      }

      .mobile-menu-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 400;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .mobile-menu-overlay.open {
        opacity: 1;
        visibility: visible;
      }

      .mobile-hidden {
        display: none !important;
      }

      @media (max-width: 1024px) {
        .tower-toolbar, .wave-panel {
          display: none;
        }
      }
    `
    document.head.appendChild(style)
  }

  private createTopBar(): void {
    this.topBar = document.createElement('div')
    this.topBar.className = 'top-bar'

    const waveItem = document.createElement('div')
    waveItem.className = 'top-bar-item'
    waveItem.innerHTML = `
      <span class="top-bar-label">波次</span>
      <span class="top-bar-value wave-value" id="wave-display">0 / ${TOTAL_WAVES}</span>
    `
    this.topBar.appendChild(waveItem)

    const goldItem = document.createElement('div')
    goldItem.className = 'top-bar-item'
    goldItem.innerHTML = `
      <span class="top-bar-label">金币</span>
      <span class="top-bar-value gold-value" id="gold-display">${INITIAL_GOLD}</span>
    `
    this.topBar.appendChild(goldItem)

    const livesItem = document.createElement('div')
    livesItem.className = 'top-bar-item'
    livesItem.innerHTML = `
      <span class="top-bar-label">生命</span>
      <span class="top-bar-value lives-value" id="lives-display">${INITIAL_LIVES}</span>
    `
    this.topBar.appendChild(livesItem)

    this.container.appendChild(this.topBar)

    this.waveDisplay = document.getElementById('wave-display')!
    this.goldDisplay = document.getElementById('gold-display')!
    this.livesDisplay = document.getElementById('lives-display')!
  }

  private createTowerToolbar(): void {
    this.towerToolbar = document.createElement('div')
    this.towerToolbar.className = 'tower-toolbar'

    const title = document.createElement('div')
    title.className = 'toolbar-title'
    title.textContent = '防御塔'
    this.towerToolbar.appendChild(title)

    const towerTypes: TowerType[] = ['machinegun', 'flame', 'slow']
    const towerIcons: Record<TowerType, string> = {
      machinegun: '🔫',
      flame: '🔥',
      slow: '❄️'
    }

    towerTypes.forEach(type => {
      const config = TOWER_CONFIGS[type]
      const item = document.createElement('div')
      item.className = 'tower-item'
      item.dataset.type = type
      item.innerHTML = `
        <div class="tower-icon ${type}">${towerIcons[type]}</div>
        <div class="tower-info">
          <div class="tower-name">${config.name}</div>
          <div class="tower-cost">💰 ${config.cost}</div>
          <div class="tower-stats">
            伤害:${config.damage} 射程:${config.range} 攻速:${config.attackSpeed}/s
          </div>
        </div>
      `
      item.addEventListener('click', () => this.selectTowerType(type))
      this.towerToolbar.appendChild(item)
    })

    this.container.appendChild(this.towerToolbar)
  }

  private createWavePanel(): void {
    this.wavePanel = document.createElement('div')
    this.wavePanel.className = 'wave-panel'

    const title = document.createElement('div')
    title.className = 'panel-title'
    title.textContent = '当前波次'
    this.wavePanel.appendChild(title)

    const remainingRow = document.createElement('div')
    remainingRow.className = 'stat-row'
    remainingRow.innerHTML = `
      <span class="stat-label">剩余僵尸</span>
      <span class="stat-value" id="remaining-display">0</span>
    `
    this.wavePanel.appendChild(remainingRow)

    const normalRow = document.createElement('div')
    normalRow.className = 'stat-row'
    normalRow.innerHTML = `
      <span class="zombie-type"><span class="zombie-dot normal"></span>普通</span>
      <span class="stat-value" id="normal-count">0</span>
    `
    this.wavePanel.appendChild(normalRow)

    const eliteRow = document.createElement('div')
    eliteRow.className = 'stat-row'
    eliteRow.innerHTML = `
      <span class="zombie-type"><span class="zombie-dot elite"></span>精英</span>
      <span class="stat-value" id="elite-count">0</span>
    `
    this.wavePanel.appendChild(eliteRow)

    const startBtn = document.createElement('button')
    startBtn.className = 'start-wave-btn'
    startBtn.textContent = '▶ 开始下一波'
    startBtn.addEventListener('click', () => {
      eventBus.emit('ui:startWave')
    })
    this.wavePanel.appendChild(startBtn)

    this.container.appendChild(this.wavePanel)

    this.remainingDisplay = document.getElementById('remaining-display')!
    this.normalCountDisplay = document.getElementById('normal-count')!
    this.eliteCountDisplay = document.getElementById('elite-count')!
  }

  private createUpgradeModal(): void {
    this.upgradeModal = document.createElement('div')
    this.upgradeModal.className = 'modal-overlay hidden'
    this.upgradeModal.innerHTML = `
      <div class="modal">
        <div class="modal-title" id="upgrade-tower-name">防御塔升级</div>
        <div class="tower-info-section">
          <div class="info-row">
            <span class="info-label">等级</span>
            <span class="info-value" id="upgrade-current-level">1</span>
          </div>
          <div class="info-row">
            <span class="info-label">攻击力</span>
            <span class="info-value"><span id="upgrade-current-damage">10</span> → <span class="up" id="upgrade-next-damage">13</span></span>
          </div>
          <div class="info-row">
            <span class="info-label">攻速</span>
            <span class="info-value"><span id="upgrade-current-speed">1.0</span> → <span class="up" id="upgrade-next-speed">1.15</span></span>
          </div>
          <div class="info-row">
            <span class="info-label">射程</span>
            <span class="info-value" id="upgrade-range">3</span>
          </div>
        </div>
        <div class="max-level hidden" id="max-level-text">已达最高等级</div>
        <button class="upgrade-btn" id="upgrade-confirm-btn">升级 (💰 50)</button>
        <button class="close-btn" id="upgrade-close-btn">关闭</button>
      </div>
    `
    this.container.appendChild(this.upgradeModal)

    const confirmBtn = document.getElementById('upgrade-confirm-btn')!
    const closeBtn = document.getElementById('upgrade-close-btn')!

    confirmBtn.addEventListener('click', () => {
      const selectedTower = this.towerSystem.getSelectedTower()
      if (selectedTower) {
        eventBus.emit('ui:upgradeConfirm', selectedTower.id)
        this.updateUpgradeModal()
      }
    })

    closeBtn.addEventListener('click', () => {
      this.closeUpgradeModal()
    })

    this.upgradeModal.addEventListener('click', (e) => {
      if (e.target === this.upgradeModal) {
        this.closeUpgradeModal()
      }
    })
  }

  private createCountdownOverlay(): void {
    this.countdownOverlay = document.createElement('div')
    this.countdownOverlay.className = 'countdown-overlay hidden'
    this.countdownOverlay.id = 'countdown-display'
    this.countdownOverlay.textContent = '15'
    this.container.appendChild(this.countdownOverlay)

    this.countdownDisplay = document.getElementById('countdown-display')!
  }

  private createGameOverModal(): void {
    this.gameOverModal = document.createElement('div')
    this.gameOverModal.className = 'modal-overlay hidden'
    this.gameOverModal.innerHTML = `
      <div class="modal">
        <div class="game-over-content">
          <div class="game-over-title">游戏结束</div>
          <div class="final-stats">
            <div class="info-row">
              <span class="info-label">坚持波次</span>
              <span class="info-value" id="final-wave">0</span>
            </div>
            <div class="info-row">
              <span class="info-label">剩余金币</span>
              <span class="info-value gold-value" id="final-gold">0</span>
            </div>
          </div>
          <button class="restart-btn" id="restart-btn">🔄 重新开始</button>
        </div>
      </div>
    `
    this.container.appendChild(this.gameOverModal)

    const restartBtn = document.getElementById('restart-btn')!
    restartBtn.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden')
      this.gameEngine.reset()
    })
  }

  private createVictoryModal(): void {
    this.victoryModal = document.createElement('div')
    this.victoryModal.className = 'modal-overlay hidden'
    this.victoryModal.innerHTML = `
      <div class="modal">
        <div class="victory-content">
          <div class="victory-title">🎉 胜利！</div>
          <div class="final-stats">
            <div class="info-row">
              <span class="info-label">完成波次</span>
              <span class="info-value" id="victory-wave">${TOTAL_WAVES}</span>
            </div>
            <div class="info-row">
              <span class="info-label">剩余生命</span>
              <span class="info-value lives-value" id="victory-lives">0</span>
            </div>
            <div class="info-row">
              <span class="info-label">剩余金币</span>
              <span class="info-value gold-value" id="victory-gold">0</span>
            </div>
          </div>
          <button class="restart-btn" id="victory-restart-btn">🔄 再来一局</button>
        </div>
      </div>
    `
    this.container.appendChild(this.victoryModal)

    const restartBtn = document.getElementById('victory-restart-btn')!
    restartBtn.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden')
      this.gameEngine.reset()
    })
  }

  private createMobileMenu(): void {
    this.mobileMenuBtn = document.createElement('div')
    this.mobileMenuBtn.className = 'mobile-menu-btn mobile-hidden'
    this.mobileMenuBtn.textContent = '☰'
    this.mobileMenuBtn.addEventListener('click', () => this.openMobileMenu())
    this.container.appendChild(this.mobileMenuBtn)

    this.mobileMenuOverlay = document.createElement('div')
    this.mobileMenuOverlay.className = 'mobile-menu-overlay'
    this.mobileMenuOverlay.addEventListener('click', () => this.closeMobileMenu())
    this.container.appendChild(this.mobileMenuOverlay)

    this.mobileMenu = document.createElement('div')
    this.mobileMenu.className = 'mobile-menu'

    const header = document.createElement('div')
    header.className = 'mobile-menu-header'
    header.innerHTML = `
      <span class="mobile-menu-title">游戏菜单</span>
      <button class="mobile-close-btn">×</button>
    `
    header.querySelector('.mobile-close-btn')!.addEventListener('click', () => this.closeMobileMenu())
    this.mobileMenu.appendChild(header)

    const statsSection = document.createElement('div')
    statsSection.className = 'mobile-section'
    statsSection.innerHTML = `
      <div class="mobile-section-title">游戏状态</div>
      <div class="stat-row">
        <span class="stat-label">波次</span>
        <span class="stat-value wave-value" id="mobile-wave">0 / ${TOTAL_WAVES}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">金币</span>
        <span class="stat-value gold-value" id="mobile-gold">${INITIAL_GOLD}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">生命</span>
        <span class="stat-value lives-value" id="mobile-lives">${INITIAL_LIVES}</span>
      </div>
    `
    this.mobileMenu.appendChild(statsSection)

    const towerSection = document.createElement('div')
    towerSection.className = 'mobile-section'
    const towerTitle = document.createElement('div')
    towerTitle.className = 'mobile-section-title'
    towerTitle.textContent = '防御塔'
    towerSection.appendChild(towerTitle)

    const towerTypes: TowerType[] = ['machinegun', 'flame', 'slow']
    const towerIcons: Record<TowerType, string> = {
      machinegun: '🔫',
      flame: '🔥',
      slow: '❄️'
    }

    towerTypes.forEach(type => {
      const config = TOWER_CONFIGS[type]
      const item = document.createElement('div')
      item.className = 'tower-item'
      item.dataset.type = type
      item.innerHTML = `
        <div class="tower-icon ${type}">${towerIcons[type]}</div>
        <div class="tower-info">
          <div class="tower-name">${config.name}</div>
          <div class="tower-cost">💰 ${config.cost}</div>
          <div class="tower-stats">
            伤害:${config.damage} 射程:${config.range} 攻速:${config.attackSpeed}/s
          </div>
        </div>
      `
      item.addEventListener('click', () => {
        this.selectTowerType(type)
        this.closeMobileMenu()
      })
      towerSection.appendChild(item)
    })
    this.mobileMenu.appendChild(towerSection)

    const waveSection = document.createElement('div')
    waveSection.className = 'mobile-section'
    waveSection.innerHTML = `
      <div class="mobile-section-title">当前波次</div>
      <div class="stat-row">
        <span class="stat-label">剩余僵尸</span>
        <span class="stat-value" id="mobile-remaining">0</span>
      </div>
      <div class="stat-row">
        <span class="zombie-type"><span class="zombie-dot normal"></span>普通</span>
        <span class="stat-value" id="mobile-normal">0</span>
      </div>
      <div class="stat-row">
        <span class="zombie-type"><span class="zombie-dot elite"></span>精英</span>
        <span class="stat-value" id="mobile-elite">0</span>
      </div>
      <button class="start-wave-btn" style="margin-top: 12px;" id="mobile-start-btn">▶ 开始下一波</button>
    `
    this.mobileMenu.appendChild(waveSection)

    this.container.appendChild(this.mobileMenu)

    const mobileStartBtn = document.getElementById('mobile-start-btn')!
    mobileStartBtn.addEventListener('click', () => {
      eventBus.emit('ui:startWave')
      this.closeMobileMenu()
    })
  }

  private registerEvents(): void {
    eventBus.on('ui:goldUpdate', (data) => {
      const gold = data as number
      this.goldDisplay.textContent = gold.toString()
      const mobileGold = document.getElementById('mobile-gold')
      if (mobileGold) mobileGold.textContent = gold.toString()
      this.updateTowerItems()
    })

    eventBus.on('ui:livesUpdate', (data) => {
      const lives = data as number
      this.livesDisplay.textContent = lives.toString()
      const mobileLives = document.getElementById('mobile-lives')
      if (mobileLives) mobileLives.textContent = lives.toString()
    })

    eventBus.on('ui:waveUpdate', (data) => {
      const { current, total } = data as { current: number; total: number }
      this.waveDisplay.textContent = `${current} / ${total}`
      const mobileWave = document.getElementById('mobile-wave')
      if (mobileWave) mobileWave.textContent = `${current} / ${total}`
    })

    eventBus.on('wave:countdown', (data) => {
      const countdown = data as number
      if (countdown > 0 && this.gameEngine.getState() === 'preparing') {
        this.countdownDisplay.textContent = countdown.toString()
        this.countdownOverlay.classList.remove('hidden')
      } else {
        this.countdownOverlay.classList.add('hidden')
      }
    })

    eventBus.on('wave:start', () => {
      this.countdownOverlay.classList.add('hidden')
      this.updateWavePanel()
    })

    eventBus.on('wave:end', () => {
      this.updateWavePanel()
    })

    eventBus.on('zombie:spawn', () => {
      this.updateWavePanel()
    })

    eventBus.on('zombie:death', () => {
      this.updateWavePanel()
    })

    eventBus.on('zombie:reachEnd', () => {
      this.updateWavePanel()
    })

    eventBus.on('tower:select', (data) => {
      const towerId = data as string
      const tower = this.towerSystem.getTowers().find(t => t.id === towerId)
      if (tower) {
        this.showUpgradeModal(tower)
      }
    })

    eventBus.on('tower:deselect', () => {
      this.closeUpgradeModal()
    })

    eventBus.on('tower:upgrade', () => {
      const tower = this.towerSystem.getSelectedTower()
      if (tower) {
        this.updateUpgradeModal()
      }
    })

    eventBus.on('game:over', () => {
      document.getElementById('final-wave')!.textContent = this.gameEngine.getCurrentWave().toString()
      document.getElementById('final-gold')!.textContent = this.gameEngine.getGold().toString()
      this.gameOverModal.classList.remove('hidden')
    })

    eventBus.on('game:victory', () => {
      document.getElementById('victory-lives')!.textContent = this.gameEngine.getLives().toString()
      document.getElementById('victory-gold')!.textContent = this.gameEngine.getGold().toString()
      this.victoryModal.classList.remove('hidden')
    })

    eventBus.on('ui:towerSelected', (data) => {
      const type = data as TowerType | null
      this.selectedTowerType = type
      this.updateTowerSelection()
    })
  }

  private selectTowerType(type: TowerType): void {
    const config = TOWER_CONFIGS[type]
    if (this.gameEngine.getGold() < config.cost) {
      return
    }

    if (this.selectedTowerType === type) {
      this.selectedTowerType = null
      eventBus.emit('ui:towerSelected', null)
    } else {
      this.selectedTowerType = type
      eventBus.emit('ui:towerSelected', type)
    }
  }

  private updateTowerSelection(): void {
    const items = this.towerToolbar.querySelectorAll('.tower-item')
    items.forEach(item => {
      const htmlItem = item as HTMLElement
      const type = htmlItem.dataset.type as TowerType
      if (type === this.selectedTowerType) {
        htmlItem.classList.add('selected')
      } else {
        htmlItem.classList.remove('selected')
      }
    })
  }

  private updateTowerItems(): void {
    const gold = this.gameEngine.getGold()
    const items = this.towerToolbar.querySelectorAll('.tower-item')
    items.forEach(item => {
      const htmlItem = item as HTMLElement
      const type = htmlItem.dataset.type as TowerType
      const config = TOWER_CONFIGS[type]
      if (gold < config.cost) {
        htmlItem.classList.add('disabled')
      } else {
        htmlItem.classList.remove('disabled')
      }
    })
  }

  private updateWavePanel(): void {
    const remaining = this.gameEngine.getRemainingZombies()
    const stats = this.gameEngine.getZombieStats()

    this.remainingDisplay.textContent = remaining.toString()
    this.normalCountDisplay.textContent = stats.normal.toString()
    this.eliteCountDisplay.textContent = stats.elite.toString()

    const mobileRemaining = document.getElementById('mobile-remaining')
    const mobileNormal = document.getElementById('mobile-normal')
    const mobileElite = document.getElementById('mobile-elite')

    if (mobileRemaining) mobileRemaining.textContent = remaining.toString()
    if (mobileNormal) mobileNormal.textContent = stats.normal.toString()
    if (mobileElite) mobileElite.textContent = stats.elite.toString()
  }

  private showUpgradeModal(_tower: Tower): void {
    this.updateUpgradeModal()
    this.upgradeModal.classList.remove('hidden')
  }

  private updateUpgradeModal(): void {
    const tower = this.towerSystem.getSelectedTower()
    if (!tower) {
      this.closeUpgradeModal()
      return
    }

    document.getElementById('upgrade-tower-name')!.textContent = `${tower.name} Lv.${tower.level}`
    document.getElementById('upgrade-current-level')!.textContent = tower.level.toString()
    document.getElementById('upgrade-current-damage')!.textContent = tower.damage.toString()
    document.getElementById('upgrade-current-speed')!.textContent = tower.attackSpeed.toFixed(2)
    document.getElementById('upgrade-range')!.textContent = tower.range.toString()

    const maxLevelText = document.getElementById('max-level-text')!
    const confirmBtn = document.getElementById('upgrade-confirm-btn') as HTMLButtonElement

    if (tower.level >= 3) {
      maxLevelText.classList.remove('hidden')
      confirmBtn.disabled = true
      confirmBtn.textContent = '已达最高等级'
      document.getElementById('upgrade-next-damage')!.textContent = '-'
      document.getElementById('upgrade-next-speed')!.textContent = '-'
    } else {
      maxLevelText.classList.add('hidden')
      const nextDamage = Math.floor(TOWER_CONFIGS[tower.type].damage * (1 + 0.3 * tower.level))
      const nextSpeed = (TOWER_CONFIGS[tower.type].attackSpeed * (1 + 0.15 * tower.level)).toFixed(2)
      const upgradeCost = this.towerSystem.getUpgradeCost(tower)

      document.getElementById('upgrade-next-damage')!.textContent = nextDamage.toString()
      document.getElementById('upgrade-next-speed')!.textContent = nextSpeed
      confirmBtn.disabled = this.gameEngine.getGold() < upgradeCost
      confirmBtn.textContent = `升级 (💰 ${upgradeCost})`
    }
  }

  private closeUpgradeModal(): void {
    this.upgradeModal.classList.add('hidden')
    eventBus.emit('tower:deselect')
  }

  private openMobileMenu(): void {
    this.mobileMenu.classList.add('open')
    this.mobileMenuOverlay.classList.add('open')
  }

  private closeMobileMenu(): void {
    this.mobileMenu.classList.remove('open')
    this.mobileMenuOverlay.classList.remove('open')
  }
}
