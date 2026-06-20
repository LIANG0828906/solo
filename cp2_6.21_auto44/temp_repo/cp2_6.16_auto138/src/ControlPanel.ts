import { useNebulaStore, colorThemes } from './store'

export class ControlPanel {
  private container: HTMLElement
  private unsubscribe: (() => void) | null = null
  
  constructor(containerId: string) {
    const element = document.getElementById(containerId)
    if (!element) {
      throw new Error(`Container ${containerId} not found`)
    }
    this.container = element
    this.createPanel()
  }
  
  private createPanel(): void {
    const state = useNebulaStore.getState()
    
    this.container.innerHTML = ''
    
    const title = document.createElement('h1')
    title.className = 'panel-title'
    title.textContent = 'AURELIA NEBULA'
    this.container.appendChild(title)
    
    this.createSliderControl(
      'particle-count',
      'Particle Count',
      state.particleCount,
      500,
      5000,
      100,
      state.particleCount,
      (value) => {
        useNebulaStore.getState().setParticleCount(value)
      }
    )
    
    this.createSliderControl(
      'color-speed',
      'Color Speed',
      state.colorSpeed,
      0.1,
      2.0,
      0.1,
      state.colorSpeed,
      (value) => {
        useNebulaStore.getState().setColorSpeed(value)
      }
    )
    
    this.createSliderControl(
      'particle-size',
      'Particle Size',
      state.particleSize,
      0.5,
      5,
      0.1,
      state.particleSize,
      (value) => {
        useNebulaStore.getState().setParticleSize(value)
      }
    )
    
    this.createThemeSelector()
    
    const resetBtn = document.createElement('button')
    resetBtn.className = 'reset-btn'
    resetBtn.textContent = 'Reset'
    resetBtn.addEventListener('click', () => {
      useNebulaStore.getState().reset()
      this.updateAllControls()
    })
    this.container.appendChild(resetBtn)
  }
  
  private createSliderControl(
    id: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    initialValue: number,
    onChange: (value: number) => void
  ): void {
    const group = document.createElement('div')
    group.className = 'control-group'
    group.id = `group-${id}`
    
    const labelDiv = document.createElement('div')
    labelDiv.className = 'control-label'
    
    const labelText = document.createElement('span')
    labelText.textContent = label
    
    const valueSpan = document.createElement('span')
    valueSpan.className = 'control-value'
    valueSpan.id = `value-${id}`
    valueSpan.textContent = this.formatValue(value, step)
    
    labelDiv.appendChild(labelText)
    labelDiv.appendChild(valueSpan)
    
    const sliderContainer = document.createElement('div')
    sliderContainer.className = 'slider-container'
    
    const track = document.createElement('div')
    track.className = 'slider-track'
    
    const fill = document.createElement('div')
    fill.className = 'slider-fill'
    fill.id = `fill-${id}`
    
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.id = id
    slider.min = min.toString()
    slider.max = max.toString()
    slider.step = step.toString()
    slider.value = initialValue.toString()
    
    const updateFill = (val: number) => {
      const percentage = ((val - min) / (max - min)) * 100
      fill.style.width = `${percentage}%`
      valueSpan.textContent = this.formatValue(val, step)
    }
    
    updateFill(initialValue)
    
    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value)
      updateFill(val)
      onChange(val)
    })
    
    sliderContainer.appendChild(track)
    sliderContainer.appendChild(fill)
    sliderContainer.appendChild(slider)
    
    group.appendChild(labelDiv)
    group.appendChild(sliderContainer)
    
    this.container.appendChild(group)
  }
  
  private createThemeSelector(): void {
    const section = document.createElement('div')
    section.className = 'theme-section'
    
    const label = document.createElement('div')
    label.className = 'control-label'
    label.textContent = 'Color Theme'
    section.appendChild(label)
    
    const grid = document.createElement('div')
    grid.className = 'theme-grid'
    
    colorThemes.forEach((theme, index) => {
      const item = document.createElement('div')
      item.className = 'theme-item'
      if (index === useNebulaStore.getState().colorThemeIndex) {
        item.classList.add('active')
      }
      
      const gradientColors = theme.colors.map(c => `#${c.toString(16).padStart(6, '0')}`).join(', ')
      item.style.background = `linear-gradient(135deg, ${gradientColors})`
      
      const nameSpan = document.createElement('span')
      nameSpan.textContent = theme.name
      item.appendChild(nameSpan)
      
      item.addEventListener('click', () => {
        useNebulaStore.getState().setColorTheme(index)
        this.updateThemeSelection(index)
      })
      
      grid.appendChild(item)
    })
    
    section.appendChild(grid)
    this.container.appendChild(section)
  }
  
  private updateThemeSelection(activeIndex: number): void {
    const items = this.container.querySelectorAll('.theme-item')
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })
  }
  
  private updateAllControls(): void {
    const state = useNebulaStore.getState()
    
    this.updateSlider('particle-count', state.particleCount, 500, 5000, 100)
    this.updateSlider('color-speed', state.colorSpeed, 0.1, 2.0, 0.1)
    this.updateSlider('particle-size', state.particleSize, 0.5, 5, 0.1)
    
    this.updateThemeSelection(state.colorThemeIndex)
  }
  
  private updateSlider(id: string, value: number, min: number, max: number, step: number): void {
    const slider = document.getElementById(id) as HTMLInputElement
    const fill = document.getElementById(`fill-${id}`)
    const valueSpan = document.getElementById(`value-${id}`)
    
    if (slider) slider.value = value.toString()
    if (fill) {
      const percentage = ((value - min) / (max - min)) * 100
      fill.style.width = `${percentage}%`
    }
    if (valueSpan) {
      valueSpan.textContent = this.formatValue(value, step)
    }
  }
  
  private formatValue(value: number, step: number): string {
    if (step >= 1) {
      return Math.round(value).toString()
    }
    return value.toFixed(1)
  }
  
  public subscribeToStore(): void {
    this.unsubscribe = useNebulaStore.subscribe((state) => {
      this.updateSlider('particle-count', state.particleCount, 500, 5000, 100)
      this.updateSlider('color-speed', state.colorSpeed, 0.1, 2.0, 0.1)
      this.updateSlider('particle-size', state.particleSize, 0.5, 5, 0.1)
      this.updateThemeSelection(state.colorThemeIndex)
    })
  }
  
  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}
