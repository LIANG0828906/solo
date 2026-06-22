import React, { useEffect } from 'react'
import { ProteinViewer } from '@/components/ProteinViewer'
import { SequenceBar } from '@/components/SequenceBar'
import { ControlPanel } from '@/components/ControlPanel'
import { useStore } from '@/store/useStore'
import { parsePdb } from '@/services/pdbParser'

export default function App() {
  const selectedPdbId = useStore((s) => s.selectedPdbId)
  const setPdbData = useStore((s) => s.setPdbData)
  const setSelectedResidueId = useStore((s) => s.setSelectedResidueId)
  const backgroundColor = useStore((s) => s.backgroundColor)

  useEffect(() => {
    try {
      const data = parsePdb(selectedPdbId)
      setPdbData(data)
    } catch (error) {
      console.error('Failed to load PDB data:', error)
      setPdbData(null)
    }
  }, [selectedPdbId, setPdbData])

  const handleBackgroundClick = () => {
    setSelectedResidueId(null)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor,
        transition: 'background-color 0.3s ease',
      }}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <ProteinViewer onBackgroundClick={handleBackgroundClick} />
        </div>

        <ControlPanel />

        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            color: '#CBD5E1',
            fontSize: '11px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(5px)',
              borderRadius: '8px',
              padding: '10px 14px',
              border: '1px solid rgba(71, 85, 105, 0.5)',
            }}
          >
            <div style={{ color: '#94A3B8', marginBottom: '4px' }}>操作指南</div>
            <div>🖱️ 左键拖拽：旋转视角</div>
            <div>🖱️ 滚轮：缩放</div>
            <div>🖱️ 右键拖拽：平移</div>
            <div>🎯 点击序列色块：高亮残基</div>
          </div>
        </div>
      </div>

      <SequenceBar />
    </div>
  )
}
