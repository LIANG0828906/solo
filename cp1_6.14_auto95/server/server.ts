import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import cron from 'node-cron'
import { initDatabase, getDatabase } from './db/index.js'
import type { Loan } from './types/index.js'

const app: express.Application = express()

const startCronJobs = (): void => {
  cron.schedule('0 0 1 * * *', () => {
    console.log('Running daily overdue check...')

    try {
      const db = getDatabase()
      if (!db.data) return

      const now = new Date()
      let updatedCount = 0

      db.data.loans = db.data.loans.map((loan: Loan) => {
        if (loan.status === 'active') {
          const dueDate = new Date(loan.dueDate)
          if (now > dueDate) {
            const overdueDays = Math.floor(
              (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
            )
            const fineAmount = Math.round(
              overdueDays * db.data!.config.overdueFinePerDay * 100,
            ) / 100
            updatedCount++
            return {
              ...loan,
              status: 'overdue' as const,
              fineAmount,
              updatedAt: now.toISOString(),
            }
          }
        }
        return loan
      })

      db.write()
      console.log(`Overdue check complete. Updated ${updatedCount} loans.`)
    } catch (error) {
      console.error('Error in daily overdue check:', error)
    }
  })

  console.log('Cron jobs started')
}

export const startServer = async (): Promise<void> => {
  try {
    await initDatabase()
    console.log('Database initialized successfully')

    app.use(cors())
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    app.get('/api/health', (_req: Request, res: Response): void => {
      res.status(200).json({
        success: true,
        message: 'Library Management System API is running',
        timestamp: new Date().toISOString(),
      })
    })

    app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', error)
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
      })
    })

    app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'API 路由不存在',
      })
    })

    const PORT = process.env.PORT || 3001

    app.listen(PORT, () => {
      console.log(`Library Management Server is running on port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
    })

    startCronJobs()
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

export default app
