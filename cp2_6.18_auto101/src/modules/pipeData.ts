import * as THREE from 'three'
import { usePipeStore, Pipe, PipeType } from '../store/pipeStore'

export interface RawPipeData {
  id?: string
  start: { x: number; y: number; z: number }
  end: { x: number; y: number; z: number }
  radius: number
  type: PipeType
  depth: number
}

let pipeIdCounter = 0

const generateId = (): string => {
  pipeIdCounter++
  return `pipe_${pipeIdCounter}`
}

export const parsePipeData = (rawData: RawPipeData[]): Pipe[] => {
  return rawData.map(item => ({
    id: item.id || generateId(),
    type: item.type,
    start: new THREE.Vector3(item.start.x, item.start.y, item.start.z),
    end: new THREE.Vector3(item.end.x, item.end.y, item.end.z),
    radius: item.radius,
    depth: item.depth
  }))
}

export const addPipe = (rawData: RawPipeData): Pipe => {
  const pipe = parsePipeData([rawData])[0]
  usePipeStore.getState().addPipe(pipe)
  return pipe
}

export const removePipe = (id: string): void => {
  usePipeStore.getState().removePipe(id)
}

export const initDefaultPipes = (): Pipe[] => {
  const defaultPipes: RawPipeData[] = [
    {
      type: 'water',
      start: { x: -20, y: -5, z: 0 },
      end: { x: 20, y: -5, z: 0 },
      radius: 1.0,
      depth: 5.0
    },
    {
      type: 'power',
      start: { x: 0, y: -15, z: -10 },
      end: { x: 0, y: 5, z: -10 },
      radius: 0.8,
      depth: 10.0
    },
    {
      type: 'gas',
      start: { x: -15, y: -8, z: 10 },
      end: { x: 15, y: -3, z: -10 },
      radius: 0.9,
      depth: 7.5
    }
  ]

  const pipes = parsePipeData(defaultPipes)
  usePipeStore.getState().setPipes(pipes)
  return pipes
}

export const getPipeTypeColor = (type: PipeType): number => {
  switch (type) {
    case 'water': return 0x2196F3
    case 'power': return 0xFFEB3B
    case 'gas': return 0xFF9800
    default: return 0xffffff
  }
}

export const getPipeTypeName = (type: PipeType): string => {
  switch (type) {
    case 'water': return '供水管线'
    case 'power': return '电力管线'
    case 'gas': return '燃气管线'
    default: return '未知管线'
  }
}

export const getPipeTypeAbbr = (type: PipeType): string => {
  switch (type) {
    case 'water': return 'W'
    case 'power': return 'P'
    case 'gas': return 'G'
    default: return '?'
  }
}
