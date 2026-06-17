import EventBus from './eventBus'

interface SliderConfig {
  id: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
  event: string
  eventKey: string
}

interface SectionConfig {
  title: string
  collapsed?: boolean
  sliders: SliderConfig[]
}

export class Panel {
  private container: HTMLElement
  private eventBus: EventBus
  private sections: SectionConfig[] = [
    {
      title: '场景设置',
      sliders: [
        {
          id: 'particleCount',
          label: '粒子数量',
          min: 500,
          max: 5000,
          step: 100,
          defaultValue: 3000,
          unit: '个',
          event: 'params:scene',
          eventKey: 'particleCount'
        },
        {
          id: 'trailLength',
          label: '尾迹长度',
          min: 0,
          max: 8,
          step: 1,
          defaultValue: 3,
          unit: '帧',
          event: 'params:scene',
          eventKey: 'trailLength'
        }
      ]
    },
    {
      title: '风场设置',
      sliders: [
        {
          id: 'windStrength',
          label: '风场强度缩放',
          min: 0.5,
          max: 2.0,
          step: 0.1,
          defaultValue: 1.0,
          unit: 'x',
          event: 'params:wind',
          eventKey: 'windStrength'
        },
        {
          id: 'vortexStrength',
          label: '涡流扰动强度',
          min: 0,
          max: 100,
          step: 1,
          defaultValue: 30,
          unit: '%',
          event: 'params:wind',
          eventKey: 'vortexStrength'
        }
      ]
    }
  ]

  private values: Map<string, number> = new Map()

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.container = container
    this.eventBus = eventBus

    for (const section of this.sections) {
      for (const slider of section.sliders) {
        this.values.set(slider.id, slider.defaultValue)
      }
    }

    this.render()
  }

  private render(): void {
    this.container.innerHTML = ''

    for (const sectionConfig of this.sections) {
      const section = document.createElement('div')
      section.className = 'panel-section'

      const header = document.createElement('div')
      header.className = 'section-header'
      if (sectionConfig.collapsed) {
        header.classList.add('collapsed')
      }

      const title = document.createElement('span')
      title.className = 'section-title'
      title.textContent = sectionConfig.title

      const arrow = document.createElement('div')
      arrow.className = 'section-arrow'

      header.appendChild(title)
      header.appendChild(arrow)

      header.addEventListener('click', () => {
        header.classList.toggle('collapsed')
      })

      const content = document.createElement('div')
      content.className = 'section-content'

      for (const sliderConfig of sectionConfig.sliders) {
        const item = this.createSlider(sliderConfig)
        content.appendChild(item)
      }

      section.appendChild(header)
      section.appendChild(content)
      this.container.appendChild(section)
    }
  }

  private createSlider(config: SliderConfig): HTMLElement {
    const item = document.createElement('div')
    item.className = 'control-item'

    const label = document.createElement('div')
    label.className = 'control-label'

    const labelText = document.createElement('span')
    labelText.textContent = config.label

    const valueSpan = document.createElement('span')
    valueSpan.className = 'control-value'
    valueSpan.id = `value-${config.id}`
    const currentValue = this.values.get(config.id) ?? config.defaultValue
    valueSpan.textContent = this.formatValue(currentValue, config)

    label.appendChild(labelText)
    label.appendChild(valueSpan)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.className = 'control-slider'
    slider.id = `slider-${config.id}`
    slider.min = String(config.min)
    slider.max = String(config.max)
    slider.step = String(config.step)
    slider.value = String(currentValue)

    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.values.set(config.id, value)
      valueSpan.textContent = this.formatValue(value, config)

      const eventData: Record<string, number> = {}
      eventData[config.eventKey] = value
      this.eventBus.emit(config.event, eventData)
    })

    item.appendChild(label)
    item.appendChild(slider)

    return item
  }

  private formatValue(value: number, config: SliderConfig): string {
    if (config.step >= 1) {
      return `${Math.round(value)}${config.unit || ''}`
    } else {
      return `${value.toFixed(1)}${config.unit || ''}`
    }
  }
}
