import * as THREE from 'three'
import type { TerrainRenderer } from './terrainRenderer'
import { worldToLatLon, haversineDistance } from '@/utils/geo'
import type { MeasurementResult, MeasurementPoint } from '@/types'

export class InteractionHandler {
  private renderer: TerrainRenderer
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private container: HTMLElement
  private measureMode = false
  private measurePoints: MeasurementPoint[] = []
  private onMeasure: ((result: MeasurementResult | null) => void) | null = null
  private onHover: ((latLon: { lat: number; lon: number; elevation: number } | null) => void) | null = null

  constructor(renderer: TerrainRenderer, container: HTMLElement) {
    this.renderer = renderer
    this.container = container
    this.container.addEventListener('click', this.onClick)
    this.container.addEventListener('mousemove', this.onMouseMove)
  }

  setMeasureMode(enabled: boolean): void {
    this.measureMode = enabled
    if (!enabled) {
      this.measurePoints = []
    }
  }

  get isMeasureMode(): boolean {
    return this.measureMode
  }

  setOnMeasure(cb: (result: MeasurementResult | null) => void): void {
    this.onMeasure = cb
  }

  setOnHover(cb: (latLon: { lat: number; lon: number; elevation: number } | null) => void): void {
    this.onHover = cb
  }

  clearMeasurement(): void {
    this.measurePoints = []
    this.renderer.clearMeasurement()
    if (this.onMeasure) this.onMeasure(null)
  }

  private getIntersection(event: MouseEvent): THREE.Intersection | null {
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouse, this.renderer.camera)
    const intersects = this.raycaster.intersectObjects(this.renderer.terrainGroup.children, false)
    return intersects.length > 0 ? intersects[0] : null
  }

  private onClick = (event: MouseEvent): void => {
    if (!this.measureMode) return

    const hit = this.getIntersection(event)
    if (!hit || !hit.face) return

    const point = hit.point
    const latLon = worldToLatLon(point.x, point.z)
    const heightScale = 0.005
    const elevation = point.y / heightScale

    const measurePoint: MeasurementPoint = {
      position: { x: point.x, y: point.y, z: point.z },
      latLon,
      elevation,
    }

    this.measurePoints.push(measurePoint)

    if (this.measurePoints.length === 2) {
      const [a, b] = this.measurePoints
      const distance = haversineDistance(a.latLon.lat, a.latLon.lon, b.latLon.lat, b.latLon.lon)
      const elevationDiff = Math.abs(a.elevation - b.elevation)
      const start = new THREE.Vector3(a.position.x, a.position.y, a.position.z)
      const end = new THREE.Vector3(b.position.x, b.position.y, b.position.z)
      this.renderer.addMeasurementLine(start, end)

      const result: MeasurementResult = { pointA: a, pointB: b, distance, elevationDiff }
      if (this.onMeasure) this.onMeasure(result)
      this.measurePoints = []
    }
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.onHover) return
    const hit = this.getIntersection(event)
    if (hit && hit.point) {
      const latLon = worldToLatLon(hit.point.x, hit.point.z)
      const heightScale = 0.005
      const elevation = hit.point.y / heightScale
      this.onHover({ lat: latLon.lat, lon: latLon.lon, elevation })
    } else {
      this.onHover(null)
    }
  }

  dispose(): void {
    this.container.removeEventListener('click', this.onClick)
    this.container.removeEventListener('mousemove', this.onMouseMove)
  }
}
