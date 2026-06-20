import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Send, ArrowLeft, Filter, ArrowDownUp, User, Leaf, Flower2, Sun, TreeDeciduous } from 'lucide-react';
import { usePlantStore } from '../stores/usePlantStore';
import { varietyNames, PlantVariety, Post, Comment } from '../services/api';

const varietyIcons: Record<string, React.ReactNode> = {
  pothos: <Leaf className="w-4 h-4" />,
  cactus: <TreeDeciduous className="w-4 h-4" />,
  sunflower: <Sun className="w-4 h-4" />,
  succulent: <Flower2 className="w-4 h-4" />,
};

const varietyTagColors: Record<string, string> = {
  all: 'bg-gradient-to-r from-gray-500 to-gray-600',
  pothos: 'bg-gradient-to-r from-green-500 to-green-600',
  cactus: 'bg-gradient-to-r from-lime-500 to-lime-600',
  sunflower: 'bg-gradient-to-r from-amber-400 to-yellow-500',
  succulent: 'bg-gradient-to-r from-purple-500 to-purple-600',
};

interface LikeState {
  bouncing: boolean;
}

export default function Community() {
  const navigate = useNavigate();
  const { posts, fetchPosts, likePost, addComment, isLoading, user } = usePlantStore();
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [page, setPage] = useState(1);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [likeStates, setLikeStates] = useState<Record<number, LikeState>>({});
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, selectedVariety === 'all' ? undefined : selectedVariety, sortBy);
  }, [selectedVariety, sortBy, fetchPosts]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchPosts(nextPage, selectedVariety === 'all' ? undefined : selectedVariety, sortBy);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, selectedVariety, sortBy, fetchPosts]);

  const handleLike = async (postId: number) => {
    setLikeStates((prev) => ({ ...prev, [postId]: { bouncing: true } }));
    try {
      await likePost(postId);
    } catch (err) {
      console.error('Like error:', err);
    }
    setTimeout(() => {
      setLikeStates((prev) => ({ ...prev, [postId]: { bouncing: false } }));
    }, 200);
  };

  const handleCommentChange = (postId: number, value: string) => {
    if (value.length <= 50) {
      setCommentInputs((prev) => ({ ...prev, [postId]: value }));
    }
  };

  const handleSubmitComment = async (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    try {
      await addComment(postId, content);
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleImageLoad = (postId: number) => {
    setLoadedImages((prev) => new Set(prev).add(postId));
  };

  const getRandomImage = (variety: string, seed: number) => {
    const encodedPrompt = encodeURIComponent(`a beautiful ${varietyNames[variety as PlantVariety] || variety} plant in a pot, soft natural lighting, gentle bokeh background, professional photography`);
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=square_hd&seed=${seed}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-green-200 text-green-700 hover:bg-green-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            返回花园
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-green-800">社区广场</h1>
            <p className="text-sm text-green-600">发现其他花友的植物</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">品种筛选：</span>
              <div className="flex flex-wrap gap-2">
                {[{ key: 'all', label: '全部' }, ...Object.entries(varietyNames).map(([key, label]) => ({ key, label }))].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-md ${
                      selectedVariety === key
                        ? `${varietyTagColors[key]} shadow-lg scale-105`
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    onClick={() => setSelectedVariety(key)}
                  >
                    {key !== 'all' && varietyIcons[key]}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowDownUp className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-green-500 transition-colors cursor-pointer"
              >
                <option value="latest">最新发布</option>
                <option value="likes">点赞最多</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="waterfall-container">
          {posts.map((post: Post, index: number) => (
            <div key={`${post.id}-${index}`} className="waterfall-item">
              <div className="community-card">
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {!loadedImages.has(post.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <img
                    src={post.image_url.startsWith('data:image') ? post.image_url : getRandomImage(post.variety, post.id)}
                    alt={varietyNames[post.variety as PlantVariety] || post.variety}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      loadedImages.has(post.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(post.id)}
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-md"
                      style={{ backgroundColor: varietyTagColors[post.variety] ? undefined : '#4caf50', background: varietyTagColors[post.variety] || undefined }}
                    >
                      {varietyIcons[post.variety]}
                      {varietyNames[post.variety as PlantVariety] || post.variety}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{post.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-red-50 ${
                        post.liked_by_me ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${likeStates[post.id]?.bouncing ? 'heart-bounce' : ''}`}
                        fill={post.liked_by_me ? 'currentColor' : 'none'}
                        strokeWidth={2}
                      />
                      <span className="text-sm font-semibold">{post.likes}</span>
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    {post.comments.slice(-3).map((comment: Comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700">{comment.username}</p>
                            <p className="text-xs text-gray-600 break-words">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        placeholder="写下你的评论..."
                        className="flex-1 px-3 py-2 pr-16 rounded-xl bg-gray-50 border-2 border-gray-200 text-sm focus:outline-none focus:border-green-400 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment(post.id);
                          }
                        }}
                        maxLength={50}
                      />
                      <button
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <div className={`char-counter absolute right-14 bottom-1.5 ${
                      (commentInputs[post.id]?.length || 0) >= 40 ? 'warning' : ''
                    }`}>
                      {commentInputs[post.id]?.length || 0}/50
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Leaf className="w-10 h-10 text-green-400" />
            </div>
            <p className="text-gray-500 text-lg">暂无分享内容</p>
            <p className="text-gray-400 text-sm mt-1">快去养护你的植物并分享吧~</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">加载中...</span>
            </div>
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
      </main>
    </div>
  );
}
