import type { InputState } from '@/types'

export class PlayerController {
  private input: InputState = {
    jumpPressed: false,
    dashHeld: false,
  }
  private jumpEdge: boolean = false
  private listeners: Array<() => void> = []
  private keyDownHandler: (e: KeyboardEvent) => void
  private keyUpHandler: (e: KeyboardEvent) => void
  private touchStartHandler: (e: TouchEvent) => void
  private touchEndHandler: (e: TouchEvent) => void
  private target?: HTMLElement

  constructor() {
    this.keyDownHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!this.input.jumpPressed) {
          this.jumpEdge = true
        }
        this.input.jumpPressed = true
        e.preventDefault()
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.input.dashHeld = true
      }
      if (e.code === 'KeyR') {
        this.emit()
      }
    }
    this.keyUpHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.input.jumpPressed = false
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.input.dashHeld = false
      }
    }
    this.touchStartHandler = (e: TouchEvent) => {
      const touch = e.touches[0]
      const tgt = e.currentTarget as HTMLElement | null
      if (!tgt) return
      const rect = tgt.getBoundingClientRect()
      const x = touch.clientX - rect.left
      if (x >= rect.width / 2) {
        if (!this.input.jumpPressed) this.jumpEdge = true
        this.input.jumpPressed = true
      } else {
        this.input.dashHeld = true
      }
      e.preventDefault()
    }
    this.touchEndHandler = (e: TouchEvent) => {
      this.input.jumpPressed = false
      this.input.dashHeld = false
      e.preventDefault()
    }
  }

  attach(target?: HTMLElement) {
    this.target = target
    window.addEventListener('keydown', this.keyDownHandler)
    window.addEventListener('keyup', this.keyUpHandler)
    if (target) {
      target.addEventListener('touchstart', this.touchStartHandler, { passive: false })
      target.addEventListener('touchend', this.touchEndHandler, { passive: false })
    }
  }

  detach() {
    window.removeEventListener('keydown', this.keyDownHandler)
    window.removeEventListener('keyup', this.keyUpHandler)
    if (this.target) {
      this.target.removeEventListener('touchstart', this.touchStartHandler)
      this.target.removeEventListener('touchend', this.touchEndHandler)
    }
    this.target = undefined
  }

  onChange(cb: () => void) {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  private emit() {
    for (const l of this.listeners) l()
  }

  consumeJumpEdge(): boolean {
    const v = this.jumpEdge
    this.jumpEdge = false
    return v
  }

  getInput(): Readonly<InputState> {
    return this.input
  }
}
