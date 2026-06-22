import { ObjectRegistry, GameMode } from '../engine/objectRegistry'

export class Controls {
  private container: HTMLElement
  private objectRegistry: ObjectRegistry
  
  private controlBar: HTMLDivElement
  private buttons: Map<GameMode, HTMLButtonElement> = new Map()
  
  private onModeChange: ((mode: GameMode) => void) | null = null

  constructor(container: HTMLElement, objectRegistry: ObjectRegistry) {
    this.container = container
    this.objectRegistry = objectRegistry
    
    this.controlBar = document.createElement('div')
    this.setupControlBar()
    
    this.createButtons()
    
    this.container.appendChild(this.controlBar)
  }

  private setupControlBar(): void {
    this.controlBar.style.position = 'fixed'
    this.controlBar.style.bottom = '30px'
    this.controlBar.style.left = '50%'
    this.controlBar.style.transform = 'translateX(-50%)'
    this.controlBar.style.display = 'flex'
    this.controlBar.style.gap = '20px'
    this.controlBar.style.padding = '20px 40px'
    this.controlBar.style.background = 'rgba(255, 255, 255, 0.1)'
    this.controlBar.style.backdropFilter = 'blur(20px)'
    ;(this.controlBar.style as any).webkitBackdropFilter = 'blur(20px)'
    this.controlBar.style.borderRadius = '20px'
    this.controlBar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
    this.controlBar.style.border = '1px solid rgba(255, 255, 255, 0.2)'
    this.controlBar.style.zIndex = '1000'
    this.controlBar.style.userSelect = 'none'
  }

  private createButtons(): void {
    const buttonConfigs: Array<{
      mode: GameMode
      label: string
      icon: string
    }> = [
      { mode: 'destroy', label: '破坏模式', icon: '💥' },
      { mode: 'explode', label: '爆炸模式', icon: '🚀' },
      { mode: 'reset', label: '重置场景', icon: '🔄' }
    ]
    
    for (const config of buttonConfigs) {
      const button = document.createElement('button')
      button.textContent = `${config.icon}  ${config.label}`
      button.style.padding = '14px 28px'
      button.style.fontSize = '16px'
      button.style.fontWeight = '600'
      button.style.border = 'none'
      button.style.borderRadius = '12px'
      button.style.cursor = 'pointer'
      button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      button.style.color = 'white'
      button.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)'
      button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
      button.style.minWidth = '130px'
      button.style.outline = 'none'
      button.style.position = 'relative'
      button.style.overflow = 'hidden'
      
      this.applyButtonColor(button, config.mode, false)
      
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.08)'
        button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
      })
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)'
        button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
      })
      
      button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.98)'
      })
      
      button.addEventListener('mouseup', () => {
        button.style.transform = 'scale(1.08)'
      })
      
      button.addEventListener('click', () => {
        this.handleButtonClick(config.mode)
      })
      
      this.buttons.set(config.mode, button)
      this.controlBar.appendChild(button)
    }
    
    this.updateButtonStates('destroy')
  }

  private applyButtonColor(
    button: HTMLButtonElement,
    mode: GameMode,
    active: boolean
  ): void {
    if (active) {
      switch (mode) {
        case 'destroy':
          button.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a5a)'
          break
        case 'explode':
          button.style.background = 'linear-gradient(135deg, #feca57, #ff9f43)'
          break
        case 'reset':
          button.style.background = 'linear-gradient(135deg, #1dd1a1, #10ac84)'
          break
      }
    } else {
      button.style.background = 'rgba(107, 91, 149, 0.6)'
    }
  }

  private handleButtonClick(mode: GameMode): void {
    if (mode === 'reset') {
      this.objectRegistry.resetScene()
    } else {
      this.objectRegistry.setMode(mode)
      this.updateButtonStates(mode)
      
      if (this.onModeChange) {
        this.onModeChange(mode)
      }
    }
  }

  private updateButtonStates(activeMode: GameMode): void {
    this.buttons.forEach((button, mode) => {
      const isActive = mode === activeMode
      this.applyButtonColor(button, mode, isActive)
      
      if (isActive) {
        button.style.transform = 'scale(1.05)'
        button.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.4)'
      } else {
        button.style.transform = 'scale(1)'
        button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
      }
    })
  }

  setOnModeChange(callback: (mode: GameMode) => void): void {
    this.onModeChange = callback
  }

  setActiveMode(mode: GameMode): void {
    this.updateButtonStates(mode)
  }

  dispose(): void {
    this.controlBar.remove()
  }
}
