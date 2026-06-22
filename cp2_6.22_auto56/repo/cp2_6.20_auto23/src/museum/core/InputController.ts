import { EventEmitter } from 'events'

export interface MoveVector {
  x: number
  z: number
}

export type InputEventType =
  | 'move'
  | 'click'
  | 'mouseMove'
  | 'joystickStart'
  | 'joystickEnd'

export class InputController extends EventEmitter {
  private keys: Set<string> = new Set()
  private moveVector: MoveVector = { x: 0, z: 0 }
  private canvas: HTMLCanvasElement | null = null
  private isPointerLocked: boolean = false
  private joystickActive: boolean = false
  private joystickBase: HTMLElement | null = null
  private joystickHandle: HTMLElement | null = null
  private joystickStartPos = { x: 0, y: 0 }
  private touchStartPos = { x: 0, y: 0 }

  constructor() {
    super()
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.bindKeyboard()
    this.bindMouse()
    this.initJoystick()
    window.addEventListener('resize', this.handleResize)
  }

  private bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      this.updateMoveVector()
    })
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code)
      this.updateMoveVector()
    })
  }

  private bindMouse() {
    if (!this.canvas) return

    this.canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.canvas?.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas
    })

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.emit('mouseMove', { dx: e.movementX, dy: e.movementY })
      }
    })

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.isPointerLocked) {
        this.emit('click', { x: e.clientX, y: e.clientY })
      }
    })
  }

  private initJoystick() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    if (!isMobile) return

    this.joystickBase = document.createElement('div')
    this.joystickBase.style.cssText = `
      position: fixed;
      left: 24px;
      bottom: 120px;
      width: 120px;
      height: 120px;
      background: rgba(201, 169, 98, 0.1);
      border: 2px solid rgba(201, 169, 98, 0.3);
      border-radius: 50%;
      z-index: 1000;
      touch-action: none;
      backdrop-filter: blur(8px);
    `

    this.joystickHandle = document.createElement('div')
    this.joystickHandle.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #c9a962, #e08a3c);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 20px rgba(201, 169, 98, 0.5);
    `

    this.joystickBase.appendChild(this.joystickHandle)
    document.body.appendChild(this.joystickBase)

    this.joystickBase.addEventListener('touchstart', this.onJoystickStart.bind(this), { passive: false })
    this.joystickBase.addEventListener('touchmove', this.onJoystickMove.bind(this), { passive: false })
    this.joystickBase.addEventListener('touchend', this.onJoystickEnd.bind(this), { passive: false })
  }

  private onJoystickStart(e: TouchEvent) {
    e.preventDefault()
    this.joystickActive = true
    const touch = e.touches[0]
    const rect = this.joystickBase!.getBoundingClientRect()
    this.joystickStartPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    this.touchStartPos = { x: touch.clientX, y: touch.clientY }
    this.emit('joystickStart')
  }

  private onJoystickMove(e: TouchEvent) {
    e.preventDefault()
    if (!this.joystickActive || !this.joystickHandle || !this.joystickBase) return

    const touch = e.touches[0]
    const maxDist = 45
    const dx = touch.clientX - this.joystickStartPos.x
    const dy = touch.clientY - this.joystickStartPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const clampedDist = Math.min(dist, maxDist)
    const angle = Math.atan2(dy, dx)

    const handleX = Math.cos(angle) * clampedDist
    const handleY = Math.sin(angle) * clampedDist
    this.joystickHandle.style.transform = `translate(calc(-50% + ${handleX}px), calc(-50% + ${handleY}px))`

    this.moveVector = {
      x: (handleX / maxDist) * 1,
      z: (handleY / maxDist) * 1,
    }
    this.emit('move', this.moveVector)
  }

  private onJoystickEnd(e: TouchEvent) {
    e.preventDefault()
    this.joystickActive = false
    if (this.joystickHandle) {
      this.joystickHandle.style.transform = 'translate(-50%, -50%)'
    }
    this.moveVector = { x: 0, z: 0 }
    this.emit('move', this.moveVector)
    this.emit('joystickEnd')
  }

  private updateMoveVector() {
    let x = 0
    let z = 0

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1

    if (x !== 0 && z !== 0) {
      const factor = 1 / Math.sqrt(2)
      x *= factor
      z *= factor
    }

    this.moveVector = { x, z }
    this.emit('move', this.moveVector)
  }

  getMoveVector(): MoveVector {
    return this.moveVector
  }

  private handleResize = () => {}

  destroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.joystickBase) {
      this.joystickBase.remove()
    }
  }
}
