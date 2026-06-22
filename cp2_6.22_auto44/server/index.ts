import express from 'express'
import http from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import { dataStore } from './dataStore'
import type { BookingCreateInput, DeviceStatus, AppNotification } from '../src/types'

const PORT = 3002

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new SocketServer(server, {
  cors: { origin: '*' },
})

// Helper to broadcast to all clients
function broadcast(event: string, data: unknown) {
  io.emit(event, data)
}

// REST endpoints
app.get('/api/rooms', (_req, res) => {
  res.json(dataStore.getRooms())
})

app.get('/api/devices', (_req, res) => {
  res.json(dataStore.getDevices())
})

app.put('/api/devices/:id', (req, res) => {
  const id = req.params.id
  const { status, roomId } = req.body as { status?: DeviceStatus; roomId?: string | null }
  if (!status || !['idle', 'occupied', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: '非法状态值' })
  }
  const updated = dataStore.updateDeviceStatus(id, status, roomId)
  if (!updated) return res.status(404).json({ error: '设备不存在' })
  broadcast('device:updated', updated)
  const notif: AppNotification = {
    id: uuid(),
    type: status === 'maintenance' ? 'warning' : 'info',
    message:
      status === 'maintenance'
        ? `设备「${updated.name}」已进入维护模式`
        : `设备「${updated.name}」状态已更新`,
    timestamp: Date.now(),
  }
  broadcast('notification', notif)
  res.json(updated)
})

app.get('/api/bookings', (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string }
  res.json(dataStore.getBookings(startDate, endDate))
})

app.post('/api/bookings', (req, res) => {
  const input = req.body as BookingCreateInput
  const result = dataStore.createBooking(input)
  if (result.error) {
    return res.status(409).json({ error: result.error })
  }
  broadcast('booking:created', result.booking)
  // refresh devices status broadcast
  dataStore.getDevices().forEach((d) => broadcast('device:updated', d))
  res.json(result.booking)
})

app.delete('/api/bookings/:id', (req, res) => {
  const id = req.params.id
  const result = dataStore.deleteBooking(id)
  if (!result.success) {
    return res.status(404).json({ success: false, error: result.reason || '操作失败' })
  }
  broadcast('booking:deleted', { id, reason: '管理员取消' })
  // refresh devices status broadcast
  dataStore.getDevices().forEach((d) => broadcast('device:updated', d))
  res.json({ success: true })
})

app.get('/api/bookings/export', (req, res) => {
  const days = Number(req.query.days) || 7
  const csv = dataStore.exportCsv(days)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="meetings-${new Date().toISOString().slice(0, 10)}.csv"`
  )
  res.send('\uFEFF' + csv)
})

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`[WS] client connected: ${socket.id}`)
  socket.on('disconnect', () => {
    console.log(`[WS] client disconnected: ${socket.id}`)
  })
})

server.listen(PORT, () => {
  console.log(`[Server] running on http://localhost:${PORT}`)
})
