import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import { useDye } from './App'
import { DyeColor, getDyeSpeedMultiplier, calculateDyeColor } from './colorEngine'

interface Particle {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

const WALL_COLOR = '#9bb7c4'
const FLOOR_COLOR = '#7a7a7a'
const WOOD_COLOR = '#8b5a2b'
const HOVER_GLOW = '#ffd54f'

const DYE_VAT_COLORS: Record<string, string> = {
  red: '#6b2a1d',
  blue: '#1a3a5c',
  yellow: '#a67c1a',
}

const DYE_VAT_POSITIONS: Record<string, [number, number, number]> = {
  red: [-2.2, 0, 0],
  blue: [0, 0, 0],
  yellow: [2.2, 0, 0],
}

function DyeVat({ color, position, onDrop, hoveredVat, setHoveredVat }: {
  color: DyeColor
  position: [number, number, number]
  onDrop: (color: DyeColor) => void
  hoveredVat: DyeColor | null
  setHoveredVat: (v: DyeColor | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const liquidRef = useRef<THREE.Mesh>(null)
  const [time, setTime] = useState(0)

  useFrame((_, delta) => {
    setTime(t => t + delta)
    if (liquidRef.current && liquidRef.current.material instanceof THREE.MeshStandardMaterial) {
      const waveOffset = Math.sin(time * 2) * 0.02
      liquidRef.current.position.y = 0.65 + waveOffset
    }
  })

  const isHovered = hoveredVat === color

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredVat(color)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredVat(null)
    document.body.style.cursor = 'auto'
  }

  const handleDrop = (e: ThreeEvent<DragEvent>) => {
    e.stopPropagation()
    onDrop(color)
  }

  const liquidGradient = useMemo(() => {
    const baseColor = DYE_VAT_COLORS[color!]
    return `radial-gradient(circle at 50% 50%, ${baseColor} 0%, ${baseColor}dd 40%, ${baseColor}aa 70%, ${baseColor}88 100%)`
  }, [color])

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.3, 1, 32, 1, true]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>

      {[0.15, 0.5, 0.85].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[1.15, 0.05, 8, 32]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.1, 32]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
      </mesh>

      <mesh
        ref={liquidRef}
        position={[0, 0.65, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onDrop={handleDrop}
      >
        <circleGeometry args={[1.05, 32]} />
        <meshBasicMaterial
          color={DYE_VAT_COLORS[color!]}
          transparent
          opacity={0.9}
        />
      </mesh>

      {isHovered && (
        <mesh position={[0, 0.66, 0]}>
          <ringGeometry args={[1.05, 1.15, 32]} />
          <meshBasicMaterial color={HOVER_GLOW} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function Cloth({
  position,
  color,
  dyeProgress,
  oxidationProgress,
  mordantProgress,
  isDragging,
  onPointerDown,
  targetPosition,
}: {
  position: [number, number, number]
  color: DyeColor
  dyeProgress: number
  oxidationProgress: number
  mordantProgress: number
  isDragging: boolean
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  targetPosition: [number, number, number]
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [waveOffset, setWaveOffset] = useState(0)

  const clothWidth = 0.6
  const clothHeight = 0.8
  const segmentsW = 12
  const segmentsH = 16

  const { baseColor, mordant, temperature } = useDye()

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(clothWidth, clothHeight, segmentsW, segmentsH)
    const positions = geo.attributes.position
    const colors = new Float32Array(positions.count * 3)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      const distFromCenter = Math.sqrt(x * x + y * y)
      const maxDist = Math.sqrt((clothWidth / 2) ** 2 + (clothHeight / 2) ** 2)
      const edgeFactor = Math.min(1, distFromCenter / (maxDist * 0.8))

      const wave = Math.sin(y * 10 + waveOffset) * 0.01
      positions.setZ(i, z + wave)

      const currentColor = calculateDyeColor(baseColor, oxidationProgress, mordant, mordantProgress)
      const effectiveProgress = Math.min(1, dyeProgress * edgeFactor + (1 - edgeFactor) * dyeProgress * 0.3)

      const clothColor = new THREE.Color()
      if (effectiveProgress < 0.01) {
        clothColor.set('#ffffff')
      } else {
        clothColor.set(currentColor.hex)
        const white = new THREE.Color('#ffffff')
        clothColor.lerp(white, 1 - effectiveProgress)
      }

      colors[i * 3] = clothColor.r
      colors[i * 3 + 1] = clothColor.g
      colors[i * 3 + 2] = clothColor.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [color, dyeProgress, oxidationProgress, mordantProgress, baseColor, mordant, waveOffset])

  useFrame((_, delta) => {
    if (groupRef.current) {
      const target = new THREE.Vector3(...targetPosition)
      groupRef.current.position.lerp(target, isDragging ? 1 : 0.1)

      const targetRotX = dyeProgress >= 1 && oxidationProgress < 0.01 ? -Math.PI / 2 : 0
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.1)
    }

    if (meshRef.current) {
      if (clicked) {
        meshRef.current.scale.lerp(new THREE.Vector3(0.95, 0.95, 0.95), 0.3)
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2)
      }
    }

    if (dyeProgress < 1 || isDragging) {
      setWaveOffset(w => w + delta * 5)
    }
  })

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'grab'
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setClicked(true)
    setTimeout(() => setClicked(false), 150)
    onPointerDown(e)
  }

  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0.05}
          transparent
          opacity={0.95}
        />
      </mesh>

      {hovered && (
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[clothWidth + 0.08, clothHeight + 0.08]} />
          <meshBasicMaterial color={HOVER_GLOW} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function ClothRack() {
  const { baseColor, dyeProgress } = useDye()
  const showEmpty = baseColor !== null && dyeProgress > 0

  return (
    <group position={[-4.5, 0, 0]}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.1, 3, 0.1]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, -0.6]}>
        <boxGeometry args={[0.1, 3, 0.1]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.9, -0.3]}>
        <boxGeometry args={[0.1, 0.1, 0.7]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.8, -0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
      </mesh>

      {!showEmpty && (
        <group position={[0, 1.4, -0.3]}>
          {[-0.3, -0.1, 0.1, 0.3].map((offset, i) => (
            <mesh key={i} position={[offset, -0.4, 0]} rotation={[0, 0, Math.PI * 0.05 * (i - 1.5)]}>
              <planeGeometry args={[0.15, 0.6]} />
              <meshStandardMaterial color="#fafafa" side={THREE.DoubleSide} roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

function MordantBath({ active }: { active: boolean }) {
  const [bubbles, setBubbles] = useState<{ id: string; x: number; z: number; offset: number }[]>([])

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        setBubbles(prev => {
          const newBubbles = [...prev, {
            id: uuidv4(),
            x: (Math.random() - 0.5) * 1.2,
            z: (Math.random() - 0.5) * 0.6,
            offset: Math.random() * Math.PI * 2,
          }]
          return newBubbles.slice(-20)
        })
      }, 200)
      return () => clearInterval(interval)
    } else {
      setBubbles([])
    }
  }, [active])

  useFrame((_, delta) => {
    setBubbles(prev => prev.map(b => ({ ...b, offset: b.offset + delta * 3 })))
  })

  return (
    <group position={[4.2, 0, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 1]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.8]} />
        <meshStandardMaterial
          color={active ? '#f5f5f5' : '#e8e8e8'}
          transparent
          opacity={active ? 0.85 : 0.6}
        />
      </mesh>

      {bubbles.map(bubble => (
        <mesh
          key={bubble.id}
          position={[
            bubble.x,
            0.6 + Math.sin(bubble.offset) * 0.1 + (bubble.offset % 5) * 0.05,
            bubble.z,
          ]}
        >
          <sphereGeometry args={[0.02 + Math.random() * 0.02, 8, 8]} />
          <meshBasicMaterial color="rgba(255,255,255,0.7)" transparent />
        </mesh>
      ))}
    </group>
  )
}

function SplashParticles({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map(p => (
        <mesh key={p.id} position={p.position.toArray()}>
          <sphereGeometry args={[p.size * (1 - p.life / p.maxLife) * 0.5, 8, 8]} />
          <meshBasicMaterial
            color="#4a90d9"
            transparent
            opacity={(1 - p.life / p.maxLife) * 0.6}
          />
        </mesh>
      ))}
    </>
  )
}

function Workshop() {
  return (
    <>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.5, -3]} receiveShadow>
        <boxGeometry args={[14, 3, 0.2]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-7, 1.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 3, 6]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>

      <mesh position={[7, 1.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 3, 6]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.95} />
      </mesh>

      <mesh position={[-5.5, 2.8, -1]}>
        <boxGeometry args={[3, 0.1, 0.15]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
      </mesh>
      <mesh position={[-5.5, 2.8, 0]}>
        <boxGeometry args={[3, 0.1, 0.15]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
      </mesh>
    </>
  )
}

const Scene: React.FC = () => {
  const {
    baseColor,
    setBaseColor,
    dyeProgress,
    setDyeProgress,
    oxidationProgress,
    setOxidationProgress,
    mordant,
    mordantProgress,
    setMordantProgress,
    isOxidizing,
    setIsOxidizing,
    isMordanting,
    setIsMordanting,
    temperature,
    oxidationTime,
  } = useDye()

  const [dragging, setDragging] = useState(false)
  const [clothPosition, setClothPosition] = useState<[number, number, number]>([-4.5, 1.5, 0])
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>([-4.5, 1.5, 0])
  const [hoveredVat, setHoveredVat] = useState<DyeColor | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [clothDropped, setClothDropped] = useState(false)
  const [currentDyeingColor, setCurrentDyeingColor] = useState<DyeColor>(null)

  const createSplash = useCallback((position: [number, number, number]) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.5 + Math.random() * 1
      newParticles.push({
        id: uuidv4(),
        position: new THREE.Vector3(...position),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          1 + Math.random() * 1.5,
          Math.sin(angle) * speed
        ),
        life: 0.8,
        maxLife: 0.8,
        size: 0.04 + Math.random() * 0.04,
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }, [])

  const handleClothPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!baseColor && !isOxidizing && !isMordanting) {
      e.stopPropagation()
      setDragging(true)
    }
  }, [baseColor, isOxidizing, isMordanting])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (dragging) {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        const worldX = x * 7
        const worldY = y * 4 + 1
        const worldZ = hoveredVat ? 0.5 : 0

        setTargetPosition([worldX, worldY, worldZ])
      }
    }
  }, [dragging, hoveredVat])

  const handlePointerUp = useCallback(() => {
    if (dragging && hoveredVat) {
      const vatPos = DYE_VAT_POSITIONS[hoveredVat]
      setTargetPosition([vatPos[0], 0.1, vatPos[2]])
      setCurrentDyeingColor(hoveredVat)
      setBaseColor(hoveredVat)
      setClothDropped(true)
      createSplash([vatPos[0], 0.7, vatPos[2]])
      setDyeProgress(0)
    }
    setDragging(false)
  }, [dragging, hoveredVat, setBaseColor, createSplash, setDyeProgress])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useFrame((_, delta) => {
    const startTime = performance.now()

    if (clothDropped && dyeProgress < 1 && !isOxidizing && !isMordanting) {
      const speedMultiplier = getDyeSpeedMultiplier(temperature)
      const dyeRate = 0.025 * speedMultiplier * delta * 60
      setDyeProgress(prev => Math.min(1, prev + dyeRate))
    }

    if (isOxidizing && oxidationProgress < 1) {
      const oxidationRate = (1 / oxidationTime) * delta
      setOxidationProgress(prev => {
        const next = prev + oxidationRate
        if (next >= 1) {
          setIsOxidizing(false)
          return 1
        }
        return next
      })

      if (oxidationProgress > 0) {
        const vatPos = DYE_VAT_POSITIONS[baseColor!]
        const height = 1.5 + oxidationProgress * 1.5
        setTargetPosition([vatPos[0], height, vatPos[2]])
      }
    }

    if (isMordanting && mordantProgress < 1) {
      const mordantRate = 0.5 * delta
      setMordantProgress(prev => {
        const next = prev + mordantRate
        if (next >= 1) {
          setIsMordanting(false)
          return 1
        }
        return next
      })
      setTargetPosition([4.2, 0.8, 0])
    }

    setParticles(prev =>
      prev
        .map(p => ({
          ...p,
          position: p.position.clone().add(p.velocity.clone().multiplyScalar(delta)),
          velocity: p.velocity.clone().add(new THREE.Vector3(0, -9.8 * delta, 0)),
          life: p.life - delta,
        }))
        .filter(p => p.life > 0)
    )

    if (dyeProgress >= 1 && !isOxidizing && !isMordanting && oxidationProgress < 0.01 && currentDyeingColor) {
      const vatPos = DYE_VAT_POSITIONS[currentDyeingColor]
      setTargetPosition([vatPos[0], 0.1, vatPos[2]])
    }

    if (oxidationProgress >= 1 && !isMordanting && mordantProgress < 0.01) {
      setTargetPosition([0, 2.5, 0])
    }

    if (mordantProgress >= 1) {
      setTargetPosition([0, 2.5, 0])
    }

    const endTime = performance.now()
    if (endTime - startTime > 5) {
      console.warn(`Color update took ${endTime - startTime}ms, target is <5ms`)
    }
  })

  const handleVatDrop = useCallback((color: DyeColor) => {
    if (!baseColor && !isOxidizing && !isMordanting) {
      setHoveredVat(color)
    }
  }, [baseColor, isOxidizing, isMordanting])

  const showCloth = !baseColor || dyeProgress > 0 || isOxidizing || isMordanting || oxidationProgress > 0

  return (
    <>
      <Workshop />
      <ClothRack />
      <MordantBath active={isMordanting} />

      {(Object.keys(DYE_VAT_POSITIONS) as DyeColor[]).map(color => (
        <DyeVat
          key={color}
          color={color}
          position={DYE_VAT_POSITIONS[color!]}
          onDrop={handleVatDrop}
          hoveredVat={hoveredVat}
          setHoveredVat={setHoveredVat}
        />
      ))}

      {showCloth && (
        <Cloth
          position={clothPosition}
          color={baseColor}
          dyeProgress={dyeProgress}
          oxidationProgress={oxidationProgress}
          mordantProgress={mordantProgress}
          isDragging={dragging}
          onPointerDown={handleClothPointerDown}
          targetPosition={targetPosition}
        />
      )}

      <SplashParticles particles={particles} />
    </>
  )
}

export default Scene
