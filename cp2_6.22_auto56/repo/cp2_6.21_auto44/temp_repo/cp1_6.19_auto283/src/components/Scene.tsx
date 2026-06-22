import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { CoralModel } from './CoralModel'
import { useCoralStore, CoralType } from '../store/coralStore'

const TANK_SIZE = 10
const SAND_GRID = 8

function WaterEffect() {
  const { environmentParams } = useCoralStore()
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      const baseR = 200
      const baseG = 230
      const baseB = 255
      const tempExtra = Math.max(0, environmentParams.temperature - 26) * 5
      const r = Math.min(255, baseR + tempExtra)
      const g = Math.min(255, baseG)
      const b = Math.min(255, baseB)
      materialRef.current.color.setRGB(r / 255, g / 255, b / 255)
    }
  })

  return (
    <mesh position={[0, TANK_SIZE / 2, 0]}>
      <boxGeometry args={[TANK_SIZE + 0.1, TANK_SIZE + 0.1, TANK_SIZE + 0.1]} />
      <meshBasicMaterial
        ref={materialRef}
        color="rgb(200, 230, 255)"
        transparent
        opacity={0.15}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

function SandFloor() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TANK_SIZE, TANK_SIZE, SAND_GRID, SAND_GRID)
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getY(i)
      const noise = (Math.sin(x * 3) * Math.cos(z * 3) * 0.02) + (Math.random() - 0.5) * 0.01
      positions.setZ(i, noise)
    }
    geo.computeVertexNormals()
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#D4C4A8',
    roughness: 1,
    metalness: 0
  }), [])

  return (
    <mesh geometry={geometry} material={material} position={[0, 0, 0]} receiveShadow />
  )
}

function TankWalls() {
  const glassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#A8D8EA',
    transparent: true,
    opacity: 0.1,
    roughness: 0.1,
    metalness: 0.1
  }), [])

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1A2A3A',
    roughness: 0.5,
    metalness: 0.8,
    emissive: '#3498DB',
    emissiveIntensity: 0.1
  }), [])

  return (
    <group>
      <mesh position={[0, TANK_SIZE / 2, -TANK_SIZE / 2]} material={glassMaterial}>
        <boxGeometry args={[TANK_SIZE, TANK_SIZE, 0.1]} />
      </mesh>
      <mesh position={[0, TANK_SIZE / 2, TANK_SIZE / 2]} material={glassMaterial}>
        <boxGeometry args={[TANK_SIZE, TANK_SIZE, 0.1]} />
      </mesh>
      <mesh position={[-TANK_SIZE / 2, TANK_SIZE / 2, 0]} material={glassMaterial}>
        <boxGeometry args={[0.1, TANK_SIZE, TANK_SIZE]} />
      </mesh>
      <mesh position={[TANK_SIZE / 2, TANK_SIZE / 2, 0]} material={glassMaterial}>
        <boxGeometry args={[0.1, TANK_SIZE, TANK_SIZE]} />
      </mesh>
      <mesh position={[0, TANK_SIZE, 0]} material={frameMaterial}>
        <boxGeometry args={[TANK_SIZE + 0.3, 0.2, TANK_SIZE + 0.3]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} material={frameMaterial}>
        <boxGeometry args={[TANK_SIZE + 0.3, 0.1, TANK_SIZE + 0.3]} />
      </mesh>
    </group>
  )
}

function CoralBase({ position, onClick }: { position: [number, number, number]; onClick: () => void }) {
  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      <cylinderGeometry args={[0.3, 0.35, 0.1, 32]} />
      <meshStandardMaterial
        color="#7F8C8D"
        roughness={0.8}
        metalness={0.2}
        emissive="#3498DB"
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

function PlacementIndicator() {
  const { hoverPosition, isPlacing } = useCoralStore()

  if (!isPlacing || !hoverPosition) return null

  return (
    <mesh position={[hoverPosition[0], 0.01, hoverPosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.25, 0.3, 32]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </mesh>
  )
}

function Particles() {
  const { environmentParams, corals } = useCoralStore()
  const bubbleCount = 80
  const planktonCount = 60
  const bubbleRef = useRef<THREE.Points>(null)
  const planktonRef = useRef<THREE.Points>(null)
  const timeRef = useRef(0)

  const densityMultiplier = corals.length > 50 ? 0.6 : 1

  const bubbleData = useMemo(() => {
    const positions = new Float32Array(bubbleCount * 3)
    const speeds = new Float32Array(bubbleCount)
    for (let i = 0; i < bubbleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * TANK_SIZE * 0.9
      positions[i * 3 + 1] = Math.random() * TANK_SIZE
      positions[i * 3 + 2] = (Math.random() - 0.5) * TANK_SIZE * 0.9
      speeds[i] = 0.5 + Math.random() * 1
    }
    return { positions, speeds }
  }, [])

  const planktonData = useMemo(() => {
    const baseCount = Math.floor(planktonCount * densityMultiplier * (environmentParams.light / 3000))
    const count = Math.max(10, baseCount)
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * TANK_SIZE * 0.9
      positions[i * 3 + 1] = Math.random() * TANK_SIZE * 0.8 + 0.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * TANK_SIZE * 0.9
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, phases, count }
  }, [environmentParams.light, densityMultiplier])

  const bubbleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(bubbleData.positions, 3))
    return geo
  }, [bubbleData])

  const planktonGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(planktonData.positions, 3))
    return geo
  }, [planktonData])

  useFrame((_, delta) => {
    timeRef.current += delta
    const flowSpeed = environmentParams.waterFlow * 0.3

    if (bubbleRef.current) {
      const positions = bubbleRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < bubbleCount; i++) {
        const idx = i * 3
        positions[idx] += Math.sin(timeRef.current * 0.5 + i) * 0.01
        positions[idx + 1] += bubbleData.speeds[i] * delta * 0.3
        positions[idx + 2] += flowSpeed * delta * 0.5

        if (positions[idx + 1] > TANK_SIZE) {
          positions[idx] = (Math.random() - 0.5) * TANK_SIZE * 0.9
          positions[idx + 1] = 0
          positions[idx + 2] = (Math.random() - 0.5) * TANK_SIZE * 0.9
        }
      }
      bubbleRef.current.geometry.attributes.position.needsUpdate = true
    }

    if (planktonRef.current) {
      const positions = planktonRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < planktonData.count; i++) {
        const idx = i * 3
        positions[idx] += Math.sin(timeRef.current + planktonData.phases[i]) * delta * 0.05
        positions[idx + 1] += Math.cos(timeRef.current * 0.7 + planktonData.phases[i]) * delta * 0.03
        positions[idx + 2] += flowSpeed * delta * 0.3

        if (Math.abs(positions[idx]) > TANK_SIZE * 0.45) positions[idx] *= -0.9
        if (Math.abs(positions[idx + 2]) > TANK_SIZE * 0.45) positions[idx + 2] *= -0.9
        if (positions[idx + 1] < 0.2) positions[idx + 1] = TANK_SIZE * 0.8
        if (positions[idx + 1] > TANK_SIZE * 0.9) positions[idx + 1] = 0.2
      }
      planktonRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      <points ref={bubbleRef} geometry={bubbleGeometry}>
        <pointsMaterial
          size={0.08}
          color="#FFFFFF"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      <points ref={planktonRef} geometry={planktonGeometry}>
        <pointsMaterial
          size={0.05}
          color="#A8E6CF"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function CoralPicker() {
  const { addCoral, setHoverPosition } = useCoralStore()

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const state = useCoralStore.getState()
    if (state.isPlacing && state.selectedCoralType && state.hoverPosition) {
      const pos: [number, number, number] = [
        Math.max(-TANK_SIZE / 2 + 0.5, Math.min(TANK_SIZE / 2 - 0.5, state.hoverPosition[0])),
        0,
        Math.max(-TANK_SIZE / 2 + 0.5, Math.min(TANK_SIZE / 2 - 0.5, state.hoverPosition[2]))
      ]
      addCoral(state.selectedCoralType, pos)
    }
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const state = useCoralStore.getState()
    if (state.isPlacing) {
      const point = event.point
      setHoverPosition([point.x, 0, point.z])
    }
  }

  return (
    <mesh
      position={[0, 0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={() => setHoverPosition(null)}
    >
      <planeGeometry args={[TANK_SIZE, TANK_SIZE]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function Lighting() {
  const { environmentParams } = useCoralStore()
  const intensity = 0.5 + (environmentParams.light / 3000) * 1.5

  return (
    <group>
      <ambientLight intensity={0.4} color="#B8D4E3" />
      <directionalLight
        position={[3, 8, 3]}
        intensity={intensity}
        color="#FFF5E6"
        castShadow
      />
      <pointLight
        position={[0, TANK_SIZE - 0.5, 0]}
        intensity={0.8}
        color="#E8F4F8"
      />
    </group>
  )
}

function SceneContent() {
  const { corals, tick, showMenu, menuPosition, showCoralMenu, hideCoralMenu, startPlacing, isPlacing } = useCoralStore()
  const { camera } = useThree()

  useFrame((_, delta) => {
    tick(delta)
  })

  useEffect(() => {
    camera.position.set(0, 8, 10)
    camera.lookAt(0, 0, 0)
  }, [camera])

  const handleBaseClick = (position: [number, number, number]) => {
    if (showMenu) {
      hideCoralMenu()
    } else {
      showCoralMenu(position)
    }
  }

  const basePositions: [number, number, number][] = [
    [-3, 0.05, -3],
    [3, 0.05, -3],
    [-3, 0.05, 3],
    [3, 0.05, 3],
    [0, 0.05, 0]
  ]

  const handleSelectCoral = (type: CoralType) => {
    startPlacing(type)
  }

  return (
    <>
      <color attach="background" args={['#0F1923']} />
      <fog attach="fog" args={['#0F1923', 8, 25]} />

      <Lighting />
      <WaterEffect />
      <SandFloor />
      <TankWalls />
      <Particles />

      {basePositions.map((pos, idx) => (
        <CoralBase key={idx} position={pos} onClick={() => handleBaseClick(pos)} />
      ))}

      {corals.map((coral) => (
        <CoralModel key={coral.id} coral={coral} />
      ))}

      <CoralPicker />
      <PlacementIndicator />

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        enabled={!isPlacing}
      />

      {showMenu && menuPosition && (
        <ScreenSpaceMenu
          worldPosition={menuPosition}
          onSelect={handleSelectCoral}
          onClose={hideCoralMenu}
        />
      )}
    </>
  )
}

function ScreenSpaceMenu({
  worldPosition,
  onSelect,
  onClose
}: {
  worldPosition: [number, number, number]
  onSelect: (type: CoralType) => void
  onClose: () => void
}) {
  const { camera } = useThree()
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const vector = new THREE.Vector3(...worldPosition)
    vector.project(camera)
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight
    setScreenPos({ x, y })
  }, [worldPosition, camera])

  const coralTypes: { type: CoralType; name: string; color: string }[] = [
    { type: 'staghorn', name: '鹿角珊瑚', color: '#FF6B6B' },
    { type: 'brain', name: '脑珊瑚', color: '#FFD93D' },
    { type: 'soft', name: '软珊瑚', color: '#6BCB77' }
  ]

  return (
    <div
      style={{
        position: 'fixed',
        left: screenPos.x,
        top: screenPos.y - 80,
        transform: 'translate(-50%, -100%)',
        background: 'rgba(26, 42, 58, 0.95)',
        border: '1px solid rgba(52, 152, 219, 0.5)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 0 20px rgba(52, 152, 219, 0.3)',
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ marginBottom: '8px', color: '#fff', fontSize: '12px', textAlign: 'center' }}>选择珊瑚品种</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {coralTypes.map((ct) => (
          <button
            key={ct.type}
            onClick={() => onSelect(ct.type)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              border: '2px solid rgba(255,255,255,0.2)',
              background: ct.color,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.85,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.boxShadow = `0 0 10px ${ct.color}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.85'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {ct.name}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '6px',
          background: 'rgba(231, 76, 60, 0.8)',
          border: 'none',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '11px',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(231, 76, 60, 1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(231, 76, 60, 0.8)'
        }}
      >
        取消
      </button>
    </div>
  )
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 10], fov: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0F1923')
      }}
    >
      <SceneContent />
    </Canvas>
  )
}
