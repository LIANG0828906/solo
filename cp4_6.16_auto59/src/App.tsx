import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Recipe } from './modules/recipes/types'
import { useRecipesStore } from './modules/recipes/store'
import { EditorCanvas } from './modules/recipes/EditorCanvas'
import { CommunityPanel } from './modules/community/CommunityPanel'

const Navigation: React.FC<{
  mode: 'community' | 'editor'
  recipeId?: string | null
}> = ({ mode, recipeId }) => {
  const navigate = useNavigate()
  const currentRecipe = useRecipesStore((s) => s.currentRecipe)

  return (
    <nav className="h-14 flex-shrink-0 bg-white border-b border-[#E8DCC8] px-6 flex items-center justify-between shadow-sm relative z-50">
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate('/')}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5E3C] to-[#D4A574] flex items-center justify-center text-lg shadow-md shadow-[#8B5E3C]/20 group-hover:scale-110 transition-transform">
          🍳
        </div>
        <div>
          <div className="font-bold text-[#5C4033]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            RecipeCanvas
          </div>
          <div className="text-[10px] text-[#A0876D] -mt-0.5">交互式食谱创作平台</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mode === 'editor' && (
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-[#F5E6D3] text-[#8B5E3C] text-sm font-medium hover:bg-[#E8D4BE] transition-all flex items-center gap-1.5"
          >
            ← 返回社区
          </button>
        )}

        <div className={`flex items-center gap-1 px-1.5 py-1 rounded-xl transition-all ${
          mode === 'community' ? 'bg-[#F5E6D3]' : 'bg-transparent'
        }`}>
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              mode === 'community'
                ? 'bg-white text-[#8B5E3C] shadow-sm'
                : 'text-[#A0876D] hover:text-[#8B5E3C]'
            }`}
          >
            <span>🏛️</span>
            食谱博物馆
          </button>
          <button
            onClick={() => {
              if (recipeId) {
                navigate(`/editor/${recipeId}`)
              } else if (currentRecipe) {
                navigate(`/editor/${currentRecipe.id}`)
              }
            }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              mode === 'editor'
                ? 'bg-white text-[#8B5E3C] shadow-sm'
                : 'text-[#A0876D] hover:text-[#8B5E3C]'
            } ${!recipeId && !currentRecipe ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!recipeId && !currentRecipe}
          >
            <span>🎨</span>
            画布编辑器
          </button>
        </div>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B5E3C] flex items-center justify-center text-base shadow-md ml-2 cursor-pointer hover:scale-105 transition-transform">
          😊
        </div>
      </div>
    </nav>
  )
}

const CommunityPage: React.FC = () => {
  const recipes = useRecipesStore((s) => s.recipes) || []
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col">
      <Navigation mode="community" recipeId={recipes.length > 0 ? recipes[0].id : null} />
      <div className="flex-1 min-h-0">
        <CommunityPanel
          onEditRecipe={(id) => navigate(`/editor/${id}`)}
          onViewRecipe={() => {}}
        />
      </div>
    </div>
  )
}

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipes = useRecipesStore((s) => s.recipes) || []
  const [inited, setInited] = useState(false)

  useEffect(() => {
    if (inited || !id) return
    const api = useRecipesStore.getState()
    if (!api) return
    const recs = api.recipes || []
    const exists = recs.some((r: Recipe) => r.id === id)
    if (!exists && recs.length > 0) {
      if (typeof api.setCurrentRecipe === 'function') api.setCurrentRecipe(recs[0].id)
      navigate(`/editor/${recs[0].id}`, { replace: true })
    } else if (exists) {
      if (typeof api.setCurrentRecipe === 'function') api.setCurrentRecipe(id)
    }
    setInited(true)
  }, [inited, id, navigate])

  const recipe = recipes.find((r) => r.id === id)

  if (!recipe) {
    if (recipes.length > 0) {
      return <Navigate to={`/editor/${recipes[0].id}`} replace />
    }
    const api = useRecipesStore.getState()
    if (api && typeof api.createRecipe === 'function') {
      const newRecipe = api.createRecipe({ title: '我的新食谱' })
      return <Navigate to={`/editor/${newRecipe.id}`} replace />
    }
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <Navigation mode="editor" recipeId={id} />
      <div className="flex-1 min-h-0">
        <EditorCanvas recipe={recipe} />
      </div>
    </div>
  )
}

export const App: React.FC = () => {
  const isLoading = useRecipesStore((s) => s.isLoading)

  useEffect(() => {
    const api = useRecipesStore.getState()
    if (api && typeof api.initStore === 'function') {
      api.initStore()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FBF7F2]">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">🍳</div>
          <div className="text-[#8B5E3C] font-bold text-lg">RecipeCanvas 正在加载...</div>
          <div className="text-[#A0876D] text-sm mt-2">正在准备你的厨房</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden bg-[#FBF7F2]">
        <style>{`
          * { box-sizing: border-box; }
          html, body, #root { margin: 0; padding: 0; height: 100%; width: 100%; }
          body {
            background-color: #FBF7F2;
            color: #5C4033;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #D4C4A8; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #B8A894; }
          input, textarea, select { font-family: inherit; }
          button { cursor: pointer; font-family: inherit; border: none; outline: none; }
          .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
          .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        `}</style>
        <Routes>
          <Route path="/" element={<CommunityPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
