import { useState, useEffect, useRef } from 'react'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'
import { Radar } from 'react-chartjs-2'
import api from '../../utils/api'
import type { Employee, SkillScore } from '../../utils/types'
import { SKILL_LABELS, SKILL_RECOMMENDATIONS } from '../../utils/types'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Props {
  employee: Employee
}

const SKILL_KEYS: (keyof SkillScore)[] = [
  'coding', 'architecture', 'projectManagement',
  'teamCollaboration', 'productThinking', 'businessUnderstanding'
]

export default function SkillRadar({ employee }: Props) {
  const [skills, setSkills] = useState<SkillScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const data = await api.get(`/skill-matrix/${employee.id}`) as any
      setSkills(data.skills || {
        coding: 50, architecture: 50, projectManagement: 50,
        teamCollaboration: 50, productThinking: 50, businessUnderstanding: 50
      })
    } catch (e) {
      console.error(e)
      setSkills({
        coding: 50, architecture: 50, projectManagement: 50,
        teamCollaboration: 50, productThinking: 50, businessUnderstanding: 50
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <i className="fa fa-spinner fa-spin" />
        <p className="empty-state-text">加载能力数据中...</p>
      </div>
    )
  }

  if (!skills) return null

  const labels = SKILL_KEYS.map(k => SKILL_LABELS[k])
  const dataValues = SKILL_KEYS.map(k => skills[k])

  const chartData = {
    labels,
    datasets: [{
      label: `${employee.name} - 能力评估`,
      data: dataValues,
      backgroundColor: (ctx: any) => {
        const chart = ctx.chart
        const { ctx: canvasCtx, chartArea } = chart
        if (!chartArea) return 'rgba(102, 126, 234, 0.2)'
        const gradient = canvasCtx.createRadialGradient(
          chartArea.width / 2, chartArea.height / 2, 0,
          chartArea.width / 2, chartArea.height / 2, chartArea.width / 2
        )
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.5)')
        gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.3)')
        gradient.addColorStop(1, 'rgba(240, 147, 251, 0.15)')
        return gradient
      },
      borderColor: 'rgba(102, 126, 234, 0.8)',
      borderWidth: 2,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 10,
      pointHoverBackgroundColor: '#764ba2',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3,
      fill: true
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: { size: 11 },
          backdropColor: 'transparent'
        },
        pointLabels: {
          font: { size: 14, weight: 'bold' as const },
          color: '#1a1a2e'
        },
        grid: {
          color: 'rgba(102, 126, 234, 0.1)'
        },
        angleLines: {
          color: 'rgba(102, 126, 234, 0.15)'
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items: any) => items[0]?.label || '',
          label: (item: any) => {
            const skillKey = SKILL_KEYS[item.dataIndex]
            const score = item.raw
            return `得分: ${score}分`
          },
          afterLabel: (item: any) => {
            const skillKey = SKILL_KEYS[item.dataIndex]
            const recs = SKILL_RECOMMENDATIONS[skillKey]
            if (recs && recs.length > 0) {
              return `推荐: ${recs[0].name}`
            }
            return ''
          }
        }
      }
    },
    onHover: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        setHoveredSkill(SKILL_KEYS[elements[0].index])
      } else {
        setHoveredSkill(null)
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><i className="fa fa-chart-area" /> 个人能力雷达图</h1>
      </div>

      <div className="radar-container">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{employee.avatar}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{employee.name}</h2>
          <p style={{ color: '#666', fontSize: 14 }}>{employee.team}</p>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div className="radar-chart-wrapper">
            <Radar ref={chartRef} data={chartData} options={chartOptions as any} />
          </div>
        </div>

        <div className="glass-card radar-info-card">
          <div className="radar-info-title">
            <i className="fa fa-bar-chart" /> 能力详情
          </div>
          <div className="radar-skills-grid">
            {SKILL_KEYS.map(key => {
              const score = skills[key]
              const isHovered = hoveredSkill === key
              const recs = SKILL_RECOMMENDATIONS[key]
              return (
                <div
                  key={key}
                  className="radar-skill-item"
                  style={{
                    background: isHovered ? 'rgba(102,126,234,0.15)' : 'rgba(102,126,234,0.08)',
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className="radar-skill-name">{SKILL_LABELS[key]}</span>
                    <span className="radar-skill-score" style={{
                      color: score >= 70 ? '#11998e' : score >= 50 ? '#667eea' : '#eb3349'
                    }}>
                      {score}分
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${score}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: score >= 70 ? 'linear-gradient(90deg, #11998e, #38ef7d)'
                        : score >= 50 ? 'linear-gradient(90deg, #667eea, #764ba2)'
                        : 'linear-gradient(90deg, #eb3349, #f45c43)',
                      transition: 'width 1s cubic-bezier(0.4,0,0.2,1)'
                    }} />
                  </div>
                  {recs && recs.length > 0 && (
                    <div style={{ fontSize: 11, color: '#667eea', marginTop: 2 }}>
                      <i className="fa fa-external-link" style={{ fontSize: 10 }} /> 推荐: {recs[0].name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
