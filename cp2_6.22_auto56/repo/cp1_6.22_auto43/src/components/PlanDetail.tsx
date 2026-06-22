import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import MapView from './MapView'
import type { TravelPlan, TravelSpot, LibrarySpot } from '../types'
import { cityCenterCoords } from '../data/seed'

interface PlanDetailProps {
  travel: TravelPlan
  librarySpots: LibrarySpot[]
  onUpdateTravel: (travel: TravelPlan) => void
}

function PlanDetail({ travel, librarySpots, onUpdateTravel }: PlanDetailProps) {
  const [currentDay, setCurrentDay] = useState(1)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSpotForm, setShowSpotForm] = useState(false)
  const [editingSpot, setEditingSpot] = useState<TravelSpot | null>(null)
  const [reportLines, setReportLines] = useState<string[]>([])
  const [draggedSpot, setDraggedSpot] = useState<TravelSpot | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [budgetShakeKey, setBudgetShakeKey] = useState(0)
  const daySpotsRef = useRef<HTMLDivElement>(null)

  const citySpots = useMemo(
    () => librarySpots.filter((s) => s.city === travel.city),
    [librarySpots, travel.city],
  )

  const daySpots = useMemo(() => {
    return travel.spots
      .filter((s) => s.day === currentDay)
      .sort((a, b) => {
        const aIndex = travel.spots.findIndex((s) => s.id === a.id)
        const bIndex = travel.spots.findIndex((s) => s.id === b.id)
        return aIndex - bIndex
      })
  }, [travel.spots, currentDay])

  const totalCost = useMemo(
    () => travel.spots.reduce((sum, spot) => sum + spot.cost, 0),
    [travel.spots],
  )

  const remainingBudget = travel.budget - totalCost
  const budgetPercentage = travel.budget > 0 ? (totalCost / travel.budget) * 100 : 0

  useEffect(() => {
    if (remainingBudget < travel.budget * 0.2 && travel.budget > 0) {
      setBudgetShakeKey((prev) => prev + 1)
    }
  }, [remainingBudget, travel.budget])

  const mapCenter = cityCenterCoords[travel.city] || [39.9042, 116.4074]

  const handleAddLibrarySpot = useCallback(
    async (librarySpot: LibrarySpot) => {
      const newSpotData = {
        day: currentDay,
        name: librarySpot.name,
        lat: librarySpot.lat,
        lng: librarySpot.lng,
        cost: 0,
        category: '景点',
        description: librarySpot.description,
      }

      try {
        const res = await fetch(`/api/travels/${travel.id}/spots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSpotData),
        })
        const newSpot: TravelSpot = await res.json()
        const updatedTravel = {
          ...travel,
          spots: [...travel.spots, newSpot],
        }
        onUpdateTravel(updatedTravel)
      } catch (error) {
        console.error('添加景点失败:', error)
      }
    },
    [travel, currentDay, onUpdateTravel],
  )

  const handleDeleteSpot = useCallback(
    async (spotId: string) => {
      if (!confirm('确定删除这个景点吗？')) return
      try {
        await fetch(`/api/travels/${travel.id}/spots/${spotId}`, {
          method: 'DELETE',
        })
        const updatedTravel = {
          ...travel,
          spots: travel.spots.filter((s) => s.id !== spotId),
        }
        onUpdateTravel(updatedTravel)
      } catch (error) {
        console.error('删除景点失败:', error)
      }
    },
    [travel, onUpdateTravel],
  )

  const handleUpdateSpot = useCallback(
    async (spotId: string, updates: Partial<TravelSpot>) => {
      try {
        const res = await fetch(`/api/travels/${travel.id}/spots/${spotId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const updatedSpot: TravelSpot = await res.json()
        const updatedTravel = {
          ...travel,
          spots: travel.spots.map((s) => (s.id === spotId ? updatedSpot : s)),
        }
        onUpdateTravel(updatedTravel)
      } catch (error) {
        console.error('更新景点失败:', error)
      }
    },
    [travel, onUpdateTravel],
  )

  const handleDragStart = (e: React.DragEvent, spot: TravelSpot) => {
    setDraggedSpot(spot)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = useCallback(
    async (targetIndex: number) => {
      if (!draggedSpot || dragOverIndex === null) return

      const currentIndex = daySpots.findIndex((s) => s.id === draggedSpot.id)
      if (currentIndex === targetIndex) {
        setDraggedSpot(null)
        setDragOverIndex(null)
        return
      }

      const newSpots = [...daySpots]
      const [removed] = newSpots.splice(currentIndex, 1)
      newSpots.splice(targetIndex, 0, removed)

      const newSpotIds = newSpots.map((s) => s.id)

      const otherSpots = travel.spots.filter((s) => s.day !== currentDay)
      const reorderedDaySpots = newSpotIds
        .map((id) => daySpots.find((s) => s.id === id))
        .filter(Boolean) as TravelSpot[]

      const updatedTravel = {
        ...travel,
        spots: [...otherSpots, ...reorderedDaySpots],
      }
      onUpdateTravel(updatedTravel)

      try {
        await fetch(`/api/travels/${travel.id}/spots/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day: currentDay, spotIds: newSpotIds }),
        })
      } catch (error) {
        console.error('排序失败:', error)
      }

      setDraggedSpot(null)
      setDragOverIndex(null)
    },
    [draggedSpot, dragOverIndex, daySpots, travel, currentDay, onUpdateTravel],
  )

  const handleDragEnd = () => {
    setDraggedSpot(null)
    setDragOverIndex(null)
  }

  const handleLibraryDragStart = (e: React.DragEvent, spot: LibrarySpot) => {
    e.dataTransfer.setData('librarySpotId', spot.id)
  }

  const handleSpotsListDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const librarySpotId = e.dataTransfer.getData('librarySpotId')
      if (librarySpotId) {
        const librarySpot = librarySpots.find((s) => s.id === librarySpotId)
        if (librarySpot) {
          handleAddLibrarySpot(librarySpot)
        }
      }
      setDragOverIndex(null)
    },
    [librarySpots, handleAddLibrarySpot],
  )

  const handleSpotsListDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (daySpots.length === 0) {
      setDragOverIndex(0)
    }
  }

  const generateReport = () => {
    const lines: string[] = []
    lines.push(`=== ${travel.city}旅行行程报告 ===`)
    lines.push(`出发日期: ${travel.startDate}`)
    lines.push(`行程天数: ${travel.days} 天`)
    lines.push('')

    for (let day = 1; day <= travel.days; day++) {
      const daySpotsList = travel.spots.filter((s) => s.day === day)
      lines.push(`--- 第 ${day} 天 ---`)
      if (daySpotsList.length === 0) {
        lines.push('  (暂无安排)')
      } else {
        daySpotsList.forEach((spot, idx) => {
          lines.push(`  ${idx + 1}. ${spot.name}`)
          lines.push(`     ${spot.description}`)
          lines.push(`     花费: ¥${spot.cost}`)
        })
        const dayCost = daySpotsList.reduce((sum, s) => sum + s.cost, 0)
        lines.push(`     当日花费: ¥${dayCost}`)
      }
      lines.push('')
    }

    lines.push('--- 预算汇总 ---')
    lines.push(`总预算: ¥${travel.budget}`)
    lines.push(`总花费: ¥${totalCost}`)
    lines.push(`剩余预算: ¥${remainingBudget}`)
    lines.push(`使用比例: ${budgetPercentage.toFixed(1)}%`)
    lines.push('')
    lines.push(`共 ${travel.spots.length} 个景点`)

    return lines
  }

  const handleExport = () => {
    setShowExportModal(true)
    setReportLines([])
    const lines = generateReport()
    lines.forEach((_, index) => {
      setTimeout(() => {
        setReportLines((prev) => [...prev, lines[index]])
      }, index * 80)
    })
  }

  const getBudgetBarClass = () => {
    if (budgetPercentage >= 80) return 'danger'
    if (budgetPercentage >= 50) return 'warning'
    return ''
  }

  const getBudgetTextClass = () => {
    if (remainingBudget < travel.budget * 0.2) return 'danger'
    if (remainingBudget > travel.budget * 0.5) return 'success'
    return 'warning'
  }

  const dayNumbers = Array.from({ length: travel.days }, (_, i) => i + 1)

  const [spotFormData, setSpotFormData] = useState({
    name: '',
    cost: 0,
    category: '景点',
    description: '',
  })

  const openAddSpotForm = () => {
    setEditingSpot(null)
    setSpotFormData({ name: '', cost: 0, category: '景点', description: '' })
    setShowSpotForm(true)
  }

  const openEditSpotForm = (spot: TravelSpot) => {
    setEditingSpot(spot)
    setSpotFormData({
      name: spot.name,
      cost: spot.cost,
      category: spot.category,
      description: spot.description,
    })
    setShowSpotForm(true)
  }

  const handleSpotFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSpot) {
      await handleUpdateSpot(editingSpot.id, spotFormData)
    }
    setShowSpotForm(false)
    setEditingSpot(null)
  }

  return (
    <div className="plan-detail">
      <div className="map-container">
        <MapView spots={daySpots} center={mapCenter} zoom={12} />

        <div className="library-panel">
          <div className="library-header">📍 景点库 (拖拽添加)</div>
          <div className="library-list">
            {citySpots.length === 0 ? (
              <p style={{ padding: '12px', color: '#999', fontSize: '12px' }}>
                该城市暂无内置景点
              </p>
            ) : (
              citySpots.map((spot) => (
                <div
                  key={spot.id}
                  className="library-item"
                  draggable
                  onDragStart={(e) => handleLibraryDragStart(e, spot)}
                  onClick={() => handleAddLibrarySpot(spot)}
                >
                  <span className="library-item-icon">🏛️</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{spot.name}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      {spot.description.substring(0, 15)}...
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button className="btn btn-primary export-btn" onClick={handleExport}>
          📄 导出报告
        </button>

        <div className="map-info">
          <strong>第 {currentDay} 天</strong> · {daySpots.length} 个景点 · 已安排
        </div>

        <button
          className="toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
        >
          {sidebarCollapsed ? '◀' : '▶'}
        </button>
      </div>

      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>
            {travel.icon} {travel.city}
          </h2>
          <button className="btn btn-small btn-secondary" onClick={openAddSpotForm}>
            + 自定义
          </button>
        </div>

        <div className="day-tabs">
          {dayNumbers.map((day) => (
            <button
              key={day}
              className={`day-tab ${day === currentDay ? 'active' : ''}`}
              onClick={() => setCurrentDay(day)}
            >
              第 {day} 天
            </button>
          ))}
        </div>

        <div
          className="spots-list"
          ref={daySpotsRef}
          onDrop={handleSpotsListDrop}
          onDragOver={handleSpotsListDragOver}
        >
          {showSpotForm && (
            <div className="spot-form">
              <form onSubmit={handleSpotFormSubmit}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px' }}>景点名称</label>
                  <input
                    type="text"
                    value={spotFormData.name}
                    onChange={(e) =>
                      setSpotFormData({ ...spotFormData, name: e.target.value })
                    }
                    placeholder="输入景点名称"
                    required
                  />
                </div>
                <div className="spot-form-row">
                  <div>
                    <label style={{ fontSize: '12px' }}>花费 (¥)</label>
                    <input
                      type="number"
                      min="0"
                      value={spotFormData.cost}
                      onChange={(e) =>
                        setSpotFormData({
                          ...spotFormData,
                          cost: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px' }}>类别</label>
                    <select
                      value={spotFormData.category}
                      onChange={(e) =>
                        setSpotFormData({ ...spotFormData, category: e.target.value })
                      }
                    >
                      <option value="景点">景点</option>
                      <option value="交通">交通</option>
                      <option value="餐饮">餐饮</option>
                      <option value="住宿">住宿</option>
                      <option value="购物">购物</option>
                      <option value="门票">门票</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>
                <div className="spot-form-actions">
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={() => setShowSpotForm(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-small btn-primary">
                    {editingSpot ? '保存' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {daySpots.length === 0 ? (
            <div className="spot-empty">
              <div className="spot-empty-icon">🗺️</div>
              <p>从左侧景点库拖拽添加景点</p>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>
                或点击右上角"自定义"添加
              </p>
            </div>
          ) : (
            daySpots.map((spot, index) => (
              <div key={spot.id}>
                {dragOverIndex === index && draggedSpot?.id !== spot.id && (
                  <div className="spot-card-placeholder" />
                )}
                <div
                  className={`spot-card ${draggedSpot?.id === spot.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, spot)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="spot-card-header">
                    <span className="spot-number">{index + 1}</span>
                    <h4>{spot.name}</h4>
                    <div className="spot-card-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditSpotForm(spot)
                        }}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSpot(spot.id)
                        }}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#999' }}>{spot.description}</p>
                  <div className="spot-card-info">
                    <span className="spot-category">{spot.category}</span>
                    <span className="spot-cost">¥{spot.cost}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {dragOverIndex === daySpots.length && daySpots.length > 0 && (
            <div className="spot-card-placeholder" />
          )}
        </div>

        <div className="budget-section">
          <div className="budget-header">
            <span>预算管理</span>
            <strong>¥{totalCost}</strong>
          </div>
          <div className="budget-progress" key={budgetShakeKey}>
            <div
              className={`budget-progress-bar ${getBudgetBarClass()}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <div className="budget-stats">
            <span>总预算: ¥{travel.budget}</span>
            <span className={`remaining ${getBudgetTextClass()}`}>
              剩余: ¥{remainingBudget}
            </span>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowExportModal(false)
            setReportLines([])
          }}
        >
          <div
            className="modal-content export-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">📄 行程报告</div>
            <div className="report-content">
              {reportLines.map((line, index) => (
                <div key={index} className="report-line">
                  {line || '\u00A0'}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowExportModal(false)
                  setReportLines([])
                }}
              >
                关闭
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const text = reportLines.join('\n')
                  navigator.clipboard.writeText(text)
                  alert('已复制到剪贴板！')
                }}
              >
                复制文本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanDetail
