import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import type { CodeSnippet, CreateSnippetRequest } from '../../src/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const DATA_FILE = path.join(__dirname, '..', 'data', 'snippets.json')

let snippetsCache: CodeSnippet[] | null = null

const readSnippets = (): CodeSnippet[] => {
  if (snippetsCache !== null) {
    return snippetsCache
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8')
      snippetsCache = JSON.parse(data)
      return snippetsCache
    }
  } catch (error) {
    console.error('读取片段数据失败:', error)
  }
  snippetsCache = []
  return snippetsCache
}

const writeSnippets = (snippets: CodeSnippet[]): void => {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(snippets, null, 2), 'utf-8')
    snippetsCache = snippets
  } catch (error) {
    console.error('写入片段数据失败:', error)
    throw error
  }
}

router.get('/', (_req: Request, res: Response<CodeSnippet[]>) => {
  try {
    const snippets = readSnippets()
    res.json(snippets)
  } catch (error) {
    res.status(500).json([] as unknown as CodeSnippet[])
  }
})

router.get('/:id', (req: Request<{ id: string }>, res: Response<CodeSnippet | { error: string }>) => {
  try {
    const snippets = readSnippets()
    const snippet = snippets.find(s => s.id === req.params.id)
    if (snippet) {
      res.json(snippet)
    } else {
      res.status(404).json({ error: '片段不存在' })
    }
  } catch (error) {
    res.status(500).json({ error: '服务器错误' })
  }
})

router.post('/', (req: Request<unknown, unknown, CreateSnippetRequest>, res: Response<CodeSnippet | { error: string }>) => {
  try {
    const { name, description, html, css, javascript } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: '片段名称不能为空' })
    }

    if (name.length > 40) {
      return res.status(400).json({ error: '片段名称不能超过40个字符' })
    }

    if (description && description.length > 200) {
      return res.status(400).json({ error: '片段描述不能超过200个字符' })
    }

    const now = Date.now()
    const newSnippet: CodeSnippet = {
      id: uuidv4(),
      name: name.trim(),
      description: description ? description.trim() : '',
      html: html || '',
      css: css || '',
      javascript: javascript || '',
      createdAt: now,
      updatedAt: now,
    }

    const snippets = readSnippets()
    snippets.unshift(newSnippet)
    writeSnippets(snippets)

    res.status(201).json(newSnippet)
  } catch (error) {
    console.error('创建片段失败:', error)
    res.status(500).json({ error: '创建片段失败' })
  }
})

router.delete('/:id', (req: Request<{ id: string }>, res: Response<{ success: boolean; error?: string }>) => {
  try {
    const snippets = readSnippets()
    const index = snippets.findIndex(s => s.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ success: false, error: '片段不存在' })
    }

    snippets.splice(index, 1)
    writeSnippets(snippets)

    res.json({ success: true })
  } catch (error) {
    console.error('删除片段失败:', error)
    res.status(500).json({ success: false, error: '删除片段失败' })
  }
})

export default router
