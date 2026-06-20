import { eventBus } from './eventBus'
import { FluidSim } from './fluidSim'
import { Renderer } from './renderer'
import { Panel } from './panel'

const AREA_SIZE = 200
const PARTICLE_COUNT = 3000

const container = document.getElementById('canvas-container')!
const fpsCounter = document.getElementById('fps-counter')!

const fluidSim = new FluidSim(eventBus, AREA_SIZE, PARTICLE_COUNT)
const renderer = new Renderer(container, eventBus, AREA_SIZE)
new Panel(document.getElementById('panel-sections')!, eventBus)

let lastTime = performance.now()
let frameCount = 0
let fpsTime = 0
let fps = 0

function animate(currentTime: number): void {
  requestAnimationFrame(animate)

  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1)
  lastTime = currentTime

  frameCount++
  fpsTime += deltaTime
  if (fpsTime >= 0.5) {
    fps = Math.round(frameCount / fpsTime)
    fpsCounter.textContent = `FPS: ${fps}`
    frameCount = 0
    fpsTime = 0
  }

  fluidSim.update(deltaTime)
  renderer.update(deltaTime)
}

requestAnimationFrame(animate)

window.addEventListener('resize', () => {
  renderer.resize()
})
