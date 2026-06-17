import { useMemo, useRef, useState, useEffect } from 'react'
import { useFightStore, LogEntry, LogType } from './store'

const VISIBLE_COUNT = 20
const ITEM_HEIGHT = 56

const getLogColor = (type: LogType): string => {
  switch (type) {
    case 'attack':
      return '#FF5252'
    case 'defense':
      return '#69F0AE'
    case 'special':
      return '#CE93D8'
    default:
      return '#E0E0E0'
  }
}

const getLogIcon = (type: LogType): string => {
  switch (type) {
    case 'attack':
      return '⚔'
    case 'defense':
      return '🛡'
    case 'special':
      return '✦'
    default:
      return '•'
  }
}

const CombatLog: React.FC = () => {
  const logs = useFightStore((s) => s.logs)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [logs.length])

  const visibleLogs = useMemo(() => {
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT)
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, logs.length)
    return logs.slice(startIndex, endIndex).map((log, i) => ({
      log,
      index: startIndex + i,
    }))
  }, [logs, scrollTop])

  const totalHeight = logs.length * ITEM_HEIGHT
  const offsetY = Math.floor(scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT

  return (
    <div
      style={{
        width: '280px',
        height: '816px',
        background: 'rgba(37, 37, 37, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #333',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <span>📜</span>
        <span>战斗日志</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#888',
          }}
        >
          {logs.length}/30
        </span>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#555 transparent',
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleLogs.map(({ log, index }) => {
              const opacity = logs.length > 10
                ? Math.max(0.2, 1 - index / logs.length)
                : 1
              const color = getLogColor(log.type)
              return (
                <div
                  key={log.id}
                  style={{
                    height: ITEM_HEIGHT,
                    padding: '10px 16px',
                    boxSizing: 'border-box',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    opacity,
                    transition: 'opacity 0.3s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      color,
                      flexShrink: 0,
                      marginTop: '2px',
                      filter: `drop-shadow(0 0 4px ${color})`,
                    }}
                  >
                    {getLogIcon(log.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        marginBottom: '2px',
                      }}
                    >
                      回合 {log.round}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#E0E0E0',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                      }}
                    >
                      <span style={{ color }}>{log.text.split('：')[0]}：</span>
                      {log.text.split('：').slice(1).join('：')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {logs.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              transform: 'translateY(-50%)',
              textAlign: 'center',
              color: '#555',
              fontSize: '12px',
            }}
          >
            暂无战斗记录
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#444' }}>
              点击 START 开始战斗
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          color: '#888',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#FF5252' }}>⚔</span>
          <span>攻击</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#69F0AE' }}>🛡</span>
          <span>防御</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#CE93D8' }}>✦</span>
          <span>技能</span>
        </div>
      </div>
    </div>
  )
}

export default CombatLog
