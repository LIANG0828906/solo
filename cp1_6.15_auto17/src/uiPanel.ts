import type { Atom } from './moleculeScene'

const ELEMENT_NAMES: Record<string, string> = {
  C: '碳',
  O: '氧',
  H: '氢',
  N: '氮',
  S: '硫',
  P: '磷',
  F: '氟',
  Cl: '氯',
  Br: '溴',
  I: '碘'
}

const ELEMENT_COLORS: Record<string, string> = {
  C: '#808080',
  O: '#ff0000',
  H: '#ffffff',
  N: '#3050f8',
  S: '#ffff30',
  P: '#ff8000',
  F: '#90e050',
  Cl: '#1ff01f',
  Br: '#a62929',
  I: '#940094'
}

export class UIPanel {
  private sidePanel: HTMLElement
  private panelToggle: HTMLElement
  private searchInput: HTMLInputElement
  private modelButtons: HTMLElement
  private autoRotateSwitch: HTMLElement
  private atomDetail: HTMLElement
  private hoverTooltip: HTMLElement
  private fpsCounter: HTMLElement

  private isCollapsed = false
  private isAutoRotate = false
  private currentModel: 'ball-stick' | 'space-filling' = 'ball-stick'

  onSearch: ((query: string) => void) | null = null
  onModelChange: ((model: 'ball-stick' | 'space-filling') => void) | null = null
  onAutoRotateChange: ((enabled: boolean) => void) | null = null

  constructor() {
    this.sidePanel = document.getElementById('side-panel') as HTMLElement
    this.panelToggle = document.getElementById('panel-toggle') as HTMLElement
    this.searchInput = document.getElementById('search-input') as HTMLInputElement
    this.modelButtons = document.getElementById('model-buttons') as HTMLElement
    this.autoRotateSwitch = document.getElementById('auto-rotate-switch') as HTMLElement
    this.atomDetail = document.getElementById('atom-detail') as HTMLElement
    this.hoverTooltip = document.getElementById('hover-tooltip') as HTMLElement
    this.fpsCounter = document.getElementById('fps-counter') as HTMLElement

    this.bindEvents()
  }

  private bindEvents(): void {
    this.panelToggle.addEventListener('click', () => {
      this.togglePanel()
    })

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (this.onSearch) {
          this.onSearch(this.searchInput.value)
        }
      }
    })

    this.modelButtons.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const model = (btn as HTMLElement).dataset.model as 'ball-stick' | 'space-filling'
        if (model && model !== this.currentModel) {
          this.setModel(model)
          if (this.onModelChange) {
            this.onModelChange(model)
          }
        }
      })
    })

    this.autoRotateSwitch.addEventListener('click', () => {
      this.setAutoRotate(!this.isAutoRotate)
      if (this.onAutoRotateChange) {
        this.onAutoRotateChange(!this.isAutoRotate)
      }
    })
  }

  private togglePanel(): void {
    this.isCollapsed = !this.isCollapsed
    if (this.isCollapsed) {
      this.sidePanel.classList.add('collapsed')
      this.panelToggle.classList.add('collapsed')
      this.panelToggle.textContent = '▶'
    } else {
      this.sidePanel.classList.remove('collapsed')
      this.panelToggle.classList.remove('collapsed')
      this.panelToggle.textContent = '◀'
    }
  }

  setModel(model: 'ball-stick' | 'space-filling'): void {
    this.currentModel = model
    this.modelButtons.querySelectorAll('.btn').forEach((btn) => {
      const btnModel = (btn as HTMLElement).dataset.model
      if (btnModel === model) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })
  }

  setAutoRotate(enabled: boolean): void {
    this.isAutoRotate = enabled
    if (enabled) {
      this.autoRotateSwitch.classList.add('active')
    } else {
      this.autoRotateSwitch.classList.remove('active')
    }
  }

  updateAtomDetail(atom: Atom | null): void {
    if (!atom) {
      this.atomDetail.innerHTML = '<div class="atom-detail-empty">点击原子查看详情</div>'
      return
    }

    const color = ELEMENT_COLORS[atom.element] ?? '#cccccc'
    const name = ELEMENT_NAMES[atom.element] ?? atom.element

    this.atomDetail.innerHTML = `
      <div class="detail-header">
        <div class="atom-sphere" style="background:${color};color:${color}"></div>
        <div>
          <div class="detail-name">${name} (${atom.element})</div>
          <div class="detail-id">原子编号 #${atom.id}</div>
        </div>
      </div>
      <div class="detail-row">
        <span class="detail-key">X 坐标</span>
        <span class="detail-value">${atom.x.toFixed(4)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">Y 坐标</span>
        <span class="detail-value">${atom.y.toFixed(4)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">Z 坐标</span>
        <span class="detail-value">${atom.z.toFixed(4)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-key">元素符号</span>
        <span class="detail-value">${atom.element}</span>
      </div>
    `
  }

  showHoverTooltip(atom: Atom | null, screenX: number, screenY: number): void {
    if (!atom) {
      this.hoverTooltip.classList.remove('visible')
      return
    }

    const name = ELEMENT_NAMES[atom.element] ?? atom.element
    this.hoverTooltip.innerHTML = `
      <div class="tooltip-row">
        <span class="tooltip-key">元素</span>
        <span class="tooltip-value">${name} (${atom.element})</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-key">编号</span>
        <span class="tooltip-value">#${atom.id}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-key">坐标</span>
        <span class="tooltip-value">${atom.x.toFixed(2)}, ${atom.y.toFixed(2)}, ${atom.z.toFixed(2)}</span>
      </div>
    `

    const tooltipWidth = 180
    const tooltipHeight = 80
    const padding = 16
    let left = screenX + padding
    let top = screenY + padding

    if (left + tooltipWidth > window.innerWidth) {
      left = screenX - tooltipWidth - padding
    }
    if (top + tooltipHeight > window.innerHeight) {
      top = screenY - tooltipHeight - padding
    }

    this.hoverTooltip.style.left = `${left}px`
    this.hoverTooltip.style.top = `${top}px`
    this.hoverTooltip.classList.add('visible')
  }

  updateFPS(fps: number): void {
    this.fpsCounter.textContent = `FPS: ${fps.toFixed(0)}`
    if (fps >= 55) {
      this.fpsCounter.style.color = 'rgba(0, 255, 150, 0.8)'
    } else if (fps >= 30) {
      this.fpsCounter.style.color = 'rgba(255, 200, 0, 0.8)'
    } else {
      this.fpsCounter.style.color = 'rgba(255, 80, 80, 0.8)'
    }
  }
}
