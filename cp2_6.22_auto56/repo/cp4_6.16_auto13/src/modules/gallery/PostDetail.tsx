import { useEffect, useRef, useState } from 'react';
import {
  Heart,
  ArrowLeft,
  Trash2,
  Smile,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useGalleryStore } from '@/store/useGalleryStore';
import type { GalleryPost } from '@/types';

interface PostDetailProps {
  postId: string;
  onBack: () => void;
}

const EMOJIS = [
  '😀', '😂', '😍', '🥰', '😎', '🤔', '😭', '😡',
  '👍', '👏', '🎉', '🔥', '❤️', '💯', '✨', '🌟',
];

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mm}-${dd} ${hh}:${mi}`;
}

function formatCommentTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}天前`;
  return formatDateTime(ts);
}

export default function PostDetail({ postId, onBack }: PostDetailProps) {
  const {
    posts,
    loadPosts,
    getPost,
    toggleLike,
    addComment,
    deleteComment,
    isLikeAnimating,
    currentUserId,
  } = useGalleryStore();

  const [post, setPost] = useState<GalleryPost | undefined>(() => getPost(postId));
  const [comment, setComment] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const animating = isLikeAnimating[postId] ?? false;

  useEffect(() => {
    if (posts.length === 0) {
      loadPosts();
    }
  }, [posts.length, loadPosts]);

  useEffect(() => {
    setPost(getPost(postId));
  }, [postId, posts, getPost]);

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setComment((c) => c + emoji);
      return;
    }
    const start = ta.selectionStart ?? comment.length;
    const end = ta.selectionEnd ?? comment.length;
    const newVal = comment.slice(0, start) + emoji + comment.slice(end);
    setComment(newVal);
    setTimeout(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
    setShowEmoji(false);
  };

  const handleSubmit = () => {
    if (!comment.trim() || !post) return;
    addComment(post.id, comment);
    setComment('');
    setBtnPressed(true);
    setTimeout(() => setBtnPressed(false), 100);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!post) return;
    deleteComment(post.id, commentId);
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-10 shadow-xl text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">作品不存在</h2>
          <button
            onClick={onBack}
            className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all active:scale-95"
          >
            返回广场
          </button>
        </div>
      </div>
    );
  }

  const sortedComments = [...post.comments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl bg-white/80 px-3.5 py-2 text-gray-700 shadow-sm backdrop-blur-md border border-white/60 transition-all duration-200 hover:bg-white hover:shadow-md active:scale-95"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
            <span className="text-sm font-semibold">返回</span>
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
            {post.title}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-xl">
              <div className="overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_rgba(102,126,234,0.15)]">
                <img
                  src={post.fullImage}
                  alt={post.title}
                  className="block w-full object-contain"
                  style={{ maxHeight: '80vh' }}
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-96 shrink-0 space-y-5">
            <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 p-5 shadow-lg">
              <div className="flex items-center gap-3.5">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="h-12 w-12 rounded-full object-cover ring-3 ring-white/80 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    {post.authorName}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDateTime(post.publishedAt)}
                  </div>
                </div>
              </div>

              <h2 className="mt-4 text-lg font-bold text-gray-900 leading-snug">
                {post.title}
              </h2>

              <button
                onClick={() => toggleLike(post.id)}
                className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
              >
                <Heart
                  size={26}
                  className={`transition-all duration-300 ease-out ${
                    post.likedByMe ? 'fill-white' : ''
                  } ${animating ? 'scale-130' : 'scale-100'}`}
                  style={{
                    animation: animating
                      ? 'likeBigBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      : 'none',
                  }}
                  strokeWidth={2.2}
                />
                <span
                  className={`transition-transform duration-300 ease-out ${
                    animating ? 'scale-130' : 'scale-100'
                  }`}
                  style={{
                    animation: animating
                      ? 'likeBigBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      : 'none',
                  }}
                >
                  {post.likes}
                </span>
              </button>
            </div>

            <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-indigo-500" strokeWidth={2.2} />
                  <h3 className="font-semibold text-gray-800">评论</h3>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                    {sortedComments.length}
                  </span>
                </div>
              </div>

              {sortedComments.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  还没有评论，快来抢沙发吧～
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1 -mr-1">
                  {sortedComments.map((c) => {
                    const canDelete =
                      c.isAuthor ||
                      currentUserId === c.authorId ||
                      post.authorId === c.authorId;
                    return (
                      <div
                        key={c.id}
                        className="flex gap-3 rounded-2xl bg-white/50 p-3 border border-white/50"
                      >
                        <img
                          src={c.authorAvatar}
                          alt={c.authorName}
                          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/70"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800 truncate">
                                {c.authorName}
                              </span>
                              {c.isAuthor && (
                                <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                                  作者
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-gray-400">
                                {formatCommentTime(c.createdAt)}
                              </span>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                                  title="删除评论"
                                >
                                  <Trash2 size={14} strokeWidth={2} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1.5 text-sm text-gray-700 leading-relaxed break-words">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 relative">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSubmit();
                      }
                    }}
                    placeholder="说点什么吧... (Ctrl+Enter发送)"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/70 bg-white/80 px-4 py-3 pr-12 text-sm text-gray-700 placeholder-gray-400 shadow-sm backdrop-blur-md transition-all duration-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    className="absolute right-3 top-3 p-1.5 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all active:scale-90"
                    title="表情"
                  >
                    <Smile size={20} strokeWidth={2} />
                  </button>
                </div>

                {showEmoji && (
                  <div className="absolute z-20 right-0 mt-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/70 p-3 shadow-2xl">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => insertEmoji(e)}
                          className="w-9 h-9 rounded-xl text-xl hover:bg-indigo-50 active:scale-90 transition-all"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!comment.trim()}
                    style={{
                      transform: btnPressed ? 'scale(0.96)' : 'scale(1)',
                      transition: 'transform 0.1s ease-out',
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:brightness-100"
                  >
                    <Send size={16} strokeWidth={2.2} />
                    发布
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes likeBigBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.3); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
