import React, { useState, useEffect } from 'react'
import { useStore, InspirationType } from '../store/InspirationStore'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const typeColors: Record<InspirationType, string> = {
  text: '#6B7280',
  image: '#3B82F6',
  voice: '#F59E0B',
}

const typeLabels: Record<InspirationType, string> = {
  text: '文字',
  image: '图片',
  voice: '语音',
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { state } = useStore()
  const [loading, setLoading] = useState(false)
  const [exported, setExported] = useState(false)

  const activeTheme = state.themes.find((t) => t.id === state.activeThemeId)
  const themeInspirations = state.inspirations.filter((i) => i.themeId === state.activeThemeId)
  const themeData = state.activeThemeId ? state.themeData[state.activeThemeId] : null

  useEffect(() => {
    if (isOpen) {
      setLoading(false)
      setExported(false)
    }
  }, [isOpen])

  const handleExport = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setExported(true)
    }, 2000)
  }

  if (!isOpen || !activeTheme) return null

  const typeCounts: Record<InspirationType, number> = { text: 0, image: 0, voice: 0 }
  themeInspirations.forEach((i) => {
    typeCounts[i.type]++
  })

  const sortedInspirations = [...themeInspirations].sort((a, b) => a.createdAt - b.createdAt)
  const dateRange =
    sortedInspirations.length > 0
      ? `${new Date(sortedInspirations[0].createdAt).toLocaleDateString('zh-CN')} - ${new Date(sortedInspirations[sortedInspirations.length - 1].createdAt).toLocaleDateString('zh-CN')}`
      : '暂无记录'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
          maxHeight: '80vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
              导出信息图
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              将主题"{activeTheme.name}"导出为信息图
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#F3F4F6',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: activeTheme.color,
                  }}
                />
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>
                  {activeTheme.name}
                </h2>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>{dateRange}</p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {(['text', 'image', 'voice'] as InspirationType[]).map((type) => (
                <div
                  key={type}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${typeColors[type]}33`,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: typeColors[type],
                      marginBottom: '4px',
                    }}
                  >
                    {typeCounts[type]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{typeLabels[type]}灵感</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                节点分布概览
              </h4>
              <div
                style={{
                  position: 'relative',
                  height: '180px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 400 180">
                  {themeData?.links.map((link, idx) => {
                    const sourceNode = themeData.nodes.find((n) => n.inspirationId === link.source)
                    const targetNode = themeData.nodes.find((n) => n.inspirationId === link.target)
                    if (!sourceNode || !targetNode) return null
                    const sx = (sourceNode.x / 800) * 400
                    const sy = (sourceNode.y / 500) * 180
                    const tx = (targetNode.x / 800) * 400
                    const ty = (targetNode.y / 500) * 180
                    const mx = (sx + tx) / 2
                    const my = (sy + ty) / 2
                    return (
                      <path
                        key={idx}
                        d={`M ${sx} ${sy} Q ${mx + 10} ${my} ${tx} ${ty}`}
                        fill="none"
                        stroke="#6B7280"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    )
                  })}
                  {themeData?.nodes.map((node) => {
                    const inspiration = state.inspirations.find((i) => i.id === node.inspirationId)
                    if (!inspiration) return null
                    return (
                      <circle
                        key={node.inspirationId}
                        cx={(node.x / 800) * 400}
                        cy={(node.y / 500) * 180}
                        r="6"
                        fill={typeColors[inspiration.type]}
                      />
                    )
                  })}
                </svg>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                时间线摘要
              </h4>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {sortedInspirations.slice(0, 5).map((inspiration) => (
                  <div
                    key={inspiration.id}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '8px 0',
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: typeColors[inspiration.type],
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#374151',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {inspiration.type === 'image' ? '[图片]' : inspiration.content}
                      </p>
                      <p style={{ fontSize: '10px', color: '#9CA3AF' }}>
                        {new Date(inspiration.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
                {sortedInspirations.length > 5 && (
                  <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', padding: '8px' }}>
                    还有 {sortedInspirations.length - 5} 条...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={loading || exported}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: exported ? '#10B981' : loading ? '#9CA3AF' : '#3B82F6',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading || exported ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#3B82F6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                正在生成...
              </>
            ) : exported ? (
              '✓ 已导出'
            ) : (
              '导出为图片'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
