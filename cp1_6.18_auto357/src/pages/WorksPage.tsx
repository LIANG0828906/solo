import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Upload, Filter, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { STYLE_OPTIONS } from '../modules/userInteraction';

interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

interface WorkItem {
  id: string;
  userId: string;
  username: string;
  clothingImage: string;
  designParams: {
    sleeveLength: number;
    clothingLength: number;
    waistFit: number;
  };
  style: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
}

export default function WorksPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadWorks();
  }, [selectedStyle]);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const styleParam = selectedStyle === 'all' ? '' : selectedStyle;
      const response = await axios.get<{ works: WorkItem[]; total: number }>(
        `/api/works?style=${styleParam}`
      );
      setWorks(response.data.works);
    } catch (error) {
      console.error('Failed to load works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (workId: string) => {
    try {
      const response = await axios.post<{ likes: number; liked: boolean }>(
        `/api/works/${workId}/like`
      );
      setWorks((prev) =>
        prev.map((work) =>
          work.id === workId ? { ...work, likes: response.data.likes } : work
        )
      );
    } catch (error) {
      console.error('Failed to like work:', error);
    }
  };

  const handleComment = async (workId: string) => {
    const content = commentInputs[workId]?.trim();
    if (!content) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      const response = await axios.post<{ comment: Comment }>(
        `/api/works/${workId}/comments`,
        formData
      );
      
      setWorks((prev) =>
        prev.map((work) =>
          work.id === workId
            ? { ...work, comments: [response.data.comment, ...work.comments] }
            : work
        )
      );
      setCommentInputs((prev) => ({ ...prev, [workId]: '' }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const getStyleLabel = (styleId: string) => {
    const style = STYLE_OPTIONS.find((s) => s.id === styleId);
    return style ? `${style.icon} ${style.name}` : styleId;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-paper py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 text-wood/70 hover:text-wood mb-4"
            >
              <ArrowLeft size={18} />
              返回上传
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif text-wood">作品社区</h1>
            <p className="text-wood/60 mt-2">浏览他人的创意改造，获取灵感</p>
          </div>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rust text-white rounded-full font-medium btn-hover"
          >
            <Upload size={18} />
            上传你的改造
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-wood/70" />
            <span className="text-wood font-medium">按风格筛选</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStyle('all')}
              className={`px-4 py-2 rounded-full text-sm transition-all btn-hover ${
                selectedStyle === 'all'
                  ? 'bg-rust text-white'
                  : 'bg-white/60 text-wood hover:bg-white'
              }`}
            >
              全部
            </button>
            {STYLE_OPTIONS.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`px-4 py-2 rounded-full text-sm transition-all btn-hover ${
                  selectedStyle === style.id
                    ? 'bg-rust text-white'
                    : 'bg-white/60 text-wood hover:bg-white'
                }`}
              >
                {style.icon} {style.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-wood/30 border-t-wood rounded-full animate-spin" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧵</div>
            <h3 className="text-xl font-serif text-wood mb-2">暂无作品</h3>
            <p className="text-wood/60 mb-6">成为第一个分享改造作品的人吧！</p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-rust text-white rounded-full font-medium btn-hover"
            >
              <Upload size={18} />
              开始改造
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map((work, index) => (
              <div
                key={work.id}
                className="bg-white rounded-2xl overflow-hidden card-shadow animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative aspect-square bg-upload">
                  <img
                    src={work.clothingImage}
                    alt="改造作品"
                    className="w-full h-full object-contain p-4"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 rounded-full text-xs text-wood font-medium">
                    {getStyleLabel(work.style)}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-wood/10 rounded-full flex items-center justify-center text-wood font-medium text-sm">
                        {work.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-wood font-medium">{work.username}</span>
                    </div>
                    <span className="text-wood/40 text-xs">
                      {formatDate(work.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => handleLike(work.id)}
                      className="flex items-center gap-1 text-wood/60 hover:text-rust transition-colors btn-hover"
                    >
                      <Heart size={18} />
                      <span className="text-sm">{work.likes}</span>
                    </button>
                    <div className="flex items-center gap-1 text-wood/60">
                      <MessageCircle size={18} />
                      <span className="text-sm">{work.comments.length}</span>
                    </div>
                  </div>

                  <div className="bg-paper/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-wood/70 mb-2">设计参数</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-wood/60">
                      <div>袖长: {work.designParams.sleeveLength}%</div>
                      <div>衣长: {work.designParams.clothingLength}%</div>
                      <div>腰身: {work.designParams.waistFit}%</div>
                    </div>
                  </div>

                  {work.comments.length > 0 && (
                    <div className="mb-4 max-h-32 overflow-y-auto">
                      {work.comments.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="text-sm mb-2">
                          <span className="font-medium text-wood">{comment.username}: </span>
                          <span className="text-wood/70">{comment.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="写下你的评论..."
                      value={commentInputs[work.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [work.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleComment(work.id)
                      }
                      className="flex-1 px-4 py-2 bg-paper/50 rounded-full text-sm text-wood placeholder-wood/40 focus:outline-none focus:ring-2 focus:ring-rust/30"
                    />
                    <button
                      onClick={() => handleComment(work.id)}
                      className="px-4 py-2 bg-rust text-white rounded-full text-sm btn-hover"
                    >
                      发送
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
