import * as THREE from 'three'

export type BlockType = 'cube' | 'sphere' | 'tetrahedron'

export interface Block {
  id: string
  type: BlockType
  position: { x: number; y: number; z: number }
  color: string
  mesh: THREE.Mesh
  rotationSpeed: { x: number; y: number; z: number }
}

export interface OperationLog {
  id: string
  timestamp: number
  type: BlockType
  position: { x: number; y: number; z: number }
  flowIntensity: number
  action: 'placed' | 'removed'
}

interface GlobalConfig {
  MAX_BLOCKS: number
  BLOCK_SIZE: number
  SNAP_GRID: number
  colors: {
    iceBlue: string
    pinkCrystal: string
    background: string
  }
}

const BLOCK_COLORS = [
  '#00bfff',
  '#ff6eb4',
  '#a855f7',
  '#22d3ee',
  '#f472b6',
  '#60a5fa'
]

export class CubeController {
  private scene: THREE.Scene
  private config: GlobalConfig
  private blocks: Block[] = []
  private currentType: BlockType = 'cube'
  private selectedBlock: Block | null = null
  private previewMesh: THREE.Mesh | null = null
  
  private geometryCache: Map<BlockType, THREE.BufferGeometry> = new Map()
  private materialCache: Map<string, THREE.MeshPhysicalMaterial> = new Map()

  constructor(scene: THREE.Scene, config: GlobalConfig) {
    this.scene = scene
    this.config = config
    this.initGeometries()
    this.createPreviewMesh()
  }

  private initGeometries() {
    const size = this.config.BLOCK_SIZE
    this.geometryCache.set('cube', new THREE.BoxGeometry(size, size, size))
    this.geometryCache.set('sphere', new THREE.SphereGeometry(size * 0.6, 32, 32))
    this.geometryCache.set('tetrahedron', new THREE.TetrahedronGeometry(size * 0.7))
  }

  private createMaterial(color: string): THREE.MeshPhysicalMaterial {
    const cacheKey = color
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
      transmission: 0.5,
      thickness: 0.5,
      emissive: color,
      emissiveIntensity: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    })

    this.materialCache.set(cacheKey, material)
    return material
  }

  private createPreviewMesh() {
    const geometry = this.geometryCache.get(this.currentType)!
    const material = new THREE.MeshBasicMaterial({
      color: 0x00bfff,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    })
    this.previewMesh = new THREE.Mesh(geometry, material)
    this.previewMesh.visible = false
    this.scene.add(this.previewMesh)
  }

  private updatePreviewGeometry() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh)
      const geometry = this.geometryCache.get(this.currentType)!
      this.previewMesh.geometry = geometry
      this.scene.add(this.previewMesh)
    }
  }

  setCurrentType(type: BlockType) {
    this.currentType = type
    this.updatePreviewGeometry()
  }

  getCurrentType(): BlockType {
    return this.currentType
  }

  canPlaceBlock(position: THREE.Vector3): boolean {
    if (this.blocks.length >= this.config.MAX_BLOCKS) {
      return false
    }
    
    for (const block of this.blocks) {
      const dx = Math.abs(block.position.x - position.x)
      const dz = Math.abs(block.position.z - position.z)
      if (dx < 0.1 && dz < 0.1) {
        return false
      }
    }
    
    return true
  }

  placeBlock(position: THREE.Vector3): OperationLog | null {
    if (!this.canPlaceBlock(position)) {
      return null
    }

    const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]
    const geometry = this.geometryCache.get(this.currentType)!
    const material = this.createMaterial(color)
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.position.y = 0
    
    const edges = new THREE.EdgesGeometry(geometry)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    })
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial)
    mesh.add(edgeLines)

    const light = new THREE.PointLight(color, 0.5, 3)
    mesh.add(light)

    this.scene.add(mesh)

    const rotationSpeed = {
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.3,
      z: (Math.random() - 0.5) * 0.3
    }

    const block: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.currentType,
      position: { x: position.x, y: 0, z: position.z },
      color,
      mesh,
      rotationSpeed
    }

    this.blocks.push(block)
    this.selectedBlock = block

    const flowSlider = document.getElementById('flow-slider') as HTMLInputElement
    const flowIntensity = flowSlider ? parseInt(flowSlider.value) : 50

    return {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      type: this.currentType,
      position: { x: position.x, y: 0, z: position.z },
      flowIntensity,
      action: 'placed'
    }
  }

  removeBlock(id: string): boolean {
    const index = this.blocks.findIndex(b => b.id === id)
    if (index === -1) return false

    const block = this.blocks[index]
    this.scene.remove(block.mesh)
    block.mesh.geometry.dispose()
    ;(block.mesh.material as THREE.Material).dispose()
    
    this.blocks.splice(index, 1)
    
    if (this.selectedBlock?.id === id) {
      this.selectedBlock = null
    }

    return true
  }

  getBlocks(): Block[] {
    return this.blocks
  }

  getBlockCount(): number {
    return this.blocks.length
  }

  getSelectedBlock(): Block | null {
    return this.selectedBlock
  }

  setSelectedBlock(block: Block | null) {
    this.selectedBlock = block
  }

  updatePreview(position: THREE.Vector3) {
    if (!this.previewMesh) return

    const canPlace = this.canPlaceBlock(position)
    this.previewMesh.visible = true
    this.previewMesh.position.copy(position)
    this.previewMesh.position.y = 0
    
    const material = this.previewMesh.material as THREE.MeshBasicMaterial
    material.color.setHex(canPlace ? 0x00bfff : 0xff4444)
  }

  update(delta: number) {
    for (const block of this.blocks) {
      block.mesh.rotation.x += block.rotationSpeed.x * delta
      block.mesh.rotation.y += block.rotationSpeed.y * delta
      block.mesh.rotation.z += block.rotationSpeed.z * delta

      const pulse = Math.sin(Date.now() * 0.002 + block.mesh.position.x) * 0.1 + 0.3
      const material = block.mesh.material as THREE.MeshPhysicalMaterial
      material.emissiveIntensity = pulse
    }
  }

  dispose() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh)
      this.previewMesh.geometry.dispose()
      ;(this.previewMesh.material as THREE.Material).dispose()
    }

    for (const block of this.blocks) {
      this.scene.remove(block.mesh)
      block.mesh.geometry.dispose()
      ;(block.mesh.material as THREE.Material).dispose()
    }

    this.geometryCache.forEach(geo => geo.dispose())
    this.materialCache.forEach(mat => mat.dispose())
  }
}
