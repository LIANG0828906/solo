import React from 'react'
import { useDashboardStore } from '../store/useDashboardStore'

interface DetailModalProps {
  anomaly: {
    id: string
    time: string
    platform: string
    metric: string
    currentValue: number
    historicalAvg: number
    stdDev: number
    deviation: number
    threshold: number
    severity: 'warning' | 'critical'
  }
  onClose: () => void
}

export const DetailModal: React.FC<DetailModalProps> = ({ anomaly, onClose }) => {
  const { selectAnomaly } = useDashboardStore()

  const handleClose = () => {
    selectAnomaly(null)
    onClose()
  }

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      sales: '销售额',
      orders: '订单量',
      inventory: '库存',
      price: '价格'
    }
    return labels[metric] || metric
  }

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      web: '官网',
      miniapp: '小程序',
      app: 'App'
    }
    return labels[platform] || platform
  }

  const formatValue = (value: number, metric: string) => {
    if (metric === 'sales' || metric === 'price') {
      return `¥${value.toLocaleString()}`
    }
    return value.toLocaleString()
  }

  const deviationPercent = (anomaly.deviation * 100).toFixed(2)

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#2a2a3e',
          borderRadius: '16px',
          padding: '32px',
          width: '480px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: anomaly.severity === 'critical'
              ? 'rgba(239,68,68,0.2)'
              : 'rgba(245,158,11,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={anomaly.severity === 'critical' ? '#ef4444' : '#f59e0b'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#f4f4f5',
              marginBottom: '4px'
            }}>
              {getMetricLabel(anomaly.metric)}异常详情
            </h3>
            <span style={{
              fontSize: '13px',
              color: anomaly.severity === 'critical' ? '#ef4444' : '#f59e0b',
              fontWeight: 600
            }}>
              {anomaly.severity === 'critical' ? '严重' : '警告'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              marginBottom: '8px'
            }}>
              平台
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              {getPlatformLabel(anomaly.platform)}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              marginBottom: '8px'
            }}>
              发生时间
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              {anomaly.time}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#71717a',
            marginBottom: '12px'
          }}>
            数值对比
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#a1a1aa',
                marginBottom: '4px'
              }}>
                当前值
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: anomaly.deviation > 0 ? '#22c55e' : '#ef4444'
              }}>
                {formatValue(anomaly.currentValue, anomaly.metric)}
              </div>
            </div>
            <div style={{
              textAlign: 'right'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#a1a1aa',
                marginBottom: '4px'
              }}>
                历史均值
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#f4f4f5'
              }}>
                {formatValue(anomaly.historicalAvg, anomaly.metric)}
              </div>
            </div>
          </div>

          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            position: 'relative',
            marginBottom: '12px'
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '-4px',
              width: '2px',
              height: '12px',
              background: '#71717a',
              transform: 'translateX(-50%)'
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: '-20px',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#71717a'
            }}>
              均值
            </div>
            <div style={{
              position: 'absolute',
              left: `${50 + anomaly.deviation * 20}%`,
              top: '-6px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: anomaly.deviation > 0 ? '#22c55e' : '#ef4444',
              transform: 'translateX(-50%)',
              boxShadow: `0 2px 8px ${anomaly.deviation > 0 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`
            }} />
          </div>
          <div style={{ height: '20px' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              marginBottom: '6px'
            }}>
              偏差幅度
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: anomaly.deviation > 0 ? '#22c55e' : '#ef4444'
            }}>
              {anomaly.deviation > 0 ? '+' : ''}{deviationPercent}%
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              marginBottom: '6px'
            }}>
              触发阈值
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              ±{(anomaly.threshold * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              marginBottom: '6px'
            }}>
              标准差
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              {formatValue(anomaly.stdDev, anomaly.metric)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              marginBottom: '6px'
            }}>
              偏离倍数
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              {(Math.abs(anomaly.deviation * anomaly.historicalAvg) / anomaly.stdDev).toFixed(2)}σ
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.1)',
              color: '#f4f4f5',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
          >
            关闭
          </button>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            查看详情报告
          </button>
        </div>
      </div>
    </div>
  )
}
