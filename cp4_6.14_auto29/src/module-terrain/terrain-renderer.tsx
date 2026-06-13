import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TerrainData, ResourcePoint, Building, RESOURCE_COLORS, ResourceType, BuildingType } from '../types'

interface TerrainMeshProps {
  terrainData: TerrainData
  opacity: number
}

function TerrainMesh({ terrainData, opacity }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(terrainData.vertices, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(terrainData.uvs, 2))
    geo.setIndex(terrainData.indices)
    geo.computeVertexNormals()
    return geo
  }, [terrainData])

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#4a7c59"
        side={THREE.DoubleSide}
        flatShading={false}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

interface ResourceMeshProps {
  point: ResourcePoint
  onClick: (point: ResourcePoint) => void
}

function ResourceMesh({ point, onClick }: ResourceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [scale, setScale] = useState(1)
  const [visible, setVisible] = useState(true)
  const animating = useRef(false)

  useFrame((_, delta) => {
    if (meshRef.current && visible && !animating.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  useEffect(() => {
    if (point.collected && visible && !animating.current) {
      animating.current = true
      let start = 0
      const animate = (t: number) => {
        if (!start) start = t
        const progress = Math.min((t - start) / 300, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setScale(1 - eased * 0.8)
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setVisible(false)
          animating.current = false
        }
      }
      requestAnimationFrame(animate)
    }
  }, [point.collected, visible])

  if (!visible) return null

  const color = RESOURCE_COLORS[point.type]

  const getGeometry = (type: ResourceType) => {
    switch (type) {
      case 'wood':
        return <cylinderGeometry args={[0.25, 0.25, 0.8, 8]} />
      case 'stone':
        return <boxGeometry args={[0.5, 0.5, 0.5]} />
      case 'metal':
        return <sphereGeometry args={[0.3, 16, 16]} />
      case 'food':
        return <coneGeometry args={[0.3, 0.7, 8]} />
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={[point.position.x, point.position.y, point.position.z]}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        if (!point.collected && !animating.current) onClick(point)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {getGeometry(point.type)}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </mesh>
  )
}

interface BuildingMeshProps {
  building: Building
  isNew?: boolean
}

function BuildingMesh({ building, isNew }: BuildingMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const [particlesVisible, setParticlesVisible] = useState(false)
  const particleStartTime = useRef<number>(0)
  const hasAnimated = useRef(false)

  const { positions, velocities } = useMemo(() => {
    const count = 40
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = building.position.x
      pos[i * 3 + 1] = building.position.y + 0.5
      pos[i * 3 + 2] = building.position.z
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 2 + Math.random() * 3
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i * 3 + 1] = Math.cos(phi) * speed + 1
      vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
    }
    return { positions: pos, velocities: vel }
  }, [building.id])

  useEffect(() => {
    if (isNew && !hasAnimated.current) {
      hasAnimated.current = true
      setParticlesVisible(true)
    }
  }, [isNew])

  useFrame((state, delta) => {
    if (particlesRef.current && particlesVisible) {
      if (!particleStartTime.current) {
        particleStartTime.current = state.clock.elapsedTime
      }
      const elapsed = state.clock.elapsedTime - particleStartTime.current
      if (elapsed > 1.5) {
        setParticlesVisible(false)
        return
      }
      const posAttr = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array
      const alpha = 1 - elapsed / 1.5
      for (let i = 0; i < 40; i++) {
        posArray[i * 3] += velocities[i * 3] * delta
        posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta
        posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta
        velocities[i * 3 + 1] -= 3 * delta
      }
      posAttr.needsUpdate = true
      const material = particlesRef.current.material as THREE.PointsMaterial
      material.opacity = alpha
    }
  })

  const renderBuilding = (type: BuildingType) => {
    switch (type) {
      case 'tower':
        return (
          <group>
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.9, 1.1, 1, 12]} />
              <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.75, 0]} castShadow>
              <cylinderGeometry args={[0.7, 0.9, 1.5, 12]} />
              <meshStandardMaterial color="#6b6b6b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 3.0, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.7, 1, 12]} />
              <meshStandardMaterial color="#7a7a7a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 3.9, 0]} castShadow>
              <cylinderGeometry args={[0.6, 0.6, 0.1, 12]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 4.7, 0]} castShadow>
              <coneGeometry args={[0.8, 1.5, 12]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 5.5, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 1.75, 0.71]} castShadow>
              <boxGeometry args={[0.4, 0.6, 0.05]} />
              <meshStandardMaterial color="#2c2c2c" />
            </mesh>
          </group>
        )
      case 'warehouse':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[3.2, 0.8, 2.4]} />
              <meshStandardMaterial color="#7a5c3d" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[3, 1.2, 2.2]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.55, 0]} castShadow>
              <boxGeometry args={[3.3, 0.3, 2.5]} />
              <meshStandardMaterial color="#6b4226" />
            </mesh>
            <mesh position={[0, 2.9, 0]} castShadow>
              <boxGeometry args={[0.15, 0.4, 2.6]} />
              <meshStandardMaterial color="#5a3a1a" />
            </mesh>
            <mesh position={[1.2, 2.9, 0]} castShadow>
              <boxGeometry args={[0.15, 0.4, 2.6]} />
              <meshStandardMaterial color="#5a3a1a" />
            </mesh>
            <mesh position={[-1.2, 2.9, 0]} castShadow>
              <boxGeometry args={[0.15, 0.4, 2.6]} />
              <meshStandardMaterial color="#5a3a1a" />
            </mesh>
            <mesh position={[0, 1.0, 1.21]} castShadow>
              <boxGeometry args={[1.2, 1.5, 0.1]} />
              <meshStandardMaterial color="#5a3a1a" />
            </mesh>
            <mesh position={[-1.3, 1.0, 1.21]} castShadow>
              <boxGeometry args={[0.4, 1.0, 0.08]} />
              <meshStandardMaterial color="#2c2c2c" />
            </mesh>
            <mesh position={[1.3, 1.0, 1.21]} castShadow>
              <boxGeometry args={[0.4, 1.0, 0.08]} />
              <meshStandardMaterial color="#2c2c2c" />
            </mesh>
          </group>
        )
      case 'workshop':
        return (
          <group>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[2.5, 0.6, 2.2]} />
              <meshStandardMaterial color="#6b6b6b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.0, 0]} castShadow>
              <boxGeometry args={[2.3, 0.8, 2]} />
              <meshStandardMaterial color="#8B4513" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.85, 0]} castShadow>
              <boxGeometry args={[2.5, 0.3, 2.2]} />
              <meshStandardMaterial color="#6b4226" />
            </mesh>
            <mesh position={[0, 2.8, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.25, 1.5, 12]} />
              <meshStandardMaterial color="#555" roughness={0.5} />
            </mesh>
            <mesh position={[0, 3.7, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.25, 0.15, 12]} />
              <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[0.8, 0.9, 1.01]} castShadow>
              <boxGeometry args={[0.6, 0.7, 0.05]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-0.8, 0.9, 1.01]} castShadow>
              <boxGeometry args={[0.4, 0.5, 0.05]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 2.8, 0.8]} castShadow>
              <boxGeometry args={[0.3, 0.15, 0.3]} />
              <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )
      case 'wall':
        return (
          <group>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[4, 0.8, 0.6]} />
              <meshStandardMaterial color="#707070" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[3.8, 0.8, 0.5]} />
              <meshStandardMaterial color="#808080" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.85, 0]} castShadow>
              <boxGeometry args={[4, 0.5, 0.6]} />
              <meshStandardMaterial color="#707070" roughness={0.9} />
            </mesh>
            {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
              <group key={i} position={[x, 2.3, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.35, 0.35, 0.6]} />
                  <meshStandardMaterial color="#6b6b6b" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.18, 0]} castShadow>
                  <boxGeometry args={[0.35, 0.02, 0.6]} />
                  <meshStandardMaterial color="#555" />
                </mesh>
              </group>
            ))}
            {[-1.8, -1, -0.2, 0.6, 1.4].map((x, i) => (
              <mesh key={i} position={[x, 0.8, 0.31]} castShadow>
                <boxGeometry args={[0.15, 0.3, 0.05]} />
                <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        )
    }
  }

  return (
    <group ref={groupRef} position={[building.position.x, building.position.y, building.position.z]}>
      {renderBuilding(building.type)}
      {particlesVisible && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={40}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.15}
            color="#ffd700"
            transparent
            opacity={1}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  )
}

interface CameraControllerProps {
  minDistance: number
  maxDistance: number
  minPolar: number
  maxPolar: number
  damping: number
}

function CameraController({ minDistance, maxDistance, minPolar, maxPolar, damping }: CameraControllerProps) {
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const velocity = useRef({ azimuth: 0, polar: 0, distance: 0 })
  const spherical = useRef(new THREE.Spherical(20, Math.PI / 3, 0))
  const target = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    const canvas = gl.domElement

    const onDown = (e: MouseEvent) => {
      isDragging.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      velocity.current.azimuth -= dx * 0.005
      velocity.current.polar -= dy * 0.005
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }

    const onUp = () => {
      isDragging.current = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      velocity.current.distance = e.deltaY * 0.02
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame(() => {
    spherical.current.theta += velocity.current.azimuth
    spherical.current.phi += velocity.current.polar
    spherical.current.radius += velocity.current.distance

    spherical.current.phi = Math.max(minPolar, Math.min(maxPolar, spherical.current.phi))
    spherical.current.radius = Math.max(minDistance, Math.min(maxDistance, spherical.current.radius))

    velocity.current.azimuth *= damping
    velocity.current.polar *= damping
    velocity.current.distance *= damping

    spherical.current.makeSafe()
    camera.position.setFromSpherical(spherical.current).add(target.current)
    camera.lookAt(target.current)
  })

  return null
}

interface TerrainRendererProps {
  terrainData: TerrainData | null
  prevTerrainData: TerrainData | null
  resourcePoints: ResourcePoint[]
  buildings: Building[]
  newBuildingIds: Set<string>
  onCollectResource: (point: ResourcePoint) => void
  transitionOpacity: number
}

export const TerrainRenderer: React.FC<TerrainRendererProps> = ({
  terrainData,
  prevTerrainData,
  resourcePoints,
  buildings,
  newBuildingIds,
  onCollectResource,
  transitionOpacity
}) => {
  const fadeOutOpacity = 1 - transitionOpacity

  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 20], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 30, 60]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#00d4ff" />

      <CameraController
        minDistance={5}
        maxDistance={30}
        minPolar={Math.PI / 6}
        maxPolar={Math.PI * 5 / 12}
        damping={0.85}
      />

      {prevTerrainData && fadeOutOpacity > 0.01 && (
        <TerrainMesh terrainData={prevTerrainData} opacity={fadeOutOpacity} />
      )}

      {terrainData && (
        <TerrainMesh terrainData={terrainData} opacity={transitionOpacity} />
      )}

      {resourcePoints.map((point) => (
        <ResourceMesh
          key={point.id}
          point={point}
          onClick={onCollectResource}
        />
      ))}

      {buildings.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          isNew={newBuildingIds.has(building.id)}
        />
      ))}

      <gridHelper args={[40, 40, '#00d4ff33', '#00d4ff11']} position={[0, 0.01, 0]} />
    </Canvas>
  )
}
