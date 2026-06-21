import React, { useEffect, useRef } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useDashboardStore } from '../store/useDashboardStore'
import { DetailModal } from './DetailModal'

interface StatCardProps {
  title: string
  value: number
  suffix?: string
  isRefreshing: boolean
  prefix?: string
  icon?: string
  formatInteger?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, suffix = '', isRefreshing, prefix = '', icon, formatInteger = false }) => {
  const [displayValue, setDisplayValue] = React.useState(0)
  const prevValueRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const startValue = prevValueRef.current
    const endValue = value
    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = endValue
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value])

  const formatValue = (val: number): string => {
    if (formatInteger) {
      if (val >= 10000) {
        return Math.round(val / 10000).toLocaleString() + '万'
      }
      return Math.round(val).toLocaleString()
    }
    if (val >= 10000) {
      return (val / 10000).toFixed(2) + '万'
    }
    if (val >= 1000) {
      return val.toFixed(0)
    }
    return val.toFixed(2)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '120px'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        opacity: isRefreshing ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: 'rgba(255,255,255,0.8)',
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
      }}>
        {icon && (
          <span style={{ fontSize: '20px' }}>{icon}</span>
        )}
        <div style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.85)',
          fontWeight: 500
        }}>
          {title}
        </div>
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '-0.5px'
      }}>
        {prefix}{formatValue(displayValue)}{suffix}
      </div>
    </div>
  )
}

interface AnomalyItemProps {
  anomaly: {
    id: string
    time: string
    platform: string
    metric: string
    deviation: number
    severity: 'warning' | 'critical'
  }
  isSelected: boolean
  onClick: () => void
  isNew?: boolean
}

const AnomalyItem: React.FC<AnomalyItemProps> = ({ anomaly, isSelected, onClick, isNew }) => {
  const [visible, setVisible] = React.useState(!isNew)

  React.useEffect(() => {
    if (isNew) {
      requestAnimationFrame(() => {
        setVisible(true)
      })
    }
  }, [isNew])

  const getDeviationText = (dev: number) => {
    const pct = Math.abs(dev * 100).toFixed(1)
    return dev > 0 ? `+${pct}%` : `-${pct}%`
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

  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 16px',
        borderRadius: '10px',
        background: 'rgba(239,68,68,0.1)',
        backdropFilter: 'blur(10px)',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isSelected ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(239,68,68,0.2)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-10px)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: anomaly.severity === 'critical' ? '#ef4444' : '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              {getMetricLabel(anomaly.metric)}异常
            </span>
            <span style={{
              fontSize: '12px',
              color: anomaly.severity === 'critical' ? '#ef4444' : '#f59e0b',
              fontWeight: 600
            }}>
              {getDeviationText(anomaly.deviation)}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#a1a1aa',
            marginBottom: '4px'
          }}>
            {getPlatformLabel(anomaly.platform)}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#71717a'
          }}>
            {anomaly.time}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Dashboard: React.FC = () => {
  const {
    summary,
    timeSeries,
    anomalies,
    selectedAnomalyId,
    zoomRange,
    isRefreshing,
    lastUpdated,
    selectAnomaly,
    setZoomRange
  } = useDashboardStore()

  const [showModal, setShowModal] = React.useState(false)
  const prevAnomalyIdsRef = useRef<Set<string>>(new Set())
  const [newAnomalyIds, setNewAnomalyIds] = React.useState<Set<string>>(new Set())

  useEffect(() => {
    const currentIds = new Set(anomalies.map(a => a.id))
    const newIds = new Set<string>()

    currentIds.forEach(id => {
      if (!prevAnomalyIdsRef.current.has(id)) {
        newIds.add(id)
      }
    })

    if (newIds.size > 0) {
      setNewAnomalyIds(newIds)
      const timer = setTimeout(() => {
        setNewAnomalyIds(new Set())
      }, 300)
      return () => clearTimeout(timer)
    }

    prevAnomalyIdsRef.current = currentIds
  }, [anomalies])

  const handleAnomalyClick = (id: string) => {
    selectAnomaly(id)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleResetZoom = () => {
    setZoomRange(null)
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const visibleTimeSeries = React.useMemo(() => {
    if (!zoomRange) return timeSeries
    return timeSeries.filter(
      point => point.timestamp >= zoomRange.start && point.timestamp <= zoomRange.end
    )
  }, [timeSeries, zoomRange])

  const selectedAnomaly = anomalies.find(a => a.id === selectedAnomalyId) || null

  return (
    <div style={{
      padding: '24px',
      minHeight: '100vh',
      background: '#1e1e2e'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#f4f4f5'
        }}>
          订单数据看板
        </h1>
        <div style={{
          fontSize: '13px',
          color: '#71717a'
        }}>
          {lastUpdated ? `最后更新: ${new Date(lastUpdated).toLocaleTimeString()}` : '加载中...'}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '24px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <StatCard
              title="总订单量"
              value={summary?.totalOrders || 0}
              isRefreshing={isRefreshing}
              suffix=" 单"
              icon="📦"
              formatInteger
            />
            <StatCard
              title="总销售额"
              value={summary?.totalSales || 0}
              isRefreshing={isRefreshing}
              prefix="¥"
              icon="💰"
            />
            <StatCard
              title="平均客单价"
              value={summary?.avgOrderValue || 0}
              isRefreshing={isRefreshing}
              prefix="¥"
              icon="📊"
            />
            <StatCard
              title="总库存变动"
              value={summary?.totalInventoryChange || 0}
              isRefreshing={isRefreshing}
              suffix=" 件"
              icon="📋"
              formatInteger
            />
          </div>

          <div style={{
            background: '#2a2a3e',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#f4f4f5'
              }}>
                24小时波动趋势
              </h2>
              {zoomRange && (
                <button
                  onClick={handleResetZoom}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    background: 'rgba(102,126,234,0.2)',
                    color: '#818cf8',
                    border: '1px solid rgba(102,126,234,0.4)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102,126,234,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102,126,234,0.2)'
                  }}
                >
                  重置视图
                </button>
              )}
            </div>

            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveChart data={visibleTimeSeries} formatTime={formatTime} />
            </div>
          </div>
        </div>

        <div style={{
          width: '300px',
          flexShrink: 0,
          background: '#2a2a3e',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 80px)',
          position: 'sticky',
          top: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#f4f4f5'
            }}>
              异常告警
            </h2>
            <span style={{
              fontSize: '12px',
              color: '#ef4444',
              background: 'rgba(239,68,68,0.15)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 600
            }}>
              {anomalies.length}
            </span>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {anomalies.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 0',
                color: '#71717a',
                fontSize: '14px'
              }}>
                暂无异常告警
              </div>
            ) : (
              anomalies.map(anomaly => (
                <AnomalyItem
                  key={anomaly.id}
                  anomaly={anomaly}
                  isSelected={selectedAnomalyId === anomaly.id}
                  onClick={() => handleAnomalyClick(anomaly.id)}
                  isNew={newAnomalyIds.has(anomaly.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && selectedAnomaly && (
        <DetailModal
          anomaly={selectedAnomaly}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

const ResponsiveChart: React.FC<{
  data: Array<{ time: string; timestamp: number; sales: number; orders: number; inventory: number }>
  formatTime: (ts: number) => string
}> = ({ data, formatTime }) => {
  const chartData = React.useMemo(() => {
    return data.map(point => ({
      ...point,
      displayTime: formatTime(point.timestamp)
    }))
  }, [data, formatTime])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#2a2a3e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#a1a1aa',
            marginBottom: '8px'
          }}>
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
              fontSize: '13px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: entry.color
              }} />
              <span style={{ color: '#a1a1aa' }}>{entry.name}:</span>
              <span style={{ color: '#f4f4f5', fontWeight: 600 }}>
                {entry.dataKey === 'sales' ? '¥' : ''}{entry.dataKey === 'inventory' ? `${entry.value.toLocaleString()} 件` : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey="displayTime"
          stroke="#71717a"
          tick={{ fontSize: 12, fill: '#71717a' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis
          yAxisId="left"
          stroke="#71717a"
          tick={{ fontSize: 12, fill: '#71717a' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickFormatter={(value: number) => `¥${(value / 1000).toFixed(0)}k`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#71717a"
          tick={{ fontSize: 12, fill: '#71717a' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
        <ReferenceLine y={0} yAxisId="left" stroke="rgba(255,255,255,0.1)" />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="sales"
          name="销售额"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2, fill: '#2a2a3e' }}
          fill="url(#colorSales)"
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="orders"
          name="订单量"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#2a2a3e' }}
          fill="url(#colorOrders)"
          animationDuration={800}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
