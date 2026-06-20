import { useState, useEffect } from 'react'
import { Coupon } from '../types'

interface CouponCardProps {
  coupon: Coupon
  onUse: (couponId: string) => Promise<void>
}

function formatCountdown(expireTime: string): string {
  const now = Date.now()
  const expire = new Date(expireTime).getTime()
  const diff = expire - now

  if (diff <= 0) return '已过期'

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  if (days > 0) return `剩余${days}天${hours}小时`
  if (hours > 0) return `剩余${hours}小时${minutes}分钟`
  return `剩余${minutes}分钟`
}

function CouponCard({ coupon, onUse }: CouponCardProps) {
  const [countdown, setCountdown] = useState(formatCountdown(coupon.expireTime))
  const [isRemoving, setIsRemoving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isExpired] = useState(new Date(coupon.expireTime) < new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(formatCountdown(coupon.expireTime))
    }, 60000)
    return () => clearInterval(timer)
  }, [coupon.expireTime])

  const handleClick = () => {
    if (coupon.used || isExpired) return
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    setIsRemoving(true)
    setTimeout(() => {
      onUse(coupon.id)
    }, 300)
  }

  const getCardStyle = () => {
    if (coupon.used || isExpired) {
      return { opacity: 0.5 }
    }
    switch (coupon.type) {
      case 'full_reduction':
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
      case 'discount':
        return { background: '#52c41a' }
      case 'buy_gift':
        return {
          background: '#fa8c16',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M0 20L20 0l20 20-20 20z'/%3E%3C/g%3E%3C/svg%3E")`
        }
    }
  }

  return (
    <>
      <div
        className={`coupon-card ${isRemoving ? 'removing' : ''} ${coupon.used ? 'used' : ''}`}
        style={getCardStyle()}
        onClick={handleClick}
      >
        <div className="coupon-content">
          <div className="coupon-header">
            {coupon.type === 'full_reduction' && (
              <div className="coupon-amount">
                <span className="currency">¥</span>
                <span className="value">{coupon.denomination}</span>
              </div>
            )}
            {coupon.type === 'discount' && (
              <div className="coupon-amount">
                <span className="value">折扣</span>
              </div>
            )}
            {coupon.type === 'buy_gift' && (
              <div className="coupon-amount">
                <span className="value">赠</span>
              </div>
            )}
            {coupon.threshold > 0 && (
              <div className="coupon-threshold">满{coupon.threshold}元可用</div>
            )}
          </div>
          
          <div className="coupon-name">{coupon.activityName}</div>
          
          {coupon.type === 'buy_gift' && coupon.giftName && (
            <div className="coupon-gift">赠品：{coupon.giftName}</div>
          )}
          
          <div className="coupon-footer">
            <span className="coupon-expiry">{countdown}</span>
            {coupon.used && <span className="coupon-status">已使用</span>}
            {isExpired && !coupon.used && <span className="coupon-status">已过期</span>}
            {!coupon.used && !isExpired && (
              <span className="coupon-use-btn">点击使用</span>
            )}
          </div>
        </div>
        
        <div className="coupon-cutouts">
          <div className="cutout left"></div>
          <div className="cutout right"></div>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>确认使用优惠券</h3>
            <p>确定要使用「{coupon.activityName}」优惠券吗？</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                确认使用
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CouponCard
