import { useState } from 'react'
import { useIdeaStore, type Category } from './ideaStore'

const categories: Category[] = ['技术', '设计', '运营', '市场']

const categoryColors: Record<Category, string> = {
  技术: '#4A90D9',
  设计: '#9B59B6',
  运营: '#E67E22',
  市场: '#1ABC9C',
}

export default function IdeaForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('技术')
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({})
  const [isOpen, setIsOpen] = useState(false)
  const addIdea = useIdeaStore((state) => state.addIdea)

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {}
    if (!title.trim()) {
      newErrors.title = '请输入创意标题'
    } else if (title.trim().length < 2) {
      newErrors.title = '标题至少2个字符'
    }
    if (!description.trim()) {
      newErrors.description = '请输入创意描述'
    } else if (description.trim().length < 10) {
      newErrors.description = '描述至少10个字符'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      addIdea(title.trim(), description.trim(), category)
      setTitle('')
      setDescription('')
      setCategory('技术')
      setIsOpen(false)
      setErrors({})
    }
  }

  return (
    <div className="idea-form-section">
      <button
        className="fab-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? '关闭表单' : '添加创意'}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className={`fab-icon ${isOpen ? 'rotated' : ''}`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="fab-text">{isOpen ? '收起' : '提交创意'}</span>
      </button>

      {isOpen && (
        <form className="idea-form" onSubmit={handleSubmit}>
          <h3 className="form-title">💡 提交新创意</h3>

          <div className="form-group">
            <label htmlFor="title">创意标题</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的创意起个响亮的名字"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">创意描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述你的创意想法..."
              rows={4}
              className={errors.description ? 'input-error' : ''}
            />
            {errors.description && (
              <span className="error-text">{errors.description}</span>
            )}
          </div>

          <div className="form-group">
            <label>分类</label>
            <div className="category-selector">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${category === cat ? 'active' : ''}`}
                  style={{
                    '--chip-color': categoryColors[cat],
                  } as React.CSSProperties}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-button">
            提交创意
          </button>
        </form>
      )}
    </div>
  )
}
