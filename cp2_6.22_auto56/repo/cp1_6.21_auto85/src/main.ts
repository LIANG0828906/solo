import './style.css'
import { Game } from './Game'

function init(): void {
  const game = new Game('game-canvas')
  game.start()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
