import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface ChocolatePreviewProps {
  shape: 'circle' | 'square' | 'heart' | 'shell'
  color: string
  texture: 'matte' | 'glossy' | 'crushed-nuts' | 'gold-foil'
  size?: number
}

function createHeartShape(s: number): THREE.Shape {
  const shape = new THREE.Shape()
  const x = 0, y = 0
  shape.moveTo(x, y + 0.3 * s)
  shape.bezierCurveTo(x, y + 0.3 * s, x - 0.05 * s, y + 0.45 * s, x - 0.25 * s, y + 0.45 * s)
  shape.bezierCurveTo(x - 0.55 * s, y + 0.45 * s, x - 0.55 * s, y + 0.2 * s, x - 0.55 * s, y + 0.2 * s)
  shape.bezierCurveTo(x - 0.55 * s, y + 0.0 * s, x - 0.35 * s, y - 0.2 * s, x, y - 0.45 * s)
  shape.bezierCurveTo(x + 0.35 * s, y - 0.2 * s, x + 0.55 * s, y + 0.0 * s, x + 0.55 * s, y + 0.2 * s)
  shape.bezierCurveTo(x + 0.55 * s, y + 0.2 * s, x + 0.55 * s, y + 0.45 * s, x + 0.25 * s, y + 0.45 * s)
  shape.bezierCurveTo(x + 0.05 * s, y + 0.45 * s, x, y + 0.3 * s, x, y + 0.3 * s)
  return shape
}

function ChocolateMesh({ shape, color, texture, size = 1 }: ChocolatePreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(() => {
    switch (texture) {
      case 'matte':
        return new THREE.MeshStandardMaterial({
          roughness: 0.9,
          metalness: 0.1,
          color: new THREE.Color(color),
        })
      case 'glossy':
        return new THREE.MeshPhysicalMaterial({
          roughness: 0.15,
          metalness: 0.1,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          color: new THREE.Color(color),
        })
      case 'crushed-nuts': {
        const bumpSize = 64
        const bumpData = new Uint8Array(bumpSize * bumpSize)
        for (let i = 0; i < bumpData.length; i++) {
          bumpData[i] = Math.random() * 255
        }
        const bumpMap = new THREE.DataTexture(bumpData, bumpSize, bumpSize, THREE.RedFormat)
        bumpMap.needsUpdate = true
        return new THREE.MeshStandardMaterial({
          roughness: 0.7,
          metalness: 0.05,
          color: new THREE.Color(color),
          bumpMap,
          bumpScale: 0.3,
        })
      }
      case 'gold-foil': {
        const baseColor = new THREE.Color('#D4AF37')
        const propColor = new THREE.Color(color)
        baseColor.lerp(propColor, 0.15)
        return new THREE.MeshPhysicalMaterial({
          roughness: 0.2,
          metalness: 0.9,
          color: baseColor,
          clearcoat: 0.8,
        })
      }
    }
  }, [color, texture])

  const heartGeometry = useMemo(() => {
    if (shape !== 'heart') return null
    const heartShape = createHeartShape(size)
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.2 * size,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    }
    const geo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings)
    geo.center()
    return geo
  }, [shape, size])

  const shellGeometry = useMemo(() => {
    if (shape !== 'shell') return null
    const points: THREE.Vector2[] = []
    const s = size
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const x = t * 0.5 * s
      const y = (Math.sin(t * Math.PI * 0.9) * 0.35 + t * 0.05) * s
      points.push(new THREE.Vector2(x, y))
    }
    const geo = new THREE.LatheGeometry(points, 32)
    geo.center()
    return geo
  }, [shape, size])

  /**
   * Cylinder geometry for round chocolate disc shape.
   * Radius: 0.4 * size, Height: 0.2 * size (height-to-radius ratio = 0.5)
   * This matches the original sphere-flattened visual proportions (diameter 0.8, height 0.4)
   * while avoiding the lighting artifacts caused by non-uniform mesh scaling.
   * The 48 radial segments create a perfectly smooth circle.
   */
  const circleGeometry = useMemo(() => {
    if (shape !== 'circle') return null
    return new THREE.CylinderGeometry(0.4 * size, 0.4 * size, 0.2 * size, 48, 1)
  }, [shape, size])

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.003
    meshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.02
  })

  return (
    <mesh ref={meshRef} material={material}>
      {shape === 'circle' && circleGeometry && (
        <primitive object={circleGeometry} attach="geometry" />
      )}
      {shape === 'square' && (
        <RoundedBox args={[0.7 * size, 0.35 * size, 0.7 * size, 4, 0.05]} />
      )}
      {shape === 'heart' && heartGeometry && (
        <primitive object={heartGeometry} attach="geometry" />
      )}
      {shape === 'shell' && shellGeometry && (
        <primitive object={shellGeometry} attach="geometry" />
      )}
    </mesh>
  )
}

export default function ChocolatePreview(props: ChocolatePreviewProps) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      camera={{ position: [0, 0, 2], fov: 45 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, -3, 2]} intensity={0.3} color="#D4AF37" />
      <ChocolateMesh {...props} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </Canvas>
  )
}
