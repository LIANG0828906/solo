import { gsap } from 'gsap'
import { eventBus, EVENTS } from '../core/EventBus'

export class UIModule {
  private container: HTMLElement | null = null

  private hudContainer: HTMLDivElement | null = null
  private energyBarContainer: HTMLDivElement | null = null
  private energyBarFill: HTMLDivElement | null = null
  private energyFlame: HTMLDivElement | null = null
  private scoreDisplay: HTMLDivElement | null = null
  private distanceDisplay: HTMLDivElement | null = null

  private gameOverOverlay: HTMLDivElement | null = null
  private gameOverTitle: HTMLHeadingElement | null = null
  private finalScoreDisplay: HTMLDivElement | null = null
  private restartButton: HTMLButtonElement | null = null

  private collisionFlash: HTMLDivElement | null = null

  private currentScore: number = 0
  private currentEnergy: number = 100
  private currentMaxEnergy: number = 100
  private currentDistance: number = 0

  private isGameOver: boolean = false

  private isMobile: boolean = false

  constructor() {
    this.bindEvents()
  }

  private bindEvents(): void {
    eventBus.on(EVENTS.GAME_SCORE_UPDATE, this.handleScoreUpdate.bind(this))
    eventBus.on(EVENTS.GAME_ENERGY_UPDATE, this.handleEnergyUpdate.bind(this))
    eventBus.on(EVENTS.GAME_GAME_OVER, this.handleGameOver.bind(this))
    eventBus.on(EVENTS.GAME_RESTART, this.handleRestart.bind(this))
    eventBus.on(EVENTS.EFFECTS_SCREEN_FLASH, this.handleScreenFlash.bind(this))
  }

  init(container: HTMLElement): void {
    this.container = container
    this.checkMobile()
    this.createHUD()
    this.createGameOverScreen()
    this.createCollisionFlash()

    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768
  }

  private createHUD(): void {
    if (!this.container) return

    this.hudContainer = document.createElement('div')
    this.hudContainer.style.position = 'fixed'
    this.hudContainer.style.top = '0'
    this.hudContainer.style.left = '0'
    this.hudContainer.style.width = '100%'
    this.hudContainer.style.height = '100%'
    this.hudContainer.style.pointerEvents = 'none'
    this.hudContainer.style.zIndex = '100'

    this.scoreDisplay = document.createElement('div')
    this.scoreDisplay.textContent = 'SCORE: 0'
    this.scoreDisplay.style.position = 'absolute'
    this.scoreDisplay.style.top = '20px'
    this.scoreDisplay.style.left = '20px'
    this.scoreDisplay.style.fontFamily = 'monospace'
    this.scoreDisplay.style.fontSize = this.isMobile ? '19px' : '24px'
    this.scoreDisplay.style.color = '#FFFFFF'
    this.scoreDisplay.style.textShadow = '0 0 10px rgba(0, 255, 136, 0.5)'
    this.scoreDisplay.style.letterSpacing = '2px'
    this.hudContainer.appendChild(this.scoreDisplay)

    this.distanceDisplay = document.createElement('div')
    this.distanceDisplay.textContent = 'DIST: 0m'
    this.distanceDisplay.style.position = 'absolute'
    this.distanceDisplay.style.top = this.isMobile ? '45px' : '55px'
    this.distanceDisplay.style.left = '20px'
    this.distanceDisplay.style.fontFamily = 'monospace'
    this.distanceDisplay.style.fontSize = this.isMobile ? '14px' : '18px'
    this.distanceDisplay.style.color = 'rgba(255, 255, 255, 0.7)'
    this.distanceDisplay.style.letterSpacing = '1px'
    this.hudContainer.appendChild(this.distanceDisplay)

    this.energyBarContainer = document.createElement('div')
    this.energyBarContainer.style.position = 'absolute'
    this.energyBarContainer.style.top = '20px'
    this.energyBarContainer.style.right = '20px'
    this.energyBarContainer.style.display = 'flex'
    this.energyBarContainer.style.flexDirection = 'column'
    this.energyBarContainer.style.alignItems = 'flex-end'
    this.energyBarContainer.style.gap = '8px'
    this.hudContainer.appendChild(this.energyBarContainer)

    this.energyFlame = document.createElement('div')
    this.energyFlame.style.width = '24px'
    this.energyFlame.style.height = '24px'
    this.energyFlame.style.position = 'relative'
    this.createFlameIcon(this.energyFlame)
    this.energyBarContainer.appendChild(this.energyFlame)

    const energyBarWrapper = document.createElement('div')
    energyBarWrapper.style.width = this.isMobile ? '160px' : '200px'
    energyBarWrapper.style.height = this.isMobile ? '16px' : '20px'
    energyBarWrapper.style.backgroundColor = '#333333'
    energyBarWrapper.style.borderRadius = '6px'
    energyBarWrapper.style.border = '1px solid white'
    energyBarWrapper.style.overflow = 'hidden'
    energyBarWrapper.style.position = 'relative'

    this.energyBarFill = document.createElement('div')
    this.energyBarFill.style.position = 'absolute'
    this.energyBarFill.style.top = '0'
    this.energyBarFill.style.left = '0'
    this.energyBarFill.style.height = '100%'
    this.energyBarFill.style.width = '100%'
    this.energyBarFill.style.backgroundColor = '#00FF88'
    this.energyBarFill.style.transition = 'width 0.3s ease, background-color 0.3s ease'
    this.energyBarFill.style.borderRadius = '6px'
    energyBarWrapper.appendChild(this.energyBarFill)

    this.energyBarContainer.appendChild(energyBarWrapper)

    this.container.appendChild(this.hudContainer)
  }

  private createFlameIcon(container: HTMLDivElement): void {
    const flame1 = document.createElement('div')
    flame1.style.position = 'absolute'
    flame1.style.bottom = '0'
    flame1.style.left = '50%'
    flame1.style.transform = 'translateX(-50%)'
    flame1.style.width = '0'
    flame1.style.height = '0'
    flame1.style.borderLeft = '8px solid transparent'
    flame1.style.borderRight = '8px solid transparent'
    flame1.style.borderBottom = '16px solid #00FF88'
    flame1.style.animation = 'flame-flicker 0.3s ease-in-out infinite alternate'
    container.appendChild(flame1)

    const flame2 = document.createElement('div')
    flame2.style.position = 'absolute'
    flame2.style.bottom = '0'
    flame2.style.left = '50%'
    flame2.style.transform = 'translateX(-50%) scale(0.6)'
    flame2.style.width = '0'
    flame2.style.height = '0'
    flame2.style.borderLeft = '8px solid transparent'
    flame2.style.borderRight = '8px solid transparent'
    flame2.style.borderBottom = '16px solid #88FF88'
    flame2.style.animation = 'flame-flicker 0.2s ease-in-out infinite alternate-reverse'
    container.appendChild(flame2)

    const style = document.createElement('style')
    style.textContent = `
      @keyframes flame-flicker {
        0% { transform: translateX(-50%) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) scale(0.8) translateY(-2px); opacity: 0.8; }
      }
    `
    document.head.appendChild(style)
  }

  private createGameOverScreen(): void {
    if (!this.container) return

    this.gameOverOverlay = document.createElement('div')
    this.gameOverOverlay.style.position = 'fixed'
    this.gameOverOverlay.style.top = '0'
    this.gameOverOverlay.style.left = '0'
    this.gameOverOverlay.style.width = '100%'
    this.gameOverOverlay.style.height = '100%'
    this.gameOverOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    this.gameOverOverlay.style.display = 'none'
    this.gameOverOverlay.style.flexDirection = 'column'
    this.gameOverOverlay.style.alignItems = 'center'
    this.gameOverOverlay.style.justifyContent = 'center'
    this.gameOverOverlay.style.zIndex = '200'
    this.gameOverOverlay.style.pointerEvents = 'auto'

    this.gameOverTitle = document.createElement('h1')
    this.gameOverTitle.textContent = 'GAME OVER'
    this.gameOverTitle.style.fontFamily = 'monospace'
    this.gameOverTitle.style.fontSize = this.isMobile ? '36px' : '48px'
    this.gameOverTitle.style.color = '#FF4444'
    this.gameOverTitle.style.textShadow = '0 0 20px #FF8888, 0 0 40px #FF8888'
    this.gameOverTitle.style.margin = '0 0 30px 0'
    this.gameOverTitle.style.letterSpacing = '4px'
    this.gameOverOverlay.appendChild(this.gameOverTitle)

    this.finalScoreDisplay = document.createElement('div')
    this.finalScoreDisplay.style.fontFamily = 'monospace'
    this.finalScoreDisplay.style.fontSize = this.isMobile ? '20px' : '24px'
    this.finalScoreDisplay.style.color = '#FFFFFF'
    this.finalScoreDisplay.style.marginBottom = '40px'
    this.finalScoreDisplay.style.letterSpacing = '2px'
    this.gameOverOverlay.appendChild(this.finalScoreDisplay)

    this.restartButton = document.createElement('button')
    this.restartButton.textContent = 'RESTART'
    this.restartButton.style.width = this.isMobile ? '100px' : '120px'
    this.restartButton.style.height = this.isMobile ? '36px' : '40px'
    this.restartButton.style.backgroundColor = '#00FF88'
    this.restartButton.style.color = '#0A0A1A'
    this.restartButton.style.border = 'none'
    this.restartButton.style.borderRadius = '8px'
    this.restartButton.style.fontFamily = 'monospace'
    this.restartButton.style.fontSize = this.isMobile ? '14px' : '16px'
    this.restartButton.style.fontWeight = 'bold'
    this.restartButton.style.cursor = 'pointer'
    this.restartButton.style.transition = 'background-color 0.2s ease, transform 0.1s ease'
    this.restartButton.style.letterSpacing = '2px'

    this.restartButton.addEventListener('mouseenter', () => {
      if (this.restartButton) {
        this.restartButton.style.backgroundColor = '#33FFAA'
        this.restartButton.style.transform = 'scale(1.05)'
      }
    })

    this.restartButton.addEventListener('mouseleave', () => {
      if (this.restartButton) {
        this.restartButton.style.backgroundColor = '#00FF88'
        this.restartButton.style.transform = 'scale(1)'
      }
    })

    this.restartButton.addEventListener('click', () => {
      this.restartGame()
    })

    this.gameOverOverlay.appendChild(this.restartButton)

    this.container.appendChild(this.gameOverOverlay)
  }

  private createCollisionFlash(): void {
    if (!this.container) return

    this.collisionFlash = document.createElement('div')
    this.collisionFlash.style.position = 'fixed'
    this.collisionFlash.style.top = '0'
    this.collisionFlash.style.left = '0'
    this.collisionFlash.style.width = '100%'
    this.collisionFlash.style.height = '100%'
    this.collisionFlash.style.pointerEvents = 'none'
    this.collisionFlash.style.boxShadow = 'inset 0 0 0 0px rgba(255, 68, 68, 0)'
    this.collisionFlash.style.zIndex = '150'
    this.collisionFlash.style.transition = 'box-shadow 0.15s ease'

    this.container.appendChild(this.collisionFlash)
  }

  private handleScoreUpdate(data: {
    score: number
    distance: number
    shardsCollected: number
    level: number
  }): void {
    this.currentScore = data.score
    this.currentDistance = data.distance

    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `SCORE: ${data.score}`
      this.animateScoreChange()
    }

    if (this.distanceDisplay) {
      this.distanceDisplay.textContent = `DIST: ${Math.floor(data.distance)}m`
    }
  }

  private handleEnergyUpdate(data: { energy: number; maxEnergy: number }): void {
    this.currentEnergy = data.energy
    this.currentMaxEnergy = data.maxEnergy

    this.updateEnergyBar()
  }

  private updateEnergyBar(): void {
    if (!this.energyBarFill) return

    const percentage = (this.currentEnergy / this.currentMaxEnergy) * 100
    this.energyBarFill.style.width = `${percentage}%`

    let color: string
    if (percentage > 60) {
      color = '#00FF88'
    } else if (percentage > 30) {
      color = '#FFCC00'
    } else {
      color = '#FF4444'
    }

    this.energyBarFill.style.backgroundColor = color
    this.updateFlameColor(color)
  }

  private updateFlameColor(color: string): void {
    if (!this.energyFlame) return

    const flames = this.energyFlame.children
    if (flames.length >= 2) {
      ;(flames[0] as HTMLDivElement).style.borderBottomColor = color
      ;(flames[1] as HTMLDivElement).style.borderBottomColor = this.lightenColor(color, 30)
    }
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.min(255, (num >> 16) + amt)
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
    const B = Math.min(255, (num & 0x0000ff) + amt)
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
  }

  private animateScoreChange(): void {
    if (!this.scoreDisplay) return

    gsap.fromTo(
      this.scoreDisplay,
      { scale: 1 },
      {
        scale: 1.1,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      }
    )
  }

  private handleGameOver(data: {
    finalScore: number
    distance: number
    shardsCollected: number
  }): void {
    this.isGameOver = true
    this.showGameOver(data.finalScore, data.distance)
  }

  private showGameOver(score: number, distance: number): void {
    if (!this.gameOverOverlay || !this.finalScoreDisplay) return

    this.finalScoreDisplay.innerHTML = `
      <div style="margin-bottom: 10px;">FINAL SCORE: ${score}</div>
      <div style="font-size: 16px; color: rgba(255,255,255,0.7);">
        DISTANCE: ${Math.floor(distance)}m
      </div>
    `

    this.gameOverOverlay.style.display = 'flex'

    gsap.fromTo(
      this.gameOverOverlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    )

    if (this.gameOverTitle) {
      gsap.fromTo(
        this.gameOverTitle,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: 'back.out(1.4)' }
      )
    }

    if (this.restartButton) {
      gsap.fromTo(
        this.restartButton,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, delay: 0.5, ease: 'back.out(1.4)' }
      )
    }
  }

  private hideGameOver(): void {
    if (!this.gameOverOverlay) return

    gsap.to(this.gameOverOverlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
      onComplete: () => {
        if (this.gameOverOverlay) {
          this.gameOverOverlay.style.display = 'none'
        }
      },
    })
  }

  private restartGame(): void {
    this.isGameOver = false
    this.hideGameOver()
    eventBus.emit(EVENTS.GAME_RESTART)
  }

  private handleRestart(): void {
    this.isGameOver = false
    this.currentScore = 0
    this.currentEnergy = 100
    this.currentDistance = 0

    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = 'SCORE: 0'
    }
    if (this.distanceDisplay) {
      this.distanceDisplay.textContent = 'DIST: 0m'
    }

    this.updateEnergyBar()
  }

  private handleScreenFlash(data: {
    color: string
    opacity: number
    duration: number
    borderOnly?: boolean
    borderWidth?: number
  }): void {
    if (data.borderOnly && this.collisionFlash) {
      this.collisionFlash.style.boxShadow = `inset 0 0 0 ${data.borderWidth || 3}px rgba(255, 68, 68, ${data.opacity})`

      gsap.delayedCall(data.duration, () => {
        if (this.collisionFlash) {
          this.collisionFlash.style.boxShadow = 'inset 0 0 0 0px rgba(255, 68, 68, 0)'
        }
      })
    }
  }

  private onWindowResize(): void {
    const wasMobile = this.isMobile
    this.checkMobile()

    if (wasMobile !== this.isMobile && this.scoreDisplay) {
      this.scoreDisplay.style.fontSize = this.isMobile ? '19px' : '24px'
    }

    if (wasMobile !== this.isMobile && this.distanceDisplay) {
      this.distanceDisplay.style.top = this.isMobile ? '45px' : '55px'
      this.distanceDisplay.style.fontSize = this.isMobile ? '14px' : '18px'
    }

    if (wasMobile !== this.isMobile && this.energyBarContainer) {
      const energyWrapper = this.energyBarContainer.children[1] as HTMLDivElement
      if (energyWrapper) {
        energyWrapper.style.width = this.isMobile ? '160px' : '200px'
        energyWrapper.style.height = this.isMobile ? '16px' : '20px'
      }
    }

    if (wasMobile !== this.isMobile && this.gameOverTitle) {
      this.gameOverTitle.style.fontSize = this.isMobile ? '36px' : '48px'
    }

    if (wasMobile !== this.isMobile && this.finalScoreDisplay) {
      this.finalScoreDisplay.style.fontSize = this.isMobile ? '20px' : '24px'
    }

    if (wasMobile !== this.isMobile && this.restartButton) {
      this.restartButton.style.width = this.isMobile ? '100px' : '120px'
      this.restartButton.style.height = this.isMobile ? '36px' : '40px'
      this.restartButton.style.fontSize = this.isMobile ? '14px' : '16px'
    }
  }

  getScore(): number {
    return this.currentScore
  }

  getEnergy(): number {
    return this.currentEnergy
  }

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this))

    if (this.hudContainer && this.container) {
      this.container.removeChild(this.hudContainer)
    }
    if (this.gameOverOverlay && this.container) {
      this.container.removeChild(this.gameOverOverlay)
    }
    if (this.collisionFlash && this.container) {
      this.container.removeChild(this.collisionFlash)
    }
  }
}
