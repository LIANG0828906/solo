import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/stores/useCityStore'
import { Building, tempToColor, hexToRgb, generateParticleData } from '@/utils/heatCalculation'

function BuildingMesh({ building, albedo }: { building: Building; albedo: number }) {
  const [displayTemp, setDisplayTemp] = useState(building.baseTemp)
  const targetTempRef = useRef(building.baseTemp)

  const buildingColor = useMemo(() => {
    const t = (albedo - 0.1) / 0.8
    const gray = Math.floor(204 - t * 102)
    return new THREE.Color(gray / 255, gray / 255, gray / 255)
  }, [albedo])

  const heatColor = useMemo(() => {
    const rgb = hexToRgb(tempToColor(displayTemp))
    return new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
  }, [displayTemp])

  useEffect(() => {
    targetTempRef.current = building.baseTemp
  }, [building.baseTemp])

  useFrame((_, delta) => {
    const diff = targetTempRef.current - displayTemp
    if (Math.abs(diff) > 0.01) {
      setDisplayTemp((prev) => prev + diff * Math.min(delta * 2, 1))
    }
  })

  return (
    <group position={building.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[building.width, building.height, building.depth]} />
        <meshStandardMaterial color={buildingColor} roughness={0.7} metalness={0.1} />
      </mesh>

      <mesh position={[0, building.height / 2 + 0.05, 0]}>
        <boxGeometry args={[building.width * 1.02, 0.1, building.depth * 1.02]} />
        <meshStandardMaterial color={heatColor} transparent opacity={0.4} />
      </mesh>

      {building.hasGreenRoof && (
        <mesh position={[0, building.height / 2 + 0.15, 0]}>
          <boxGeometry args={[building.width * 1.05, 0.2, building.depth * 1.05]} />
          <meshStandardMaterial color="#00E676" transparent opacity={0.5} />
        </mesh>
      )}

      {building.hasVerticalGreening && (
        <>
          <mesh position={[building.width / 2 + 0.05, 0, 0]}>
            <boxGeometry args={[0.1, building.height * 0.9, building.depth * 0.9]} />
            <meshStandardMaterial color="#00E676" transparent opacity={0.4} />
          </mesh>
          <mesh position={[-building.width / 2 - 0.05, 0, 0]}>
            <boxGeometry args={[0.1, building.height * 0.9, building.depth * 0.9]} />
            <meshStandardMaterial color="#00E676" transparent opacity={0.4} />
          </mesh>
        </>
      )}

      <group position={[0, building.height / 2 + 1, 0]}>
        <mesh>
          <planeGeometry args={[2, 0.6]} />
          <meshBasicMaterial color="#000" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  )
}

function HeatParticles({ buildings }: { buildings: Building[] }) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 3000

  const { positions, colors, speeds, offsets } = useMemo(() => {
    return generateParticleData(buildings, particleCount)
  }, [buildings])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const positionsAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const time = clock.getElapsedTime()

    for (let i = 0; i < particleCount; i++) {
      const speed = speeds[i]
      const offset = offsets[i]
      const yOffset = Math.sin(time * speed + offset) * 0.5
      positionsAttr.setY(i, positions[i * 3 + 1] + yOffset)
    }
    positionsAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function Ground({ hasPermeablePavement }: { hasPermeablePavement: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial
        color={hasPermeablePavement ? '#3A5F3A' : '#2A2A2A'}
        roughness={0.9}
      />
    </mesh>
  )
}

function PermeablePatches() {
  const patches = useMemo(() => {
    const arr = []
    for (let i = 0; i < 20; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 25,
        z: (Math.random() - 0.5) * 25,
        size: 0.5 + Math.random() * 1.5,
      })
    }
    return arr
  }, [])

  return (
    <>
      {patches.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.01, p.z]}>
          <circleGeometry args={[p.size, 16]} />
          <meshStandardMaterial color="#4A7C4A" transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  )
}

function GridHelper() {
  const gridRef = useRef<THREE.GridHelper>(null)
  return (
    <gridHelper args={[40, 40, '#333', '#222']} position={[0, 0.01, 0]} />
  )
}

function SceneContent() {
  const buildings = useCityStore((state) => state.buildings)
  const materialAlbedo = useCityStore((state) => state.materialAlbedo)
  const mitigations = useCityStore((state) => state.mitigations)
  const selectedZoneId = useCityStore((state) => state.selectedZoneId)

  if (!selectedZoneId || buildings.length === 0) {
    return (
      <group>
        <Ground hasPermeablePavement={false} />
        <GridHelper />
      </group>
    )
  }

  return (
    <group>
      <Ground hasPermeablePavement={mitigations.permeablePavement} />
      <GridHelper />
      {mitigations.permeablePavement && <PermeablePatches />}

      {buildings.map((building) => (
        <BuildingMesh key={building.id} building={building} albedo={materialAlbedo} />
      ))}

      <HeatParticles buildings={buildings} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 3, 0]}
      />
    </group>
  )
}

function EmptyStateOverlay() {
  const selectedZoneId = useCityStore((state) => state.selectedZoneId)
  const buildings = useCityStore((state) => state.buildings)

  if (selectedZoneId && buildings.length > 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          color: '#888',
          fontSize: '18px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '16px 24px',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)',
        }}
      >
        请选择一个城市区域
      </div>
    </div>
  )
}

export default function HeatScene3D() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Canvas
        camera={{ position: [20, 18, 20], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#1A1A2E']} />
        <fog attach="fog" args={['#1A1A2E', 35, 70]} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[15, 25, 15]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#88CCFF" />

        <SceneContent />
      </Canvas>
      <EmptyStateOverlay />
    </div>
  )
}
