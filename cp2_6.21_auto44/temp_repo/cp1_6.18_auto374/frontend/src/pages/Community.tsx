import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import EmptyState from '@/components/EmptyState';
import { communityAPI } from '@/services/api';
import type { CommunityPost } from '@/types';

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    userId: '2',
    username: '爱读书的猫',
    userAvatar: '',
    content: '今天终于把《百年孤独》读完了！马尔克斯的魔幻现实主义真的太震撼了。布恩迪亚家族七代人的故事，充满了宿命感和轮回。推荐给所有喜欢文学的朋友 📚',
    likes: 24,
    comments: 8,
    createdAt: '2024-03-18T14:30:00Z',
  },
  {
    id: '2',
    userId: '3',
    username: '书虫小明',
    userAvatar: '',
    content: '刚入手了一套《三体》全集，准备开始刷第二遍。第一次看的时候完全被黑暗森林理论震撼到了，这次想仔细品味里面的细节。有没有同好一起讨论？',
    likes: 56,
    comments: 23,
    createdAt: '2024-03-17T09:15:00Z',
  },
  {
    id: '3',
    userId: '4',
    username: '文艺青年',
    userAvatar: '',
    content: '春日读书正当时 ☀️ 泡一杯茶，坐在阳台上，读一下午的书，这就是我理想的周末生活。最近在读《瓦尔登湖》，梭罗的文字真的很治愈。',
    images: ['https://picsum.photos/seed/post3/400/300'],
    likes: 89,
    comments: 15,
    createdAt: '2024-03-16T16:45:00Z',
  },
  {
    id: '4',
    userId: '5',
    username: '夜读人',
    userAvatar: '',
    content: '深夜读书，窗外下着雨，手边一杯热可可。这种感觉真的太美好了。最近在追阿加莎的侦探小说，根本停不下来！',
    likes: 37,
    comments: 6,
    createdAt: '2024-03-15T23:20:00Z',
  },
  {
    id: '5',
    userId: '6',
    username: '书单收集者',
    userAvatar: '',
    content: '3月份书单分享：\n1. 《活着》- 余华 ⭐⭐⭐⭐⭐\n2. 《三体》- 刘慈欣 ⭐⭐⭐⭐⭐\n3. 《百年孤独》- 马尔克斯 ⭐⭐⭐⭐\n4. 《小王子》- 圣埃克苏佩里 ⭐⭐⭐⭐⭐\n5. 《围城》- 钱钟书 ⭐⭐⭐⭐\n\n你们这个月读了什么书呀？',
    likes: 128,
    comments: 42,
    createdAt: '2024-03-14T10:00:00Z',
  },
  {
    id: '6',
    userId: '7',
    username: '书店漫游者',
    userAvatar: '',
    content: '今天发现了一家超有氛围的独立书店，里面的书都很有品味，老板也很懂书。在里面泡了一下午，买了三本旧书回家。幸福感爆棚 ✨',
    images: ['https://picsum.photos/seed/post6/400/500', 'https://picsum.photos/seed/post6b/400/300'],
    likes: 156,
    comments: 28,
    createdAt: '2024-03-13T18:30:00Z',
  },
];

function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await communityAPI.getCommunityPosts();
      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await communityAPI.createPost(newPostContent);
      setPosts([response.post, ...posts]);
      setNewPostContent('');
      setShowPostForm(false);
    } catch (error) {
      const newPost: CommunityPost = {
        id: uuidv4(),
        userId: '1',
        username: '我',
        userAvatar: '',
        content: newPostContent,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setShowPostForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await communityAPI.likePost(postId);
      setPosts(posts.map((p) => (p.id === postId ? response.post : p)));
    } catch (error) {
      console.error('Failed to like post:', error);
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, likes: p.likes + 1 } : p
        )
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-nord-textDark">社区动态</h2>
        <button
          onClick={() => setShowPostForm(true)}
          className="px-5 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium
            transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          发布动态
        </button>
      </div>

      {showPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-nord-textDark">发布动态</h3>
              <button
                onClick={() => {
                  setShowPostForm(false);
                  setNewPostContent('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={5}
                placeholder="分享你的读书心得..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 resize-none transition-all duration-200 focus:border-nord-accent"
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={submitting || !newPostContent.trim()}
                  className="px-6 py-2.5 bg-nord-accent hover:bg-[#5E81AC] text-white rounded-lg font-medium
                    transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '发布中...' : '发布'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">加载中...</div>
      ) : posts.length === 0 ? (
        <EmptyState message="还没有动态，来发布第一条吧" />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="w-[280px] break-inside-avoid bg-white rounded-xl shadow-md overflow-hidden
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {post.images && post.images.length > 0 && (
                <div className="overflow-hidden">
                  <img
                    src={post.images[0]}
                    alt=""
                    className="w-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-nord-accent flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-nord-textDark truncate">{post.username}</p>
                    <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-4">
                  {post.content}
                </p>
                <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-nord-danger transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm">{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Community;
