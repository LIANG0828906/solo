import * as THREE from 'three'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface DendriteSegment {
  start: Vec3
  end: Vec3
  radius: number
}

export interface AxonSegment {
  start: Vec3
  end: Vec3
}

export interface NeuronNode {
  id: string
  position: Vec3
  somaRadius: number
  dendrites: DendriteSegment[][]
  axon: AxonSegment[]
  axonTerminal: Vec3
  dendriteOrigins: Vec3[]
}

export interface SynapseConnection {
  id: string
  fromNeuronId: string
  toNeuronId: string
  fromPosition: Vec3
  toPosition: Vec3
  weight: number
  signalStrength: number
  frequency: number
  selected: boolean
  pathPoints: Vec3[]
}

export interface SignalParticle {
  id: string
  connectionId: string
  position: Vec3
  progress: number
  size: number
  active: boolean
}

export interface AnimationState {
  playing: boolean
  particles: SignalParticle[]
  lastEmitTime: Record<string, number>
}

export type ModuleApi = {
  neuronGenerator: {
    generateNeurons: (count: number) => NeuronNode[]
  }
  synapseConnector: {
    createConnection: (fromId: string, toId: string) => SynapseConnection | null
    removeConnection: (id: string) => void
    updateConnection: (id: string, updates: Partial<SynapseConnection>) => void
  }
  signalAnimator: {
    startAnimation: () => void
    pauseAnimation: () => void
    resetAnimation: () => void
    update: (delta: number) => void
  }
}
