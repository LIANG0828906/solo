import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  useFoodStore,
  Food,
  MealType,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_EMOJIS,
} from '../store/foodStore'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealForm() {
  const { foods, addRecord, deleteRecord, addCustomFood, getDayRecords } = useFoodStore()
  const today = new Date()
  const todayRecords = getDayRecords(today)

  const [mealType, setMealType] = useState<MealType>(() => {
    const hour = new Date().getHours()
    if (hour < 10) return 'breakfast'
    if (hour < 14) return 'lunch'
    if (hour < 19) return 'dinner'
    return 'snack'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showCustomForm, setShowCustomForm] = useState(false)

  const [customName, setCustomName] = useState('')
  const [customServing, setCustomServing] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFat, setCustomFat] = useState('')

  const filteredFoods = useMemo(() => {
    if (!searchTerm.trim()) return foods.slice(0, 50)
    const term = searchTerm.trim().toLowerCase()
    return foods.filter((f) => f.name.toLowerCase().includes(term))
  }, [foods, searchTerm])

  const previewNutrition = useMemo(() => {
    if (!selectedFood) return null
    const q = Math.max(0, quantity)
    return {
      calories: Math.round(selectedFood.calories * q * 10) / 10,
      protein: Math.round(selectedFood.protein * q * 10) / 10,
      carbs: Math.round(selectedFood.carbs * q * 10) / 10,
      fat: Math.round(selectedFood.fat * q * 10) / 10,
    }
  }, [selectedFood, quantity])

  const handleAddRecord = () => {
    if (!selectedFood || quantity <= 0) return
    addRecord(selectedFood, quantity, mealType)
    setSelectedFood(null)
    setQuantity(1)
    setSearchTerm('')
  }

  const handleAddCustomFood = () => {
    if (!customName.trim() || !customServing.trim()) return
    const calories = parseFloat(customCalories) || 0
    const protein = parseFloat(customProtein) || 0
    const carbs = parseFloat(customCarbs) || 0
    const fat = parseFloat(customFat) || 0

    const newFood = addCustomFood({
      name: customName.trim(),
      serving: customServing.trim(),
      calories,
      protein,
      carbs,
      fat,
    })

    setCustomName('')
    setCustomServing('')
    setCustomCalories('')
    setCustomProtein('')
    setCustomCarbs('')
    setCustomFat('')
    setShowCustomForm(false)
    setSelectedFood(newFood)
  }

  const groupedTodayRecords = useMemo(() => {
    const result: Record<MealType, typeof todayRecords> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    todayRecords.forEach((r) => result[r.mealType].push(r))
    return result
  }, [todayRecords])

  return (
    <div className="card">
      <div className="card-title">🍽️ 添加饮食记录</div>

      <div className="meal-form-container">
        <div className="meal-type-tabs">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              className={`meal-type-tab ${mealType === type ? 'active' : ''}`}
              onClick={() => setMealType(type)}
            >
              <span className="meal-type-tab-emoji">{MEAL_TYPE_EMOJIS[type]}</span>
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            className="search-input"
            placeholder="🔍 搜索食物（如：米饭、鸡胸肉）..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setSelectedFood(null)
            }}
          />
          {!selectedFood && filteredFoods.length > 0 && (
            <div className="food-list">
              {filteredFoods.slice(0, 20).map((food) => (
                <div
                  key={food.id}
                  className="food-item"
                  onClick={() => {
                    setSelectedFood(food)
                    setQuantity(1)
                  }}
                >
                  <div className="food-item-info">
                    <span className="food-item-name">
                      {food.name}
                      {food.isCustom && (
                        <span style={{ fontSize: '10px', color: '#FF8C00', marginLeft: '6px' }}>
                          自定义
                        </span>
                      )}
                    </span>
                    <span className="food-item-serving">{food.serving}</span>
                  </div>
                  <div className="food-item-calories">{food.calories} 千卡</div>
                </div>
              ))}
            </div>
          )}
          {!selectedFood && filteredFoods.length === 0 && searchTerm && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9E9E9E', fontSize: '13px' }}>
              没有找到匹配的食物，可以尝试添加自定义食物
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="selected-food fade-in">
            <div className="selected-food-header">
              <div>
                <div className="selected-food-name">{selectedFood.name}</div>
                <div className="selected-food-serving">
                  {selectedFood.serving} · {selectedFood.calories} 千卡/份
                </div>
              </div>
              <button
                className="remove-btn"
                onClick={() => setSelectedFood(null)}
                title="取消选择"
              >
                ✕
              </button>
            </div>

            <div className="quantity-input-group">
              <label className="quantity-label">份数：</label>
              <input
                type="number"
                className="quantity-input"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              />
            </div>

            {previewNutrition && (
              <div className="nutrition-preview">
                <div className="nutrition-preview-item">
                  <div className="nutrition-preview-label">热量</div>
                  <div className="nutrition-preview-value accent">{previewNutrition.calories}</div>
                </div>
                <div className="nutrition-preview-item">
                  <div className="nutrition-preview-label">蛋白质</div>
                  <div className="nutrition-preview-value">{previewNutrition.protein}g</div>
                </div>
                <div className="nutrition-preview-item">
                  <div className="nutrition-preview-label">碳水</div>
                  <div className="nutrition-preview-value">{previewNutrition.carbs}g</div>
                </div>
                <div className="nutrition-preview-item">
                  <div className="nutrition-preview-label">脂肪</div>
                  <div className="nutrition-preview-value">{previewNutrition.fat}g</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '14px' }}>
              <button
                className="btn btn-accent btn-block"
                onClick={handleAddRecord}
                disabled={quantity <= 0}
              >
                ➕ 添加到{MEAL_TYPE_LABELS[mealType]}
              </button>
            </div>
          </div>
        )}

        {!selectedFood && (
          <div className="add-custom-food">
            {!showCustomForm ? (
              <button
                className="btn btn-outline btn-block"
                onClick={() => setShowCustomForm(true)}
              >
                ✨ 添加自定义食物
              </button>
            ) : (
              <div className="custom-food-form fade-in">
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  自定义食物
                </div>
                <div className="custom-food-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">食物名称 *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="例如：妈妈做的红烧肉"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">份量 *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="例如：1盘(200g)"
                      value={customServing}
                      onChange={(e) => setCustomServing(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">热量 (千卡)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">蛋白质 (g)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">碳水 (g)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">脂肪 (g)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={customFat}
                      onChange={(e) => setCustomFat(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setShowCustomForm(false)}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleAddCustomFood}
                    disabled={!customName.trim() || !customServing.trim()}
                  >
                    保存并选择
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="card-title" style={{ marginBottom: '14px' }}>
        📝 今日记录
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#9E9E9E', fontWeight: 400 }}>
          {format(today, 'M月d日')}
        </span>
      </div>

      <div className="today-meals">
        {todayRecords.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            <div className="empty-icon" style={{ fontSize: '36px', marginBottom: '8px' }}>🥢</div>
            <div className="empty-text">还没有记录，快来添加第一餐吧</div>
          </div>
        ) : (
          MEAL_TYPES.map((type) => {
            const items = groupedTodayRecords[type]
            if (items.length === 0) return null
            const typeCal = items.reduce((s, r) => s + r.calories, 0)
            return (
              <div key={type} className="today-meal-group">
                <div className="today-meal-group-title">
                  <span>{MEAL_TYPE_EMOJIS[type]}</span>
                  <span>{MEAL_TYPE_LABELS[type]}</span>
                  <span style={{ marginLeft: 'auto', color: '#FF8C00' }}>
                    {Math.round(typeCal)} 千卡
                  </span>
                </div>
                {items.map((r) => (
                  <div key={r.id} className="today-meal-item">
                    <div className="today-meal-item-info">
                      <span className="today-meal-item-name">{r.foodName}</span>
                      <span className="today-meal-item-meta">
                        {r.quantity} × {r.serving}
                        {' · '}
                        {format(new Date(r.timestamp), 'HH:mm')}
                      </span>
                    </div>
                    <div className="today-meal-item-right">
                      <span className="today-meal-item-cal">
                        +{Math.round(r.calories)}
                      </span>
                      <button
                        className="delete-meal-btn"
                        onClick={() => deleteRecord(r.id)}
                        title="删除记录"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
