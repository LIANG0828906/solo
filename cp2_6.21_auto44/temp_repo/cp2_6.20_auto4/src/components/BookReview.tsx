import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, MessageCircle, AlertTriangle, X } from 'lucide-react';
import { useStore } from '@/store/index';
import type { Comment } from '@/types';

const MAX_CHARS = 200;

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let i = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${i}`} className="ml-4 list-disc space-y-0.5">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderBold(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^- /.test(line)) {
      listItems.push(line.replace(/^- /, ''));
    } else {
      flushList();
      elements.push(<p key={i}>{renderBold(line)}</p>);
    }
  }
  flushList();

  return elements;
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function CommentItem({
  comment,
  depth = 0,
  onLike,
  onReply,
}: {
  comment: Comment;
  depth?: number;
  onLike: (id: string) => void;
  onReply: (id: string, content: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [reportConfirmOpen, setReportConfirmOpen] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike(comment.id);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
  };

  const handleReport = () => {
    setReportConfirmOpen(true);
  };

  const confirmReport = () => {
    setTimeout(() => {
      alert('举报已提交，感谢您的反馈！');
    }, 100);
    setReportConfirmOpen(false);
  };

  const barColor = depth === 0 ? 'border-orange-300' : 'border-orange-100';

  return (
    <div className={`border-l-[3px] ${barColor} pl-4 py-3`}>
      <div className="flex items-center gap-2">
        <img
          src={comment.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.userName}`}
          alt={comment.userName}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="text-sm font-medium text-text">{comment.userName}</span>
        <span className="text-xs text-text-muted">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
        </span>
      </div>

      <div className="mt-2 text-sm leading-relaxed text-text-light">
        {renderMarkdown(comment.content)}
      </div>

      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-red-500"
        >
          <Heart
            size={14}
            className={`transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : ''}`}
          />
          <span>{comment.likes}</span>
        </button>
        <button
          onClick={() => setReplyOpen(!replyOpen)}
          className="flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-orange-500"
        >
          <MessageCircle size={14} />
          <span>回复</span>
        </button>
        <button
          onClick={handleReport}
          className="ml-auto flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-red-500"
        >
          <AlertTriangle size={14} />
          <span>举报</span>
        </button>
      </div>

      {reportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReportConfirmOpen(false)}
          />
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <button
              onClick={() => setReportConfirmOpen(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-cream-dark/30 transition-colors"
            >
              <X size={16} className="text-text-muted" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold text-text">确认举报此评论？</h4>
                <p className="text-xs text-text-muted">提交后将由管理员审核处理</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReportConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-cream-dark text-text text-sm font-medium hover:bg-cream-dark/30 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReport}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors active:scale-95"
              >
                确认举报
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: replyOpen ? 200 : 0 }}
      >
        <div className="mt-2 flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="写下你的回复..."
            className="flex-1 resize-none rounded-lg border border-cream-dark bg-cream-dark/30 px-3 py-2 text-sm outline-none focus:border-orange"
            rows={2}
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="self-end rounded-lg bg-orange px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            发送
          </button>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onLike={onLike}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookReview({ bookId }: { bookId: string }) {
  const {
    comments,
    commentsTotal,
    commentSortType,
    commentsPage,
    commentsLoading,
    fetchComments,
    addComment,
    likeComment,
    replyComment,
    setSortType,
  } = useStore();

  const [newContent, setNewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchComments(bookId);
  }, [bookId, commentSortType, fetchComments]);

  const remaining = MAX_CHARS - newContent.length;

  const handleSubmit = () => {
    if (!newContent.trim()) return;
    addComment({ bookId, content: newContent.trim() });
    setNewContent('');
    setShowPreview(false);
  };

  const loadMore = () => {
    useStore.setState({ commentsPage: commentsPage + 1 });
    fetchComments(bookId);
  };

  const hasMore = comments.length < commentsTotal;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            {newContent.length > 0 && `${remaining}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-cream-dark/30"
            >
              {showPreview ? '编辑' : '预览'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newContent.trim() || remaining < 0}
              className="rounded-lg bg-orange px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              发表评论
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className="mt-2 min-h-[80px] rounded-lg border border-cream-dark bg-cream-dark/30 p-3 text-sm text-text-light">
            {newContent ? renderMarkdown(newContent) : <span className="text-text-muted">暂无内容</span>}
          </div>
        ) : (
          <div className="relative mt-2">
            <textarea
              value={newContent}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setNewContent(e.target.value);
              }}
              placeholder="分享你的读书感悟..."
              maxLength={MAX_CHARS}
              className="w-full resize-none rounded-lg border border-cream-dark bg-cream-dark/30 px-3 py-2 text-sm outline-none transition-colors focus:border-orange"
              rows={3}
            />
            <span
              className={`absolute bottom-2 right-3 text-xs ${
                remaining <= 20 ? 'text-red-400' : 'text-text-muted'
              }`}
            >
              {remaining}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-cream-dark/30 p-1">
        {(['latest', 'popular'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortType(sort)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              commentSortType === sort
                ? 'bg-white text-orange shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {sort === 'latest' ? '最新' : '最热'}
          </button>
        ))}
      </div>

      {commentsLoading && comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">暂无评论，快来发表第一条吧！</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl bg-white p-4 shadow-sm">
              <CommentItem
                comment={comment}
                onLike={likeComment}
                onReply={replyComment}
              />
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full rounded-lg border border-cream-dark py-2 text-sm text-text-muted transition-colors hover:bg-cream-dark/30 hover:text-orange"
            >
              加载更多
            </button>
          )}
        </div>
      )}
    </div>
  );
}
