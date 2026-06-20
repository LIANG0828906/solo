import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 4000
const SAVE_DIR = path.join(__dirname, '..', 'saves')

app.use(cors())
app.use(express.json({ limit: '50mb' }))

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true })
}

app.post('/api/save', (req, res) => {
  try {
    const levelData = req.body
    const timestamp = Date.now()
    const filename = `level_${timestamp}.json`
    const filepath = path.join(SAVE_DIR, filename)

    fs.writeFileSync(filepath, JSON.stringify(levelData, null, 2))

    res.json({
      success: true,
      message: '关卡保存成功',
      filename,
      filepath
    })
  } catch (error) {
    console.error('保存失败:', error)
    res.status(500).json({
      success: false,
      message: '关卡保存失败'
    })
  }
})

app.post('/api/load', (req, res) => {
  try {
    const { filename } = req.body
    if (!filename) {
      const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.json'))
      if (files.length === 0) {
        return res.status(404).json({
          success: false,
          message: '没有找到保存的关卡文件'
        })
      }
      const latestFile = files.sort().reverse()[0]
      const filepath = path.join(SAVE_DIR, latestFile)
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      return res.json({
        success: true,
        data,
        filename: latestFile
      })
    }

    const filepath = path.join(SAVE_DIR, filename)
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      })
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
    res.json({
      success: true,
      data,
      filename
    })
  } catch (error) {
    console.error('加载失败:', error)
    res.status(500).json({
      success: false,
      message: '关卡加载失败'
    })
  }
})

app.get('/api/saves', (_req, res) => {
  try {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.json'))
    res.json({
      success: true,
      files: files.sort().reverse()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取文件列表失败'
    })
  }
})

app.listen(PORT, () => {
  console.log(`关卡编辑器后端服务运行在 http://localhost:${PORT}`)
})
