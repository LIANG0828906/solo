import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CreateExhibition.css'

function CreateExhibition() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    theme: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/exhibitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      navigate(`/edit/${data.id}`)
    } catch (error) {
      console.error('创建展览失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-exhibition fade-in">
      <div className="create-container glass-panel">
        <h1 className="create-title">创建新展览</h1>
        <p className="create-subtitle">填写展览信息，开始你的策展之旅</p>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label className="form-label">展览名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="给你的展览起个名字"
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">展览主题</label>
            <input
              type="text"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="例如：印象派画展、摄影作品展"
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label className="form-label">展览简介</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="用一段话介绍你的展览..."
              rows={4}
              maxLength={200}
            />
          </div>

          <button type="submit" className="btn-primary submit-btn" disabled={submitting}>
            {submitting ? '创建中...' : '创建展览'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateExhibition
