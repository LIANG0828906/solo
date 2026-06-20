import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'
import { gameEngine } from '@/modules/game/GameEngine'
import { constellationEffect } from './ConstellationEffect'
import { interactionHandler } from '@/modules/ui/InteractionHandler'
import { Star, Connection, Particle } from '@/types'

const StarMesh: React.FC<{
  star: Star
  onPointerDown: (e: ThreeEvent<PointerEvent>, starId: string) => void
  starObjectsRef: React.MutableRefObject<Map<string, THREE.Object3D>>
}> = ({ star, onPointerDown, starObjectsRef }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const time = useRef(Math.random() * 100)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    time.current += delta
    const pulse = Math.sin(time.current / star.pulsePeriod * Math.PI * 2) * star.pulseAmplitude
    const baseScale = star.isDragging ? star.size * 1.5 : star.size
    const scale = baseScale + pulse

    meshRef.current.scale.setScalar(scale)
    meshRef.current.position.copy(star.position)

    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale * (star.isDragging ? 3 : 1.5))
      glowRef.current.position.copy(star.position)
    }

    const material = meshRef.current.material as THREE.MeshBasicMaterial
    const brightness = star.brightness
    material.color.setHSL(0.12, 1, 0.3 + brightness * 0.7)
    material.opacity = brightness

    if (glowRef.current) {
      const glowMaterial = glowRef.current.material as THREE.MeshBasicMaterial
      if (star.isDragging) {
        glowMaterial.color.set('#FFD700')
        glowMaterial.opacity = 0.6
      } else if (star.isSelected) {
        glowMaterial.color.set('#FFD700')
        glowMaterial.opacity = 0.3
      } else if (star.isPartOfConstellation) {
        glowMaterial.color.set(star.constellationId ? getConstellationColor(star.constellationId) : '#FFD700')
        glowMaterial.opacity = 0.4
      } else {
        glowMaterial.opacity = 0
      }
    }
  })

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.starId = star.id
      starObjectsRef.current.set(star.id, meshRef.current)
    }
  }, [star.id, starObjectsRef])

  const getConstellationColor = (constellationId: string): string => {
    const constellations = useGameStore.getState().constellations
    const constellation = constellations.find(c => c.id === constellationId)
    return constellation?.themeColor || '#FFD700'
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown(e, star.id)
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          transparent
          opacity={star.brightness}
          color="#FFFFFF"
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          color="#FFD700"
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

const ConnectionLine: React.FC<{
  connection: Connection
  getStarPosition: (starId: string) => THREE.Vector3 | undefined
}> = ({ connection, getStarPosition }) => {
  const [points, setPoints] = useState<[number, number, number][]>([[0, 0, 0], [0, 0, 0]])
  const shakeOffset = useRef(new THREE.Vector3())
  const dashed = !connection.isValid
  const color = connection.isPreview ? '#FFD700' : connection.isValid ? '#FFFFFF' : '#FF4444'
  const opacity = connection.isPreview ? 0.8 : connection.isValid ? 0.6 : 1

  useFrame(() => {
    const fromPos = getStarPosition(connection.from)
    const toPos = getStarPosition(connection.to)

    if (!fromPos || !toPos) return

    if (connection.isShaking) {
      shakeOffset.current.set(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      )
    } else {
      shakeOffset.current.set(0, 0, 0)
    }

    setPoints([
      [fromPos.x + shakeOffset.current.x, fromPos.y + shakeOffset.current.y, fromPos.z + shakeOffset.current.z],
      [toPos.x + shakeOffset.current.x, toPos.y + shakeOffset.current.y, toPos.z + shakeOffset.current.z]
    ])
  })

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={2}
      dashed={dashed}
      dashSize={0.3}
      gapSize={0.15}
    />
  )
}

const ParticleMesh: React.FC<{ particle: Particle }> = ({ particle }) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.position.copy(particle.position)
    meshRef.current.scale.setScalar(particle.size)

    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = particle.opacity
    material.color.set(particle.color)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        transparent
        opacity={particle.opacity}
        color={particle.color}
      />
    </mesh>
  )
}

const StarDust: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null)
  const time = useRef(0)

  const geometry = useMemo(() => {
    const geo = constellationEffect.createStarDustParticles(500).geometry
    ;(geo as any).originalPositions = new Float32Array(geo.attributes.position.array as Float32Array)
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    time.current += delta
    constellationEffect.animateStarDust(pointsRef.current, time.current)
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

const SceneContent: React.FC<{
  starObjectsRef: React.MutableRefObject<Map<string, THREE.Object3D>>
}> = ({ starObjectsRef }) => {
  const stars = useGameStore(state => state.stars)
  const connections = useGameStore(state => state.connections)
  const particles = useGameStore(state => state.particles)
  const { camera, scene } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    interactionHandler.setCamera(camera)
    interactionHandler.setScene(scene)
  }, [camera, scene])

  useFrame((_, delta) => {
    constellationEffect.updateParticles(delta)
  })

  const getStarPosition = useCallback((starId: string): THREE.Vector3 | undefined => {
    const star = stars.find(s => s.id === starId)
    return star?.position
  }, [stars])

  const handlePointerDown = useCallback((e: React.PointerEvent, starId: string) => {
    const star = stars.find(s => s.id === starId)
    if (star) {
      interactionHandler.handlePointerDown(e, starId, star.position)
    }
  }, [stars])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    interactionHandler.handlePointerMove(e, starObjectsRef.current)
  }, [starObjectsRef])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    interactionHandler.handlePointerUp(e, starObjectsRef.current)
  }, [starObjectsRef])

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    interactionHandler.handlePointerLeave(e)
  }, [])

  const handleSceneClick = useCallback((e: React.MouseEvent) => {
    interactionHandler.handleSceneClick(e, starObjectsRef.current)
  }, [starObjectsRef])

  return (
    <group
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleSceneClick}
    >
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      <StarDust />

      {stars.map(star => (
        <StarMesh
          key={star.id}
          star={star}
          onPointerDown={handlePointerDown}
          starObjectsRef={starObjectsRef}
        />
      ))}

      {connections.map(connection => (
        <ConnectionLine
          key={connection.id}
          connection={connection}
          getStarPosition={getStarPosition}
        />
      ))}

      {particles.map(particle => (
        <ParticleMesh key={particle.id} particle={particle} />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={5}
        maxDistance={25}
        zoomSpeed={0.5}
        rotateSpeed={0.5}
        dampingFactor={0.1}
        enableDamping
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI * 2 / 3}
      />
    </group>
  )
}

export const SceneRenderer: React.FC = () => {
  const starObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const isResetting = useGameStore(state => state.isResetting)
  const [fadeOpacity, setFadeOpacity] = useState(1)

  useEffect(() => {
    if (isResetting) {
      setFadeOpacity(0)
      setTimeout(() => {
        setFadeOpacity(1)
      }, 500)
    }
  }, [isResetting])

  useEffect(() => {
    gameEngine.startGame()
    constellationEffect.start()

    return () => {
      constellationEffect.stop()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        opacity: fadeOpacity,
        transition: 'opacity 0.5s ease-out',
        background: 'linear-gradient(180deg, #0A0B1A 0%, #16213E 100%)'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#0A0B1A', 20, 40]} />
        <SceneContent starObjectsRef={starObjectsRef} />
      </Canvas>
    </div>
  )
}
