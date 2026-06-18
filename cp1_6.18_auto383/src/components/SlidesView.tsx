import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Image, Video, FileText, Link2Off } from 'lucide-react';
import { useTimelineStore, parseISODate } from '../dataManager';
import { UIController, isImageUrl, isVideoUrl } from '../uiController';
import { EVENT_TYPE_COLORS } from '../types';
import { cn } from '../lib/utils';

interface SlidesViewProps {
  uiController: UIController;
  onClose: () => void;
}

type SlideDirection = 'next' | 'prev' | 'none';

function formatDate(iso: string): string {
  const d = parseISODate(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (y < 0) {
    return `公元前 ${Math.abs(y)} 年 ${m} 月 ${day} 日`;
  }
  return `${y} 年 ${m} 月 ${day} 日`;
}

function getYouTubeEmbed(url: string): string | null {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
  return null;
}

function getVimeoEmbed(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

export default function SlidesView({ uiController, onClose }: SlidesViewProps) {
  const events = useTimelineStore((s) => s.events);
  const currentSlideIndex = useTimelineStore((s) => s.currentSlideIndex);
  const connections = useTimelineStore((s) => s.connections);
  const config = useTimelineStore((s) => s.config);
  const [direction, setDirection] = useState<SlideDirection>('none');
  const [animating, setAnimating] = useState(false);
  const lastIndexRef = useRef(currentSlideIndex);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const ma = parseISODate(a.date).getTime();
      const mb = parseISODate(b.date).getTime();
      return ma - mb;
    });
  }, [events]);

  const currentEvent = sortedEvents[currentSlideIndex];

  const relatedConnections = useMemo(() => {
    if (!currentEvent) return [];
    return connections.filter(
      (c) => c.fromEventId === currentEvent.id || c.toEventId === currentEvent.id
    );
  }, [connections, currentEvent]);

  useEffect(() => {
    if (currentSlideIndex !== lastIndexRef.current) {
      const dir: SlideDirection =
        currentSlideIndex > lastIndexRef.current ? 'next' : 'prev';
      setDirection(dir);
      setAnimating(true);
      lastIndexRef.current = currentSlideIndex;
      const timer = window.setTimeout(() => {
        setAnimating(false);
        setDirection('none');
      }, 600);
      return () => window.clearTimeout(timer);
    }
  }, [currentSlideIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (!animating) uiController.nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!animating) uiController.prevSlide();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [uiController, onClose, animating]);

  if (sortedEvents.length === 0) return null;

  const renderMedia = () => {
    if (!currentEvent?.mediaUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50/80 rounded-xl gap-3 text-gray-400">
          {currentEvent?.type === 'image' ? (
            <Image className="w-10 h-10" strokeWidth={1.5} />
          ) : currentEvent?.type === 'video' ? (
            <Video className="w-10 h-10" strokeWidth={1.5} />
          ) : (
            <FileText className="w-10 h-10" strokeWidth={1.5} />
          )}
          <p className="text-sm">暂无媒体内容</p>
        </div>
      );
    }

    if (currentEvent.type === 'image') {
      if (isImageUrl(currentEvent.mediaUrl)) {
        return (
          <img
            src={currentEvent.mediaUrl}
            alt={currentEvent.title}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50/80 rounded-xl gap-3 text-gray-400">
          <Link2Off className="w-10 h-10" strokeWidth={1.5} />
          <p className="text-sm">图片 URL 无效</p>
        </div>
      );
    }

    if (currentEvent.type === 'video') {
      const yt = getYouTubeEmbed(currentEvent.mediaUrl);
      if (yt) {
        return (
          <iframe
            src={yt}
            title={currentEvent.title}
            className="w-full h-full rounded-xl border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      const vm = getVimeoEmbed(currentEvent.mediaUrl);
      if (vm) {
        return (
          <iframe
            src={vm}
            title={currentEvent.title}
            className="w-full h-full rounded-xl border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50/80 rounded-xl gap-3 text-gray-400">
          <Link2Off className="w-10 h-10" strokeWidth={1.5} />
          <p className="text-sm">视频 URL 无效（支持 YouTube / Vimeo）</p>
        </div>
      );
    }

    return null;
  };

  const getTransform = () => {
    if (!animating) {
      return 'translateY(0) rotateX(0deg)';
    }
    if (direction === 'next') {
      return 'translateY(60px) rotateX(-20deg)';
    }
    return 'translateY(-60px) rotateX(20deg)';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(30,41,59,0.85) 0%, rgba(15,23,42,0.95) 100%)',
        perspective: '1500px',
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all z-50"
        style={{ backdropFilter: 'blur(12px)' }}
        aria-label="关闭幻灯片"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-6 left-6 text-white/60 text-sm font-medium z-50">
        {config.title || '时光织机'}
      </div>

      <button
        onClick={() => !animating && uiController.prevSlide()}
        disabled={animating}
        className={cn(
          'absolute left-4 md:left-12 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all z-40',
          'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        aria-label="上一张"
      >
        <ChevronLeft className="w-7 h-7 md:w-8 md:h-8" />
      </button>

      <button
        onClick={() => !animating && uiController.nextSlide()}
        disabled={animating}
        className={cn(
          'absolute right-4 md:right-12 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all z-40',
          'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        aria-label="下一张"
      >
        <ChevronRight className="w-7 h-7 md:w-8 md:h-8" />
      </button>

      <div
        className="relative flex items-center justify-center"
        style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}
      >
        <div
          className="relative overflow-hidden flex flex-col"
          style={{
            width: '640px',
            maxWidth: '90vw',
            height: '480px',
            maxHeight: '80vh',
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.75) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow:
              '0 30px 80px -20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset',
            transform: getTransform(),
            opacity: animating ? 0 : 1,
            transition:
              'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="px-8 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-gray-200/60 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: EVENT_TYPE_COLORS[currentEvent.type] }}
              />
              <span
                className="text-sm font-medium text-gray-600 truncate"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {formatDate(currentEvent.date)}
              </span>
            </div>
            <span className="text-xs text-gray-400 shrink-0 font-mono">
              {currentSlideIndex + 1} / {sortedEvents.length}
            </span>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden px-8 py-6 gap-4 min-w-0">
              <h2
                className="text-2xl font-semibold text-gray-900 leading-snug"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: '24px',
                }}
              >
                {currentEvent.title}
              </h2>
              <div
                className="overflow-y-auto pr-2 flex-1"
                style={{
                  fontSize: '16px',
                  color: '#4B5563',
                  lineHeight: 1.75,
                }}
              >
                {currentEvent.description || (
                  <span className="text-gray-400 italic">暂无描述</span>
                )}
              </div>

              {relatedConnections.length > 0 && (
                <div className="border-t border-gray-200/60 pt-4 shrink-0">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                    关联关系
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {relatedConnections.map((conn) => {
                      const targetId =
                        conn.fromEventId === currentEvent.id
                          ? conn.toEventId
                          : conn.fromEventId;
                      const target = sortedEvents.find((e) => e.id === targetId);
                      const isFrom = conn.fromEventId === currentEvent.id;
                      if (!target) return null;
                      return (
                        <button
                          key={conn.id}
                          onClick={() => {
                            const idx = sortedEvents.findIndex((e) => e.id === target.id);
                            if (idx >= 0 && !animating) uiController.gotoSlide(idx);
                          }}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                          style={{
                            backgroundColor: `${conn.color}15`,
                            color: conn.color,
                            border: `1px solid ${conn.color}30`,
                          }}
                        >
                          <span className="opacity-70">{isFrom ? '→' : '←'}</span>
                          <span className="max-w-[120px] truncate group-hover:underline">
                            {target.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {currentEvent.type !== 'text' && (
              <div className="w-2/5 border-l border-gray-200/60 p-6 shrink-0">
                <div className="h-full">{renderMedia()}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-40">
        {sortedEvents.map((ev, idx) => (
          <button
            key={ev.id}
            onClick={() => !animating && uiController.gotoSlide(idx)}
            disabled={animating}
            className={cn(
              'relative rounded-full transition-all duration-300',
              idx === currentSlideIndex
                ? 'w-8 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
            )}
            style={{
              boxShadow:
                idx === currentSlideIndex
                  ? '0 2px 8px rgba(255,255,255,0.4)'
                  : 'none',
            }}
            aria-label={`跳转到第 ${idx + 1} 张`}
          >
            {idx === currentSlideIndex && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: EVENT_TYPE_COLORS[currentEvent.type],
                  opacity: 0.8,
                }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="absolute bottom-8 right-8 text-white/40 text-xs z-40 hidden md:block">
        ← → 切换 · 空格 下一张 · Esc 退出
      </div>
    </div>
  );
}
