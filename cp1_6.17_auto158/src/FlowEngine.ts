import { PipeSegment, PipeNode, pipeNetwork, pipeNodes } from './PipeNetworkData'

export interface Particle {
  id: string
  pipeId: string
  progress: number
  speed: number
}

interface PipeState {
  currentVelocity: number
  targetVelocity: number
}

interface NodeState {
  currentPressure: number
  targetPressure: number
}

export class FlowEngine {
  private pipes: PipeSegment[]
  private nodes: PipeNode[]
  private particles: Particle[] = []
  private pipeStates: Map<string, PipeState> = new Map()
  private nodeStates: Map<string, NodeState> = new Map()
  private valveOpenings: Map<string, number> = new Map()
  private pumpPowers: Map<string, number> = new Map()
  private particlesPerPipe = 100
  private transitionSpeed = 2.0
  private basePressure = 3.0

  constructor() {
    this.pipes = pipeNetwork
    this.nodes = pipeNodes
    this.initPipeStates()
    this.initNodeStates()
    this.initParticles()
  }

  private initPipeStates() {
    for (const pipe of this.pipes) {
      this.pipeStates.set(pipe.id, {
        currentVelocity: pipe.baseVelocity,
        targetVelocity: pipe.baseVelocity
      })
      if (pipe.controlType === 'valve' && pipe.controlId) {
        this.valveOpenings.set(pipe.controlId, 100)
      }
      if (pipe.controlType === 'pump' && pipe.controlId) {
        this.pumpPowers.set(pipe.controlId, 50)
      }
    }
  }

  private initNodeStates() {
    for (const node of this.nodes) {
      this.nodeStates.set(node.id, {
        currentPressure: node.pressure,
        targetPressure: node.pressure
      })
    }
  }

  private initParticles() {
    let particleId = 0
    for (const pipe of this.pipes) {
      const count = this.particlesPerPipe
      for (let i = 0; i < count; i++) {
        this.particles.push({
          id: `p-${particleId++}`,
          pipeId: pipe.id,
          progress: i / count,
          speed: pipe.baseVelocity
        })
      }
    }
  }

  setValveOpening(controlId: string, value: number) {
    this.valveOpenings.set(controlId, value)
    this.recalculateVelocities()
    this.recalculatePressures()
  }

  setPumpPower(controlId: string, value: number) {
    this.pumpPowers.set(controlId, value)
    this.recalculateVelocities()
    this.recalculatePressures()
  }

  private recalculateVelocities() {
    for (const pipe of this.pipes) {
      let velocity = pipe.baseVelocity

      if (pipe.controlType === 'valve' && pipe.controlId) {
        const opening = this.valveOpenings.get(pipe.controlId) ?? 100
        velocity *= opening / 100
      }

      if (pipe.controlType === 'pump' && pipe.controlId) {
        const power = this.pumpPowers.get(pipe.controlId) ?? 50
        const multiplier = 1.0 + (power / 100) * 2.0
        velocity *= multiplier
      }

      const state = this.pipeStates.get(pipe.id)
      if (state) {
        state.targetVelocity = velocity
      }
    }
  }

  private recalculatePressures() {
    const nodePressureMap = new Map<string, number>()
    
    for (const node of this.nodes) {
      nodePressureMap.set(node.id, this.basePressure)
    }

    for (const pipe of this.pipes) {
      const state = this.pipeStates.get(pipe.id)
      if (!state) continue

      const flowRate = state.targetVelocity * pipe.diameter * pipe.diameter

      const startPressure = nodePressureMap.get(pipe.nodeStart) ?? this.basePressure
      const endPressure = startPressure - 0.1 + flowRate * 0.02
      
      const currentEnd = nodePressureMap.get(pipe.nodeEnd) ?? this.basePressure
      nodePressureMap.set(pipe.nodeEnd, Math.max(currentEnd, endPressure))

      if (pipe.controlType === 'pump' && pipe.controlId) {
        const power = this.pumpPowers.get(pipe.controlId) ?? 50
        const boost = (power / 100) * 4.0
        const boostedPressure = (nodePressureMap.get(pipe.nodeEnd) ?? this.basePressure) + boost
        nodePressureMap.set(pipe.nodeEnd, Math.min(boostedPressure, 10.0))
      }

      if (pipe.controlType === 'valve' && pipe.controlId) {
        const opening = this.valveOpenings.get(pipe.controlId) ?? 100
        if (opening < 50) {
          const pressureDrop = (1 - opening / 100) * 2.0
          const endPress = (nodePressureMap.get(pipe.nodeEnd) ?? this.basePressure) - pressureDrop
          nodePressureMap.set(pipe.nodeEnd, Math.max(endPress, 0.5))
        }
      }
    }

    for (const [nodeId, pressure] of nodePressureMap) {
      const state = this.nodeStates.get(nodeId)
      if (state) {
        state.targetPressure = Math.min(Math.max(pressure, 0.0), 10.0)
      }
    }
  }

  update(delta: number) {
    const transitionAmount = this.transitionSpeed * delta

    for (const [pipeId, state] of this.pipeStates) {
      const diff = state.targetVelocity - state.currentVelocity
      if (Math.abs(diff) > 0.001) {
        state.currentVelocity += diff * Math.min(transitionAmount, 1)
      } else {
        state.currentVelocity = state.targetVelocity
      }
    }

    for (const [nodeId, state] of this.nodeStates) {
      const diff = state.targetPressure - state.currentPressure
      if (Math.abs(diff) > 0.001) {
        state.currentPressure += diff * Math.min(transitionAmount, 1)
      } else {
        state.currentPressure = state.targetPressure
      }
    }

    for (const particle of this.particles) {
      const pipeState = this.pipeStates.get(particle.pipeId)
      if (!pipeState) continue

      const pipe = this.pipes.find(p => p.id === particle.pipeId)
      if (!pipe) continue

      const pipeLength = this.getPipeLength(pipe)
      if (pipeLength === 0) continue

      particle.speed = pipeState.currentVelocity

      const progressDelta = (particle.speed * delta) / pipeLength
      particle.progress += progressDelta

      if (particle.progress >= 1.0) {
        particle.progress = particle.progress % 1.0
      }
    }
  }

  private getPipeLength(pipe: PipeSegment): number {
    const dx = pipe.end[0] - pipe.start[0]
    const dy = pipe.end[1] - pipe.start[1]
    const dz = pipe.end[2] - pipe.start[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  getParticles(): Particle[] {
    return this.particles
  }

  getParticlePosition(particle: Particle): [number, number, number] {
    const pipe = this.pipes.find(p => p.id === particle.pipeId)
    if (!pipe) return [0, 0, 0]

    const t = particle.progress
    return [
      pipe.start[0] + (pipe.end[0] - pipe.start[0]) * t,
      pipe.start[1] + (pipe.end[1] - pipe.start[1]) * t,
      pipe.start[2] + (pipe.end[2] - pipe.start[2]) * t
    ]
  }

  getNodePressure(nodeId: string): number {
    const state = this.nodeStates.get(nodeId)
    return state?.currentPressure ?? this.basePressure
  }

  getNodePressures(): Map<string, number> {
    const pressures = new Map<string, number>()
    for (const [nodeId, state] of this.nodeStates) {
      pressures.set(nodeId, state.currentPressure)
    }
    return pressures
  }

  getPipeVelocity(pipeId: string): number {
    const state = this.pipeStates.get(pipeId)
    return state?.currentVelocity ?? 0
  }

  getValveOpening(controlId: string): number {
    return this.valveOpenings.get(controlId) ?? 100
  }

  getPumpPower(controlId: string): number {
    return this.pumpPowers.get(controlId) ?? 50
  }

  getPumpMultiplier(controlId: string): number {
    const power = this.getPumpPower(controlId)
    return 1.0 + (power / 100) * 2.0
  }

  getPipes(): PipeSegment[] {
    return this.pipes
  }

  getNodes(): PipeNode[] {
    return this.nodes
  }
}
