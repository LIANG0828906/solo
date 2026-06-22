import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Loader2, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClaimedCouponWithCoupon } from '@shared/types'

interface UserWalletProps {
  userId: string
}

export default function UserWallet({ userId }: UserWalletProps) {
  const [claims, setClaims] = useState<ClaimedCouponWithCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map())

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/claims?userId=${encodeURIComponent(userId)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch claims')
        }
        const data: ClaimedCouponWithCoupon[] = await response.json()
        setClaims(data)
      } catch (error) {
        console.error('Error fetching claims:', error)
        setClaims([])
      } finally {
        setLoading(false)
      }
    }

    fetchClaims()
  }, [userId])

  useEffect(() => {
    claims.forEach((claim) => {
      const canvas = canvasRefs.current.get(claim.couponId)
      if (canvas) {
        QRCode.toCanvas(
          canvas,
          `${claim.couponId}:${userId}`,
          { width: 120, margin: 1 },
          (err) => {
            if (err) {
              console.error('Error generating QR code:', err)
            }
          }
        )
      }
    })
  }, [claims, userId])

  const setCanvasRef = (id: string) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(id, el)
    }
  }

  const renderDiscountDetail = (claim: ClaimedCouponWithCoupon) => {
    const { rule, type } = claim.coupon
    switch (type) {
      case 'fixed':
        return `满${rule.minAmount}减${rule.discountAmount}`
      case 'discount':
        return `${rule.discountRate}折 上限${rule.maxDiscount}元`
      case 'gift':
        return `￥${rule.giftAmount}礼品`
      default:
        return null
    }
  }

  const getDiscountAmount = (claim: ClaimedCouponWithCoupon) => {
    const { rule, type } = claim.coupon
    if (type === 'fixed') return rule.discountAmount
    if (type === 'discount') return rule.discountRate
    return rule.giftAmount
  }

  const getDiscountUnit = (claim: ClaimedCouponWithCoupon) => {
    const { type } = claim.coupon
    if (type === 'discount') return '折'
    return '元'
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (claims.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Ticket className="h-12 w-12 opacity-50" />
        <p>暂无优惠券</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex gap-4 overflow-x-auto pb-4',
          '[&::-webkit-scrollbar]:h-2',
          '[&::-webkit-scrollbar-track]:rounded-full',
          '[&::-webkit-scrollbar-track]:bg-gray-100',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-thumb]:bg-gray-300',
          '[&::-webkit-scrollbar-thumb]:hover:bg-gray-400',
          'scrollbar-thin',
          'scrollbar-track-gray-100',
          'scrollbar-thumb-gray-300'
        )}
      >
        {claims.map((claim) => (
          <div
            key={claim.couponId}
            className={cn(
              'flex min-w-[280px] shrink-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
              claim.used ? 'border-gray-200 opacity-75' : 'border-orange-200'
            )}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{claim.coupon.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{renderDiscountDetail(claim)}</p>
              </div>
              <div
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  claim.used
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-orange-100 text-orange-700'
                )}
              >
                {claim.used ? '已使用' : '未使用'}
              </div>
            </div>

            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-orange-600">
                {claim.coupon.type === 'discount' ? '' : '¥'}
                {getDiscountAmount(claim)}
              </span>
              <span className="text-sm text-gray-400">{getDiscountUnit(claim)}优惠</span>
            </div>

            <div className="mb-4 text-xs text-gray-400">
              有效期至：{new Date(claim.coupon.validUntil).toLocaleDateString('zh-CN')}
            </div>

            <div className="mt-auto flex items-center justify-center rounded-xl bg-gray-50 p-3">
              <canvas ref={setCanvasRef(claim.couponId)} key={claim.couponId} className="h-[120px] w-[120px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
