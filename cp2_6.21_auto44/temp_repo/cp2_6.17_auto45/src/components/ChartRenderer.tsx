import { useEffect, useRef, memo } from 'react'
import * as echarts from 'echarts'
import type { ChartType, ColorThemeKey, LineChartData, BarChartData, PieChartData } from '../utils/mockData'
import { colorThemes } from '../utils/mockData'

interface ChartRendererProps {
  type: ChartType
  data: LineChartData | BarChartData | PieChartData
  colorTheme: ColorThemeKey
  height?: number
  showLegend?: boolean
}

const ChartRenderer = memo(function ChartRenderer({
  type,
  data,
  colorTheme,
  height = 160,
  showLegend = true
}: ChartRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current)
    }

    const chart = chartInstanceRef.current
    const theme = colorThemes[colorTheme]

    const baseOption: echarts.EChartsOption = {
      grid: {
        left: 40,
        right: 20,
        top: showLegend ? 40 : 20,
        bottom: 30
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        textStyle: {
          color: '#2C3E50',
          fontFamily: 'Inter, sans-serif'
        },
        extraCssText: 'box-shadow: 0 2px 12px rgba(0,0,0,0.2); border-radius: 4px; padding: 8px 12px;'
      },
      animationDuration: 300,
      animationEasing: 'cubicOut'
    }

    let option: echarts.EChartsOption

    switch (type) {
      case 'line': {
        const lineData = data as LineChartData
        option = {
          ...baseOption,
          legend: showLegend ? {
            data: ['数值'],
            top: 0,
            textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 11 }
          } : undefined,
          xAxis: {
            type: 'category',
            data: lineData.timestamps,
            axisLabel: {
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#7F8C8D'
            },
            axisLine: { lineStyle: { color: '#E1E8ED' } }
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: {
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#7F8C8D'
            },
            splitLine: { lineStyle: { color: '#E1E8ED', type: 'dashed' } }
          },
          series: [{
            name: '数值',
            type: 'line',
            data: lineData.values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: theme.primary },
            lineStyle: { color: theme.primary, width: 2 }
          }]
        }
        break
      }

      case 'area': {
        const areaData = data as LineChartData
        option = {
          ...baseOption,
          legend: showLegend ? {
            data: ['流量'],
            top: 0,
            textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 11 }
          } : undefined,
          xAxis: {
            type: 'category',
            data: areaData.timestamps,
            boundaryGap: false,
            axisLabel: {
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#7F8C8D'
            },
            axisLine: { lineStyle: { color: '#E1E8ED' } }
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: {
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#7F8C8D'
            },
            splitLine: { lineStyle: { color: '#E1E8ED', type: 'dashed' } }
          },
          series: [{
            name: '流量',
            type: 'line',
            data: areaData.values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: theme.primary },
            lineStyle: { color: theme.primary, width: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: theme.primary + '66' },
                  { offset: 1, color: theme.primary + '11' }
                ]
              }
            }
          }]
        }
        break
      }

      case 'bar': {
        const barData = data as BarChartData
        option = {
          ...baseOption,
          legend: showLegend ? {
            data: ['销售额'],
            top: 0,
            textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 11 }
          } : undefined,
          xAxis: {
            type: 'category',
            data: barData.categories,
            axisLabel: {
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              color: '#7F8C8D'
            },
            axisLine: { lineStyle: { color: '#E1E8ED' } }
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 120,
            axisLabel: {
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#7F8C8D'
            },
            splitLine: { lineStyle: { color: '#E1E8ED', type: 'dashed' } }
          },
          series: [{
            name: '销售额',
            type: 'bar',
            data: barData.values,
            barWidth: '50%',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: theme.secondary },
                  { offset: 1, color: theme.primary }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            }
          }]
        }
        break
      }

      case 'pie': {
        const pieData = data as PieChartData
        option = {
          ...baseOption,
          grid: { left: 0, right: 0, top: showLegend ? 40 : 0, bottom: 0 },
          legend: showLegend ? {
            orient: 'horizontal',
            top: 0,
            textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 11 }
          } : undefined,
          tooltip: {
            ...baseOption.tooltip,
            trigger: 'item',
            formatter: '{b}: {c}% ({d}%)'
          },
          series: [{
            type: 'pie',
            radius: showLegend ? ['35%', '65%'] : ['40%', '70%'],
            center: ['50%', showLegend ? '55%' : '50%'],
            data: pieData.items.map((item, index) => ({
              ...item,
              itemStyle: {
                color: theme.gradient[index % theme.gradient.length]
              }
            })),
            label: {
              show: true,
              formatter: '{b}: {d}%',
              fontFamily: 'monospace',
              fontSize: 10
            },
            labelLine: { length: 5, length2: 5 },
            emphasis: {
              scale: true,
              scaleSize: 8,
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            }
          }]
        }
        break
      }

      default:
        option = baseOption
    }

    chart.setOption(option, { notMerge: false, lazyUpdate: false })

    const handleResize = () => {
      chart.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [type, data, colorTheme, height, showLegend])

  return (
    <div
      ref={chartRef}
      className="chart-container"
      style={{ width: '100%', height: `${height}px` }}
    />
  )
})

export default ChartRenderer
