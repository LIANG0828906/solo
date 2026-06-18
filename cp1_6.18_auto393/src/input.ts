export class InputManager {
  keys: Set<string>
  mouseX: number
  mouseY: number
  isMouseDown: boolean
  canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.keys = new Set()
    this.mouseX = 0
    this.mouseY = 0
    this.isMouseDown = false
    this.canvas = canvas

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
  }

  start() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  stop() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
  }

  handleKeyDown(e: KeyboardEvent) {
    this.keys.add(e.key)
  }

  handleKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.key)
  }

  handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    this.mouseX = (e.clientX - rect.left) * scaleX
    this.mouseY = (e.clientY - rect.top) * scaleY
  }

  handleMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      this.isMouseDown = true
    }
  }

  handleMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.isMouseDown = false
    }
  }
}
