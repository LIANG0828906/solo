import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecipeCard, { Recipe } from '@/RecipeCard'
import SearchBox from '@/SearchBox'
import { apiRequest } from '@/store/authStore'
import './Search.css'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const ingredientsParam = searchParams.get('ingredients') || ''

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'keyword' | 'ingredient'>(
    ingredientsParam ? 'ingredient' : 'keyword'
  )
  const [ingredientList, setIngredientList] = useState<string[]>(
    ingredientsParam ? ingredientsParam.split(',').filter(Boolean) : []
  )
  const [ingredientInput, setIngredientInput] = useState('')

  useEffect(() => {
    if (activeTab === 'keyword' && query) {
      searchRecipes(query)
    } else if (activeTab === 'ingredient' && ingredientList.length > 0) {
      matchByIngredients()
    } else {
      setRecipes([])
    }
  }, [query, activeTab])

  useEffect(() => {
    if (activeTab === 'ingredient' && ingredientList.length > 0) {
      matchByIngredients()
    }
  }, [ingredientList.length, activeTab])

  const searchRecipes = async (keyword: string) => {
    setLoading(true)
    try {
      const response = await apiRequest(`/api/recipes?search=${encodeURIComponent(keyword)}&limit=24`)
      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (err) {
      console.error('搜索失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const matchByIngredients = async () => {
    setLoading(true)
    try {
      const response = await apiRequest('/api/recipes/match', {
        method: 'POST',
        body: JSON.stringify({ ingredients: ingredientList }),
      })
      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (err) {
      console.error('食材匹配失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = (ing: string) => {
    if (ing.trim() && !ingredientList.includes(ing.trim())) {
      const newList = [...ingredientList, ing.trim()]
      setIngredientList(newList)
      setSearchParams({ ingredients: newList.join(',') })
    }
    setIngredientInput('')
  }

  const handleRemoveIngredient = (index: number) => {
    const newList = ingredientList.filter((_, i) => i !== index)
    setIngredientList(newList)
    if (newList.length > 0) {
      setSearchParams({ ingredients: newList.join(',') })
    } else {
      setSearchParams({})
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ingredientInput.trim()) {
      e.preventDefault()
      handleAddIngredient(ingredientInput)
    }
  }

  const commonIngredients = ['鸡蛋', '番茄', '土豆', '牛肉', '鸡肉', '豆腐', '面粉', '牛奶']

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-header-content">
          <h1 className="page-title">
            {activeTab === 'keyword' ? '搜索食谱' : '食材反查'}
          </h1>
          <p className="page-subtitle">
            {activeTab === 'keyword'
              ? '输入关键词找到你想要的食谱'
              : '输入冰箱里的食材，看看能做什么菜'}
          </p>
        </div>
      </div>

      <div className="search-main">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'keyword' ? 'active' : ''}`}
            onClick={() => setActiveTab('keyword')}
          >
            🔍 关键词搜索
          </button>
          <button
            className={`tab-btn ${activeTab === 'ingredient' ? 'active' : ''}`}
            onClick={() => setActiveTab('ingredient')}
          >
            🥗 食材反查
          </button>
        </div>

        {activeTab === 'keyword' ? (
          <div className="search-box-wrapper">
            <SearchBox initialValue={query} placeholder="搜索食谱、食材、标签..." />
          </div>
        ) : (
          <div className="ingredient-search-section">
            <div className="ingredient-input-area">
              <div className="ingredient-tags">
                {ingredientList.map((ing, index) => (
                  <span key={index} className="ingredient-tag-item">
                    {ing}
                    <button onClick={() => handleRemoveIngredient(index)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={ingredientList.length === 0 ? '输入食材名称，按回车添加...' : ''}
                  className="ingredient-text-input"
                />
              </div>
            </div>
            <div className="common-ingredients">
              <span className="common-label">常用食材：</span>
              {commonIngredients.map((ing) => (
                <button
                  key={ing}
                  className={`common-ingredient-btn ${
                    ingredientList.includes(ing) ? 'selected' : ''
                  }`}
                  onClick={() =>
                    ingredientList.includes(ing)
                      ? handleRemoveIngredient(ingredientList.indexOf(ing))
                      : handleAddIngredient(ing)
                  }
                >
                  {ing}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="search-results">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>搜索中...</span>
            </div>
          ) : recipes.length > 0 ? (
            <>
              <div className="results-header">
                <span className="results-count">
                  找到 <strong>{recipes.length}</strong> 个食谱
                </span>
                {activeTab === 'ingredient' && (
                  <span className="match-tip">按匹配度排序</span>
                )}
              </div>
              <div className="masonry-grid">
                {recipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <p className="empty-text">
                {activeTab === 'keyword' && query
                  ? `没有找到与 "${query}" 相关的食谱`
                  : activeTab === 'ingredient' && ingredientList.length > 0
                  ? '没有找到匹配的食谱，试试添加更多食材？'
                  : '输入关键词或食材开始搜索'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
