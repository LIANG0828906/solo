import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Ingredient } from '../types'
import { recipeApi } from '../services/api'

export default function Publish() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' },
    { name: '', amount: '' }
  ])
  const [steps, setSteps] = useState<string[]>(['', ''])
  const [coverImage, setCoverImage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)

  const addIngredient = () => {
    setIngredients(prev => [...prev, { name: '', amount: '' }])
  }

  const removeIngredient = (idx: number) => {
    setRemovingIndex(idx)
    setTimeout(() => {
      setIngredients(prev => prev.filter((_, i) => i !== idx))
      setRemovingIndex(null)
    }, 300)
  }

  const updateIngredient = (idx: number, field: 'name' | 'amount', value: string) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing))
  }

  const addStep = () => {
    setSteps(prev => [...prev, ''])
  }

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }

  const updateStep = (idx: number, value: string) => {
    setSteps(prev => prev.map((s, i) => i === idx ? value : s))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validIngredients = ingredients.filter(i => i.name.trim())
    const validSteps = steps.filter(s => s.trim())
    if (!title.trim()) return alert('请输入菜名')
    if (validIngredients.length === 0) return alert('请至少添加一种食材')

    setSubmitting(true)
    try {
      const res = await recipeApi.create({
        title: title.trim(),
        description: description.trim(),
        ingredients: validIngredients,
        steps: validSteps,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'
      })
      if (res.code === 0) {
        alert('发布成功！')
        navigate('/')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '8px'
  }

  return (
    <div className="route-transition" style={{ padding: '24px 0' }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '32px',
        border: '1px solid #fde68a',
        boxShadow: '0 4px 20px rgba(249,115,22,0.08)'
      }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#f97316',
          marginBottom: '8px',
          fontFamily: '"Noto Serif SC", serif'
        }}>
          ✨ 发布你的私房菜谱
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
          记录家的味道，让更多人品尝你的手艺
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>🍜 菜名 <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：妈妈的红烧肉"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f97316'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>📝 简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单介绍一下这道菜的特点..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f97316'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>🥬 食材列表 <span style={{ color: '#ef4444' }}>*</span></label>
              <button
                type="button"
                onClick={addIngredient}
                style={{
                  background: 'none', border: '1px dashed #f97316', color: '#f97316',
                  padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500
                }}
              >
                + 添加食材
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: removingIndex === idx ? '#fee2e2' : '#fef3c7',
                    animation: removingIndex === idx ? 'slide-out-right 0.3s ease-out forwards' : 'slide-in-left 0.3s ease-out',
                    transition: 'background 0.3s'
                  }}
                >
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    backgroundColor: '#e2e8f0', color: '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, flexShrink: 0
                  }}>{idx + 1}</span>
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="食材名称"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                    placeholder="用量"
                    style={{
                      width: '100px',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      style={{
                        width: '32px', height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#e2e8f0',
                        color: '#1e293b',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ef4444'
                        e.currentTarget.style.color = '#fff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e2e8f0'
                        e.currentTarget.style.color = '#1e293b'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>👨‍🍳 烹饪步骤</label>
              <button
                type="button"
                onClick={addStep}
                style={{
                  background: 'none', border: '1px dashed #f97316', color: '#f97316',
                  padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500
                }}
              >
                + 添加步骤
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f97316, #fb923c)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, flexShrink: 0, marginTop: '4px'
                  }}>{idx + 1}</span>
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(idx, e.target.value)}
                    placeholder={`描述第 ${idx + 1} 步的操作...`}
                    rows={2}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      style={{
                        width: '32px', height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#e2e8f0',
                        color: '#1e293b',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 700,
                        marginTop: '4px'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>🖼️ 封面图片</label>
            <div style={{
              border: '2px dashed #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              transition: 'border-color 0.2s',
              backgroundColor: '#fff7ed',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              {coverImage ? (
                <img src={coverImage} alt="预览" style={{ maxHeight: '200px', borderRadius: '8px' }} />
              ) : (
                <>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>点击上传或拖拽图片到这里</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>建议尺寸 600×400px</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="cover-upload" />
              <label htmlFor="cover-upload" style={{ display: 'block', cursor: 'pointer' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                padding: '14px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                backgroundColor: '#fff',
                color: '#64748b',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2,
                padding: '14px',
                border: 'none',
                borderRadius: '10px',
                backgroundColor: '#f97316',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: submitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#ea580c' }}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
            >
              {submitting ? '发布中...' : '✨ 发布菜谱'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
