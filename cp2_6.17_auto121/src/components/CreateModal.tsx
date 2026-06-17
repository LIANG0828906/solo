import { useState, useRef } from 'react'
import { createRecipe, type Recipe } from '../data/recipes'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  onRecipeCreated: (recipe: Recipe) => void
}

interface StepItem {
  id: string
  value: string
}

interface IngredientItem {
  id: string
  value: string
}

function CreateModal({ isOpen, onClose, onRecipeCreated }: CreateModalProps) {
  const [name, setName] = useState('')
  const [cover, setCover] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<IngredientItem[]>([
    { id: Date.now().toString(), value: '' }
  ])
  const [steps, setSteps] = useState<StepItem[]>([
    { id: Date.now().toString(), value: '' }
  ])
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setCover('')
    setDescription('')
    setIngredients([{ id: Date.now().toString(), value: '' }])
    setSteps([{ id: Date.now().toString(), value: '' }])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString() + Math.random(), value: '' }])
  }

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length === 1) {
      setIngredients([{ id: Date.now().toString(), value: '' }])
    } else {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], value }
    setIngredients(newIngredients)
  }

  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now().toString() + Math.random(), value: '' }])
  }

  const handleRemoveStep = (index: number) => {
    if (steps.length === 1) {
      setSteps([{ id: Date.now().toString(), value: '' }])
    } else {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], value }
    setSteps(newSteps)
  }

  const handleDragStart = (index: number, e: React.DragEvent) => {
    dragIndex.current = index
    setDraggingId(steps[index].id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverIndex.current = index
  }

  const handleDragEnter = (index: number) => {
    if (dragIndex.current !== null && dragIndex.current !== index) {
      const newSteps = [...steps]
      const from = dragIndex.current
      const to = index
      const [removed] = newSteps.splice(from, 1)
      newSteps.splice(to, 0, removed)
      setSteps(newSteps)
      dragIndex.current = to
    }
  }

  const handleDragEnd = () => {
    dragIndex.current = null
    dragOverIndex.current = null
    setDraggingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    const filteredIngredients = ingredients.filter(i => i.value.trim()).map(i => i.value.trim())
    const filteredSteps = steps.filter(s => s.value.trim()).map(s => s.value.trim())

    if (filteredIngredients.length === 0 || filteredSteps.length === 0) return

    const newRecipe = createRecipe({
      name: name.trim(),
      cover: cover.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      author: '我',
      description: description.trim() || '暂无描述',
      ingredients: filteredIngredients,
      steps: filteredSteps
    })

    onRecipeCreated(newRecipe)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">创建新菜谱</h2>
          <button className="modal-close" onClick={handleClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">菜名</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入菜谱名称..."
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">封面图 URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="输入图片链接（可选）..."
              value={cover}
              onChange={e => setCover(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">描述</label>
            <textarea
              className="form-textarea"
              placeholder="简单描述一下这道菜..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">材料列表</label>
            <div className="dynamic-list">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="dynamic-item slide-in">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`材料 ${index + 1}`}
                    value={ingredient.value}
                    onChange={e => handleIngredientChange(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveIngredient(index)}
                    aria-label="删除材料"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="add-btn" onClick={handleAddIngredient}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加材料
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">步骤列表</label>
            <div className="dynamic-list">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`dynamic-item slide-in ${draggingId === step.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(index, e)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  style={{ transition: 'transform 0.15s ease, opacity 0.15s ease' }}
                >
                  <span className="drag-handle" title="拖拽排序">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>
                  <textarea
                    className="form-textarea"
                    placeholder={`步骤 ${index + 1}`}
                    value={step.value}
                    onChange={e => handleStepChange(index, e.target.value)}
                    style={{ minHeight: '60px' }}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveStep(index)}
                    aria-label="删除步骤"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="add-btn" onClick={handleAddStep}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加步骤
            </button>
          </div>

          <button type="submit" className="submit-btn">
            创建菜谱
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateModal
