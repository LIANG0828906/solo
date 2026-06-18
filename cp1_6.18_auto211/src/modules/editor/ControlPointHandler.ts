import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import { SceneManager } from '../scene/SceneManager'
import { useEditorStore, type ControlPointData } from '@/store/useEditorStore'

export class ControlPointHandler {
  private sceneManager: SceneManager
  private container: HTMLElement
  private activeControlPointId: string | null = null
  private isDragging: boolean = false
  private dragStartY: number = 0
  private dragStartDisplacement: number = 0
  private onMouseDownBound: (e: MouseEvent) => void
  private onMouseMoveBound: (e: MouseEvent) => void
  private onMouseUpBound: (e: MouseEvent) => void
  private enabled: boolean = true

  constructor(sceneManager: SceneManager, container: HTMLElement) {
    this.sceneManager = sceneManager
    this.container = container
    this.onMouseDownBound = this.onMouseDown.bind(this)
    this.onMouseMoveBound = this.onMouseMove.bind(this)
    this.onMouseUpBound = this.onMouseUp.bind(this)
    this.container.addEventListener('mousedown', this.onMouseDownBound)
    this.container.addEventListener('mousemove', this.onMouseMoveBound)
    this.container.addEventListener('mouseup', this.onMouseUpBound)
  }

  setEnabled(v: boolean): void {
    this.enabled = v
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.enabled || !this.sceneManager.model) return
    if (event.button !== 0) return

    const ndc = this.sceneManager.getMouseNDC(event, this.container)
    const raycaster = this.sceneManager.getRaycaster()
    raycaster.setFromCamera(ndc, this.sceneManager.camera)

    const controlPointMeshes = Array.from(this.sceneManager.controlPointMeshes.values())
    const cpHits = raycaster.intersectObjects(controlPointMeshes, true)
    if (cpHits.length > 0) {
      let hitMesh = cpHits[0].object as THREE.Mesh
      while (hitMesh.parent && !hitMesh.userData.controlPointId) {
        hitMesh = hitMesh.parent as THREE.Mesh
      }
      if (hitMesh.userData.controlPointId) {
        this.activeControlPointId = hitMesh.userData.controlPointId
        this.isDragging = true
        this.dragStartY = event.clientY
        this.dragStartDisplacement =
          useEditorStore.getState().controlPoints.find(
            (cp) => cp.id === this.activeControlPointId
          )?.displacement || 0
        useEditorStore.getState().setDragging(true)
        this.sceneManager.controls.enabled = false
        return
      }
    }

    const intersects = raycaster.intersectObject(this.sceneManager.model, true)
    if (intersects.length > 0) {
      const hit = intersects[0]
      const point = hit.point
      const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0)

      const normalMatrix = new THREE.Matrix3().getNormalMatrix(
        hit.object.matrixWorld
      )
      normal.applyMatrix3(normalMatrix).normalize()

      const id = uuidv4()
      const cpData: ControlPointData = {
        id,
        position: [point.x, point.y, point.z],
        normal: [normal.x, normal.y, normal.z],
        displacement: 0,
      }
      useEditorStore.getState().addControlPoint(cpData)
      this.sceneManager.addControlPoint(
        id,
        point,
        normal
      )

      const cpMesh = this.sceneManager.controlPointMeshes.get(id)
      if (cpMesh) {
        cpMesh.userData.basePosition = point.clone()
      }

      this.activeControlPointId = id
      this.isDragging = true
      this.dragStartY = event.clientY
      this.dragStartDisplacement = 0
      useEditorStore.getState().setDragging(true)
      this.sceneManager.controls.enabled = false
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.activeControlPointId) return

    const deltaY = event.clientY - this.dragStartY
    const displacement = this.dragStartDisplacement - deltaY * 0.02

    useEditorStore.getState().updateControlPoint(
      this.activeControlPointId,
      displacement
    )
    this.sceneManager.updateControlPoint(this.activeControlPointId, displacement)
  }

  private onMouseUp(): void {
    if (!this.isDragging || !this.activeControlPointId) return

    const cp = useEditorStore
      .getState()
      .controlPoints.find((c) => c.id === this.activeControlPointId)

    if (cp && cp.displacement !== 0) {
      useEditorStore.getState().pushHistory({
        type: 'drag',
        subdivisionLevel: useEditorStore.getState().subdivisionLevel,
        noiseIntensity: useEditorStore.getState().noiseIntensity,
        smoothness: useEditorStore.getState().smoothness,
        vertexPositions: [],
        controlPoints: [{ ...cp }],
      } as any)
    }

    this.sceneManager.removeControlPoint(this.activeControlPointId)
    useEditorStore.getState().removeControlPoint(this.activeControlPointId)

    this.activeControlPointId = null
    this.isDragging = false
    useEditorStore.getState().setDragging(false)
    this.sceneManager.controls.enabled = true
  }

  dispose(): void {
    this.container.removeEventListener('mousedown', this.onMouseDownBound)
    this.container.removeEventListener('mousemove', this.onMouseMoveBound)
    this.container.removeEventListener('mouseup', this.onMouseUpBound)
  }
}
