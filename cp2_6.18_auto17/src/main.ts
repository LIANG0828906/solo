import { TowerSystem } from './towerSystem'
import { GameEngine } from './gameEngine'
import { RenderEngine } from './renderEngine'
import { UIController } from './uiController'
import { SoundManager } from './soundManager'
import { eventBus } from './eventBus'

const app = document.getElementById('app')
if (!app) {
  throw new Error('App container not found')
}

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
if (!canvas) {
  throw new Error('Game canvas not found')
}

const uiContainer = document.createElement('div')
uiContainer.className = 'game-ui'
app.appendChild(uiContainer)

const towerSystem = new TowerSystem()
const gameEngine = new GameEngine(towerSystem)
const renderEngine = new RenderEngine(canvas, towerSystem, gameEngine)
new UIController(uiContainer, gameEngine, towerSystem)

const soundManager = new SoundManager()

const initAudio = () => {
  soundManager.init()
  document.removeEventListener('click', initAudio)
  document.removeEventListener('keydown', initAudio)
}
document.addEventListener('click', initAudio)
document.addEventListener('keydown', initAudio)

gameEngine.start()

window.addEventListener('beforeunload', () => {
  soundManager.dispose()
  renderEngine.dispose()
  eventBus.clear()
})
