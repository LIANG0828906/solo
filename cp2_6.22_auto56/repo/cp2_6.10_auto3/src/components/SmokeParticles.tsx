import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useIncenseStore } from '@/store/useIncenseStore'
import {
  createParticleData,
  getSpawnPoints,
  spawnParticle,
  updateParticles,
  hexToRgb,
  SPAWN_POINTS,
} from '@/utils/physics'
import {
  SCENE_CONSTANTS,
  PARTICLE_CONSTANTS,
  INCENSE_COLORS,
} from '@/utils/constants'

import smokeVertex from '@/shaders/smokeVertex.glsl?raw'
import smokeFragment from '@/shaders/smokeFragment.glsl?raw'

export function SmokeParticles() {
  const { incenseType, fan, doorWindow, setParticleCount } = useIncenseStore()
  const pointsRef = useRef<THREE.Points>(null)
  const spawnTimerRef = useRef(0)

  const { MAX_PARTICLES, MIN_SIZE, MAX_SIZE, SPAWN_RATE, THROTTLE_THRESHOLD, THROTTLE_FACTOR } = PARTICLE_CONSTANTS

  const particleData = useMemo(() => createParticleData(MAX_PARTICLES), [MAX_PARTICLES])
  const spawnPoints = useMemo(
    () => getSpawnPoints(SCENE_CONSTANTS.STOVE_POSITION, SPAWN_POINTS),
    []
  )

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(particleData.position, 3))
    geo.setAttribute('aLife', new THREE.BufferAttribute(particleData.life, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(particleData.size, 1))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(particleData.alpha, 1))
    return geo
  }, [particleData])

  const incenseColor = useMemo(() => hexToRgb(INCENSE_COLORS[incenseType]), [incenseType])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(...incenseColor) },
      },
      vertexShader: smokeVertex,
      fragmentShader: smokeFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [incenseColor])

  useEffect(() => {
    material.uniforms.uColor.value = new THREE.Color(...incenseColor)
  }, [incenseColor, material])

  useFrame((_, delta) => {
    spawnTimerRef.current += delta

    const throttleFactor =
      useIncenseStore.getState().particleCount > THROTTLE_THRESHOLD ? THROTTLE_FACTOR : 1
    const spawnInterval = 1 / (SPAWN_RATE * throttleFactor)

    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0

      let spawned = 0
      for (let i = 0; i < MAX_PARTICLES && spawned < SPAWN_POINTS; i++) {
        if (particleData.active[i] === 0) {
          spawnParticle(particleData, i, spawnPoints, MIN_SIZE, MAX_SIZE)
          spawned++
        }
      }
    }

    const activeCount = updateParticles(
      particleData,
      delta,
      fan.level,
      fan.angle,
      SCENE_CONSTANTS.FAN_POSITION,
      doorWindow,
      SCENE_CONSTANTS.STOVE_POSITION
    )

    setParticleCount(activeCount)

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      const lifeAttr = pointsRef.current.geometry.getAttribute('aLife') as THREE.BufferAttribute
      const sizeAttr = pointsRef.current.geometry.getAttribute('aSize') as THREE.BufferAttribute
      const alphaAttr = pointsRef.current.geometry.getAttribute('aAlpha') as THREE.BufferAttribute

      posAttr.needsUpdate = true
      lifeAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
      alphaAttr.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  )
}
