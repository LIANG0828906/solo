import React, { useState, useRef, useEffect } from 'react'
import type { AminoAcid } from '@/types'
import { getResidueColor } from '@/services/pdbParser'
import { useStore } from '@/store/useStore'

interface TooltipData {
  residue: AminoAcid
  x: number
  y: number
}

export function SequenceBar() {
  const pdbData = useStore((s) => s.pdbData)
  const selectedResidueId = useStore((s) => s.selectedResidueId)
  const setSelectedResidueId = useStore((s) => s.setSelectedResidueId)
  const facingResidueRange = useStore((s) => s.facingResidueRange)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleResidueClick = (residue: AminoAcid) => {
    if (selectedResidueId === residue.id) {
      setSelectedResidueId(null)
    } else {
      setSelectedResidueId(residue.id)
    }
  }

  const handleMouseEnter = (residue: AminoAcid, e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltip({
        residue,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 45,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltip({
        ...tooltip,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 45,
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  useEffect(() => {
    if (selectedResidueId !== null && scrollContainerRef.current && pdbData) {
      const blockWidth = 8
      const containerWidth = scrollContainerRef.current.clientWidth
      const scrollTarget = selectedResidueId * blockWidth - containerWidth / 2 + blockWidth / 2
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth',
      })
    }
  }, [selectedResidueId, pdbData])

  if (!pdbData) {
    return null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '120px',
        backgroundColor: '#1E293B',
        borderTop: '2px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
      onMouseMove={handleMouseMove}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #334155',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 600 }}>
            {pdbData.id} - {pdbData.name}
          </span>
          <span style={{ color: '#94A3B8', fontSize: '12px' }}>
            共 {pdbData.sequence.length} 个氨基酸残基
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#FF6B6B', borderRadius: '2px' }} />
            <span style={{ color: '#CBD5E1' }}>α-螺旋</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#4ECDC4', borderRadius: '2px' }} />
            <span style={{ color: '#CBD5E1' }}>β-折叠</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#95A5A6', borderRadius: '2px' }} />
            <span style={{ color: '#CBD5E1' }}>无规卷曲</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '8px 16px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1E293B',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-block', height: '60px' }}>
          {facingResidueRange && (
            <div
              style={{
                position: 'absolute',
                left: facingResidueRange.start * 8,
                top: 0,
                width: (facingResidueRange.end - facingResidueRange.start + 1) * 8,
                height: '30px',
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                borderLeft: '1px solid rgba(251, 191, 36, 0.5)',
                borderRight: '1px solid rgba(251, 191, 36, 0.5)',
                pointerEvents: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {pdbData.sequence.map((residue) => {
              const isSelected = selectedResidueId === residue.id
              const isInFacingRange = facingResidueRange &&
                residue.id >= facingResidueRange.start &&
                residue.id <= facingResidueRange.end

              return (
                <div
                  key={residue.id}
                  onClick={() => handleResidueClick(residue)}
                  onMouseEnter={(e) => handleMouseEnter(residue, e)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    width: '8px',
                    height: '30px',
                    backgroundColor: getResidueColor(residue.secondaryStructure),
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    transform: isSelected ? 'scaleY(1.3)' : undefined,
                    boxShadow: isSelected
                      ? '0 0 8px 2px #FBBF24, 0 0 16px 4px rgba(251, 191, 36, 0.4)'
                      : isInFacingRange
                      ? '0 0 4px rgba(251, 191, 36, 0.5)'
                      : 'none',
                    opacity: isInFacingRange || isSelected ? 1 : 0.7,
                    position: 'relative',
                    flexShrink: 0,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2) translateY(-3px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = isSelected ? 'scaleY(1.3)' : 'scale(1)'
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)',
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#CBD5E1',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 1000,
          }}
        >
          <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            {tooltip.residue.threeLetterCode} {tooltip.residue.oneLetterCode} - 第 {tooltip.residue.id + 1} 位
          </div>
          <div style={{ color: '#94A3B8' }}>
            {tooltip.residue.name} · {tooltip.residue.secondaryStructure === 'helix' ? 'α-螺旋' : tooltip.residue.secondaryStructure === 'sheet' ? 'β-折叠' : '无规卷曲'}
          </div>
        </div>
      )}
    </div>
  )
}
