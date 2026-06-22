import { useEffect } from 'react'
import { useTrafficStore } from '../store/trafficStore'
import { TrafficMode } from '../modules/trafficSimulator'

const MODE_LABELS: Record<TrafficMode, string> = {
  morning: '早高峰',
  evening: '晚高峰',
  night: '夜间低峰'
}

const DIRECTION_LABELS: Record<string, string> = {
  north: '北向',
  south: '南向',
  east: '东向',
  west: '西向'
}

interface ControlPanelProps {
  onResetCamera: () => void
}

export default function ControlPanel({ onResetCamera }: ControlPanelProps) {
  const { data, mode, setMode, currentTime, updateTime } = useTrafficStore()

  useEffect(() => {
    const timer = setInterval(() => {
      updateTime()
    }, 1000)
    return () => clearInterval(timer)
  }, [updateTime])

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '320px',
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: '12px',
    padding: '20px',
    color: '#E2E8F0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    border: '1px solid rgba(99,102,241,0.2)'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const timeDisplayStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: '8px',
    marginBottom: '16px'
  }

  const timeValueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#6366F1',
    fontFamily: 'monospace'
  }

  const dateValueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#94A3B8'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#94A3B8',
    marginBottom: '8px',
    fontWeight: 500
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px',
    outline: 'none'
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#94A3B8',
    borderBottom: '1px solid #334155',
    fontWeight: 600
  }

  const tdStyle: React.CSSProperties = {
    padding: '0 12px',
    height: '38px',
    fontSize: '14px',
    borderBottom: '1px solid #1E293B',
    transition: 'all 0.2s ease'
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 20px',
    backgroundColor: '#6366F1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  }

  const getFlowColorStyle = (flow: number): React.CSSProperties => {
    if (flow < 30) return { color: '#22C55E' }
    if (flow < 70) return { color: '#EAB308' }
    return { color: '#EF4444' }
  }

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>
        <span>交通流量监控面板</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            animation: 'pulse 2s infinite'
          }}></span>
        </div>
      </div>

      <div style={timeDisplayStyle}>
        <div>
          <div style={timeValueStyle}>{formatTime(currentTime)}</div>
          <div style={dateValueStyle}>{formatDate(currentTime)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>系统状态</div>
          <div style={{ fontSize: '13px', color: '#22C55E' }}>实时采集中</div>
        </div>
      </div>

      <div>
        <div style={labelStyle}>数据模式</div>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as TrafficMode)}
          style={{
            ...selectStyle,
            fontWeight: mode ? 700 : 400
          }}

        >
            <option value="morning" style={{ backgroundColor: '#1E293B' }}>
              {MODE_LABELS.morning}
            </option>
            <option value="evening" style={{ backgroundColor: '#1E293B' }}>
              {MODE_LABELS.evening}
            </option>
            <option value="night" style={{ backgroundColor: '#1E293B' }}>
              {MODE_LABELS.night}
            </option>
          </select>
      </div>

      <div>
        <div style={labelStyle}>实时流量统计</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>方向</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>当前流量</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.direction}
                style={{
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'
                  e.currentTarget.style.fontWeight = 'bold'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.fontWeight = 'normal'
                }}
              >
                <td style={tdStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: item.light === 'green' ? '#22C55E' :
                      item.light === 'yellow' ? '#EAB308' : '#EF4444'
                  }}></span>
                  {DIRECTION_LABELS[item.direction]}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', ...getFlowColorStyle(item.flow), fontWeight: 600 }}>
                  {item.flow}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={onResetCamera}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4F46E5'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#6366F1'
        }}
      >
          重置视角
        </button>

      <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          select:focus {
            border-color: #6366F1;
          }
          select option {
            background-color: #1E293B;
            color: #E2E8F0;
            padding: 8px;
          }
        `}</style>
    </div>
  )
}
