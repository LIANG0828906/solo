import express, { Request, Response } from 'express'
import cors from 'cors'
import multer from 'multer'
import { matchRecipes, simulateIdentification } from './services/recipeMatcher'
import { IdentifyResponse, RecipeRequest, RecipeResponse } from '../shared/types'

const app = express()
const PORT = 3002

const storage = multer.memoryStorage()
const upload = multer({ storage })

app.use(cors())
app.use(express.json())

app.post('/api/identify', upload.array('images', 9), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    const imageCount = files?.length || 1

    const { ingredients, processingTime } = simulateIdentification(imageCount)

    await new Promise(resolve => setTimeout(resolve, processingTime))

    const response: IdentifyResponse = {
      success: true,
      ingredients,
      processingTime
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '识别失败，请重试'
    })
  }
})

app.post('/api/recipes', (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body as RecipeRequest

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        error: '参数错误：ingredients 应为数组'
      })
    }

    const matchedRecipes = matchRecipes(ingredients)

    const response: RecipeResponse = {
      success: true,
      recipes: matchedRecipes,
      total: matchedRecipes.length
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取食谱失败，请重试'
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
