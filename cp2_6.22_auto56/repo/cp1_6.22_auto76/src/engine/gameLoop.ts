export interface GameLoopState {
  running: boolean
  paused: boolean
  lastTime: number
  deltaTime: number
  accumulator: number
}

export type GameLoopUpdateFn = (deltaTime: number) => void
export type GameLoopRenderFn = (alpha: number) => void

const STEP_MS = 1000 / 30
const MAX_DELTA_MS = 100

const state: GameLoopState = {
  running: false,
  paused: false,
  lastTime: 0,
  deltaTime: 0,
  accumulator: 0,
}

let rafId: number | null = null
let onUpdate: GameLoopUpdateFn | null = null
let onRender: GameLoopRenderFn | null = null

function frame(currentTime: number): void {
  if (!state.running) return

  if (!state.paused) {
    let delta = currentTime - state.lastTime
    if (delta > MAX_DELTA_MS) {
      delta = MAX_DELTA_MS
    }

    state.deltaTime = delta
    state.accumulator += delta

    while (state.accumulator >= STEP_MS) {
      if (onUpdate) {
        onUpdate(STEP_MS)
      }
      state.accumulator -= STEP_MS
    }

    const alpha = state.accumulator / STEP_MS
    if (onRender) {
      onRender(alpha)
    }
  }

  state.lastTime = currentTime
  rafId = requestAnimationFrame(frame)
}

export function startGameLoop(
  updateFn: GameLoopUpdateFn,
  renderFn: GameLoopRenderFn
): void {
  if (state.running) return

  onUpdate = updateFn
  onRender = renderFn

  state.running = true
  state.paused = false
  state.lastTime = performance.now()
  state.deltaTime = 0
  state.accumulator = 0

  rafId = requestAnimationFrame(frame)
}

export function pauseGameLoop(): void {
  state.paused = true
}

export function resumeGameLoop(): void {
  if (!state.running) return
  state.paused = false
  state.lastTime = performance.now()
}

export function stopGameLoop(): void {
  state.running = false
  state.paused = false
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  onUpdate = null
  onRender = null
}

export function isPaused(): boolean {
  return state.paused
}

export function isRunning(): boolean {
  return state.running
}

export function getGameLoopState(): Readonly<GameLoopState> {
  return state
}
