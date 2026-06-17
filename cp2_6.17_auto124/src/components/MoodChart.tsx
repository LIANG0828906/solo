import React, { useEffect, useRef, useState } from 'react'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDiaryApi } from '../hooks/useDiaryApi'
import { DiaryEntry } from '../types'

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

export const MoodChart: React.FC = () => {
  const { listDiaryByMonth } = useDiaryApi()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [tagFrequency, setTagFrequency] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    loadMonthData()
  }, [year, month])

  const loadMonthData = async () => {
    const data = await listDiaryByMonth(year, month)
    setDiaries(data)
    calculateTagFrequency(data)
  }

  const calculateTagFrequency = (entries: DiaryEntry[]) => {
    const freq = new Map<string, number>()
    for (const entry of entries) {
      for (const tag of entry.tags) {
        freq.set(tag, (freq.get(tag) || 0) + 1)
      }
    }
    setTagFrequency(freq)
  }

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const getDaysInMonth = (y: number, m: number): number => {
    return new Date(y, m, 0).getDate()
  }

  const buildChartData = () => {
    const daysInMonth = getDaysInMonth(year, month)
    const labels: string[] = []
    const scores: (number | null)[] = []
    const diaryMap = new Map(diaries.map(d => [d.date, d]))

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      labels.push(`${day}日`)
      const diary = diaryMap.get(dateStr)
      scores.push(diary ? diary.score : null)
    }

    return { labels, scores }
  }

  const { labels, scores } = buildChartData()

  const getPointColor = (value: number | null): string => {
    if (value === null) return 'transparent'
    if (value > 0) return '#4ECDC4'
    if (value < 0) return '#FF6B6B'
    return '#A9A9A9'
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: '情感分数',
        data: scores,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: scores.map(s => getPointColor(s)),
        pointBorderColor: scores.map(s => getPointColor(s)),
        pointHoverRadius: 8,
        tension: 0.3,
        fill: true,
        spanGaps: false,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1E1E2E',
        titleColor: '#E0E0E0',
        bodyColor: '#D0D0D0',
        borderColor: '#3A3A5C',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: any[]) => {
            return `${year}年${month}月${items[0].label}`
          },
          label: (item: any) => {
            if (item.raw === null) return '无记录'
            return `情感分数: ${item.raw > 0 ? '+' : ''}${item.raw}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9999AA',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        min: -3.5,
        max: 3.5,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9999AA',
          stepSize: 1,
          callback: (value: number | string) => {
            const num = typeof value === 'string' ? parseFloat(value) : value
            if (num > 0) return `+${num}`
            return num
          },
        },
      },
    },
  }

  const keyEvents = diaries.filter(d => Math.abs(d.score) >= 2)

  const sortedTags = Array.from(tagFrequency.entries()).sort((a, b) => b[1] - a[1])
  const maxFreq = sortedTags.length > 0 ? sortedTags[0][1] : 1

  const getTagFontSize = (freq: number): number => {
    const minSize = 14
    const maxSize = 32
    if (maxFreq === 1) return 20
    return minSize + ((freq / maxFreq) * (maxSize - minSize))
  }

  return (
    <div className="mood-chart-container">
      <div className="chart-header">
        <button className="chart-nav-btn" onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h3 className="chart-title">{year}年{month}月 情感趋势</h3>
        <button className="chart-nav-btn" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="chart-wrapper">
        <Line data={chartData} options={chartOptions as any} />
      </div>

      {keyEvents.length > 0 && (
        <div className="key-events">
          <h4 className="section-title">关键事件</h4>
          <div className="key-events-list">
            {keyEvents.map(diary => (
              <div key={diary.id} className={`key-event-card ${diary.score > 0 ? 'positive' : 'negative'}`}>
                <div className="key-event-date">
                  {month}月{parseInt(diary.date.split('-')[2])}日
                  <span className="key-event-score">
                    {diary.score > 0 ? '+' : ''}{diary.score}分
                  </span>
                </div>
                <div className="key-event-content">
                  {diary.content.slice(0, 60)}...
                </div>
                <div className="key-event-tags">
                  {diary.tags.map(tag => (
                    <span key={tag} className="key-event-tag">#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedTags.length > 0 && (
        <div className="tag-cloud">
          <h4 className="section-title">本月标签词云</h4>
          <div className="tag-cloud-container">
            {sortedTags.map(([tag, freq]) => (
              <span
                key={tag}
                className="tag-cloud-item"
                style={{ fontSize: `${getTagFontSize(freq)}px` }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {diaries.length === 0 && (
        <div className="empty-state">
          <p>本月暂无日记记录</p>
          <p className="empty-state-sub">开始写日记，记录你的心情变化吧</p>
        </div>
      )}
    </div>
  )
}
