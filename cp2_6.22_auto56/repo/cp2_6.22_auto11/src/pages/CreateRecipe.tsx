import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, apiRequest } from '@/store/authStore'
import './CreateRecipe.css'

export default function CreateRecipe() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [ingredients, setIngredients] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' },
  ])
  const [steps, setSteps] = useState<{ order: number; content: string }[]>([
    { order: 1, content: '' },
  ])
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allTags = ['中餐', '甜点', '低卡', '家常菜', '烘焙', '快手菜', '汤品', '素菜', '早餐', '下午茶']

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index][field] = value
    setIngredients(newIngredients)
  }

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, content: '' }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        order: i + 1,
      }))
      setSteps(newSteps)
    }
  }

  const updateStep = (index: number, content: string) => {
    const newSteps = [...steps]
    newSteps[index].content = content
    setSteps(newSteps)
  }

  const toggleTag = (tag: string) => {
    const currentTags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : []
    if (currentTags.includes(tag)) {
      setTagsInput(currentTags.filter((t) => t !== tag).join(', '))
    } else {
      currentTags.push(tag)
      setTagsInput(currentTags.join(', '))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('请输入食谱标题')
      return
    }

    const validIngredients = ingredients.filter((i) => i.name.trim())
    if (validIngredients.length === 0) {
      setError('请至少添加一种食材')
      return
    }

    const validSteps = steps.filter((s) => s.content.trim())
    if (validSteps.length === 0) {
      setError('请至少添加一个步骤')
      return
    }

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    setSubmitting(true)
    try {
      const response = await apiRequest('/api/recipes', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          image: image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
          ingredients: validIngredients,
          steps: validSteps.map((s, i) => ({ order: i + 1, content: s.content })),
          tags,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        navigate(`/recipe/${data.id}`)
      } else {
        const data = await response.json()
        setError(data.error || '创建失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="create-recipe-page">
        <div className="auth-required">
          <p>请先登录后再创建食谱</p>
          <button className="login-btn" onClick={() => navigate('/login')}>
            去登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="create-recipe-page">
      <div className="create-header">
        <h1 className="page-title">创建食谱</h1>
        <p className="page-subtitle">分享你的独家美食配方</p>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-section">
          <h2 className="section-title">基本信息</h2>

          <div className="form-row">
            <label>食谱标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的美食起个名字"
              maxLength={50}
            />
          </div>

          <div className="form-row">
            <label>简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述一下这道菜..."
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <label>封面图片 URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="输入图片链接（可选）"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">食材清单</h2>
            <button type="button" className="add-btn" onClick={addIngredient}>
              + 添加食材
            </button>
          </div>

          <div className="ingredients-list">
            {ingredients.map((ing, index) => (
              <div key={index} className="ingredient-row">
                <span className="ingredient-index">{index + 1}</span>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  placeholder="食材名称"
                  className="ingredient-name-input"
                />
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  placeholder="用量"
                  className="ingredient-amount-input"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeIngredient(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">制作步骤</h2>
            <button type="button" className="add-btn" onClick={addStep}>
              + 添加步骤
            </button>
          </div>

          <div className="steps-list">
            {steps.map((step, index) => (
              <div key={index} className="step-row">
                <span className="step-number">{index + 1}</span>
                <textarea
                  value={step.content}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder={`第 ${index + 1} 步...`}
                  rows={2}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeStep(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">标签分类</h2>
          <div className="tags-selector">
            {allTags.map((tag) => {
              const currentTags = tagsInput
                ? tagsInput.split(',').map((t) => t.trim())
                : []
              const isSelected = currentTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  className={`tag-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="也可以手动输入标签，用逗号分隔"
            className="tags-input"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
          >
            取消
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? '发布中...' : '发布食谱'}
          </button>
        </div>
      </form>
    </div>
  )
}
