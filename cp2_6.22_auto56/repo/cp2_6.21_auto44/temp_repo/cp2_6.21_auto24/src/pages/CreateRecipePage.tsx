import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import axios from 'axios'
import { Ingredient, Step, Recipe } from '../types'

const availableTags = [
  '中式', '西式', '烘焙', '素食', '甜点', '快手菜', '汤品', '主食', '凉菜', '下饭菜',
]

const CreateRecipePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [cookTime, setCookTime] = useState(30)
  const [isPublic, setIsPublic] = useState(true)
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '' },
  ])
  const [steps, setSteps] = useState<Step[]>([
    { description: '', image: '' },
  ])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEditing) {
      fetchRecipe()
    }
  }, [id])

  const fetchRecipe = async () => {
    try {
      const response = await axios.get<Recipe>(`/api/recipes/${id}`)
      const recipe = response.data
      setTitle(recipe.title)
      setDescription(recipe.description)
      setCoverImage(recipe.cover_image || '')
      setCoverImagePreview(recipe.cover_image || '')
      setCookTime(recipe.cook_time)
      setIsPublic(recipe.is_public)
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '' }])
      setSteps(recipe.steps.length > 0 ? recipe.steps : [{ description: '', image: '' }])
      setSelectedTags(recipe.tags)
    } catch (error) {
      console.error('Failed to fetch recipe:', error)
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
        setCoverImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverImageUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverImage(e.target.value)
    setCoverImagePreview(e.target.value)
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
  }

  const addStep = () => {
    setSteps([...steps, { description: '', image: '' }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, field: keyof Step, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const handleStepImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateStep(index, 'image', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSteps(items)
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = '请输入食谱标题'
    if (!description.trim()) newErrors.description = '请输入食谱简介'
    if (cookTime <= 0) newErrors.cookTime = '请输入有效的烹饪时间'
    const validIngredients = ingredients.filter((i) => i.name.trim())
    if (validIngredients.length === 0) newErrors.ingredients = '请至少添加一种食材'
    const validSteps = steps.filter((s) => s.description.trim())
    if (validSteps.length === 0) newErrors.steps = '请至少添加一个步骤'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const recipeData = {
        title,
        description,
        cover_image: coverImage,
        cook_time: cookTime,
        is_public: isPublic,
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((ing, idx) => ({ ...ing, sort_order: idx })),
        steps: steps
          .filter((s) => s.description.trim())
          .map((step, idx) => ({ ...step, sort_order: idx })),
        tags: selectedTags,
      }

      if (isEditing) {
        await axios.put(`/api/recipes/${id}`, recipeData)
        alert('食谱更新成功！')
      } else {
        await axios.post('/api/recipes', recipeData)
        alert('食谱发布成功！')
      }
      navigate('/')
    } catch (error) {
      console.error('Failed to save recipe:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${hasError ? '#f44336' : '#d7ccc8'}`,
    fontSize: '14px',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  })

  const labelStyle = {
    display: 'block' as const,
    fontSize: '14px',
    color: '#5d4037',
    marginBottom: '8px',
    fontWeight: 600,
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#8d6e63',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ← 返回
      </button>

      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#3e2723',
          marginBottom: '24px',
        }}
      >
        {isEditing ? '编辑食谱' : '发布新食谱'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#3e2723', marginBottom: '20px' }}>
            📝 基本信息
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>食谱标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给你的美食起个名字"
              style={inputStyle(!!errors.title)}
            />
            {errors.title && (
              <p style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
                {errors.title}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>食谱简介 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单介绍一下这道菜..."
              rows={3}
              style={{ ...inputStyle(!!errors.description), resize: 'vertical' }}
            />
            {errors.description && (
              <p style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
                {errors.description}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>预估烹饪时间（分钟）</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(Number(e.target.value))}
              min="1"
              style={inputStyle(!!errors.cookTime)}
            />
            {errors.cookTime && (
              <p style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
                {errors.cookTime}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>封面图片</label>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              <label
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#f5f0e1',
                  color: '#5d4037',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0d6c8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f0e1'
                }}
              >
                📷 上传图片
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  style={{ display: 'none' }}
                />
              </label>
              <input
                type="text"
                placeholder="或输入图片URL"
                value={coverImage}
                onChange={handleCoverImageUrl}
                style={{ flex: 1, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7ccc8', fontSize: '14px' }}
              />
            </div>
            {coverImagePreview && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={coverImagePreview}
                  alt="封面预览"
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    backgroundColor: selectedTags.includes(tag) ? '#ff7043' : '#f5f0e1',
                    color: selectedTags.includes(tag) ? '#fff' : '#5d4037',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.3s',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#3e2723' }}>
              🥗 食材清单</h2>
            <button
              type="button"
              onClick={addIngredient}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f5f0e1',
                color: '#5d4037',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              + 添加食材
            </button>
          </div>
          {errors.ingredients && (
            <p style={{ color: '#f44336', fontSize: '12px', marginBottom: '12px' }}>
              {errors.ingredients}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ingredients.map((ing, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="食材名称"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7ccc8', fontSize: '14px' }}
                />
                <input
                  type="text"
                  placeholder="用量"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  style={{ width: '120px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7ccc8', fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length <= 1}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#ffebee',
                    color: '#f44336',
                    fontSize: '18px',
                    opacity: ingredients.length <= 1 ? 0.3 : 1,
                    cursor: ingredients.length <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#3e2723' }}>
              👨‍🍳 制作步骤</h2>
            <button
              type="button"
              onClick={addStep}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#f5f0e1',
                color: '#5d4037',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              + 添加步骤
            </button>
          </div>
          {errors.steps && (
            <p style={{ color: '#f44336', fontSize: '12px', marginBottom: '12px' }}>
              {errors.steps}
            </p>
          )}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {steps.map((step, index) => (
                    <Draggable key={index} draggableId={`step-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '12px',
                            opacity: snapshot.isDragging ? 0.8 : 1,
                            transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                            transition: 'opacity 0.2s, transform 0.2s',
                          }}
                        >
                          <div
                            {...provided.dragHandleProps}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                              backgroundColor: '#f5f0e1',
                              borderRadius: '8px',
                              color: '#8d6e63',
                              fontSize: '16px',
                              cursor: 'grab',
                              flexShrink: 0,
                              marginTop: '4px',
                            }}
                          >
                            ≡
                          </div>
                          <div
                            style={{
                              flex: 1,
                              backgroundColor: '#fafafa',
                              borderRadius: '8px',
                              padding: '12px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: '#ff7043',
                                  fontSize: '14px',
                                }}
                              >
                                步骤 {index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeStep(index)}
                                disabled={steps.length <= 1}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  backgroundColor: '#ffebee',
                                  color: '#f44336',
                                  fontSize: '16px',
                                  opacity: steps.length <= 1 ? 0.3 : 1,
                                  cursor: steps.length <= 1 ? 'not-allowed' : 'pointer',
                                }}
                              >
                                ×
                              </button>
                            </div>
                            <textarea
                              placeholder="描述这个步骤..."
                              value={step.description}
                              onChange={(e) => updateStep(index, 'description', e.target.value)}
                              rows={2}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e0e0e0',
                                fontSize: '14px',
                                resize: 'vertical',
                                marginBottom: '8px',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <label
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#e8f5e9',
                                  color: '#2e7d32',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                📷 添加图片
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleStepImageChange(index, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              {step.image && (
                                <img
                                  src={step.image}
                                  alt={`步骤${index + 1}预览`}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '14px 32px',
              borderRadius: '8px',
              backgroundColor: '#f5f0e1',
              color: '#5d4037',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 48px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff7043, #f4511e)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {loading ? '保存中...' : isEditing ? '保存修改' : '发布食谱'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateRecipePage
