import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Clock, Users, Circle, Square, ListOrdered, Star, X } from 'lucide-react';
import type { Vote } from '@/types';
import { VOTE_TYPE_LABELS, STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface VoteCardProps {
  vote: Vote;
  onEdit?: (vote: Vote) => void;
  onDelete?: (voteId: string) => void;
}

// 根据投票类型获取对应图标组件
const getTypeIcon = (type: Vote['type']) => {
  switch (type) {
    case 'single':
      return Circle;
    case 'multiple':
      return Square;
    case 'rank':
      return ListOrdered;
    case 'score':
      return Star;
    default:
      return Circle;
  }
};

// 根据投票状态获取对应样式
const getStatusStyle = (status: Vote['status']) => {
  switch (status) {
    case 'todo':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'ended':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// 根据投票类型获取卡片边框和标签样式
const getTypeStyle = (type: Vote['type']) => {
  switch (type) {
    case 'single':
      return {
        card: 'border-l-4 border-l-[#4a90d9]',
        label: 'bg-[#4a90d9]/15 border-[#4a90d9]/30 text-[#4a90d9]',
        icon: '#4a90d9',
      };
    case 'multiple':
      return {
        card: 'border-l-4 border-l-[#9c6ade]',
        label: 'bg-[#9c6ade]/15 border-[#9c6ade]/30 text-[#9c6ade]',
        icon: '#9c6ade',
      };
    case 'rank':
      return {
        card: 'border-l-4 border-l-[#ff7b54]',
        label: 'bg-[#ff7b54]/15 border-[#ff7b54]/30 text-[#ff7b54]',
        icon: '#ff7b54',
      };
    case 'score':
      return {
        card: 'border-l-4 border-l-[#ffd700]',
        label: 'bg-[#ffd700]/15 border-[#ffd700]/30 text-[#ffd700]',
        icon: '#ffd700',
      };
    default:
      return {
        card: '',
        label: 'bg-[#4a90d9]/15 border-[#4a90d9]/30 text-[#4a90d9]',
        icon: '#4a90d9',
      };
  }
};

export default function VoteCard({ vote, onEdit, onDelete }: VoteCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const TypeIcon = getTypeIcon(vote.type);
  const typeStyle = getTypeStyle(vote.type);
  const progressPercent = vote.maxVoters > 0
    ? Math.min((vote.currentVoters / vote.maxVoters) * 100, 100)
    : 0;

  // 点击卡片跳转详情页
  const handleCardClick = () => {
    navigate(`/vote/${vote.id}`);
  };

  // 点击编辑按钮
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(vote);
  };

  // 点击删除按钮
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  // 确认删除
  const handleConfirmDelete = () => {
    onDelete?.(vote.id);
    setShowDeleteConfirm(false);
  };

  // 取消删除
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={cn(
        'relative rounded-xl bg-[#2a2f4a] cursor-pointer overflow-hidden',
        'transition-all duration-200 ease-out',
        'shadow-md hover:shadow-2xl hover:-translate-y-1',
        'border border-white/5',
        typeStyle.card,
        isHovered ? 'ring-1 ring-white/10' : ''
      )}
      style={{ borderRadius: '12px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#2a2f4a] p-5 rounded-lg shadow-2xl border border-white/10 m-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold text-base">确认删除</h4>
              <button
                className="text-gray-400 hover:text-white transition-colors p-1"
                onClick={handleCancelDelete}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-5">
              确定要删除投票「{vote.title}」吗？此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                onClick={handleCancelDelete}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm text-white bg-[#ff7b54] hover:bg-[#ff8f6e] rounded-lg transition-colors"
                onClick={handleConfirmDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑和删除按钮 - 悬停时显示 */}
      <div
        className={cn(
          'absolute top-3 right-3 z-10 flex gap-2 transition-all duration-200',
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
        )}
      >
        <button
          className={cn(
            'p-2 rounded-lg transition-all duration-200',
            'bg-white/10 hover:bg-[#4a90d9] text-gray-300 hover:text-white'
          )}
          onClick={handleEditClick}
          title="编辑"
        >
          <Pencil size={16} />
        </button>
        <button
          className={cn(
            'p-2 rounded-lg transition-all duration-200',
            'bg-white/10 hover:bg-[#ff7b54] text-gray-300 hover:text-white'
          )}
          onClick={handleDeleteClick}
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* 卡片内容 */}
      <div className="p-4 sm:p-5">
        {/* 顶部：类型标签和状态标签 */}
        <div className="flex items-start justify-between mb-3 gap-2">
          {/* 投票类型标签 */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md border',
              typeStyle.label
            )}
          >
            <TypeIcon size={14} style={{ color: typeStyle.icon }} />
            <span className="text-xs font-medium" style={{ color: typeStyle.icon }}>
              {VOTE_TYPE_LABELS[vote.type]}
            </span>
          </div>

          {/* 状态标签 */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium border',
              getStatusStyle(vote.status)
            )}
          >
            {STATUS_LABELS[vote.status]}
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-white font-semibold text-base sm:text-lg mb-2 line-clamp-1">
          {vote.title}
        </h3>

        {/* 描述摘要 */}
        <p className="text-gray-400 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
          {vote.description || '暂无描述'}
        </p>

        {/* 截止时间和参与人数 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-gray-500" />
            <span>截止：{dayjs(vote.deadline).format('YYYY-MM-DD HH:mm')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-gray-500" />
            <span>
              {vote.currentVoters}/{vote.maxVoters} 人参与
            </span>
          </div>
        </div>

        {/* 参与进度条 */}
        <div className="w-full">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4a90d9] to-[#5ba0e9] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] sm:text-xs text-gray-500">
            <span>参与进度</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
