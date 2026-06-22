import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

const PRESETS_FILE = path.join(__dirname, 'presets.json')

app.use(cors())
app.use(express.json())

function readPresets(): any[] {
  try {
    const data = fs.readFileSync(PRESETS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    return []
  }
}

function writePresets(presets: any[]): void {
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8')
}

app.get('/api/presets', (_req, res) => {
  try {
    const presets = readPresets()
    res.json(presets)
  } catch (err) {
    res.status(500).json({ error: '加载预设列表失败' })
  }
})

app.post('/api/presets', (req, res) => {
  try {
    const { name, filters } = req.body

    if (!name || !filters) {
      return res.status(400).json({ error: '缺少必要参数: name 和 filters' })
    }

    const presets = readPresets()

    const newPreset = {
      id: uuidv4(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    }

    presets.push(newPreset)
    writePresets(presets)

    res.status(201).json(newPreset)
  } catch (err) {
    res.status(500).json({ error: '保存预设失败' })
  }
})

app.delete('/api/presets/:id', (req, res) => {
  try {
    const { id } = req.params
    const presets = readPresets()
    const filteredPresets = presets.filter((p: any) => p.id !== id)

    if (presets.length === filteredPresets.length) {
      return res.status(404).json({ error: '预设不存在' })
    }

    writePresets(filteredPresets)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: '删除预设失败' })
  }
})

app.listen(PORT, () => {
  console.log(`滤镜调色盘后端服务运行在 http://localhost:${PORT}`)
})
