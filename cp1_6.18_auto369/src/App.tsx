import { useEffect, useMemo, useState } from 'react'
import SceneManager from './SceneManager'
import UIControls from './UIControls'
import { useAppStore } from './store'
import { VoxelData } from './types'

function VoxelCounter() {
  const voxels = useAppStore((s) => s.voxels)
  const visibleLayerCount = useAppStore((s) => s.visibleLayerCount)

  const totalVoxels = voxels.length

  const visibleVoxels = useMemo(() => {
    const gridYValues = Array.from(new Set(voxels.map(v => v.gridY))).sort((a, b) => a - b)
    if (visibleLayerCount === 0) return 0
    const visibleGridY = gridYValues[Math.min(visibleLayerCount - 1, gridYValues.length - 1)]
    if (visibleGridY === undefined) return 0
    return voxels.filter(v => v.gridY <= visibleGridY).length
  }, [voxels, visibleLayerCount])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 50,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      padding: '12px 18px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontWeight: 600,
        letterSpacing: '0.5px',
      }}>
        当前体素: <span style={{ color: '#3A8DFF' }}>{visibleVoxels}</span> / <span style={{ opacity: 0.7 }}>{totalVoxels}</span>
      </div>
    </div>
  )
}

function VoxelInfoPanel() {
  const selectedVoxel = useAppStore((s) => s.selectedVoxel)
  const setSelectedVoxel = useAppStore((s) => s.setSelectedVoxel)
  const colorMode = useAppStore((s) => s.colorMode)
  const monochromeColor = useAppStore((s) => s.monochromeColor)
  const boundingBox = useAppStore((s) => s.boundingBox)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!selectedVoxel) return null

  const { voxel, screenX, screenY } = selectedVoxel

  const getDisplayColor = (v: VoxelData): [number, number, number] => {
    if (colorMode === 'original') return v.originalColor
    if (colorMode === 'monochrome') {
      const hex = monochromeColor.replace('#', '')
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255,
      ]
    }
    const yMin = boundingBox?.minY ?? 0
    const yMax = boundingBox?.maxY ?? 1
    const range = yMax - yMin
    const t = range > 0 ? (v.worldY - yMin) / range : 0.5
    const startR = 0x1E / 255, startG = 0x3A / 255, startB = 0x5F / 255
    const endR = 0xFF / 255, endG = 0xB7 / 255, endB = 0x4D / 255
    const clamped = Math.max(0, Math.min(1, t))
    return [
      startR + (endR - startR) * clamped,
      startG + (endG - startG) * clamped,
      startB + (endB - startB) * clamped,
    ]
  }

  const displayColor = getDisplayColor(voxel)
  const colorHex = '#' + displayColor.map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

  const panelWidth = 260
  const panelHeight = 220

  let leftPos = screenX + 20
  let topPos = screenY - 20

  if (isMobile) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          zIndex: 100,
          background: 'rgba(15,15,15,0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(58,141,255,0.4)',
          boxShadow: '0 8px 40px rgba(58,141,255,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>体素信息</span>
          <button
            onClick={() => setSelectedVoxel(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '10px',
              background: colorHex,
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: `0 4px 20px ${colorHex}66`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <InfoRow label="坐标 X" value={voxel.worldX.toFixed(2)} />
            <InfoRow label="坐标 Y" value={voxel.worldY.toFixed(2)} />
            <InfoRow label="坐标 Z" value={voxel.worldZ.toFixed(2)} />
            <InfoRow label="RGB" value={`(${Math.round(displayColor[0] * 255)}, ${Math.round(displayColor[1] * 255)}, ${Math.round(displayColor[2] * 255)})`} />
            <InfoRow label="HEX" value={colorHex} />
          </div>
        </div>
      </div>
    )
  }

  if (leftPos + panelWidth > window.innerWidth - 20) {
    leftPos = screenX - panelWidth - 20
  }
  if (topPos + panelHeight > window.innerHeight - 20) {
    topPos = window.innerHeight - panelHeight - 20
  }
  if (topPos < 20) topPos = 20
  if (leftPos < 20) leftPos = 20

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: leftPos,
        top: topPos,
        width: panelWidth,
        zIndex: 100,
        background: 'rgba(15,15,15,0.92)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: '18px',
        border: '1px solid rgba(58,141,255,0.4)',
        boxShadow: '0 8px 40px rgba(58,141,255,0.2)',
        animation: 'fadeSlideIn 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{
          color: 'white',
          fontWeight: 600,
          fontSize: '15px',
        }}>
          体素信息
        </span>
        <button
          onClick={() => setSelectedVoxel(null)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '20px',
            lineHeight: '1',
            padding: '0 4px',
            borderRadius: '4px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: colorHex,
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: `0 4px 24px ${colorHex}88`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              网格索引
            </div>
            <div style={{ fontFamily: 'monospace', color: '#3A8DFF', fontSize: '13px', fontWeight: 600 }}>
              [{voxel.gridX}, {voxel.gridY}, {voxel.gridZ}]
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              HEX
            </div>
            <div style={{ fontFamily: 'monospace', color: 'white', fontSize: '13px' }}>
              {colorHex}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(58,141,255,0.3), transparent)',
        marginBottom: '14px',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            原始模型坐标
          </div>
          <div style={{
            background: 'rgba(58,141,255,0.1)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#FF6B6B' }}>X:</span>
              <span style={{ color: 'white' }}>{voxel.worldX.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#4ECDC4' }}>Y:</span>
              <span style={{ color: 'white' }}>{voxel.worldY.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#FFE66D' }}>Z:</span>
              <span style={{ color: 'white' }}>{voxel.worldZ.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            颜色 RGB 值
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#FF6B6B' }}>R:</span>
              <span style={{ color: 'white' }}>{Math.round(displayColor[0] * 255)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#4ECDC4' }}>G:</span>
              <span style={{ color: 'white' }}>{Math.round(displayColor[1] * 255)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#FFE66D' }}>B:</span>
              <span style={{ color: 'white' }}>{Math.round(displayColor[2] * 255)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{label}</span>
      <span style={{ color: 'white', fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

export default function App() {
  const increaseLayer = useAppStore((s) => s.increaseLayer)
  const decreaseLayer = useAppStore((s) => s.decreaseLayer)
  const setSelectedVoxel = useAppStore((s) => s.setSelectedVoxel)
  const isProcessing = useAppStore((s) => s.isProcessing)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        increaseLayer()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        decreaseLayer()
      } else if (e.key === 'Escape') {
        setSelectedVoxel(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [increaseLayer, decreaseLayer, setSelectedVoxel, isProcessing])

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onClick={() => setSelectedVoxel(null)}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}>
          <SceneManager />
        </div>
      </div>

      <VoxelCounter />
      <UIControls />
      <VoxelInfoPanel />

      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        zIndex: 40,
        color: 'rgba(255,255,255,0.35)',
        fontSize: '11px',
        fontFamily: 'monospace',
        lineHeight: '1.6',
        pointerEvents: 'none',
      }}>
        <div>↑ / ↓ : 增加 / 减少层</div>
        <div>鼠标拖拽 : 旋转视角</div>
        <div>滚轮 : 缩放</div>
        <div>点击体素 : 查看详情</div>
        <div>ESC : 取消选中</div>
      </div>
    </div>
  )
}
