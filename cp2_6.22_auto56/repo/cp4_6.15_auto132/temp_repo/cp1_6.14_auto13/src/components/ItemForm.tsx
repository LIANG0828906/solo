import { useState, useRef, useEffect } from 'react'
import { Item, itemApi } from '../api'
import PhotoUploader, { ProcessedPhoto } from './PhotoUploader'
import { useToast } from './Toast'

const VALID_CATEGORIES = ['家具', '电器', '书籍', '服饰', '玩具', '厨房用品', '装饰品', '其他']
const VALID_CONDITIONS = ['全新', '九成新', '七成新', '五成新', '三成新']

interface ItemFormProps {
  item?: Item
  onSuccess: () => void
  onClose: () => void
}

const STEPS = [
  { title: '基本信息', icon: '📝' },
  { title: '上传照片', icon: '📷' },
  { title: '讲述故事', icon: '📖' }
]

function ItemForm({ item, onSuccess, onClose }: ItemFormProps) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [name, setName] = useState(item?.name || '')
  const [category, setCategory] = useState(item?.category || VALID_CATEGORIES[0])
  const [condition, setCondition] = useState(item?.condition || VALID_CONDITIONS[0])
  const [city, setCity] = useState(item?.city || '')
  const [story, setStory] = useState(item?.story || '')
  const [existingPhotos, setExistingPhotos] = useState<string[]>(item?.photos || [])
  const [newPhotos, setNewPhotos] = useState<ProcessedPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { showToast } = useToast()
  const stepContainerRef = useRef<HTMLDivElement>(null)

  const totalPhotos = existingPhotos.length + newPhotos.length

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!name || name.length < 2 || name.length > 50) {
      errs.name = '物品名称长度需在2-50个字符之间'
    }
    if (!VALID_CATEGORIES.includes(category)) {
      errs.category = '请选择有效的物品类别'
    }
    if (!VALID_CONDITIONS.includes(condition)) {
      errs.condition = '请选择有效的新旧程度'
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
    if (totalPhotos > 3) {
      errs.photos = '最多只能上传3张照片'
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
    if (step === 1 && !validateStep1()) {
      showToast('请完善基本信息', 'error')
      return
    }
    if (step === 2 && !validateStep2()) {
      showToast('请至少上传一张照片', 'error')
      return
    }
    if (step < 3) {
      setDirection('forward')
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setDirection('backward')
      setStep(step - 1)
    }
  }

  useEffect(() => {
    if (stepContainerRef.current) {
      stepContainerRef.current.scrollTop = 0
    }
  }, [step])

  const handleSubmit = async () => {
    if (!validateStep3()) {
      showToast('请完善物品故事（50-500字）', 'error')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('category', category)
      formData.append('condition', condition)
      formData.append('city', city.trim())
      formData.append('story', story.trim())
      existingPhotos.forEach(p => formData.append('existingPhotos', p))
      newPhotos.forEach(p => formData.append('photos', p.file))

      if (item) {
        await itemApi.update(item.id, formData)
        showToast('修改成功！', 'success')
      } else {
        await itemApi.create(formData)
        showToast('发布成功！让旧物开启新的旅程 ✨', 'success')
      }
      onSuccess()
    } catch (err: any) {
      const msg = err.response?.data?.message || '提交失败，请重试'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStepAnimationClass = () => {
    return direction === 'forward' ? 'animate-slide-in-left' : 'animate-slide-in-right'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{
        maxWidth: '600px',
        padding: '32px',
        background: `
          linear-gradient(135deg,
            rgba(250, 247, 240, 0.95) 0%,
            rgba(245, 240, 230, 0.95) 100%)
        `,
        backdropFilter: 'blur(32px) saturate(200%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--warm-brown) 0%, var(--warm-coffee) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {item ? '✏️ 编辑旧物' : '✨ 发布旧物'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '24px', color: 'var(--text-muted)', padding: '4px',
            transition: 'all 0.2s ease', borderRadius: '50%',
            width: '36px', height: '36px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream-dark)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            ✕
          </button>
        </div>

        <div className="step-indicator" style={{ marginBottom: '28px' }}>
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1
            const isActive = step === stepNum
            const isCompleted = step > stepNum
            return (
              <div key={stepNum} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div className={`step-dot ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
                    style={{ fontSize: isActive ? '16px' : '14px' }}>
                    {isCompleted ? '✓' : s.icon}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: isActive ? 'var(--warm-coffee-dark)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.3s ease'
                  }}>
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`step-line ${isCompleted ? 'completed' : ''}`}
                    style={{ margin: '0 8px 18px 8px', transition: 'all 0.3s ease' }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="form-step-container" ref={stepContainerRef} style={{ minHeight: '320px' }}>
          {step === 1 && (
            <div className={`form-step ${getStepAnimationClass()}`} key="step1">
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.1) 0%, rgba(139, 111, 71, 0.05) 100%)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--warm-coffee-dark)', fontWeight: 500 }}>
                  📝 第一步：告诉我们这件旧物的基本信息
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label className="label">物品名称</label>
                <input
                  className="input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="给你的旧物起个名字"
                  maxLength={50}
                />
                {errors.name && <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.name}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label className="label">物品类别</label>
                  <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                    {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">新旧程度</label>
                  <select className="select" value={condition} onChange={e => setCondition(e.target.value)}>
                    {VALID_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">所在城市</label>
                <input
                  className="input"
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="例如：北京"
                  maxLength={30}
                />
                {errors.city && <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.city}</div>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={`form-step ${getStepAnimationClass()}`} key="step2">
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.1) 0%, rgba(139, 111, 71, 0.05) 100%)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--warm-coffee-dark)', fontWeight: 500 }}>
                  📷 第二步：上传旧物的照片（最多3张，自动等比缩放裁剪）
                </div>
              </div>

              <PhotoUploader
                photos={newPhotos}
                setPhotos={setNewPhotos}
                existingPhotos={existingPhotos}
                setExistingPhotos={setExistingPhotos}
              />
              {errors.photos && <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '12px' }}>{errors.photos}</div>}
            </div>
          )}

          {step === 3 && (
            <div className={`form-step ${getStepAnimationClass()}`} key="step3">
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.1) 0%, rgba(139, 111, 71, 0.05) 100%)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--warm-coffee-dark)', fontWeight: 500 }}>
                  � 第三步：讲讲这件旧物背后的故事
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  它陪伴过你怎样的时光？有什么特别的回忆？（50-500字）
                </div>
              </div>

              <div>
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>物品故事</span>
                  <span style={{
                    fontWeight: 400,
                    color: story.length >= 50 && story.length <= 500 ? 'var(--soft-gold)' : 'var(--text-muted)',
                    fontSize: '13px'
                  }}>
                    {story.length}/500
                    {story.length < 50 && ` · 还需 ${50 - story.length} 字`}
                  </span>
                </label>
                <textarea
                  className="textarea"
                  value={story}
                  onChange={e => setStory(e.target.value.slice(0, 500))}
                  placeholder="这件旧物是怎么来的？它陪伴了你多久？有哪些温暖的回忆让你舍不得丢弃？讲讲它的故事，让下一个主人也能感受到这份温度..."
                  style={{ minHeight: '200px', lineHeight: 1.9 }}
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
            style={{ flex: 1, padding: '12px' }}
          >
            {step === 1 ? '取消' : '← 上一步'}
          </button>
          {step < 3 ? (
            <button className="btn btn-primary" onClick={nextStep} style={{ flex: 1, padding: '12px' }}>
              下一步 →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '12px' }}>
              {loading ? '提交中...' : item ? '💾 保存修改' : '🎉 发布旧物'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemForm
