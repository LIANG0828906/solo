import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioStore } from '../store/audioStore'
import { useGalaxyStore } from '../store/galaxyStore'

const GalaxyParticles = () => {
  const pointsRef = useRef<THREE.Points>(null)
  const { getFrequencyData, lowFrequency, midFrequency, highFrequency, isPlaying } = useAudioStore()
  const { initParticles, updateParticles, positions, colors, sizes, cameraPosition, cameraTarget } = useGalaxyStore()
  const { camera } = useThree()

  useEffect(() => {
    initParticles()
  }, [])

  useFrame((_, delta) => {
    if (isPlaying) {
      getFrequencyData()
    }
    updateParticles(lowFrequency, midFrequency, highFrequency, delta)

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry
      const positionAttr = geo.attributes.position as THREE.BufferAttribute
      const colorAttr = geo.attributes.color as THREE.BufferAttribute
      const sizeAttr = geo.attributes.size as THREE.BufferAttribute
      
      const positionArray = positionAttr.array as Float32Array
      const colorArray = colorAttr.array as Float32Array
      const sizeArray = sizeAttr.array as Float32Array
      
      positionArray.set(positions)
      colorArray.set(colors)
      sizeArray.set(sizes)
      
      positionAttr.needsUpdate = true
      colorAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
    }

    camera.position.lerp(cameraPosition, 0.1)
    camera.lookAt(cameraTarget)
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  const material = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    return new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    })
  }, [])

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  )
}

const GalaxyContent = () => {
  const { cameraTarget } = useGalaxyStore()

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
      <Stars radius={300} depth={60} count={2000} factor={4} saturation={0} fade speed={1} />
      <GalaxyParticles />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={30}
        maxDistance={300}
        autoRotate={false}
        target={[cameraTarget.x, cameraTarget.y, cameraTarget.z]}
      />
    </>
  )
}

export const GalaxyScene = () => {
  return (
    <Canvas
      camera={{ position: [0, 40, 150], fov: 60 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ background: '#0a0a1a', width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <GalaxyContent />
    </Canvas>
  )
}
