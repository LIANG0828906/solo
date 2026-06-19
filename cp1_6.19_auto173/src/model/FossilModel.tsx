import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'
import * as THREE from 'three'
import Lighting from './Lighting'
import { FossilPieceData, FossilPreset } from '../types'
import { eventBus, EVENTS } from '../eventBus'

interface PieceMeshProps {
  piece: FossilPieceData
  pieceIndex: number
  totalPieces: number
  isAssembled: boolean
  fossilName: string
}

const createFossilShape = (patternPath: string, scale: number): THREE.ExtrudeGeometry => {
  const shape = new THREE.Shape()
  const commands = patternPath.match(/[MLZ][^MLZ]*/gi) || []

  let currentX = 0
  let currentY = 0

  commands.forEach((cmd) => {
    const type = cmd[0].toUpperCase()
    const nums = (cmd.slice(1).match(/-?[\d.]+/g) || []).map(Number)

    if (type === 'M' && nums.length >= 2) {
      currentX = (nums[0] - 70) * scale
      currentY = -(nums[1] - 70) * scale
      shape.moveTo(currentX, currentY)
      for (let i = 2; i < nums.length; i += 2) {
        currentX = (nums[i] - 70) * scale
        currentY = -(nums[i + 1] - 70) * scale
        shape.lineTo(currentX, currentY)
      }
    } else if (type === 'L' && nums.length >= 2) {
      for (let i = 0; i < nums.length; i += 2) {
        currentX = (nums[i] - 70) * scale
        currentY = -(nums[i + 1] - 70) * scale
        shape.lineTo(currentX, currentY)
      }
    }
  })

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 2,
  }

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geometry.center()
  return geometry
}

const PieceMesh: React.FC<PieceMeshProps> = ({
  piece,
  pieceIndex,
  totalPieces,
  isAssembled,
  fossilName,
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [progress, setProgress] = useState(0)

  const geometry = useMemo(() => createFossilShape(piece.patternPath, 0.022), [piece.patternPath])

  const isTrilobite = fossilName === '三叶虫'
  const baseX = isTrilobite
    ? ((piece.targetX - 380) / 380) * 2.2
    : ((piece.targetX - 380) / 380) * 2.5
  const baseY = isTrilobite
    ? ((320 - piece.targetY) / 320) * 1.8 - 0.2
    : ((320 - piece.targetY) / 320) * 2 - 0.3
  const baseZ = (piece.index % 3) * 0.05 - 0.05

  const scatterX = useMemo(
    () => (Math.sin(pieceIndex * 13.37) * 3.5),
    [pieceIndex]
  )
  const scatterY = useMemo(
    () => (Math.cos(pieceIndex * 7.11) * 2.8),
    [pieceIndex]
  )
  const scatterZ = useMemo(
    () => (Math.sin(pieceIndex * 5.23) * 2 + 2),
    [pieceIndex]
  )

  const scatterRotX = useMemo(
    () => (pieceIndex * 0.7 + Math.PI * 0.25),
    [pieceIndex]
  )
  const scatterRotY = useMemo(
    () => (pieceIndex * 1.1 - Math.PI * 0.3),
    [pieceIndex]
  )
  const scatterRotZ = useMemo(
    () => (((piece.rotation * Math.PI) / 180) + pieceIndex * 0.4),
    [piece.rotation, pieceIndex]
  )

  const finalRotZ = (piece.correctRotation * Math.PI) / 180

  useEffect(() => {
    if (isAssembled) {
      const startDelay = pieceIndex * 60
      const duration = 800
      const startTime = performance.now() + startDelay

      const animate = () => {
        const elapsed = performance.now() - startTime
        if (elapsed < 0) {
          requestAnimationFrame(animate)
          return
        }
        const t = Math.min(elapsed / duration, 1)
        const easeT = 1 - Math.pow(1 - t, 3)
        setProgress(easeT)
        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    } else {
      setProgress(0)
    }
  }, [isAssembled, pieceIndex])

  useFrame((state) => {
    if (!meshRef.current) return

    const p = progress
    const easeP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2

    const posX = THREE.MathUtils.lerp(scatterX, baseX, easeP)
    const posY = THREE.MathUtils.lerp(scatterY, baseY, easeP)
    const posZ = THREE.MathUtils.lerp(scatterZ, baseZ, easeP)

    meshRef.current.position.set(posX, posY, posZ)

    const rotX = THREE.MathUtils.lerp(scatterRotX, 0, easeP)
    const rotY = THREE.MathUtils.lerp(scatterRotY, 0, easeP)
    const rotZ = THREE.MathUtils.lerp(scatterRotZ, finalRotZ, easeP)

    meshRef.current.rotation.set(rotX, rotY, rotZ)

    const glowIntensity = p > 0.95 ? (1 - p) * 3 : 0
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    if (mat.emissive) {
      mat.emissive.setRGB(glowIntensity * 0.8, glowIntensity * 0.65, glowIntensity * 0.2)
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#8B7355"
        roughness={0.75}
        metalness={0.15}
        emissive="#000000"
        emissiveIntensity={1}
      />
    </mesh>
  )
}

interface SceneProps {
  pieces: FossilPieceData[]
  isAssembled: boolean
  fossilName: string
  autoRotate: boolean
}

const Scene: React.FC<SceneProps> = ({ pieces, isAssembled, fossilName, autoRotate }) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current && isAssembled && autoRotate) {
      groupRef.current.rotation.y += delta * ((2 * Math.PI) / 30)
    }
  })

  return (
    <>
      <fog attach="fog" args={['#1A1A2E', 6, 18]} />
      <Lighting />
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />

      <group ref={groupRef}>
        {pieces.map((piece, idx) => (
          <PieceMesh
            key={piece.id}
            piece={piece}
            pieceIndex={idx}
            totalPieces={pieces.length}
            isAssembled={isAssembled}
            fossilName={fossilName}
          />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial
          color="#2C1810"
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={14}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.75}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

interface FossilModelProps {
  isVisible: boolean
  onClose: () => void
  completeData: {
    pieces: FossilPieceData[]
    score: number
    elapsedTime: number
    fossil: FossilPreset
  } | null
}

const FossilModel: React.FC<FossilModelProps> = ({ isVisible, onClose, completeData }) => {
  const [isAssembled, setIsAssembled] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  useEffect(() => {
    if (isVisible) {
      setIsAssembled(false)
      setAutoRotate(false)
      const t1 = setTimeout(() => setIsAssembled(true), 600)
      const t2 = setTimeout(() => setAutoRotate(true), 2000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [isVisible])

  if (!isVisible || !completeData) return null

  const { pieces, score, elapsedTime, fossil } = completeData

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="model-overlay">
      <div className="model-canvas-wrapper">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
          style={{ background: '#1A1A2E' }}
        >
          <color attach="background" args={['#1A1A2E']} />
          <Scene
            pieces={pieces}
            isAssembled={isAssembled}
            fossilName={fossil.name}
            autoRotate={autoRotate}
          />
        </Canvas>

        <div className="model-ui-overlay">
          <div className="model-info">
            <div className="model-title">{fossil.name}</div>
            <div className="model-era">{fossil.eraLabel}</div>
          </div>
          <div className="model-stats">
            <div className="model-score">得分 {score}</div>
            <div className="model-time">用时 {formatTime(elapsedTime)}</div>
          </div>
        </div>

        <button className="close-model-btn" onClick={onClose}>
          返回拼图室
        </button>
      </div>
    </div>
  )
}

export default FossilModel
