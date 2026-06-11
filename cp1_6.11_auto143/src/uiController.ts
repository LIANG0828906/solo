import * as THREE from 'three'

export interface SliderValues {
  diffusionSpeed: number
  saturation: number
  backgroundDepth: number
}

export class UIController {
  private inputElement: HTMLTextAreaElement
  private generateButton: HTMLButtonElement
  private exportButton: HTMLButtonElement
  private toggleButton: HTMLButtonElement
  private controlPanel: HTMLDivElement
  private tooltip: HTMLDivElement
  
  private sliders: {
    diffusionSpeed: HTMLInputElement
    saturation: HTMLInputElement
    backgroundDepth: HTMLInputElement
  }
  
  private sliderValues: {
    diffusionSpeed: HTMLSpanElement
    saturation: HTMLSpanElement
    backgroundDepth: HTMLSpanElement
  }

  private onGenerateCallback: ((text: string) => void) | null = null
  private onExportCallback: (() => void) | null = null
  private onSliderChangeCallback: ((values: SliderValues) => void) | null = null

  constructor() {
    this.inputElement = document.getElementById('text-input') as HTMLTextAreaElement
    this.generateButton = document.getElementById('generate-btn') as HTMLButtonElement
    this.exportButton = document.getElementById('export-btn') as HTMLButtonElement
    this.toggleButton = document.getElementById('toggle-btn') as HTMLButtonElement
    this.controlPanel = document.getElementById('control-panel') as HTMLDivElement
    this.tooltip = document.getElementById('tooltip') as HTMLDivElement

    this.sliders = {
      diffusionSpeed: document.getElementById('diffusion-slider') as HTMLInputElement,
      saturation: document.getElementById('saturation-slider') as HTMLInputElement,
      backgroundDepth: document.getElementById('depth-slider') as HTMLInputElement
    }

    this.sliderValues = {
      diffusionSpeed: document.getElementById('diffusion-value') as HTMLSpanElement,
      saturation: document.getElementById('saturation-value') as HTMLSpanElement,
      backgroundDepth: document.getElementById('depth-value') as HTMLSpanElement
    }

    this.bindEvents()
  }

  private bindEvents(): void {
    this.generateButton.addEventListener('click', () => {
      const text = this.inputElement.value.trim()
      if (this.validateInput(text) && this.onGenerateCallback) {
        this.onGenerateCallback(text)
      }
    })

    this.exportButton.addEventListener('click', () => {
      if (this.onExportCallback) {
        this.onExportCallback()
      }
    })

    this.toggleButton.addEventListener('click', () => {
      this.toggleMobilePanel()
    })

    this.sliders.diffusionSpeed.addEventListener('input', () => {
      this.updateSliderValues()
      this.sliderValues.diffusionSpeed.textContent = `${this.sliders.diffusionSpeed.value}秒`
    })

    this.sliders.saturation.addEventListener('input', () => {
      this.updateSliderValues()
      this.sliderValues.saturation.textContent = `${this.sliders.saturation.value}%`
    })

    this.sliders.backgroundDepth.addEventListener('input', () => {
      this.updateSliderValues()
      this.sliderValues.backgroundDepth.textContent = this.sliders.backgroundDepth.value
    })

    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        this.generateButton.click()
      }
    })

    window.addEventListener('resize', () => {
      this.handleResponsive()
    })

    this.handleResponsive()
  }

  private updateSliderValues(): void {
    if (this.onSliderChangeCallback) {
      this.onSliderChangeCallback({
        diffusionSpeed: parseFloat(this.sliders.diffusionSpeed.value),
        saturation: parseInt(this.sliders.saturation.value),
        backgroundDepth: parseInt(this.sliders.backgroundDepth.value)
      })
    }
  }

  private handleResponsive(): void {
    if (window.innerWidth <= 800) {
      this.controlPanel.classList.remove('expanded')
      this.toggleButton.classList.remove('expanded')
    }
  }

  public init(
    onGenerate: (text: string) => void,
    onExport: () => void,
    onSliderChange: (values: SliderValues) => void
  ): void {
    this.onGenerateCallback = onGenerate
    this.onExportCallback = onExport
    this.onSliderChangeCallback = onSliderChange
    this.updateSliderValues()
  }

  public getSliderValues(): SliderValues {
    return {
      diffusionSpeed: parseFloat(this.sliders.diffusionSpeed.value),
      saturation: parseInt(this.sliders.saturation.value),
      backgroundDepth: parseInt(this.sliders.backgroundDepth.value)
    }
  }

  public validateInput(text: string): boolean {
    if (!text || text.length === 0) {
      this.shakeInput()
      return false
    }
    if (text.length > 1000) {
      alert('输入文字过长，请控制在1000字以内')
      return false
    }
    return true
  }

  private shakeInput(): void {
    this.inputElement.style.animation = 'none'
    this.inputElement.offsetHeight
    this.inputElement.style.animation = 'shake 0.3s ease-in-out'
    
    if (!document.getElementById('shake-style')) {
      const style = document.createElement('style')
      style.id = 'shake-style'
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `
      document.head.appendChild(style)
    }
  }

  public exportSnapshot(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, width: number = 1920, height: number = 1080): void {
    const originalSize = renderer.getSize(new THREE.Vector2())
    const originalPixelRatio = renderer.getPixelRatio()

    renderer.setSize(width, height)
    renderer.setPixelRatio(1)
    renderer.render(scene, camera)

    const dataURL = renderer.domElement.toDataURL('image/png')

    renderer.setSize(originalSize.x, originalSize.y)
    renderer.setPixelRatio(originalPixelRatio)

    const link = document.createElement('a')
    link.download = `情感星云_${new Date().toISOString().slice(0, 10)}.png`
    link.href = dataURL
    link.click()
  }

  public showTooltip(word: string, position: { x: number; y: number }): void {
    this.tooltip.textContent = word
    this.tooltip.style.left = `${position.x + 15}px`
    this.tooltip.style.top = `${position.y + 15}px`
    this.tooltip.classList.add('visible')
  }

  public hideTooltip(): void {
    this.tooltip.classList.remove('visible')
  }

  public toggleMobilePanel(): void {
    const isExpanded = this.controlPanel.classList.toggle('expanded')
    this.toggleButton.classList.toggle('expanded', isExpanded)
  }

  public setGenerateButtonEnabled(enabled: boolean): void {
    this.generateButton.disabled = !enabled
    this.generateButton.style.opacity = enabled ? '1' : '0.6'
    this.generateButton.style.cursor = enabled ? 'pointer' : 'not-allowed'
  }
}
