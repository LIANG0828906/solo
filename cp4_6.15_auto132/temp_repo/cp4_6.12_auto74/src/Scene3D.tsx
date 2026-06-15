import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from './useStore'
import { generateWaveParticles, isWaveActive, WaveParticle } from './SeismicWave'

const LAYER_COLORS = {
  sandstone: '#db9f5a',
  mudstone: '#705a42',
  granite: '#8b7d6b'
}

const PROFILE_WIDTH = 10
const PROFILE_DEPTH = 6

function useLayerHeights(): [number, number, number] {
  return useMemo(() => {
    const rand = () => 1 + Math.random() * 2
    return [rand(), rand(), rand()]
  }, [])
}

function createRockTexture(color: string): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const baseColor = new THREE.Color(color)
  ctx.fillStyle = `rgb(${baseColor.r * 255}, ${baseColor.g * 255}, ${baseColor.b * 255})`
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 3000; i++) {
    const x = Math.floor(Math.random() * size)
    const y = Math.floor(Math.random() * size)
    const brightness = (Math.random() - 0.5) * 40
    const r = Math.max(0, Math.min(255, baseColor.r * 255 + brightness))
    const g = Math.max(0, Math.min(255, baseColor.g * 255 + brightness))
    const b = Math.max(0, Math.min(255, baseColor.b * 255 + brightness))
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.fillRect(x, y, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

function RockLayer({
  y,
  height,
  color,
  offsetX,
  shakeOffset,
  side
}: {
  y: number
  height: number
  color: string
  offsetX: number
  shakeOffset: number
  side: 'left' | 'right'
}) {
  const texture = useMemo(() => createRockTexture(color), [color])

  const width = side === 'left' ? PROFILE_WIDTH / 2 + 0.1 : PROFILE_WIDTH / 2 + 0.1
  const xPos = side === 'left' ? -PROFILE_WIDTH / 4 + offsetX - 0.05 : PROFILE_WIDTH / 4 + offsetX + 0.05

  return (
    <mesh position={[xPos + shakeOffset, y, 0]}>
      <boxGeometry args={[width, height, PROFILE_DEPTH]} />
      <meshStandardMaterial
        map={texture}
        color={color}
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  )
}

function FaultPlane({ shakeOffset }: { shakeOffset: number }) {
  const gridSize = 4
  const gridSpacing = 0.3
  const divisions = Math.floor(gridSize / gridSpacing)

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const half = gridSize / 2

    for (let i = 0; i <= divisions; i++) {
      const t = (i / divisions) * gridSize - half
      pts.push(new THREE.Vector3(t, -t - half, -PROFILE_DEPTH / 2))
      pts.push(new THREE.Vector3(t, -t - half, PROFILE_DEPTH / 2))
    }

    for (let j = 0; j <= Math.ceil(PROFILE_DEPTH / gridSpacing); j++) {
      const z = -PROFILE_DEPTH / 2 + j * gridSpacing
      for (let i = 0; i <= divisions; i++) {
        const t1 = (i / divisions) * gridSize - half
        if (i === 0) pts.push(new THREE.Vector3(t1, -t1 - half, z))
        else pts.push(new THREE.Vector3(t1, -t1 - half, z))
        if (i < divisions) {
          const t2 = ((i + 1) / divisions) * gridSize - half
          pts.push(new THREE.Vector3(t2, -t2 - half, z))
        }
      }
    }

    return pts
  }, [])

  const lineGeometry = useMemo(() => {
    const positions: number[] = []
    const half = gridSize / 2

    for (let i = 0; i <= divisions; i++) {
      const t = (i / divisions) * gridSize - half
      positions.push(t, -t - half, -PROFILE_DEPTH / 2)
      positions.push(t, -t - half, PROFILE_DEPTH / 2)
    }

    for (let j = 0; j <= Math.ceil(PROFILE_DEPTH / gridSpacing); j++) {
      const z = -PROFILE_DEPTH / 2 + j * gridSpacing
      positions.push(-half, half - half, z)
      positions.push(half, -half - half, z)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  return (
    <group position={[shakeOffset, 0, 0]}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.5} linewidth={1} />
      </lineSegments>

      {[0, 1, 2].map((row) => {
        const t = (row / 2) * 2 - 1
        const baseY = -t - 1
        return (
          <group key={row}>
            {[-0.8, -0.4, 0, 0.4, 0.8].map((zOff, idx) => (
              <group key={`l-${row}-${idx}`} position={[t - 0.3, baseY + 0.2, zOff]}>
                <mesh rotation={[0, 0, Math.PI / 4]}>
                  <coneGeometry args={[0.08, 0.25, 6]} />
                  <meshBasicMaterial color="#ff3333" />
                </mesh>
                <mesh position={[0.06, -0.06, 0]} rotation={[0, 0, Math.PI / 4]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
                  <meshBasicMaterial color="#ff3333" />
                </mesh>
              </group>
            ))}
            {[-0.8, -0.4, 0, 0.4, 0.8].map((zOff, idx) => (
              <group key={`r-${row}-${idx}`} position={[t + 0.3, baseY - 0.2, zOff]}>
                <mesh rotation={[0, 0, -Math.PI * 3 / 4]}>
                  <coneGeometry args={[0.08, 0.25, 6]} />
                  <meshBasicMaterial color="#ff3333" />
                </mesh>
                <mesh position={[-0.06, 0.06, 0]} rotation={[0, 0, -Math.PI * 3 / 4]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.2, 8]} />
                  <meshBasicMaterial color="#ff3333" />
                </mesh>
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}

function Hypocenter({ active, shakeOffset }: { active: boolean; shakeOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current && active) {
      const t = state.clock.elapsedTime
      const scale = 1 + Math.sin(t * Math.PI * 4) * 0.3
      meshRef.current.scale.setScalar(scale)
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.6 + Math.sin(t * Math.PI * 4) * 0.4
    }
  })

  if (!active) return null

  return (
    <mesh ref={meshRef} position={[shakeOffset, -1, 0]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#ff3333" transparent opacity={0.8} />
    </mesh>
  )
}

function SeismicWaves({ layerHeights }: { layerHeights: [number, number, number] }) {
  const waves = useStore((s) => s.waves)
  const densities = useStore((s) => s.densities)
  const removeWave = useStore((s) => s.removeWave)
  const pointsRef = useRef<THREE.Points>(null)

  const [allParticles, setAllParticles] = useState<WaveParticle[]>([])

  useFrame(() => {
    const now = performance.now()
    const maxRadius = 15

    const particles: WaveParticle[] = []

    waves.forEach((wave) => {
      const elapsed = (now - wave.startTime) / 1000

      if (!isWaveActive(elapsed, maxRadius)) {
        removeWave(wave.id)
        return
      }

      const waveParticles = generateWaveParticles({
        origin: wave.origin,
        elapsed,
        densityLayers: densities,
        layerHeights,
        maxRadius
      })

      const intensity = Math.max(0, 1 - elapsed / 10)
      waveParticles.forEach((p) => {
        particles.push({
          ...p,
          opacity: p.opacity * intensity * wave.magnitude
        })
      })
    })

    setAllParticles(particles)
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(allParticles.length * 3)
    const colors = new Float32Array(allParticles.length * 3)
    const sizes = new Float32Array(allParticles.length)

    allParticles.forEach((p, i) => {
      positions[i * 3] = p.position[0]
      positions[i * 3 + 1] = p.position[1]
      positions[i * 3 + 2] = p.position[2]
      colors[i * 3] = p.color[0]
      colors[i * 3 + 1] = p.color[1]
      colors[i * 3 + 2] = p.color[2]
      sizes[i] = p.size
    })

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [allParticles])

  if (allParticles.length === 0) return null

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function SurfaceWave({ layerHeights }: { layerHeights: [number, number, number] }) {
  const waves = useStore((s) => s.waves)
  const meshRef = useRef<THREE.Mesh>(null)
  const totalHeight = layerHeights[0] + layerHeights[1] + layerHeights[2]
  const surfaceY = totalHeight / 2

  const segmentsX = 60
  const segmentsZ = 40

  const { geometry, basePositions } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(PROFILE_WIDTH, PROFILE_DEPTH, segmentsX, segmentsZ)
    geo.rotateX(-Math.PI / 2)
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const base = new Float32Array(posAttr.array.length)
    base.set(posAttr.array)
    return { geometry: geo, basePositions: base }
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const now = performance.now()
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const arr = positions.array as Float32Array

    for (let i = 0; i < positions.count; i++) {
      const x = basePositions[i * 3]
      const z = basePositions[i * 3 + 2]

      let displacement = 0
      waves.forEach((wave) => {
        const elapsed = (now - wave.startTime) / 1000
        if (elapsed > 12) return

        const dx = x - wave.origin[0]
        const dz = z - wave.origin[2]
        const dist = Math.sqrt(dx * dx + dz * dz)

        const waveSpeed = 2.5
        const waveRadius = waveSpeed * elapsed
        const waveWidth = 1.5

        const envelope = Math.exp(-Math.pow((dist - waveRadius) / waveWidth, 2))
        const decay = Math.exp(-elapsed * 0.3)
        const freq = 3
        const oscillation = Math.sin((dist - waveRadius) * freq * Math.PI)

        displacement += oscillation * envelope * decay * 0.15 * wave.magnitude
      })

      arr[i * 3 + 1] = surfaceY + displacement
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, surfaceY, 0]}>
      <meshStandardMaterial color="#4a7c59" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function SceneContent({ layerHeights }: { layerHeights: [number, number, number] }) {
  const slipAmount = useStore((s) => s.slipAmount)
  const densities = useStore((s) => s.densities)
  const addWave = useStore((s) => s.addWave)
  const lastWaveTriggerSlip = useStore((s) => s.lastWaveTriggerSlip)
  const setLastWaveTriggerSlip = useStore((s) => s.setLastWaveTriggerSlip)

  const [shakeOffset, setShakeOffset] = useState(0)
  const slipRef = useRef(0)
  const shakeStartTime = useRef(0)

  const totalHeight = layerHeights[0] + layerHeights[1] + layerHeights[2]
  const layer1Y = -totalHeight / 2 + layerHeights[2] + layerHeights[1] + layerHeights[0] / 2
  const layer2Y = -totalHeight / 2 + layerHeights[2] + layerHeights[1] / 2
  const layer3Y = -totalHeight / 2 + layerHeights[2] / 2

  useEffect(() => {
    if (Math.abs(slipAmount - slipRef.current) > 0.01) {
      shakeStartTime.current = performance.now()
    }
    slipRef.current = slipAmount
  }, [slipAmount])

  useEffect(() => {
    const threshold = 5
    if (
      slipAmount >= threshold &&
      lastWaveTriggerSlip < threshold
    ) {
      const magnitude = Math.min(1 + (slipAmount - threshold) / 15, 2)
      addWave([0, -1, 0], magnitude)
    }
    if (slipAmount !== lastWaveTriggerSlip) {
      setLastWaveTriggerSlip(slipAmount)
    }
  }, [slipAmount, lastWaveTriggerSlip, addWave, setLastWaveTriggerSlip])

  useFrame(() => {
    const elapsed = (performance.now() - shakeStartTime.current) / 1000
    const shakeDuration = 0.1
    if (elapsed < shakeDuration) {
      const intensity = (1 - elapsed / shakeDuration) * 0.05
      setShakeOffset((Math.random() - 0.5) * intensity)
    } else {
      setShakeOffset(0)
    }
  })

  const slipRatio = slipAmount / 20
  const leftOffset = -slipRatio * 1.5
  const rightOffset = slipRatio * 1.5

  const hypocenterActive = slipAmount > 5

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -3]} intensity={0.3} />

      <RockLayer
        y={layer1Y}
        height={layerHeights[0]}
        color={LAYER_COLORS.sandstone}
        offsetX={leftOffset}
        shakeOffset={shakeOffset}
        side="left"
      />
      <RockLayer
        y={layer1Y}
        height={layerHeights[0]}
        color={LAYER_COLORS.sandstone}
        offsetX={rightOffset}
        shakeOffset={shakeOffset}
        side="right"
      />

      <RockLayer
        y={layer2Y}
        height={layerHeights[1]}
        color={LAYER_COLORS.mudstone}
        offsetX={leftOffset}
        shakeOffset={shakeOffset}
        side="left"
      />
      <RockLayer
        y={layer2Y}
        height={layerHeights[1]}
        color={LAYER_COLORS.mudstone}
        offsetX={rightOffset}
        shakeOffset={shakeOffset}
        side="right"
      />

      <RockLayer
        y={layer3Y}
        height={layerHeights[2]}
        color={LAYER_COLORS.granite}
        offsetX={leftOffset}
        shakeOffset={shakeOffset}
        side="left"
      />
      <RockLayer
        y={layer3Y}
        height={layerHeights[2]}
        color={LAYER_COLORS.granite}
        offsetX={rightOffset}
        shakeOffset={shakeOffset}
        side="right"
      />

      <FaultPlane shakeOffset={shakeOffset} />

      <Hypocenter active={hypocenterActive} shakeOffset={shakeOffset} />

      <SeismicWaves layerHeights={layerHeights} />

      <SurfaceWave layerHeights={layerHeights} />

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={30}
        enablePan={true}
        mouseButtons={{
          LEFT: undefined as any,
          MIDDLE: undefined as any,
          RIGHT: THREE.MOUSE.PAN
        }}
      />
    </>
  )
}

export default function Scene3D() {
  const layerHeights = useLayerHeights()

  return (
    <Canvas
      camera={{ position: [8, 8, 8], fov: 50 }}
      style={{ width: '100%', height: '100%', background: '#0a0a1a' }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ camera }) => {
        camera.position.set(8, 8, 8)
        camera.lookAt(0, 0, 0)
      }}
    >
      <fog attach="fog" args={['#0a0a1a', 20, 50]} />
      <SceneContent layerHeights={layerHeights} />
    </Canvas>
  )
}
