import { v4 as uuidv4 } from 'uuid'
import type { Seat, SeatStatus } from './layoutEngine'
import { getSeatLabel } from './layoutEngine'

export interface TicketData {
  movieName: string
  theaterNumber: string
  showTime: string
  seatNumber: string
  seatId: string
  orderId: string
  purchaseTime: string
  price: number
}

export interface BookingPopupState {
  visible: boolean
  seatId: string | null
  seatNumber: string
  price: number
  positionX: number
  positionY: number
}

export function createBookingPopup(
  seat: Seat,
  screenX: number,
  screenY: number
): BookingPopupState {
  return {
    visible: true,
    seatId: seat.id,
    seatNumber: getSeatLabel(seat),
    price: seat.price,
    positionX: screenX,
    positionY: screenY,
  }
}

export function closeBookingPopup(): BookingPopupState {
  return {
    visible: false,
    seatId: null,
    seatNumber: '',
    price: 0,
    positionX: 0,
    positionY: 0,
  }
}

export function canBookSeat(seat: Seat): boolean {
  return seat.status === 'available'
}

export function confirmSeatBooking(seat: Seat): Seat {
  return {
    ...seat,
    status: 'sold' as SeatStatus,
  }
}

export function generateTicketData(seat: Seat): TicketData {
  const now = new Date()
  const showDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const formatTime = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`

  return {
    movieName: '星际穿越',
    theaterNumber: '1号厅',
    showTime: formatTime(showDate),
    seatNumber: getSeatLabel(seat),
    seatId: seat.id,
    orderId: uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16),
    purchaseTime: formatTime(now),
    price: seat.price,
  }
}

export async function downloadTicketAsPng(
  element: HTMLElement,
  filename: string = 'ticket.png'
): Promise<void> {
  const canvas = document.createElement('canvas')
  const rect = element.getBoundingClientRect()
  const scale = 2
  canvas.width = rect.width * scale
  canvas.height = rect.height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(scale, scale)
  const computedStyle = window.getComputedStyle(element)
  const bgColor = computedStyle.backgroundColor || '#2D2D44'
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, rect.width, rect.height)

  const stripePattern = ctx.createLinearGradient(0, 0, rect.width, rect.height)
  stripePattern.addColorStop(0, 'rgba(255,255,255,0.03)')
  stripePattern.addColorStop(0.5, 'rgba(255,255,255,0.06)')
  stripePattern.addColorStop(1, 'rgba(255,255,255,0.03)')
  ctx.fillStyle = stripePattern
  for (let i = -rect.height; i < rect.width; i += 12) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + rect.height, rect.height)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 6
    ctx.stroke()
  }

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 14px sans-serif'
  ctx.fillText('🎬 CINEMA', 16, 28)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 18px sans-serif'
  const ticketData = extractTicketText(element)
  ctx.fillText(ticketData.movieName, 16, 58)

  ctx.fillStyle = '#AAAAAA'
  ctx.font = '11px sans-serif'
  ctx.fillText(`场次: ${ticketData.showTime}`, 16, 80)
  ctx.fillText(`影厅: ${ticketData.theaterNumber}`, 16, 96)
  ctx.fillText(`座位: ${ticketData.seatNumber}`, 16, 112)

  ctx.fillStyle = '#4ADE80'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('✓ 下单成功', 16, 136)

  const qrX = rect.width - 72
  const qrY = rect.height - 72
  const qrGradient = ctx.createLinearGradient(qrX, qrY, qrX + 56, qrY + 56)
  qrGradient.addColorStop(0, '#E94560')
  qrGradient.addColorStop(1, '#FFD700')
  ctx.fillStyle = qrGradient
  ctx.fillRect(qrX, qrY, 56, 56)
  ctx.fillStyle = '#FFFFFF'
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i * 3 + j * 5) % 2 === 0) {
        ctx.fillRect(qrX + 4 + i * 6, qrY + 4 + j * 6, 4, 4)
      }
    }
  }

  ctx.fillStyle = '#CCCCCC'
  ctx.font = '10px sans-serif'
  ctx.fillText(`订单号: ${ticketData.orderId}`, 16, rect.height - 12)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      resolve()
    }, 'image/png')
  })
}

function extractTicketText(element: HTMLElement) {
  const text = element.textContent || ''
  const movieMatch = text.match(/^(.+)$/m)
  return {
    movieName: movieMatch ? movieMatch[1].trim().split('\n')[0] : '电影票',
    showTime: text.match(/场次[::]\s*(.+)/)?.[1] || '2024-01-01 20:00',
    theaterNumber: text.match(/影厅[::]\s*(.+)/)?.[1] || '1号厅',
    seatNumber: text.match(/座位[::]\s*(.+)/)?.[1] || 'A1',
    orderId: text.match(/订单号[::]\s*(.+)/)?.[1] || 'UNKNOWN',
  }
}
