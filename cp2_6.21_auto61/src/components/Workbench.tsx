import { useRef, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, FragmentData } from '../store'
import { checkSnapEligibility, lerpTowardsTarget, generateFragmentEdgeProfile } from '../utils/geometry'
import { GoldenParticleSystem, SnapGlowEffect } from '../utils/particleSystem'

const TOTAL_FRAGMENTS = 10

function generateJaggedSawtooth(
  startAngle: number,
  endAngle: number,
  radius: number,
  fragmentId: number,
  edgeSide: 'left' | 'right'
): [number, number][] {
  const points: [number, number][] = []
  const segments = 12
  const seed = fragmentId * 7919 + (edgeSide === 'left' ? 12345 : 67890)
  
  function pseudoRandom(step: number): number {
    const x = Math.sin(seed + step * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const baseAngle = startAngle + (endAngle - startAngle) * t
    
    const sawtoothWave = Math.abs(((i * 0.618) % 1) - 0.5) * 2
    const jaggedAmount = 0.08 + sawtoothWave * 0.12
    const randomJitter = (pseudoRandom(i) - 0.5) * 0.06
    
    const actualRadius = radius * (0.88 + jaggedAmount + randomJitter)
    
    points.push([baseAngle, actualRadius])
  }
  
  return points
}

function createFragmentGeometry(id: number, total: number): THREE.BufferGeometry {
  const angleStep = (Math.PI * 2) / total
  const startAngle = id * angleStep - Math.PI / 2
  const endAngle = startAngle + angleStep
  const midAngle = (startAngle + endAngle) / 2
  
  generateFragmentEdgeProfile(id, total, 16)
  
  const heightSegments = 16
  const radialSegments = 8
  
  const profilePoints: [number, number][] = []
  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments
    const y = t * 3 - 1.5
    
    let r: number
    if (t < 0.15) {
      r = 0.3 + (0.4 - 0.3) * (t / 0.15)
    } else if (t < 0.35) {
      r = 0.4 + (0.9 - 0.4) * ((t - 0.15) / 0.2)
    } else if (t < 0.7) {
      r = 0.9 + (1.0 - 0.9) * ((t - 0.35) / 0.35)
    } else if (t < 0.9) {
      r = 1.0 + (0.6 - 1.0) * ((t - 0.7) / 0.2)
    } else {
      r = 0.6 + (0.35 - 0.6) * ((t - 0.9) / 0.1)
    }
    profilePoints.push([y, r])
  }
  
  const leftSawtooth = generateJaggedSawtooth(startAngle, endAngle, 1, id, 'left')
  const rightSawtooth = generateJaggedSawtooth(startAngle, endAngle, 1, id, 'right')
  
  const vertices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  
  for (let h = 0; h <= heightSegments; h++) {
    const [y, baseRadius] = profilePoints[h]
    const leftJaggedFactor = leftSawtooth[h] ? leftSawtooth[h][1] : 1
    const rightJaggedFactor = rightSawtooth[h] ? rightSawtooth[h][1] : 1
    
    for (let r = 0; r <= radialSegments; r++) {
      const tRadial = r / radialSegments
      let angle: number
      let radius: number
      
      if (r === 0) {
        angle = startAngle
        radius = baseRadius * leftJaggedFactor
      } else if (r === radialSegments) {
        angle = endAngle
        radius = baseRadius * rightJaggedFactor
      } else {
        angle = startAngle + tRadial * (endAngle - startAngle)
        const edgeBlend = Math.sin(tRadial * Math.PI)
        radius = baseRadius * (
          1 + (leftJaggedFactor - 1) * (1 - tRadial) + (rightJaggedFactor - 1) * tRadial
        ) * (1 + edgeBlend * 0.03)
      }
      
      const surfaceNoise = Math.sin(angle * 12 + id * 2.5) * 0.015 + 
                          Math.cos(y * 7 + id * 1.7) * 0.01
      radius += surfaceNoise
      
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      vertices.push(x, y, z)
      
      const nx = Math.cos(midAngle) * 0.9 + (Math.random() - 0.5) * 0.1
      const nz = Math.sin(midAngle) * 0.9 + (Math.random() - 0.5) * 0.1
      const ny = 0.1 + (Math.random() - 0.5) * 0.05
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
      normals.push(nx / nLen, ny / nLen, nz / nLen)
      
      uvs.push(tRadial, h / heightSegments)
    }
  }
  
  for (let h = 0; h < heightSegments; h++) {
    for (let r = 0; r < radialSegments; r++) {
      const i = h * (radialSegments + 1) + r
      indices.push(i, i + radialSegments + 1, i + 1)
      indices.push(i + 1, i + radialSegments + 1, i + radialSegments + 2)
    }
  }
  
  for (let h = 0; h < heightSegments; h++) {
    const rowStart = h * (radialSegments + 1)
    const nextRowStart = (h + 1) * (radialSegments + 1)
    
    const leftEdgeIdx = rowStart
    const nextLeftEdgeIdx = nextRowStart
    const innerY = profilePoints[h][0]
    const innerR = profilePoints[h][1] * 0.3
    const nextInnerY = profilePoints[h + 1][0]
    const nextInnerR = profilePoints[h + 1][1] * 0.3
    
    const baseIdx = vertices.length / 3
    
    const innerX = Math.cos(midAngle) * innerR
    const innerZ = Math.sin(midAngle) * innerR
    const nextInnerX = Math.cos(midAngle) * nextInnerR
    const nextInnerZ = Math.sin(midAngle) * nextInnerR
    
    vertices.push(innerX, innerY, innerZ)
    vertices.push(nextInnerX, nextInnerY, nextInnerZ)
    
    normals.push(-Math.cos(midAngle), 0, -Math.sin(midAngle))
    normals.push(-Math.cos(midAngle), 0, -Math.sin(midAngle))
    
    uvs.push(0, h / heightSegments)
    uvs.push(0, (h + 1) / heightSegments)
    
    indices.push(leftEdgeIdx, baseIdx, baseIdx + 1)
    indices.push(leftEdgeIdx, baseIdx + 1, nextLeftEdgeIdx)
    
    const rightEdgeIdx = rowStart + radialSegments
    const nextRightEdgeIdx = nextRowStart + radialSegments
    
    indices.push(rightEdgeIdx, baseIdx + 1, baseIdx)
    indices.push(rightEdgeIdx, nextRightEdgeIdx, baseIdx + 1)
  }
  
  const topCapIdx = vertices.length / 3
  const bottomCapIdx = topCapIdx + 1
  
  const topY = profilePoints[heightSegments][0]
  const bottomY = profilePoints[0][0]
  const topInnerR = profilePoints[heightSegments][1] * 0.3
  const bottomInnerR = profilePoints[0][1] * 0.3
  
  vertices.push(Math.cos(midAngle) * topInnerR, topY, Math.sin(midAngle) * topInnerR)
  vertices.push(Math.cos(midAngle) * bottomInnerR, bottomY, Math.sin(midAngle) * bottomInnerR)
  
  normals.push(0, 1, 0)
  normals.push(0, -1, 0)
  
  uvs.push(0.5, 1)
  uvs.push(0.5, 0)
  
  const topEdgeStart = heightSegments * (radialSegments + 1)
  for (let r = 0; r < radialSegments; r++) {
    indices.push(topCapIdx, topEdgeStart + r, topEdgeStart + r + 1)
  }
  
  const bottomEdgeStart = 0
  for (let r = 0; r < radialSegments; r++) {
    indices.push(bottomCapIdx, bottomEdgeStart + r + 1, bottomEdgeStart + r)
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  
  return geometry
}

function createPorcelainMaterial(): THREE.MeshStandardMaterial {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  gradient.addColorStop(0, '#e8e4d8')
  gradient.addColorStop(0.5, '#d5cfc0')
  gradient.addColorStop(1, '#b8b0a0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  
  ctx.strokeStyle = 'rgba(21, 101, 192, 0.7)'
  ctx.lineWidth = 3
  for (let i = 0; i < 8; i++) {
    const cx = 64 + (i % 4) * 128 + Math.sin(i) * 20
    const cy = 80 + Math.floor(i / 4) * 200 + Math.cos(i) * 30
    ctx.beginPath()
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      const r = 25 + Math.sin(t * 3) * 8
      const px = cx + Math.cos(t) * r
      const py = cy + Math.sin(t) * r * 0.7
      if (t === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
  }
  
  ctx.strokeStyle = 'rgba(13, 71, 161, 0.5)'
  ctx.lineWidth = 2
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x < 512; x += 10) {
      ctx.lineTo(x, y + Math.sin(x * 0.05) * 5)
    }
    ctx.stroke()
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.1
  })
}

function createBronzeMaterial(): THREE.MeshStandardMaterial {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
  gradient.addColorStop(0, '#8b7355')
  gradient.addColorStop(0.5, '#6b5344')
  gradient.addColorStop(1, '#4a3728')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const age = Math.random()
    const alpha = 0.1 + age * 0.3
    
    if (age < 0.3) {
      ctx.fillStyle = `rgba(76, 175, 80, ${alpha})`
    } else if (age < 0.6) {
      ctx.fillStyle = `rgba(46, 125, 50, ${alpha})`
    } else {
      ctx.fillStyle = `rgba(27, 94, 32, ${alpha * 0.5})`
    }
    
    ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1)
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = Math.random() * 20 + 5
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0x8b7355,
    roughness: 0.7,
    metalness: 0.4
  })
}

const FragmentMesh = forwardRef<THREE.Mesh, {
  fragment: FragmentData
  isSelected: boolean
  isSnapHighlighted: boolean
  artifactType: 'blue-porcelain' | 'bronze'
  transformRef: React.MutableRefObject<any>
}>(({ fragment, isSelected, isSnapHighlighted, artifactType, transformRef }, ref) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  useImperativeHandle(ref, () => meshRef.current!)
  
  const geometry = useMemo(() => createFragmentGeometry(fragment.id, TOTAL_FRAGMENTS), [fragment.id])
  const material = useMemo(() => 
    artifactType === 'blue-porcelain' ? createPorcelainMaterial() : createBronzeMaterial(),
    [artifactType]
  )
  
  const emissiveIntensity = isSnapHighlighted ? 0.8 : (isSelected ? 0.4 : (hovered ? 0.2 : 0))
  const emissiveColor = isSnapHighlighted ? 0x00ff00 : 0x2e7d32

  return (
    <TransformControls
      ref={isSelected ? transformRef : null}
      mode="translate"
      position={fragment.initialPosition}
      rotation={fragment.initialRotation}
      enabled={isSelected && !fragment.isFused}
      visible={isSelected && !fragment.isFused}
    >
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          {...material}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </TransformControls>
  )
})

FragmentMesh.displayName = 'FragmentMesh'

function WorkbenchTable() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow>
      <planeGeometry args={[12, 10]} />
      <meshStandardMaterial 
        color={0x3e2723} 
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  )
}

function SceneContent({ transformRef }: { transformRef: React.MutableRefObject<any> }) {
  const { fragments, selectedFragmentId, snapHighlightIds, isComplete, artifactType, fuseFragment, updateFragmentTransform } = useStore()
  const groupRef = useRef<THREE.Group>(null)
  const particleSystemRef = useRef<GoldenParticleSystem | null>(null)
  const snapGlowRef = useRef<SnapGlowEffect | null>(null)
  const { scene } = useThree()
  
  const [snappingId, setSnappingId] = useState<number | null>(null)
  
  const targetRotationRef = useRef(0)
  const currentRotationRef = useRef(0)
  const targetHeightRef = useRef(0)
  const currentHeightRef = useRef(0)

  useEffect(() => {
    particleSystemRef.current = new GoldenParticleSystem()
    snapGlowRef.current = new SnapGlowEffect()
    scene.add(particleSystemRef.current.getPoints())
    scene.add(snapGlowRef.current.getMesh())
    
    return () => {
      if (particleSystemRef.current) {
        scene.remove(particleSystemRef.current.getPoints())
        particleSystemRef.current.dispose()
      }
      if (snapGlowRef.current) {
        scene.remove(snapGlowRef.current.getMesh())
        snapGlowRef.current.dispose()
      }
    }
  }, [scene])

  useEffect(() => {
    if (isComplete && particleSystemRef.current) {
      particleSystemRef.current.start()
      targetHeightRef.current = 2.5
      targetRotationRef.current = Math.PI * 8
    }
  }, [isComplete])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (isComplete) {
      currentRotationRef.current += (targetRotationRef.current - currentRotationRef.current) * 0.015
      currentHeightRef.current += (targetHeightRef.current - currentHeightRef.current) * 0.02
      
      groupRef.current.rotation.y = currentRotationRef.current
      groupRef.current.position.y = currentHeightRef.current
      
      if (particleSystemRef.current) {
        particleSystemRef.current.update(delta, groupRef.current.position)
      }
    }

    if (snapGlowRef.current) {
      snapGlowRef.current.update(delta)
    }

    if (snappingId !== null && !isComplete) {
      const frag = fragments.find(f => f.id === snappingId)
      if (frag && !frag.isFused) {
        const { position, rotation } = lerpTowardsTarget(
          frag.initialPosition,
          frag.initialRotation,
          frag.correctPosition,
          frag.correctRotation,
          0.15
        )
        
        const posDist = position.distanceTo(frag.correctPosition)
        const angleDist = new THREE.Quaternion().setFromEuler(rotation).angleTo(
          new THREE.Quaternion().setFromEuler(frag.correctRotation)
        )
        
        updateFragmentTransform(snappingId, position, rotation)
        
        if (posDist < 0.05 && THREE.MathUtils.radToDeg(angleDist) < 3) {
          if (snapGlowRef.current) {
            snapGlowRef.current.show(frag.correctPosition)
          }
          fuseFragment(snappingId)
          setSnappingId(null)
          
          setTimeout(() => {
            if (snapGlowRef.current) {
              snapGlowRef.current.hide()
            }
          }, 1200)
        }
      }
    }

    if (selectedFragmentId !== null && snappingId === null && !isComplete) {
      const frag = fragments.find(f => f.id === selectedFragmentId)
      if (frag && !frag.isFused) {
        const { eligible } = checkSnapEligibility(
          frag.initialPosition,
          frag.initialRotation,
          frag.id,
          frag.correctPosition,
          frag.correctRotation,
          fragments,
          1.2,
          15
        )
        
        if (eligible) {
          setSnappingId(selectedFragmentId)
        }
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.5} color={0xd4a574} />
      <pointLight position={[0, 3, 0]} intensity={0.4} color={0xffd700} distance={10} />
      
      <WorkbenchTable />
      
      <group ref={groupRef}>
        {fragments.map(fragment => (
          <FragmentMesh
            key={fragment.id}
            fragment={fragment}
            isSelected={selectedFragmentId === fragment.id}
            isSnapHighlighted={snapHighlightIds.has(fragment.id)}
            artifactType={artifactType}
            transformRef={transformRef}
          />
        ))}
      </group>

      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={15}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function Workbench() {
  const transformRef = useRef<any>(null)
  
  return (
    <div className="workbench-wrapper">
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 3, 7], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          onPointerMissed={() => {
            if (transformRef.current) {
              transformRef.current.detach()
            }
            useStore.getState().selectFragment(null)
          }}
        >
          <color attach="background" args={['#3e2723']} />
          <fog attach="fog" args={['#2c1810', 8, 20]} />
          <SceneContent transformRef={transformRef} />
        </Canvas>
      </div>
      <div className="hint-text">
        点击碎片选中 · 拖拽移动 · 靠近正确位置自动吸附 · 鼠标滚轮缩放场景
      </div>
    </div>
  )
}
