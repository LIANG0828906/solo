import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock } from 'lucide-react';
import { ImageCarousel } from './components/ImageCarousel';
import { useItemStore } from './itemStore';
import { useUserStore } from './userStore';
import { useExchangeStore } from './exchangeStore';
import { getDaysLeft, getConditionLabel, formatTimeAgo, cn } from './utils';

export const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItemById, getCommentsByItem, addComment } = useItemStore();
  const { getUserById, currentUser } = useUserStore();
  const { addRequest } = useExchangeStore();

  const [comment, setComment] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const item = id ? getItemById(id) : undefined;
  const owner = item ? getUserById(item.userId) : undefined;
  const comments = item ? getCommentsByItem(item.id) : [];

  const daysLeft = item ? getDaysLeft(item.createdAt) : 0;

  const handleSubmitComment = () => {
    if (!comment.trim() || !item || !currentUser) return;

    addComment({
      itemId: item.id,
      userId: currentUser.id,
      content: comment.trim(),
    });

    const newCommentId = 'comment_' + Date.now();
    setHighlightedCommentId(newCommentId);
    setComment('');

    setTimeout(() => setHighlightedCommentId(null), 1000);

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExchangeRequest = () => {
    if (!item || !currentUser) return;
    addRequest({
      fromUserId: currentUser.id,
      toUserId: item.userId,
      itemId: item.id,
      status: 'pending',
    });
    setShowConfirm(false);
    alert('交换请求已发送！等待对方确认~');
  };

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">物品不存在</p>
      </div>
    );
  }

  const isOwner = currentUser?.id === item.userId;

  return (
    <div className="min-h-screen bg-orange-50/30">
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md btn-bounce"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <ImageCarousel images={item.images} />
      </div>

      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 min-h-[60vh]">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800 flex-1">{item.title}</h1>
            <span
              className={cn(
                'text-xs px-3 py-1 rounded-full font-bold flex-shrink-0',
                daysLeft <= 5
                  ? 'bg-red-100 text-red-500'
                  : daysLeft <= 10
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-green-100 text-green-600'
              )}
            >
              剩 {daysLeft} 天下架
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">新旧程度:</span>
            <span className="text-sm font-medium text-orange-500">
              {item.condition}/10
            </span>
            <span className="text-xs text-gray-400">({getConditionLabel(item.condition)})</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {item.categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium"
              >
                {cat}
              </span>
            ))}
          </div>

          {owner && (
            <div className="flex items-center gap-3 py-4 border-t border-b border-orange-100 mb-4">
              <img
                src={owner.avatar}
                alt={owner.nickname}
                className="w-12 h-12 rounded-full bg-orange-100"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{owner.nickname}</p>
                <p className="text-xs text-gray-400">{owner.addressRange}</p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end">
                {owner.skillTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">物品描述</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>💬</span>
              <span>留言区</span>
              <span className="text-xs text-gray-400 font-normal">({comments.length}条)</span>
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  还没有留言，来说点什么吧~
                </p>
              ) : (
                comments.map((c) => {
                  const commentUser = getUserById(c.userId);
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'flex gap-3 p-3 rounded-2xl transition-colors duration-500',
                        highlightedCommentId === c.id ? 'bg-orange-100 animate-highlight' : 'bg-orange-50/50'
                      )}
                    >
                      <img
                        src={commentUser?.avatar}
                        alt=""
                        className="w-9 h-9 rounded-full flex-shrink-0 bg-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {commentUser?.nickname || '匿名用户'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 break-words">{c.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {currentUser && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  placeholder="想问问物品的情况？"
                  className="flex-1 px-4 py-3 bg-orange-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim()}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center btn-bounce',
                    comment.trim()
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-orange-100">
          <div className="max-w-4xl mx-auto">
            {isOwner ? (
              <button
                disabled
                className="w-full py-4 bg-gray-200 text-gray-500 rounded-2xl font-semibold cursor-not-allowed"
              >
                这是你发布的物品
              </button>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-2xl font-bold text-lg btn-bounce shadow-lg"
              >
                🎁 我想要交换
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-bounce-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎁</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">确定要交换吗？</h3>
              <p className="text-sm text-gray-500">
                发送交换请求后，{owner?.nickname || '物品主人'}会收到通知
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    成色: {item.condition}/10
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold btn-bounce"
              >
                再想想
              </button>
              <button
                onClick={handleExchangeRequest}
                className="flex-1 py-3 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl font-semibold btn-bounce"
              >
                确认交换
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
};
