import {
  Building2,
  Users,
  MapPin,
  Projector,
  PenSquare,
  Video,
  Wrench,
  Circle,
  ToggleLeft,
  ToggleRight,
  BarChart3,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { apiService } from '@/services/apiService'
import type { Device, DeviceType } from '@/types'
import { humanizeDeviceType } from '@/utils/dateUtils'
import { useMemo } from 'react'
import { v4 as uuid } from 'uuid'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const deviceIcon = (t: DeviceType) => {
  switch (t) {
    case 'projector':
      return Projector
    case 'whiteboard':
      return PenSquare
    case 'video_conference':
      return Video
  }
}

const statusStyle = (s: string) => {
  switch (s) {
    case 'idle':
      return { text: '空闲', cls: 'bg-green-50 text-green-700', dot: '#10b981' }
    case 'occupied':
      return { text: '占用', cls: 'bg-amber-50 text-amber-700', dot: '#f59e0b' }
    case 'maintenance':
      return { text: '维护', cls: 'bg-red-50 text-red-700', dot: '#ef4444' }
    default:
      return { text: s, cls: 'bg-gray-50 text-gray-600', dot: '#9ca3af' }
  }
}

export default function ResourcePanel() {
  const rooms = useAppStore((s) => s.rooms)
  const devices = useAppStore((s) => s.devices)
  const bookings = useAppStore((s) => s.bookings)
  const addNotification = useAppStore((s) => s.addNotification)
  const updateDevice = useAppStore((s) => s.updateDevice)

  const stats = useMemo(() => {
    const total = devices.length
    const byStatus = devices.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const pieData = [
      { name: '空闲', value: byStatus.idle || 0, color: '#10b981' },
      { name: '占用', value: byStatus.occupied || 0, color: '#f59e0b' },
      { name: '维护', value: byStatus.maintenance || 0, color: '#ef4444' },
    ]
    const roomUsage = rooms.map((r) => {
      const count = bookings.filter((b) => b.roomId === r.id).length
      return { name: r.name.slice(0, 4), value: count, color: r.color }
    })
    return { total, byStatus, pieData, roomUsage }
  }, [devices, rooms, bookings])

  async function toggleMaintenance(device: Device) {
    const next = device.status === 'maintenance' ? 'idle' : 'maintenance'
    try {
      const updated = await apiService.updateDeviceStatus(
        device.id,
        next,
        device.roomId
      )
      updateDevice(updated)
      addNotification({
        id: uuid(),
        type: next === 'maintenance' ? 'warning' : 'success',
        message:
          next === 'maintenance'
            ? `设备「${device.name}」已进入维护模式`
            : `设备「${device.name}」已恢复可用`,
        timestamp: Date.now(),
      })
    } catch (e: any) {
      addNotification({
        id: uuid(),
        type: 'error',
        message: e.message || '操作失败',
        timestamp: Date.now(),
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: '会议室',
            value: rooms.length,
            icon: Building2,
            color: 'from-primary-500 to-primary-700',
          },
          {
            label: '设备总数',
            value: stats.total,
            icon: Wrench,
            color: 'from-emerald-500 to-teal-600',
          },
          {
            label: '空闲设备',
            value: stats.byStatus.idle || 0,
            icon: Circle,
            color: 'from-sky-500 to-blue-600',
          },
          {
            label: '维护中',
            value: stats.byStatus.maintenance || 0,
            icon: Wrench,
            color: 'from-rose-500 to-red-600',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="card-base card-hover p-5 flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-sm`}
            >
              <c.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-2xl font-bold text-gray-800 leading-tight">
                {c.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-base card-hover p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800">设备状态分布</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {stats.pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: p.color }}
                />
                <span className="text-gray-600">
                  {p.name} {p.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base card-hover p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-800">会议室预约次数</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.roomUsage}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.roomUsage.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Meeting Rooms */}
      <div className="card-base overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-800">会议室列表</h2>
          <span className="ml-auto text-xs text-gray-500">{rooms.length} 间会议室</span>
        </div>
        <div className="divide-y divide-gray-100">
          {rooms.map((r) => {
            const rDevices = devices.filter((d) => d.roomId === r.id)
            const futureBookings = bookings.filter((b) => {
              return b.roomId === r.id && new Date(b.endTime) > new Date()
            }).length
            return (
              <div
                key={r.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: r.color }}
                >
                  {r.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-800">{r.name}</div>
                    <span className="status-pill bg-primary-50 text-primary-700">
                      {futureBookings > 0 ? `${futureBookings} 场待开` : '暂无预约'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      容纳 {r.capacity} 人
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {r.location}
                    </span>
                    <span>
                      设备：
                      {rDevices.length
                        ? rDevices.map((d) => d.name).join('、')
                        : '无'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Devices */}
      <div className="card-base overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-800">设备列表</h2>
          <span className="ml-auto text-xs text-gray-500">{devices.length} 台设备</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((d) => {
            const Icon = deviceIcon(d.type)
            const ss = statusStyle(d.status)
            const room = rooms.find((r) => r.id === d.roomId)
            const isMaintenance = d.status === 'maintenance'
            return (
              <div
                key={d.id}
                className={`card-base card-hover p-4 border-l-4 ${
                  isMaintenance
                    ? 'border-red-400'
                    : d.status === 'occupied'
                      ? 'border-amber-400'
                      : 'border-green-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isMaintenance
                        ? 'bg-red-50 text-red-600'
                        : d.status === 'occupied'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-green-50 text-green-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-gray-800 truncate">
                        {d.name}
                      </div>
                      <span className={`status-pill ${ss.cls}`}>
                        <Circle
                          className="w-2 h-2 fill-current"
                          style={{ color: ss.dot }}
                        />
                        {ss.text}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                      <span>{humanizeDeviceType(d.type)}</span>
                      <span>·</span>
                      <span>{room ? `${room.name} · ${room.location}` : '公共设备'}</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        维护模式
                        {isMaintenance && (
                          <span className="ml-1 text-red-600">（不可预约）</span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleMaintenance(d)}
                        className="group flex items-center gap-2"
                        aria-label="切换维护模式"
                      >
                        {isMaintenance ? (
                          <ToggleRight className="w-10 h-6 text-red-500 transition-transform group-hover:scale-105" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 text-gray-400 transition-all group-hover:text-primary-500" />
                        )}
                        <span className="text-xs font-medium text-gray-600">
                          {isMaintenance ? '解除' : '开启'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
