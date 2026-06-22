export interface ControlPanelCallbacks {
  onTurbulenceChange: (value: number) => void
  onLifetimeChange: (value: number) => void
  onForceChange: (x: number, y: number, z: number) => void
  onReset: () => void
}

export class ControlPanel {
  private container: HTMLDivElement
  private turbulenceSlider: HTMLInputElement
  private lifetimeSlider: HTMLInputElement
  private forceXInput: HTMLInputElement
  private forceYInput: HTMLInputElement
  private forceZInput: HTMLInputElement
  private resetButton: HTMLButtonElement
  private callbacks: ControlPanelCallbacks

  private readonly PANEL_WIDTH = '280px'
  private readonly PANEL_BG = '#1A1A2ECC'
  private readonly TRACK_COLOR = '#4A4A6A'
  private readonly THUMB_COLOR = '#7C7CFF'
  private readonly THUMB_HOVER = '#9A9AFF'

  constructor(callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks

    this.container = document.createElement('div')
    this.turbulenceSlider = document.createElement('input')
    this.lifetimeSlider = document.createElement('input')
    this.forceXInput = document.createElement('input')
    this.forceYInput = document.createElement('input')
    this.forceZInput = document.createElement('input')
    this.resetButton = document.createElement('button')

    this.injectStyles()
    this.createPanel()
  }

  private injectStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      .control-panel {
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: ${this.PANEL_WIDTH};
        background: ${this.PANEL_BG};
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 20px;
        box-sizing: border-box;
        z-index: 100;
        opacity: 0;
        animation: panelFadeIn 0.5s ease forwards;
        animation-delay: 0.2s;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      @keyframes panelFadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .control-group {
        margin-bottom: 18px;
      }

      .control-group:last-child {
        margin-bottom: 0;
      }

      .control-label {
        display: block;
        color: #E0E0E0;
        font-size: 13px;
        margin-bottom: 8px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }

      .control-value {
        float: right;
        color: ${this.THUMB_COLOR};
        font-family: monospace;
      }

      .slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: ${this.TRACK_COLOR};
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: ${this.THUMB_COLOR};
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
        box-shadow: 0 2px 8px rgba(124, 124, 255, 0.4);
      }

      .slider::-webkit-slider-thumb:hover {
        background: ${this.THUMB_HOVER};
        transform: scale(1.15);
      }

      .slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: ${this.THUMB_COLOR};
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: background 0.2s ease, transform 0.2s ease;
        box-shadow: 0 2px 8px rgba(124, 124, 255, 0.4);
      }

      .slider::-moz-range-thumb:hover {
        background: ${this.THUMB_HOVER};
        transform: scale(1.15);
      }

      .vector-inputs {
        display: flex;
        gap: 8px;
      }

      .vector-input-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .vector-axis-label {
        color: #888;
        font-size: 11px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .vector-input {
        width: 100%;
        height: 32px;
        background: ${this.TRACK_COLOR};
        border: none;
        border-radius: 6px;
        color: #E0E0E0;
        text-align: center;
        font-size: 12px;
        font-family: monospace;
        outline: none;
        transition: border 0.2s ease, box-shadow 0.2s ease;
      }

      .vector-input:focus {
        border: 1px solid ${this.THUMB_COLOR};
        box-shadow: 0 0 0 2px rgba(124, 124, 255, 0.2);
      }

      .vector-input::-webkit-inner-spin-button,
      .vector-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .vector-input[type=number] {
        -moz-appearance: textfield;
      }

      .reset-btn {
        width: 100%;
        height: 38px;
        background: linear-gradient(135deg, ${this.THUMB_COLOR} 0%, #5C5CE0 100%);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 4px 12px rgba(124, 124, 255, 0.3);
      }

      .reset-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(124, 124, 255, 0.5);
      }

      .reset-btn:active {
        transform: translateY(0);
      }

      .panel-title {
        color: #FFFFFF;
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .panel-title-icon {
        width: 8px;
        height: 8px;
        background: ${this.THUMB_COLOR};
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.2); }
      }
    `
    document.head.appendChild(style)
  }

  private createPanel(): void {
    this.container.className = 'control-panel'

    const title = document.createElement('div')
    title.className = 'panel-title'
    const icon = document.createElement('div')
    icon.className = 'panel-title-icon'
    title.appendChild(icon)
    title.appendChild(document.createTextNode('粒子系统控制'))
    this.container.appendChild(title)

    this.createSliderGroup(
      '湍流强度',
      0.1,
      5.0,
      1.0,
      0.1,
      this.turbulenceSlider,
      (value) => this.callbacks.onTurbulenceChange(value)
    )

    this.createSliderGroup(
      '粒子寿命',
      2,
      10,
      5,
      0.5,
      this.lifetimeSlider,
      (value) => this.callbacks.onLifetimeChange(value)
    )

    this.createVector3Group()

    this.createResetButton()
  }

  private createSliderGroup(
    label: string,
    min: number,
    max: number,
    defaultValue: number,
    step: number,
    slider: HTMLInputElement,
    onChange: (value: number) => void
  ): void {
    const group = document.createElement('div')
    group.className = 'control-group'

    const labelEl = document.createElement('label')
    labelEl.className = 'control-label'
    labelEl.textContent = label

    const valueEl = document.createElement('span')
    valueEl.className = 'control-value'
    valueEl.textContent = defaultValue.toFixed(1)

    labelEl.appendChild(valueEl)
    group.appendChild(labelEl)

    slider.type = 'range'
    slider.min = min.toString()
    slider.max = max.toString()
    slider.step = step.toString()
    slider.value = defaultValue.toString()
    slider.className = 'slider'

    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value)
      valueEl.textContent = value.toFixed(1)
      onChange(value)
    })

    group.appendChild(slider)
    this.container.appendChild(group)
  }

  private createVector3Group(): void {
    const group = document.createElement('div')
    group.className = 'control-group'

    const label = document.createElement('label')
    label.className = 'control-label'
    label.textContent = '力场方向'
    group.appendChild(label)

    const inputsWrapper = document.createElement('div')
    inputsWrapper.className = 'vector-inputs'

    this.createVectorInput('X', 0, this.forceXInput, inputsWrapper)
    this.createVectorInput('Y', 1, this.forceYInput, inputsWrapper)
    this.createVectorInput('Z', 0, this.forceZInput, inputsWrapper)

    group.appendChild(inputsWrapper)
    this.container.appendChild(group)
  }

  private createVectorInput(
    axis: string,
    defaultValue: number,
    input: HTMLInputElement,
    parent: HTMLElement
  ): void {
    const wrapper = document.createElement('div')
    wrapper.className = 'vector-input-wrapper'

    const axisLabel = document.createElement('span')
    axisLabel.className = 'vector-axis-label'
    axisLabel.textContent = axis

    input.type = 'number'
    input.min = '-10'
    input.max = '10'
    input.step = '0.5'
    input.value = defaultValue.toString()
    input.className = 'vector-input'

    input.addEventListener('input', () => {
      let value = parseFloat(input.value)
      if (isNaN(value)) value = 0
      value = Math.max(-10, Math.min(10, value))
      input.value = value.toString()
      this.notifyForceChange()
    })

    input.addEventListener('blur', () => {
      let value = parseFloat(input.value)
      if (isNaN(value)) value = 0
      value = Math.max(-10, Math.min(10, value))
      input.value = value.toString()
      this.notifyForceChange()
    })

    wrapper.appendChild(axisLabel)
    wrapper.appendChild(input)
    parent.appendChild(wrapper)
  }

  private notifyForceChange(): void {
    const x = parseFloat(this.forceXInput.value) || 0
    const y = parseFloat(this.forceYInput.value) || 0
    const z = parseFloat(this.forceZInput.value) || 0
    this.callbacks.onForceChange(x, y, z)
  }

  private createResetButton(): void {
    const group = document.createElement('div')
    group.className = 'control-group'

    this.resetButton.type = 'button'
    this.resetButton.className = 'reset-btn'
    this.resetButton.textContent = '重置系统'

    this.resetButton.addEventListener('click', () => {
      this.turbulenceSlider.value = '1.0'
      this.lifetimeSlider.value = '5'
      this.forceXInput.value = '0'
      this.forceYInput.value = '1'
      this.forceZInput.value = '0'

      const turbulenceValue = this.turbulenceSlider.parentElement?.querySelector('.control-value')
      if (turbulenceValue) turbulenceValue.textContent = '1.0'
      const lifetimeValue = this.lifetimeSlider.parentElement?.querySelector('.control-value')
      if (lifetimeValue) lifetimeValue.textContent = '5.0'

      this.callbacks.onTurbulenceChange(1.0)
      this.callbacks.onLifetimeChange(5)
      this.callbacks.onForceChange(0, 1, 0)
      this.callbacks.onReset()
    })

    group.appendChild(this.resetButton)
    this.container.appendChild(group)
  }

  public mount(): void {
    document.body.appendChild(this.container)
  }

  public unmount(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
  }
}
