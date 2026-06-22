import * as CANNON from 'cannon-es'

export class PhysicsWorld {
  world: CANNON.World
  private timeStep: number = 1 / 60
  private maxSubSteps: number = 3

  constructor() {
    this.world = new CANNON.World()
    this.world.gravity.set(0, -9.82, 0)
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = true
    ;(this.world.solver as any).iterations = 10
    
    this.world.defaultContactMaterial.friction = 0.3
    this.world.defaultContactMaterial.restitution = 0.2
  }

  update(deltaTime: number): void {
    this.world.step(this.timeStep, deltaTime, this.maxSubSteps)
  }

  addBody(body: CANNON.Body): void {
    this.world.addBody(body)
  }

  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body)
  }

  addContactMaterial(contactMaterial: CANNON.ContactMaterial): void {
    this.world.addContactMaterial(contactMaterial)
  }

  dispose(): void {
    const bodies = [...this.world.bodies]
    bodies.forEach(body => {
      this.world.removeBody(body)
    })
  }
}
