import React from 'react'
import type { RenderStyle } from '@/types'
import { useStore } from '@/store/useStore'
import { getAvailablePdbIds } from '@/services/pdbParser'

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#334155',
  color: '#CBD5E1',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontWeight: 500,
}

const buttonHoverStyle = {
  backgroundColor: '#475569',
}

const activeButtonStyle: React.CSSProperties = {
  backgroundColor: '#64748B',
  color: '#FFFFFF',
  boxShadow: '0 0 8px rgba(148, 163, 184, 0.3)',
}

const labelStyle: React.CSSProperties = {
  color: '#CBD5E1',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '8px',
  display: 'block',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '20px',
}

export function ControlPanel() {
  const selectedPdbId = useStore((s) => s.selectedPdbId)
  const setSelectedPdbId = useStore((s) => s.setSelectedPdbId)
  const renderStyle = useStore((s) => s.renderStyle)
  const setRenderStyle = useStore((s) => s.setRenderStyle)
  const showSideChains = useStore((s) => s.showSideChains)
  const setShowSideChains = useStore((s) => s.setShowSideChains)
  const ssaoIntensity = useStore((s) => s.ssaoIntensity)
  const setSsaoIntensity = useStore((s) => s.setSsaoIntensity)
  const backgroundColor = useStore((s) => s.backgroundColor)
  const setBackgroundColor = useStore((s) => s.setBackgroundColor)
  const pdbData = useStore((s) => s.pdbData)
  const selectedResidueId = useStore((s) => s.selectedResidueId)

  const pdbIds = getAvailablePdbIds()

  const renderStyles: { value: RenderStyle; label: string }[] = [
    { value: 'cartoon', label: '卡通' },
    { value: 'wireframe', label: '线框' },
    { value: 'ballstick', label: '球棍' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '280px',
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(71, 85, 105, 0.5)',
        zIndex: 100,
      }}
    >
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #334155' }}>
        <h2 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 700, margin: 0 }}>
          🧬 蛋白质结构查看器
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '4px', marginBottom: 0 }}>
          Protein Structure Visualizer
        </p>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>选择蛋白质 PDB ID</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {pdbIds.map((id) => (
            <button
              key={id}
              onClick={() => setSelectedPdbId(id)}
              style={{
                ...buttonStyle,
                ...(selectedPdbId === id ? activeButtonStyle : {}),
                flex: 1,
              }}
              onMouseEnter={(e) => {
                if (selectedPdbId !== id) {
                  e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPdbId !== id) {
                  e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!
                }
              }}
            >
              {id}
            </button>
          ))}
        </div>
        {pdbData && (
          <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '8px', marginBottom: 0 }}>
            {pdbData.name}
          </p>
        )}
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>渲染样式</label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {renderStyles.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRenderStyle(value)}
              style={{
                ...buttonStyle,
                ...(renderStyle === value ? activeButtonStyle : {}),
                flex: 1,
              }}
              onMouseEnter={(e) => {
                if (renderStyle !== value) {
                  e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor
                }
              }}
              onMouseLeave={(e) => {
                if (renderStyle !== value) {
                  e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>显示侧链</label>
        <button
          onClick={() => setShowSideChains(!showSideChains)}
          style={{
            ...buttonStyle,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...(showSideChains ? activeButtonStyle : {}),
          }}
          onMouseEnter={(e) => {
            if (!showSideChains) {
              e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor
            }
          }}
          onMouseLeave={(e) => {
            if (!showSideChains) {
              e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!
            }
          }}
        >
          <span>{showSideChains ? '✓ 已显示侧链' : '✗ 隐藏侧链'}</span>
          <div
            style={{
              width: '36px',
              height: '20px',
              backgroundColor: showSideChains ? '#4ADE80' : '#475569',
              borderRadius: '10px',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: showSideChains ? '18px' : '2px',
                width: '16px',
                height: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
        </button>
      </div>

      <div style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>SSAO 环境光遮蔽</span>
          <span style={{ color: '#94A3B8', fontWeight: 400 }}>{ssaoIntensity}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={ssaoIntensity}
          onChange={(e) => setSsaoIntensity(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            appearance: 'none',
            background: '#475569',
            borderRadius: '3px',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #94A3B8;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            background: #CBD5E1;
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #94A3B8;
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>背景颜色</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor,
              border: '2px solid #475569',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
            }}
          />
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{
              flex: 1,
              height: '40px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#334155',
              cursor: 'pointer',
              padding: '4px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          {['#0F172A', '#1E1B4B', '#052E2B', '#1C1917', '#18181B'].map((color) => (
            <button
              key={color}
              onClick={() => setBackgroundColor(color)}
              style={{
                flex: 1,
                height: '24px',
                backgroundColor: color,
                border: backgroundColor === color ? '2px solid #FBBF24' : '2px solid #475569',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {selectedResidueId !== null && pdbData && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
          }}
        >
          <div style={{ color: '#FBBF24', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
            当前选中残基
          </div>
          {(() => {
            const r = pdbData.sequence[selectedResidueId]
            return (
              <div style={{ color: '#CBD5E1', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: '#FFFFFF' }}>
                  {r.threeLetterCode} ({r.oneLetterCode}) - 第 {r.id + 1} 位
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                  {r.name} · {r.secondaryStructure === 'helix' ? 'α-螺旋' : r.secondaryStructure === 'sheet' ? 'β-折叠' : '无规卷曲'}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #334155',
          color: '#64748B',
          fontSize: '10px',
          lineHeight: '1.5',
        }}
      >
        💡 提示：拖拽旋转视图，滚轮缩放，点击序列高亮残基
      </div>
    </div>
  )
}
