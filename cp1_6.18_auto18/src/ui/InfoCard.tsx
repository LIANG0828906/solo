import React from 'react'

export interface InfoCardProps {
  position: { x: number; y: number }
  type: 'star' | 'planet'
  data: {
    name: string
    spectralType?: string
    distance?: number
    temperature?: number
    brightness?: number
  }
  visible: boolean
}

const InfoCard: React.FC<InfoCardProps> = ({ position, type, data, visible }) => {
  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + 15,
        top: position.y + 15,
        width: 260,
        minHeight: 160,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        padding: 16,
        color: '#1A002D',
        zIndex: 1000,
        pointerEvents: 'none',
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: 16,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1A002D', marginBottom: 10 }}>
        {data.name}
      </div>
      {type === 'star' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#666' }}>光谱类型</span>
            <span style={{ color: '#7E57C2', fontWeight: 600 }}>{data.spectralType}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#666' }}>亮度</span>
            <span style={{ color: '#FFD54F', fontWeight: 600 }}>
              {data.brightness !== undefined ? (data.brightness * 100).toFixed(0) + '%' : '-'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#666' }}>行星数量</span>
            <span style={{ color: '#4FC3F7', fontWeight: 600 }}>{(data as any).planetCount ?? 0}</span>
          </div>
        </>
      )}
      {type === 'planet' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#666' }}>距恒星</span>
            <span style={{ color: '#7E57C2', fontWeight: 600 }}>
              {data.distance !== undefined ? data.distance.toFixed(2) + ' AU' : '-'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#666' }}>模拟温度</span>
            <span style={{ color: '#E57373', fontWeight: 600 }}>
              {data.temperature !== undefined ? data.temperature + ' K' : '-'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default InfoCard
