import type { Block, OperationLog, BlockType } from './CubeController'

interface GlobalConfig {
  MAX_BLOCKS: number
  colors: {
    iceBlue: string
    pinkCrystal: string
    background: string
  }
}

interface UIManagerCallbacks {
  onBlockTypeChange: (type: BlockType) => void
  onFlowIntensityChange: (value: number) => void
  onResetCamera: () => void
  onToggleFullscreen: () => void
  onBlockPlaced: (log: OperationLog) => void
  onBlockClicked: (block: Block) => void
}

const TYPE_NAMES: Record<BlockType, string> = {
  cube: '立方体',
  sphere: '球体',
  tetrahedron: '四面体'
}

export class UIManager {
  private _config: GlobalConfig
  private callbacks: UIManagerCallbacks
  private logs: OperationLog[] = []
  private maxLogs: number = 6

  constructor(config: GlobalConfig, callbacks: UIManagerCallbacks) {
    this._config = config
    this.callbacks = callbacks
    this.bindEvents()
  }

  private bindEvents() {
    const blockButtons = document.querySelectorAll('.block-btn')
    blockButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement
        const type = target.dataset.type as BlockType
        
        blockButtons.forEach(b => b.classList.remove('active'))
        target.classList.add('active')
        
        this.animateButtonClick(target)
        this.callbacks.onBlockTypeChange(type)
      })
    })

    const flowSlider = document.getElementById('flow-slider') as HTMLInputElement
    const flowValue = document.getElementById('flow-value') as HTMLElement
    
    if (flowSlider && flowValue) {
      flowSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value)
        flowValue.textContent = `${value}%`
        this.callbacks.onFlowIntensityChange(value)
      })
    }

    const resetBtn = document.getElementById('reset-camera')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.animateButtonClick(resetBtn)
        this.callbacks.onResetCamera()
      })
    }

    const fullscreenBtn = document.getElementById('toggle-fullscreen')
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.animateButtonClick(fullscreenBtn)
        this.callbacks.onToggleFullscreen()
      })
    }
  }

  private animateButtonClick(element: Element) {
    element.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.92)' },
        { transform: 'scale(1)' }
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    )
  }

  handleBlockPlaced(log: OperationLog) {
    this.callbacks.onBlockPlaced(log)
  }

  handleBlockClick(block: Block) {
    this.callbacks.onBlockClicked(block)
  }

  addLog(log: OperationLog) {
    this.logs.unshift(log)
    
    const maxLogs = Math.min(this.maxLogs, this._config.MAX_BLOCKS > 0 ? 6 : 0)
    if (this.logs.length > maxLogs) {
      this.logs.pop()
    }

    this.renderLogs()
  }

  private renderLogs() {
    const logList = document.getElementById('log-list')
    if (!logList) return

    if (this.logs.length === 0) {
      logList.innerHTML = `
        <div class="log-item" style="border-left-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.3); text-align: center;">
          暂无操作记录
        </div>
      `
      return
    }

    logList.innerHTML = this.logs.map((log, index) => {
      const typeName = TYPE_NAMES[log.type]
      const posStr = `(${log.position.x.toFixed(1)}, ${log.position.y.toFixed(1)}, ${log.position.z.toFixed(1)})`
      const isLatest = index === 0
      
      return `
        <div class="log-item ${isLatest ? 'latest' : ''}">
          <span class="log-type">${typeName}</span>
          <span style="color: rgba(255,255,255,0.4);"> · </span>
          <span class="log-pos">${posStr}</span>
          <span style="color: rgba(255,255,255,0.4);"> · </span>
          <span class="log-flow">光流${log.flowIntensity}%</span>
        </div>
      `
    }).join('')
  }

  showToast(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: rgba(20, 20, 50, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 8px;
      border: 1px solid ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00bfff'};
      color: #fff;
      font-size: 14px;
      z-index: 1000;
      animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards;
      pointer-events: none;
    `
    toast.textContent = message

    const style = document.createElement('style')
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
      style.remove()
    }, 3000)
  }
}
