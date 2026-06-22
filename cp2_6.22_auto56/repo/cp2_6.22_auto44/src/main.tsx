import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import CalendarView from '@/components/CalendarView'
import ResourcePanel from '@/components/ResourcePanel'
import AdminPanel from '@/components/AdminPanel'
import './index.css'
import { wsService } from '@/services/websocketService'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/appStore'
import { v4 as uuid } from 'uuid'

wsService.connect()

useAppStore.subscribe((state, prev) => {
  // no-op initializer; actual setup done via effect in App
})

async function bootstrap() {
  try {
    const [rooms, devices, bookings] = await Promise.all([
      apiService.getRooms(),
      apiService.getDevices(),
      apiService.getBookings(),
    ])
    const setRooms = useAppStore.getState().setRooms
    const setDevices = useAppStore.getState().setDevices
    const setBookings = useAppStore.getState().setBookings
    setRooms(rooms)
    setDevices(devices)
    setBookings(bookings)
  } catch (e) {
    console.error('bootstrap failed', e)
  }
}
bootstrap()

wsService.on('booking:created', (booking) => {
  useAppStore.getState().addBooking(booking)
  useAppStore.getState().addToast({
    id: uuid(),
    type: 'info',
    message: `新会议已创建：${booking.title}`,
    bookingId: booking.id,
  })
})
wsService.on('booking:deleted', (payload) => {
  useAppStore.getState().removeBooking(payload.id)
})
wsService.on('device:updated', (device) => {
  useAppStore.getState().updateDevice(device)
  const statusText =
    device.status === 'maintenance'
      ? '已进入维护模式'
      : device.status === 'idle'
        ? '恢复为空闲状态'
        : '状态已更新'
  useAppStore.getState().addNotification({
    id: uuid(),
    type: device.status === 'maintenance' ? 'warning' : 'info',
    message: `设备「${device.name}」${statusText}`,
    timestamp: Date.now(),
  })
})
wsService.on('notification', (n) => {
  if (n.bookingId) {
    useAppStore.getState().addToast({
      id: n.id,
      type: n.type,
      message: n.message,
      bookingId: n.bookingId,
    })
  } else {
    useAppStore.getState().addNotification(n)
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<CalendarView />} />
          <Route path="resources" element={<ResourcePanel />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
