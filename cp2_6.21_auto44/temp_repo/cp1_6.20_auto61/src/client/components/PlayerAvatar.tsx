import { Check, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// 玩家头像组件属性
interface PlayerAvatarProps {
  // 玩家昵称
  nickname: string;
  // 渐变背景色，例如 'from-purple-500 to-pink-500'
  gradient: string;
  // 是否就绪状态
  isReady?: boolean;
  // 是否为队长
  isCaptain?: boolean;
  // 是否为房主
  isHost?: boolean;
  // 头像尺寸
  size?: 'sm' | 'md' | 'lg';
  // 自定义类名
  className?: string;
}

// 尺寸映射
const sizeMap = {
  sm: {
    container: 'w-10 h-10',
    text: 'text-sm',
    badge: 'w-4 h-4',
    badgeIcon: 'w-2.5 h-2.5',
  },
  md: {
    container: 'w-14 h-14',
    text: 'text-lg',
    badge: 'w-5 h-5',
    badgeIcon: 'w-3 h-3',
  },
  lg: {
    container: 'w-20 h-20',
    text: 'text-2xl',
    badge: 'w-6 h-6',
    badgeIcon: 'w-4 h-4',
  },
};

/**
 * 玩家头像组件
 * - 圆形头像，显示昵称首字母
 * - 传入gradient参数作为背景
 * - 就绪状态显示绿色对勾徽章
 * - 队长显示皇冠图标
 * - 房主显示星标图标
 */
export default function PlayerAvatar({
  nickname,
  gradient,
  isReady = false,
  isCaptain = false,
  isHost = false,
  size = 'md',
  className,
}: PlayerAvatarProps) {
  const sizes = sizeMap[size];

  // 获取昵称首字母
  const getInitial = (name: string): string => {
    if (!name || name.length === 0) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* 主头像 */}
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br',
          'ring-2 ring-white/20',
          sizes.container,
          gradient
        )}
      >
        <span className={sizes.text}>{getInitial(nickname)}</span>
      </div>

      {/* 就绪状态徽章 - 绿色对勾 */}
      {isReady && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-cyber-green',
            'flex items-center justify-center text-white',
            'ring-2 ring-space-bg',
            sizes.badge
          )}
        >
          <Check className={sizes.badgeIcon} strokeWidth={3} />
        </div>
      )}

      {/* 队长皇冠图标 - 顶部 */}
      {isCaptain && (
        <div
          className={cn(
            'absolute -top-2 left-1/2 -translate-x-1/2 text-cyber-yellow',
            'drop-shadow-[0_0_6px_rgba(255,217,61,0.8)]',
            size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
          )}
        >
          <Crown fill="currentColor" strokeWidth={1.5} />
        </div>
      )}

      {/* 房主星标图标 - 右上角 */}
      {isHost && (
        <div
          className={cn(
            'absolute -top-1 -right-1 text-cyber-blue',
            'drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]',
            size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4.5 h-4.5' : 'w-5 h-5'
          )}
        >
          <Star fill="currentColor" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
