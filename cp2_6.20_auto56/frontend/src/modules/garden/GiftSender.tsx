import { useState } from 'react'
import useUserStore from '../user/UserStore'
import { Pet } from '../../types'

interface GiftSenderProps {
  targetPet: Pet
  onClose: () => void
}

function GiftSender({ targetPet, onClose }: GiftSenderProps) {
  const user = useUserStore((s) => s.user)
  const gifts = useUserStore((s) => s.gifts)
  const sendGift = useUserStore((s) => s.sendGift)
  const [sending, setSending] = useState(false)

  const handleSend = (giftId: string) => {
    const item = user?.inventory.find((i) => i.giftId === giftId)
    if (!item || item.quantity <= 0) return
    setSending(true)
    sendGift(targetPet.id, giftId)
    setTimeout(() => {
      setSending(false)
      onClose()
    }, 500)
  }

  if (!user) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          width: '90%',
          maxWidth: 400,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>🎁 送礼物</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >✕</button>
        </div>

        <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
          选择一个礼物送给 <strong>{targetPet.ownerName}</strong> 的宠物
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {user.inventory.length === 0 ? (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
              还没有礼物，去商店购买吧！
            </p>
          ) : (
            user.inventory.map((item) => {
              const gift = gifts.find((g) => g.id === item.giftId)
              if (!gift || item.quantity <= 0) return null
              return (
                <button
                  key={item.giftId}
                  onClick={() => handleSend(item.giftId)}
                  disabled={sending}
                  className="btn-press"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: 12,
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #fff8e7, #ffecd2)',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 28 }}>{gift.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{gift.name}</span>
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'var(--accent-orange)',
                    color: 'white',
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}>x{item.quantity}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default GiftSender
