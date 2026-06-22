import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import type { ResumeComponent } from '@/store/types';
import { Eye, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ShareData {
  components: ResumeComponent[];
  layout: { width: number; height: number };
  views: number;
  likes: number;
}

function SkillBarCard({ content, color }: { content: string; color: string }) {
  const match = content.match(/^(.+?)\s+(\d+)%$/);
  const label = match ? match[1] : content;
  const percent = match ? parseInt(match[2], 10) : 75;

  return (
    <div className="w-full">
      <div className="text-sm mb-1.5" style={{ color }}>{label}</div>
      <div className="w-full h-2.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color === '#334155' ? '#6B7B8D' : color }}
        />
      </div>
    </div>
  );
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/share/${id}`);
        setData(res.data);
        setLikes(res.data.likes || 0);
        axios.post(`${API_BASE}/api/share/${id}/view`).catch(() => {});
      } catch {
        const demoComponents: ResumeComponent[] = [
          { id: '1', type: 'heading', x: 30, y: 30, width: 340, height: 50, content: '张三', style: { fontFamily: 'Noto Sans SC', fontSize: 24, color: '#1e293b', backgroundColor: 'transparent', fontWeight: '700' } },
          { id: '2', type: 'experience', x: 30, y: 100, width: 340, height: 90, content: '前端工程师 | ABC科技\n2022.06 - 至今\n负责核心产品前端架构设计与开发', style: { fontFamily: 'Noto Sans SC', fontSize: 13, color: '#334155', backgroundColor: 'transparent', fontWeight: '400' } },
          { id: '3', type: 'skill-bar', x: 30, y: 210, width: 300, height: 40, content: 'React 90%', style: { fontFamily: 'Noto Sans SC', fontSize: 13, color: '#6B7B8D', backgroundColor: 'transparent', fontWeight: '500' } },
          { id: '4', type: 'education', x: 30, y: 270, width: 340, height: 70, content: '某某大学 | 计算机科学\n2018.09 - 2022.06', style: { fontFamily: 'Noto Sans SC', fontSize: 13, color: '#334155', backgroundColor: 'transparent', fontWeight: '400' } },
          { id: '5', type: 'project-list', x: 30, y: 360, width: 340, height: 110, content: '在线简历编辑器\nReact + TypeScript + Zustand\n\n企业管理后台\nVue3 + Element Plus', style: { fontFamily: 'Noto Sans SC', fontSize: 13, color: '#334155', backgroundColor: 'transparent', fontWeight: '400' } },
        ];
        setData({ components: demoComponents, layout: { width: 595, height: 842 }, views: 42, likes: 7 });
        setLikes(7);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeAnim(true);
    setLikes((prev) => prev + 1);
    setTimeout(() => setLikeAnim(false), 500);
    try {
      const res = await axios.post(`${API_BASE}/api/share/${id}/like`);
      setLikes(res.data.likes);
    } catch {
      // keep local count
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-400">加载中...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回编辑</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye size={14} />
              <span className="text-xs font-medium">{data.views}</span>
            </div>
            <button
              onClick={handleLike}
              disabled={liked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                liked
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
              }`}
            >
              <Heart
                size={14}
                className={`transition-transform duration-300 ${likeAnim ? 'scale-125' : 'scale-100'}`}
                fill={liked ? 'currentColor' : 'none'}
              />
              <span>{likes}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          <div className="p-6 space-y-1">
            {data.components.map((comp) => (
              <div
                key={comp.id}
                style={{
                  fontFamily: comp.style.fontFamily,
                  fontSize: comp.style.fontSize,
                  color: comp.style.color,
                  backgroundColor: comp.style.backgroundColor,
                  fontWeight: Number(comp.style.fontWeight) || 400,
                  padding: '4px 0',
                  whiteSpace: 'pre-wrap' as const,
                  lineHeight: 1.6,
                }}
              >
                {comp.type === 'skill-bar' ? (
                  <SkillBarCard content={comp.content} color={comp.style.color} />
                ) : (
                  comp.content
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          由 ResuMix 生成 · 线上简历制作工具
        </p>
      </main>
    </div>
  );
}
