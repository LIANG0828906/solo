import express from 'express'
import cors from 'cors'
import { translateText } from './translate'
import { recordsStore } from './records'
import type { ChatMessage } from '../src/store'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.post('/api/translate', async (req, res) => {
  try {
    const { text, source, target } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid text' })
    }

    const translated = await translateText(text, source || 'zh', target || 'en')

    const record: ChatMessage = {
      id: Date.now().toString(),
      original: text,
      translated,
      timestamp: Date.now(),
      sourceLang: source || 'zh',
      targetLang: target || 'en',
    }
    recordsStore.addRecord(record)

    res.json({ translated, record })
  } catch (e) {
    console.error('Translate error:', e)
    res.status(500).json({ error: 'Translation failed' })
  }
})

app.get('/api/records', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const records = recordsStore.getRecords(limit)
    res.json({ records, count: records.length })
  } catch (e) {
    console.error('Get records error:', e)
    res.status(500).json({ error: 'Failed to get records' })
  }
})

app.delete('/api/records/:id', (req, res) => {
  try {
    const deleted = recordsStore.deleteRecord(req.params.id)
    res.json({ success: deleted })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete record' })
  }
})

app.delete('/api/records', (req, res) => {
  try {
    recordsStore.clearAll()
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear records' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, () => {
  console.log(`语伴魔镜服务已启动: http://localhost:${PORT}`)
})
