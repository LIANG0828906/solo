import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, TerrainPoint } from '../store/useStore'

const TERRAIN_SIZE = 200
const TERRAIN_SEGMENTS = 100
const OCEAN_DEPTH = 50

const generateTerrainHeight = (x: number, z: number): number => {
  const scale = 0.02
  const mountains = Math.sin(x * scale) * Math.cos(z * scale) * 20
  const ridges = Math.sin(x * scale * 3 + 1) * Math.cos(z * scale * 2.5) * 10
  const noise = (Math.sin(x * 0.1) * Math.cos(z * 0.15) + Math.cos(x * 0.08 + z * 0.12)) * 5
  const trenches = -Math.abs(Math.sin(x * scale * 0.5) * Math.cos(z * scale * 0.5)) * 25
  return mountains + ridges + noise + trenches
}

const OceanParticles = () => {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 500

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * TERRAIN_SIZE * 1.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * OCEAN_DEPTH * 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * TERRAIN_SIZE * 1.5
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return [pos, vel]
  }, [])

  useFrame(() => {
    if (!particlesRef.current) return
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      if (Math.abs(pos[i * 3]) > TERRAIN_SIZE) pos[i * 3] *= -0.9
      if (Math.abs(pos[i * 3 + 1]) > OCEAN_DEPTH * 1.5) pos[i * 3 + 1] *= -0.9
      if (Math.abs(pos[i * 3 + 2]) > TERRAIN_SIZE) pos[i * 3 + 2] *= -0.9
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#39ff14"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const Terrain = ({ onTerrainGenerated }: { onTerrainGenerated: (points: TerrainPoint[]) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const heatmapTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const { heatmapData } = useStore()

  const { geometry, canvas, texture } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position.array as Float32Array
    const colors = new Float32Array(pos.length)
    const points: TerrainPoint[] = []

    for (let i = 0; i < pos.length / 3; i++) {
      const x = pos[i * 3]
      const z = pos[i * 3 + 2]
      const height = generateTerrainHeight(x, z)
      pos[i * 3 + 1] = height

      let type: 'mountain' | 'trench' | 'plain' = 'plain'
      if (height > 10) type = 'mountain'
      else if (height < -15) type = 'trench'

      const normal = new THREE.Vector3(0, 1, 0)
      points.push({
        position: new THREE.Vector3(x, height, z),
        normal,
        type,
        height
      })

      const normalizedHeight = (height + 30) / 60
      colors[i * 3] = 0.04 + normalizedHeight * 0.1
      colors[i * 3 + 1] = 0.11 + normalizedHeight * 0.2
      colors[i * 3 + 2] = 0.16 + normalizedHeight * 0.3
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    const canvas = document.createElement('canvas')
    canvas.width = TERRAIN_SEGMENTS + 1
    canvas.height = TERRAIN_SEGMENTS + 1
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0b1d2a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    onTerrainGenerated(points)

    return { geometry: geo, canvas, texture }
  }, [onTerrainGenerated])

  useEffect(() => {
    heatmapTextureRef.current = texture
    return () => {
      texture.dispose()
    }
  }, [texture])

  useEffect(() => {
    if (!canvas || !heatmapData.size) return
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] * 0.95)
      data[i + 1] = Math.floor(data[i + 1] * 0.95)
      data[i + 2] = Math.floor(data[i + 2] * 0.95)
    }

    heatmapData.forEach((value, key) => {
      const [gx, gz] = key.split(',').map(Number)
      const intensity = Math.min(value, 1)

      for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
          const px = gx + dx
          const pz = gz + dz
          if (px < 0 || px >= canvas.width || pz < 0 || pz >= canvas.height) continue

          const dist = Math.sqrt(dx * dx + dz * dz)
          const falloff = Math.max(0, 1 - dist / 4)
          const alpha = intensity * falloff

          const idx = (pz * canvas.width + px) * 4

          if (intensity > 0.7) {
            data[idx] = Math.min(255, data[idx] + 255 * alpha)
            data[idx + 1] = Math.min(255, data[idx + 1] + 127 * alpha)
            data[idx + 2] = Math.min(255, data[idx + 2] + 80 * alpha)
          } else if (intensity > 0.4) {
            data[idx] = Math.min(255, data[idx] + 57 * alpha)
            data[idx + 1] = Math.min(255, data[idx + 1] + 255 * alpha)
            data[idx + 2] = Math.min(255, data[idx + 2] + 20 * alpha)
          } else {
            data[idx + 1] = Math.min(255, data[idx + 1] + 255 * alpha * 0.5)
            data[idx + 2] = Math.min(255, data[idx + 2] + 200 * alpha * 0.3)
          }
        }
      }
    })

    ctx.putImageData(imageData, 0, 0)
    if (heatmapTextureRef.current) {
      heatmapTextureRef.current.needsUpdate = true
    }
  }, [heatmapData, canvas])

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        map={texture}
        transparent
        opacity={0.9}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

const SonarWave = ({
  probe,
  onEcho,
  onHeatmapUpdate
}: {
  probe: { id: number; position: THREE.Vector3; radius: number; speed: number; maxRadius: number; active: boolean }
  onEcho: (intensity: number, distance: number, angle: number) => void
  onHeatmapUpdate: (gx: number, gz: number, value: number) => void
}) => {
  const ringRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const { updateProbeRadius, removeProbe, terrainPoints } = useStore()
  const detectedPoints = useRef<Set<string>>(new Set())
  const particleCount = 100

  const particlePositions = useMemo(() => new Float32Array(particleCount * 3), [])

  useFrame((_, delta) => {
    if (!ringRef.current || !probe.active) return

    const newRadius = probe.radius + probe.speed * delta
    updateProbeRadius(probe.id, newRadius)

    ringRef.current.scale.setScalar(newRadius)
    const material = ringRef.current.material as THREE.MeshBasicMaterial
    material.opacity = Math.max(0, 1 - newRadius / probe.maxRadius)

    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + newRadius * 0.1
        const heightOffset = Math.sin(angle * 3 + newRadius * 0.2) * 2
        pos[i * 3] = probe.position.x + Math.cos(angle) * newRadius
        pos[i * 3 + 1] = probe.position.y + heightOffset + (Math.random() - 0.5) * 0.5
        pos[i * 3 + 2] = probe.position.z + Math.sin(angle) * newRadius
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      ;(particlesRef.current.material as THREE.PointsMaterial).opacity = Math.max(
        0,
        0.6 - newRadius / probe.maxRadius * 0.6
      )
    }

    terrainPoints.forEach((point) => {
      const dist = Math.sqrt(
        Math.pow(point.position.x - probe.position.x, 2) +
          Math.pow(point.position.z - probe.position.z, 2)
      )

      if (Math.abs(dist - newRadius) < 2 && !detectedPoints.current.has(`${point.position.x},${point.position.z}`)) {
        detectedPoints.current.add(`${point.position.x},${point.position.z}`)

        const intensity = point.type === 'mountain' ? 0.9 : point.type === 'trench' ? 0.3 : 0.5
        const distance = dist
        const angle = Math.atan2(point.position.z - probe.position.z, point.position.x - probe.position.x)

        onEcho(intensity, distance, angle)

        const gx = Math.floor(((point.position.x + TERRAIN_SIZE / 2) / TERRAIN_SIZE) * (TERRAIN_SEGMENTS + 1))
        const gz = Math.floor(((point.position.z + TERRAIN_SIZE / 2) / TERRAIN_SIZE) * (TERRAIN_SEGMENTS + 1))
        onHeatmapUpdate(gx, gz, intensity)
      }
    })

    if (newRadius >= probe.maxRadius) {
      removeProbe(probe.id)
    }
  })

  return (
    <group>
      <mesh ref={ringRef} position={probe.position}>
        <ringGeometry args={[0.98, 1, 64]} />
        <meshBasicMaterial
          color="#39ff14"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={probe.position}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.9} />
      </mesh>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          color="#39ff14"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

const SceneContent = () => {
  const { sonarProbes, addEchoData, updateHeatmap, addSonarProbe, setTerrainPoints } = useStore()
  const { camera, gl, raycaster } = useThree()
  const clickPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const terrainGenerated = useRef(false)

  const handleTerrainGenerated = (points: TerrainPoint[]) => {
    if (!terrainGenerated.current) {
      terrainGenerated.current = true
      setTerrainPoints(points)
    }
  }

  const handleEcho = (intensity: number, distance: number, angle: number) => {
    addEchoData({ intensity, distance, angle })
  }

  const handleHeatmapUpdate = (gx: number, gz: number, value: number) => {
    updateHeatmap(`${gx},${gz}`, value)
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.target !== gl.domElement) return

      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      const intersectPoint = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(clickPlaneRef.current, intersectPoint)) {
        const clampedX = Math.max(-TERRAIN_SIZE / 2 + 5, Math.min(TERRAIN_SIZE / 2 - 5, intersectPoint.x))
        const clampedZ = Math.max(-TERRAIN_SIZE / 2 + 5, Math.min(TERRAIN_SIZE / 2 - 5, intersectPoint.z))
        const clampedY = generateTerrainHeight(clampedX, clampedZ) + 2
        addSonarProbe(new THREE.Vector3(clampedX, clampedY, clampedZ))
      }
    }

    gl.domElement.addEventListener('click', handleClick)
    return () => gl.domElement.removeEventListener('click', handleClick)
  }, [camera, gl, raycaster, addSonarProbe])

  return (
    <>
      <ambientLight intensity={0.15} color="#1a3a4a" />
      <pointLight position={[50, 30, 50]} intensity={0.5} color="#4b0082" distance={200} />
      <pointLight position={[-50, 20, -50]} intensity={0.3} color="#0b1d2a" distance={150} />
      <directionalLight position={[0, 50, 0]} intensity={0.2} color="#1e4d5c" />

      <fog attach="fog" args={['#0b1d2a', 30, 180]} />

      <OceanParticles />

      <Stars radius={200} depth={100} count={200} factor={2} saturation={0} fade speed={0.5} />

      <Terrain onTerrainGenerated={handleTerrainGenerated} />

      {sonarProbes.map((probe) => (
        <SonarWave
          key={probe.id}
          probe={probe}
          onEcho={handleEcho}
          onHeatmapUpdate={handleHeatmapUpdate}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={20}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.2}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

const Scene = () => {
  return (
    <Canvas
      camera={{ position: [0, 40, 60], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0b1d2a' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b1d2a']} />
      <SceneContent />
    </Canvas>
  )
}

export default Scene
