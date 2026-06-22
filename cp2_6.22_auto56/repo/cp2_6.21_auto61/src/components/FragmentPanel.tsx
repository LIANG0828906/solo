import React, { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useStore, FragmentData, ArtifactType } from '../store'

const THUMBNAIL_SIZE = 64

function renderFragmentThumbnail(
  fragment: FragmentData,
  artifactType: ArtifactType
): string {
  const canvas = document.createElement('canvas')
  canvas.width = THUMBNAIL_SIZE
  canvas.height = THUMBNAIL_SIZE
  const ctx = canvas.getContext('2d')!

  const bgColor = artifactType === 'blue-porcelain' ? '#0d47a1' : '#1b5e20'
  const accentColor = artifactType === 'blue-porcelain' ? '#42a5f5' : '#66bb6a'
  const textColor = artifactType === 'blue-porcelain' ? '#e3f2fd' : '#e8f5e9'
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, artifactType === 'blue-porcelain' ? '#1565c0' : '#2e7d32')
  gradient.addColorStop(1, bgColor)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.roundRect(4, 4, 56, 56, 6)
  ctx.fill()

  ctx.strokeStyle = accentColor
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.save()
  ctx.translate(32, 32)

  const angle = (fragment.id / 10) * Math.PI * 2 - Math.PI / 2
  const endAngle = angle + (Math.PI * 2) / 10

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, 20, angle, endAngle)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 1.5
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const yOffset = (t - 0.5) * 30
    let r: number
    if (t < 0.15) {
      r = 6 + (8 - 6) * (t / 0.15)
    } else if (t < 0.35) {
      r = 8 + (18 - 8) * ((t - 0.15) / 0.2)
    } else if (t < 0.7) {
      r = 18 + (20 - 18) * ((t - 0.35) / 0.35)
    } else if (t < 0.9) {
      r = 20 + (12 - 20) * ((t - 0.7) / 0.2)
    } else {
      r = 12 + (7 - 12) * ((t - 0.9) / 0.1)
    }

    const seed = fragment.id * 7919 + 12345
    const jaggedL = Math.sin(seed + i * 2.5) * 0.15
    const jaggedR = Math.sin(seed + i * 2.5 + 1) * 0.15

    const leftX = Math.cos(angle) * (r + jaggedL * r)
    const leftY = Math.sin(angle) * (r + jaggedL * r) + yOffset * 0.3
    const rightX = Math.cos(endAngle) * (r + jaggedR * r)
    const rightY = Math.sin(endAngle) * (r + jaggedR * r) + yOffset * 0.3

    ctx.beginPath()
    ctx.moveTo(leftX, leftY)
    ctx.lineTo(rightX, rightY)
    ctx.stroke()
  }

  if (artifactType === 'blue-porcelain') {
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let t = 0; t < Math.PI * 2; t += 0.3) {
      const r = 6 + Math.sin(t * 3) * 2
      const px = Math.cos(t + Math.PI / 4) * r
      const py = Math.sin(t + Math.PI / 4) * r * 0.6
      if (t === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
  } else {
    ctx.fillStyle = 'rgba(76, 175, 80, 0.4)'
    for (let i = 0; i < 8; i++) {
      const x = (Math.random() - 0.5) * 25
      const y = (Math.random() - 0.5) * 20
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 2 + 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()

  ctx.fillStyle = textColor
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 2
  ctx.fillText(String(fragment.id + 1), 32, 32)

  return canvas.toDataURL()
}

interface FragmentItemProps {
  fragment: FragmentData
  artifactType: ArtifactType
  isSelected: boolean
  isFused: boolean
  onClick: () => void
}

function FragmentItem({ fragment, artifactType, isSelected, isFused, onClick }: FragmentItemProps) {
  const thumbnail = useMemo(() => renderFragmentThumbnail(fragment, artifactType), [fragment, artifactType])
  
  return (
    <div
      className={`fragment-item ${isSelected ? 'selected' : ''} ${isFused ? 'fused' : ''}`}
      onClick={!isFused ? onClick : undefined}
      style={{ 
        opacity: isFused ? 0.7 : 1,
        cursor: isFused ? 'default' : 'pointer'
      }}
    >
      <div className="fragment-thumbnail-wrapper">
      <img 
        src={thumbnail} 
        alt={`碎片 ${fragment.id + 1}`}
        className="fragment-thumbnail-img"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '6px',
          border: artifactType === 'blue-porcelain' 
            ? '1px solid #42a5f5' 
            : '1px solid #66bb6a',
          opacity: isFused ? 0.5 : 1
        }}
      />
      {isFused && (
        <div className="fragment-fused-overlay">
        <span className="fragment-fused-check">✓</span>
        </div>
      )}
      </div>
      <div className="fragment-info">
        <div className="fragment-number">
          碎片 #{String(fragment.id + 1).padStart(2, '0')}
        </div>
        <div className={`fragment-status ${isFused ? 'fused' : ''}`}>
          {isFused ? '已修复' : '待修复'}
        </div>
      </div>
      {isFused && (
        <span className="completed-badge">已修复</span>
      )}
    </div>
  )
}

export default function FragmentPanel() {
  const { fragments, selectedFragmentId, selectFragment, artifactType, fusedFragmentIds } = useStore()

  const unfusedFragments = fragments.filter(f => !fusedFragmentIds.has(f.id))
  const fusedFragments = fragments.filter(f => fusedFragmentIds.has(f.id))
  const fusedCount = fusedFragmentIds.size

  return (
    <div className="fragment-panel">
      <div className="panel-title">
        碎片清单
      </div>
      <div className="fragment-list">
        {fragments.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8d6e63', padding: '20px 0' }}>
            正在加载碎片...
          </div>
        ) : (
          <>
            {unfusedFragments.map(fragment => (
              <FragmentItem
                key={fragment.id}
                fragment={fragment}
                artifactType={artifactType}
                isSelected={selectedFragmentId === fragment.id}
                isFused={false}
                onClick={() => selectFragment(selectedFragmentId === fragment.id ? null : fragment.id)}
              />
            ))}

            {fusedCount > 0 && (
              <div style={{ 
                marginTop: 16, 
                paddingTop: 16, 
                borderTop: '1px solid rgba(212, 165, 116, 0.2)' 
              }}>
                <div style={{ 
                  fontSize: 14, 
                  color: '#8d6e63', 
                  marginBottom: 12, 
                  letterSpacing: 2, 
                  textAlign: 'center' 
                }}>
                  已修复 {fusedCount}/{fragments.length} 块
                </div>
                {fusedFragments.map(fragment => (
                  <FragmentItem
                    key={fragment.id}
                    fragment={fragment}
                    artifactType={artifactType}
                    isSelected={false}
                    isFused={true}
                    onClick={() => {}}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
