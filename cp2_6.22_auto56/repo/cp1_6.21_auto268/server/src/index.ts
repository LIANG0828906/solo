import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import {
  createAuction,
  placeBid,
  getAuction,
  getAuctions,
  getBids,
  TIME_EXTEND_SECONDS
} from './auctionService'

const app = express()
const server = http.createServer(app)

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

app.get('/api/auctions', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10
  const status = req.query.status as string | undefined
  const keyword = req.query.keyword as string | undefined
  
  const result = getAuctions(page, pageSize, status, keyword)
  res.json(result)
})

app.get('/api/auctions/:id', (req, res) => {
  const auction = getAuction(req.params.id)
  if (!auction) {
    return res.status(404).json({ message: '拍卖不存在' })
  }
  res.json(auction)
})

app.post('/api/auctions', (req, res) => {
  try {
    const { title, description, startPrice, startTime, duration, creator } = req.body
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: '请输入商品标题' })
    }
    if (!creator || !creator.trim()) {
      return res.status(400).json({ message: '请输入发布者昵称' })
    }
    if (startPrice === undefined || startPrice < 1 || !Number.isInteger(startPrice)) {
      return res.status(400).json({ message: '起拍价必须为正整数' })
    }
    if (duration === undefined || duration < 3 || duration > 30) {
      return res.status(400).json({ message: '竞价时长需在3-30分钟之间' })
    }
    
    const auction = createAuction({
      title: title.trim(),
      description: description || '',
      startPrice,
      startTime,
      duration,
      creator: creator.trim()
    })
    
    io.emit('auction:created', auction)
    
    res.status(201).json(auction)
  } catch (err) {
    console.error('创建拍卖失败', err)
    res.status(500).json({ message: '创建拍卖失败' })
  }
})

app.get('/api/auctions/:id/bids', (req, res) => {
  const bids = getBids(req.params.id)
  res.json(bids)
})

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)
  
  socket.on('auction:join', (auctionId: string) => {
    socket.join(auctionId)
    console.log(`Socket ${socket.id} joined auction ${auctionId}`)
  })
  
  socket.on('auction:leave', (auctionId: string) => {
    socket.leave(auctionId)
    console.log(`Socket ${socket.id} left auction ${auctionId}`)
  })
  
  socket.on('bid:place', (data: { auctionId: string; bidder: string; amount: number }) => {
    const { auctionId, bidder, amount } = data
    
    const result = placeBid(auctionId, bidder, amount)
    
    if (result.success && result.bid) {
      const auction = getAuction(auctionId)
      
      io.to(auctionId).emit('bid:update', {
        auctionId,
        bid: result.bid,
        currentPrice: amount
      })
      
      if (auction) {
        io.to(auctionId).emit('time:extend', {
          auctionId,
          endTime: auction.endTime,
          extendedBy: TIME_EXTEND_SECONDS
        })
      }
      
      io.emit('auction:updated', {
        id: auctionId,
        currentPrice: amount,
        endTime: auction?.endTime
      })
    } else {
      socket.emit('bid:error', {
        auctionId,
        message: result.message || '出价失败'
      })
    }
  })
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Auction server running on port ${PORT}`)
  console.log(`WebSocket server ready`)
})

setInterval(() => {
  // 空循环，保持事件循环活跃
}, 1000)
