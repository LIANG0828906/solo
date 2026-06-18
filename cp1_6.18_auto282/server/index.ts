import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'

const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'))
    }
  }
})

const adapter = new FileSync(path.join(__dirname, 'data.json'))
const db = lowdb(adapter)
db.defaults({ reports: [] }).write()

export type FacilityType = '长椅' | '路灯' | '垃圾桶' | '健身器材'
export type ReportStatus = '已提交' | '处理中' | '已完成'

export interface StatusRecord {
  status: ReportStatus
  timestamp: string
}

export interface Report {
  id: string
  facilityType: FacilityType
  description: string
  image?: string
  lat: number
  lng: number
  createdAt: string
  status: ReportStatus
  statusHistory: StatusRecord[]
}

type Database = {
  reports: Report[]
}

const dbTyped = db as any

function isValidFacilityType(type: string): type is FacilityType {
  return ['长椅', '路灯', '垃圾桶', '健身器材'].includes(type)
}

function isValidStatus(status: string): status is ReportStatus {
  return ['已提交', '处理中', '已完成'].includes(status)
}

app.get('/api/reports', (req, res) => {
  try {
    const { type, status, page, limit } = req.query

    let reports: Report[] = [...(dbTyped.get('reports').value() || [])]

    if (type && typeof type === 'string' && isValidFacilityType(type)) {
      reports = reports.filter(r => r.facilityType === type)
    }

    if (status && typeof status === 'string' && isValidStatus(status)) {
      reports = reports.filter(r => r.status === status)
    }

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const pageNum = parseInt(page as string) || 1
    const limitNum = parseInt(limit as string) || 10
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedReports = reports.slice(startIndex, endIndex)

    res.json({
      reports: paginatedReports,
      total: reports.length,
      page: pageNum,
      totalPages: Math.ceil(reports.length / limitNum)
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ error: '获取上报记录失败' })
  }
})

app.get('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params
    const report = dbTyped.get('reports').find({ id }).value() as Report | undefined

    if (!report) {
      return res.status(404).json({ error: '上报记录不存在' })
    }

    res.json(report)
  } catch (error) {
    console.error('Error fetching report:', error)
    res.status(500).json({ error: '获取上报详情失败' })
  }
})

app.post('/api/reports', upload.single('image'), (req, res) => {
  try {
    const { facilityType, description, lat, lng } = req.body

    if (!facilityType || !isValidFacilityType(facilityType)) {
      return res.status(400).json({ error: '无效的设施类型' })
    }

    if (!description || description.length > 200) {
      return res.status(400).json({ error: '描述内容不能为空且不能超过200字' })
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ error: '无效的坐标' })
    }

    let imageBase64: string | undefined
    if (req.file) {
      imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    }

    const now = new Date().toISOString()
    const newReport: Report = {
      id: uuidv4(),
      facilityType,
      description,
      image: imageBase64,
      lat: latNum,
      lng: lngNum,
      createdAt: now,
      status: '已提交',
      statusHistory: [
        {
          status: '已提交',
          timestamp: now
        }
      ]
    }

    dbTyped.get('reports').push(newReport).write()

    res.status(201).json(newReport)
  } catch (error) {
    console.error('Error creating report:', error)
    res.status(500).json({ error: '创建上报记录失败' })
  }
})

app.patch('/api/reports/:id/status', (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !isValidStatus(status)) {
      return res.status(400).json({ error: '无效的状态' })
    }

    const report = dbTyped.get('reports').find({ id }).value() as Report | undefined

    if (!report) {
      return res.status(404).json({ error: '上报记录不存在' })
    }

    const now = new Date().toISOString()
    dbTyped.get('reports')
      .find({ id })
      .assign({
        status,
        statusHistory: [
          {
            status,
            timestamp: now
          },
          ...report.statusHistory
        ]
      })
      .write()

    const updatedReport = dbTyped.get('reports').find({ id }).value() as Report
    res.json(updatedReport)
  } catch (error) {
    console.error('Error updating report status:', error)
    res.status(500).json({ error: '更新状态失败' })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
