import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './Closet.css'

type Category = '上装' | '下装' | '外套' | '鞋' | '配饰'

interface ClothingItem {
  id: string
  imageUrl: string
  category: Category
  color: string
}

const COLOR_PALETTE = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12', '#8B4513',
  '#6C5CE7', '#A8E6CF'
]

const CATEGORIES: Category[] = ['上装', '下装', '外套', '鞋', '配饰']

function Closet() {
  const [clothes, setClothes] = useState<ClothingItem[]>([])
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchClothes()
  }, [])

  const fetchClothes = async () => {
    try {
      const res = await axios.get('/api/clothes')
      setClothes(res.data)
    } catch (err) {
      console.error('获取衣物列表失败', err)
      setClothes([
        { id: '1', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300', category: '上装', color: '#FFFFFF' },
        { id: '2', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300', category: '下装', color: '#45B7D1' },
        { id: '3', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300', category: '外套', color: '#8B4513' },
        { id: '4', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', category: '鞋', color: '#FF6B6B' },
        { id: '5', imageUrl: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=300', category: '配饰', color: '#FFEAA7' },
        { id: '6', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300', category: '上装', color: '#FADCD9' },
      ])
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setUploading(true)
    try {
      const res = await axios.post('/api/clothes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setClothes(prev => [...prev, res.data])
    } catch (err) {
      console.error('上传失败', err)
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        imageUrl: URL.createObjectURL(file),
        category: '上装',
        color: '#FFFFFF'
      }
      setClothes(prev => [...prev, newItem])
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEdit = (item: ClothingItem) => {
    setEditingItem({ ...item })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return
    try {
      await axios.put(`/api/clothes/${editingItem.id}`, editingItem)
      setClothes(prev => prev.map(c => c.id === editingItem.id ? editingItem : c))
    } catch (err) {
      console.error('保存失败', err)
      setClothes(prev => prev.map(c => c.id === editingItem.id ? editingItem : c))
    }
    setShowEditModal(false)
    setEditingItem(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这件衣物吗？')) return
    try {
      await axios.delete(`/api/clothes/${id}`)
      setClothes(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('删除失败', err)
      setClothes(prev => prev.filter(c => c.id !== id))
    }
  }

  return (
    <div className="closet-page">
      <div className="page-header">
        <h1>我的衣橱</h1>
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {uploading ? '上传中...' : '上传衣物'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      <div className="clothes-grid">
        {clothes.map(item => (
          <div
            key={item.id}
            className="clothing-card"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="card-image-wrapper">
              <img src={item.imageUrl} alt="衣物" className="card-image" />
              {hoveredId === item.id && (
                <div className="card-overlay">
                  <button className="action-btn edit-btn" onClick={() => handleEdit(item)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDelete(item.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="card-info">
              <span className="category-tag">{item.category}</span>
              <span className="color-dot" style={{ backgroundColor: item.color }}></span>
            </div>
          </div>
        ))}
      </div>

      {showEditModal && editingItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>编辑衣物</h3>
            
            <div className="form-group">
              <label>分类</label>
              <div className="category-options">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`category-option ${editingItem.category === cat ? 'active' : ''}`}
                    onClick={() => setEditingItem({ ...editingItem, category: cat })}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>颜色</label>
              <div className="color-palette">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color}
                    className={`color-option ${editingItem.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingItem({ ...editingItem, color })}
                  />
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>取消</button>
              <button className="confirm-btn" onClick={handleSaveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Closet
