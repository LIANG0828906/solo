'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Mesh, Group } from 'three'
import { useAppStore, type GroomingStyle } from '@/store'

function PetDog({ color }: { color: string }) {
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.02 * delta * 60
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.48, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh position={[-0.38, 1.95, -0.05]} rotation={[0, 0, 0.35]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.38, 1.95, -0.05]} rotation={[0, 0, -0.35]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh position={[-0.35, -0.15, 0.25]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.35, -0.15, 0.25]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.35, -0.15, -0.25]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.35, -0.15, -0.25]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <group position={[0, 0.7, -0.7]} rotation={[-0.8, 0, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      <mesh position={[0, 1.55, 0.42]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#3d2b1f" />
      </mesh>

      <mesh position={[-0.16, 1.65, 0.38]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.16, 1.65, 0.38]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  )
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.3
  const stars: string[] = []
  for (let i = 0; i < full; i++) stars.push('★')
  if (hasHalf) stars.push('☆')
  while (stars.length < 5) stars.push('☆')
  return (
    <span style={{ color: '#f5a623', fontSize: '1.1rem', letterSpacing: 2 }}>
      {stars.join('')}
      <span style={{ color: '#666', marginLeft: 6, fontSize: '0.85rem' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

export default function ThreeDPreview() {
  const { selectedStyle, showPreview, setShowPreview } = useAppStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPreview(false)
    },
    [setShowPreview]
  )

  useEffect(() => {
    if (showPreview) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPreview, handleKeyDown])

  if (!showPreview || !selectedStyle) return null

  const style: GroomingStyle = selectedStyle
  const bodyColor = style.color || '#f5cba7'
  const hairPct = Math.min((style.hairLength / 7) * 100, 100)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => setShowPreview(false)}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          maxWidth: '90vw',
          maxHeight: '85vh',
        }}
      >
        <div style={{ width: 520, height: 520, background: '#1a1a2e' }}>
          <Canvas camera={{ position: [0, 2, 4.5], fov: 45 }} dpr={[1, 2]}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <PetDog color={bodyColor} />
            <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.02} />
            <ContactShadows position={[0, -0.4, 0]} opacity={0.5} blur={2.5} far={4} />
            <Environment preset="city" />
          </Canvas>
        </div>

        <div
          style={{
            width: 280,
            background: '#fff',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            fontFamily: "'Noto Sans SC', sans-serif",
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e' }}>
            {style.name}
          </h2>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 6 }}>毛发长度</div>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: '#eee',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${hairPct}%`,
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${bodyColor}, ${bodyColor}cc)`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 4 }}>
              {style.hairLength} / 7 cm
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>修剪形状</div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 20,
                background: `${bodyColor}22`,
                color: bodyColor,
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {style.trimShape}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>造型风格</div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 20,
                background: '#1a1a2e11',
                color: '#1a1a2e',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {style.styleTag}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>美容师评分</div>
            <Stars rating={style.groomerRating} />
          </div>

          <div
            style={{
              marginTop: 'auto',
              fontSize: '0.75rem',
              color: '#bbb',
              textAlign: 'center',
            }}
          >
            拖拽旋转 · 滚轮缩放 · ESC 关闭
          </div>
        </div>
      </div>
    </div>
  )
}
