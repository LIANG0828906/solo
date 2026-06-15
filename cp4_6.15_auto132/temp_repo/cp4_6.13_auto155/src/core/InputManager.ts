export class InputManager {
  private keys: Set<string> = new Set()
  private mouseClicked: boolean = false

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (e.code === 'Space') {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
    })

    window.addEventListener('click', () => {
      this.mouseClicked = true
    })
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key)
  }

  getMouseClick(): boolean {
    const clicked = this.mouseClicked
    this.mouseClicked = false
    return clicked
  }

  reset(): void {
    this.keys.clear()
    this.mouseClicked = false
  }
}
