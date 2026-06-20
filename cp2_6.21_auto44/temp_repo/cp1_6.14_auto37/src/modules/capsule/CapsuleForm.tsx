import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'

function CapsuleForm() {
  const [type, setType] = useState<'text' | 'image'>('text')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const getMinDate = () => {
    const minDate = new Date()
    minDate.setHours(minDate.getHours() + 24)
    return minDate.toISOString().slice(0, 16)
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > 800) {
            height = (800 / width) * height
            width = 800
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          let quality = 0.9
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)

          while (compressedDataUrl.length > 1024 * 1024 && quality > 0.1) {
            quality -= 0.1
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          }

          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setErrors({ image: '只支持JPG和PNG格式的图片' })
      return
    }

    try {
      const compressed = await compressImage(file)
      setImageUrl(compressed)
      setErrors((prev) => ({ ...prev, image: '' }))
    } catch (error) {
      setErrors({ image: '图片处理失败' })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (type === 'text') {
      if (!content.trim()) {
        newErrors.content = '请输入文字内容'
      } else if (content.length > 500) {
        newErrors.content = '文字内容不能超过500字'
      }
    } else {
      if (!imageUrl) {
        newErrors.image = '请上传一张图片'
      }
    }

    if (!openDate) {
      newErrors.openDate = '请选择开封日期'
    } else {
      const selectedDate = new Date(openDate)
      const minDate = new Date()
      minDate.setHours(minDate.getHours() + 24)
      if (selectedDate < minDate) {
        newErrors.openDate = '开封日期至少需要在24小时后'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadImage = async (base64: string): Promise<string> => {
    const response = await fetch(base64)
    const blob = await response.blob()
    const file = new File([blob], 'capsule.jpg', { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('image', file)

    const data = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return (data as any).imageUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      let finalContent = content
      if (type === 'image') {
        finalContent = await uploadImage(imageUrl)
      }

      await request.post('/capsules', {
        type,
        content: finalContent,
        openDate: new Date(openDate).toISOString(),
      })

      setShowSuccess(true)

      setTimeout(() => {
        navigate('/capsules')
      }, 2000)
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || '创建失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <h1 className="page-title">创建时间胶囊</h1>

      {showSuccess ? (
        <div className="success-animation glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="envelope-animation">
            <div className="envelope-body" />
            <div className="envelope-flap" />
            <div className="star-sparkle" />
            <div className="star-sparkle" />
            <div className="star-sparkle" />
          </div>
          <h2 style={{ marginBottom: '12px' }}>胶囊创建成功！</h2>
          <p style={{ color: 'var(--text-secondary)' }}>正在跳转至我的胶囊...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px' }}>
          <div className="form-group">
            <label className="form-label">胶囊类型</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${type === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setType('text')}
                style={{ flex: 1 }}
              >
                📝 文字胶囊
              </button>
              <button
                type="button"
                className={`btn ${type === 'image' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setType('image')}
                style={{ flex: 1 }}
              >
                🖼️ 图片胶囊
              </button>
            </div>
          </div>

          {type === 'text' ? (
            <div className="form-group">
              <label className="form-label">
                心情文字
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {content.length}/500
                </span>
              </label>
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你此刻的心情..."
                disabled={loading}
                maxLength={500}
              />
              {errors.content && <div className="form-error">{errors.content}</div>}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">上传图片</label>
              <div
                className={`image-upload-area ${imageUrl ? 'has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="预览" className="image-upload-preview" />
                ) : (
                  <>
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">点击上传图片</div>
                    <div className="upload-hint">支持JPG/PNG，将自动压缩至800px宽以内</div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {errors.image && <div className="form-error">{errors.image}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">开封日期</label>
            <input
              type="datetime-local"
              className="form-input"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              min={getMinDate()}
              disabled={loading}
            />
            {errors.openDate && <div className="form-error">{errors.openDate}</div>}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              开封日期至少需要在24小时后
            </div>
          </div>

          {errors.submit && (
            <div className="form-error" style={{ textAlign: 'center', marginBottom: '16px' }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '创建中...' : '✨ 封存胶囊'}
          </button>
        </form>
      )}
    </div>
  )
}

export default CapsuleForm
