import { useWorkshopStore, Material, LeatherType } from '../store'
import './InventoryBoard.css'

const leatherTypeLabels: Record<LeatherType, string> = {
  all: '全部',
  vegetable: '植鞣革',
  chrome: '铬鞣革',
  shell: '马臀皮'
}

const leatherTypeColors: Record<Exclude<LeatherType, 'all'>, string> = {
  vegetable: '#8B6914',
  chrome: '#4682B4',
  shell: '#8B4513'
}

function calculateAvailableDays(material: Material): number {
  if (material.dailyConsumption <= 0) return 999
  return Math.floor(material.area / material.dailyConsumption)
}

function getStockLevel(days: number): { level: string; color: string } {
  if (days <= 3) return { level: '紧缺', color: '#e74c3c' }
  if (days <= 7) return { level: '偏低', color: '#e67e22' }
  if (days <= 14) return { level: '正常', color: '#f39c12' }
  return { level: '充足', color: '#27ae60' }
}

function MaterialCard({ material }: { material: Material }) {
  const availableDays = calculateAvailableDays(material)
  const stockInfo = getStockLevel(availableDays)

  const percentage = Math.min(100, (material.area / 30) * 100)

  return (
    <div className="material-card">
      <div className="material-header">
        <div
          className="material-type-dot"
          style={{ backgroundColor: leatherTypeColors[material.type] }}
        />
        <span className="material-name">{material.name}</span>
      </div>

      <div className="material-area">
        <span className="area-value">{material.area.toFixed(1)}</span>
        <span className="area-unit">平方英尺</span>
      </div>

      <div className="area-bar">
        <div
          className="area-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: leatherTypeColors[material.type]
          }}
        />
      </div>

      <div className="material-stats">
        <div className="stat-row">
          <span className="stat-label">可用天数</span>
          <span className="stat-value" style={{ color: stockInfo.color }}>
            {availableDays} 天
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">库存状态</span>
          <span
            className="stock-badge"
            style={{ backgroundColor: stockInfo.color + '20', color: stockInfo.color }}
          >
            {stockInfo.level}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">日消耗量</span>
          <span className="stat-value">{material.dailyConsumption} 平方英尺</span>
        </div>
      </div>

      <div className="material-footer">
        <span className="price-label">单价</span>
        <span className="price-value">¥{material.unitPrice}/平方英尺</span>
      </div>
    </div>
  )
}

function InventoryBoard() {
  const { leatherTypeFilter, setLeatherTypeFilter, getFilteredInventory } = useWorkshopStore()
  const filteredInventory = getFilteredInventory()

  const types: LeatherType[] = ['all', 'vegetable', 'chrome', 'shell']

  const totalArea = filteredInventory.reduce((sum, m) => sum + m.area, 0)
  const totalValue = filteredInventory.reduce((sum, m) => sum + m.area * m.unitPrice, 0)

  return (
    <div className="inventory-board">
      <div className="board-header">
        <h2>余料库存看板</h2>
        <div className="board-summary">
          <span>总面积: <strong>{totalArea.toFixed(1)}</strong> 平方英尺</span>
          <span>总价值: <strong>¥{totalValue.toFixed(0)}</strong></span>
        </div>
      </div>

      <div className="type-filters">
        <div className="type-filters-track">
          {types.map(type => (
            <button
              key={type}
              className={`type-btn ${leatherTypeFilter === type ? 'active' : ''}`}
              onClick={() => setLeatherTypeFilter(type)}
            >
              {leatherTypeLabels[type]}
            </button>
          ))}
          <div
            className="type-btn-slider"
            style={{
              width: `${100 / types.length}%`,
              transform: `translateX(${types.indexOf(leatherTypeFilter) * 100}%)`
            }}
          />
        </div>
      </div>

      <div className="inventory-grid">
        {filteredInventory.length === 0 ? (
          <div className="empty-inventory">
            <p>暂无该类型的皮革库存</p>
          </div>
        ) : (
          filteredInventory.map(material => (
            <MaterialCard key={material.id} material={material} />
          ))
        )}
      </div>
    </div>
  )
}

export default InventoryBoard
