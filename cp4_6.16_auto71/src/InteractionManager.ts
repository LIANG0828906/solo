import * as THREE from 'three'
import { Scene3D, HighlightInfo } from './Scene3D'
import { useVoxelStore, VoxelMode, BrushSize, Voxel } from './VoxelStore'

export class InteractionManager {
  private scene3D: Scene3D
  private container: HTMLElement
  private isDragging = false
  private dragStartPos = { x: 0, y: 0 }
  private lastProcessedKey = ''
  private debounceTimer: number | null = null
  private hoverInfo: HighlightInfo | null = null

  constructor(scene3D: Scene3D, container: HTMLElement) {
    this.scene3D = scene3D
    this.container = container
    this.setupEvents()
  }

  private setupEvents() {
    const canvas = this.scene3D.renderer.domElement

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('keydown', this.onKeyDown)

    useVoxelStore.subscribe((state, prev) => {
      if (state.mode !== prev.mode || state.brushSize !== prev.brushSize || state.currentColor !== prev.currentColor) {
        this.updateHoverHighlight()
      }
    })
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
    this.isDragging = true
    this.dragStartPos = { x: e.clientX, y: e.clientY }
    this.lastProcessedKey = ''
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isDragging) return
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.buttons !== 1) return

    const dx = Math.abs(e.clientX - this.dragStartPos.x)
    const dy = Math.abs(e.clientY - this.dragStartPos.y)
    if (dx < 3 && dy < 3) return

    this.processInteraction(true)
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.isDragging) return
    if (e.button !== 0) {
      this.isDragging = false
      return
    }

    const dx = Math.abs(e.clientX - this.dragStartPos.x)
    const dy = Math.abs(e.clientY - this.dragStartPos.y)
    const isClick = dx < 4 && dy < 4

    if (isClick) {
      this.processInteraction(false)
    }

    this.isDragging = false
    this.lastProcessedKey = ''
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (e.shiftKey) {
        useVoxelStore.getState().redo()
      } else {
        useVoxelStore.getState().undo()
      }
    }
    if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      useVoxelStore.getState().redo()
    }
    if (e.key === '1') useVoxelStore.getState().setMode('place')
    if (e.key === '2') useVoxelStore.getState().setMode('remove')
    if (e.key === '3') useVoxelStore.getState().setMode('pick')
  }

  public updateHoverHighlight() {
    const state = useVoxelStore.getState()
    const hit = this.scene3D.getIntersection()
    const info = this.computeHighlightInfo(hit, state.mode, state.brushSize)
    this.hoverInfo = info
    this.scene3D.updateHighlight(info)
  }

  private computeHighlightInfo(
    hit: { voxel?: Voxel; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean },
    mode: VoxelMode,
    brushSize: BrushSize
  ): HighlightInfo | null {
    if (!hit.position && !hit.voxel) return null

    if (mode === 'remove' && hit.voxel) {
      return { x: hit.voxel.x, y: hit.voxel.y, z: hit.voxel.z, face: hit.normal || new THREE.Vector3(), type: 'remove' }
    }

    if (mode === 'pick' && hit.voxel) {
      return { x: hit.voxel.x, y: hit.voxel.y, z: hit.voxel.z, face: hit.normal || new THREE.Vector3(), type: 'hover' }
    }

    if (mode === 'place') {
      let targetX = 0, targetY = 0, targetZ = 0
      if (hit.voxel && hit.normal) {
        targetX = Math.floor(hit.voxel.x + hit.normal.x)
        targetY = Math.floor(hit.voxel.y + hit.normal.y)
        targetZ = Math.floor(hit.voxel.z + hit.normal.z)
      } else if (hit.isFloor && hit.position) {
        targetX = Math.floor(hit.position.x)
        targetY = 0
        targetZ = Math.floor(hit.position.z)
      } else {
        return null
      }
      const half = Math.floor(brushSize / 2)
      targetX -= half
      targetZ -= half
      return { x: targetX, y: targetY, z: targetZ, face: hit.normal || new THREE.Vector3(0, 1, 0), type: 'place' }
    }

    if (hit.voxel) {
      return { x: hit.voxel.x, y: hit.voxel.y, z: hit.voxel.z, face: hit.normal || new THREE.Vector3(), type: 'hover' }
    }
    return null
  }

  private processInteraction(isDragging: boolean) {
    const state = useVoxelStore.getState()
    const hit = this.scene3D.getIntersection()

    if (!hit.position && !hit.voxel) return

    switch (state.mode) {
      case 'place':
        this.handlePlace(hit, state.brushSize, isDragging)
        break
      case 'remove':
        this.handleRemove(hit, state.brushSize, isDragging)
        break
      case 'pick':
        this.handlePick(hit)
        break
    }
  }

  private handlePlace(
    hit: { voxel?: Voxel; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean },
    brushSize: BrushSize,
    isDragging: boolean
  ) {
    let targetX = 0, targetY = 0, targetZ = 0
    if (hit.voxel && hit.normal) {
      targetX = Math.floor(hit.voxel.x + hit.normal.x)
      targetY = Math.floor(hit.voxel.y + hit.normal.y)
      targetZ = Math.floor(hit.voxel.z + hit.normal.z)
    } else if (hit.isFloor && hit.position) {
      targetX = Math.floor(hit.position.x)
      targetY = 0
      targetZ = Math.floor(hit.position.z)
    } else {
      return
    }

    const half = Math.floor(brushSize / 2)
    const positions = this.scene3D.getBrushPositions(targetX, targetY, targetZ, brushSize)

    if (isDragging) {
      const key = positions.map(p => `${p.x},${p.y},${p.z}`).sort().join('|')
      if (key === this.lastProcessedKey) return
      this.lastProcessedKey = key
    }

    const store = useVoxelStore.getState()
    const currentVoxels = new Set(store.voxels.map(v => `${v.x},${v.y},${v.z}`))

    let anyAdded = false
    for (const pos of positions) {
      const k = `${pos.x},${pos.y},${pos.z}`
      if (currentVoxels.has(k)) continue
      if (pos.y < 0) continue
      if (pos.y > 64) continue
      store.addVoxel(pos.x, pos.y, pos.z)
      anyAdded = true
    }
    if (anyAdded) store.triggerPulse()
  }

  private handleRemove(
    hit: { voxel?: Voxel; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean },
    brushSize: BrushSize,
    isDragging: boolean
  ) {
    if (!hit.voxel) return

    const store = useVoxelStore.getState()
    const half = Math.floor(brushSize / 2)
    const baseX = hit.voxel.x
    const baseY = hit.voxel.y
    const baseZ = hit.voxel.z

    if (isDragging) {
      const key = `${baseX},${baseY},${baseZ},s${brushSize}`
      if (key === this.lastProcessedKey) return
      this.lastProcessedKey = key
    }

    let anyRemoved = false
    for (let dx = -half; dx <= half; dx++) {
      for (let dy = 0; dy < brushSize; dy++) {
        for (let dz = -half; dz <= half; dz++) {
          const found = store.voxels.find(
            v => v.x === baseX + dx && v.y === baseY + dy && v.z === baseZ + dz
          )
          if (found) {
            store.removeVoxel(found.id)
            anyRemoved = true
          }
        }
      }
    }
    if (anyRemoved) store.triggerPulse()
  }

  private handlePick(hit: { voxel?: Voxel; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean }) {
    if (!hit.voxel) return
    useVoxelStore.getState().pickColor(hit.voxel.color)
    useVoxelStore.getState().setSelectedVoxel(hit.voxel.id)
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    const canvas = this.scene3D.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }
}
