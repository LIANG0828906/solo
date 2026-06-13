import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './Closet.css'
import type { Clothing, Category } from '../shared/types'
import { CATEGORY_LABELS, LABEL_TO_CATEGORY, COLOR_PALETTE } from '../shared/types'

interface UploadFormData {
  name: string
  category: Category
  color: string
  file: File | null
}

function Closet() {
  const [clothes, setClothes] = useState<Clothing[]>([])
  const [editingItem, setEditingItem] = useState<Clothing | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    name: '',
    category: 'top',
    color: COLOR_PALETTE[0],
    file: null,
  })

  useEffect(() => {
    fetchClothes()
  }, [])

  const fetchClothes = async () => {
    try {
      setError(null)
      const res = await axios.get<Clothing[]>('/api/clothing')
      setClothes(res.data)
    } catch (err) {
      console.error('获取衣物列表失败', err)
      const message = err instanceof Error ? err.message : '获取衣物列表失败，请刷新重试'
      setError(message)
      setClothes([])
    }
  }

  const handleUploadClick = () => {
    setUploadForm({
      name: '',
      category: 'top',
      color: COLOR_PALETTE[0],
      file: null,
    })
    setShowUploadModal(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, file }))
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleUploadSubmit = async () => {
    if (!uploadForm.name.trim()) {
      setError('请输入衣物名称')
      return
    }
    if (!uploadForm.file) {
      setError('请选择图片文件')
      return
    }

    const formData = new FormData()
    formData.append('image', uploadForm.file)
    formData.append('name', uploadForm.name.trim())
    formData.append('category', uploadForm.category)
    formData.append('color', uploadForm.color)

    setUploading(true)
    setError(null)
    try {
      const res = await axios.post<Clothing>('/api/clothing', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setClothes(prev => [res.data, ...prev])
      setShowUploadModal(false)
    } catch (err) {
      console.error('上传失败', err)
      let message = '上传失败，请重试'
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEdit = (item: Clothing) => {
    setEditingItem({ ...item })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return
    if (!editingItem.name.trim()) {
      setError('请输入衣物名称')
      return
    }
    setError(null)
    try {
      const res = await axios.put<Clothing>(`/api/clothing/${editingItem.id}`, {
        name: editingItem.name.trim(),
        category: editingItem.category,
        color: editingItem.color,
      })
      setClothes(prev => prev.map(c => c.id === editingItem.id ? res.data : c))
      setShowEditModal(false)
      setEditingItem(null)
    } catch (err) {
      console.error('保存失败', err)
      let message = '保存失败，请重试'
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这件衣物吗？')) return
    try {
      setError(null)
      await axios.delete(`/api/clothing/${id}`)
      setClothes(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('删除失败', err)
      let message = '删除失败，请重试'
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    }
  }

  const categoryList: Category[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory']

  return (
    <div className="closet-page">
      <div className="page-header">
        <h1>我的衣橱</h1>
        <button
          className="upload-btn"
          onClick={handleUploadClick}
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
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="clothes-grid">
        {clothes.map(item => (
          <div
            key={item.id}
            className="clothing-card"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="card-image-wrapper">
              <img src={item.imageUrl} alt={item.name} className="card-image" />
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
              <div className="card-text-info">
                <span className="clothing-name">{item.name}</span>
                <span className="category-tag">{CATEGORY_LABELS[item.category]}</span>
              </div>
              <span className="color-dot" style={{ backgroundColor: item.color }}></span>
            </div>
          </div>
        ))}
      </div>

      {clothes.length === 0 && !error && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path>
          </svg>
          <p>衣橱空空如也，点击「上传衣物」开始添加吧～</p>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); setError(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>上传新衣物</h3>

            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                className="text-input"
                placeholder="例如：白色T恤"
                value={uploadForm.name}
                onChange={e => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>分类</label>
              <div className="category-options">
                {categoryList.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-option ${uploadForm.category === cat ? 'active' : ''}`}
                    onClick={() => setUploadForm(prev => ({ ...prev, category: cat }))}
                  >
                    {CATEGORY_LABELS[cat]}
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
                    type="button"
                    className={`color-option ${uploadForm.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setUploadForm(prev => ({ ...prev, color }))}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>图片</label>
              <div
                className={`file-drop-zone ${uploadForm.file ? 'has-file' : ''}`}
                onClick={triggerFileSelect}
              >
                {uploadForm.file ? (
                  <div className="file-preview">
                    <img src={URL.createObjectURL(uploadForm.file)} alt="预览" className="preview-thumb" />
                    <span className="file-name">{uploadForm.file.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadForm(prev => ({ ...prev, file: null }))
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>点击选择图片（JPG/PNG/WEBP）</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => { setShowUploadModal(false); setError(null) }}
              >
                取消
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleUploadSubmit}
                disabled={uploading}
              >
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingItem(null); setError(null) }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>编辑衣物</h3>

            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                className="text-input"
                placeholder="例如：白色T恤"
                value={editingItem.name}
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>分类</label>
              <div className="category-options">
                {categoryList.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-option ${editingItem.category === cat ? 'active' : ''}`}
                    onClick={() => setEditingItem({ ...editingItem, category: cat })}
                  >
                    {CATEGORY_LABELS[cat]}
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
                    type="button"
                    className={`color-option ${editingItem.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingItem({ ...editingItem, color })}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => { setShowEditModal(false); setEditingItem(null); setError(null) }}
              >
                取消
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleSaveEdit}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Closet
