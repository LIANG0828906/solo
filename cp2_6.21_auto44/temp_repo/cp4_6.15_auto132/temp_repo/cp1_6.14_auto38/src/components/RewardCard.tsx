import { useState } from 'react';
import { Gift, Star, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reward, Member } from '@/types';

interface RewardCardProps {
  reward: Reward;
  currentMember: Member | null;
  onRedeem: (rewardId: string) => Promise<void>;
  className?: string;
}

export default function RewardCard({
  reward,
  currentMember,
  onRedeem,
  className,
}: RewardCardProps) {
  const [isRedeeming, setIsRedeeming] = useState(false);

  const userPoints = currentMember?.points || 0;
  const canAfford = userPoints >= reward.points;
  const pointsNeeded = reward.points - userPoints;
  const outOfStock = reward.stock <= 0;
  const isDisabled = !canAfford || outOfStock || isRedeeming || !currentMember;

  const handleRedeem = async () => {
    if (isDisabled) return;

    setIsRedeeming(true);
    try {
      await onRedeem(reward.id);
    } catch (error) {
      console.error('Failed to redeem reward:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white p-5',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1',
        outOfStock && 'opacity-60 grayscale',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-center">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-primary-100 to-primary-200',
            'shadow-inner'
          )}
        >
          <Gift className="h-10 w-10 text-primary-500" />
        </div>
      </div>

      <h3 className="mb-2 text-center text-lg font-bold text-gray-800">
        {reward.name}
      </h3>

      {reward.description && (
        <p className="mb-4 text-center text-sm text-gray-500 line-clamp-2">
          {reward.description}
        </p>
      )}

      <div className="mb-4 flex items-center justify-center gap-2">
        <Star className="h-5 w-5 fill-primary-500 text-primary-500" />
        <span className="text-2xl font-bold text-primary-600">{reward.points}</span>
        <span className="text-sm text-gray-500">积分</span>
      </div>

      <div className="mb-4 flex items-center justify-center gap-1 text-sm">
        <Package className="h-4 w-4 text-gray-400" />
        <span className={cn(outOfStock ? 'text-red-500 font-medium' : 'text-gray-500')}>
          {outOfStock ? '已售罄' : `库存: ${reward.stock}`}
        </span>
      </div>

      <button
        onClick={handleRedeem}
        disabled={isDisabled}
        className={cn(
          'relative w-full overflow-hidden rounded-xl py-3 font-semibold text-sm',
          'transition-all duration-300',
          !isDisabled && [
            'bg-gradient-to-r from-primary-500 to-primary-400 text-white',
            'shadow-lg shadow-primary-200',
            'hover:shadow-xl hover:shadow-primary-300 hover:-translate-y-0.5',
            'active:translate-y-0 active:shadow-md',
          ],
          isDisabled && [
            'bg-gray-200 text-gray-500 cursor-not-allowed',
            outOfStock ? 'bg-red-100 text-red-400' : '',
          ]
        )}
      >
        {isRedeeming ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            兑换中...
          </span>
        ) : !currentMember ? (
          '请先登录'
        ) : outOfStock ? (
          '已售罄'
        ) : canAfford ? (
          '立即兑换'
        ) : (
          <span className="flex items-center justify-center gap-1">
            还差 <span className="font-bold">{pointsNeeded}</span> 分
          </span>
        )}
      </button>

      {!canAfford && currentMember && !outOfStock && (
        <div className="mt-2 text-center">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500"
              style={{ width: `${Math.min((userPoints / reward.points) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            已获得 {userPoints} / {reward.points} 分
          </p>
        </div>
      )}
    </div>
  );
}
