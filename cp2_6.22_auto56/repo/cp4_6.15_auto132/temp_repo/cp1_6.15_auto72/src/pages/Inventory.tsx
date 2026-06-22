import { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react'

interface Flower {
  id: string
  name: string
  category: string
  image: string
  price: number
  stock: number
  threshold: number
}

function Inventory() {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [dialogFlower, setDialogFlower] = useState<Flower | null>(null)
  const [restockAmount, setRestockAmount] = useState(50)
  const [newThreshold, setNewThreshold] = useState(10)
  const [dialogMode, setDialogMode] = useState<'restock' | 'threshold'>('restock')

  useEffect(() => {
    loadFlowers()
  }, [])

  const loadFlowers = async () => {
    try {
      const res = await axios.get('/api/flowers')
      setFlowers(res.data)
    } catch (err) {
      console.error('加载失败', err)
    }
  }

  const openRestockDialog = (flower: Flower) => {
    setDialogFlower(flower)
    setDialogMode('restock')
    setRestockAmount(50)
  }

  const openThresholdDialog = (flower: Flower) => {
    setDialogFlower(flower)
    setDialogMode('threshold')
    setNewThreshold(flower.threshold)
  }

  const handleRestock = async () => {
    if (!dialogFlower) return
    try {
      const res = await axios.post(`/api/flowers/${dialogFlower.id}/restock`, {
        amount: restockAmount
      })
      setFlowers(prev => prev.map(f => f.id === res.data.id ? res.data : f))
      setDialogFlower(null)
    } catch (err) {
      console.error('补货失败', err)
    }
  }

  const handleUpdateThreshold = async () => {
    if (!dialogFlower) return
    try {
      const res = await axios.patch(`/api/flowers/${dialogFlower.id}`, {
        threshold: newThreshold
      })
      setFlowers(prev => prev.map(f => f.id === res.data.id ? res.data : f))
      setDialogFlower(null)
    } catch (err) {
      console.error('更新失败', err)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">花材库存管理</h1>
      <p className="page-subtitle">监控花材库存，及时补货避免缺货</p>

      <div className="section-header">
        <h2 className="section-title">库存列表</h2>
        <button className="btn btn-secondary" onClick={loadFlowers}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>花材信息</th>
            <th>当前库存</th>
            <th>预警阈值</th>
            <th>状态</th>
            <th style={{ textAlign: 'right' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {flowers.map(f => {
            const isLow = f.stock < f.threshold
            return (
              <tr key={f.id} className={isLow ? 'low-stock' : ''}>
                <td>
                  <div className="stock-flower-cell">
                    <img src={f.image} alt={f.name} className="stock-flower-img" />
                    <div>
                      <div className="stock-flower-name">{f.name}</div>
                      <div className="stock-flower-category">{f.category} · ¥{f.price}/枝</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`stock-number ${isLow ? 'low' : ''}`}>
                    {f.stock} 枝
                  </span>
                </td>
                <td>
                  <span className="stock-number">{f.threshold} 枝</span>
                </td>
                <td>
                  {isLow ? (
                    <span className="tag tag-warning">库存不足</span>
                  ) : (
                    <span className="tag tag-success">库存正常</span>
                  )}
                </td>
                <td>
                  <div className="stock-actions">
                    {isLow && (
                      <div
                        className="warning-icon"
                        onClick={() => openThresholdDialog(f)}
                        title="调整阈值"
                      >
                        <AlertTriangle size={18} />
                      </div>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openRestockDialog(f)}
                    >
                      <Plus size={14} />
                      补货
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {dialogFlower && (
        <div className="restock-dialog" onClick={() => setDialogFlower(null)}>
          <div className="restock-dialog-content" onClick={e => e.stopPropagation()}>
            {dialogMode === 'restock' ? (
              <>
                <h3>补货：{dialogFlower.name}</h3>
                <div style={{ marginBottom: 8, fontSize: 14, color: '#6B6B6B' }}>
                  当前库存：<span style={{ fontWeight: 600, color: '#3D3D3D' }}>{dialogFlower.stock} 枝</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">补货数量</label>
                  <input
                    type="number"
                    className="form-input"
                    value={restockAmount}
                    onChange={e => setRestockAmount(Number(e.target.value))}
                    min={1}
                  />
                  <div style={{ marginTop: 8, fontSize: 13, color: '#9B9B9B' }}>
                    补货后：{dialogFlower.stock + restockAmount} 枝
                  </div>
                </div>
                <div className="restock-actions">
                  <button className="btn btn-secondary" onClick={() => setDialogFlower(null)}>
                    取消
                  </button>
                  <button className="btn btn-primary" onClick={handleRestock}>
                    确认补货
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>调整预警阈值：{dialogFlower.name}</h3>
                <div style={{ marginBottom: 8, fontSize: 14, color: '#6B6B6B' }}>
                  当前阈值：<span style={{ fontWeight: 600, color: '#3D3D3D' }}>{dialogFlower.threshold} 枝</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">新阈值</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newThreshold}
                    onChange={e => setNewThreshold(Number(e.target.value))}
                    min={1}
                  />
                  <div style={{ marginTop: 8, fontSize: 13, color: '#FF9800' }}>
                    低于此数量将触发预警
                  </div>
                </div>
                <div className="restock-actions">
                  <button className="btn btn-secondary" onClick={() => setDialogFlower(null)}>
                    取消
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateThreshold}>
                    确认调整
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
