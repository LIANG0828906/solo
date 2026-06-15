import { useState, useEffect, useRef } from 'react';
import {
  X, MapPin, Clock, Hand, Check, AlertTriangle, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/time';
import { postClaim } from '@/utils/api';
import { toast } from '@/hooks/useToast';
import type { LostItem } from '@/types';

interface ItemCardProps {
  item: LostItem;
  index?: number;
  isNew?: boolean;
  matchScore?: number;
  isHighMatch?: boolean;
  onClaimed?: (item: LostItem) => void;
}

export default function ItemCard({
  item,
  index = 0,
  isNew = false,
  matchScore,
  isHighMatch,
  onClaimed,
}: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClaimClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isClaimed) {
      toast('此物品已被认领', 'info');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmClaim = async () => {
    setIsClaiming(true);
    try {
      const updated = await postClaim(item.id);
      toast('认领成功！请尽快联系失物招领处取回', 'success');
      setShowConfirm(false);
      setExpanded(false);
      onClaimed?.(updated);
    } catch (err) {
      toast(err instanceof Error ? err.message : '认领失败，请重试', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          'group relative bg-white rounded-2xl overflow-hidden',
          'shadow-sm hover:shadow-xl',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-1',
          'cursor-pointer',
          isNew ? 'animate-slideInTop' : '',
          item.isClaimed && 'opacity-75'
        )}
        style={{
          animationDelay: isNew ? '0ms' : `${index * 60}ms`,
        }}
        onClick={() => setExpanded(true)}
      >
        {isHighMatch && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-yellow-900 bg-gradient-to-r from-yellow-300 to-amber-400 shadow-lg shadow-amber-200/60 animate-[pulse_2s_ease-in-out_infinite]">
            <Crown className="w-3.5 h-3.5" />
            高匹配
          </div>
        )}

        {item.isClaimed && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-green-500 shadow-md">
            <Check className="w-3.5 h-3.5" />
            已认领
          </div>
        )}

        <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 animate-pulse">
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100" />
            </div>
          )}
          <img
            ref={imgRef}
            src={inView && !imgError ? item.image : undefined}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgError(true);
              setImageLoaded(true);
            }}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
              'group-hover:scale-105'
            )}
          />
          {imgError && (
            <div className="absolute inset-0 flex items-center justify-center text-orange-300">
              <MapPin className="w-12 h-12" />
            </div>
          )}

          {matchScore !== undefined && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur text-xs font-semibold text-gray-700 shadow-sm">
              匹配度 <span className={cn(
                isHighMatch ? 'text-amber-600' : 'text-orange-500'
              )}>{matchScore}%</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <h3 className={cn(
            'font-bold text-gray-800 leading-snug line-clamp-1',
            'group-hover:text-[#FFA726] transition-colors'
          )}>
            {item.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#FFA726]" />
            <span className="line-clamp-1">{item.location}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatRelativeTime(item.createdAt)}</span>
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 pt-1">
            {item.description}
          </p>

          <button
            onClick={handleClaimClick}
            disabled={item.isClaimed}
            className={cn(
              'w-full mt-2 py-2.5 rounded-xl text-sm font-semibold',
              'transition-all duration-200 flex items-center justify-center gap-1.5',
              item.isClaimed
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#FFA726] text-white shadow-md hover:shadow-lg hover:bg-orange-500 active:scale-[0.97]'
            )}
          >
            <Hand className="w-4 h-4" />
            {item.isClaimed ? '已被认领' : '我要认领'}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExpanded(false);
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-[cardExpand_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards] max-h-[90vh] flex flex-col"
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md text-gray-500 hover:text-gray-800 hover:bg-white transition-all hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>

            {isHighMatch && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-yellow-900 bg-gradient-to-r from-yellow-300 to-amber-400 shadow-lg">
                <Crown className="w-4 h-4" />
                高匹配度推荐
              </div>
            )}

            {item.isClaimed && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-green-500 shadow-lg">
                <Check className="w-4 h-4" />
                已被认领
              </div>
            )}

            <div className="relative aspect-video bg-gradient-to-br from-orange-50 to-amber-50 flex-shrink-0">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">{item.title}</h2>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm">
                  <MapPin className="w-4 h-4" />
                  {item.location}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatRelativeTime(item.createdAt)}
                </div>
              </div>

              {matchScore !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">智能匹配度</span>
                    <span className={cn(
                      'font-bold',
                      isHighMatch ? 'text-amber-600' : 'text-orange-500'
                    )}>
                      {matchScore}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isHighMatch
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                          : 'bg-gradient-to-r from-orange-400 to-orange-500'
                      )}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">物品详细描述</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex-shrink-0 space-y-2">
              <button
                onClick={handleClaimClick}
                disabled={item.isClaimed || isClaiming}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold text-white',
                  'transition-all duration-200 flex items-center justify-center gap-2',
                  'shadow-lg active:scale-[0.98]',
                  item.isClaimed
                    ? 'bg-gray-300 shadow-none cursor-not-allowed'
                    : 'bg-[#FFA726] hover:bg-orange-500 hover:shadow-xl'
                )}
              >
                <Hand className="w-5 h-5" />
                {isClaiming ? '认领中...' : item.isClaimed ? '该物品已被认领' : '确认认领此物品'}
              </button>
              <p className="text-center text-xs text-gray-400">
                认领后请持有效证件到对应地点领取
              </p>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isClaiming) setShowConfirm(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[cardExpand_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-orange-200/40 animate-[pulseGlow_1.5s_ease-out_infinite]" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/60">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800">确认认领？</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  请确认「{item.title}」是您丢失的物品。
                  <br />
                  认领后将标记为已认领状态，其他人将无法再次认领。
                </p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button
                  onClick={() => !isClaiming && setShowConfirm(false)}
                  disabled={isClaiming}
                  className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmClaim}
                  disabled={isClaiming}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-[#FFA726] hover:bg-orange-500 shadow-lg shadow-orange-200/50 transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-5 h-5" />
                  {isClaiming ? '确认中' : '确认识领'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
