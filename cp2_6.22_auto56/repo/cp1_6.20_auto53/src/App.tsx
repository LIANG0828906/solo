import { useEffect, useState, useCallback } from 'react'
import type { CouponWithClaimed } from '@shared/types'
import CouponCard from '@/components/CouponCard'
import CreateForm from '@/components/CreateForm'
import UserWallet from '@/components/UserWallet'
import RedeemPage from '@/components/RedeemPage'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const USER_ID = 'user_001'
const PRIMARY_COLOR = '#FF6B35'

type Route = '#/list' | '#/create' | '#/wallet' | '#/redeem'

const TABS: { key: Route; label: string }[] = [
  { key: '#/list', label: '优惠券列表' },
  { key: '#/create', label: '创建优惠券' },
  { key: '#/wallet', label: '我的卡包' },
  { key: '#/redeem', label: '券码核销' },
]

function getCurrentRoute(): Route {
  const hash = window.location.hash || '#/list'
  if (hash === '#/create' || hash === '#/wallet' || hash === '#/redeem') {
    return hash
  }
  return '#/list'
}

export default function App() {
  const [route, setRoute] = useState<Route>(getCurrentRoute())
  const [coupons, setCoupons] = useState<CouponWithClaimed[]>([])
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/coupons?userId=${encodeURIComponent(USER_ID)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch coupons')
      }
      const data: CouponWithClaimed[] = await response.json()
      setCoupons(data)
    } catch (error) {
      console.error('Error fetching coupons:', error)
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getCurrentRoute())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleClaim = async (couponId: string) => {
    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponId,
          userId: USER_ID,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setClaimMessage('领取成功')
        await fetchCoupons()
      } else {
        setClaimMessage(data.message || '领取失败')
      }
      setTimeout(() => setClaimMessage(''), 3000)
    } catch (error) {
      console.error('Claim error:', error)
      setClaimMessage('网络错误，请稍后重试')
      setTimeout(() => setClaimMessage(''), 3000)
    }
  }

  const handleCreateCoupon = async (data: any) => {
    try {
      setCreateLoading(true)
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        setClaimMessage('创建成功')
        await fetchCoupons()
        window.location.hash = '#/list'
      } else {
        setClaimMessage(result.message || '创建失败')
      }
      setTimeout(() => setClaimMessage(''), 3000)
    } catch (error) {
      console.error('Create coupon error:', error)
      setClaimMessage('网络错误，请稍后重试')
      setTimeout(() => setClaimMessage(''), 3000)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleTabClick = (tabKey: Route) => {
    window.location.hash = tabKey
  }

  const renderListPage = () => {
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
        </div>
      )
    }

    if (coupons.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
          <p>暂无优惠券</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {coupons.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} onClaim={handleClaim} />
        ))}
      </div>
    )
  }

  const renderCreatePage = () => {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">创建优惠券</h2>
        <CreateForm onCreate={handleCreateCoupon} loading={createLoading} />
      </div>
    )
  }

  const renderWalletPage = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">我的卡包</h2>
        <UserWallet userId={USER_ID} />
      </div>
    )
  }

  const renderRedeemPage = () => {
    return <RedeemPage />
  }

  const renderContent = () => {
    switch (route) {
      case '#/list':
        return renderListPage()
      case '#/create':
        return renderCreatePage()
      case '#/wallet':
        return renderWalletPage()
      case '#/redeem':
        return renderRedeemPage()
      default:
        return renderListPage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header style={{ backgroundColor: PRIMARY_COLOR }} className="text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-bold">优惠券管理</h1>
            <div className="text-sm opacity-80">用户ID: {USER_ID}</div>
          </div>
          <nav className="flex overflow-x-auto -mx-4 px-4">
            {TABS.map((tab) => {
              const isActive = route === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative',
                    isActive ? 'text-white' : 'text-white/70 hover:text-white'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {claimMessage && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {claimMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto pb-8">
        {renderContent()}
      </main>
    </div>
  )
}
