import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useStore } from './DataStore'

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  width: 320,
  background: 'rgba(20, 20, 30, 0.85)',
  borderRadius: 12,
  padding: 16,
  boxSizing: 'border-box',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  transition: 'opacity 0.2s ease, transform 0.2s ease'
}

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#ffffff',
  marginBottom: 12
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#a0a0b8',
  marginTop: 6,
  display: 'block'
}

const valueStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#e0e0f0',
  fontWeight: 500
}

const emptyStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#8080a0',
  textAlign: 'center',
  padding: '40px 0',
  fontStyle: 'italic'
}

const AnalyticsPanel: React.FC = () => {
  const selectedPathId = useStore((s) => s.selectedPathId)
  const pathStats = useStore((s) => s.pathStats)
  const currentStats = selectedPathId ? pathStats[selectedPathId] ?? null : null

  const chartOption = useMemo(() => {
    if (!currentStats) {
      return {}
    }
    const history = currentStats.history ?? []
    const now = performance.now()
    const windowStart = now - 60000
    const windowed = history.filter((r) => r.timestamp >= windowStart)
    const data: Array<[string, number]> = windowed.map((r) => {
      const sec = Math.max(0, Math.round((r.timestamp - now) / 1000))
      return [`${sec}s`, r.particleCount]
    })
    return {
      grid: {
        top: 12,
        right: 10,
        bottom: 24,
        left: 36
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((d) => d[0]),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#8080a0',
          fontSize: 10,
          interval: Math.floor(data.length / 6)
        }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisLabel: {
          color: '#8080a0',
          fontSize: 10
        },
        minInterval: 1
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 45, 0.95)',
        borderColor: 'rgba(100,120,200,0.4)',
        borderWidth: 1,
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: unknown) => {
          const arr = params as Array<{ name: string; value: number }>
          if (!arr || arr.length === 0) return ''
          return `${arr[0].name}：${arr[0].value} 粒子`
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: true,
          data: data.map((d) => d[1]),
          lineStyle: {
            color: '#1E90FF',
            width: 2
          },
          itemStyle: {
            color: '#1E90FF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30, 144, 255, 0.45)' },
                { offset: 1, color: 'rgba(30, 144, 255, 0.05)' }
              ]
            }
          }
        }
      ]
    }
  }, [currentStats])

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>流量数据分析</div>
      {!currentStats ? (
        <div style={emptyStyle}>点击河流查看详情</div>
      ) : (
        <div>
          <div style={{ marginBottom: 10 }}>
            <span style={labelStyle}>河流路径</span>
            <span style={{ ...valueStyle, display: 'block', marginTop: 2 }}>
              {currentStats.pathName}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <span style={labelStyle}>当前粒子数</span>
              <span style={{ ...valueStyle, display: 'block', marginTop: 2 }}>
                {currentStats.currentParticleCount}
              </span>
            </div>
            <div>
              <span style={labelStyle}>平均流速</span>
              <span style={{ ...valueStyle, display: 'block', marginTop: 2 }}>
                {(currentStats.averageSpeed ?? 0).toFixed(1)} 单位/秒
              </span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <span style={{ ...labelStyle, marginBottom: 4 }}>历史流量（60秒）</span>
            <div style={{ width: 280, height: 150 }}>
              <ReactECharts
                option={chartOption}
                style={{ width: 280, height: 150 }}
                notMerge={true}
                lazyUpdate={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPanel
