import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { SceneManager, GameObject } from './sceneManager'

export type GameMode = 'destroy' | 'explode' | 'reset'

export class ObjectRegistry {
  private sceneManager: SceneManager
  private objects: Map<string, GameObject> = new Map()
  private destroyedObjects: Set<string> = new Set()
  private objectIdCounter: number = 0
  
  private mode: GameMode = 'destroy'
  
  private isDropping: boolean = false

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  generateId(): string {
    return `obj_${++this.objectIdCounter}`
  }

  addObject(gameObject: GameObject): void {
    this.objects.set(gameObject.id, gameObject)
  }

  getObject(id: string): GameObject | undefined {
    return this.objects.get(id)
  }

  getAllObjects(): GameObject[] {
    return Array.from(this.objects.values())
  }

  getActiveObjects(): GameObject[] {
    return Array.from(this.objects.values()).filter(obj => !obj.isDestroyed)
  }

  setMode(mode: GameMode): void {
    this.mode = mode
  }

  getMode(): GameMode {
    return this.mode
  }

  shatterObject(id: string): boolean {
    const obj = this.objects.get(id)
    if (!obj || obj.isDestroyed) return false
    
    obj.isDestroyed = true
    this.destroyedObjects.add(id)
    
    this.sceneManager.scene.remove(obj.mesh)
    this.sceneManager.physicsWorld.removeBody(obj.body)
    
    const size = this.getObjectSize(obj)
    this.sceneManager.shatterObject(
      obj.mesh.position.clone(),
      size,
      obj.color,
      obj.type
    )
    
    return true
  }

  private getObjectSize(obj: GameObject): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(obj.mesh)
    return new THREE.Vector3(
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z
    )
  }

  explodeAt(position: THREE.Vector3, radius: number = 8, force: number = 30): void {
    this.sceneManager.createExplosion(position, radius, force)
    
    const objectsToShatter: string[] = []
    
    for (const obj of this.objects.values()) {
      if (obj.isDestroyed) continue
      
      const distance = obj.mesh.position.distanceTo(position)
      if (distance < radius) {
        objectsToShatter.push(obj.id)
        
        const direction = new CANNON.Vec3(
          obj.body.position.x - position.x,
          obj.body.position.y - position.y + 1,
          obj.body.position.z - position.z
        )
        direction.normalize()
        
        const explosionForce = force * (1 - distance / radius)
        obj.body.velocity.x += direction.x * explosionForce
        obj.body.velocity.y += direction.y * explosionForce
        obj.body.velocity.z += direction.z * explosionForce
        
        obj.body.angularVelocity.x += (Math.random() - 0.5) * 5
        obj.body.angularVelocity.y += (Math.random() - 0.5) * 5
        obj.body.angularVelocity.z += (Math.random() - 0.5) * 5
      }
    }
    
    setTimeout(() => {
      for (const id of objectsToShatter) {
        this.shatterObject(id)
      }
    }, 100)
  }

  launchCannonball(): void {
    const startPos = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      25,
      15
    )
    
    const targetPos = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      1,
      -5
    )
    
    const { mesh, body } = this.sceneManager.createSphere(
      startPos,
      0.6,
      0x555555,
      10
    )
    
    mesh.castShadow = true
    
    const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize()
    const speed = 25
    
    body.velocity.set(
      direction.x * speed,
      direction.y * speed - 5,
      direction.z * speed
    )
    
    body.angularDamping = 0.01
    body.linearDamping = 0.01
    
    const cannonballId = `cannon_${Date.now()}`
    
    const gameObject: GameObject = {
      id: cannonballId,
      mesh,
      body,
      originalPosition: startPos.clone(),
      originalRotation: new THREE.Euler(0, 0, 0),
      type: 'sphere',
      color: 0x555555,
      isDestroyed: false
    }
    
    this.addObject(gameObject)
    
    const checkCollision = () => {
      if (gameObject.isDestroyed) return
      
      const pos = body.position
      if (pos.y < 0.5) {
        this.explodeAt(
          new THREE.Vector3(pos.x, pos.y, pos.z),
          10,
          35
        )
        
        setTimeout(() => {
          if (this.objects.has(cannonballId)) {
            this.sceneManager.scene.remove(mesh)
            this.sceneManager.physicsWorld.removeBody(body)
            this.objects.delete(cannonballId)
          }
        }, 200)
        
        gameObject.isDestroyed = true
        return
      }
      
      for (const obj of this.objects.values()) {
        if (obj.id === cannonballId || obj.isDestroyed) continue
        
        const dist = Math.sqrt(
          Math.pow(obj.body.position.x - pos.x, 2) +
          Math.pow(obj.body.position.y - pos.y, 2) +
          Math.pow(obj.body.position.z - pos.z, 2)
        )
        
        if (dist < 1.5) {
          this.explodeAt(
            new THREE.Vector3(pos.x, pos.y, pos.z),
            10,
            35
          )
          
          setTimeout(() => {
            if (this.objects.has(cannonballId)) {
              this.sceneManager.scene.remove(mesh)
              this.sceneManager.physicsWorld.removeBody(body)
              this.objects.delete(cannonballId)
            }
          }, 200)
          
          gameObject.isDestroyed = true
          return
        }
      }
      
      requestAnimationFrame(checkCollision)
    }
    
    checkCollision()
  }

  resetScene(): void {
    if (this.isDropping) return
    this.isDropping = true
    
    for (const obj of this.objects.values()) {
      if (obj.mesh) {
        this.sceneManager.scene.remove(obj.mesh)
      }
      if (obj.body) {
        this.sceneManager.physicsWorld.removeBody(obj.body)
      }
    }
    
    this.objects.clear()
    this.destroyedObjects.clear()
    this.objectIdCounter = 0
    
    this.spawnInitialObjectsWithDrop()
  }

  private spawnInitialObjectsWithDrop(): void {
    const objects: Array<{
      type: 'box' | 'sphere' | 'cylinder'
      position: THREE.Vector3
      size?: THREE.Vector3
      radius?: number
      height?: number
      color: number
      mass: number
    }> = [
      {
        type: 'box',
        position: new THREE.Vector3(-4, 15, 0),
        size: new THREE.Vector3(1.5, 1.5, 1.5),
        color: 0xff6b6b,
        mass: 2
      },
      {
        type: 'box',
        position: new THREE.Vector3(4, 17, -2),
        size: new THREE.Vector3(2, 1.2, 2),
        color: 0x4ecdc4,
        mass: 2.5
      },
      {
        type: 'sphere',
        position: new THREE.Vector3(0, 20, -3),
        radius: 1,
        color: 0xffd93d,
        mass: 3
      },
      {
        type: 'cylinder',
        position: new THREE.Vector3(-3, 16, -4),
        radius: 0.8,
        height: 2.5,
        color: 0x95e1d3,
        mass: 2
      },
      {
        type: 'box',
        position: new THREE.Vector3(3, 18, -6),
        size: new THREE.Vector3(1.8, 1.8, 1.8),
        color: 0xf38181,
        mass: 3
      },
      {
        type: 'sphere',
        position: new THREE.Vector3(-5, 19, -5),
        radius: 0.9,
        color: 0xaa96da,
        mass: 2.5
      },
      {
        type: 'cylinder',
        position: new THREE.Vector3(5, 14, 2),
        radius: 0.7,
        height: 2,
        color: 0xfcbad3,
        mass: 1.8
      },
      {
        type: 'box',
        position: new THREE.Vector3(-2, 21, 2),
        size: new THREE.Vector3(1.4, 1.4, 1.4),
        color: 0xa8d8ea,
        mass: 2
      },
      {
        type: 'sphere',
        position: new THREE.Vector3(2, 15, 4),
        radius: 1.1,
        color: 0xffeaa7,
        mass: 3.5
      },
      {
        type: 'cylinder',
        position: new THREE.Vector3(0, 19, 5),
        radius: 0.9,
        height: 2.2,
        color: 0xdfe6e9,
        mass: 2.5
      },
      {
        type: 'box',
        position: new THREE.Vector3(-6, 13, 3),
        size: new THREE.Vector3(1.6, 1.6, 1.6),
        color: 0xb8e994,
        mass: 2.2
      },
      {
        type: 'sphere',
        position: new THREE.Vector3(6, 16, 5),
        radius: 0.8,
        color: 0xf8b500,
        mass: 2
      }
    ]
    
    const dropDelay = 100
    
    objects.forEach((objData, index) => {
      setTimeout(() => {
        this.spawnObjectWithDrop(objData)
        
        if (index === objects.length - 1) {
          setTimeout(() => {
            this.isDropping = false
          }, 1500)
        }
      }, index * dropDelay)
    })
  }

  private spawnObjectWithDrop(objData: {
    type: 'box' | 'sphere' | 'cylinder'
    position: THREE.Vector3
    size?: THREE.Vector3
    radius?: number
    height?: number
    color: number
    mass: number
  }): void {
    let mesh: THREE.Mesh
    let body: CANNON.Body
    
    const groundY = this.getGroundYForPosition(objData.position)
    const dropHeight = objData.position.y
    
    switch (objData.type) {
      case 'box':
        const boxResult = this.sceneManager.createBox(
          objData.position,
          objData.size!,
          objData.color,
          objData.mass
        )
        mesh = boxResult.mesh
        body = boxResult.body
        break
      case 'sphere':
        const sphereResult = this.sceneManager.createSphere(
          objData.position,
          objData.radius!,
          objData.color,
          objData.mass
        )
        mesh = sphereResult.mesh
        body = sphereResult.body
        break
      case 'cylinder':
        const cylinderResult = this.sceneManager.createCylinder(
          objData.position,
          objData.radius!,
          objData.height!,
          objData.color,
          objData.mass
        )
        mesh = cylinderResult.mesh
        body = cylinderResult.body
        break
    }
    
    const id = this.generateId()
    
    const restPosition = objData.position.clone()
    restPosition.y = groundY
    
    const gameObject: GameObject = {
      id,
      mesh,
      body,
      originalPosition: restPosition,
      originalRotation: new THREE.Euler(0, 0, 0),
      type: objData.type,
      color: objData.color,
      isDestroyed: false
    }
    
    this.addObject(gameObject)
    
    body.position.y = dropHeight
    body.velocity.set(0, -2, 0)
    
    const checkLanding = setInterval(() => {
      if (gameObject.isDestroyed) {
        clearInterval(checkLanding)
        return
      }
      
      const velocity = body.velocity
      if (Math.abs(velocity.y) < 0.5 && body.position.y < groundY + 0.5) {
        this.sceneManager.createDustParticles(
          new THREE.Vector3(
            body.position.x,
            groundY + 0.1,
            body.position.z
          )
        )
        clearInterval(checkLanding)
      }
    }, 50)
    
    setTimeout(() => clearInterval(checkLanding), 5000)
  }

  private getGroundYForPosition(position: THREE.Vector3): number {
    switch (position.y % 5) {
      default:
        return 1
    }
  }

  initializeScene(): void {
    this.spawnInitialObjectsWithDrop()
  }

  getObjectByMesh(mesh: THREE.Mesh): GameObject | undefined {
    for (const obj of this.objects.values()) {
      if (obj.mesh === mesh) {
        return obj
      }
    }
    return undefined
  }
}
