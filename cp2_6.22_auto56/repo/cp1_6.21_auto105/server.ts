import express, { type Request, type Response } from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
// @ts-ignore
import { EPub } from 'js-epub-reader'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, 'server', 'data')
const TEMP_DIR = path.join(__dirname, 'temp')
const BOOKS_FILE = path.join(DATA_DIR, 'books.json')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

interface Chapter {
  id: string
  title: string
  content: string
}

interface BookProgress {
  currentChapter: number
  scrollPosition: number
  updatedAt: string
}

interface Book {
  id: string
  title: string
  cover?: string
  chapters: Chapter[]
  totalChapters: number
  uploadedAt: string
  progress?: BookProgress
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

const readBooksData = (): Book[] => {
  if (!fs.existsSync(BOOKS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(BOOKS_FILE, 'utf-8')
    return JSON.parse(data) as Book[]
  } catch {
    return []
  }
}

const writeBooksData = (books: Book[]): void => {
  fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2), 'utf-8')
}

const parseTxtByChapters = (content: string): Chapter[] => {
  const chapterRegex = /(第[一二三四五六七八九十百千零\d]+[章节部卷][\s、．。：:]*.*?)(?=\n第[一二三四五六七八九十百千零\d]+[章节部卷]|\n$)/gs
  const matches = content.match(chapterRegex)
  
  const chapters: Chapter[] = []
  
  if (matches && matches.length > 0) {
    matches.forEach((match, index) => {
      const firstLineEnd = match.indexOf('\n')
      const title = firstLineEnd !== -1 
        ? match.slice(0, firstLineEnd).trim() 
        : `第${index + 1}章`
      const chapterContent = firstLineEnd !== -1 
        ? match.slice(firstLineEnd + 1).trim() 
        : ''
      
      chapters.push({
        id: uuidv4(),
        title,
        content: chapterContent,
      })
    })
  } else {
    chapters.push({
      id: uuidv4(),
      title: '正文',
      content,
    })
  }
  
  return chapters
}

const parseEpub = async (filePath: string): Promise<{ title: string; cover?: string; chapters: Chapter[] }> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const epub = new EPub(data)
      
      epub.parse()
        .then(() => {
          const title = epub.metadata.title || '未知书名'
          const cover = epub.metadata.cover || undefined
          
          const chapters: Chapter[] = epub.flow.map((chapter: any, index: number) => ({
            id: uuidv4(),
            title: chapter.title || `第${index + 1}章`,
            content: chapter.content || '',
          }))
          
          resolve({ title, cover, chapters })
        })
        .catch((parseErr: Error) => {
          reject(parseErr)
        })
    })
  })
}

app.post('/api/books', upload.single('file'), async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '未上传文件',
      })
      return
    }

    const filePath = req.file.path
    const originalName = req.file.originalname
    const ext = path.extname(originalName).toLowerCase()

    let title = path.basename(originalName, ext)
    let cover: string | undefined
    let chapters: Chapter[] = []

    try {
      if (ext === '.epub') {
        const epubData = await parseEpub(filePath)
        title = epubData.title || title
        cover = epubData.cover
        chapters = epubData.chapters
      } else if (ext === '.txt') {
        const content = fs.readFileSync(filePath, 'utf-8')
        chapters = parseTxtByChapters(content)
      } else {
        res.status(400).json({
          success: false,
          error: '不支持的文件格式，仅支持 .epub 和 .txt',
        })
        fs.unlinkSync(filePath)
        return
      }
    } catch (parseErr) {
      res.status(500).json({
        success: false,
        error: `文件解析失败: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      })
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    const newBook: Book = {
      id: uuidv4(),
      title,
      cover,
      chapters,
      totalChapters: chapters.length,
      uploadedAt: new Date().toISOString(),
    }

    const books = readBooksData()
    books.unshift(newBook)
    writeBooksData(books)

    res.json({
      success: true,
      data: newBook,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `服务器错误: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
})

app.get('/api/books', (req: Request, res: Response<ApiResponse<Book[]>>) => {
  try {
    const books = readBooksData()
    res.json({
      success: true,
      data: books,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `获取书籍列表失败: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
})

app.put('/api/books/:id/progress', (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params
    const { currentChapter, scrollPosition } = req.body

    if (typeof currentChapter !== 'number' || typeof scrollPosition !== 'number') {
      res.status(400).json({
        success: false,
        error: '参数错误：currentChapter 和 scrollPosition 必须为数字',
      })
      return
    }

    const books = readBooksData()
    const bookIndex = books.findIndex((b) => b.id === id)

    if (bookIndex === -1) {
      res.status(404).json({
        success: false,
        error: '书籍不存在',
      })
      return
    }

    books[bookIndex].progress = {
      currentChapter,
      scrollPosition,
      updatedAt: new Date().toISOString(),
    }

    writeBooksData(books)

    res.json({
      success: true,
      data: books[bookIndex].progress,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `保存进度失败: ${err instanceof Error ? err.message : String(err)}`,
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

export default app
