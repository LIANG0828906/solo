import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/audioStore'

const PARTICLE_COUNT = 600

const LOW_COLOR = new THREE.Color('#FF3366')
const MID_COLOR = new THREE.Color('#00E5FF')
const HIGH_COLOR = new THREE.Color('#B388FF')

export function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const basePositions = useRef<Float32Array | null>(null)
  const velocities = useRef<Float32Array | null>(null)
  const sizes = useRef<Float32Array | null>(null)

  const { positions, colors, geometry } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const base = new Float32Array(PARTICLE_COUNT * 3)
    const vel = new Float32Array(PARTICLE_COUNT * 3)
    const siz = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const radius = 2 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      base[i3] = x
      base[i3 + 1] = y
      base[i3 + 2] = z

      vel[i3] = (Math.random() - 0.5) * 0.01
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01
      vel[i3 + 2] = (Math.random() - 0.5) * 0.01

      siz[i] = 3 + Math.random() * 9

      colors[i3] = HIGH_COLOR.r
      colors[i3 + 1] = HIGH_COLOR.g
      colors[i3 + 2] = HIGH_COLOR.b
    }

    basePositions.current = base
    velocities.current = vel
    sizes.current = siz

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(siz, 1))

    return { positions, colors, geometry }
  }, [])

  useFrame((_state, delta) => {
    if (!pointsRef.current) return

    const posAttr = pointsRef.current.geometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute
    const colAttr = pointsRef.current.geometry.getAttribute(
      'color'
    ) as THREE.BufferAttribute

    const posArr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    const state = useAudioStore.getState()
    const freq = state.frequencyData
    const time = state.timeDomainData
    const beat = state.beat
    const volume = state.volume

    const freqLen = freq.length
    const lowBand = Math.floor(freqLen * 0.2)
    const midBand = Math.floor(freqLen * 0.6)

    let lowSum = 0
    let midSum = 0
    let highSum = 0
    for (let i = 0; i < lowBand; i++) lowSum += freq[i]
    for (let i = lowBand; i < midBand; i++) midSum += freq[i]
    for (let i = midBand; i < freqLen; i++) highSum += freq[i]
    const lowAvg = lowSum / lowBand / 255
    const midAvg = midSum / (midBand - lowBand) / 255
    const highAvg = highSum / (freqLen - midBand) / 255

    const base = basePositions.current!
    const vel = velocities.current!

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      const bandIdx = i % freqLen
      let bandValue: number
      let bandColor: THREE.Color

      if (bandIdx < lowBand) {
        bandValue = lowAvg
        bandColor = LOW_COLOR
      } else if (bandIdx < midBand) {
        bandValue = midAvg
        bandColor = MID_COLOR
      } else {
        bandValue = highAvg
        bandColor = HIGH_COLOR
      }

      const freqAmplitude = freq[bandIdx] / 255
      const displacement = freqAmplitude * 2.5 + volume * 1.5

      vel[i3] += (Math.random() - 0.5) * 0.003
      vel[i3 + 1] += (Math.random() - 0.5) * 0.003
      vel[i3 + 2] += (Math.random() - 0.5) * 0.003

      vel[i3] *= 0.96
      vel[i3 + 1] *= 0.96
      vel[i3 + 2] *= 0.96

      const timeOffset = (time[bandIdx] - 128) / 128

      posArr[i3] =
        base[i3] +
        (base[i3] !== 0 ? displacement * (base[i3] / Math.abs(base[i3])) : 0) +
        vel[i3] * 20 +
        timeOffset * 0.3
      posArr[i3 + 1] =
        base[i3 + 1] +
        (base[i3 + 1] !== 0 ? displacement * (base[i3 + 1] / Math.abs(base[i3 + 1])) : 0) +
        vel[i3 + 1] * 20 +
        timeOffset * 0.3
      posArr[i3 + 2] =
        base[i3 + 2] +
        (base[i3 + 2] !== 0 ? displacement * (base[i3 + 2] / Math.abs(base[i3 + 2])) : 0) +
        vel[i3 + 2] * 20 +
        Math.sin(Date.now() * 0.0005 + i * 0.1) * 0.2

      const beatBoost = beat * 0.6
      const mixR = bandColor.r * bandValue + HIGH_COLOR.r * (1 - bandValue) * 0.5
      const mixG = bandColor.g * bandValue + HIGH_COLOR.g * (1 - bandValue) * 0.5
      const mixB = bandColor.b * bandValue + HIGH_COLOR.b * (1 - bandValue) * 0.5

      colArr[i3] = Math.min(1, mixR + beatBoost * 0.5)
      colArr[i3 + 1] = Math.min(1, mixG + beatBoost * 0.3)
      colArr[i3 + 2] = Math.min(1, mixB + beatBoost * 0.7)
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    void delta
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
