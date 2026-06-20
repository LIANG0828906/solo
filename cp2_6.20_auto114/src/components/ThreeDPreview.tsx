'use client'

import { useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useAppStore, type GroomingStyle } from '@/store'
import { Ruler, Scissors, Palette, Star as StarIcon, Sparkles } from 'lucide-react'

function PetDog({ color }: { color: string }) {
  return (
    <group>
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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (hasHalf && i === full)
        return (
          <StarIcon
            key={i}
            size={18}
            fill={filled ? '#f5a623' : 'none'}
            color={filled ? '#f5a623' : '#e0d5c8'}
            strokeWidth={2}
          />
        )
      })}
      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e', marginLeft: 6 }}>
        {rating.toFixed(1)}
      </span>
    </div>
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
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [showPreview, handleKeyDown])

  if (!showPreview || !selectedStyle) return null

  const style: GroomingStyle = selectedStyle
  const bodyColor = style.color || '#f5cba7'
  const hairPct = Math.min((style.hairLength / 7) * 100, 100)
  const hairLevel =
    style.hairLength <= 2 ? '短毛' : style.hairLength <= 4.5 ? '中毛' : '长毛'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
        onClick={() => setShowPreview(false)}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
          maxWidth: '92vw',
          maxHeight: '88vh',
          animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 540,
            height: 560,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 20,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <Sparkles size={14} color="#f39c12" />
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>360° 实时预览</span>
          </div>

          <button
            onClick={() => setShowPreview(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
          >
            ×
          </button>

          <Canvas camera={{ position: [0, 2, 4.5], fov: 45 }} dpr={[1, 2]}>
            <ambientLight intensity={0.55} color="#fff5e6" />
            <directionalLight position={[5, 6, 5]} intensity={1.1} color="#fff8ee" />
            <directionalLight position={[-3, 4, -3]} intensity={0.4} color="#ffeedd" />
            <PetDog color={bodyColor} />
            <OrbitControls
              enableZoom
              enablePan={false}
              autoRotate
              autoRotateSpeed={1.15}
              minDistance={3}
              maxDistance={8}
            />
            <ContactShadows position={[0, -0.4, 0]} opacity={0.55} blur={3} far={4.5} />
            <Environment preset="city" />
          </Canvas>
        </div>

        <div
          style={{
            width: 320,
            background: 'linear-gradient(180deg, #fffefc 0%, #fff9f0 100%)',
            padding: '28px 26px 22px',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Noto Sans SC', sans-serif",
            borderLeft: '1px solid #f0e4d4',
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                color: '#b8860b',
                letterSpacing: 2,
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {style.breed}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.6rem',
                fontWeight: 700,
                color: '#1a1a2e',
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.2,
              }}
            >
              {style.name}
            </h2>
          </div>

          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${bodyColor}66, transparent)`,
              marginBottom: 22,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            <div
              style={{
                padding: '14px 16px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #f5ebe0',
                boxShadow: '0 2px 8px rgba(212, 165, 116, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${bodyColor}33, ${bodyColor}66)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ruler size={14} color={bodyColor} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.2 }}>
                    毛发长度
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e' }}>
                    {hairLevel}
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: '#f5ebe0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${hairPct}%`,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${bodyColor}aa, ${bodyColor})`,
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 6 }}>
                实际长度 {style.hairLength.toFixed(1)} cm ／ 最大 7 cm
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #f5ebe0',
                boxShadow: '0 2px 8px rgba(212, 165, 116, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #e67e2233, #e67e2266)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Scissors size={14} color="#e67e22" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.2 }}>
                    修剪形状
                  </div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: '#e67e22',
                      letterSpacing: 0.5,
                    }}
                  >
                    {style.trimShape}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #f5ebe0',
                boxShadow: '0 2px 8px rgba(212, 165, 116, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #8e44ad33, #8e44ad66)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Palette size={14} color="#8e44ad" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#999', lineHeight: 1.2 }}>
                    造型风格
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#8e44ad',
                      padding: '3px 12px',
                      background: '#8e44ad15',
                      borderRadius: 12,
                      marginTop: 2,
                    }}
                  >
                    {style.styleTag}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 16px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #f5ebe0',
                boxShadow: '0 2px 8px rgba(212, 165, 116, 0.06)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#999', marginBottom: 8 }}>
                美容师评分
              </div>
              <Stars rating={style.groomerRating} />
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #fff7e6, #fff3d0)',
              borderRadius: 10,
              border: '1px dashed #d4a574',
              fontSize: '0.72rem',
              color: '#8b6914',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            💡 鼠标拖拽旋转 · 滚轮缩放 · ESC 键关闭
          </div>
        </div>
      </div>
    </div>
  )
}
