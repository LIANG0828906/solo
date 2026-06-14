import { useState, useEffect, useMemo } from 'react'
import api from '../../utils/api'
import type { SkillMatrixEntry, SkillScore } from '../../utils/types'
import { SKILL_LABELS } from '../../utils/types'

const SKILL_KEYS: (keyof SkillScore)[] = [
  'coding', 'architecture', 'projectManagement',
  'teamCollaboration', 'productThinking', 'businessUnderstanding'
]

function scoreToColor(score: number): string {
  if (score >= 80) return 'linear-gradient(135deg, #11998e, #38ef7d)'
  if (score >= 65) return 'linear-gradient(135deg, #4facfe, #00f2fe)'
  if (score >= 50) return 'linear-gradient(135deg, #f093fb, #f5576c)'
  if (score >= 35) return 'linear-gradient(135deg, #f5af19, #f12711)'
  return 'linear-gradient(135deg, #eb3349, #f45c43)'
}

export default function TeamHeatmap() {
  const [matrixData, setMatrixData] = useState<SkillMatrixEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState('all')
  const [sortKey, setSortKey] = useState<keyof SkillScore | 'name'>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await api.get('/skill-matrix') as any
      setMatrixData(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const teams = useMemo(() => {
    const set = new Set(matrixData.map(d => d.employee.team))
    return Array.from(set)
  }, [matrixData])

  const filtered = useMemo(() => {
    let data = teamFilter === 'all'
      ? matrixData
      : matrixData.filter(d => d.employee.team === teamFilter)

    data = [...data].sort((a, b) => {
      if (sortKey === 'name') {
        return sortAsc
          ? a.employee.name.localeCompare(b.employee.name)
          : b.employee.name.localeCompare(a.employee.name)
      }
      const va = a.skills[sortKey]
      const vb = b.skills[sortKey]
      return sortAsc ? va - vb : vb - va
    })

    return data
  }, [matrixData, teamFilter, sortKey, sortAsc])

  const handleSort = (key: keyof SkillScore | 'name') => {
    if (sortKey === key) {
      setSortAsc(prev => !prev)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
    setAnimKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="empty-state">
        <i className="fa fa-spinner fa-spin" />
        <p className="empty-state-text">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><i className="fa fa-fire" /> 团队能力热力图</h1>
      </div>

      <div className="glass-card heatmap-container">
        <div className="heatmap-controls">
          <select
            className="heatmap-select"
            value={teamFilter}
            onChange={e => { setTeamFilter(e.target.value); setAnimKey(prev => prev + 1) }}
          >
            <option value="all">全部团队</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #11998e, #38ef7d)' }} /> 强
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #f093fb, #f5576c)' }} /> 中
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #eb3349, #f45c43)' }} /> 弱
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <i className="fa fa-bar-chart" />
            <p className="empty-state-text">暂无能力数据，请先完成课程测验</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="heatmap-table" key={animKey}>
              <thead>
                <tr>
                  <th
                    className="sortable-header"
                    style={{ cursor: 'pointer', textAlign: 'left', minWidth: 120 }}
                    onClick={() => handleSort('name')}
                  >
                    员工 {sortKey === 'name' && (sortAsc ? '↑' : '↓')}
                  </th>
                  {SKILL_KEYS.map(key => (
                    <th
                      key={key}
                      className="sortable-header"
                      style={{ cursor: 'pointer', minWidth: 90 }}
                      onClick={() => handleSort(key)}
                    >
                      {SKILL_LABELS[key]} {sortKey === key && (sortAsc ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => (
                  <tr key={entry.employee.id} style={{ animation: `fadeInUp 0.3s ease ${idx * 0.05}s both` }}>
                    <td className="employee-cell">
                      <span style={{ fontSize: 20 }}>{entry.employee.avatar}</span>
                      <span>{entry.employee.name}</span>
                    </td>
                    {SKILL_KEYS.map(key => {
                      const score = entry.skills[key]
                      return (
                        <td key={key}>
                          <div
                            className="heatmap-cell"
                            data-tooltip={`${entry.employee.name} - ${SKILL_LABELS[key]}: ${score}分`}
                            style={{
                              background: scoreToColor(score),
                              borderRadius: 8,
                              padding: '10px 8px',
                              minWidth: 70,
                              fontSize: 14,
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                          >
                            {score}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
