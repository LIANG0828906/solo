import * as THREE from 'three'
import type { NeuronNode, Vec3, DendriteSegment, AxonSegment } from '../types/neuralTypes'

const randomRange = (min: number, max: number): number => Math.random() * (max - min) + min

const randomUnitVector = (): Vec3 => {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi),
  }
}

const addVectors = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
const scaleVector = (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s })
const vectorLength = (v: Vec3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
const normalizeVector = (v: Vec3): Vec3 => {
  const len = vectorLength(v) || 1
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

const generateDendriteBranch = (origin: Vec3, direction: Vec3, depth: number, startRadius: number): DendriteSegment[] => {
  const segments: DendriteSegment[] = []
  if (depth <= 0) return segments

  const length = randomRange(0.6, 1.2)
  const angleOffset = randomRange(-0.4, 0.4)
  const dir = normalizeVector({
    x: direction.x + angleOffset,
    y: direction.y + angleOffset * 0.5,
    z: direction.z - angleOffset,
  })
  const end = addVectors(origin, scaleVector(dir, length))
  const endRadius = startRadius * 0.7

  segments.push({ start: origin, end, radius: startRadius })

  if (depth > 1 && Math.random() > 0.3) {
    const branchDir1 = normalizeVector(addVectors(dir, { x: randomRange(-0.5, 0.5), y: randomRange(-0.5, 0.5), z: randomRange(-0.5, 0.5) }))
    const branchDir2 = normalizeVector(addVectors(dir, { x: randomRange(-0.5, 0.5), y: randomRange(-0.5, 0.5), z: randomRange(-0.5, 0.5) }))
    segments.push(...generateDendriteBranch(end, branchDir1, depth - 1, endRadius))
    segments.push(...generateDendriteBranch(end, branchDir2, depth - 1, endRadius))
  } else if (depth > 1) {
    segments.push(...generateDendriteBranch(end, dir, depth - 1, endRadius))
  }

  return segments
}

const generateAxon = (origin: Vec3, direction: Vec3): { segments: AxonSegment[]; terminal: Vec3 } => {
  const segments: AxonSegment[] = []
  let current = origin
  let dir = direction
  const segmentCount = Math.floor(randomRange(5, 8))

  for (let i = 0; i < segmentCount; i++) {
    const length = randomRange(0.8, 1.5)
    dir = normalizeVector({
      x: dir.x + randomRange(-0.3, 0.3),
      y: dir.y + randomRange(-0.3, 0.3),
      z: dir.z + randomRange(-0.3, 0.3),
    })
    const end = addVectors(current, scaleVector(dir, length))
    segments.push({ start: current, end })
    current = end
  }

  return { segments, terminal: current }
}

export const generateNeurons = (count: number): NeuronNode[] => {
  const neurons: NeuronNode[] = []
  const sphereRadius = 5

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = Math.cbrt(Math.random()) * sphereRadius * 0.8
    const position: Vec3 = {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
    }

    const somaRadius = randomRange(0.4, 0.6)
    const dendriteCount = Math.floor(randomRange(3, 7))
    const dendrites: DendriteSegment[][] = []
    const dendriteOrigins: Vec3[] = []

    for (let d = 0; d < dendriteCount; d++) {
      const dir = randomUnitVector()
      const origin = addVectors(position, scaleVector(dir, somaRadius))
      dendriteOrigins.push(origin)
      dendrites.push(generateDendriteBranch(origin, dir, 3, 0.08))
    }

    const axonDir = randomUnitVector()
    const axonOrigin = addVectors(position, scaleVector(axonDir, somaRadius))
    const axonResult = generateAxon(axonOrigin, axonDir)

    neurons.push({
      id: `neuron-${i}-${Date.now()}`,
      position,
      somaRadius,
      dendrites,
      axon: axonResult.segments,
      axonTerminal: axonResult.terminal,
      dendriteOrigins,
    })
  }

  return neurons
}
