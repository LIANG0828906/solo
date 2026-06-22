import React, { useRef } from 'react'
import { useTheaterStore } from '../stores/theaterStore'
import { downloadTicketAsPng } from '../engine/bookingEngine'

export const TicketCard: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null)
  const showTicketModal = useTheaterStore((s) => s.showTicketModal)
  const currentTicket = useTheaterStore((s) => s.currentTicket)
  const setShowTicketModal = useTheaterStore((s) => s.setShowTicketModal)
  const setCurrentTicket = useTheaterStore((s) => s.setCurrentTicket)

  const handleClose = () => {
    setShowTicketModal(false)
    setTimeout(() => setCurrentTicket(null), 300)
  }

  const handleSave = async () => {
    if (cardRef.current && currentTicket) {
      await downloadTicketAsPng(cardRef.current, `ticket-${currentTicket.orderId}.png`)
    }
  }

  if (!showTicketModal || !currentTicket) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-wrapper">
          <div ref={cardRef} className="ticket-card">
            <div className="ticket-stripes" />
            <div className="ticket-logo">
              <span className="logo-icon">🎬</span>
              <span className="logo-text">CINEMA</span>
            </div>
            <div className="ticket-content">
              <div className="ticket-movie">{currentTicket.movieName}</div>
              <div className="ticket-info-row">
                <span className="info-label">场次</span>
                <span className="info-value">{currentTicket.showTime}</span>
              </div>
              <div className="ticket-info-row">
                <span className="info-label">影厅</span>
                <span className="info-value">{currentTicket.theaterNumber}</span>
              </div>
              <div className="ticket-info-row">
                <span className="info-label">座位</span>
                <span className="info-value">{currentTicket.seatNumber}</span>
              </div>
              <div className="ticket-success">✓ 下单成功</div>
              <div className="ticket-order">订单号: {currentTicket.orderId}</div>
            </div>
            <div className="ticket-qr">
              <div className="qr-inner" />
            </div>
          </div>
        </div>
        <div className="ticket-actions">
          <button className="btn-primary" onClick={handleSave}>
            保存票根
          </button>
          <button className="btn-secondary" onClick={handleClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
