import React, { useRef, useEffect, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { useSceneStore, PRESET_VIEWS, type CameraView } from '@/store/sceneStore'
import BuildingBlock from './BuildingBlock'

function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const pendingView = useSceneStore((s) => s.pendingCameraView)
  const clearCameraView = useSceneStore((s) => s.clearCameraView)
  const animating = useRef(false)

  useEffect(() => {
    if (!pendingView || animating.current) return
    animating.current = true

    const pos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const targetPos = pendingView.position
    const targetLookAt = pendingView.target

    gsap.to(pos, {
      x: targetPos[0],
      y: targetPos[1],
      z: targetPos[2],
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => {
        camera.position.set(pos.x, pos.y, pos.z)
        camera.lookAt(targetLookAt[0], targetLookAt[1], targetLookAt[2])
        if (controlsRef.current) {
          controlsRef.current.target.set(targetLookAt[0], targetLookAt[1], targetLookAt[2])
          controlsRef.current.update()
        }
      },
      onComplete: () => {
        animating.current = false
        clearCameraView()
      },
    })
  }, [pendingView, camera, clearCameraView])

  useFrame(() => {
    if (controlsRef.current && animating.current) {
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      minDistance={1}
      maxDistance={20}
      enableDamping
      dampingFactor={0.1}
      target={[0, 0, 0]}
    />
  )
}

function SceneContent() {
  const blocks = useSceneStore((s) => s.blocks)
  const selectBlock = useSceneStore((s) => s.selectBlock)

  const handleMissedClick = useCallback(() => {
    selectBlock(null)
  }, [selectBlock])

  return (
    <>
      <color attach="background" args={['#1c1c2e']} />
      <ambientLight intensity={0.3} />
      <hemisphereLight
        args={['#87ceeb', '#2c3e50', 0.4]}
      />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.2} />

      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        cellColor="#ffffff10"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#ffffff15"
        fadeDistance={30}
        fadeStrength={1}
        position={[0, 0, 0]}
      />

      <CameraController />

      <group onPointerMissed={handleMissedClick}>
        {blocks.map((block) => (
          <BuildingBlock key={block.id} blockId={block.id} />
        ))}
      </group>
    </>
  )
}

const SceneCanvas: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50, near: 0.1, far: 100 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.0
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}

export default SceneCanvas
