import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BarChartOutlined, CalendarOutlined, WarningOutlined } from '@ant-design/icons'
import { useInventoryStore } from '@/stores/inventoryStore'
import type { TrendData, StockStatus } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<StockStatus, { label: string; dotClass: string }> = {
  normal: { label: '正常', dotClass: 'green' },
  low: { label: '偏低', dotClass: 'yellow' },
  critical: { label: '严重不足', dotClass: 'red' },
}

const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5].map((i) => (
      <td key={i} style={{ padding: '14px 12px' }}>
        <div className="skeleton" style={{ width: 100, height: 14 }} />
      </td>
    ))}
  </tr>
)

export default function Reports() {
  const { fetchInventory, fetchTrends, consumables, loading, getStockStatus } = useInventoryStore()
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchInventory()
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [fetchInventory])

  useEffect(() => {
    const loadTrends = async () => {
      setChartLoading(true)
      const data = await fetchTrends(selectedId || undefined)
      setTrendData(data)
      setChartLoading(false)
    }
    loadTrends()
  }, [fetchTrends, selectedId])

  const selectedConsumable = useMemo(
    () => consumables.find((c) => c.id === selectedId),
    [consumables, selectedId]
  )

  const tableData = useMemo(() => {
    return consumables.map((item) => {
      const status = getStockStatus(item.currentStock, item.safetyThreshold)
      const daysToReplenish = item.currentStock > 0 && item.dailyConsumption > 0
        ? Math.ceil(item.currentStock / item.dailyConsumption)
        : item.purchaseCycle
      const replenishDate = dayjs().add(daysToReplenish, 'day').format('YYYY-MM-DD')
      const isLow = status !== 'normal'
      return {
        ...item,
        status,
        replenishDate,
        recommendedQuantity: Math.max(0, item.safetyThreshold - item.currentStock),
        isLow,
      }
    })
  }, [consumables, getStockStatus])

  const PageTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ marginBottom: 24 }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          paddingLeft: 12,
          borderLeft: '4px solid #0050b3',
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {title}
      </h1>
      {subtitle && <p style={{ color: '#8c8c8c', fontSize: 14, marginLeft: 16 }}>{subtitle}</p>}
    </div>
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #f0f0f0',
        }}>
          <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, fontSize: 12, margin: '4px 0' }}>
              {entry.name}: {entry.value} 件
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const MobileTableRow = ({ item }: { item: typeof tableData[0] }) => {
    const statusInfo = statusMap[item.status]
    return (
      <div
        className="card fade-in"
        style={{
          padding: 16,
          marginBottom: 12,
          borderLeft: item.isLow ? '4px solid #f5222d' : '4px solid transparent',
          cursor: 'pointer',
          backgroundColor: selectedId === item.id ? '#e6f7ff' : 'white',
        }}
        onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
          <span className={`status-dot ${statusInfo.dotClass}`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
          <div>
            <span style={{ color: '#8c8c8c' }}>当前库存: </span>
            <span style={{ fontWeight: 500, color: '#0050b3' }}>{item.currentStock}</span>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>安全阈值: </span>
            <span>{item.safetyThreshold}</span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: '#8c8c8c' }}>预测补货日期: </span>
            <span style={{ fontWeight: item.isLow ? 600 : 400, color: item.isLow ? '#f5222d' : 'inherit' }}>
              {item.replenishDate}
            </span>
          </div>
          {item.recommendedQuantity > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="tag tag-yellow">
                <WarningOutlined /> 推荐补货 {item.recommendedQuantity} 件
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageTitle title="库存趋势报告" subtitle="分析历史消耗数据，预测补货需求" />

      <div className="card fade-in" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChartOutlined style={{ fontSize: 18, color: '#0050b3' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>
              {selectedConsumable ? `${selectedConsumable.name} - 出入库趋势` : '总出入库趋势 (过去30天)'}
            </h2>
          </div>
          {selectedId && (
            <button
              className="btn btn-default"
              onClick={() => setSelectedId(null)}
            >
              查看全部趋势
            </button>
          )}
        </div>

        {chartLoading ? (
          <div className="skeleton" style={{ width: '100%', height: isMobile ? 250 : 350, borderRadius: 8 }} />
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
            {selectedId ? (
              <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={isMobile ? 5 : 2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="inCount" name="入库" fill="#52c41a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outCount" name="出库" fill="#f5222d" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={isMobile ? 5 : 2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="inCount"
                  name="入库"
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="outCount"
                  name="出库"
                  stroke="#f5222d"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="card fade-in" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <CalendarOutlined style={{ fontSize: 18, color: '#0050b3' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>安全阈值对比表</h2>
        </div>

        {isMobile ? (
          <div>
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ padding: 16, marginBottom: 12 }}>
                  <div className="skeleton" style={{ width: 150, height: 18, marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '80%', height: 14 }} />
                </div>
              ))
            ) : tableData.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
                暂无数据
              </div>
            ) : (
              tableData.map((item) => <MobileTableRow key={item.id} item={item} />)
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>耗材名称</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>当前库存</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>安全阈值</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>状态</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>预测补货日期</th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#595959' }}>推荐补货量</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#8c8c8c' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  tableData.map((item) => {
                    const statusInfo = statusMap[item.status]
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                        style={{
                          borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer',
                          backgroundColor: selectedId === item.id ? '#e6f7ff' : 'white',
                          transition: 'background-color 0.15s ease',
                          borderLeft: item.isLow ? '4px solid #f5222d' : '4px solid transparent',
                        }}
                        onMouseEnter={(e) => { if (selectedId !== item.id) e.currentTarget.style.backgroundColor = '#fafafa' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedId === item.id ? '#e6f7ff' : 'white' }}
                      >
                        <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 600, color: '#0050b3' }}>{item.currentStock}</td>
                        <td style={{ padding: '14px 12px', fontSize: 14 }}>{item.safetyThreshold}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span className={`status-dot ${statusInfo.dotClass}`} />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', fontSize: 14 }}>
                          <span
                            style={{
                              fontWeight: item.isLow ? 600 : 400,
                              color: item.isLow ? '#f5222d' : 'inherit',
                            }}
                          >
                            {item.replenishDate}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', fontSize: 14 }}>
                          {item.recommendedQuantity > 0 ? (
                            <span className="tag tag-yellow">
                              <WarningOutlined style={{ marginRight: 4 }} />
                              {item.recommendedQuantity} 件
                            </span>
                          ) : (
                            <span style={{ color: '#8c8c8c' }}>-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
