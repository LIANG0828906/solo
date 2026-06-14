import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { useBehaviorTreeStore } from '@/stores/behaviorTreeStore'
import { CharacterState } from '@/types/behaviorTree'
import { lerp3d, easeOutCubic } from '@/utils/animation'

interface CharacterProps {
  position: { x: number; z: number }
  rotation: number
  action: CharacterState['action']
  isCrouching: boolean
}

function Character({ position, rotation, action, isCrouching }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)
  const currentPosition = useRef({ x: 0, y: 0, z: 0 })
  const time = useRef(0)
  const flashRef = useRef(false)

  useEffect(() => {
    if (action === 'attack' && !flashRef.current) {
      flashRef.current = true
      useBehaviorTreeStore.getState().setShowFlash(true)
      setTimeout(() => {
        useBehaviorTreeStore.getState().setShowFlash(false)
        flashRef.current = false
      }, 150)
    }
  }, [action])

  useFrame((_, delta) => {
    time.current += delta

    if (groupRef.current) {
      const targetPos = { x: position.x, y: isCrouching ? 0.45 : 0.9, z: position.z }
      currentPosition.current = lerp3d(currentPosition.current, targetPos, easeOutCubic(Math.min(delta * 5, 1)))
      groupRef.current.position.set(currentPosition.current.x, currentPosition.current.y, currentPosition.current.z)
      groupRef.current.rotation.y = rotation
    }

    if (bodyRef.current) {
      const scaleY = isCrouching ? 0.5 : 1
      bodyRef.current.scale.y = THREE.MathUtils.lerp(bodyRef.current.scale.y, scaleY, delta * 8)

      if (action === 'idle') {
        bodyRef.current.position.y = Math.sin(time.current * 2) * 0.05
      } else if (action === 'move') {
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, -0.26, delta * 5)
      } else if (action === 'hide') {
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0.35, delta * 5)
      } else {
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, delta * 5)
        bodyRef.current.position.y = 0
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (action === 'move') {
        leftLegRef.current.rotation.x = Math.sin(time.current * 10) * 0.6
        rightLegRef.current.rotation.x = Math.sin(time.current * 10 + Math.PI) * 0.6
      } else {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 5)
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 5)
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (action === 'attack') {
        leftArmRef.current.rotation.x = Math.sin(time.current * 15) * 1.2
        rightArmRef.current.rotation.x = Math.sin(time.current * 15 + Math.PI) * 1.2
      } else if (action === 'move') {
        leftArmRef.current.rotation.x = Math.sin(time.current * 10 + Math.PI) * 0.4
        rightArmRef.current.rotation.x = Math.sin(time.current * 10) * 0.4
      } else {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, delta * 5)
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, delta * 5)
      }
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.4, 1.0, 4, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh ref={leftArmRef} position={[-0.55, 0.3, 0]}>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh ref={rightArmRef} position={[0.55, 0.3, 0]}>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      <mesh ref={leftLegRef} position={[-0.2, -0.7, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.2, -0.7, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
    </group>
  )
}

interface PlayerProps {
  playerDistance: number
}

function Player({ playerDistance }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const position = useRef({ x: 0, y: 0.5, z: 0 })

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetZ = playerDistance * 0.1
      position.current.z = THREE.MathUtils.lerp(position.current.z, targetZ, delta * 2)
      meshRef.current.position.set(0, 0.5, position.current.z)
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
  )
}

interface CoverProps {
  hasCover: boolean
}

function Cover({ hasCover }: CoverProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetScale = hasCover ? 1 : 0
      const currentScale = meshRef.current.scale.x
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 6)
      meshRef.current.scale.setScalar(newScale)
    }
  })

  return (
    <mesh ref={meshRef} position={[1.5, 0.75, 0]} scale={0}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#6b7280" />
    </mesh>
  )
}

function Scene() {
  const { character, environment, currentActionLabel, showFlash } = useBehaviorTreeStore()
  const [labelVisible, setLabelVisible] = useState(false)

  useEffect(() => {
    if (currentActionLabel) {
      setLabelVisible(true)
    }
  }, [currentActionLabel])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#22c55e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#16a34a"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      <Character
        position={character.position}
        rotation={character.rotation}
        action={character.action}
        isCrouching={character.isCrouching}
      />
      <Player playerDistance={environment.playerDistance} />
      <Cover hasCover={environment.hasCover} />
      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          padding: '12px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          transform: labelVisible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: labelVisible ? 1 : 0,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
          pointerEvents: 'none',
        }}
      >
        {currentActionLabel || '等待中...'}
      </div>
      {showFlash && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(239, 68, 68, 0.4)',
            pointerEvents: 'none',
            animation: 'flash 0.15s ease-out',
          }}
        />
      )}
    </>
  )
}

export function SceneViewer() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 8, 12], fov: 50 }}
        style={{ background: '#1a1a2e' }}
        dpr={[1, 2]}
        frameloop="always"
        performance={{ min: 0.5 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        <Scene />
      </Canvas>
      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
