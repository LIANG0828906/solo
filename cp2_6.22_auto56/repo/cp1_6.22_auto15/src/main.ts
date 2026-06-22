import * as THREE from 'three'
import { PhysicsWorld } from './engine/physicsWorld'
import { SceneManager } from './engine/sceneManager'
import { ObjectRegistry } from './engine/objectRegistry'
import { Controls } from './ui/controls'
import { InteractionManager } from './ui/interactionManager'

class App {
  private container: HTMLElement
  private physicsWorld!: PhysicsWorld
  private sceneManager!: SceneManager
  private objectRegistry!: ObjectRegistry
  private controls!: Controls
  private interactionManager!: InteractionManager
  
  private clock: THREE.Clock
  private animationId: number | null = null
  
  private fps: number = 0
  private frameCount: number = 0
  private lastFpsUpdate: number = 0

  constructor() {
    this.container = document.getElementById('app')!
    this.clock = new THREE.Clock()
    
    this.init()
    this.animate()
    
    window.addEventListener('beforeunload', () => this.dispose())
  }

  private init(): void {
    this.physicsWorld = new PhysicsWorld()
    
    this.sceneManager = new SceneManager(this.container, this.physicsWorld)
    
    this.objectRegistry = new ObjectRegistry(this.sceneManager)
    
    this.controls = new Controls(this.container, this.objectRegistry)
    
    this.interactionManager = new InteractionManager(
      this.container,
      this.sceneManager,
      this.objectRegistry
    )
    
    this.controls.setOnModeChange((mode) => {
      this.interactionManager.setMode(mode)
    })
    
    this.objectRegistry.initializeScene()
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate())
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1)
    
    this.physicsWorld.update(deltaTime)
    
    this.syncObjects()
    
    this.sceneManager.update(deltaTime)
    
    this.updateFPS()
  }

  private syncObjects(): void {
    const objects = this.objectRegistry.getAllObjects()
    
    for (const obj of objects) {
      if (obj.isDestroyed) continue
      
      obj.mesh.position.copy(obj.body.position as any)
      obj.mesh.quaternion.copy(obj.body.quaternion as any)
    }
  }

  private updateFPS(): void {
    this.frameCount++
    
    const now = performance.now()
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
  }

  getFPS(): number {
    return this.fps
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    
    this.controls.dispose()
    this.interactionManager.dispose()
    this.sceneManager.dispose()
    this.physicsWorld.dispose()
  }
}

declare global {
  interface Window {
    app?: App
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  window.app = app
})
