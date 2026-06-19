import { useEffect, useState } from 'react'
import useUserStore from '../modules/user/UserStore'

interface GiftData {
  id: string
  name: string
  icon: string
  price: number
  description: string
}

const defaultGifts: GiftData[] = [
  { id: 'g1', name: '小花朵', icon: '🌸', price: 5, description: '一朵可爱的小花' },
  { id: 'g2', name: '小鱼干', icon: '🐟', price: 8, description: '猫咪最爱的零食' },
  { id: 'g3', name: '毛线球', icon: '🧶', price: 10, description: '可以玩一整天的玩具' },
  { id: 'g4', name: '星星瓶', icon: '⭐', price: 15, description: '装满星星的许愿瓶' },
  { id: 'g5', name: '彩虹糖', icon: '🍬', price: 6, description: '七彩甜蜜糖果' },
  { id: 'g6', name: '小蛋糕', icon: '🎂', price: 12, description: '美味的迷你蛋糕' },
  { id: 'g7', name: '蝴蝶结', icon: '🎀', price: 9, description: '漂亮的蝴蝶结装饰' },
  { id: 'g8', name: '爱心气球', icon: '🎈', price: 7, description: '充满爱意的气球' },
]

function ShopPage() {
  const user = useUserStore((s) => s.user)
  const gifts = useUserStore((s) => s.gifts)
  const fetchGifts = useUserStore((s) => s.fetchGifts)
  const buyGift = useUserStore((s) => s.buyGift)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchGifts()
  }, [])

  const displayGifts = gifts.length > 0 ? gifts : defaultGifts

  const handleBuy = async (giftId: string, giftName: string, price: number) => {
    if (!user || user.coins < price) {
      setToast('💸 金币不足！')
      setTimeout(() => setToast(null), 2000)
      return
    }
    setBuyingId(giftId)
    const success = await buyGift(giftId)
    setBuyingId(null)
    if (success) {
      setToast(`✅ 成功购买 ${giftName}！`)
    } else {
      setToast('❌ 购买失败')
    }
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🛒 礼物商店</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            购买礼物送给其他玩家的宠物吧！
          </p>
        </div>
        {user && (
          <div style={{
            background: 'rgba(255,255,255,0.8)',
            padding: '8px 16px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>💰</span>
            <span style={{ fontWeight: 700, color: '#b8860b' }}>{user.coins}</span>
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: 'var(--shadow-soft), var(--shadow-inner)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🎁 我的库存</h3>
        {user && user.inventory.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.inventory.map((item) => {
              const gift = displayGifts.find((g) => g.id === item.giftId)
              if (!gift || item.quantity <= 0) return null
              return (
                <div
                  key={item.giftId}
                  style={{
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #fff8e7, #ffe0b2)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{gift.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{gift.name}</span>
                  <span style={{
                    fontSize: 11,
                    color: 'var(--accent-orange)',
                    fontWeight: 700,
                  }}>x{item.quantity}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: 10 }}>
            库存空空如也，快去购买吧～
          </p>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {displayGifts.map((gift, idx) => (
          <div
            key={gift.id}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              boxShadow: 'var(--shadow-soft)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              animation: `fade-drop 0.5s ease-out ${idx * 0.08}s both`,
            }}
          >
            <span style={{ fontSize: 42 }}>{gift.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{gift.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', minHeight: 28 }}>
              {gift.description}
            </span>
            <button
              onClick={() => handleBuy(gift.id, gift.name, gift.price)}
              disabled={buyingId === gift.id}
              className="btn-press"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderRadius: 999,
                background: buyingId === gift.id
                  ? '#ccc'
                  : user && user.coins >= gift.price
                    ? 'linear-gradient(135deg, #ffd700, #ffa500)'
                    : 'linear-gradient(135deg, #ddd, #bbb)',
                color: 'white',
                fontWeight: 700,
                fontSize: 12,
                cursor: buyingId === gift.id ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {buyingId === gift.id ? '购买中...' : (
                <>💰 {gift.price}</>
              )}
            </button>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 2000,
          animation: 'fade-drop 0.3s ease-out',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

export default ShopPage
