import { useRef, useState, useMemo } from 'react'
import { useCombatStore, LogType } from './store'

const LOG_COLORS: Record<LogType, string> = {
  attack: '#FF5252',
  defense: '#69F0AE',
  special: '#CE93D8'
}

const LOG_ICONS: Record<LogType, string> = {
  attack: '⚔️',
  defense: '🛡️',
  special: '✨'
}

const VISIBLE_COUNT = 20
const ITEM_HEIGHT = 48

function CombatLog() {
  const { logs } = useCombatStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const visibleLogs = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT)
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, logs.length)
    return logs.slice(startIndex, endIndex).map((log, index) => ({
      ...log,
      virtualIndex: startIndex + index
    }))
  }, [logs, scrollTop])

  const totalHeight = logs.length * ITEM_HEIGHT
  const offsetY = Math.floor(scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT

  return (
    <div
      className="combat-log-panel"
      style={{
        width: '280px',
        height: '600px',
        background: 'rgba(37, 37, 37, 0.9)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid #333',
        borderRadius: '12px'
      }}
    >
      <h3 style={{
        color: '#E0E0E0',
        fontSize: '16px',
        paddingBottom: '8px',
        borderBottom: '1px solid #444',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📜 战斗日志
        <span style={{
          fontSize: '12px',
          color: '#888',
          marginLeft: 'auto'
        }}>
          {logs.length}/30
        </span>
      </h3>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          scrollbarWidth: 'thin',
          scrollbarColor: '#555 #2a2a2a'
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleLogs.map((log) => (
              <LogEntryComponent
                key={log.id}
                log={log}
                totalLogs={logs.length}
              />
            ))}
          </div>
        </div>

        {logs.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            点击START开始战斗<br />
            战斗记录将显示在这里
          </div>
        )}
      </div>

      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #2a2a2a;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #777;
        }
      `}</style>
    </div>
  )
}

interface LogEntryProps {
  log: {
    id: string
    round: number
    type: LogType
    message: string
    timestamp: number
    virtualIndex: number
  }
  totalLogs: number
}

function LogEntryComponent({ log, totalLogs }: LogEntryProps) {
  const opacity = Math.max(0.3, 1 - (log.virtualIndex / Math.max(totalLogs, 20)) * 0.7)

  return (
    <div
      className="log-entry"
      style={{
        height: ITEM_HEIGHT,
        padding: '8px 12px',
        fontSize: '12px',
        color: '#E0E0E0',
        lineHeight: '1.4',
        borderLeft: `3px solid ${LOG_COLORS[log.type]}`,
        background: 'rgba(0, 0, 0, 0.2)',
        marginBottom: '4px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        opacity,
        transition: 'opacity 0.3s ease'
      }}
    >
      <span style={{ fontSize: '14px' }}>{LOG_ICONS[log.type]}</span>
      <span style={{ flex: 1 }}>
        <span style={{ color: LOG_COLORS[log.type], fontWeight: 'bold' }}>
          [{log.type === 'attack' ? '攻击' : log.type === 'defense' ? '防御' : '特殊'}]
        </span>
        <span style={{ color: '#888', marginLeft: '4px' }}>R{log.round}</span>
        <br />
        <span style={{ color: '#E0E0E0' }}>{log.message}</span>
      </span>
    </div>
  )
}

export default CombatLog
