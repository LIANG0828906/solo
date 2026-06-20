import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const recipesPath = path.join(__dirname, 'recipes.json')

const readRecipes = () => {
  const data = fs.readFileSync(recipesPath, 'utf-8')
  return JSON.parse(data)
}

app.get('/api/recipes', (req, res) => {
  try {
    const recipes = readRecipes()
    const { search, limit, offset } = req.query
    let result = recipes

    if (search) {
      const keyword = String(search).toLowerCase()
      result = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(keyword) ||
          r.author.toLowerCase().includes(keyword) ||
          r.category.toLowerCase().includes(keyword)
      )
    }

    if (limit) {
      const lim = parseInt(String(limit))
      const off = offset ? parseInt(String(offset)) : 0
      result = result.slice(off, off + lim)
    }

    setTimeout(() => {
      res.json({ success: true, data: result, total: result.length })
    }, 200)
  } catch (error) {
    res.status(500).json({ success: false, message: '获取食谱列表失败' })
  }
})

app.get('/api/recipes/suggest', (req, res) => {
  try {
    const recipes = readRecipes()
    const { search } = req.query
    if (!search) {
      return res.json({ success: true, data: [] })
    }
    const keyword = String(search).toLowerCase()
    const suggestions = recipes
      .filter((r) => r.name.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: r.name, thumbnail: r.thumbnail }))

    res.json({ success: true, data: suggestions })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取搜索建议失败' })
  }
})

app.get('/api/recipes/:id', (req, res) => {
  try {
    const recipes = readRecipes()
    const recipe = recipes.find((r) => r.id === req.params.id)

    if (!recipe) {
      return res.status(404).json({ success: false, message: '食谱不存在' })
    }

    setTimeout(() => {
      res.json({ success: true, data: recipe })
    }, 200)
  } catch (error) {
    res.status(500).json({ success: false, message: '获取食谱详情失败' })
  }
})

app.get('/api/favorites', (req, res) => {
  res.json({ success: true, data: [] })
})

app.listen(PORT, () => {
  console.log(`Recipe API server running on http://localhost:${PORT}`)
})
