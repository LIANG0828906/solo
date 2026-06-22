export type StructureType =
  | 'anticline'
  | 'syncline'
  | 'normal_fault'
  | 'reverse_fault'
  | 'strike_slip_fault'

export interface StructureParams {
  pressureDirection: number
  stressMagnitude: number
  rockHardness: number
}

export interface MeasurementPoint {
  id: number
  position: [number, number, number]
  layerIndex: number
}

export interface MeasurementResult {
  distance: number
  horizontalAngle: number
  pointA: MeasurementPoint
  pointB: MeasurementPoint
}

export interface DeformedLayer {
  vertices: number[]
  indices: number[]
  colors: number[]
  layerIndex: number
}

export interface DeformationResponse {
  layers: DeformedLayer[]
  layerThickness: number
}

export interface DefaultParamsMap {
  [key: string]: StructureParams
}
