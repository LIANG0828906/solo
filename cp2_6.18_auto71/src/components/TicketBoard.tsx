import { useState, useEffect, useCallback } from 'react'
import { useTicketStore, type TicketStatus, type Ticket } from '../store/ticketStore'

const STATUS_LIST: (TicketStatus | '全部')[] = ['全部', '待审核', '审核中', '已通过', '已驳回', '退款完成']

const STATUS_COLOR: Record<TicketStatus, string> = {
  '待审核': '#F59E0B',
  '审核中': '#3B82F6',
  '已通过': '#10B981',
  '已驳回': '#EF4444',
  '退款完成': '#8B5CF6',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function truncate(s: string, len: number): string {
  if (s.length <= len) return s
  return s.slice(0, len) + '...'
}

function TicketCard({ ticket, onAction }: { ticket: Ticket; onAction: (id: string, action: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  const triggerPulse = useCallback(() => {
    setPulsing(true)
    setTimeout(() => setPulsing(false), 600)
  }, [])

  const handleAction = (action: string) => {
    if (action === 'startReview') {
      triggerPulse()
    }
    onAction(ticket.id, action)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: hovered
          ? '0 6px 20px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        outline: pulsing ? `2px solid ${STATUS_COLOR['审核中']}` : 'none',
        outlineOffset: pulsing ? '0px' : '0px',
        animation: pulsing ? 'pulse-border 0.6s ease' : 'none',
        boxSizing: 'border-box',
      } as React.CSSProperties}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>
          {ticket.itemName || '未命名商品'}
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            background: STATUS_COLOR[ticket.status],
            transition: 'background 0.3s ease, opacity 0.3s ease',
            whiteSpace: 'nowrap',
            marginLeft: '8px',
          }}
        >
          {ticket.status}
        </span>
      </div>

      <div style={{ fontSize: '18px', fontWeight: 700, color: '#D97706', marginBottom: '6px' }}>
        ¥{ticket.amount.toFixed(2)}
      </div>

      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
        工单号：{ticket.id}
      </div>
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>
        订单号：{ticket.orderId}
      </div>
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>
        {formatTime(ticket.createdAt)}
      </div>

      {hovered && ticket.reason && (
        <div
          style={{
            fontSize: '13px',
            color: '#6B7280',
            paddingTop: '8px',
            borderTop: '1px solid #F3F4F6',
            marginTop: '4px',
            lineHeight: 1.5,
          }}
        >
          {truncate(ticket.reason, 30)}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {ticket.status === '待审核' && (
          <ActionButton label="审核" color="#3B82F6" onClick={() => handleAction('startReview')} />
        )}
        {ticket.status === '审核中' && (
          <>
            <ActionButton label="通过" color="#10B981" onClick={() => handleAction('approve')} />
            <ActionButton label="驳回" color="#EF4444" onClick={() => handleAction('reject')} />
          </>
        )}
        {ticket.status === '已通过' && (
          <ActionButton label="标记退款完成" color="#8B5CF6" onClick={() => handleAction('completeRefund')} />
        )}
      </div>

      <style>{`
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(59,130,246,0.2); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  )
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '6px 14px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#fff',
        background: hover ? color : color + 'CC',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
      }}
    >
      {label}
    </button>
  )
}

export default function TicketBoard() {
  const statusFilter = useTicketStore((s) => s.statusFilter)
  const updateFilter = useTicketStore((s) => s.updateFilter)
  const filteredTickets = useTicketStore((s) => s.filteredTickets)
  const countByStatus = useTicketStore((s) => s.countByStatus)
  const updateStatus = useTicketStore((s) => s.updateStatus)
  const approve = useTicketStore((s) => s.approve)
  const reject = useTicketStore((s) => s.reject)
  const completeRefund = useTicketStore((s) => s.completeRefund)
  const tickets = filteredTickets()

  function handleAction(id: string, action: string) {
    switch (action) {
      case 'startReview':
        updateStatus(id, '审核中')
        break
      case 'approve':
        approve(id)
        break
      case 'reject':
        reject(id)
        break
      case 'completeRefund':
        completeRefund(id)
        break
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>
        工单看板
      </h2>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {STATUS_LIST.map((s) => {
          const active = statusFilter === s
          const count = countByStatus(s)
          return (
            <button
              key={s}
              onClick={() => updateFilter(s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                background: active ? '#4F46E5' : '#E5E7EB',
                color: active ? '#fff' : '#374151',
                transition: 'background 0.25s ease, color 0.25s ease',
              }}
            >
              {s}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  background: active ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                  color: active ? '#fff' : '#374151',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: '15px' }}>
          暂无工单
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
