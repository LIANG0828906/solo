import { MoleculeScene } from './MoleculeScene'
import UIPanel from './UIPanel'
import { useMoleculeStore } from './store'

function main(): void {
  const app = document.getElementById('app')
  const canvasContainer = document.getElementById('canvas-container')

  if (!app || !canvasContainer) {
    throw new Error('DOM元素 #app 或 #canvas-container 未找到')
  }

  const scene = new MoleculeScene()
  scene.init(canvasContainer)

  const uiPanel = new UIPanel(app, useMoleculeStore, scene)
  uiPanel.build()
  uiPanel.bindEvents()

  let lastTime = performance.now()
  let frameCount = 0
  let fps = 0
  let fpsAccumulator = 0

  const animate = (currentTime: number): void => {
    const delta = (currentTime - lastTime) / 1000
    lastTime = currentTime

    scene.update(delta)
    scene.render()

    frameCount++
    fpsAccumulator += delta

    if (fpsAccumulator >= 1) {
      fps = Math.round(frameCount / fpsAccumulator)
      frameCount = 0
      fpsAccumulator = 0

      if (fps < 30 && scene.renderer) {
        const currentDPR = scene.renderer.getPixelRatio()
        if (currentDPR > 1) {
          scene.renderer.setPixelRatio(Math.max(1, currentDPR - 0.5))
        }
      }
    }

    requestAnimationFrame(animate)
  }

  animate(performance.now())

  const handleResize = (): void => {
    const w = window.innerWidth
    const h = window.innerHeight
    scene.resize(w, h)
  }

  window.addEventListener('resize', handleResize)
  handleResize()
}

try {
  main()
} catch (e) {
  const message = e instanceof Error ? e.message : String(e)
  alert(`启动失败: ${message}`)
}
