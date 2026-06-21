import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useTerrainStore, ProfilePoint } from '../store/terrainStore'
import { getWaterFlowPaths } from '../utils/erosionModel'

const GRID_SIZE = 200
const TERRAIN_SIZE = 20
const HEIGHT_SCALE = 5

function lerpColor(color1: string, color2: string, t: number): THREE.Color {
  const c1 = new THREE.Color(color1)
  const c2 = new THREE.Color(color2)
  return c1.lerp(c2, Math.max(0, Math.min(1, t)))
}

function getTerrainColor(height: number, terrainType: string): THREE.Color {
  const h = Math.max(0, Math.min(1, height))
  
  if (terrainType === 'volcano' && h > 0.7) {
    const volcanoT = (h - 0.7) / 0.3
    return lerpColor('#8b4513', '#8b0000', volcanoT)
  }
  
  if (terrainType === 'mountain') {
    if (h < 0.3) {
      return lerpColor('#228b22', '#4a6741', h / 0.3)
    } else if (h < 0.7) {
      return lerpColor('#4a6741', '#d2b48c', (h - 0.3) / 0.4)
    } else {
      return lerpColor('#d2b48c', '#ffffff', (h - 0.7) / 0.3)
    }
  }
  
  if (terrainType === 'basin') {
    if (h < 0.4) {
      return lerpColor('#1e90ff', '#228b22', h / 0.4)
    } else {
      return lerpColor('#228b22', '#8b4513', (h - 0.4) / 0.6)
    }
  }
  
  if (terrainType === 'plain') {
    return lerpColor('#228b22', '#90ee90', h)
  }
  
  return lerpColor('#228b22', '#8b4513', h)
}

interface TerrainMeshProps {
  worker: Worker | null
  onTerrainClick: (point: THREE.Vector3) => void
}

function TerrainMesh({ worker, onTerrainClick }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { 
    heightMap, 
    gridSize, 
    terrainType, 
    isSimulating, 
    timeScale,
    simulationTime,
    duration,
    updateHeightMap,
    pauseSimulation,
    getErosionParams
  } = useTerrainStore()
  
  const lastUpdateRef = useRef(0)
  const workerReadyRef = useRef(false)
  const isSimulatingRef = useRef(isSimulating)
  const heightMapRef = useRef(heightMap)
  
  useEffect(() => {
    isSimulatingRef.current = isSimulating
  }, [isSimulating])
  
  useEffect(() => {
    heightMapRef.current = heightMap
  }, [heightMap])
  
  useEffect(() => {
    if (!meshRef.current) return
    
    const positions = meshRef.current.geometry.attributes.position
    const colorAttr = meshRef.current.geometry.attributes.color
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      positions.setY(i, heightMap[i] * HEIGHT_SCALE)
      
      const color = getTerrainColor(heightMap[i], terrainType)
      colorAttr.setXYZ(i, color.r, color.g, color.b)
    }
    
    positions.needsUpdate = true
    colorAttr.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals()
  }, [heightMap, terrainType, gridSize])
  
  useEffect(() => {
    if (!worker) return
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'update') {
        updateHeightMap(e.data.heightMap)
      }
    }
    
    worker.addEventListener('message', handleMessage)
    
    return () => {
      worker.removeEventListener('message', handleMessage)
    }
  }, [worker, updateHeightMap])
  
  useEffect(() => {
    if (!worker) return
    
    if (isSimulating && !workerReadyRef.current) {
      const params = getErosionParams()
      worker.postMessage({
        type: 'start',
        heightMap: new Float32Array(heightMap),
        params
      })
      workerReadyRef.current = true
    }
    
    if (!isSimulating) {
      workerReadyRef.current = false
    }
  }, [isSimulating, worker, getErosionParams, heightMap])
  
  useFrame((_, delta) => {
    if (!isSimulatingRef.current || !worker || !workerReadyRef.current) return
    
    if (simulationTime >= duration) {
      pauseSimulation()
      return
    }
    
    lastUpdateRef.current += delta
    
    const updateInterval = 0.5 / timeScale
    
    if (lastUpdateRef.current >= updateInterval) {
      lastUpdateRef.current = 0
      worker.postMessage({
        type: 'step',
        steps: Math.ceil(timeScale)
      })
    }
  })
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, gridSize - 1, gridSize - 1)
    geo.rotateX(-Math.PI / 2)
    
    const colorArray = new Float32Array(gridSize * gridSize * 3)
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const color = getTerrainColor(heightMap[i], terrainType)
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
    geo.computeVertexNormals()
    
    return geo
  }, [])
  
  const handleClick = (e: any) => {
    e.stopPropagation()
    onTerrainClick(e.point)
  }
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      receiveShadow 
      castShadow
      onClick={handleClick}
    >
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

interface ParticleSystemProps {
  count: number
}

function ParticleSystem({ count }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const { heightMap, gridSize, terrainSize, windSpeed, waterFlow } = useTerrainStore()
  const velocitiesRef = useRef<Float32Array | null>(null)
  
  const particlePositions = useMemo(() => {
    if (windSpeed === 0 && waterFlow === 0) {
      return new Float32Array(count * 3)
    }
    
    const paths = getWaterFlowPaths(heightMap, gridSize, count)
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const path = paths[i]
      const x = (path.x / gridSize - 0.5) * terrainSize
      const z = (path.y / gridSize - 0.5) * terrainSize
      const y = heightMap[path.y * gridSize + path.x] * HEIGHT_SCALE + 0.1
      
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      
      const speed = 0.02 + (waterFlow / 50) * 0.05
      velocities[i * 3] = path.dx * speed
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = path.dy * speed
    }
    
    velocitiesRef.current = velocities
    return positions
  }, [heightMap, gridSize, terrainSize, count, windSpeed, waterFlow])
  
  useFrame(() => {
    if (!pointsRef.current || !velocitiesRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const velocities = velocitiesRef.current
    
    for (let i = 0; i < count; i++) {
      let x = positions[i * 3]
      let z = positions[i * 3 + 2]
      
      x += velocities[i * 3]
      z += velocities[i * 3 + 2]
      
      if (x < -terrainSize / 2 || x > terrainSize / 2 ||
          z < -terrainSize / 2 || z > terrainSize / 2) {
        x = (Math.random() - 0.5) * terrainSize
        z = (Math.random() - 0.5) * terrainSize
      }
      
      const gridX = Math.floor((x / terrainSize + 0.5) * gridSize)
      const gridZ = Math.floor((z / terrainSize + 0.5) * gridSize)
      const clampedX = Math.max(0, Math.min(gridSize - 1, gridX))
      const clampedZ = Math.max(0, Math.min(gridSize - 1, gridZ))
      const y = heightMap[clampedZ * gridSize + clampedX] * HEIGHT_SCALE + 0.1
      
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  if (windSpeed === 0 && waterFlow === 0) return null
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

interface ProfileLineProps {
  points: ProfilePoint[]
}

function ProfileLine({ points }: ProfileLineProps) {
  const { heightMap, gridSize, terrainSize } = useTerrainStore()
  
  const points3D = useMemo(() => {
    if (points.length < 2) return []
    
    const result: THREE.Vector3[] = []
    const numSegments = 50
    
    for (let i = 0; i < numSegments; i++) {
      const t = i / (numSegments - 1)
      const x = points[0].x + (points[1].x - points[0].x) * t
      const y = points[0].y + (points[1].y - points[0].y) * t
      
      const xi = Math.floor(Math.max(0, Math.min(gridSize - 1, x)))
      const yi = Math.floor(Math.max(0, Math.min(gridSize - 1, y)))
      const height = heightMap[yi * gridSize + xi] * HEIGHT_SCALE
      
      const worldX = (x / gridSize - 0.5) * terrainSize
      const worldZ = (y / gridSize - 0.5) * terrainSize
      
      result.push(new THREE.Vector3(worldX, height + 0.2, worldZ))
    }
    
    return result
  }, [points, heightMap, gridSize, terrainSize])
  
  if (points.length < 2) return null
  
  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points3D)
  }, [points3D])
  
  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#00d4ff" linewidth={2} />
    </lineSegments>
  )
}

interface SingleRippleProps {
  ripple: { id: number; worldX: number; worldZ: number; startTime: number }
}

function SingleRipple({ ripple }: SingleRippleProps) {
  const rippleRef = useRef<THREE.Mesh>(null)
  const crossHRef = useRef<THREE.LineSegments>(null)
  const crossVRef = useRef<THREE.LineSegments>(null)
  const { heightMap, gridSize, terrainSize } = useTerrainStore()
  
  useFrame(() => {
    if (!rippleRef.current || !crossHRef.current || !crossVRef.current) return
    
    const elapsed = Date.now() - ripple.startTime
    const progress = Math.min(1, elapsed / 1000)
    
    const rippleScale = 0.5 + progress * 2.5
    rippleRef.current.scale.set(rippleScale, 1, rippleScale)
    
    const rippleMaterial = rippleRef.current.material as THREE.MeshBasicMaterial
    rippleMaterial.opacity = 0.6 * (1 - progress)
    
    const gridX = Math.floor((ripple.worldX / terrainSize + 0.5) * gridSize)
    const gridZ = Math.floor((ripple.worldZ / terrainSize + 0.5) * gridSize)
    const clampedX = Math.max(0, Math.min(gridSize - 1, gridX))
    const clampedZ = Math.max(0, Math.min(gridSize - 1, gridZ))
    const height = heightMap[clampedZ * gridSize + clampedX] * HEIGHT_SCALE
    
    rippleRef.current.position.y = height + 0.1
    
    const crossOpacity = Math.max(0, 1 - progress * 2)
    const crossHMaterial = crossHRef.current.material as THREE.LineBasicMaterial
    const crossVMaterial = crossVRef.current.material as THREE.LineBasicMaterial
    crossHMaterial.opacity = crossOpacity
    crossVMaterial.opacity = crossOpacity
    
    const crossSize = 0.4 + progress * 0.6
    
    const hPositions = crossHRef.current.geometry.attributes.position.array as Float32Array
    hPositions[0] = ripple.worldX - crossSize
    hPositions[1] = height + 0.15
    hPositions[2] = ripple.worldZ
    hPositions[3] = ripple.worldX + crossSize
    hPositions[4] = height + 0.15
    hPositions[5] = ripple.worldZ
    crossHRef.current.geometry.attributes.position.needsUpdate = true
    
    const vPositions = crossVRef.current.geometry.attributes.position.array as Float32Array
    vPositions[0] = ripple.worldX
    vPositions[1] = height + 0.15
    vPositions[2] = ripple.worldZ - crossSize
    vPositions[3] = ripple.worldX
    vPositions[4] = height + 0.15
    vPositions[5] = ripple.worldZ + crossSize
    crossVRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  const crossHPositions = useMemo(() => {
    return new Float32Array([ripple.worldX, 0, ripple.worldZ, ripple.worldX, 0, ripple.worldZ])
  }, [ripple.worldX, ripple.worldZ])
  
  const crossVPositions = useMemo(() => {
    return new Float32Array([ripple.worldX, 0, ripple.worldZ, ripple.worldX, 0, ripple.worldZ])
  }, [ripple.worldX, ripple.worldZ])
  
  return (
    <group>
      <mesh
        ref={rippleRef}
        position={[ripple.worldX, 0, ripple.worldZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.6} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      <lineSegments ref={crossHRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={crossHPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff4444" transparent opacity={1} linewidth={2} />
      </lineSegments>
      
      <lineSegments ref={crossVRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={crossVPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff4444" transparent opacity={1} linewidth={2} />
      </lineSegments>
    </group>
  )
}

function RippleEffects() {
  const { ripples } = useTerrainStore()
  
  return (
    <>
      {ripples.map((ripple) => (
        <SingleRipple key={ripple.id} ripple={ripple} />
      ))}
    </>
  )
}

interface SceneContentProps {
  worker: Worker | null
}

function SceneContent({ worker }: SceneContentProps) {
  const { 
    profilePoints, 
    setProfilePoints, 
    gridSize, 
    terrainSize,
    addRipple,
  } = useTerrainStore()
  
  const handleTerrainClick = (point: THREE.Vector3) => {
    const x = Math.floor((point.x / terrainSize + 0.5) * gridSize)
    const y = Math.floor((point.z / terrainSize + 0.5) * gridSize)
    
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return
    
    addRipple({ x, y, worldX: point.x, worldZ: point.z })
    
    const newPoint: ProfilePoint = { x, y }
    
    if (profilePoints.length === 0 || profilePoints.length === 2) {
      setProfilePoints([newPoint])
    } else {
      setProfilePoints([profilePoints[0], newPoint])
    }
  }
  
  return (
    <>
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
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      
      <TerrainMesh worker={worker} onTerrainClick={handleTerrainClick} />
      
      <ParticleSystem count={500} />
      
      <ProfileLine points={profilePoints} />
      
      <RippleEffects />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  )
}

interface Scene3DProps {
  worker: Worker | null
}

export default function Scene3D({ worker }: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [15, 12, 15], fov: 50 }}
      shadows
      gl={{ antialias: true }}
      style={{ background: '#1a1a2e', width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 25, 50]} />
      
      <SceneContent worker={worker} />
    </Canvas>
  )
}
