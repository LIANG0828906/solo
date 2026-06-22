import { useEffect, useMemo, useState } from 'react'
import { X, Users, FileText, CalendarClock, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { apiService } from '@/services/apiService'
import type { BookingCreateInput } from '@/types'
import {
  HOURS,
  buildDateTime,
  formatDateTimeRange,
  humanizeDeviceType,
  parseHour,
} from '@/utils/dateUtils'

interface Props {
  open: boolean
  onClose: () => void
  defaultRoomId: string
  defaultDate: Date
  defaultHour: number
}

export default function BookingForm({
  open,
  onClose,
  defaultRoomId,
  defaultDate,
  defaultHour,
}: Props) {
  const rooms = useAppStore((s) => s.rooms)
  const devices = useAppStore((s) => s.devices)
  const bookings = useAppStore((s) => s.bookings)
  const addToast = useAppStore((s) => s.addToast)

  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useState(defaultRoomId)
  const [startHour, setStartHour] = useState(defaultHour)
  const [endHour, setEndHour] = useState(Math.min(defaultHour + 1, 20))
  const [participants, setParticipants] = useState(4)
  const [deviceIds, setDeviceIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [attendees, setAttendees] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [conflictError, setConflictError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (open) {
      setRoomId(defaultRoomId)
      setStartHour(defaultHour)
      setEndHour(Math.min(defaultHour + 1, 20))
      setTitle('')
      setParticipants(4)
      setDeviceIds([])
      setNotes('')
      setAttendees('')
      setConflictError('')
    }
  }, [open, defaultRoomId, defaultHour, defaultDate])

  const availableDevices = useMemo(
    () =>
      devices.filter((d) => {
        if (d.roomId && d.roomId !== roomId) return false
        return true
      }),
    [devices, roomId]
  )

  const room = rooms.find((r) => r.id === roomId)

  const startTime = buildDateTime(defaultDate, startHour)
  const endTime = buildDateTime(defaultDate, endHour)

  function triggerShake(msg: string) {
    setConflictError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      triggerShake('请填写会议名称')
      return
    }
    if (startHour >= endHour) {
      triggerShake('结束时间必须晚于开始时间')
      return
    }
    if (participants < 1) {
      triggerShake('参与人数至少为 1 人')
      return
    }
    if (room && participants > room.capacity) {
      triggerShake(`参与人数超过会议室容量（最大 ${room.capacity} 人）`)
      return
    }

    const attendeeList = attendees
      .split(/[,，;；\s]+/)
      .map((x) => x.trim())
      .filter(Boolean)

    const payload: BookingCreateInput = {
      title: title.trim(),
      roomId,
      startTime,
      endTime,
      participants,
      deviceIds,
      notes: notes.trim(),
      attendees: attendeeList,
    }

    try {
      setSubmitting(true)

      // 第一步：先调用设备可用性检查接口
      if (deviceIds.length > 0) {
        const availResult = await apiService.checkDeviceAvailability(
          deviceIds,
          startTime,
          endTime
        )
        if (!availResult.available && availResult.conflicts.length > 0) {
          const first = availResult.conflicts[0]
          const devNames = availResult.conflicts
            .map((c) => c.deviceName)
            .join('、')
          const conflictTitle = first.conflictingBooking.title
          triggerShake(
            `设备冲突：「${devNames}」与会议「${conflictTitle}」时间重叠，请选择其他时间或设备`
          )
          setSubmitting(false)
          return
        }
      }

      // 第二步：设备可用后再提交预约
      const created = await apiService.createBooking(payload)
      addToast({
        id: created.id,
        type: 'success',
        message: `预约成功：${created.title}`,
        bookingId: created.id,
      })
      onClose()
    } catch (err: any) {
      triggerShake(err.message || '预约失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleDevice(id: string) {
    setDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 modal-backdrop" />
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden ${
          shake ? 'animate-shake-red' : ''
        }`}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-800">
              创建会议预约
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-auto thin-scroll">
          {conflictError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{conflictError}</span>
            </div>
          )}

          <div>
            <label className="label-text">会议名称 *</label>
            <input
              className="input-field"
              placeholder="例如：产品周会"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">会议室 *</label>
              <select
                className="input-field"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}（{r.capacity}人 · {r.location}）
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-500" />
                参与人数 *
              </label>
              <input
                type="number"
                min={1}
                max={room?.capacity || 999}
                className="input-field"
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
              />
              {room && (
                <div className="mt-1 text-xs text-gray-500">
                  容量 {room.capacity} 人
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">开始时间</label>
              <select
                className="input-field"
                value={startHour}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setStartHour(v)
                  if (v >= endHour) setEndHour(Math.min(v + 1, 20))
                }}
              >
                {HOURS.filter((h) => h < 20).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">结束时间</label>
              <select
                className="input-field"
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
              >
                {HOURS.filter((h) => h > startHour).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
            时段：{formatDateTimeRange(startTime, endTime)}
          </div>

          <div>
            <label className="label-text">所需设备</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableDevices.length === 0 && (
                <div className="text-sm text-gray-500">当前会议室无可用设备</div>
              )}
              {availableDevices.map((d) => {
                const isMaintenance = d.status === 'maintenance'
                const checked = deviceIds.includes(d.id)
                return (
                  <label
                    key={d.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                      isMaintenance
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : checked
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-200 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isMaintenance}
                      checked={checked}
                      onChange={() => !isMaintenance && toggleDevice(d.id)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {d.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {humanizeDeviceType(d.type)}
                        {isMaintenance && ' · 维护中'}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label-text">参与者邮箱（用逗号分隔）</label>
            <input
              className="input-field"
              placeholder="zhangsan@company.com, lisi@company.com"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-500" />
              备注
            </label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="补充说明、会议议题等"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            disabled={submitting}
          >
            取消
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '提交中…' : '确认预约'}
          </button>
        </div>
      </form>
    </div>
  )
}
