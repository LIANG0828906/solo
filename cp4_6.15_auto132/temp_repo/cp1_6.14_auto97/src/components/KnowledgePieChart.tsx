import { useRef, useEffect } from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { WeakPoint, KnowledgePointStat } from '@shared/types'

ChartJS.register(ArcElement, Tooltip, Legend)

interface KnowledgePieChartProps {
  data: (WeakPoint | KnowledgePointStat)[]
  className?: string
}

const gradientColors = [
  { start: '#369CFF', end: '#0D3B66' },
  { start: '#4CAF7E', end: '#2E7D52' },
  { start: '#FF9800', end: '#E65100' },
  { start: '#9C27B0', end: '#6A1B9A' },
  { start: '#F44336', end: '#B71C1C' },
  { start: '#00BCD4', end: '#006064' },
  { start: '#FFEB3B', end: '#F57F17' },
  { start: '#E91E63', end: '#880E4F' },
]

function createGradient(
  ctx: CanvasRenderingContext2D,
  startColor: string,
  endColor: string
) {
  const gradient = ctx.createLinearGradient(0, 0, 200, 200)
  gradient.addColorStop(0, startColor)
  gradient.addColorStop(1, endColor)
  return gradient
}

export default function KnowledgePieChart({
  data,
  className,
}: KnowledgePieChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null)

  const chartData: ChartData<'doughnut', number[], string> = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.errorCount),
        borderWidth: 0,
        hoverOffset: 10,
        backgroundColor: function (context) {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return '#369CFF'
          const index = context.dataIndex
          const colors = gradientColors[index % gradientColors.length]
          return createGradient(ctx, colors.start, colors.end)
        },
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 13,
          },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(13, 59, 102, 0.95)',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (tooltipItems) {
            return tooltipItems[0].label || ''
          },
          label: function (context) {
            const item = data[context.dataIndex]
            const totalCount = item.totalCount
            const errorCount = item.errorCount
            const errorRate = totalCount > 0
              ? ((errorCount / totalCount) * 100).toFixed(1)
              : '0'
            return [
              `错误次数: ${errorCount}`,
              `总题数: ${totalCount}`,
              `错误率: ${errorRate}%`,
            ]
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutQuart',
    },
  }

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [data])

  const totalErrors = data.reduce((sum, item) => sum + item.errorCount, 0)

  return (
    <div className={className}>
      <div className="relative">
        <Doughnut ref={chartRef} data={chartData} options={options} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-darkBlue">{totalErrors}</div>
            <div className="text-sm text-gray-500">总错误次数</div>
          </div>
        </div>
      </div>
    </div>
  )
}
