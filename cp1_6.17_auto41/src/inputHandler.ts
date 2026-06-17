export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  shoot: boolean
}

export class InputHandler {
  private keys: Set<string> = new Set()
  private canvas: HTMLCanvasElement | null = null
  private touchStartX: number = 0
  private touchStartY: number = 0
  private touchCurrentX: number = 0
  private touchCurrentY: number = 0
  private isTouching: boolean = false
  public onPause: (() => void) | null = null

  constructor() {
    this.setupKeyboardListeners()
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.setupTouchListeners()
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      this.keys.add(e.code)
      if (e.code === 'Escape') {
        e.preventDefault()
        this.onPause?.()
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
    })

    window.addEventListener('blur', () => {
      this.keys.clear()
    })
  }

  private setupTouchListeners() {
    if (!this.canvas) return

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const rect = this.canvas!.getBoundingClientRect()
        this.isTouching = true
        this.touchStartX = touch.clientX - rect.left
        this.touchStartY = touch.clientY - rect.top
        this.touchCurrentX = this.touchStartX
        this.touchCurrentY = this.touchStartY
      }
    }, { passive: false })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (e.touches.length > 0 && this.isTouching) {
        const touch = e.touches[0]
        const rect = this.canvas!.getBoundingClientRect()
        this.touchCurrentX = touch.clientX - rect.left
        this.touchCurrentY = touch.clientY - rect.top
      }
    }, { passive: false })

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.isTouching = false
    }, { passive: false })
  }

  public getInput(canvasWidth: number, canvasHeight: number, playerX: number, playerY: number): InputState {
    const input: InputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false
    }

    input.up = this.keys.has('KeyW') || this.keys.has('ArrowUp')
    input.down = this.keys.has('KeyS') || this.keys.has('ArrowDown')
    input.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft')
    input.right = this.keys.has('KeyD') || this.keys.has('ArrowRight')
    input.shoot = this.keys.has('Space')

    if (this.isTouching) {
      const dx = this.touchCurrentX - playerX
      const dy = this.touchCurrentY - playerY
      const deadZone = 10

      if (dx > deadZone) input.right = true
      if (dx < -deadZone) input.left = true
      if (dy > deadZone) input.down = true
      if (dy < -deadZone) input.up = true
      input.shoot = true
    }

    return input
  }

  public destroy() {
    this.keys.clear()
  }
}
