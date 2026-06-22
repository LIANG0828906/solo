import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Users, MapPin } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import BookingForm from './BookingForm'
import {
  HOURS,
  HOUR_HEIGHT,
  formatDateShort,
  getWeekDates,
  isSameDay,
  parseHour,
  weekdayLabel,
} from '@/utils/dateUtils'
import type { Booking } from '@/types'

export default function CalendarView() {
  const rooms = useAppStore((s) => s.rooms)
  const bookings = useAppStore((s) => s.bookings)
  const devices = useAppStore((s) => s.devices)
  const [weekOffset, setWeekOffset] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [defaultRoomId, setDefaultRoomId] = useState('')
  const [defaultDate, setDefaultDate] = useState(new Date())
  const [defaultHour, setDefaultHour] = useState(9)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const weekDates = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    return getWeekDates(base)
  }, [weekOffset])

  const rangeLabel = `${formatDateShort(weekDates[0])} - ${formatDateShort(
    weekDates[6]
  )}`

  const roomCols = useMemo(() => {
    return rooms.map((room) => {
      return {
        room,
        days: weekDates.map((date) => {
          const dayBookings = bookings.filter(
            (b) => b.roomId === room.id && isSameDay(date, b.startTime)
          )
          return { date, dayBookings }
        }),
      }
    })
  }, [rooms, bookings, weekDates])

  function openBooking(roomId: string, date: Date, hour: number) {
    setDefaultRoomId(roomId)
    setDefaultDate(date)
    setDefaultHour(hour)
    setFormOpen(true)
  }

  function getBookingStyle(b: Booking) {
    const start = parseHour(b.startTime) - 8
    const end = parseHour(b.endTime) - 8
    const top = start * HOUR_HEIGHT + 2
    const height = Math.max((end - start) * HOUR_HEIGHT - 4, 28)
    return { top: `${top}px`, height: `${height}px` }
  }

  const now = new Date()
  const nowDayIdx = weekDates.findIndex(
    (d) => d.toDateString() === today.toDateString()
  )
  const nowMinuteOfDay = now.getHours() * 60 + now.getMinutes()
  const showNowLine =
    nowDayIdx >= 0 && nowMinuteOfDay >= 8 * 60 && nowMinuteOfDay <= 20 * 60

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card-base p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            onClick={() => setWeekOffset((x) => x - 1)}
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            className="btn-outline !py-2 !px-4"
            onClick={() => setWeekOffset(0)}
          >
            本周
          </button>
          <button
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            onClick={() => setWeekOffset((x) => x + 1)}
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <div className="ml-3 text-sm font-medium text-gray-700">
            {rangeLabel}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 text-xs text-gray-600"
            >
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: r.color }}
              />
              {r.name}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="card-base overflow-hidden">
        <div className="calendar-scroll thin-scroll overflow-auto">
          <div
            style={{
              minWidth: 240 + rooms.length * weekDates.length * 120,
              minHeight: 0,
            }}
          >
            {/* Header */}
            <div className="flex border-b border-gray-100 sticky top-0 z-10 bg-white">
              <div className="w-[96px] shrink-0 p-3 border-r border-gray-100 bg-gray-50/60" />
              {rooms.map((room) =>
                weekDates.map((date, idx) => {
                  const isToday =
                    date.toDateString() === today.toDateString()
                  return (
                    <div
                      key={`${room.id}-${idx}`}
                      className={`shrink-0 p-3 border-r border-gray-100 last:border-r-0 text-center ${
                        isToday ? 'bg-primary-50/70' : 'bg-gray-50/30'
                      }`}
                      style={{ width: 160 }}
                    >
                      {idx === 0 && (
                        <div className="flex items-center justify-center gap-1.5 mb-1 text-[13px] font-semibold text-gray-700">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ background: room.color }}
                          />
                          {room.name}
                        </div>
                      )}
                      <div
                        className={`text-xs ${
                          date.toDateString() === today.toDateString()
                            ? 'text-primary-600 font-semibold'
                            : 'text-gray-500'
                        }`}
                      >
                        {weekdayLabel(date)} · {formatDateShort(date)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-400 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.capacity}
                        <MapPin className="w-3 h-3 ml-1" />
                        {room.location}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Body */}
            <div className="flex">
              {/* Time column */}
              <div className="w-[96px] shrink-0 border-r border-gray-100 bg-gray-50/40">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="px-3 text-xs text-gray-500 border-b border-gray-100 relative"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="absolute top-1 left-3">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Room-day columns */}
              {rooms.map((room) =>
                weekDates.map((date, dayIdx) => {
                  const dayData = roomCols
                    .find((c) => c.room.id === room.id)!
                    .days.find((d) => d.date.getTime() === date.getTime())!
                  const isPast =
                    date.getTime() < today.getTime() &&
                    date.toDateString() !== today.toDateString()

                  return (
                    <div
                      key={`col-${room.id}-${dayIdx}`}
                      className="relative shrink-0 border-r border-gray-100 last:border-r-0"
                      style={{ width: 160 }}
                    >
                      {/* Hour cells */}
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          disabled={isPast}
                          onClick={() => openBooking(room.id, date, h)}
                          className={`w-full text-left border-b border-gray-100 transition-colors ${
                            isPast
                              ? 'bg-gray-50/40 cursor-not-allowed'
                              : 'hover:bg-primary-50/40 cursor-pointer'
                          }`}
                          style={{ height: HOUR_HEIGHT }}
                          aria-label={`${room.name} ${formatDateShort(
                            date
                          )} ${h}:00`}
                        />
                      ))}

                      {/* Now indicator line */}
                      {showNowLine &&
                        date.toDateString() === today.toDateString() && (
                          <div
                            className="absolute left-0 right-0 z-[3] pointer-events-none"
                            style={{
                              top: `${
                                ((nowMinuteOfDay - 8 * 60) / 60) * HOUR_HEIGHT
                              }px`,
                            }}
                          >
                            <div className="absolute left-0 right-0 border-t-2 border-red-500" />
                            <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-md" />
                          </div>
                        )}

                      {/* Bookings */}
                      <div className="absolute inset-0 pointer-events-none px-1 py-0.5">
                        {dayData.dayBookings.map((b) => {
                          const style = getBookingStyle(b)
                          const devNames = b.deviceIds
                            .map((id) => devices.find((d) => d.id === id)?.name)
                            .filter(Boolean)
                            .join('、')
                          return (
                            <div
                              key={b.id}
                              className="absolute left-1 right-1 rounded-lg px-2 py-1.5 text-white text-[11px] leading-tight shadow-sm overflow-hidden animate-slide-in-left pointer-events-auto cursor-pointer hover:brightness-110"
                              style={{
                                ...style,
                                background: `linear-gradient(135deg, ${room.color} 0%, ${room.color}dd 100%)`,
                                border: `1px solid ${room.color}`,
                              }}
                              title={`${b.title}\n参与者: ${b.participants}人\n设备: ${devNames || '无'}`}
                            >
                              <div className="font-semibold truncate">
                                {b.title}
                              </div>
                              <div className="opacity-90 truncate">
                                {b.participants}人
                                {devNames ? ` · ${devNames.split('、')[0]}` : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend / tips */}
      <div className="card-base card-hover p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          💡
        </div>
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-800 mb-1">快速预约指南</div>
          点击日历中的空白时段即可创建会议预约；系统会自动检查会议室与设备的占用情况，维护中的设备将置灰不可选。
        </div>
      </div>

      <BookingForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultRoomId={defaultRoomId || rooms[0]?.id || ''}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
      />
    </div>
  )
}
