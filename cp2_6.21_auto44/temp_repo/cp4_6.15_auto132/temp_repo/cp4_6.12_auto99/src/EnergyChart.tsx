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
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { HistoryPoint } from './store'

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

interface ChartProps {
  history: HistoryPoint[]
}

const chartOptionsBase = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#ddd',
        font: { size: 10 },
        boxWidth: 12,
        padding: 8
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#fff',
      bodyColor: '#ddd',
      titleFont: { size: 11 },
      bodyFont: { size: 10 }
    }
  },
  scales: {
    x: {
      type: 'linear' as const,
      display: true,
      title: {
        display: true,
        text: '时间 (s)',
        color: '#888',
        font: { size: 10 }
      },
      ticks: {
        color: '#888',
        font: { size: 10 },
        maxTicksLimit: 6
      },
      grid: {
        color: 'rgba(255,255,255,0.08)',
        drawBorder: false
      }
    },
    y: {
      display: true,
      ticks: {
        color: '#888',
        font: { size: 10 }
      },
      grid: {
        color: 'rgba(255,255,255,0.08)',
        drawBorder: false
      }
    }
  }
}

function DisplacementChart({ history }: ChartProps) {
  const timeWindowStart = history.length > 0
    ? Math.max(0, history[history.length - 1].time - 10)
    : 0

  const data = {
    datasets: [
      {
        label: '位移',
        data: history.map((p) => ({ x: p.time, y: p.position })),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        fill: false
      }
    ]
  }

  const options = {
    ...chartOptionsBase,
    scales: {
      ...chartOptionsBase.scales,
      x: {
        ...chartOptionsBase.scales.x,
        min: timeWindowStart,
        max: timeWindowStart + 10,
        title: {
          ...chartOptionsBase.scales.x.title,
          text: '时间 (s)'
        }
      },
      y: {
        ...chartOptionsBase.scales.y,
        min: -2,
        max: 2,
        title: {
          display: true,
          text: '位移 (m)',
          color: '#888',
          font: { size: 10 }
        }
      }
    }
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-title">位移-时间曲线</div>
      <div className="chart-canvas-container">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

function EnergyChartPanel({ history }: ChartProps) {
  const timeWindowStart = history.length > 0
    ? Math.max(0, history[history.length - 1].time - 10)
    : 0

  const data = {
    datasets: [
      {
        label: '动能',
        data: history.map((p) => ({ x: p.time, y: p.kineticEnergy })),
        borderColor: '#00bcd4',
        backgroundColor: 'rgba(0, 188, 212, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.25,
        fill: false
      },
      {
        label: '势能',
        data: history.map((p) => ({ x: p.time, y: p.potentialEnergy })),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.25,
        fill: false
      },
      {
        label: '总能量',
        data: history.map((p) => ({ x: p.time, y: p.totalEnergy })),
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.25,
        fill: false
      }
    ]
  }

  const options = {
    ...chartOptionsBase,
    scales: {
      ...chartOptionsBase.scales,
      x: {
        ...chartOptionsBase.scales.x,
        min: timeWindowStart,
        max: timeWindowStart + 10,
        title: {
          ...chartOptionsBase.scales.x.title,
          text: '时间 (s)'
        }
      },
      y: {
        ...chartOptionsBase.scales.y,
        title: {
          display: true,
          text: '能量 (J)',
          color: '#888',
          font: { size: 10 }
        }
      }
    }
  }

  return (
    <div className="chart-wrapper">
      <div className="chart-title">能量-时间曲线</div>
      <div className="chart-canvas-container">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

export default function EnergyChart({ history }: ChartProps) {
  return (
    <div className="energy-chart-panel">
      <h2 className="panel-title">数据可视化</h2>
      <div className="charts-container">
        <DisplacementChart history={history} />
        <EnergyChartPanel history={history} />
      </div>
    </div>
  )
}
