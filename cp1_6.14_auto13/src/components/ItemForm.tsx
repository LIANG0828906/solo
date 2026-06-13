import { useState } from 'react'
import { Item, itemApi } from '../api'

const VALID_CATEGORIES = ['家具', '电器', '书籍', '服饰', '玩具', '厨房用品', '装饰品', '其他']
const VALID_CONDITIONS = ['全新', '九成新', '七成新', '五成新', '三成新']

interface ItemFormProps {
  item?: Item
  onSuccess: () => void
  onClose: () => void
}

function ItemForm({ item, onSuccess, onClose }: ItemFormProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(item?.name || '')
  const [category, setCategory] = useState(item?.category || VALID_CATEGORIES[0])
  const [condition, setCondition] = useState(item?.condition || VALID_CONDITIONS[0])
  const [city, setCity] = useState(item?.city || '')
  const [story, setStory] = useState(item?.story || '')
  const [existingPhotos, setExistingPhotos] = useState<string[]>(item?.photos || [])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalPhotos = existingPhotos.length + newPhotos.length

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 3 - existingPhotos.length
    if (newPhotos.length + files.length > remaining) {
      setErrors(prev => ({ ...prev, photos: `最多只能上传 ${remaining} 张新照片` }))
      return
    }
    setNewPhotos(prev => [...prev, ...files])
    setErrors(prev => ({ ...prev, photos: '' }))
  }

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!name || name.length < 2 || name.length > 50) {
      errs.name = '物品名称长度需在2-50个字符之间'
    }
    if (!city || city.length < 2 || city.length > 30) {
      errs.city = '城市名称长度需在2-30个字符之间'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (totalPhotos === 0) {
      errs.photos = '请至少上传一张照片'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep3 = () => {
    const errs: Record<string, string> = {}
    if (!story || story.length < 50 || story.length > 500) {
      errs.story = '故事长度需在50-500字之间'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      formData.append('condition', condition)
      formData.append('city', city)
      formData.append('story', story)
      existingPhotos.forEach(p => formData.append('existingPhotos', p))
      newPhotos.forEach(f => formData.append('photos', f))

      if (item) {
        await itemApi.update(item.id, formData)
      } else {
        await itemApi.create(formData)
      }
      onSuccess()
    } catch (err: any) {
      const msg = err.response?.data?.message || '提交失败，请重试'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warm-brown)' }}>
            {item ? '编辑旧物' : '发布旧物'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '24px', color: 'var(--text-muted)', padding: '4px'
          }}>
            ✕
          </button>
        </div>

        <div className="step-indicator">
          {[1, 2, 3].map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`step-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
                {step > s ? '✓' : s}
              </div>
              {idx < 2 && <div className={`step-line ${step > s ? 'completed' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="form-step-container">
          {step === 1 && (
            <div className="form-step" key="step1">
              <div style={{ marginBottom: '20px' }}>
                <label className="label">物品名称</label>
                <input
                  className="input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="给你的旧物起个名字"
                />
                {errors.name && <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.name}</div>}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="label">物品类别</label>
                <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                  {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="label">新旧程度</label>
                <select className="select" value={condition} onChange={e => setCondition(e.target.value)}>
                  {VALID_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="label">所在城市</label>
                <input
                  className="input"
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="例如：北京"
                />
                {errors.city && <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.city}</div>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step" key="step2">
              <label className="label">照片（最多3张）</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {existingPhotos.map((p, i) => (
                  <div key={i} className="photo-preview">
                    <img src={p} alt="" />
                    <button type="button" className="photo-remove-btn" onClick={() => removeExistingPhoto(i)}>✕</button>
                  </div>
                ))}
                {newPhotos.map((f, i) => (
                  <div key={`new-${i}`} className="photo-preview">
                    <img src={URL.createObjectURL(f)} alt="" />
                    <button type="button" className="photo-remove-btn" onClick={() => removeNewPhoto(i)}>✕</button>
                  </div>
                ))}
                {totalPhotos < 3 && (
                  <label className="photo-upload-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '32px', color: 'var(--warm-coffee-light)' }}>📷</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>上传照片</span>
                    <input type="file" accept="image/*" multiple hidden onChange={handlePhotoChange} />
                  </label>
                )}
              </div>
              {errors.photos && <div style={{ color: '#F56C6C', fontSize: '12px', marginBottom: '16px' }}>{errors.photos}</div>}
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>已选 {totalPhotos}/3 张</div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step" key="step3">
              <div style={{ marginBottom: '12px' }}>
                <label className="label">
                  物品故事 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({story.length}/500)</span>
                </label>
                <textarea
                  className="textarea"
                  value={story}
                  onChange={e => setStory(e.target.value)}
                  placeholder="讲讲这件旧物背后的故事，它陪伴过你怎样的时光？（50-500字）"
                  style={{ minHeight: '160px' }}
                />
                {errors.story && <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.story}</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={step === 1 ? onClose : prevStep}
            style={{ flex: 1 }}
          >
            {step === 1 ? '取消' : '上一步'}
          </button>
          {step < 3 ? (
            <button className="btn btn-primary" onClick={nextStep} style={{ flex: 1 }}>
              下一步
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
              {loading ? '提交中...' : item ? '保存修改' : '发布'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemForm
