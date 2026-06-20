import express from 'express'
import session from 'express-session'
import { translateText, translateBatch } from './translator.js'
import { replaceIngredients, getAvailableRegions, updateReplacement, type ReplacedIngredient } from './replacer.js'

const app = express()
const PORT = 3001

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: 'recipe-translator-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

interface TranslateRequest {
  dishName: string
  ingredients: string[]
  steps: string[]
  sourceLang: string
  targetLang: string
  targetRegion: string
}

interface TranslateResponse {
  success: boolean
  data?: {
    dishName: { original: string; translated: string }
    ingredients: ReplacedIngredient[]
    steps: { original: string; translated: string }[]
    region: string
    sourceLang: string
    targetLang: string
  }
  error?: string
}

app.post('/api/translate', async (req, res) => {
  try {
    const body = req.body as TranslateRequest
    const {
      dishName,
      ingredients,
      steps,
      sourceLang = 'zh',
      targetLang = 'en',
      targetRegion = 'US',
    } = body

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      res.status(400).json({ success: false, error: '食材列表不能为空' })
      return
    }

    const startTime = Date.now()

    const [dishNameResult, translatedIngredients, translatedSteps] = await Promise.all([
      translateText(dishName || '未命名菜品', sourceLang, targetLang),
      translateBatch(ingredients, sourceLang, targetLang),
      translateBatch(steps || [], sourceLang, targetLang),
    ])

    const replacedIngredients = replaceIngredients(
      ingredients,
      translatedIngredients,
      targetRegion
    )

    const stepsResult = steps.map((s, idx) => ({
      original: s,
      translated: translatedSteps[idx]?.text || s,
    }))

    const elapsed = Date.now() - startTime
    console.log(`[Translate] Completed in ${elapsed}ms`)

    const response: TranslateResponse = {
      success: true,
      data: {
        dishName: {
          original: dishName || '未命名菜品',
          translated: dishNameResult.text,
        },
        ingredients: replacedIngredients,
        steps: stepsResult,
        region: targetRegion,
        sourceLang,
        targetLang,
      },
    }

    req.session.lastResult = response.data
    res.json(response)
  } catch (error) {
    console.error('[Translate Error]', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '翻译服务出错',
    })
  }
})

interface ReplaceRequest {
  ingredient: ReplacedIngredient
  replacementIndex: number
}

app.post('/api/replace', (req, res) => {
  try {
    const { ingredient, replacementIndex } = req.body as ReplaceRequest

    if (!ingredient || typeof replacementIndex !== 'number') {
      res.status(400).json({ success: false, error: '参数错误' })
      return
    }

    const updated = updateReplacement(ingredient, replacementIndex)

    res.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('[Replace Error]', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '替换服务出错',
    })
  }
})

app.get('/api/regions', (_req, res) => {
  res.json({
    success: true,
    data: getAvailableRegions(),
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🍳 Recipe Translator Server running on http://localhost:${PORT}`)
  console.log(`   Regions available: ${getAvailableRegions().join(', ')}`)
})
