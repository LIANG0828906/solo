import { useState, useCallback, useMemo } from 'react'
import RecipeInput from './components/RecipeInput'
import TranslationResult from './components/TranslationResult'
import IngredientReplacer from './components/IngredientReplacer'
import axios from 'axios'
import type {
  TranslationResultData,
  ReplacedIngredient,
  RecipeInput as RecipeInputType,
} from './types'

type View = 'input' | 'result'

export default function App() {
  const [view, setView] = useState<View>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TranslationResultData | null>(null)
  const [lastInput, setLastInput] = useState<RecipeInputType | null>(null)
  const [lastOptions, setLastOptions] = useState<{
    sourceLang: string
    targetLang: string
    targetRegion: string
  } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2400)
  }, [])

  const handleTranslate = useCallback(
    async (
      input: RecipeInputType,
      options: {
        sourceLang: string
        targetLang: string
        targetRegion: string
      }
    ) => {
      setLoading(true)
      setError(null)
      setLastInput(input)
      setLastOptions(options)

      try {
        const response = await axios.post('/api/translate', {
          dishName: input.dishName,
          ingredients: input.ingredients,
          steps: input.steps,
          sourceLang: options.sourceLang,
          targetLang: options.targetLang,
          targetRegion: options.targetRegion,
        })

        if (response.data.success && response.data.data) {
          setResult(response.data.data)
          setView('result')
        } else {
          setError(response.data.error || '翻译失败')
        }
      } catch (err: any) {
        console.error(err)
        setError(
          err.response?.data?.error ||
            err.message ||
            '网络错误，请检查后端服务是否启动'
        )
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleIngredientUpdate = useCallback((index: number, updated: ReplacedIngredient) => {
    setResult((prev) => {
      if (!prev) return prev
      const newIngredients = [...prev.ingredients]
      newIngredients[index] = updated
      return {
        ...prev,
        ingredients: newIngredients,
      }
    })
  }, [])

  const handleBack = useCallback(() => {
    setView('input')
  }, [])

  const contextValue = useMemo(() => ({ showToast }), [showToast])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span role="img" aria-label="chef">
            👨‍🍳
          </span>
          食谱翻译与适配平台
          <span role="img" aria-label="food">
            🍜
          </span>
        </h1>
        <p className="app-subtitle">跨语言食谱翻译 · 本地化食材替换 · 一键导出分享</p>
      </header>

      {error && (
        <div className="error-banner">
          <span role="img" aria-label="error">
            ⚠️
          </span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>出错了</div>
            <div style={{ fontSize: '0.9rem' }}>{error}</div>
          </div>
        </div>
      )}

      {view === 'input' ? (
        <RecipeInput
          onTranslate={handleTranslate