import { Router, Request, Response } from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = Router()

interface Poem {
  id: number
  title: string
  author: string
  dynasty: string
  genre: string
  lines: number
  content: string[]
}

let poemsData: Poem[] = []

try {
  const dataPath = join(__dirname, 'dataPoems.json')
  const rawData = readFileSync(dataPath, 'utf-8')
  poemsData = JSON.parse(rawData)
} catch (error) {
  console.error('加载诗词数据失败:', error)
}

router.get('/', (req: Request, res: Response) => {
  try {
    const { dynasty, author, genre } = req.query

    let filtered = [...poemsData]

    if (dynasty && typeof dynasty === 'string') {
      filtered = filtered.filter((p) => p.dynasty === dynasty)
    }

    if (author && typeof author === 'string') {
      filtered = filtered.filter((p) =>
        p.author.toLowerCase().includes(author.toLowerCase())
      )
    }

    if (genre && typeof genre === 'string') {
      filtered = filtered.filter((p) => p.genre === genre)
    }

    const result = filtered.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author,
      dynasty: p.dynasty,
      genre: p.genre,
      lines: p.lines,
      preview: p.content.slice(0, 2).join('，') + '...',
    }))

    res.json({
      success: true,
      total: result.length,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取诗词列表失败',
    })
  }
})

router.get('/filters', (req: Request, res: Response) => {
  try {
    const dynasties = [...new Set(poemsData.map((p) => p.dynasty))].sort()
    const genres = [...new Set(poemsData.map((p) => p.genre))].sort()
    const authors = [...new Set(poemsData.map((p) => p.author))].sort()

    res.json({
      success: true,
      data: {
        dynasties,
        genres,
        authors,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取筛选选项失败',
    })
  }
})

router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const poem = poemsData.find((p) => p.id === id)

    if (!poem) {
      res.status(404).json({
        success: false,
        message: '诗词不存在',
      })
      return
    }

    res.json({
      success: true,
      data: poem,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取诗词详情失败',
    })
  }
})

export default router
