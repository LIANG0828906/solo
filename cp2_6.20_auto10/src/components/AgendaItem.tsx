import { useState, useRef, useEffect } from 'react';
import {
  GripVertical,
  Clock,
  User,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AgendaItem, AgendaStatus, Comment } from '@/types';
import { useAppStore } from '@/store';
import { meetingWS } from '@/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AgendaItemCardProps {
  item: AgendaItem;
  meetingId: string;
  index: number;
}

const statusConfig: Record<AgendaStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: { label: '待讨论', icon: PauseCircle, color: 'text-dark-300' },
  discussing: { label: '讨论中', icon: PlayCircle, color: 'text-primary-400' },
  resolved: { label: '已决议', icon: CheckCircle, color: 'text-green-400' },
  postponed: { label: '延后', icon: AlertCircle, color: 'text-yellow-400' },
};

export default function AgendaItemCard({ item, meetingId, index }: AgendaItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [newCommentId, setNewCommentId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const { currentUser, addComment, castVote, updateAgendaStatus, meetings } = useAppStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const meeting = meetings.find((m) => m.id === meetingId);
  const userVote = item.votes.find((v) => v.userId === currentUser.id);
  const agreeCount = item.votes.filter((v) => v.type === 'agree').length;
  const disagreeCount = item.votes.filter((v) => v.type === 'disagree').length;
  const abstainCount = item.votes.filter((v) => v.type === 'abstain').length;

  const handleSubmitComment = () => {
    if (!commentInput.trim()) return;
    addComment(meetingId, item.id, commentInput.trim());
    meetingWS.sendComment(item.id, commentInput.trim());
    const tempId = `temp-${Date.now()}`;
    setNewCommentId(tempId);
    setCommentInput('');
    setTimeout(() => setNewCommentId(null), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleVote = (type: 'agree' | 'disagree' | 'abstain') => {
    castVote(meetingId, item.id, type);
    meetingWS.sendVote(item.id, type);
  };

  const handleStatusChange = (status: AgendaStatus) => {
    updateAgendaStatus(meetingId, item.id, status);
    meetingWS.sendStatusChange(item.id, status);
    setShowStatusMenu(false);
  };

  useEffect(() => {
    if (expanded && commentsEndRef.current) {
      commentsEndRef.current.scrollTop = commentsEndRef.current.scrollHeight;
    }
  }, [expanded, item.comments.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const StatusIcon = statusConfig[item.status].icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`agenda-card status-${item.status} ${isDragging ? 'shadow-2xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 cursor-grab active:cursor-grabbing text-dark-400 hover:text-dark-200 transition-colors"
        >
          <GripVertical size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary-400">#{index + 1}</span>
                <h3 className="font-medium text-dark-100">{item.title}</h3>
              </div>
              {item.description && expanded && (
                <p className="text-sm text-dark-300 mt-2">{item.description}</p>
              )}
            </div>

            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105 ${
                  statusConfig[item.status].color
                } bg-white/5 hover:bg-white/10`}
              >
                <StatusIcon size={14} />
                <span>{statusConfig[item.status].label}</span>
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-dark-700 border border-white/10 rounded-xl shadow-xl z-20 min-w-[120px] animate-slide-down">
                  {(Object.keys(statusConfig) as AgendaStatus[]).map((status) => {
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 ${config.color}`}
                      >
                        <Icon size={14} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {item.responsible}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {item.duration}分钟
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={14} />
              {item.comments.length}
            </span>
          </div>

          {item.resolution && expanded && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs font-medium text-green-400 mb-1">决议</p>
              <p className="text-sm text-dark-200">{item.resolution}</p>
            </div>
          )}

          {expanded && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400">投票：</span>
                <button
                  onClick={() => handleVote('agree')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all hover:scale-105 ${
                    userVote?.type === 'agree'
                      ? 'bg-green-500/30 text-green-400 border border-green-500/40'
                      : 'bg-white/5 text-dark-300 hover:bg-green-500/10 hover:text-green-400'
                  }`}
                >
                  <ThumbsUp size={12} />
                  赞成 {agreeCount > 0 && `(${agreeCount})`}
                </button>
                <button
                  onClick={() => handleVote('disagree')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all hover:scale-105 ${
                    userVote?.type === 'disagree'
                      ? 'bg-red-500/30 text-red-400 border border-red-500/40'
                      : 'bg-white/5 text-dark-300 hover:bg-red-500/10 hover:text-red-400'
                  }`}
                >
                  <ThumbsDown size={12} />
                  反对 {disagreeCount > 0 && `(${disagreeCount})`}
                </button>
                <button
                  onClick={() => handleVote('abstain')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all hover:scale-105 ${
                    userVote?.type === 'abstain'
                      ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/40'
                      : 'bg-white/5 text-dark-300 hover:bg-yellow-500/10 hover:text-yellow-400'
                  }`}
                >
                  <Minus size={12} />
                  弃权 {abstainCount > 0 && `(${abstainCount})`}
                </button>
              </div>

              <div>
                <p className="text-xs text-dark-400 mb-2">批注 ({item.comments.length})</p>
                <div
                  ref={commentsEndRef}
                  className="max-h-60 overflow-y-auto space-y-3 pr-2"
                >
                  {item.comments.length === 0 ? (
                    <p className="text-center text-dark-500 text-sm py-4">暂无批注</p>
                  ) : (
                    item.comments.map((comment) => (
                      <CommentBubble
                        key={comment.id}
                        comment={comment}
                        isSelf={comment.userId === currentUser.id}
                        isNew={comment.id === newCommentId}
                      />
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="avatar-bubble flex-shrink-0" style={{ backgroundColor: currentUser.color }}>
                    {currentUser.avatar}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="添加批注..."
                      className="input-field pr-10 py-2 text-sm"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary-500 text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-dark-400 hover:text-primary-400 flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} />
                收起
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                展开详情
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentBubble({ comment, isSelf, isNew }: { comment: Comment; isSelf: boolean; isNew: boolean }) {
  return (
    <div
      className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : ''} ${isNew ? 'comment-enter' : ''}`}
    >
      <div
        className="avatar-bubble flex-shrink-0"
        style={{ backgroundColor: comment.userColor }}
      >
        {comment.userAvatar}
      </div>
      <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        <span className="text-xs text-dark-400 mb-1">
          {comment.userName}
          <span className="ml-2 text-dark-500">
            {format(comment.timestamp, 'HH:mm', { locale: zhCN })}
          </span>
        </span>
        <div className={`comment-bubble ${isSelf ? 'self' : 'other'}`}>
          {comment.content}
        </div>
      </div>
    </div>
  );
}
