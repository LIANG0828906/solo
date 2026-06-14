import { useEffect, useRef, useState, useMemo } from 'react';
import {
  ArrowLeft, Heart, MessageSquare, Send, MapPin, Eye, Calendar, Trash2, Edit3, X, Camera, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { commentApi, explorationApi, favoriteApi, uploadApi } from '@/api/client';
import { useAppStore } from '@/store';
import type { Comment, ExplorationDetail } from '@/types';
import { ExplorationTypeColors, ExplorationTypeLabels } from '@/types';
import { cn, compressImage, formatDate, typeIcon, getCurrentUser } from '@/lib/utils';
import LazyImage from './LazyImage';
import StarRating from './StarRating';
import RatingChart from './RatingChart';

export default function DetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { user, updateExploration, incrementVisit, removeExploration } = useAppStore();
  const [detail, setDetail] = useState<ExplorationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewer, setShowViewer] = useState<number | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const curr = getCurrentUser();
        const d = await explorationApi.getDetail(id, curr.id);
        if (!alive) return;
        setDetail(d);
        setIsFav(d.isFavorited);
        explorationApi.visit(id).then(() => incrementVisit(id));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, incrementVisit]);

  const images = detail?.exploration.images || [];
  const hasImages = images.length > 0;

  const goSlide = (dir: number) => {
    if (!hasImages) return;
    setSlideIdx((i) => {
      const n = images.length;
      return (i + dir + n) % n;
    });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const threshold = 50;
    if (touchDeltaX.current > threshold) goSlide(-1);
    else if (touchDeltaX.current < -threshold) goSlide(1);
    touchDeltaX.current = 0;
  };

  const toggleFav = async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await favoriteApi.remove(id, user.id);
        setIsFav(false);
      } else {
        await favoriteApi.add(id, user.id);
        setIsFav(true);
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handleImagePick = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 3 - commentImages.length);
    for (const f of list) {
      try {
        const blob = await compressImage(f);
        const url = await uploadApi.image(blob, f.name);
        setCommentImages((arr) => [...arr, url]);
      } catch {}
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !detail || commentLoading) return;
    setCommentLoading(true);
    try {
      const cm: Comment = await commentApi.create({
        explorationId: id,
        userId: user.id,
        userName: user.nickname,
        userAvatar: user.avatar,
        content: commentText.trim(),
        images: commentImages,
        rating: commentRating,
      });
      const newComments = [cm, ...detail.comments];
      const dist: Record<number, number> = { ...detail.ratingDistribution };
      dist[cm.rating] = (dist[cm.rating] || 0) + 1;
      const exp = detail.exploration;
      const newCount = exp.ratingCount + 1;
      const newSum = exp.ratingSum + cm.rating;
      const newExp = {
        ...exp,
        ratingCount: newCount,
        ratingSum: newSum,
        avgRating: Math.round((newSum / newCount) * 10) / 10,
      };
      updateExploration(newExp);
      setDetail({ ...detail, comments: newComments, ratingDistribution: dist, exploration: newExp });
      setCommentText('');
      setCommentRating(5);
      setCommentImages([]);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await explorationApi.remove(id);
      removeExploration(id);
      navigate('/', { replace: true });
    } catch {}
  };

  const isOwner = detail?.exploration.createdBy === user.id;

  const allImages = useMemo(() => {
    const set = new Set<string>();
    const res: string[] = [];
    images.forEach((u) => { if (!set.has(u)) { set.add(u); res.push(u); } });
    detail?.comments.forEach((c) => c.images.forEach((u) => { if (!set.has(u)) { set.add(u); res.push(u); } }));
    return res;
  }, [images, detail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-city-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-city-light animate-pulse">
          <div className="w-10 h-10 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-city-bg flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">😢</div>
          <h3 className="font-display font-bold text-xl text-city-dark mb-2">未找到探险点</h3>
          <p className="text-city-light text-sm mb-5">该探险点可能已被删除或链接无效</p>
          <button onClick={() => navigate('/')} className="btn-primary">返回地图</button>
        </div>
      </div>
    );
  }

  const { exploration, comments, ratingDistribution } = detail;

  return (
    <div className="min-h-screen bg-city-bg pb-20">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-city-dark hover:text-accent transition-colors rounded-xl px-3 py-2 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium hidden sm:inline">返回</span>
          </button>
          <h1 className="flex-1 text-center font-display font-bold text-lg text-city-dark line-clamp-1 truncate">
            {exploration.title}
          </h1>
          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <button
                  onClick={() => navigate(`/exploration/${id}/edit`)}
                  className="p-2.5 rounded-xl text-city-light hover:text-accent hover:bg-slate-50 transition-all"
                  aria-label="编辑"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2.5 rounded-xl text-city-light hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="删除"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button
              onClick={toggleFav}
              disabled={favLoading}
              className={cn(
                'p-2.5 rounded-xl transition-all relative',
                isFav
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'text-city-light hover:text-red-500 hover:bg-red-50'
              )}
              aria-label="收藏"
            >
              <Heart size={20} className={cn('transition-transform', isFav && 'fill-red-500 animate-pop')} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div
          ref={carouselRef}
          className="relative w-full bg-slate-100 overflow-hidden select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ aspectRatio: '16 / 9', maxHeight: '60vh' }}
        >
          {hasImages ? (
            <div
              className="flex h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${slideIdx * 100}%)` }}
            >
              {images.map((src, i) => (
                <div key={i} className="h-full shrink-0 w-full">
                  <LazyImage
                    src={src}
                    alt={`${exploration.title} ${i + 1}`}
                    className="w-full h-full rounded-none cursor-zoom-in"
                    aspectRatio="16/9"
                    onClick={() => setShowViewer(i)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative"
              style={{ background: `linear-gradient(135deg, ${ExplorationTypeColors[exploration.type]}55, ${ExplorationTypeColors[exploration.type]}22)` }}
            >
              <div className="text-8xl opacity-40">{typeIcon(exploration.type)}</div>
              <MapPin size={64} className="absolute text-white/70" strokeWidth={1} />
            </div>
          )}

          {hasImages && images.length > 1 && (
            <>
              <button
                onClick={() => goSlide(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 text-white flex items-center justify-center transition-all hidden sm:flex"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() => goSlide(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur hover:bg-black/60 text-white flex items-center justify-center transition-all hidden sm:flex"
              >
                <ChevronRight size={22} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIdx(i)}
                    className={cn(
                      'rounded-full transition-all',
                      slideIdx === i ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="animate-slide-up">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="chip text-white"
                    style={{ background: ExplorationTypeColors[exploration.type] }}
                  >
                    <span>{typeIcon(exploration.type)}</span>
                    {ExplorationTypeLabels[exploration.type]}
                  </span>
                  <span className="chip bg-slate-100 text-city-light">
                    <Calendar size={12} />
                    {formatDate(exploration.createdAt)}
                  </span>
                  <span className="chip bg-slate-100 text-city-light">
                    <Eye size={12} />
                    {exploration.visitCount} 次访问
                  </span>
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-city-dark leading-tight mb-3">
                  {exploration.title}
                </h2>
                <div className="flex items-center gap-3 mb-5">
                  <StarRating value={exploration.avgRating} readonly size="lg" showValue count={exploration.ratingCount} />
                </div>
                <p className="text-city-dark/85 leading-[1.9] text-[15px] whitespace-pre-wrap">
                  {exploration.description}
                </p>
                {exploration.address && (
                  <div className="mt-5 flex items-start gap-2.5 p-4 bg-slate-50 rounded-2xl text-sm">
                    <MapPin size={18} className="text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-city-light mb-0.5">位置</p>
                      <p className="text-city-dark font-medium">{exploration.address}</p>
                      <p className="text-xs text-city-light mt-1 font-mono">
                        {exploration.lat.toFixed(4)}, {exploration.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-5 sm:p-6 animate-slide-up">
                <div className="flex items-center gap-2 mb-5">
                  <MessageSquare size={20} className="text-accent" />
                  <h3 className="font-display font-bold text-xl text-city-dark">
                    探索者评论 <span className="text-city-light text-sm font-normal">({comments.length})</span>
                  </h3>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <label className="text-city-light">评分</label>
                    <StarRating value={commentRating} onChange={setCommentRating} size="md" showValue />
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="分享你的体验与感受..."
                    rows={3}
                    className="textarea-field text-sm"
                  />
                  {commentImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {commentImages.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                          <LazyImage src={url} aspectRatio="1/1" className="w-full h-full" />
                          <button
                            onClick={() => setCommentImages((arr) => arr.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <label className={cn(
                      'cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all',
                      commentImages.length >= 3
                        ? 'text-city-light/50 bg-slate-100 cursor-not-allowed'
                        : 'text-city-light hover:text-accent hover:bg-accent/10'
                    )}>
                      <Camera size={16} />
                      <span>添加图片</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={commentImages.length >= 3}
                        className="hidden"
                        onChange={(e) => handleImagePick(e.target.files)}
                      />
                    </label>
                    <button
                      onClick={submitComment}
                      disabled={!commentText.trim() || commentLoading}
                      className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50"
                    >
                      <Send size={16} />
                      {commentLoading ? '发布中...' : '发布评论'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  {comments.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="text-5xl mb-3 opacity-40">💬</div>
                      <p className="text-city-light text-sm">还没有评论，来做第一个分享体验的人吧</p>
                    </div>
                  ) : (
                    comments.map((c, idx) => (
                      <div
                        key={c.id}
                        className="animate-fade-in flex gap-3"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <img
                          src={c.userAvatar}
                          alt={c.userName}
                          className="w-10 h-10 rounded-full bg-slate-100 shrink-0 border border-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-city-dark text-sm">{c.userName}</span>
                            <StarRating value={c.rating} readonly size="sm" />
                          </div>
                          <p className="text-[14px] leading-relaxed text-city-dark/80 mb-2 whitespace-pre-wrap">
                            {c.content}
                          </p>
                          {c.images.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-2">
                              {c.images.map((u, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    const pos = allImages.indexOf(u);
                                    if (pos >= 0) setShowViewer(pos);
                                  }}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                                >
                                  <LazyImage src={u} aspectRatio="1/1" className="w-full h-full" />
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-city-light">{formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="card p-5 sm:p-6 animate-slide-up sticky top-20">
                <h3 className="font-display font-bold text-lg text-city-dark mb-4 flex items-center gap-2">
                  ⭐ 评分仪表盘
                </h3>
                <RatingChart
                  distribution={ratingDistribution}
                  avg={exploration.avgRating || 0}
                  size={180}
                />
                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="font-display font-black text-2xl text-accent">{exploration.visitCount}</p>
                    <p className="text-xs text-city-light mt-0.5">总访问</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-black text-2xl text-city-dark">{exploration.ratingCount}</p>
                    <p className="text-xs text-city-light mt-0.5">评分数</p>
                  </div>
                </div>
                <button
                  onClick={toggleFav}
                  disabled={favLoading}
                  className={cn(
                    'w-full mt-5 rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-all',
                    isFav
                      ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                      : 'bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5'
                  )}
                >
                  <Heart size={18} className={cn(isFav && 'fill-red-500')} />
                  {isFav ? '已收藏' : '收藏此地点'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showViewer !== null && allImages[showViewer] && (
        <div
          className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center"
          onClick={() => setShowViewer(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={() => setShowViewer(null)}
          >
            <X size={20} />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setShowViewer((i) => (i === null ? 0 : (i - 1 + allImages.length) % allImages.length)); }}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setShowViewer((i) => (i === null ? 0 : (i + 1) % allImages.length)); }}
          >
            <ChevronRight size={24} />
          </button>
          <img
            src={allImages[showViewer]}
            alt=""
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {showViewer + 1} / {allImages.length}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full animate-pop">