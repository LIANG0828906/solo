import { useState } from 'react'
import { useRecipeStore } from '../RecipeModule/store'
import { createRipple } from '../utils'

export default function ShoppingList() {
  const shoppingList = useRecipeStore((s) => s.shoppingList)
  const toggleShoppingItem = useRecipeStore((s) => s.toggleShoppingItem)
  const removeShoppingItem = useRecipeStore((s) => s.removeShoppingItem)
  const addManualShoppingItem = useRecipeStore((s) => s.addManualShoppingItem)
  const setView = useRecipeStore((s) => s.setView)

  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('1')
  const [newUnit, setNewUnit] = useState('个')

  const handleAdd = (e: React.MouseEvent) => {
    createRipple(e)
    if (!newName.trim()) return
    const amount = parseFloat(newAmount) || 1
    addManualShoppingItem(newName, amount, newUnit)
    setNewName('')
    setNewAmount('1')
    setNewUnit('个')
  }

  const handleBack = (e: React.MouseEvent) => {
    createRipple(e)
    setView('list')
  }

  const checkedCount = shoppingList.filter((i) => i.checked).length
  const totalCount = shoppingList.length

  return (
    <div className="shopping-container">
      <button
        className="back-btn ripple-button"
        onClick={handleBack}
      >
        ← 返回列表
      </button>

      <div className="stats-section" style={{ marginTop: 24 }}>
        <div className="stat-card">
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">食材总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#27ae60' }}>{checkedCount}</div>
          <div className="stat-label">已购买</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ff6b6b' }}>
            {totalCount - checkedCount}
          </div>
          <div className="stat-label">待购买</div>
        </div>
      </div>

      <div className="shopping-panel">
        <h2 className="section-title">🛒 购物清单</h2>

        {shoppingList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <p className="empty-text">购物清单是空的，快去收藏食谱或手动添加吧！</p>
          </div>
        ) : (
          shoppingList.map((item) => (
            <div
              key={item.id}
              className={`shopping-item ${item.checked ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                className="shopping-check"
                checked={item.checked}
                onChange={() => toggleShoppingItem(item.id)}
              />
              <div style={{ flex: 1 }}>
                <div className="shopping-name">
                  {item.manual && <span style={{ color: '#6c63ff', marginRight: 6 }}>[手动]</span>}
                  {item.name}
                </div>
                {item.source && (
                  <div className="shopping-source">来自：{item.source}</div>
                )}
              </div>
              <span className="shopping-amount">
                {item.amount} {item.unit}
              </span>
              <button
                className="shopping-delete ripple-button"
                onClick={(e) => {
                  createRipple(e)
                  removeShoppingItem(item.id)
                }}
                title="删除"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <div className="shopping-add-form">
          <input
            type="text"
            className="shopping-input"
            placeholder="食材名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd(e as unknown as React.MouseEvent)
              }
            }}
          />
          <input
            type="number"
            className="shopping-input shopping-amount-input"
            placeholder="数量"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            min="0"
            step="0.1"
          />
          <input
            type="text"
            className="shopping-input"
            style={{ width: 80 }}
            placeholder="单位"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
          />
          <button
            className="shopping-add-btn ripple-button"
            onClick={handleAdd}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
