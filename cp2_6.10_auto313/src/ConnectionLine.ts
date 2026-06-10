import * as THREE from 'three'
import type { Block } from './CubeController'

interface Connection {
  line: THREE.Line
  from: Block
  to: Block
  material: THREE.LineBasicMaterial
}

interface GlobalConfig {
  CONNECTION_DISTANCE: number
  colors: {
    iceBlue: string
    pinkCrystal: string
    background: string
  }
}

export class ConnectionLine {
  private scene: THREE.Scene
  private config: GlobalConfig
  private connections: Map<string, Connection> = new Map()
  private flowIntensity: number = 50
  private time: number = 0

  constructor(scene: THREE.Scene, config: GlobalConfig) {
    this.scene = scene
    this.config = config
  }

  setFlowIntensity(value: number) {
    this.flowIntensity = value
    this.updateAllConnectionMaterials()
  }

  getFlowIntensity(): number {
    return this.flowIntensity
  }

  private getConnectionKey(fromId: string, toId: string): string {
    return [fromId, toId].sort().join('_')
  }

  updateConnections(blocks: Block[]) {
    const newConnectionKeys = new Set<string>()

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const from = blocks[i]
        const to = blocks[j]
        
        const distance = from.mesh.position.distanceTo(to.mesh.position)
        
        if (distance <= this.config.CONNECTION_DISTANCE) {
          const key = this.getConnectionKey(from.id, to.id)
          newConnectionKeys.add(key)

          if (!this.connections.has(key)) {
            this.createConnection(from, to, key)
          }
        }
      }
    }

    for (const [key, connection] of this.connections) {
      if (!newConnectionKeys.has(key)) {
        this.removeConnection(key, connection)
      }
    }
  }

  private createConnection(from: Block, to: Block, key: string) {
    const points = [
      from.mesh.position.clone(),
      to.mesh.position.clone()
    ]
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    
    const color = this.getConnectionColor()
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: this.getOpacity(),
      linewidth: this.getLineWidth()
    })

    const line = new THREE.Line(geometry, material)
    this.scene.add(line)

    this.connections.set(key, {
      line,
      from,
      to,
      material
    })
  }

  private removeConnection(key: string, connection: Connection) {
    this.scene.remove(connection.line)
    connection.line.geometry.dispose()
    connection.material.dispose()
    this.connections.delete(key)
  }

  private getConnectionColor(): THREE.Color {
    const t = this.flowIntensity / 100
    const blue = new THREE.Color(this.config.colors.iceBlue)
    const pink = new THREE.Color(this.config.colors.pinkCrystal)
    
    const color = new THREE.Color()
    color.lerpColors(blue, pink, Math.sin(this.time * 0.5 + t) * 0.5 + 0.5)
    return color
  }

  private getOpacity(): number {
    return 0.2 + (this.flowIntensity / 100) * 0.6
  }

  private getLineWidth(): number {
    return 1 + (this.flowIntensity / 100) * 3
  }

  private updateAllConnectionMaterials() {
    for (const connection of this.connections.values()) {
      connection.material.color.copy(this.getConnectionColor())
      connection.material.opacity = this.getOpacity()
      
      if ((connection.material as any).linewidth !== undefined) {
        (connection.material as any).linewidth = this.getLineWidth()
      }
    }
  }

  update(delta: number) {
    this.time += delta

    for (const connection of this.connections.values()) {
      const positions = connection.line.geometry.attributes.position.array as Float32Array
      
      positions[0] = connection.from.mesh.position.x
      positions[1] = connection.from.mesh.position.y
      positions[2] = connection.from.mesh.position.z
      positions[3] = connection.to.mesh.position.x
      positions[4] = connection.to.mesh.position.y
      positions[5] = connection.to.mesh.position.z
      
      connection.line.geometry.attributes.position.needsUpdate = true

      const flowSpeed = 1 + (this.flowIntensity / 100) * 2
      const pulse = Math.sin(this.time * flowSpeed + connection.from.mesh.position.x) * 0.3 + 0.7
      connection.material.opacity = this.getOpacity() * pulse
      
      const t = (Math.sin(this.time * flowSpeed * 0.3) + 1) / 2
      const blue = new THREE.Color(this.config.colors.iceBlue)
      const pink = new THREE.Color(this.config.colors.pinkCrystal)
      connection.material.color.lerpColors(blue, pink, t)
    }
  }

  dispose() {
    for (const [key, connection] of this.connections) {
      this.removeConnection(key, connection)
    }
  }
}
