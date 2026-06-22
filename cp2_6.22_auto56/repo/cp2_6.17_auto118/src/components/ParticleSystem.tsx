import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleEngine, ForceFieldInput } from '../engine/ParticleEngine'
import vertexShader from '../shaders/particle.vert?raw'
import fragmentShader from '../shaders/particle.frag?raw'
import { useStore, colorPalettes } from '../store/useStore'

interface ParticleSystemProps {
  engineRef: React.MutableRefObject<ParticleEngine | null>
}

export default function ParticleSystem({ engineRef }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { gl, camera } = useThree()

  const particleCount = useStore((state) => state.particleCount)
  const flowSpeed = useStore((state) => state.flowSpeed)
  const forceFieldStrength = useStore((state) => state.forceFieldStrength)
  const colorTheme = useStore((state) => state.colorTheme)
  const forceField = useStore((state) => state.forceField)

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSizeScale: { value: 1.0 }
    }),
    []
  )

  useEffect(() => {
    const engine = new ParticleEngine({
      count: particleCount,
      flowSpeed: flowSpeed,
      colorPalette: colorPalettes[colorTheme]
    })
    engineRef.current = engine

    if (geometryRef.current) {
      const geo = geometryRef.current
      geo.setAttribute('position', new THREE.BufferAttribute(engine.getPositions(), 3))
      geo.setAttribute('aColor', new THREE.BufferAttribute(engine.getColors(), 3))
      geo.setAttribute('aSize', new THREE.BufferAttribute(engine.getSizes(), 1))
    }
  }, [])

  useEffect(() => {
    if (!engineRef.current || !geometryRef.current) return

    const engine = engineRef.current
    engine.setCount(particleCount)

    const geo = geometryRef.current
    geo.setAttribute('position', new THREE.BufferAttribute(engine.getPositions(), 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(engine.getColors(), 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(engine.getSizes(), 1))
    geo.attributes.position.needsUpdate = true
    geo.attributes.aColor.needsUpdate = true
    geo.attributes.aSize.needsUpdate = true
  }, [particleCount])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setFlowSpeed(flowSpeed)
    }
  }, [flowSpeed])

  useEffect(() => {
    if (engineRef.current && geometryRef.current) {
      engineRef.current.setColorPalette(colorPalettes[colorTheme])
      geometryRef.current.attributes.aColor.needsUpdate = true
    }
  }, [colorTheme])

  useFrame((state, delta) => {
    if (!engineRef.current || !geometryRef.current) return

    const engine = engineRef.current
    const geo = geometryRef.current

    let forceFieldInput: ForceFieldInput | undefined
    if (forceField.isActive || forceField.decay > 0) {
      const rect = gl.domElement.getBoundingClientRect()
      const ndcX = ((forceField.x - rect.left) / rect.width) * 2 - 1
      const ndcY = -((forceField.y - rect.top) / rect.height) * 2 + 1

      const vector = new THREE.Vector3(ndcX, ndcY, 0.5)
      vector.unproject(camera)
      const dir = vector.clone().sub(camera.position).normalize()
      const distance = -camera.position.z / dir.z
      const worldPos = camera.position.clone().add(dir.multiplyScalar(distance))

      const forceScale = 0.01
      forceFieldInput = {
        x: worldPos.x,
        y: worldPos.y,
        forceX: forceField.forceX * forceScale,
        forceY: -forceField.forceY * forceScale,
        strength: forceField.strength * forceFieldStrength * 0.5,
        radius: 8
      }
    }

    engine.update(delta, forceFieldInput)

    const positions = geo.attributes.position.array as Float32Array
    const colors = geo.attributes.aColor.array as Float32Array
    const enginePositions = engine.getPositions()
    const engineColors = engine.getColors()

    const count = Math.min(engine.count * 3, positions.length)
    for (let i = 0; i < count; i++) {
      positions[i] = enginePositions[i]
      colors[i] = engineColors[i]
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.aColor.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
