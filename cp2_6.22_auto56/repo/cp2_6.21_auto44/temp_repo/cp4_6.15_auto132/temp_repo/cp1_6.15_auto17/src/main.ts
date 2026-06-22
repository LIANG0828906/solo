import { MoleculeScene } from './moleculeScene'
import { UIPanel } from './uiPanel'
import type { Atom } from './moleculeScene'

class App {
  private scene: MoleculeScene
  private ui: UIPanel

  private frameCount = 0
  private lastFpsTime = 0

  constructor() {
    const container = document.getElementById('canvas-container') as HTMLElement
    this.scene = new MoleculeScene(container)
    this.ui = new UIPanel()

    this.bindSceneEvents()
    this.bindUIEvents()
    this.startLoop()
  }

  private bindSceneEvents(): void {
    this.scene.onAtomHover = (atom: Atom | null, x: number, y: number) => {
      this.ui.showHoverTooltip(atom, x, y)
    }

    this.scene.onAtomClick = (atom: Atom | null) => {
      this.ui.updateAtomDetail(atom)
    }
  }

  private bindUIEvents(): void {
    this.ui.onSearch = (query: string) => {
      this.scene.searchAtom(query)
    }

    this.ui.onModelChange = (model: 'ball-stick' | 'space-filling') => {
      this.scene.setModelType(model)
    }

    this.ui.onAutoRotateChange = (enabled: boolean) => {
      this.scene.setAutoRotate(enabled)
    }
  }

  private startLoop(): void {
    this.lastFpsTime = performance.now()

    const animate = () => {
      requestAnimationFrame(animate)

      this.scene.update()
      this.scene.render()

      this.frameCount++
      const now = performance.now()
      const elapsed = now - this.lastFpsTime
      if (elapsed >= 500) {
        const fps = (this.frameCount * 1000) / elapsed
        this.ui.updateFPS(fps)
        this.frameCount = 0
        this.lastFpsTime = now
      }
    }

    animate()
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App()
})
