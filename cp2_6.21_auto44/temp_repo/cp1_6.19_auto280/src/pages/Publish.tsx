import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { suggestExpiryDate, DEFAULT_FRESHNESS_DAYS } from '../api/ingredients'

const CATEGORIES = [
  { name: '蔬菜', icon: '🥬' },
  { name: '水果', icon: '🍎' },
  { name: '肉类', icon: '🥩' },
  { name: '调味料', icon: '🧂' },
  { name: '乳制品', icon: '🧀' },
  { name: '根茎类', icon: '🥔' },
]

const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD']

const Publish: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser, addIngredient } = useStore()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('克')
  const [category, setCategory] = useState('蔬菜')
  const [expiryDate, setExpiryDate] = useState(suggestExpiryDate('蔬菜'))
  const [description, setDescription] = useState('')

  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#FFF3E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
          <div style={{ color: '#8D6E63', marginBottom: 16 }}>请先登录再发布食材</div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 32px',
              borderRadius: 20,
              border: 'none',
              background: '#F39C12',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            去登录
          </button>
        </div>
      </div>
    )
  }

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    setExpiryDate(suggestExpiryDate(cat))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !quantity.trim()) return

    const ingredient = {
      id: `ing_${Date.now()}`,
      user_id: currentUser.id,
      name: name.trim(),
      quantity: parseFloat(quantity) || 0,
      unit,
      expiry_date: expiryDate,
      image_url: '',
      category,
      description: description.trim(),
      created_at: new Date().toISOString(),
      distance: 0,
      user: currentUser,
      is_exchanged: false,
    }

    addIngredient(ingredient)
    navigate('/')
  }

  const freshnessDays = DEFAULT_FRESHNESS_DAYS[category] || 7

  return (
    <div style={{ minHeight: '100vh', background: '#FFF3E0', paddingBottom: 80 }}>
      <div
        style={{
          padding: '16px 16px 8px',
          background: 'rgba(255,243,224,0.95)',
          borderBottom: '1px solid #E0C9A6',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3E2723', margin: 0 }}>
          ➕ 发布食材
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
        <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#8D6E63',
                marginBottom: 6,
              }}
            >
              食材名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：小白菜"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E0C9A6',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#3E2723',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#8D6E63',
                  marginBottom: 6,
                }}
              >
                数量 *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="数量"
                min="0"
                step="0.1"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E0C9A6',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#3E2723',
                }}
              />
            </div>
            <div style={{ width: 100 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#8D6E63',
                  marginBottom: 6,
                }}
              >
                单位
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #E0C9A6',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#3E2723',
                }}
              >
                <option value="克">克</option>
                <option value="斤">斤</option>
                <option value="个">个</option>
                <option value="把">把</option>
                <option value="根">根</option>
                <option value="块">块</option>
                <option value="头">头</option>
                <option value="瓶">瓶</option>
                <option value="盒">盒</option>
                <option value="杯">杯</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#8D6E63',
                marginBottom: 8,
              }}
            >
              分类
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryChange(cat.name)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1.5px solid ${category === cat.name ? '#F39C12' : '#E0C9A6'}`,
                    background: category === cat.name ? 'rgba(243,156,18,0.1)' : 'rgba(255,255,255,0.5)',
                    color: category === cat.name ? '#F39C12' : '#8D6E63',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#8D6E63',
                marginBottom: 6,
              }}
            >
              保质期截止日期
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '0.7rem',
                  color: '#F39C12',
                  fontWeight: 500,
                }}
              >
                (建议 {freshnessDays} 天)
              </span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E0C9A6',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#3E2723',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#8D6E63',
                marginBottom: 6,
              }}
            >
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一下食材的情况..."
              rows={3}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #E0C9A6',
                background: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#3E2723',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !quantity.trim()}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background:
              name.trim() && quantity.trim()
                ? 'linear-gradient(135deg, #F39C12, #E67E22)'
                : '#E0C9A6',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: name.trim() && quantity.trim() ? 'pointer' : 'default',
            boxShadow:
              name.trim() && quantity.trim()
                ? '0 4px 12px rgba(243,156,18,0.3)'
                : 'none',
            transition: 'all 0.3s',
          }}
        >
          🎉 发布食材
        </button>
      </form>
    </div>
  )
}

export default Publish
