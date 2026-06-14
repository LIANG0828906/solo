import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MapPin, Eye, Star, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { explorationApi, favoriteApi } from '@/api/client';
import { useAppStore } from '@/store';
import type { Exploration } from '@/types';
import { ExplorationTypeColors, ExplorationTypeLabels } from '@/types';
import { cn, formatDate, typeIcon } from '@/lib/utils';
import LazyImage from './LazyImage';
import StarRating from './StarRating';

type TabType = 'favorites' | 'mine';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, removeExploration } = useAppStore();
  const [tab, setTab] = useState<TabType>('favorites');
  const [favorites, setFavorites] = useState<Exploration[]>([]);
  const [mine, setMine] = useState<Exploration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [favList, mineList] = await Promise.all([
          favoriteApi.list(user.id),
          explorationApi.getMine(user.id),
        ]);
        if (!alive) return;
        setFavorites(favList);
        setMine(mineList);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user.id]);

  const handleUnfavorite = async (expId: string) => {
    try {
      await favoriteApi.remove(expId, user.id);
      setFavorites((list) => list.filter((e) => e.id !== expId));
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await explorationApi.remove(deleteId);
      removeExploration(deleteId);
      setMine((list) => list.filter((e) => e.id !== deleteId));
      setFavorites((list) => list.filter((e) => e.id !== deleteId));
    } catch { /* ignore */ }
    setDeleteId(null);
  };

  const list = tab === 'favorites' ? favorites : mine;

  const renderCard = (exp: Exploration, isFav: boolean) => (
    <div
      key={exp.id}
      className="card card-hover group cursor-pointer"
      onClick={() => navigate(`/exploration/${exp.id}`)}
    >
      {exp.images?.[0] ? (
        <LazyImage src={exp.images[0]} aspectRatio="16/10" alt={exp.title} />
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{ aspectRatio: '16/10', background: `linear-gradient(135deg, ${ExplorationTypeColors[exp.type]}44, ${ExplorationTypeColors[exp.type]}18)` }}
        >
          <span className="text-4xl opacity-50">{typeIcon(exp.type)}</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="chip text-white text-[10px]"
            style={{ background: ExplorationTypeColors[exp.type] }}
          >
            <span>{typeIcon(exp.type)}</span>
            {ExplorationTypeLabels[exp.type]}
          </span>
        </div>
        <h3 className="font-display font-bold text-city-dark text-base leading-snug mb-1.5 line-clamp-1 group-hover:text-accent transition-colors">
          {exp.title}
        </h3>
        <p className="text-xs text-city-light line-clamp-2 leading-relaxed mb-3">
          {exp.description}
        </p>
        <div className="flex items-center justify-between text-xs text-city-light">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {exp.visitCount}
            </span>
            {exp.avgRating > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                {exp.avgRating.toFixed(1)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {formatDate(exp.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {isFav && (
            <button
              onClick={(e) => { e.stopPropagation(); handleUnfavorite(exp.id); }}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Heart size={14} className="fill-red-500" />
              取消收藏
            </button>
          )}
          {!isFav && exp.createdBy === user.id && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteId(exp.id); }}
              className="text-xs text-city-light hover:text-red-500 flex items-center gap-1 transition-colors ml-auto"
            >
              <Trash2 size={14} />
              删除
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/exploration/${exp.id}`); }}
            className="text-xs text-accent font-medium flex items-center gap-0.5 ml-auto"
          >
            查看 <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-city-bg">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-city-dark hover:text-accent transition-colors rounded-xl px-3 py-2 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="flex-1 font-display font-bold text-lg text-city-dark">个人中心</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="card p-5 sm:p-6 mb-6 flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.nickname}
            className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-white shadow-card"
          />
          <div>
            <h2 className="font-display font-bold text-xl text-city-dark">{user.nickname}</h2>
            <p className="text-sm text-city-light mt-0.5">
              已发布 {mine.length} 个探险点 · 收藏了 {favorites.length} 个
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setTab('favorites')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
              tab === 'favorites'
                ? 'bg-white text-city-dark shadow-sm'
                : 'text-city-light hover:text-city-dark'
            )}
          >
            ❤️ 我的收藏 ({favorites.length})
          </button>
          <button
            onClick={() => setTab('mine')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
              tab === 'mine'
                ? 'bg-white text-city-dark shadow-sm'
                : 'text-city-light hover:text-city-dark'
            )}
          >
            📝 我的发布 ({mine.length})
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[16/10] bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4 opacity-40">{tab === 'favorites' ? '💝' : '📝'}</div>
            <h3 className="font-display font-bold text-xl text-city-dark mb-2">
              {tab === 'favorites' ? '暂无收藏' : '暂无发布'}
            </h3>
            <p className="text-city-light text-sm mb-5">
              {tab === 'favorites' ? '在详情页点击收藏按钮，将探险点加入收藏' : '去地图上发现和发布你的第一个探险点吧'}
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">返回地图</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((exp) => renderCard(exp, tab === 'favorites'))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full animate-pop">
            <h3 className="font-display font-bold text-lg text-city-dark mb-2">确认删除</h3>
            <p className="text-city-light text-sm mb-6">删除后将无法恢复，确定要删除吗？</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">取消</button>
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl px-5 py-2.5 transition-all shadow-sm"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
