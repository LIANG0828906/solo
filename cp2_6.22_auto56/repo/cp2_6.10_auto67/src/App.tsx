import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Toolbar from './components/Toolbar'
import Workbench from './components/Workbench'
import { useStore } from './store'

const App: React.FC = () => {
  const [historyOpen, setHistoryOpen] = useState(false)
  const { history } = useStore()

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'A': return '#00ff00'
      case 'B': return '#ffff00'
      case 'C': return '#ff8800'
      case 'D': return '#ff0000'
      default: return '#fff'
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      overflow: 'hidden'
    }}>
      <header style={{
        padding: '16px 24px',
        background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          color: '#deb887',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          🪵 墨斗弹线模拟器
        </h1>
        <Toolbar />
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        <section style={{
          flex: 1,
          position: 'relative'
        }}>
          <Workbench />
        </section>

        <aside
          style={{
            width: historyOpen ? '280px' : '48px',
            background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
            borderLeft: '1px solid #333',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          onMouseEnter={() => setHistoryOpen(true)}
          onMouseLeave={() => setHistoryOpen(false)}
        >
          <div style={{
            padding: '16px 12px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <h3 style={{
              margin: 0,
              color: '#deb887',
              fontSize: '16px',
              opacity: historyOpen ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}>
              历史记录
            </h3>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: historyOpen ? '12px' : '8px'
          }}>
            {history.length === 0 ? (
              <div style={{
                padding: '20px 12px',
                textAlign: 'center',
                color: '#666',
                fontSize: '13px',
                whiteSpace: 'nowrap'
              }}>
                {historyOpen ? '暂无切割记录' : '...'}
              </div>
            ) : (
              history.map((record, index) => (
                <motion.div
                  key={record.id}
                  style={{
                    padding: historyOpen ? '12px' : '8px',
                    marginBottom: '8px',
                    background: 'rgba(222, 184, 135, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(222, 184, 135, 0.2)',
                    cursor: 'pointer',
                    textAlign: historyOpen ? 'left' : 'center'
                  }}
                  whileHover={{ background: 'rgba(222, 184, 135, 0.2)' }}
                  transition={{ duration: 0.2 }}
                >
                  {historyOpen ? (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{ color: '#888', fontSize: '12px' }}>
                          #{history.length - index}
                        </span>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: getScoreColor(record.score)
                        }}>
                          {record.score}级
                        </span>
                      </div>
                      <div style={{
                        color: '#ccc',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        角度: {record.line.angle >= 0 ? record.line.angle : record.line.angle + 360}°
                      </div>
                      <div style={{
                        color: '#666',
                        fontSize: '11px'
                      }}>
                        {formatDate(record.timestamp)}
                      </div>
                    </>
                  ) : (
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: getScoreColor(record.score)
                    }}>
                      {record.score}
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
