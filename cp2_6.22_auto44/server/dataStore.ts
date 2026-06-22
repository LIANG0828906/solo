import { v4 as uuid } from 'uuid'
import type {
  MeetingRoom,
  Device,
  Booking,
  BookingCreateInput,
  DeviceStatus,
} from '../src/types'

const rooms: MeetingRoom[] = [
  { id: 'room-1', name: '创新厅', capacity: 10, location: '1F-A区', color: '#2874ec' },
  { id: 'room-2', name: '协作间', capacity: 6, location: '2F-B区', color: '#10b981' },
  { id: 'room-3', name: '董事会议室', capacity: 20, location: '3F-东区', color: '#8b5cf6' },
  { id: 'room-4', name: '专注舱', capacity: 4, location: '1F-B区', color: '#f59e0b' },
  { id: 'room-5', name: '培训室', capacity: 30, location: 'B1-多功能区', color: '#ef4444' },
]

const devices: Device[] = [
  { id: 'dev-1', name: '爱普生投影机-01', type: 'projector', roomId: 'room-1', status: 'idle' },
  { id: 'dev-2', name: '玻璃白板-A1', type: 'whiteboard', roomId: 'room-1', status: 'idle' },
  { id: 'dev-3', name: '腾讯会议系统-01', type: 'video_conference', roomId: 'room-1', status: 'idle' },

  { id: 'dev-4', name: '明基投影机-02', type: 'projector', roomId: 'room-2', status: 'idle' },
  { id: 'dev-5', name: '玻璃白板-A2', type: 'whiteboard', roomId: 'room-2', status: 'idle' },

  { id: 'dev-6', name: '巴可投影机-03', type: 'projector', roomId: 'room-3', status: 'idle' },
  { id: 'dev-7', name: '智能白板-Pro', type: 'whiteboard', roomId: 'room-3', status: 'idle' },
  { id: 'dev-8', name: 'Polycom视频系统', type: 'video_conference', roomId: 'room-3', status: 'idle' },

  { id: 'dev-9', name: '便携投影-01', type: 'projector', roomId: 'room-4', status: 'idle' },
  { id: 'dev-10', name: '桌面白板', type: 'whiteboard', roomId: 'room-4', status: 'maintenance' },

  { id: 'dev-11', name: '高流明工程投影', type: 'projector', roomId: 'room-5', status: 'idle' },
  { id: 'dev-12', name: '超大书写白板', type: 'whiteboard', roomId: 'room-5', status: 'idle' },
  { id: 'dev-13', name: '直播录播一体机', type: 'video_conference', roomId: 'room-5', status: 'idle' },
]

function buildBooking(
  title: string,
  roomId: string,
  dayOffset: number,
  startHour: number,
  endHour: number,
  participants: number,
  deviceIds: string[],
  createdBy = '李小明'
): Booking {
  const now = new Date()
  now.setDate(now.getDate() + dayOffset)
  now.setHours(startHour, 0, 0, 0)
  const s = new Date(now).toISOString()
  now.setHours(endHour, 0, 0, 0)
  const e = new Date(now).toISOString()
  return {
    id: uuid(),
    title,
    roomId,
    startTime: s,
    endTime: e,
    participants,
    deviceIds,
    notes: '',
    createdBy,
    attendees: [],
  }
}

const bookings: Booking[] = [
  buildBooking('产品设计评审', 'room-1', 0, 9, 11, 8, ['dev-1', 'dev-2', 'dev-3'], '张经理'),
  buildBooking('项目周会', 'room-2', 0, 10, 11, 5, ['dev-4'], '王工'),
  buildBooking('季度战略会', 'room-3', 0, 14, 17, 18, ['dev-6', 'dev-8'], 'CEO'),
  buildBooking('一对一沟通', 'room-4', 1, 10, 10 + 1, 2, [], 'HR-Lily'),
  buildBooking('新员工入职培训', 'room-5', 1, 9, 12, 25, ['dev-11', 'dev-13'], '培训部'),
  buildBooking('技术分享会', 'room-1', 1, 15, 17, 10, ['dev-1', 'dev-3'], '架构组'),
  buildBooking('客户演示会议', 'room-3', 2, 10, 12, 12, ['dev-6', 'dev-7', 'dev-8'], '销售部'),
  buildBooking('需求讨论', 'room-2', 2, 14, 16, 6, ['dev-4', 'dev-5'], '产品组'),
  buildBooking('绩效复盘会', 'room-1', 3, 10, 12, 7, ['dev-2'], '部门经理'),
  buildBooking('远程面试', 'room-4', 3, 14, 15, 3, ['dev-9'], 'HR'),
  buildBooking('全员大会', 'room-5', 4, 10, 12, 28, ['dev-11', 'dev-12', 'dev-13'], '行政部'),
  buildBooking('代码Review', 'room-2', 4, 15, 17, 5, ['dev-4'], '研发组'),
  buildBooking('运营数据复盘', 'room-1', 5, 9, 11, 8, ['dev-1', 'dev-3'], '运营部'),
  buildBooking('供应商沟通', 'room-3', 5, 14, 16, 10, ['dev-8'], '采购部'),
  buildBooking('内部培训', 'room-5', 6, 14, 17, 22, ['dev-11'], '培训部'),
]

function overlap(a: Booking, b: Booking) {
  const as = new Date(a.startTime).getTime()
  const ae = new Date(a.endTime).getTime()
  const bs = new Date(b.startTime).getTime()
  const be = new Date(b.endTime).getTime()
  return as < be && bs < ae
}

export const dataStore = {
  getRooms(): MeetingRoom[] {
    return JSON.parse(JSON.stringify(rooms))
  },
  getDevices(): Device[] {
    return JSON.parse(JSON.stringify(devices))
  },
  updateDeviceStatus(id: string, status: DeviceStatus, roomId?: string | null): Device | null {
    const dev = devices.find((d) => d.id === id)
    if (!dev) return null
    dev.status = status
    if (roomId !== undefined) dev.roomId = roomId
    return JSON.parse(JSON.stringify(dev))
  },
  getBookings(startDate?: string, endDate?: string): Booking[] {
    let result = bookings
    if (startDate) {
      const t = new Date(startDate).getTime()
      result = result.filter((b) => new Date(b.endTime).getTime() >= t)
    }
    if (endDate) {
      const t = new Date(endDate).getTime()
      result = result.filter((b) => new Date(b.startTime).getTime() <= t)
    }
    return JSON.parse(JSON.stringify(result))
  },
  createBooking(input: BookingCreateInput): { booking?: Booking; error?: string } {
    // Validations
    if (!input.title.trim()) return { error: '会议名称不能为空' }
    if (new Date(input.endTime) <= new Date(input.startTime))
      return { error: '结束时间必须晚于开始时间' }
    const room = rooms.find((r) => r.id === input.roomId)
    if (!room) return { error: '会议室不存在' }
    if (input.participants > room.capacity)
      return { error: `参与人数超过会议室容量（最大 ${room.capacity} 人）` }

    // Check maintenance devices
    const maintenanceDevs = devices.filter(
      (d) => input.deviceIds.includes(d.id) && d.status === 'maintenance'
    )
    if (maintenanceDevs.length) {
      return {
        error: `设备「${maintenanceDevs.map((d) => d.name).join('、')}」正在维护，请更换其他时间或设备`,
      }
    }

    // Check device availability across overlapping bookings (same or different room)
    for (const existing of bookings) {
      const candidate: Booking = {
        ...input,
        id: 'tmp',
        createdBy: 'tmp',
        attendees: input.attendees || [],
      }
      if (!overlap(existing, candidate)) continue
      if (existing.roomId === candidate.roomId) {
        return { error: `会议室时段冲突：与「${existing.title}」重叠` }
      }
      // device conflict across different rooms
      const shared = existing.deviceIds.find((id) =>
        candidate.deviceIds.includes(id)
      )
      if (shared) {
        const dev = devices.find((d) => d.id === shared)
        return {
          error: `设备冲突：「${
            dev?.name || shared
          }」已被「${existing.title}」占用`,
        }
      }
    }

    const booking: Booking = {
      id: uuid(),
      title: input.title.trim(),
      roomId: input.roomId,
      startTime: input.startTime,
      endTime: input.endTime,
      participants: input.participants,
      deviceIds: input.deviceIds,
      notes: input.notes || '',
      createdBy: '李小明',
      attendees: input.attendees || [],
    }
    bookings.unshift(booking)

    // Update relevant devices to occupied during the booking (logically)
    // We keep the status mechanism simple: devices in maintenance remain as-is,
    // idle/occupied reflects whether currently (system "now") in a booking period.
    this.refreshDeviceOccupiedStatus()

    return { booking: JSON.parse(JSON.stringify(booking)) }
  },
  deleteBooking(id: string): { success: boolean; reason?: string } {
    const idx = bookings.findIndex((b) => b.id === id)
    if (idx < 0) return { success: false, reason: '会议不存在' }
    bookings.splice(idx, 1)
    this.refreshDeviceOccupiedStatus()
    return { success: true }
  },
  refreshDeviceOccupiedStatus() {
    const now = Date.now()
    for (const dev of devices) {
      if (dev.status === 'maintenance') continue
      const occupied = bookings.some((b) => {
        if (!b.deviceIds.includes(dev.id)) return false
        const s = new Date(b.startTime).getTime()
        const e = new Date(b.endTime).getTime()
        return now >= s && now <= e
      })
      dev.status = occupied ? 'occupied' : 'idle'
    }
  },
  exportCsv(days = 7): string {
    const now = new Date()
    const limit = new Date()
    limit.setDate(limit.getDate() + days)
    const rows = bookings
      .filter((b) => {
        const s = new Date(b.startTime).getTime()
        return s >= now.getTime() && s <= limit.getTime()
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const headers = [
      '会议ID',
      '会议名称',
      '会议室',
      '位置',
      '开始时间',
      '结束时间',
      '参与人数',
      '设备',
      '备注',
      '创建人',
      '参与者',
    ]
    const lines = [headers.join(',')]
    for (const b of rows) {
      const room = rooms.find((r) => r.id === b.roomId)
      const devs = b.deviceIds
        .map((id) => devices.find((d) => d.id === id)?.name || id)
        .join(';')
      const fmt = (iso: string) => {
        const d = new Date(iso)
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate()
        )} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`
      lines.push(
        [
          esc(b.id),
          esc(b.title),
          esc(room?.name || ''),
          esc(room?.location || ''),
          esc(fmt(b.startTime)),
          esc(fmt(b.endTime)),
          String(b.participants),
          esc(devs),
          esc(b.notes),
          esc(b.createdBy),
          esc((b.attendees || []).join(';')),
        ].join(',')
      )
    }
    return lines.join('\n')
  },
}

// initial refresh
dataStore.refreshDeviceOccupiedStatus()
setInterval(() => dataStore.refreshDeviceOccupiedStatus(), 60 * 1000)
