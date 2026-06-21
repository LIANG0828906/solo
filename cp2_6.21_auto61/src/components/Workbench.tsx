import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, FragmentData } from '../store'
import { checkSnapEligibility, lerpTowardsTarget } from '../utils/geometry'
import { GoldenParticleSystem, SnapGlowEffect } from '../utils/particleSystem'

function createFragmentGeometry(id: number, total: number): THREE.BufferGeometry {
  const group = new THREE.Group()
  const angleStep = (Math.PI * 2) / total
  const startAngle = id * angleStep - Math.PI / 2
  const endAngle = startAngle + angleStep
  
  const profileShape = new THREE.Shape()
  const heightSegments = 8
  const heightSteps: [number, number][] = []
  
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
    heightSteps.push([y, r])
  }

  const vertices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  
  const radialSegments = 6
  const midAngle = (startAngle + endAngle) / 2
  const halfSpan = angleStep / 2

  for (let h = 0; h <= heightSegments; h++) {
    const [y, radius] = heightSteps[h]
    
    for (let r = 0; r <= radialSegments; r++) {
      const t = r / radialSegments
      const angle = startAngle + t * angleStep
      
      let actualRadius = radius
      if (r === 0 || r === radialSegments) {
        actualRadius *= 0.92
      }
      
      const noise = Math.sin(angle * 8 + id * 2.5) * 0.04 + Math.cos(y * 5 + id * 1.7) * 0.03
      actualRadius += noise
      
      const x = Math.cos(angle) * actualRadius
      const z = Math.sin(angle) * actualRadius
      
      vertices.push(x, y, z)
      
      const nx = Math.cos(midAngle)
      const nz = Math.sin(midAngle)
      const len = Math.sqrt(nx * nx + nz * nz + 0.01)
      normals.push(nx / len, 0.05, nz / len)
      
      uvs.push(t, h / heightSegments)
    }
  }

  for (let h = 0; h < heightSegments; h++) {
    for (let r = 0; r < radialSegments; r++) {
      const i = h * (radialSegments + 1) + r
      indices.push(i, i + radialSegments + 1, i + 1)
      indices.push(i + 1, i + radialSegments + 1, i + radialSegments + 2)
    }
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

function FragmentMesh({ 
  fragment, 
  isSelected, 
  isSnapHighlighted,
  transformRef 
}: { 
  fragment: FragmentData
  isSelected: boolean
  isSnapHighlighted: boolean
  transformRef: React.MutableRefObject<any>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  const geometry = useMemo(() => createFragmentGeometry(fragment.id, 10), [fragment.id])
  const material = useMemo(() => createPorcelainMaterial(), [])
  
  const emissiveIntensity = isSnapHighlighted ? 0.5 : (isSelected ? 0.3 : (hovered ? 0.15 : 0))
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
}

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
  const { fragments, selectedFragmentId, snapHighlightIds, isComplete, fuseFragment, updateFragmentTransform } = useStore()
  const groupRef = useRef<THREE.Group>(null)
  const animTimeRef = useRef(0)
  const particleSystemRef = useRef<GoldenParticleSystem | null>(null)
  const snapGlowRef = useRef<SnapGlowEffect | null>(null)
  const { scene } = useThree()
  
  const [snappingId, setSnappingId] = useState<number | null>(null)
  const [showGlow, setShowGlow] = useState(false)

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
    }
  }, [isComplete])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (isComplete) {
      animTimeRef.current += delta
      const t = Math.min(animTimeRef.current / 3, 1)
      const easeT = 1 - Math.pow(1 - t, 3)
      groupRef.current.position.y = easeT * 2
      groupRef.current.rotation.y += delta * 0.8
      
      if (particleSystemRef.current) {
        particleSystemRef.current.update(delta, groupRef.current.position)
      }
    }

    if (snapGlowRef.current && showGlow) {
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
          0.12
        )
        
        const posDist = position.distanceTo(frag.correctPosition)
        const angleDist = new THREE.Quaternion().setFromEuler(rotation).angleTo(
          new THREE.Quaternion().setFromEuler(frag.correctRotation)
        )
        
        updateFragmentTransform(snappingId, position, rotation)
        
        if (posDist < 0.05 && THREE.MathUtils.radToDeg(angleDist) < 3) {
          if (snapGlowRef.current) {
            snapGlowRef.current.show(frag.correctPosition)
            setShowGlow(true)
            setTimeout(() => {
              if (snapGlowRef.current) {
                snapGlowRef.current.hide()
                setShowGlow(false)
              }
            }, 1500)
          }
          fuseFragment(snappingId)
          setSnappingId(null)
        }
      }
    }

    if (selectedFragmentId !== null && snappingId === null && !isComplete) {
      const frag = fragments.find(f => f.id === selectedFragmentId)
      if (frag && !frag.isFused) {
        if (checkSnapEligibility(
          frag.initialPosition,
          frag.initialRotation,
          frag.correctPosition,
          frag.correctRotation,
          1.5,
          20
        )) {
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
