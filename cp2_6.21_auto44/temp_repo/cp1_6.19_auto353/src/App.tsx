import { useState, useEffect, useRef, useCallback } from 'react'
import PlantScene from './components/PlantScene'
import ChartPanel from './components/ChartPanel'
import ControlPanel from './components/ControlPanel'
import { useSimStore, calculatePhotosynthesisRate } from './store/useSimStore'

export default function App() {
  const {
    schemes,
    logs,
    activeSchemeId,
    isResetting,
    activateScheme,
    updateSchemeName,
    removeScheme,
    addLog,
    resetAll,
    setIsResetting,
    lightParams,
    plantState
  } = useSimStore()

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [newLogAnimation, setNewLogAnimation] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const captureThumbnail = useCallback((): string | null => {
    if (!sceneContainerRef.current) return null
    
    const canvas = sceneContainerRef.current.querySelector('canvas')
    if (!canvas) return null

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 200
    tempCanvas.height = 150
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#F5F5DC'
    ctx.fillRect(0, 0, 200, 150)
    
    const scaleX = 200 / canvas.width
    const scaleY = 150 / canvas.height
    const scale = Math.min(scaleX, scaleY)
    
    const drawWidth = canvas.width * scale
    const drawHeight = canvas.height * scale
    const offsetX = (200 - drawWidth) / 2
    const offsetY = (150 - drawHeight) / 2
    
    ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight)
    return tempCanvas.toDataURL('image/png')
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      addLog()
      setNewLogAnimation(true)
      setTimeout(() => setNewLogAnimation(false), 300)
    }, 30000)

    return () => clearInterval(interval)
  }, [addLog])

  useEffect(() => {
    if (logsEndRef.current && logs.length > 0) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleExport = () => {
    const data = {
      exportTime: new Date().toISOString(),
      schemes: schemes.map(s => ({
        id: s.id,
        name: s.name,
        lightParams: s.lightParams,
        plantState: s.plantState
      })),
      growthLogs: logs.map(l => ({
        timestamp: l.timestamp,
        lightParams: l.lightParams,
        plantState: l.plantState,
        photosynthesisRate: l.photosynthesisRate
      }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plant-sim-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleResetConfirm = () => {
    setShowResetConfirm(false)
    setIsResetting(true)
    
    setTimeout(() => {
      resetAll()
      setTimeout(() => {
        setIsResetting(false)
      }, 400)
    }, 400)
  }

  const handleSchemeClick = (id: string) => {
    if (id === activeSchemeId) return
    setIsTransitioning(true)
    setTimeout(() => {
      activateScheme(id)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
    }, 250)
  }

  const handleSchemeNameEdit = (id: string, currentName: string) => {
    setEditingSchemeId(id)
    setEditName(currentName)
  }

  const handleSaveName = (id: string) => {
    if (editName.trim()) {
      updateSchemeName(id, editName.trim())
    }
    setEditingSchemeId(null)
    setEditName('')
  }

  return (
    <div className="app-container" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: isResetting ? 0 : 1,
      transition: 'opacity 0.4s ease-in-out'
    }}>
      <header style={{
        flexShrink: 0,
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Roboto Slab', serif",
          fontSize: '26px',
          fontWeight: 700,
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          letterSpacing: '1px'
        }}>
          植物光感模拟器
        </h1>

        <div style={{
          position: 'absolute',
          right: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
          >
            导出数据
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#F44336',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(244, 67, 54, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(244, 67, 54, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.4)'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
          >
            🗑
          </button>
        </div>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        padding: '0 24px 24px 24px',
        gap: '24px',
        minHeight: 0,
        flexWrap: 'wrap'
      }}>
        <div className="left-panel">
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(8px)',
            flex: 1,
            minWidth: '280px'
          }}>
            <ChartPanel />
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            flex: 1,
            minWidth: '280px'
          }}>
            <ControlPanel onCapture={captureThumbnail} />
          </div>
        </div>

        <div style={{
          flex: 1,
          minWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          minHeight: 0
        }}>
          <div
            ref={sceneContainerRef}
            style={{
              flex: 1,
              position: 'relative',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              opacity: isTransitioning ? 0.3 : 1,
              transition: 'opacity 0.5s ease-in-out',
              minHeight: '400px'
            }}
          >
            <PlantScene />
            
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px'
            }}>
              <div>叶片: {plantState.leafCount.toFixed(1)} 片</div>
              <div>面积: {plantState.avgLeafArea.toFixed(1)} cm²</div>
              <div>株高: {plantState.stemHeight.toFixed(1)} cm</div>
            </div>
          </div>

          <div style={{
            flexShrink: 0,
            display: 'flex',
            gap: '16px',
            padding: '16px',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '16px',
            overflowX: 'auto',
            minHeight: '180px'
          }}>
            {schemes.length === 0 && (
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '14px'
              }}>
                暂无方案，点击左侧按钮创建光照方案
              </div>
            )}
            
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                onClick={() => handleSchemeClick(scheme.id)}
                style={{
                  flexShrink: 0,
                  width: '200px',
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: activeSchemeId === scheme.id 
                    ? '3px solid #4CAF50' 
                    : '3px solid transparent',
                  boxShadow: activeSchemeId === scheme.id
                    ? '0 4px 16px rgba(76, 175, 80, 0.4)'
                    : '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <div style={{
                  width: '200px',
                  height: '150px',
                  background: '#f5f5f5',
                  overflow: 'hidden'
                }}>
                  <img
                    src={scheme.thumbnail}
                    alt={scheme.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                <div style={{
                  padding: '10px 12px',
                  borderTop: '1px solid #eee'
                }}>
                  {editingSchemeId === scheme.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveName(scheme.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(scheme.id)
                          if (e.key === 'Escape') {
                            setEditingSchemeId(null)
                            setEditName('')
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          border: '1px solid #4CAF50',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        handleSchemeNameEdit(scheme.id, scheme.name)
                      }}
                    >
                      {scheme.name}
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#888'
                  }}>
                    <span>{scheme.lightParams.intensity} lux</span>
                    <span>{scheme.lightParams.colorTemp}K</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#888'
                    }}>
                      {scheme.lightParams.angle}°
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('确定删除此方案？')) {
                          removeScheme(scheme.id)
                        }
                      }}
                      style={{
                        padding: '2px 6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#F44336',
                        fontSize: '11px',
                        cursor: 'pointer',
                        opacity: 0.7
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.7'
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="log-panel">
          <div style={{
            background: '#263238',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            position: 'relative',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: 'white'
              }}>
                生长日志
              </h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {newLogAnimation && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#FFEB3B',
                    animation: 'pulse 0.3s ease-in-out'
                  }} />
                )}
                <span style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  {logs.length}/100
                </span>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6
            }}>
              {logs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '12px'
                }}>
                  暂无日志，30秒后自动记录第一条
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      wordBreak: 'break-word'
                    }}
                  >
                    <div style={{
                      color: '#FFEB3B',
                      fontWeight: 500,
                      marginBottom: '4px'
                    }}>
                      {log.timestamp}
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      光照: {log.lightParams.intensity}lux / {log.lightParams.colorTemp}K
                    </div>
                    <div style={{ fontSize: '11px' }}>
                      光合: {log.photosynthesisRate} μmol | 叶片: {log.plantState.leafCount}
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              color: '#333'
            }}>
              确认重置所有数据？
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#666',
              lineHeight: 1.6
            }}>
              此操作将清空所有光照方案和生长日志，
              <br />
              植物状态将恢复到默认值。
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
              >
                取消
              </button>
              <button
                onClick={handleResetConfirm}
                style={{
                  padding: '12px 24px',
                  background: '#F44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(244, 67, 54, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4CAF50, #388E3C);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
          transition: all 0.2s;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 10px rgba(76, 175, 80, 0.6);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4CAF50, #388E3C);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(76, 175, 80, 0.4);
        }
      `}</style>
    </div>
  )
}
