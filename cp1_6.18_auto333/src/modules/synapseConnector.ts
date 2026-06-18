import type { NeuronNode, SynapseConnection, Vec3 } from '../types/neuralTypes'

const generateId = (): string => `synapse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const vec3Sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const vec3Add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
const vec3Scale = (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s })
const vec3Len = (v: Vec3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
const vec3Norm = (v: Vec3): Vec3 => {
  const l = vec3Len(v) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}

const generateCurvePath = (from: Vec3, to: Vec3, segments: number = 20): Vec3[] => {
  const path: Vec3[] = []
  const diff = vec3Sub(to, from)
  const len = vec3Len(diff)
  const dir = vec3Norm(diff)
  const perpendicular = vec3Norm({
    x: -dir.y,
    y: dir.x,
    z: dir.z * 0.3,
  })
  const midPoint = vec3Add(from, vec3Scale(diff, 0.5))
  const curveOffset = vec3Scale(perpendicular, len * 0.15)
  const controlPoint = vec3Add(midPoint, curveOffset)

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const oneMinusT = 1 - t
    const p = vec3Add(
      vec3Scale(from, oneMinusT * oneMinusT),
      vec3Add(
        vec3Scale(controlPoint, 2 * oneMinusT * t),
        vec3Scale(to, t * t),
      ),
    )
    path.push(p)
  }
  return path
}

export const createConnection = (
  fromNeuron: NeuronNode | undefined,
  toNeuron: NeuronNode | undefined,
): SynapseConnection | null => {
  if (!fromNeuron || !toNeuron || fromNeuron.id === toNeuron.id) return null

  const toOriginIndex = Math.floor(Math.random() * toNeuron.dendriteOrigins.length)
  const toPosition = toNeuron.dendriteOrigins[toOriginIndex]

  return {
    id: generateId(),
    fromNeuronId: fromNeuron.id,
    toNeuronId: toNeuron.id,
    fromPosition: fromNeuron.axonTerminal,
    toPosition,
    weight: 0.5,
    signalStrength: 5,
    frequency: 1.0,
    selected: false,
    pathPoints: generateCurvePath(fromNeuron.axonTerminal, toPosition),
  }
}

export const updateConnectionPath = (connection: SynapseConnection): SynapseConnection => {
  return {
    ...connection,
    pathPoints: generateCurvePath(connection.fromPosition, connection.toPosition),
  }
}
