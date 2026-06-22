import { DisplayMode } from './sceneBuilder'

export interface UIControlsCallbacks {
  onRotationSpeedChange: (speed: number) => void
  onDisplayModeChange: (mode: DisplayMode) => void
  onResetView: () => void
  onAutoRotateToggle: (enabled: boolean) => void
}

export class UIControls {
  private container: HTMLElement
  private callbacks: UIControlsCallbacks
  private rotationSpeedSlider: HTMLInputElement | null = null
  private displayModeSelect: HTMLSelectElement | null = null
  private speedValueLabel: HTMLElement | null = null
  private autoRotateSwitch: HTMLButtonElement | null = null

  constructor(container: HTMLElement, callbacks: UIControlsCallbacks) {
    this.container = container
    this.callbacks = callbacks
    this.createPanel()
  }

  private createPanel(): void {
    const panel = document.createElement('div')
    panel.className = 'molecule-control-panel'
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 30px;
      width: 260px;
      background: rgba(10, 14, 39, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-size: 13px;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `

    const title = document.createElement('div')
    title.textContent = '控制面板'
    title.style.cssText = `
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 14px;
      color: #e2e8f0;
      letter-spacing: 0.5px;
    `
    panel.appendChild(title)

    const speedSection = this.createSpeedControl()
    panel.appendChild(speedSection)

    const modeSection = this.createDisplayModeControl()
    panel.appendChild(modeSection)

    const autoRotateSection = this.createAutoRotateSwitch()
    panel.appendChild(autoRotateSection)

    const resetBtn = this.createResetButton()
    panel.appendChild(resetBtn)

    const title2 = document.createElement('div')
    title2.textContent = 'MoleculeVue'
    title2.style.cssText = `
      font-size: 11px;
      color: #64748b;
      text-align: center;
      margin-top: 12px;
      letter-spacing: 1px;
    `
    panel.appendChild(title2)

    this.container.appendChild(panel)
  }

  private createSpeedControl(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.marginBottom = '16px'

    const labelRow = document.createElement('div')
    labelRow.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;'

    const label = document.createElement('span')
    label.textContent = '旋转速度'
    label.style.color = '#94a3b8'

    this.speedValueLabel = document.createElement('span')
    this.speedValueLabel.textContent = '1.00'
    this.speedValueLabel.style.cssText = 'color: #3b82f6; font-weight: 600; font-family: monospace;'

    labelRow.appendChild(label)
    labelRow.appendChild(this.speedValueLabel)
    wrapper.appendChild(labelRow)

    this.rotationSpeedSlider = document.createElement('input')
    this.rotationSpeedSlider.type = 'range'
    this.rotationSpeedSlider.min = '0'
    this.rotationSpeedSlider.max = '5'
    this.rotationSpeedSlider.step = '0.1'
    this.rotationSpeedSlider.value = '1'
    this.rotationSpeedSlider.style.cssText = `
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #1e293b;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    `

    this.addSliderStyles(this.rotationSpeedSlider)

    this.rotationSpeedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.speedValueLabel!.textContent = value.toFixed(2)
      this.callbacks.onRotationSpeedChange(value)
    })

    wrapper.appendChild(this.rotationSpeedSlider)
    return wrapper
  }

  private createDisplayModeControl(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.marginBottom = '16px'

    const label = document.createElement('span')
    label.textContent = '显示模式'
    label.style.cssText = 'display: block; margin-bottom: 8px; color: #94a3b8;'
    wrapper.appendChild(label)

    this.displayModeSelect = document.createElement('select')
    this.displayModeSelect.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #1e293b;
      color: white;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
    `

    const options = [
      { value: 'ball-stick', label: '球棍模型' },
      { value: 'space-filling', label: '空间填充模型' },
      { value: 'wireframe', label: '线框模式' }
    ]

    options.forEach((opt) => {
      const option = document.createElement('option')
      option.value = opt.value
      option.textContent = opt.label
      this.displayModeSelect!.appendChild(option)
    })

    this.displayModeSelect.addEventListener('change', (e) => {
      const mode = (e.target as HTMLSelectElement).value as DisplayMode
      this.callbacks.onDisplayModeChange(mode)
    })

    this.displayModeSelect.addEventListener('mouseenter', () => {
      this.displayModeSelect!.style.borderColor = '#3b82f6'
    })

    this.displayModeSelect.addEventListener('mouseleave', () => {
      this.displayModeSelect!.style.borderColor = '#334155'
    })

    wrapper.appendChild(this.displayModeSelect)
    return wrapper
  }

  private createAutoRotateSwitch(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;'

    const label = document.createElement('span')
    label.textContent = '自动旋转'
    label.style.color = '#94a3b8'
    wrapper.appendChild(label)

    this.autoRotateSwitch = document.createElement('button')
    this.autoRotateSwitch.dataset.enabled = 'true'
    this.updateAutoRotateSwitchStyle(true)

    this.autoRotateSwitch.addEventListener('click', () => {
      const enabled = this.autoRotateSwitch!.dataset.enabled !== 'true'
      this.autoRotateSwitch!.dataset.enabled = enabled.toString()
      this.updateAutoRotateSwitchStyle(enabled)
      this.callbacks.onAutoRotateToggle(enabled)
    })

    wrapper.appendChild(this.autoRotateSwitch)
    return wrapper
  }

  private updateAutoRotateSwitchStyle(enabled: boolean): void {
    if (!this.autoRotateSwitch) return

    if (enabled) {
      this.autoRotateSwitch.textContent = '开启'
      this.autoRotateSwitch.style.cssText = `
        padding: 6px 16px;
        border-radius: 6px;
        border: none;
        background: #10b981;
        color: white;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      `
    } else {
      this.autoRotateSwitch.textContent = '关闭'
      this.autoRotateSwitch.style.cssText = `
        padding: 6px 16px;
        border-radius: 6px;
        border: none;
        background: #475569;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      `
    }
  }

  private createResetButton(): HTMLElement {
    const btn = document.createElement('button')
    btn.textContent = '重置视角'
    btn.style.cssText = `
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: none;
      background: #3b82f6;
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#2563eb'
      btn.style.transform = 'translateY(-1px)'
    })

    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#3b82f6'
      btn.style.transform = 'translateY(0)'
    })

    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'translateY(0)'
      btn.style.background = '#1d4ed8'
    })

    btn.addEventListener('mouseup', () => {
      btn.style.background = '#2563eb'
    })

    btn.addEventListener('click', () => {
      this.callbacks.onResetView()
    })

    return btn
  }

  private addSliderStyles(slider: HTMLInputElement): void {
    const styleId = 'molecule-slider-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid #3b82f6;
          transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid #3b82f6;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #3b82f6 var(--progress, 20%), #1e293b var(--progress, 20%));
          border-radius: 3px;
        }
      `
      document.head.appendChild(style)
    }

    const updateProgress = () => {
      const min = parseFloat(slider.min)
      const max = parseFloat(slider.max)
      const value = parseFloat(slider.value)
      const progress = ((value - min) / (max - min)) * 100
      slider.style.setProperty('--progress', `${progress}%`)
    }

    updateProgress()
    slider.addEventListener('input', updateProgress)
  }

  public setRotationSpeed(speed: number): void {
    if (this.rotationSpeedSlider) {
      this.rotationSpeedSlider.value = speed.toString()
      if (this.speedValueLabel) {
        this.speedValueLabel.textContent = speed.toFixed(2)
      }
    }
  }

  public setDisplayMode(mode: DisplayMode): void {
    if (this.displayModeSelect) {
      this.displayModeSelect.value = mode
    }
  }

  public setAutoRotateEnabled(enabled: boolean): void {
    if (this.autoRotateSwitch) {
      this.autoRotateSwitch.dataset.enabled = enabled.toString()
      this.updateAutoRotateSwitchStyle(enabled)
    }
  }

  public dispose(): void {
    const panel = this.container.querySelector('.molecule-control-panel')
    if (panel) {
      panel.remove()
    }
  }
}
