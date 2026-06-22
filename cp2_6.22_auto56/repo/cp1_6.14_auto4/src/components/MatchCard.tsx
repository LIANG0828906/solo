/**
 * 【文件职责】赛事卡片组件，采用拟物化公告栏设计，含图钉装饰、胶带效果、弹性动画，展示赛事核心信息
 * 【被调用方】HomePage.tsx（遍历渲染列表）、HistoryPage.tsx（历史记录列表）
 * 【数据流向】父组件传入 match 数据 → MatchCard 渲染视觉元素 → 用户点击 → 回调 onCardClick 或跳转详情页
 */
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, UserPlus, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Match } from '@/utils/api';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
  showActions?: boolean;
}

export default function MatchCard({ match, onClick, showActions = true }: MatchCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/matches/${match.id}`);
    }
  };

  const modeColor = match.mode === '3v3' ? 'bg-court-green' : 'bg-court-greenDark';
  const statusConfig = {
    open: { label: '报名中', color: 'bg-court-green text-white' },
    closed: { label: '已满员', color: 'bg-gray-500 text-white' },
    finished: { label: '已结束', color: 'bg-court-brown text-white' },
    cancelled: { label: '已取消', color: 'bg-court-pin text-white' },
  };
  const status = statusConfig[match.status];

  return (
    <div
      className="relative group cursor-pointer animate-bounce-in"
      onClick={handleClick}
    >
      <div
        className={cn(
          'relative bg-court-cream rounded-lg p-5 transition-all duration-300',
          'shadow-[4px_4px_12px_rgba(62,39,35,0.3),-2px_-2px_8px_rgba(255,248,225,0.6)]',
          'hover:shadow-[6px_6px_16px_rgba(62,39,35,0.4),-2px_-2px_10px_rgba(255,248,225,0.7)]',
          'hover:-translate-y-1',
          'border border-court-brown/10'
        )}
      >
        <div
          className="absolute -top-3 left-8 w-20 h-5 animate-pin-drop"
          style={{
            background: 'repeating-linear-gradient(45deg, rgba(139,69,19,0.15) 0px, rgba(139,69,19,0.15) 4px, transparent 4px, transparent 8px)',
            backgroundColor: 'rgba(255, 250, 240, 0.9)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transform: 'rotate(-3deg)',
          }}
        />
        <div
          className="absolute -top-3 right-8 w-16 h-4 animate-pin-drop"
          style={{
            background: 'repeating-linear-gradient(-45deg, rgba(139,69,19,0.15) 0px, rgba(139,69,19,0.15) 4px, transparent 4px, transparent 8px)',
            backgroundColor: 'rgba(255, 250, 240, 0.9)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transform: 'rotate(2deg)',
            animationDelay: '0.1s',
          }}
        />

        <div
          className="absolute -top-2 left-16 w-5 h-5 rounded-full animate-pin-drop"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #FF6B6B 0%, #E53935 40%, #B71C1C 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
          }}
        />
        <div
          className="absolute -top-2 right-20 w-4 h-4 rounded-full animate-pin-drop"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #FF6B6B 0%, #E53935 40%, #B71C1C 100%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
            animationDelay: '0.15s',
          }}
        />

        <div className="flex items-start justify-between mb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className={cn('px-3 py-1 rounded-full text-white text-xs font-bold', modeColor)}>
              {match.mode}
            </span>
            {match.result && (
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold',
                match.result === '胜' && 'bg-green-500 text-white',
                match.result === '负' && 'bg-red-500 text-white',
                match.result === '平' && 'bg-gray-400 text-white',
              )}>
                {match.result}
              </span>
            )}
          </div>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.color)}>
            {status.label}
          </span>
        </div>

        <h3 className="text-lg font-bold text-court-brownDark mb-3 font-display group-hover:text-court-greenDark transition-colors">
          {match.title}
        </h3>

        <div className="space-y-2 text-sm text-court-brown/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-court-green" />
            <span>{match.date}</span>
            <Clock className="w-4 h-4 text-court-green ml-2" />
            <span>{match.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-court-pin" />
            <span className="truncate">{match.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-court-greenDark" />
            <span>
              <span className="font-semibold text-court-greenDark">{match.players.length}</span>
              <span className="mx-0.5">/</span>
              <span>{match.maxPlayers}</span>
              <span className="ml-1 text-xs">人已报名</span>
            </span>
          </div>
        </div>

        {match.players.length > 0 && (
          <div className="mt-4 flex -space-x-2">
            {match.players.slice(0, 6).map((player, idx) => (
              <div
                key={player.userId}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-court-cream',
                  idx % 3 === 0 && 'bg-court-green',
                  idx % 3 === 1 && 'bg-court-greenDark',
                  idx % 3 === 2 && 'bg-court-brown',
                )}
                title={`${player.nickname} - ${player.position}`}
              >
                {player.nickname.charAt(0)}
              </div>
            ))}
            {match.players.length > 6 && (
              <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold border-2 border-court-cream text-gray-600">
                +{match.players.length - 6}
              </div>
            )}
          </div>
        )}

        {showActions && match.status === 'open' && (
          <div className="mt-4 pt-3 border-t border-court-brown/10 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-court-brown/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>发起人: {match.creatorName}</span>
            </div>
            <div className="flex items-center gap-1 text-court-green text-sm font-medium">
              <UserPlus className="w-4 h-4" />
              查看详情
            </div>
          </div>
        )}

        {match.comment && (
          <div className="mt-3 p-2.5 bg-court-brown/5 rounded-lg text-xs text-court-brown/70 italic">
            评语: {match.comment}
          </div>
        )}
      </div>
    </div>
  );
}
