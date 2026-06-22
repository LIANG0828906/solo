import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const EVENTS_FILE = path.join(__dirname, 'data/events.json')
const ORDERS_FILE = path.join(__dirname, 'data/orders.json')

const app: express.Application = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

async function readEvents() {
  const data = await fs.readFile(EVENTS_FILE, 'utf-8')
  return JSON.parse(data)
}

async function writeEvents(events: any[]) {
  await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8')
}

async function readOrders() {
  const data = await fs.readFile(ORDERS_FILE, 'utf-8')
  return JSON.parse(data)
}

async function writeOrders(orders: any[]) {
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8')
}

app.get('/api/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await readEvents()
    res.json(events)
  } catch (error) {
    next(error)
  }
})

app.get('/api/events/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await readEvents()
    const event = events.find((e: any) => e.id === req.params.id)
    if (!event) {
      res.status(404).json({ error: 'Event not found' })
      return
    }
    res.json(event)
  } catch (error) {
    next(error)
  }
})

app.post('/api/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, date, venue, rows, cols, price } = req.body
    if (!name || !date || !venue || !rows || !cols || !price) {
      res.status(400).json({ error: 'Missing required fields: name, description, date, venue, rows, cols, price' })
      return
    }

    const seats = []
    for (let r = 0; r < rows; r++) {
      const row = []
      for (let c = 0; c < cols; c++) {
        row.push({ row: r, col: c, status: 'available' })
      }
      seats.push(row)
    }

    const newEvent = {
      id: uuidv4(),
      name,
      description: description || '',
      date,
      venue,
      rows,
      cols,
      price,
      seats,
      createdAt: new Date().toISOString(),
    }

    const events = await readEvents()
    events.push(newEvent)
    await writeEvents(events)

    res.status(201).json(newEvent)
  } catch (error) {
    next(error)
  }
})

app.get('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await readOrders()
    res.json(orders)
  } catch (error) {
    next(error)
  }
})

app.get('/api/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await readOrders()
    const order = orders.find((o: any) => o.id === req.params.id)
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }
    res.json(order)
  } catch (error) {
    next(error)
  }
})

app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, seats } = req.body
    if (!eventId || !seats || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ error: 'Missing required fields: eventId, seats (array of {row, col})' })
      return
    }

    const events = await readEvents()
    const event = events.find((e: any) => e.id === eventId)
    if (!event) {
      res.status(404).json({ error: 'Event not found' })
      return
    }

    for (const seat of seats) {
      const seatData = event.seats[seat.row]?.[seat.col]
      if (!seatData) {
        res.status(400).json({ error: `Seat row:${seat.row} col:${seat.col} does not exist` })
        return
      }
      if (seatData.status !== 'available') {
        res.status(400).json({ error: `Seat row:${seat.row} col:${seat.col} is not available` })
        return
      }
    }

    for (const seat of seats) {
      event.seats[seat.row][seat.col].status = 'sold'
    }

    const totalPrice = event.price * seats.length

    const newOrder = {
      id: uuidv4(),
      eventId,
      seats,
      totalPrice,
      createdAt: new Date().toISOString(),
    }

    await writeEvents(events)

    const orders = await readOrders()
    orders.push(newOrder)
    await writeOrders(orders)

    res.status(201).json(newOrder)
  } catch (error) {
    next(error)
  }
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
