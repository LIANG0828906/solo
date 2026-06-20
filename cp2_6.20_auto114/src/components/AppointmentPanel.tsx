import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { mockGroomers, mockServices, createAppointment } from '@/services/api'
import { wsService } from '@/services/websocket'
import { useAppStore } from '@/store'

const ORANGE = '#e67e22'
const CORAL = '#f39c12'
const BG = '#fff7e6'

export default function AppointmentPanel() {
  const navigate = useNavigate()
  const { selectedStyle, setAppointment } = useAppStore()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedGroomerId, setSelectedGroomerId] = useState<string | null>(null)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  const dates = useMemo(() => {
    const result: dayjs.Dayjs[] = []
    for (let i = 0; i < 90; i++) {
      result.push(dayjs().add(i, 'day'))
    }
    return result
  }, [])

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, dayjs.Dayjs[]>()
    for (const d of dates) {
      const key = d.format('YYYY年MM月')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return map
  }, [dates])

  const selectedGroomer = mockGroomers.find((g) => g.id === selectedGroomerId) ?? null

  const selectedServices = mockServices.filter((s) => selectedServiceIds.includes(s.id))

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  const canConfirm = !!selectedDate && !!selectedGroomerId && selectedServiceIds.length > 0

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function handleConfirm() {
    if (!canConfirm || confirming) return
    setConfirming(true)
    try {
      const appointment = await createAppointment({
        date: selectedDate!,
        groomerId: selectedGroomerId!,
        serviceIds: selectedServiceIds,
        styleId: selectedStyle?.id ?? '',
      })
      const appointmentId = appointment?.id || `fallback_${Date.now()}`
      if (!appointment.id) {
        console.warn('[Appointment] appointment.id is missing, using fallback id')
      }
      wsService.simulateNotification(appointmentId)
      setAppointment({
        ...appointment,
        id: appointmentId,
      })
      navigate(`/appointment/${encodeURIComponent(appointmentId)}`)
    } catch (err) {
      console.error('[Appointment] Failed to create appointment:', err)
      const fallbackId = `offline_${Date.now()}`
      wsService.simulateNotification(fallbackId)
      setAppointment({
        id: fallbackId,
        date: selectedDate!,
        groomerId: selectedGroomerId!,
        serviceIds: selectedServiceIds,
        styleId: selectedStyle?.id ?? '',
        status: 'confirmed',
        progress: 0,
      })
      navigate(`/appointment/${encodeURIComponent(fallbackId)}`)
    } finally {
      setConfirming(false)
    }
  }

  function renderStars(rating: number) {
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    const stars: string[] = []
    for (let i = 0; i < full; i++) stars.push('★')
    if (half) stars.push('☆')
    return stars.join('')
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: BG,
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {renderDatePicker()}
        {renderGroomerSection()}
        {renderServiceSection()}
      </div>
      {renderBottom()}
    </div>
  )

  function renderDatePicker() {
    return (
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>
          选择日期
        </h3>
        <div
          style={{
            maxHeight: 240,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {Array.from(groupedByMonth.entries()).map(([monthLabel, monthDates]) => (
            <div key={monthLabel} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: ORANGE,
                  marginBottom: 6,
                  paddingBottom: 4,
                  borderBottom: '1px solid #f5d5b5',
                }}
              >
                {monthLabel}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {monthDates.map((d) => {
                  const dateStr = d.format('YYYY-MM-DD')
                  const isSelected = selectedDate === dateStr
                  const isToday = d.isSame(dayjs(), 'day')
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        width: 56,
                        padding: '6px 0',
                        border: isSelected ? 'none' : '1px solid #e0d5c8',
                        borderRadius: 8,
                        background: isSelected
                          ? `linear-gradient(135deg, ${ORANGE}, ${CORAL})`
                          : '#fff',
                        color: isSelected ? '#fff' : '#555',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 400,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        boxShadow: isSelected ? '0 2px 8px rgba(230,126,34,0.3)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 10, opacity: 0.8 }}>
                        {d.format('ddd')}
                      </span>
                      <span>{d.format('D')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderGroomerSection() {
    return (
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>
          选择美容师
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mockGroomers.map((groomer) => {
            const isSelected = selectedGroomerId === groomer.id
            return (
              <div
                key={groomer.id}
                onClick={() => setSelectedGroomerId(groomer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: isSelected ? `2px solid ${ORANGE}` : '1px solid #e8ddd0',
                  background: isSelected ? '#fff3e0' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 2px 10px rgba(230,126,34,0.15)' : 'none',
                }}
              >
                <img
                  src={groomer.avatar}
                  alt={groomer.name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${isSelected ? ORANGE : '#e8ddd0'}`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                      {groomer.name}
                    </span>
                    <span style={{ color: '#f1c40f', fontSize: 13 }}>
                      {renderStars(groomer.rating)}
                    </span>
                    <span style={{ fontSize: 12, color: '#999' }}>{groomer.rating}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {groomer.specialties.map((sp) => (
                      <span
                        key={sp}
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: '#fdebd0',
                          color: ORANGE,
                        }}
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {groomer.availableSlots.map((slot) => (
                      <span
                        key={slot}
                        style={{
                          fontSize: 11,
                          padding: '2px 10px',
                          borderRadius: 10,
                          background: '#fef9f0',
                          border: '1px solid #f5d5b5',
                          color: '#8b6914',
                          cursor: 'pointer',
                        }}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  function renderServiceSection() {
    return (
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>
          选择服务项目
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mockServices.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id)
            return (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: isSelected ? `2px solid ${ORANGE}` : '1px solid #e8ddd0',
                  background: isSelected ? '#fff3e0' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 24 }}>{service.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                    {service.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {service.duration}分钟
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: ORANGE }}>
                    ¥{service.price}
                  </span>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: isSelected ? 'none' : `2px solid #ccc`,
                      background: isSelected
                        ? `linear-gradient(135deg, ${ORANGE}, ${CORAL})`
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  function renderBottom() {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #f0e4d4',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>合计</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 22, color: ORANGE }}>¥{totalPrice}</span>
            <span style={{ fontSize: 12, color: '#999' }}>约{totalDuration}分钟</span>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || confirming}
          style={{
            padding: '12px 32px',
            borderRadius: 24,
            border: 'none',
            background: canConfirm
              ? `linear-gradient(135deg, ${ORANGE}, ${CORAL})`
              : '#e0d5c8',
            color: canConfirm ? '#fff' : '#b0a090',
            fontSize: 16,
            fontWeight: 700,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            boxShadow: canConfirm ? '0 4px 15px rgba(230,126,34,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {confirming ? '预约中...' : '确认预约'}
        </button>
      </div>
    )
  }
}
