import * as THREE from 'three'
import { SceneManager } from '../engine/sceneManager'
import { ObjectRegistry, GameMode } from '../engine/objectRegistry'

export class InteractionManager {
  private sceneManager: SceneManager
  private objectRegistry: ObjectRegistry
  private container: HTMLElement
  
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  
  private mode: GameMode = 'destroy'
  
  private isLocked: boolean = false

  constructor(
    container: HTMLElement,
    sceneManager: SceneManager,
    objectRegistry: ObjectRegistry
  ) {
    this.container = container
    this.sceneManager = sceneManager
    this.objectRegistry = objectRegistry
    
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', this.handleClick.bind(this))
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
  }

  private handleClick(event: MouseEvent): void {
    if (this.isLocked) return
    
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera)
    
    const meshes = this.objectRegistry.getActiveObjects().map(obj => obj.mesh)
    const intersects = this.raycaster.intersectObjects(meshes)
    
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh
      const gameObject = this.objectRegistry.getObjectByMesh(clickedMesh)
      
      if (gameObject) {
        if (this.mode === 'destroy') {
          this.objectRegistry.shatterObject(gameObject.id)
        }
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'Space':
        event.preventDefault()
        if (this.mode === 'explode') {
          this.launchCannonball()
        }
        break
        
      case 'KeyR':
        this.resetScene()
        break
    }
  }

  private launchCannonball(): void {
    if (this.isLocked) return
    this.isLocked = true
    
    this.objectRegistry.launchCannonball()
    
    setTimeout(() => {
      this.isLocked = false
    }, 500)
  }

  private resetScene(): void {
    this.objectRegistry.resetScene()
  }

  setMode(mode: GameMode): void {
    this.mode = mode
  }

  getMode(): GameMode {
    return this.mode
  }

  dispose(): void {
    this.container.removeEventListener('click', this.handleClick.bind(this))
    window.removeEventListener('keydown', this.handleKeyDown.bind(this))
  }
}
