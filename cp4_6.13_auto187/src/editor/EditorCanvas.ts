import type { AnchorPoint } from '@/store/useEditorStore'

const ANCHOR_RADIUS = 6
const GRID_SPACING = 20
const GRID_COLOR = '#ddd'
const CANVAS_BG = '#f0f0f0'
const FILL_COLOR = '#6366f1'
const ANCHOR_STROKE = '#6366f1'
const ANCHOR_FILL_SELECTED = '#6366f1'
const BREATHE_DURATION = 2000
const EASE_DURATION = 100

export interface EditorCanvasOptions {
  canvas: HTMLCanvasElement
  getAnchors: () => AnchorPoint[]
  getSelectedId: () => string | null
  getShowGrid: () => boolean
  getCanvasWidth: () => number
  getCanvasHeight: () => number
  onAddAnchor: (x: number, y: number) => string
  onUpdateAnchor: (id: string, x: number, y: number) => void
  onSelectAnchor: (id: string | null) => void
  onEditAnchor: (id: string, x: number, y: number) => void
}

export class EditorCanvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private opts: EditorCanvasOptions
  private animationId: number | null = null
  private startTime: number = 0
  private draggingId: string | null = null
  private dragOffsetX: number = 0
  private dragOffsetY: number = 0
  private lastClickTime: number = 0
  private lastClickAnchor: string | null = null
  private easeTargetX: number = 0
  private easeTargetY: number = 0
  private easeCurrentX: number = 0
  private easeCurrentY: number = 0
  private isEasing: boolean = false
  private editingBubble: HTMLElement | null = null
  private dpr: number = 1

  constructor(options: EditorCanvasOptions) {
    this.canvas = options.canvas
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.ctx = ctx
    this.opts = options
    this.dpr = window.devicePixelRatio || 1
    this.setupCanvas()
    this.bindEvents()
    this.startAnimation()
  }

  private setupCanvas() {
    const width = this.opts.getCanvasWidth()
    const height = this.opts.getCanvasHeight()
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.ctx.scale(this.dpr, this.dpr)
  }

  public resize(width: number, height: number) {
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.scale(this.dpr, this.dpr)
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('mouseleave', this.handleMouseUp)
    this.canvas.addEventListener('dblclick', this.handleDoubleClick)
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.opts.getCanvasWidth() / rect.width
    const scaleY = this.opts.getCanvasHeight() / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  private hitTestAnchor(x: number, y: number): AnchorPoint | null {
    const anchors = this.opts.getAnchors()
    for (let i = anchors.length - 1; i >= 0; i--) {
      const anchor = anchors[i]
      const dx = x - anchor.x
      const dy = y - anchor.y
      if (dx * dx + dy * dy <= (ANCHOR_RADIUS + 4) * (ANCHOR_RADIUS + 4)) {
        return anchor
      }
    }
    return null
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    const pos = this.getMousePos(e)
    const anchor = this.hitTestAnchor(pos.x, pos.y)

    const now = Date.now()
    if (anchor && now - this.lastClickTime < 300 && this.lastClickAnchor === anchor.id) {
      this.lastClickTime = 0
      this.lastClickAnchor = null
      return
    }
    this.lastClickTime = now
    this.lastClickAnchor = anchor ? anchor.id : null

    if (anchor) {
      this.draggingId = anchor.id
      this.dragOffsetX = pos.x - anchor.x
      this.dragOffsetY = pos.y - anchor.y
      this.opts.onSelectAnchor(anchor.id)
      this.isEasing = true
      this.easeTargetX = pos.x - this.dragOffsetX
      this.easeTargetY = pos.y - this.dragOffsetY
      this.easeCurrentX = anchor.x
      this.easeCurrentY = anchor.y
    } else {
      this.opts.onSelectAnchor(null)
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    const pos = this.getMousePos(e)
    
    if (this.draggingId) {
      this.easeTargetX = pos.x - this.dragOffsetX
      this.easeTargetY = pos.y - this.dragOffsetY
      return
    }

    const anchor = this.hitTestAnchor(pos.x, pos.y)
    this.canvas.style.cursor = anchor ? 'move' : 'crosshair'
  }

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.draggingId) {
      const pos = this.getMousePos(e)
      const anchor = this.hitTestAnchor(pos.x, pos.y)
      if (!anchor && e.type === 'mouseup') {
        const now = Date.now()
        if (now - this.lastClickTime < 300) {
          this.opts.onAddAnchor(pos.x, pos.y)
        }
      }
      return
    }

    this.draggingId = null
    this.isEasing = false
  }

  private handleDoubleClick = (e: MouseEvent) => {
    const pos = this.getMousePos(e)
    const anchor = this.hitTestAnchor(pos.x, pos.y)
    if (anchor) {
      this.showEditBubble(anchor, e.clientX, e.clientY)
    }
  }

  private showEditBubble(anchor: AnchorPoint, clientX: number, clientY: number) {
    this.removeEditBubble()

    const bubble = document.createElement('div')
    bubble.className = 'edit-bubble'
    bubble.style.cssText = `
      position: fixed;
      left: ${clientX + 10}px;
      top: ${clientY - 30}px;
      background: #2a2a3e;
      border: 1px solid #6366f1;
      border-radius: 8px;
      padding: 12px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      color: #e0e0e0;
      display: flex;
      gap: 8px;
      align-items: center;
      animation: bubbleFadeIn 0.2s ease;
    `

    bubble.innerHTML = `
      <label style="display:flex;flex-direction:column;gap:4px;">
        <span style="font-size:11px;color:#888;">X</span>
        <input type="number" id="bubble-x" value="${Math.round(anchor.x)}" 
          style="width:60px;padding:4px 6px;background:#1e1e2e;border:1px solid #444;border-radius:4px;color:#e0e0e0;font-size:12px;">
      </label>
      <label style="display:flex;flex-direction:column;gap:4px;">
        <span style="font-size:11px;color:#888;">Y</span>
        <input type="number" id="bubble-y" value="${Math.round(anchor.y)}"
          style="width:60px;padding:4px 6px;background:#1e1e2e;border:1px solid #444;border-radius:4px;color:#e0e0e0;font-size:12px;">
      </label>
      <button id="bubble-apply" 
        style="padding:4px 10px;background:#6366f1;border:none;border-radius:4px;color:white;cursor:pointer;font-size:12px;">
        确定
      </button>
      <button id="bubble-delete"
        style="padding:4px 10px;background:#ef4444;border:none;border-radius:4px;color:white;cursor:pointer;font-size:12px;">
        删除
      </button>
    `

    document.body.appendChild(bubble)
    this.editingBubble = bubble

    const applyBtn = bubble.querySelector('#bubble-apply') as HTMLButtonElement
    const deleteBtn = bubble.querySelector('#bubble-delete') as HTMLButtonElement
    const xInput = bubble.querySelector('#bubble-x') as HTMLInputElement
    const yInput = bubble.querySelector('#bubble-y') as HTMLInputElement

    const applyEdit = () => {
      const x = parseFloat(xInput.value) || 0
      const y = parseFloat(yInput.value) || 0
      this.opts.onEditAnchor(anchor.id, x, y)
      this.removeEditBubble()
    }

    applyBtn.addEventListener('click', applyEdit)
    deleteBtn.addEventListener('click', () => {
      this.opts.onSelectAnchor(null)
      this.removeEditBubble()
    })
    xInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyEdit()
      if (e.key === 'Escape') this.removeEditBubble()
    })
    yInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyEdit()
      if (e.key === 'Escape') this.removeEditBubble()
    })

    setTimeout(() => xInput.focus(), 0)

    const handleOutsideClick = (e: MouseEvent) => {
      if (!bubble.contains(e.target as Node)) {
        this.removeEditBubble()
        document.removeEventListener('mousedown', handleOutsideClick)
      }
    }
    setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick)
    }, 0)
  }

  private removeEditBubble() {
    if (this.editingBubble) {
      this.editingBubble.remove()
      this.editingBubble = null
    }
  }

  private startAnimation() {
    this.startTime = performance.now()
    const animate = (time: number) => {
      this.update(time)
      this.draw()
      this.animationId = requestAnimationFrame(animate)
    }
    this.animationId = requestAnimationFrame(animate)
  }

  private update(time: number) {
    if (this.isEasing && this.draggingId) {
      const t = Math.min(1, (time - (this.startTime + time % 16)) / EASE_DURATION)
      const easeT = 1 - Math.pow(1 - t, 3)
      this.easeCurrentX += (this.easeTargetX - this.easeCurrentX) * 0.3
      this.easeCurrentY += (this.easeTargetY - this.easeCurrentY) * 0.3
      this.opts.onUpdateAnchor(this.draggingId, this.easeCurrentX, this.easeCurrentY)
    }
  }

  private draw() {
    const width = this.opts.getCanvasWidth()
    const height = this.opts.getCanvasHeight()
    const anchors = this.opts.getAnchors()
    const selectedId = this.opts.getSelectedId()

    this.ctx.clearRect(0, 0, width, height)

    this.ctx.fillStyle = CANVAS_BG
    this.ctx.fillRect(0, 0, width, height)

    if (this.opts.getShowGrid()) {
      this.drawGrid(width, height)
    }

    if (anchors.length >= 3) {
      this.drawPolygon(anchors)
    }

    if (anchors.length > 1) {
      this.drawOutline(anchors)
    }

    anchors.forEach(anchor => {
      this.drawAnchor(anchor, anchor.id === selectedId)
    })
  }

  private drawGrid(width: number, height: number) {
    this.ctx.strokeStyle = GRID_COLOR
    this.ctx.lineWidth = 1

    for (let x = 0; x <= width; x += GRID_SPACING) {
      this.ctx.beginPath()
      this.ctx.moveTo(x + 0.5, 0)
      this.ctx.lineTo(x + 0.5, height)
      this.ctx.stroke()
    }

    for (let y = 0; y <= height; y += GRID_SPACING) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y + 0.5)
      this.ctx.lineTo(width, y + 0.5)
      this.ctx.stroke()
    }
  }

  private drawPolygon(anchors: AnchorPoint[]) {
    const elapsed = performance.now() - this.startTime
    const phase = (elapsed % BREATHE_DURATION) / BREATHE_DURATION
    const alpha = 0.3 + 0.1 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2))

    this.ctx.fillStyle = this.hexToRgba(FILL_COLOR, alpha)
    this.ctx.beginPath()
    this.ctx.moveTo(anchors[0].x, anchors[0].y)
    for (let i = 1; i < anchors.length; i++) {
      this.ctx.lineTo(anchors[i].x, anchors[i].y)
    }
    this.ctx.closePath()
    this.ctx.fill()
  }

  private drawOutline(anchors: AnchorPoint[]) {
    this.ctx.strokeStyle = ANCHOR_STROKE
    this.ctx.lineWidth = 1.5
    this.ctx.setLineDash([4, 4])
    this.ctx.beginPath()
    this.ctx.moveTo(anchors[0].x, anchors[0].y)
    for (let i = 1; i < anchors.length; i++) {
      this.ctx.lineTo(anchors[i].x, anchors[i].y)
    }
    this.ctx.closePath()
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  private drawAnchor(anchor: AnchorPoint, selected: boolean) {
    this.ctx.beginPath()
    this.ctx.arc(anchor.x, anchor.y, ANCHOR_RADIUS, 0, Math.PI * 2)
    
    if (selected) {
      this.ctx.fillStyle = ANCHOR_FILL_SELECTED
      this.ctx.fill()
    } else {
      this.ctx.fillStyle = CANVAS_BG
      this.ctx.fill()
    }
    
    this.ctx.strokeStyle = ANCHOR_STROKE
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    if (selected) {
      this.ctx.beginPath()
      this.ctx.arc(anchor.x, anchor.y, ANCHOR_RADIUS + 3, 0, Math.PI * 2)
      this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  public refresh() {
    this.draw()
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp)
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick)
    this.removeEditBubble()
  }
}
