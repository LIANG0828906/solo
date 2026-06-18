import { Game } from './game'

function setupCanvas(canvas: HTMLCanvasElement): void {
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.floor(window.innerWidth * dpr)
    const h = Math.floor(window.innerHeight * dpr)
    canvas.width = w
    canvas.height = h
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
  }
  resize()
  window.addEventListener('resize', resize)
}

function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement
  if (!canvas) {
    throw new Error('Canvas element #game not found')
  }
  setupCanvas(canvas)
  const game = new Game(canvas)
  game.start()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
