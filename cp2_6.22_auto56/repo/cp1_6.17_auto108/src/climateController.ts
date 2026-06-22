import mitt from 'mitt'
import type { ClimateParams, AppEvents } from './particleSystem'
import { CLIMATE_PRESETS } from './particleSystem'

interface ClimateButton {
  key: string
  label: string
  bg: string
  params: ClimateParams
}

const BUTTONS: ClimateButton[] = [
  { key: 'sunny', label: '晴', bg: '#FFD700', params: CLIMATE_PRESETS.sunny },
  { key: 'rain', label: '雨', bg: '#4A90D9', params: CLIMATE_PRESETS.rain },
  { key: 'snow', label: '雪', bg: '#B0E0E6', params: CLIMATE_PRESETS.snow },
  { key: 'fog', label: '雾', bg: '#D3D3D3', params: CLIMATE_PRESETS.fog }
]

export class ClimateController {
  private emitter: ReturnType<typeof mitt<AppEvents>>
  private activeKey: string = 'sunny'
  private buttonElements: Map<string, HTMLButtonElement> = new Map()
  private panelEl: HTMLElement | null = null

  constructor(container: HTMLElement) {
    this.emitter = mitt<AppEvents>()
    this.panelEl = this.createPanel(container)
    this.setActive('sunny')
  }

  getEmitter(): ReturnType<typeof mitt<AppEvents>> {
    return this.emitter
  }

  private createPanel(container: HTMLElement): HTMLElement {
    const panel = document.createElement('div')
    panel.style.cssText = `
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      gap: 8px;
      z-index: 10;
    `

    for (const btn of BUTTONS) {
      const el = document.createElement('button')
      el.textContent = btn.label
      el.style.cssText = `
        width: 64px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: #34495E;
        color: #FFFFFF;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.15s;
        outline: none;
        user-select: none;
      `

      el.addEventListener('mouseenter', () => {
        if (this.activeKey !== btn.key) {
          el.style.background = '#3D566E'
        }
      })
      el.addEventListener('mouseleave', () => {
        if (this.activeKey !== btn.key) {
          el.style.background = '#34495E'
        }
      })

      el.addEventListener('click', () => {
        this.setActive(btn.key)
        this.animateClick(el)
        this.emitter.emit('climate-change', { ...btn.params })
      })

      this.buttonElements.set(btn.key, el)
      panel.appendChild(el)
    }

    container.appendChild(panel)
    return panel
  }

  private setActive(key: string): void {
    this.activeKey = key
    for (const [k, el] of this.buttonElements) {
      const btnDef = BUTTONS.find(b => b.key === k)!
      if (k === key) {
        el.style.background = btnDef.bg
        el.style.color = this.getContrastColor(btnDef.bg)
      } else {
        el.style.background = '#34495E'
        el.style.color = '#FFFFFF'
      }
    }
  }

  private animateClick(el: HTMLButtonElement): void {
    el.style.transition = 'transform 0.15s ease'
    el.style.transform = 'scale(1.1)'
    setTimeout(() => {
      el.style.transform = 'scale(1)'
    }, 150)
  }

  private getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.6 ? '#1E2A38' : '#FFFFFF'
  }
}
