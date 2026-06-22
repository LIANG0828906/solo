import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { itemsAPI } from '../api'
import { CATEGORIES, CONDITIONS } from '../utils'
import './PublishPage.css'

const PublishPage: React.FC = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      showToast('请先登录', 'warning')
      navigate('/login')
    }
  }, [user, navigate, showToast])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const remainingSlots = 3 - images.length
    const newFiles = fileArray.slice(0, remainingSlots)

    if (fileArray.length > remainingSlots) {
      showToast('最多只能上传3张图片', 'warning')
    }

    if (newFiles.length === 0) return

    setImages((prev) => [...prev, ...newFiles])

    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
  }, [images.length, showToast])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => {
      const remaining = prev.filter((_, i) => i !== index)
      URL.revokeObjectURL(prev[index])
      return remaining
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (!title.trim()) {
      showToast('请输入物品标题', 'warning')
      return
    }
    if (title.length > 20) {
      showToast('标题不能超过20字', 'warning')
      return
    }
    if (!category) {
      showToast('请选择物品分类', 'warning')
      return
    }
    if (!condition) {
      showToast('请选择物品成色', 'warning')
      return
    }
    if (images.length === 0) {
      showToast('请至少上传一张图片', 'warning')
      return
    }
    if (description.length > 500) {
      showToast('描述不能超过500字', 'warning')
      return
    }

    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('description', description)
    formData.append('category', category)
    formData.append('condition', condition)
    images.forEach((img) => formData.append('images', img))

    setLoading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      await itemsAPI.createItem(formData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      showToast('发布成功！', 'success')
      setTimeout(() => {
        navigate('/')
      }, 800)
    } catch (error: any) {
      showToast(error.response?.data?.message || '发布失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="publish-page">
      <div className="container">
        <div className="publish-card scale-in">
          <div className="publish-header">
            <h1>发布物品</h1>
            <p>分享你的闲置物品，让它重获新生</p>
          </div>

          <form onSubmit={handleSubmit} className="publish-form">
            <div className="form-section">
              <label className="section-label">物品图片</label>
              <div
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => images.length < 3 && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {previewUrls.length > 0 ? (
                  <div className="preview-grid">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="preview-item">
                        <img src={url} alt={`preview ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage(index)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {previewUrls.length < 3 && (
                      <div className="add-more">
                        <span className="plus">+</span>
                        <span>添加图片</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <p>点击或拖拽图片到这里</p>
                    <p className="upload-hint">支持 JPG、PNG 格式，最多3张</p>
                  </div>
                )}
              </div>
              {loading && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <label className="section-label">
                标题 <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 20))}
                placeholder="给你的物品起个名字（不超过20字）"
                maxLength={20}
                disabled={loading}
              />
              <div className="char-count-right">{title.length}/20</div>
            </div>

            <div className="form-row">
              <div className="form-section">
                <label className="section-label">
                  分类 <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="">请选择分类</option>
                  {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-section">
                <label className="section-label">
                  成色 <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={loading}
                >
                  <option value="">请选择成色</option>
                  {CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section">
              <label className="section-label">描述</label>
              <textarea
                className="form-textarea-large"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="详细描述一下你的物品吧（选填，最多500字）"
                rows={5}
                maxLength={500}
                disabled={loading}
              />
              <div className="char-count-right">{description.length}/500</div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                取消
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? '发布中...' : '发布物品'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PublishPage
