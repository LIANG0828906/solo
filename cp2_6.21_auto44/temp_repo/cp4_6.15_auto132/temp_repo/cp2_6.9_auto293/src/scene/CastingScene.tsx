import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Environment, Html, Text } from '@react-three/drei'
import * as THREE from 'three'
import { CopperAlloy, PolishTool, ProcessStep } from '../utils/materials'

interface FurnaceProps {
  isHeating: boolean
  heatIntensity: number
  onIngotDropped: () => void
}

function Furnace({ isHeating, heatIntensity, onIngotDropped }: FurnaceProps) {
  const furnaceRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 150

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.4
      positions[i * 3 + 1] = Math.random() * 0.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = Math.random() * 0.05 + 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      lifetimes[i] = Math.random()
    }
    return { positions, velocities, lifetimes }
  }, [])

  useFrame(() => {
    if (!particlesRef.current || !isHeating) return
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += particles.velocities[i * 3]
      positions[i * 3 + 1] += particles.velocities[i * 3 + 1] * heatIntensity
      positions[i * 3 + 2] += particles.velocities[i * 3 + 2]
      particles.lifetimes[i] -= 0.01
      if (particles.lifetimes[i] <= 0) {
        positions[i * 3] = (Math.random() - 0.5) * 0.4
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4
        particles.lifetimes[i] = 1
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  const handleDrop = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onIngotDropped()
  }, [onIngotDropped])

  const fireColor = useMemo(() => {
    const t = heatIntensity
    const r = Math.floor(255)
    const g = Math.floor(100 + t * 155)
    const b = Math.floor(t * 255)
    return `rgb(${r}, ${g}, ${b})`
  }, [heatIntensity])

  return (
    <group ref={furnaceRef} position={[1.5, 0, 0]} onPointerUp={handleDrop}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 2, 16]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.5, 16]} />
        <meshBasicMaterial color="#2a1810" />
      </mesh>
      {isHeating && (
        <points ref={particlesRef} position={[0, 0.5, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={particles.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={fireColor}
            size={0.08}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
      <pointLight
        position={[0, 1, 0]}
        color={fireColor}
        intensity={isHeating ? 2 + heatIntensity * 3 : 0.5}
        distance={5}
      />
    </group>
  )
}

interface MetalIngotProps {
  alloy: CopperAlloy
  position: [number, number, number]
  onDragStart: (alloy: CopperAlloy) => void
  onDragEnd: () => void
}

function MetalIngot({ alloy, position, onDragStart, onDragEnd }: MetalIngotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      if (hovered && !dragging) {
        meshRef.current.rotation.y += 0.02
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
      } else if (dragging) {
        const x = (state.pointer.x * state.viewport.width) / 2
        const y = (state.pointer.y * state.viewport.height) / 2
        meshRef.current.position.set(x, y + 1, 0)
      } else {
        meshRef.current.position.set(...position)
        meshRef.current.rotation.y += 0.005
      }
    }
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setDragging(true)
    onDragStart(alloy)
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setDragging(false)
    onDragEnd()
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        castShadow
      >
        <boxGeometry args={[0.3, 0.2, 0.15]} />
        <meshStandardMaterial
          color={alloy.color}
          metalness={alloy.metalness}
          roughness={alloy.roughness}
          emissive={hovered ? alloy.color : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      {hovered && (
        <Html position={[position[0], position[1] + 0.3, position[2]]} center>
          <div style={{
            background: 'rgba(42, 27, 24, 0.95)',
            border: '1px solid #8d6e63',
            borderRadius: '4px',
            padding: '8px 12px',
            color: '#d7ccc8',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            fontFamily: "'Noto Serif SC', serif"
          }}>
            <div style={{ fontWeight: 600, color: '#bcaaa4' }}>{alloy.name}</div>
            <div>熔点: {alloy.meltingPoint}°C</div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface MoldProps {
  isOpen: boolean
  coolingProgress: number
  hasMetal: boolean
}

function Mold({ isOpen, coolingProgress, hasMetal }: MoldProps) {
  const moldColor = useMemo(() => {
    if (!hasMetal) return '#696969'
    const t = coolingProgress
    const r = Math.floor(255 - t * 150)
    const g = Math.floor(99 - t * 50)
    const b = Math.floor(71 - t * 40)
    return `rgb(${Math.max(r, 105)}, ${Math.max(g, 105)}, ${Math.max(b, 105)})`
  }, [coolingProgress, hasMetal])

  return (
    <group position={[1.5, 0.1, -0.5]}>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.85, 0.15, 32]} />
        <meshStandardMaterial color={moldColor} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.6, 0.75, 32]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>
      <Text
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        color="#2a1810"
        font="https://fonts.gstatic.com/s/mashanzheng/v10/NaPecZTRCLxvwo41b4gvzkXaRME.woff"
      >
        蟠螭纹
      </Text>
      <mesh
        position={[0, isOpen ? 0.5 : 0.15, isOpen ? -0.3 : 0]}
        rotation={isOpen ? [-Math.PI / 3, 0, 0] : [0, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color={moldColor} roughness={0.9} />
      </mesh>
    </group>
  )
}

interface BronzeMirrorProps {
  alloy: CopperAlloy | null
  reflectivity: number
  roughness: number
  isRotating: boolean
  onPolish: (tool: PolishTool, delta: THREE.Vector2) => void
  currentTool: PolishTool | null
  polishStage: 'coarse' | 'fine' | 'polish' | null
}

function BronzeMirror({
  alloy,
  reflectivity,
  roughness,
  isRotating,
  onPolish,
  currentTool,
  polishStage
}: BronzeMirrorProps) {
  const mirrorRef = useRef<THREE.Group>(null)
  const surfaceRef = useRef<THREE.Mesh>(null)
  const [isDragging, setIsDragging] = useState(false)
  const lastPos = useRef<THREE.Vector2 | null>(null)
  const scratchTexture = useRef<THREE.CanvasTexture | null>(null)

  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#7a7a7a'
    ctx.fillRect(0, 0, 512, 512)
    scratchTexture.current = new THREE.CanvasTexture(c)
    scratchTexture.current.wrapS = THREE.RepeatWrapping
    scratchTexture.current.wrapT = THREE.RepeatWrapping
    return c
  }, [])

  const addScratch = useCallback((intensity: number, centerX: number, centerY: number) => {
    const ctx = canvas.getContext('2d')!
    const radius = 30 + intensity * 40
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    
    if (intensity > 0.4) {
      gradient.addColorStop(0, 'rgba(100, 100, 100, 0.6)')
      gradient.addColorStop(0.5, 'rgba(120, 120, 120, 0.3)')
      gradient.addColorStop(1, 'rgba(150, 150, 150, 0)')
    } else if (intensity > 0.15) {
      gradient.addColorStop(0, 'rgba(180, 180, 180, 0.4)')
      gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.2)')
      gradient.addColorStop(1, 'rgba(220, 220, 220, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(220, 220, 220, 0.3)')
      gradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.15)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    }
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    
    if (scratchTexture.current) {
      scratchTexture.current.needsUpdate = true
    }
  }, [canvas])

  useFrame((_state, delta) => {
    if (mirrorRef.current && isRotating) {
      mirrorRef.current.rotation.y += delta * (Math.PI * 2) / 20
    }
    if (surfaceRef.current && scratchTexture.current) {
      const material = surfaceRef.current.material as THREE.MeshStandardMaterial
      material.roughness = Math.max(0.02, roughness)
      material.metalness = Math.min(0.98, 0.8 + reflectivity * 0.2)
    }
  })

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!currentTool || polishStage === null) return
    e.stopPropagation()
    setIsDragging(true)
    lastPos.current = new THREE.Vector2(e.point.x, e.point.y)
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !currentTool || !lastPos.current) return
    e.stopPropagation()
    const currentPos = new THREE.Vector2(e.point.x, e.point.y)
    const delta = currentPos.clone().sub(lastPos.current)
    
    if (delta.length() > 0.05) {
      const uv = e.uv!
      addScratch(currentTool.scratchIntensity, uv.x * 512, (1 - uv.y) * 512)
      onPolish(currentTool, delta)
      lastPos.current = currentPos
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    lastPos.current = null
  }

  const baseColor = alloy?.color || '#8d6e63'
  const surfaceColor = polishStage === 'coarse' ? '#7a7a7a' : 
                       polishStage === 'fine' ? '#a0a0a0' : 
                       baseColor

  if (!alloy) return null

  return (
    <group ref={mirrorRef} position={[-0.5, 0.6, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.6, 0.55, 0.08, 64]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      <mesh
        ref={surfaceRef}
        position={[0, 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        castShadow
      >
        <circleGeometry args={[0.55, 64]} />
        <meshStandardMaterial
          color={surfaceColor}
          metalness={0.9}
          roughness={Math.max(0.02, roughness)}
          map={scratchTexture.current}
          envMapIntensity={reflectivity}
        />
      </mesh>
      <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 64]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <Text
        position={[0, -0.04, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color="#3e2723"
        font="https://fonts.gstatic.com/s/mashanzheng/v10/NaPecZTRCLxvwo41b4gvzkXaRME.woff"
      >
        蟠螭纹铜镜
      </Text>
    </group>
  )
}

function Workbench() {
  return (
    <group position={[0, 0.4, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.2, 2]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      <mesh position={[-1.3, -0.35, 0.8]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
      <mesh position={[1.3, -0.35, 0.8]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
      <mesh position={[-1.3, -0.35, -0.8]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
      <mesh position={[1.3, -0.35, -0.8]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.8, 1.8]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.9} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function WoodenRack({ children }: { children: React.ReactNode }) {
  return (
    <group position={[-2.5, 0.8, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 1.5, 0.3]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0.16]} castShadow>
        <boxGeometry args={[0.7, 0.05, 0.15]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[0, 0, 0.16]} castShadow>
        <boxGeometry args={[0.7, 0.05, 0.15]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh position={[0, -0.5, 0.16]} castShadow>
        <boxGeometry args={[0.7, 0.05, 0.15]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {children}
    </group>
  )
}

function StoneFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[(i % 5 - 2) * 2, -0.49, (Math.floor(i / 5) - 2) * 2]}
          receiveShadow
        >
          <planeGeometry args={[1.9, 1.9]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

interface CastingSceneProps {
  currentStep: ProcessStep
  selectedAlloy: CopperAlloy | null
  isSmelting: boolean
  smeltProgress: number
  isCasting: boolean
  coolingProgress: number
  moldOpen: boolean
  mirrorReflectivity: number
  mirrorRoughness: number
  isRotating: boolean
  currentTool: PolishTool | null
  polishStage: 'coarse' | 'fine' | 'polish' | null
  onAlloySelect: (alloy: CopperAlloy) => void
  onIngotDropped: () => void
  onPolish: (tool: PolishTool, delta: THREE.Vector2) => void
  onSmeltComplete: () => void
  onCoolComplete: () => void
  copperAlloys: CopperAlloy[]
}

export function CastingSceneContent({
  currentStep,
  selectedAlloy,
  isSmelting,
  smeltProgress,
  isCasting,
  coolingProgress,
  moldOpen,
  mirrorReflectivity,
  mirrorRoughness,
  isRotating,
  currentTool,
  polishStage,
  onAlloySelect,
  onIngotDropped,
  onPolish,
  onSmeltComplete,
  onCoolComplete,
  copperAlloys
}: CastingSceneProps) {
  const [, setDraggedAlloy] = useState<CopperAlloy | null>(null)
  const smeltCompleteRef = useRef(false)
  const coolCompleteRef = useRef(false)

  useEffect(() => {
    if (isSmelting && smeltProgress >= 1 && !smeltCompleteRef.current) {
      smeltCompleteRef.current = true
      onSmeltComplete()
    }
    if (!isSmelting) {
      smeltCompleteRef.current = false
    }
  }, [isSmelting, smeltProgress, onSmeltComplete])

  useEffect(() => {
    if (isCasting && coolingProgress >= 1 && !coolCompleteRef.current) {
      coolCompleteRef.current = true
      onCoolComplete()
    }
    if (!isCasting) {
      coolCompleteRef.current = false
    }
  }, [isCasting, coolingProgress, onCoolComplete])

  const handleDragStart = useCallback((alloy: CopperAlloy) => {
    setDraggedAlloy(alloy)
    onAlloySelect(alloy)
  }, [onAlloySelect])

  const handleDragEnd = useCallback(() => {
    setDraggedAlloy(null)
  }, [])

  const showMirror = currentStep === 'polish' || currentStep === 'finish'
  const showMold = currentStep === 'cast' || currentStep === 'cool' || currentStep === 'polish' || currentStep === 'finish'

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <pointLight position={[-3, 3, 0]} intensity={0.5} color="#ffe4b5" />
      <Environment preset="studio" />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        minPolarAngle={Math.PI / 18}
        maxPolarAngle={Math.PI * 8 / 18}
        target={[0, 0.5, 0]}
      />

      <StoneFloor />
      <Workbench />
      
      <WoodenRack>
        {copperAlloys.map((alloy, index) => (
          <MetalIngot
            key={alloy.id}
            alloy={alloy}
            position={[
              (index % 2 === 0 ? -0.2 : 0.2),
              0.5 - Math.floor(index / 2) * 0.5,
              0.3
            ]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </WoodenRack>

      <Furnace
        isHeating={isSmelting || currentStep === 'smelt'}
        heatIntensity={smeltProgress}
        onIngotDropped={onIngotDropped}
      />

      {showMold && (
        <Mold
          isOpen={moldOpen}
          coolingProgress={coolingProgress}
          hasMetal={isCasting || currentStep === 'cool' || currentStep === 'polish' || currentStep === 'finish'}
        />
      )}

      {showMirror && (
        <BronzeMirror
          alloy={selectedAlloy}
          reflectivity={mirrorReflectivity}
          roughness={mirrorRoughness}
          isRotating={isRotating}
          onPolish={onPolish}
          currentTool={currentTool}
          polishStage={polishStage}
        />
      )}
    </>
  )
}

export function CastingScene(props: CastingSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 3, 5], fov: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <CastingSceneContent {...props} />
    </Canvas>
  )
}
