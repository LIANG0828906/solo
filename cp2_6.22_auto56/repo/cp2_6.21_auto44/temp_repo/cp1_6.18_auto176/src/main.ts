import { GameEngine } from './core/GameEngine'
import { Renderer } from './rendering/Renderer'

function main(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('找不到Canvas元素')
    return
  }

  const engine = new GameEngine()
  const renderer = new Renderer(canvas, engine)

  engine.initialize()

  let lastTime = 0
  let frameCount = 0
  let fpsUpdateTime = 0

  function gameLoop(timestamp: number): void {
    if (lastTime === 0) lastTime = timestamp

    const deltaTime = timestamp - lastTime
    lastTime = timestamp

    engine.update(timestamp)

    renderer.render(timestamp)

    frameCount++
    fpsUpdateTime += deltaTime
    if (fpsUpdateTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / fpsUpdateTime)
      if (fps < 50) {
        console.warn(`帧率较低: ${fps} FPS`)
      }
      frameCount = 0
      fpsUpdateTime = 0
    }

    requestAnimationFrame(gameLoop)
  }

  requestAnimationFrame(gameLoop)

  console.log('五行决 游戏已启动')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
