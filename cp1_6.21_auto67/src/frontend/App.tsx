import React, { useState, useCallback, useRef } from 'react'
import { Search, User, Sparkles, Loader2, ChefHat } from 'lucide-react'
import { ImageUploader } from './components/ImageUploader'
import { RecipeCard } from './components/RecipeCard'
import { RecipeDetail } from './components/RecipeDetail'
import { UploadedImage, MatchedRecipe, IdentifyResponse, RecipeResponse } from '../shared/types'
import './App.css'

function App() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [recipes, setRecipes] = useState<MatchedRecipe[]>([])
  const [identifiedIngredients, setIdentifiedIngredients] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<MatchedRecipe | null>(null)
  const startTimeRef = useRef<number>(0)

  const handleIdentify = useCallback(async () => {
    if (images.length === 0) {
      alert('请先上传至少一张图片')
      return
    }

    startTimeRef.current = performance.now()
    setIsLoading(true)
    setRecipes([])
    setIdentifiedIngredients([])

    try {
      const formData = new FormData()
      images.forEach(img => {
        formData.append('images', img.file)
      })

      const identifyResponse = await fetch('/api/identify', {
        method: 'POST',
        body: formData
      })

      const identifyData = await identifyResponse.json() as IdentifyResponse

      if (!identifyData.success) {
        throw new Error('识别失败')
      }

      setIdentifiedIngredients(identifyData.ingredients)

      const recipeResponse = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ingredients: identifyData.ingredients })
      })

      const recipeData = await recipeResponse.json() as RecipeResponse

      if (!recipeData.success) {
        throw new Error('获取食谱失败')
      }

      setRecipes(recipeData.recipes)

      const totalTime = performance.now() - startTimeRef.current
      console.log(`总耗时: ${totalTime.toFixed(0)}ms`)
      if (totalTime > 2500) {
        console.warn(`总耗时超过 2.5s 限制`)
      }
    } catch (error) {
      console.error('识别失败:', error)
      alert('识别失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [images])

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-left">
          <ChefHat className="logo-icon" size={32} />
          <h1 className="nav-title">智能食验室</h1>
        </div>
        <div className="nav-right">
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="upload-section">
          <div className="section-header">
            <h2 className="section-title">
              <Sparkles size={24} className="title-icon" />
              上传食材图片
            </h2>
            <p className="section-subtitle">拍摄或上传冰箱里的食材，AI 帮你推荐美味食谱</p>
          </div>

          <ImageUploader images={images} onImagesChange={setImages} />

          {identifiedIngredients.length > 0 && (
            <div className="identified-ingredients">
              <p className="identified-label">识别到的食材：</p>
              <div className="ingredient-tags">
                {identifiedIngredients.map((ing, i) => (
                  <span key={i} className="ingredient-tag matched">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="action-section">
            <button
              className={`identify-button ${isLoading ? 'loading' : ''}`}
              onClick={handleIdentify}
              disabled={isLoading || images.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  智能识别中...
                </>
              ) : (
                <>
                  <Search size={20} />
                  智能识别
                </>
              )}
            </button>
          </div>
        </section>

        <section className="recipes-section">
          {recipes.length > 0 ? (
            <>
              <div className="results-header">
                <h2 className="section-title">为你推荐 {recipes.length} 道食谱</h2>
                <p className="section-subtitle">按食材匹配度和难度排序</p>
              </div>
              <div className="recipe-grid">
                {recipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            </>
          ) : !isLoading && identifiedIngredients.length > 0 ? (
            <div className="empty-results">
              <ChefHat size={48} className="empty-icon" />
              <h3>未找到匹配的食谱</h3>
              <p>尝试上传更多食材图片，或检查识别到的食材是否正确</p>
            </div>
          ) : null}

          {isLoading && (
            <div className="loading-state">
              <Loader2 size={48} className="spinner large" />
              <p>正在智能识别食材并匹配食谱...</p>
            </div>
          )}
        </section>
      </main>

      <RecipeDetail recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  )
}

export default App
