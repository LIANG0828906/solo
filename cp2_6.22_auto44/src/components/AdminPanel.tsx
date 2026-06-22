import { useMemo, useState } from 'react'
import {
  ShieldCheck,
  Download,
  Trash2,
  Calendar,
  Users,
  MapPin,
  Eye,
  X,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { apiService } from '@/services/apiService'
import { v4 as uuid } from 'uuid'
import {
  formatDateTimeRange,
  humanizeDeviceType,
} from '@/utils/dateUtils'

export default function AdminPanel() {
  const rooms = useAppStore((s) => s.rooms)
  const devices = useAppStore((s) => s.devices)
  const bookings = useAppStore((s) => s.bookings)
  const removeBooking = useAppStore((s) => s.removeBooking)
  const addToast = useAppStore((s) => s.addToast)
  const addNotification = useAppStore((s) => s.addNotification)

  const [detail, setDetail] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortDesc, setSortDesc] = useState(true)

  const futureBookings = useMemo(() => {
    const now = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 7)
    let list = bookings.filter((b) => {
      const s = new Date(b.startTime)
      return s >= now && s <= end
    })
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((b) => {
        const room = rooms.find((r) => r.id === b.roomId)
        return (
          b.title.toLowerCase().includes(q) ||
          (room && room.name.toLowerCase().includes(q)) ||
          b.notes.toLowerCase().includes(q)
        )
      })
    }
    list.sort((a, b) => {
      const ta = new Date(a.startTime).getTime()
      const tb = new Date(b.startTime).getTime()
      return sortDesc ? tb - ta : ta - tb
    })
    return list
  }, [bookings, rooms, search, sortDesc])

  function getRoom(id: string) {
    return rooms.find((r) => r.id === id)
  }

  async function onCancel(id: string) {
    const booking = bookings.find((b) => b.id === id)
    if (!booking) return
    try {
      await apiService.deleteBooking(id)
      removeBooking(id)
      setCancelConfirm(null)
      setDetail(null)

      // notify attendees (simulation via toast bubbles)
      const room = getRoom(booking.roomId)
      const message = `会议「${booking.title}」（${room?.name || ''}）已被管理员取消`
      const notifId = uuid()
      addNotification({
        id: notifId,
        type: 'warning',
        message: `已取消 ${booking.title}`,
        timestamp: Date.now(),
      })

      // send toast for each "attendee" plus general
      if (booking.attendees?.length) {
        booking.attendees.forEach((a) => {
          addToast({
            id: uuid(),
            type: 'warning',
            message: `【${a}】${message}`,
            bookingId: booking.id,
          })
        })
      } else {
        addToast({
          id: uuid(),
          type: 'warning',
          message,
          bookingId: booking.id,
        })
      }
    } catch (e: any) {
      addNotification({
        id: uuid(),
        type: 'error',
        message: e.message || '取消失败',
        timestamp: Date.now(),
      })
    }
  }

  async function exportCsv() {
    try {
      const csv = await apiService.exportBookingsCsv(7)
      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date()
        .toISOString()
        .slice(0, 10)
      a.download = `meetings-${today}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addNotification({
        id: uuid(),
        type: 'success',
        message: `已导出 ${futureBookings.length} 条会议数据`,
        timestamp: Date.now(),
      })
    } catch (e: any) {
      addNotification({
        id: uuid(),
        type: 'error',
        message: e.message || '导出失败',
        timestamp: Date.now(),
      })
    }
  }

  const totalParticipants = futureBookings.reduce(
    (acc, b) => acc + b.participants,
    0
  )

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: '未来7天会议',
            value: futureBookings.length,
            icon: Calendar,
            color: 'from-primary-500 to-primary-700',
          },
          {
            label: '预计参会人次',
            value: totalParticipants,
            icon: Users,
            color: 'from-indigo-500 to-violet-600',
          },
          {
            label: '涉及会议室',
            value: new Set(futureBookings.map((b) => b.roomId)).size,
            icon: MapPin,
            color: 'from-emerald-500 to-teal-600',
          },
          {
            label: '使用设备次',
            value: futureBookings.reduce((a, b) => a + b.deviceIds.length, 0),
            icon: Eye,
            color: 'from-amber-500 to-orange-600',
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

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-800">
              未来7天会议管理
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索会议/会议室"
                className="input-field pl-9 py-2 text-sm !w-64"
              />
            </div>
            <button
              className="btn-outline !py-2 !px-3 flex items-center gap-1.5"
              onClick={() => setSortDesc((v) => !v)}
            >
              {sortDesc ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
              按开始时间{sortDesc ? '降序' : '升序'}
            </button>
            <button
              onClick={exportCsv}
              className="btn-primary !py-2 !px-4 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              导出 CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto thin-scroll">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left font-medium px-6 py-3">会议</th>
                <th className="text-left font-medium px-4 py-3">会议室</th>
                <th className="text-left font-medium px-4 py-3">时间</th>
                <th className="text-left font-medium px-4 py-3">人数</th>
                <th className="text-left font-medium px-4 py-3">设备</th>
                <th className="text-left font-medium px-4 py-3">创建人</th>
                <th className="text-right font-medium px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {futureBookings.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    暂无未来 7 天内的会议记录
                  </td>
                </tr>
              )}
              {futureBookings.map((b) => {
                const room = getRoom(b.roomId)
                const devs = b.deviceIds
                  .map((id) => devices.find((d) => d.id === id)?.name)
                  .filter(Boolean)
                return (
                  <tr
                    key={b.id}
                    className="table-row-hover border-t border-gray-100"
                  >
                    <td className="px-6 py-3.5">
                      <div
                        className="font-medium text-gray-800 truncate max-w-[240px]"
                        title={b.title}
                      >
                        {b.title}
                      </div>
                      {b.notes && (
                        <div
                          className="text-xs text-gray-400 truncate max-w-[240px] mt-0.5"
                          title={b.notes}
                        >
                          {b.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {room && (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ background: room.color }}
                          />
                          <span className="text-sm text-gray-700">
                            {room.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {room.location}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                      {formatDateTimeRange(b.startTime, b.endTime)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700">
                        {b.participants} 人
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {devs.length ? (
                          devs.map((name, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-primary-50 text-primary-700 text-xs"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {b.createdBy}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        className="btn-outline !py-1.5 !px-3 text-xs mr-2"
                        onClick={() => setDetail(b.id)}
                      >
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          详情
                        </span>
                      </button>
                      <button
                        className="btn-danger !py-1.5 !px-3 text-xs"
                        onClick={() => setCancelConfirm(b.id)}
                      >
                        <span className="flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" />
                          取消
                        </span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (() => {
        const b = bookings.find((x) => x.id === detail)
        if (!b) return null
        const room = getRoom(b.roomId)
        return (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setDetail(null)}
          >
            <div className="absolute inset-0 modal-backdrop" />
            <div
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
                <h2 className="text-base font-semibold text-gray-800">
                  会议详情
                </h2>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
                  onClick={() => setDetail(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">会议标题</div>
                  <div className="text-gray-800 font-medium text-lg">
                    {b.title}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">会议室</div>
                    <div className="text-gray-700 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: room?.color }}
                      />
                      {room?.name}（{room?.location}）
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">参与人数</div>
                    <div className="text-gray-700">{b.participants} 人</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">时段</div>
                  <div className="text-gray-700">
                    {formatDateTimeRange(b.startTime, b.endTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">所需设备</div>
                  <div className="flex flex-wrap gap-2">
                    {b.deviceIds.length ? (
                      b.deviceIds.map((id) => {
                        const dev = devices.find((d) => d.id === id)
                        return dev ? (
                          <span
                            key={id}
                            className="px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-xs"
                          >
                            {dev.name}（{humanizeDeviceType(dev.type)}）
                          </span>
                        ) : null
                      })
                    ) : (
                      <span className="text-gray-400">无</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">参与者</div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.attendees.length ? (
                      b.attendees.map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs"
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">未指定</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">备注</div>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {b.notes || '—'}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                  <span>创建人：{b.createdBy}</span>
                  <span>ID：{b.id.slice(0, 8)}…</span>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  className="btn-outline"
                  onClick={() => setDetail(null)}
                >
                  关闭
                </button>
                <button
                  className="btn-danger"
                  onClick={() => setCancelConfirm(b.id)}
                >
                  <span className="flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    取消此会议
                  </span>
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Cancel confirm */}
      {cancelConfirm && (() => {
        const b = bookings.find((x) => x.id === cancelConfirm)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setCancelConfirm(null)}
          >
            <div className="absolute inset-0 modal-backdrop" />
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">
                      确认取消会议？
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      您将取消「{b?.title}」。系统会自动向所有参与者发送通知消息。
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  className="btn-outline"
                  onClick={() => setCancelConfirm(null)}
                >
                  再想想
                </button>
                <button
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition shadow-sm"
                  onClick={() => onCancel(cancelConfirm)}
                >
                  确认取消
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
