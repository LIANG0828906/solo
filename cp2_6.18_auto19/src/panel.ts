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

const ANIMATION_DURATION = 300

export class Panel {
  private container: HTMLElement
  private eventBus: EventBus
  private controlPanel: HTMLElement
  private toggleBtn: HTMLElement
  private closeBtn: HTMLElement

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
  private sectionAnimations: Map<HTMLElement, Animation | null> = new Map()
  private panelVisible: boolean = true

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.container = container
    this.eventBus = eventBus

    this.controlPanel = document.getElementById('control-panel')!
    this.toggleBtn = document.getElementById('panel-toggle-btn')!
    this.closeBtn = document.getElementById('panel-close-btn')!

    for (const section of this.sections) {
      for (const slider of section.sliders) {
        this.values.set(slider.id, slider.defaultValue)
      }
    }

    this.render()
    this.bindPanelToggleEvents()
  }

  private bindPanelToggleEvents(): void {
    this.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.hidePanel()
    })

    this.toggleBtn.addEventListener('click', () => {
      this.showPanel()
    })
  }

  private hidePanel(): void {
    if (!this.panelVisible) return
    this.panelVisible = false

    this.controlPanel.classList.add('hidden')

    setTimeout(() => {
      this.toggleBtn.classList.add('visible')
    }, 100)
  }

  private showPanel(): void {
    if (this.panelVisible) return
    this.panelVisible = true

    this.toggleBtn.classList.remove('visible')

    setTimeout(() => {
      this.controlPanel.classList.remove('hidden')
    }, 50)
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

      const content = document.createElement('div')
      content.className = 'section-content'

      for (const sliderConfig of sectionConfig.sliders) {
        const item = this.createSlider(sliderConfig)
        content.appendChild(item)
      }

      if (sectionConfig.collapsed) {
        content.style.height = '0px'
        content.style.paddingTop = '0px'
        content.style.paddingBottom = '0px'
      }

      header.addEventListener('click', (e) => {
        e.preventDefault()
        this.toggleSection(header, content)
      })

      section.appendChild(header)
      section.appendChild(content)
      this.container.appendChild(section)
      this.sectionAnimations.set(content, null)
    }
  }

  private toggleSection(header: HTMLElement, content: HTMLElement): void {
    const isCollapsed = header.classList.contains('collapsed')
    const currentAnimation = this.sectionAnimations.get(content)

    if (currentAnimation) {
      currentAnimation.cancel()
    }

    if (isCollapsed) {
      header.classList.remove('collapsed')
      this.animateContent(content, true)
    } else {
      header.classList.add('collapsed')
      this.animateContent(content, false)
    }
  }

  private animateContent(content: HTMLElement, expand: boolean): void {
    const computedStyle = getComputedStyle(content)
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0

    content.style.overflow = 'hidden'

    if (expand) {
      const currentHeight = content.getBoundingClientRect().height

      content.style.height = 'auto'
      content.style.paddingTop = ''
      content.style.paddingBottom = ''
      const targetHeight = content.getBoundingClientRect().height

      const keyframes: Keyframe[] = [
        {
          height: `${currentHeight}px`,
          paddingTop: '0px',
          paddingBottom: '0px'
        },
        {
          height: `${targetHeight}px`,
          paddingTop: `${paddingTop}px`,
          paddingBottom: `${paddingBottom}px`
        }
      ]

      const animation = content.animate(keyframes, {
        duration: ANIMATION_DURATION,
        easing: 'ease',
        fill: 'forwards'
      })

      animation.onfinish = () => {
        content.style.height = 'auto'
        content.style.paddingTop = ''
        content.style.paddingBottom = ''
        content.style.overflow = ''
        this.sectionAnimations.set(content, null)
      }

      this.sectionAnimations.set(content, animation)
    } else {
      const currentHeight = content.getBoundingClientRect().height
      const currentPaddingTop = parseFloat(computedStyle.paddingTop) || 0
      const currentPaddingBottom = parseFloat(computedStyle.paddingBottom) || 0

      const keyframes: Keyframe[] = [
        {
          height: `${currentHeight}px`,
          paddingTop: `${currentPaddingTop}px`,
          paddingBottom: `${currentPaddingBottom}px`
        },
        {
          height: '0px',
          paddingTop: '0px',
          paddingBottom: '0px'
        }
      ]

      const animation = content.animate(keyframes, {
        duration: ANIMATION_DURATION,
        easing: 'ease',
        fill: 'forwards'
      })

      animation.onfinish = () => {
        content.style.height = '0px'
        content.style.paddingTop = '0px'
        content.style.paddingBottom = '0px'
        content.style.overflow = 'hidden'
        this.sectionAnimations.set(content, null)
      }

      this.sectionAnimations.set(content, animation)
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
