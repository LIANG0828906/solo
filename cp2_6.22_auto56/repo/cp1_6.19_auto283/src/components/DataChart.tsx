import { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useCoralStore } from '../store/coralStore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export function DataChart() {
  const { historyData, reset, elapsedTime } = useCoralStore()
  const chartRef = useRef<ChartJS<'line'>>(null)

  const maxDataPoints = 24

  const labels = historyData.slice(-maxDataPoints).map((_, i) => {
    const timeAgo = (historyData.length - 1 - i) * 5
    return `-${timeAgo}s`
  }).reverse()

  const areaData = historyData.slice(-maxDataPoints).map((d) => d.totalArea)
  const saturationData = historyData.slice(-maxDataPoints).map((d) => d.colorSaturation * 100)

  const data = {
    labels: labels.length > 0 ? labels : ['-0s', '-5s', '-10s', '-15s', '-20s'],
    datasets: [
      {
        label: '总面积',
        data: areaData.length > 0 ? areaData : [0, 0, 0, 0, 0],
        borderColor: '#E67E22',
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#E67E22',
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: '色彩饱和度',
        data: saturationData.length > 0 ? saturationData : [0, 0, 0, 0, 0],
        borderColor: '#1ABC9C',
        backgroundColor: 'rgba(26, 188, 156, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#1ABC9C',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 10
          },
          padding: 8,
          usePointStyle: true,
          pointStyle: 'line'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 25, 35, 0.9)',
        titleColor: '#ECF0F1',
        bodyColor: '#BDC3C7',
        borderColor: 'rgba(52, 152, 219, 0.5)',
        borderWidth: 1,
        padding: 8,
        displayColors: true,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y
            const label = context.dataset.label || ''
            const unit = label === '总面积' ? ' m²' : '%'
            return `${label}: ${value.toFixed(2)}${unit}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 9
          },
          maxRotation: 0
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: undefined,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#E67E22',
          font: {
            size: 9
          },
          callback: (value: number | string) => `${Number(value).toFixed(1)}`
        },
        title: {
          display: true,
          text: '面积 (m²)',
          color: '#E67E22',
          font: {
            size: 9
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#1ABC9C',
          font: {
            size: 9
          },
          callback: (value: number | string) => `${Number(value).toFixed(0)}%`
        },
        title: {
          display: true,
          text: '饱和度 (%)',
          color: '#1ABC9C',
          font: {
            size: 9
          }
        }
      }
    }
  }

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none')
    }
  }, [historyData])

  const handleReset = () => {
    reset()
  }

  return (
    <div style={{
      position: 'fixed',
      left: '24px',
      bottom: '24px',
      width: '320px',
      height: '160px',
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(52, 152, 219, 0.3)',
      borderRadius: '12px',
      padding: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(52, 152, 219, 0.1)',
      zIndex: 100
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
        <button
          onClick={handleReset}
          title="重置数据和参数"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#E74C3C',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.85,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.filter = 'brightness(0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.85'
            e.currentTarget.style.filter = 'brightness(1)'
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '10px',
          fontWeight: 500
        }}>
          运行时间: {Math.floor(elapsedTime)}s
        </div>

        <div style={{
          width: '100%',
          height: '100%',
          paddingTop: '16px'
        }}>
          <Line ref={chartRef} data={data} options={options} />
        </div>
      </div>
    </div>
  )
}
