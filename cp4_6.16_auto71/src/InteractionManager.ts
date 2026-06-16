import * as THREE from 'three'
import { Scene3D, HighlightInfo } from './Scene3D'
import { useVoxelStore, VoxelMode, BrushSize, Voxel } from './VoxelStore'

type DragMode = 'none' | 'voxel-place' | 'voxel-remove' | 'camera-rotate' | 'camera-pan' | 'axis'

export class InteractionManager {
  private scene3D: Scene3D
  private container: HTMLElement
  private canvas: HTMLCanvasElement

  private dragMode: DragMode = 'none'
  private dragStartPos = { x: 0, y: 0 }
  private lastMousePos = { x: 0, y: 0 }
  private lastProcessedKey = ''
  private lastHoverUpdate = 0

  private hoverInfo: HighlightInfo | null = null

  constructor(scene3D: Scene3D, container: HTMLElement) {
    this.scene3D = scene3D
    this.container = container
    this.canvas = scene3D.renderer.domElement
    this.setupEvents()
  }

  private setupEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerenter', this.onPointerEnter)
    this.canvas.addEventListener('pointerleave', this.onPointerLeave)
    window.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('keydown', this.onKeyDown)

    useVoxelStore.subscribe((state, prev) => {
      if (
        state.mode !== prev.mode ||
        state.brushSize !== prev.brushSize ||
        state.currentColor !== prev.currentColor
      ) {
        this.updateHoverHighlight()
      }
    })
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.target !== this.canvas) return
    e.preventDefault()

    this.lastMousePos = { x: e.clientX, y: e.clientY }
    this.dragStartPos = { x: e.clientX, y: e.clientY }
    this.scene3D.updateMouse(e.clientX, e.clientY)

    if (e.button === 2) {
      this.dragMode = 'camera-pan'
      this.canvas.setPointerCapture(e.pointerId)
      return
    }

    if (e.button !== 0) return

    const axis = this.scene3D.getAxisIntersection()
    if (axis) {
      this.dragMode = 'axis'
      this.scene3D.startAxisDrag(axis)
      this.canvas.setPointerCapture(e.pointerId)
      return
    }

    const state = useVoxelStore.getState()
    const hit = this.scene3D.getIntersection()
    const hasTarget = !!(hit.voxelId || hit.isFloor)

    if (state.mode === 'pick' && hit.voxelId) {
      this.handlePick(hit)
      this.dragMode = 'none'
      return
    }

    if (hasTarget && (state.mode === 'place' || state.mode === 'remove')) {
      this.lastProcessedKey = ''
      this.processVoxelAction(false)
      this.dragMode = state.mode === 'place' ? 'voxel-place' : 'voxel-remove'
      this.canvas.setPointerCapture(e.pointerId)
      return
    }

    this.dragMode = 'camera-rotate'
    this.canvas.setPointerCapture(e.pointerId)
  }

  private onPointerMove = (e: PointerEvent) => {
    this.scene3D.updateMouse(e.clientX, e.clientY)

    const dx = e.clientX - this.lastMousePos.x
    const dy = e.clientY - this.lastMousePos.y

    switch (this.dragMode) {
      case 'camera-rotate':
        this.scene3D.updateCameraRotate(dx, dy)
        this.lastMousePos = { x: e.clientX, y: e.clientY }
        return

      case 'camera-pan':
        this.scene3D.updateCameraPan(dx, dy)
        this.lastMousePos = { x: e.clientX, y: e.clientY }
        return

      case 'axis':
        this.scene3D.updateAxisDrag(dx, dy)
        this.lastMousePos = { x: e.clientX, y: e.clientY }
        return

      case 'voxel-place':
      case 'voxel-remove':
        const distMoved = Math.hypot(
          e.clientX - this.dragStartPos.x,
          e.clientY - this.dragStartPos.y
        )
        if (distMoved > 3) {
          this.processVoxelAction(true)
        }
        this.lastMousePos = { x: e.clientX, y: e.clientY }
        return
    }

    this.lastMousePos = { x: e.clientX, y: e.clientY }

    const now = performance.now()
    if (now - this.lastHoverUpdate > 16) {
      this.lastHoverUpdate = now
      requestAnimationFrame(() => this.updateHoverHighlight())
    }
  }

  private onPointerEnter = (_e: PointerEvent) => {
    this.updateHoverHighlight()
  }

  private onPointerLeave = (_e: PointerEvent) => {
    this.scene3D.updateHighlight(null)
    this.hoverInfo = null
  }

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragMode === 'axis') {
      this.scene3D.endAxisDrag()
    }

    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId)
    }

    this.dragMode = 'none'
    this.lastProcessedKey = ''

    this.updateHoverHighlight()
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.scene3D.zoomCamera(e.deltaY)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (e.shiftKey) {
        useVoxelStore.getState().redo()
      } else {
        useVoxelStore.getState().undo()
      }
      return
    }

    if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      useVoxelStore.getState().redo()
      return
    }

    if (e.key === '1') {
      e.preventDefault()
      useVoxelStore.getState().setMode('place')
    } else if (e.key === '2') {
      e.preventDefault()
      useVoxelStore.getState().setMode('remove')
    } else if (e.key === '3') {
      e.preventDefault()
      useVoxelStore.getState().setMode('pick')
    }

    if (e.key === 'Escape') {
      useVoxelStore.getState().setSelectedVoxel(null)
    }
  }

  public updateHoverHighlight() {
    const state = useVoxelStore.getState()
    const hit = this.scene3D.getIntersection()
    const info = this.computeHighlightInfo(hit, state.mode, state.brushSize)
    this.hoverInfo = info
    this.scene3D.updateHighlight(info)
  }

  private computeHighlightInfo(
    hit: { voxelId?: string; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean },
    mode: VoxelMode,
    brushSize: BrushSize
  ): HighlightInfo | null {
    if (!hit.position && !hit.voxelId) return null

    const store = useVoxelStore.getState()
    const voxel = hit.voxelId ? store.voxels.find(v => v.id === hit.voxelId) : undefined

    if (mode === 'remove' && voxel) {
      return {
        x: voxel.x, y: voxel.y, z: voxel.z,
        face: hit.normal || new THREE.Vector3(),
        type: 'remove',
      }
    }

    if (mode === 'pick' && voxel) {
      return {
        x: voxel.x, y: voxel.y, z: voxel.z,
        face: hit.normal || new THREE.Vector3(),
        type: 'hover',
      }
    }

    if (mode === 'place') {
      let targetX = 0, targetY = 0, targetZ = 0
      if (voxel && hit.normal) {
        targetX = Math.floor(voxel.x + hit.normal.x)
        targetY = Math.floor(voxel.y + hit.normal.y)
        targetZ = Math.floor(voxel.z + hit.normal.z)
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
      return {
        x: targetX, y: targetY, z: targetZ,
        face: hit.normal || new THREE.Vector3(0, 1, 0),
        type: 'place',
      }
    }

    if (voxel) {
      return {
        x: voxel.x, y: voxel.y, z: voxel.z,
        face: hit.normal || new THREE.Vector3(),
        type: 'hover',
      }
    }
    return null
  }

  private processVoxelAction(isDragging: boolean) {
    const state = useVoxelStore.getState()
    const hit = this.scene3D.getIntersection()

    if (!hit.position && !hit.voxelId) return

    switch (state.mode) {
      case 'place':
        this.handlePlace(hit, state.brushSize, isDragging)
        break
      case 'remove':
        this.handleRemove(hit, state.brushSize, isDragging)
        break
    }
  }

  private handlePlace(
    hit: { voxelId?: string; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean },
    brushSize: BrushSize,
    isDragging: boolean
  ) {
    const store = useVoxelStore.getState()
    const voxel = hit.voxelId ? store.voxels.find(v => v.id === hit.voxelId) : undefined

    let targetX = 0, targetY = 0, targetZ = 0
    if (voxel && hit.normal) {
      targetX = Math.floor(voxel.x + hit.normal.x)
      targetY = Math.floor(voxel.y + hit.normal.y)
      targetZ = Math.floor(voxel.z + hit.normal.z)
    } else if (hit.isFloor && hit.position) {
      targetX = Math.floor(hit.position.x)
      targetY = 0
      targetZ = Math.floor(hit.position.z)
    } else {
      return
    }

    const positions = this.scene3D.getBrushPositions(targetX, targetY, targetZ, brushSize)

    if (isDragging) {
      const key = positions.map(p => `${p.x},${p.y},${p.z}`).sort().join('|')
      if (key === this.lastProcessedKey) return
      this.lastProcessedKey = key
    }

    const currentVoxels = new Set(store.voxels.map(v => `${v.x},${v.y},${v.z}`))

    let anyAdded = false
    for (const pos of positions) {
      const k = `${pos.x},${pos.y},${pos.z}`
      if (currentVoxels.has(k)) continue
      if (pos.y < 0) continue
      if (pos.y > 64) continue
      if (pos.x < -32 || pos.x > 31) continue
      if (pos.z < -32 || pos.z > 31) continue
      store.addVoxel(pos.x, pos.y, pos.z)
      anyAdded = true
    }
    if (anyAdded) store.triggerPulse()
  }

  private handleRemove(
    hit: { voxelId?: string; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean },
    brushSize: BrushSize,
    isDragging: boolean
  ) {
    const store = useVoxelStore.getState()
    const voxel = hit.voxelId ? store.voxels.find(v => v.id === hit.voxelId) : undefined

    if (!voxel) return

    const half = Math.floor(brushSize / 2)
    const baseX = voxel.x
    const baseY = voxel.y
    const baseZ = voxel.z

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

  private handlePick(hit: { voxelId?: string }) {
    if (!hit.voxelId) return
    const store = useVoxelStore.getState()
    const voxel = store.voxels.find(v => v.id === hit.voxelId)
    if (!voxel) return
    store.pickColor(voxel.color)
    store.setSelectedVoxel(voxel.id)
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerenter', this.onPointerEnter)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }
}
