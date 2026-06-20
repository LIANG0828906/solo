import { useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import type { CouponWithClaimed, CouponType } from '@shared/types';

interface CouponCardProps {
  coupon: CouponWithClaimed;
  onClaim: (id: string) => void;
  showClaimButton?: boolean;
}

const typeLabelMap: Record<CouponType, string> = {
  fixed: '满减券',
  discount: '折扣券',
  gift: '礼品券',
};

const typeBgColorMap: Record<CouponType, string> = {
  fixed: 'bg-orange-500',
  discount: 'bg-blue-500',
  gift: 'bg-purple-500',
};

const typeTextColorMap: Record<CouponType, string> = {
  fixed: 'text-orange-600',
  discount: 'text-blue-600',
  gift: 'text-purple-600',
};

export default function CouponCard({ coupon, onClaim, showClaimButton = true }: CouponCardProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(coupon.validUntil);
  const [isRippling, setIsRippling] = useState(false);

  const isClaimedOut = coupon.claimedQuantity >= coupon.totalQuantity;
  const isDisabled = coupon.claimed || isClaimedOut || isExpired;

  const formatTimeUnit = (value: number) => String(value).padStart(2, '0');

  const renderDiscountDetail = () => {
    switch (coupon.type) {
      case 'fixed':
        return `满${coupon.rule.minAmount}减${coupon.rule.discountAmount}`;
      case 'discount':
        return `${coupon.rule.discountRate}折 上限${coupon.rule.maxDiscount}元`;
      case 'gift':
        return `￥${coupon.rule.giftAmount}礼品`;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (isExpired) return '已过期';
    if (coupon.claimed) return '已领取';
    if (isClaimedOut) return '已领完';
    return '立即领取';
  };

  const handleClaim = () => {
    if (isDisabled) return;

    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    onClaim(coupon.id);
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg bg-white transition-all duration-300',
        'shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]',
        isExpired && 'opacity-50 grayscale',
        'overflow-hidden'
      )}
    >
      <div className="flex flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {coupon.name}
            </h3>
            <p className={cn('mt-1 text-lg font-bold', typeTextColorMap[coupon.type])}>
              {renderDiscountDetail()}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 inline-flex items-center px-2.5 py-1 rounded text-xs font-medium text-white',
              typeBgColorMap[coupon.type]
            )}
          >
            {typeLabelMap[coupon.type]}
          </span>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          <p>已领取 {coupon.claimedQuantity}/{coupon.totalQuantity}</p>
        </div>

        <div className="mt-3 flex items-center gap-1 text-sm">
          {isExpired ? (
            <span className="text-gray-400 font-medium">已过期</span>
          ) : (
            <>
              <span className="text-gray-500">剩余</span>
              <span className="font-mono font-semibold text-gray-800">
                {days > 0 && `${days}天 `}
                {formatTimeUnit(hours)}:{formatTimeUnit(minutes)}:{formatTimeUnit(seconds)}
              </span>
            </>
          )}
        </div>

        {showClaimButton && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClaim}
              disabled={isDisabled}
              className={cn(
                'ripple-btn w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : cn(
                      'text-white',
                      typeBgColorMap[coupon.type],
                      'hover:opacity-90 active:scale-[0.98]',
                      'focus:ring-opacity-50'
                    ),
                isRippling && !isDisabled && 'ripple-active'
              )}
            >
              {getButtonText()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
