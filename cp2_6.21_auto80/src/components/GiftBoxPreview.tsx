import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

interface GiftBoxPreviewProps {
  boxShape: 'square' | 'heart' | 'drawer'
  ribbonColor: string
  cardText: string
  cardFont: string
  cardColor: string
  chocolates: Array<{ flavorId: string; shape: string; color: string; texture: string }>
}

function parseFirstColor(cssGradient: string): string {
  const match = cssGradient.match(/#[0-9A-Fa-f]{6}/)
  return match ? match[0] : '#D4AF37'
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

function GiftBoxMesh({ boxShape, ribbonColor, cardText, cardFont, cardColor, chocolates }: GiftBoxPreviewProps) {
  const groupRef = useRef<THREE.Group>(null)
  const parsedRibbonColor = parseFirstColor(ribbonColor)

  const ribbonMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(parsedRibbonColor),
    metalness: 0.8,
    roughness: 0.2,
  }), [parsedRibbonColor])

  const heartBaseGeo = useMemo(() => {
    if (boxShape !== 'heart') return null
    const hs = createHeartShape(1.8)
    const geo = new THREE.ExtrudeGeometry(hs, {
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    })
    geo.center()
    return geo
  }, [boxShape])

  const heartLidGeo = useMemo(() => {
    if (boxShape !== 'heart') return null
    const hs = createHeartShape(1.85)
    const geo = new THREE.ExtrudeGeometry(hs, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    })
    geo.center()
    return geo
  }, [boxShape])

  const chocolatePositions = useMemo(() => {
    const positions: [number, number, number][] = []
    const maxCount = Math.min(chocolates.length, 6)
    for (let i = 0; i < maxCount; i++) {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = (col - 1) * 0.45
      const z = (row - 0.5) * 0.4
      positions.push([x, boxShape === 'drawer' ? 0.1 : -0.05, z])
    }
    return positions
  }, [chocolates, boxShape])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += 0.005
    groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.03
  })

  return (
    <group ref={groupRef}>
      {boxShape === 'square' && (
        <>
          <RoundedBox args={[2, 0.6, 1.5, 4, 0.05]} position={[0, -0.3, 0]}>
            <meshStandardMaterial color="#3E2723" roughness={0.6} metalness={0.2} />
          </RoundedBox>
          <RoundedBox args={[2.05, 0.2, 1.55, 4, 0.05]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color="#5D4037" roughness={0.5} metalness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0.2, 0]} material={ribbonMaterial}>
            <boxGeometry args={[2.1, 0.05, 0.08]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={ribbonMaterial}>
            <boxGeometry args={[0.08, 0.05, 1.6]} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.08, 0.3, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.08, 0.3, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {boxShape === 'heart' && heartBaseGeo && heartLidGeo && (
        <>
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={heartBaseGeo} attach="geometry" />
            <meshStandardMaterial color="#3E2723" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={heartLidGeo} attach="geometry" />
            <meshStandardMaterial color="#5D4037" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={ribbonMaterial}>
            <boxGeometry args={[1.6, 0.04, 0.06]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={ribbonMaterial}>
            <boxGeometry args={[0.06, 0.04, 1.2]} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.07, 0.37, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.07, 0.37, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {boxShape === 'drawer' && (
        <>
          <RoundedBox args={[2, 0.8, 1.5, 4, 0.03]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#3E2723" roughness={0.6} metalness={0.2} />
          </RoundedBox>
          <RoundedBox args={[1.9, 0.5, 1.4, 4, 0.02]} position={[0.1, -0.05, 0]}>
            <meshStandardMaterial color="#6D4C41" roughness={0.5} metalness={0.25} />
          </RoundedBox>
          <RoundedBox args={[0.3, 0.08, 0.06, 2, 0.01]} position={[0.95, 0, 0.73]}>
            <meshStandardMaterial color="#8D6E63" roughness={0.4} metalness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0.42, 0]} material={ribbonMaterial}>
            <boxGeometry args={[2.1, 0.04, 0.06]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={ribbonMaterial}>
            <boxGeometry args={[0.06, 0.04, 1.6]} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.07, 0.52, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.07, 0.52, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={parsedRibbonColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )}

      {chocolates.slice(0, 6).map((choc, i) => (
        <mesh key={choc.flavorId} position={chocolatePositions[i]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={choc.color} roughness={0.4} metalness={0.15} />
        </mesh>
      ))}

      {cardText && (
        <>
          <RoundedBox args={[0.6, 0.4, 0.01, 2, 0.005]} position={[0.8, 0.5, 0]} rotation={[0, 0, 0.15]}>
            <meshStandardMaterial color="#FFF8E1" roughness={0.8} metalness={0.05} />
          </RoundedBox>
          <Text
            position={[0.8, 0.5, 0.015]}
            rotation={[0, 0, 0.15]}
            fontSize={0.06}
            color={cardColor}
            font={cardFont}
            maxWidth={0.8}
            anchorX="center"
            anchorY="middle"
          >
            {cardText}
          </Text>
        </>
      )}
    </group>
  )
}

export default function GiftBoxPreview(props: GiftBoxPreviewProps) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%', borderRadius: '16px' }}
      camera={{ position: [2.5, 2, 3], fov: 40 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.0} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#D4AF37" />
      <GiftBoxMesh {...props} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.5}
        enableZoom
        minDistance={2}
        maxDistance={8}
      />
    </Canvas>
  )
}
