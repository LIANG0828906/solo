import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../../store'
import Button from '../../components/Button'
import RarityTag from '../../components/RarityTag'
import Modal from '../../components/Modal'
import type { Listing, Rarity, Fragment } from '../../types'
import { getRarityColor, getRarityName } from '../../modules/nft-core/ItemGenerator'

const MarketPage = () => {
  const listings = useGameStore((s) => s.listings)
  const balance = useGameStore((s) => s.player.balance)
  const fragments = useGameStore((s) => s.player.fragments)
  const purchaseListing = useGameStore((s) => s.purchaseListing)
  const createListing = useGameStore((s) => s.createListing)
  const playerId = useGameStore((s) => s.player.playerId)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all')
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null)
  const [listingPrice, setListingPrice] = useState(50)
  const [showSellModal, setShowSellModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' }>({ msg: '', type: 'success' })

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const ITEM_HEIGHT = 96
  const BUFFER = 5

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (filterRarity !== 'all' && l.rarity !== filterRarity) return false
      if (searchQuery && !l.itemName.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [listings, filterRarity, searchQuery])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop, clientHeight } = scrollRef.current
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER)
    const end = Math.min(filteredListings.length, Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT) + BUFFER)
    setVisibleRange({ start, end })
  }, [filteredListings.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll, filteredListings.length])

  const handlePurchase = (listing: Listing) => {
    const result = purchaseListing(listing.id)
    if (result.success) {
      showToast('✅ 购买成功！碎片已加入背包')
    } else {
      showToast(`❌ ${result.error || '购买失败'}`, 'error')
    }
  }

  const handleSell = () => {
    if (!selectedFragment) return
    if (listingPrice < 10 || listingPrice > 500) {
      showToast('价格必须在10-500金币之间', 'error')
      return
    }
    const success = createListing(
      selectedFragment.id,
      'fragment',
      selectedFragment.name,
      selectedFragment.rarity,
      listingPrice
    )
    if (success) {
      showToast(`✅ 已上架「${selectedFragment.name}」`)
      setShowSellModal(false)
      setSelectedFragment(null)
      setListingPrice(50)
    } else {
      showToast('上架失败', 'error')
    }
  }

  const visibleItems = filteredListings.slice(visibleRange.start, visibleRange.end)
  const topPad = visibleRange.start * ITEM_HEIGHT
  const bottomPad = (filteredListings.length - visibleRange.end) * ITEM_HEIGHT

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>🛒 碎片市场</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            购买稀有碎片，或出售你多余的藏品
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 16px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: 20, border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            <span style={{ color: '#FFD700', fontWeight: 700 }}>🪙 {balance}</span>
          </div>
          <Button onClick={() => setShowSellModal(true)} disabled={fragments.length === 0}>
            📤 上架碎片
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="搜索碎片名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              style={{
                padding: '8px 14px',
                fontSize: 13,
                background: filterRarity === r ? 'linear-gradient(135deg, #00D4AA, #009FCC)' : 'rgba(255,255,255,0.05)',
                border: filterRarity === r ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {r === 'all' ? '全部' : getRarityName(r)}
            </button>
          ))}
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 60,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>没有找到匹配的挂单</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ paddingTop: topPad }}>
            {visibleItems.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onBuy={() => handlePurchase(listing)}
                isOwner={listing.sellerId === playerId}
                balance={balance}
              />
            ))}
          </div>
          <div style={{ paddingBottom: bottomPad }} />
        </div>
      )}

      <Modal open={showSellModal} onClose={() => setShowSellModal(false)} width={520}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 20 }}>📤 上架碎片</h2>

          {fragments.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 30 }}>
              背包里还没有碎片，先去拼图或答题收集一些吧！
            </p>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>
                选择要上架的碎片：
              </p>
              <div
                style={{
                  maxHeight: 240,
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: 8,
                  marginBottom: 20,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 8,
                }}
              >
                {fragments.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFragment(f)}
                    style={{
                      padding: 10,
                      background: selectedFragment?.id === f.id ? 'rgba(0, 212, 170, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${selectedFragment?.id === f.id ? '#00D4AA' : getRarityColor(f.rarity) + '50'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        background: '#2A2A3E',
                        borderRadius: 6,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                      }}
                    >
                      💎
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.name}</div>
                    <RarityTag rarity={f.rarity} />
                  </div>
                ))}
              </div>

              {selectedFragment && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>定价（金币）</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>范围：10 - 500</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={5}
                    value={listingPrice}
                    onChange={(e) => setListingPrice(Number(e.target.value))}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={listingPrice}
                      onChange={(e) => setListingPrice(Math.min(500, Math.max(10, Number(e.target.value))))}
                      style={{
                        width: 120,
                        padding: '10px 14px',
                        fontSize: 18,
                        fontWeight: 700,
                        textAlign: 'center',
                        background: 'rgba(255, 215, 0, 0.08)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: 8,
                        color: '#FFD700',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowSellModal(false)} style={{ flex: 1 }}>
              取消
            </Button>
            <Button onClick={handleSell} disabled={!selectedFragment} style={{ flex: 1 }}>
              确认上架
            </Button>
          </div>
        </div>
      </Modal>

      {toast.msg && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: toast.type === 'success' ? 'rgba(0, 212, 170, 0.9)' : 'rgba(231, 76, 60, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 10,
            fontWeight: 600,
            zIndex: 2000,
            boxShadow: `0 4px 20px ${toast.type === 'success' ? 'rgba(0, 212, 170, 0.4)' : 'rgba(231, 76, 60, 0.4)'}`,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const ListingCard = ({
  listing,
  onBuy,
  isOwner,
  balance,
}: {
  listing: Listing
  onBuy: () => void
  isOwner: boolean
  balance: number
}) => {
  const color = getRarityColor(listing.rarity)
  const canAfford = balance >= listing.price

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: ITEM_HEIGHT,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${color}20, #2A2A3E)`,
          border: `2px solid ${color}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        💎
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{listing.itemName}</span>
          <RarityTag rarity={listing.rarity} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          卖家：{listing.sellerName} · {new Date(listing.listedAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ color: '#FFD700', fontWeight: 800, fontSize: 18 }}>🪙 {listing.price}</div>
        {isOwner ? (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>你的物品</span>
        ) : (
          <Button
            size="sm"
            onClick={onBuy}
            disabled={!canAfford}
            variant={canAfford ? 'primary' : 'secondary'}
          >
            {canAfford ? '购买' : '余额不足'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default MarketPage
