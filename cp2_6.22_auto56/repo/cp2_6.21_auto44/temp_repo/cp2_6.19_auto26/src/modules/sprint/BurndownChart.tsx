import { useMemo, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { TooltipItem } from 'chart.js'
import type { Task } from '@/store/useAppStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

interface BurndownChartProps {
  tasks: Task[]
  startDate: string
  endDate: string
}

function getDaysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getDateRange(start: string, end: string): string[] {
  const days = getDaysBetween(start, end)
  const dates: string[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export default function BurndownChart({ tasks, startDate, endDate }: BurndownChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null)

  const totalHours = useMemo(() => {
    return tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
  }, [tasks])

  const chartData = useMemo(() => {
    const dates = getDateRange(startDate, endDate)
    const totalDays = dates.length - 1

    const idealLine = dates.map((_, i) => {
      if (totalDays === 0) return totalHours
      return Math.max(0, totalHours - (totalHours / totalDays) * i)
    })

    const actualLine: (number | null)[] = dates.map(date => {
      const completedBefore = tasks
        .filter(t => t.status === 'done' && t.completedAt && t.completedAt <= date)
        .reduce((sum, t) => sum + t.estimatedHours, 0)

      const partialCompleted = tasks
        .filter(t => t.status === 'in-progress' && t.createdAt <= date)
        .reduce((sum, t) => sum + t.completedHours, 0)

      const remaining = totalHours - completedBefore - partialCompleted
      return Math.max(0, remaining)
    })

    const today = new Date().toISOString().split('T')[0]
    const todayIndex = dates.findIndex(d => d >= today)
    for (let i = todayIndex + 1; i < actualLine.length; i++) {
      actualLine[i] = null
    }

    return {
      labels: dates.map(formatDate),
      datasets: [
        {
          label: '理想线',
          data: idealLine,
          borderColor: 'rgba(255,255,255,0.2)',
          borderDash: [8, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
        {
          label: '实际剩余',
          data: actualLine,
          borderColor: '#e94560',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#e94560',
          pointBorderColor: '#1a1a2e',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#e94560',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          fill: {
            target: 'origin',
            above: 'rgba(233,69,96,0.08)',
          },
          tension: 0.3,
          spanGaps: false,
        },
      ],
    }
  }, [tasks, startDate, endDate, totalHours])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 100,
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#a0a0b8',
          font: { family: 'Outfit', size: 12 },
          usePointStyle: true,
          pointStyle: 'line',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(22,33,62,0.95)',
        titleColor: '#e8e8e8',
        bodyColor: '#a0a0b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: 'Outfit', size: 13, weight: 'bold' as const },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => `日期: ${items[0]?.label ?? ''}`,
          label: (item: TooltipItem<'line'>) => {
            if (item.parsed.y === null) return ''
            return `${item.dataset.label ?? ''}: ${item.parsed.y.toFixed(1)}h`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b6b80',
          font: { family: 'JetBrains Mono', size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b6b80',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (value: string | number) => `${value}h`,
        },
        beginAtZero: true,
      },
    },
  }), [])

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none')
    }
  }, [chartData])

  return (
    <div className="w-full h-full p-4">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
