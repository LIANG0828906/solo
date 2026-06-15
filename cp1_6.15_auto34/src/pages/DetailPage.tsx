import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin } from 'lucide-react';
import { DiaryCard } from '@/components/DiaryCard';
import { LoadingBar } from '@/components/LoadingBar';
import { Toast } from '@/components/Toast';
import { useDiaryStore } from '@/data/DiaryStore';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import type { Diary } from '@/types';

export const DetailPage: React.FC = () => {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getLocationById = useDiaryStore((s) => s.getLocationById);
  const getDiariesByLocation = useDiaryStore((s) => s.getDiariesByLocation);
  
  const location = locationId ? getLocationById(locationId) : undefined;
  const allDiaries = locationId ? getDiariesByLocation(locationId) : [];
  
  const [displayCount, setDisplayCount] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const displayedDiaries = useMemo(
    () => allDiaries.slice(0, displayCount),
    [allDiaries, displayCount]
  );

  const { visibleItems, totalHeight } = useVirtualScroll({
    items: displayedDiaries,
    itemHeight: 320,
    containerHeight: typeof window !== 'undefined' ? window.innerHeight - 140 : 600,
    overscan: 4,
  });

  const leftColumn = visibleItems.filter((_, i) => i % 2 === 0);
  const rightColumn = visibleItems.filter((_, i) => i % 2 === 1);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
    
    if (isNearBottom && displayCount < allDiaries.length) {
      setIsLoading(true);
      setTimeout(() => {
        setDisplayCount((prev) => Math.min(prev + 8, allDiaries.length));
        setIsLoading(false);
      }, 500);
    }
  }, [allDiaries.length, displayCount, isLoading]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleDiaryClick = (diary: Diary) => {
    navigate(`/diary/${diary.id}`);
  };

  const handleNewDiary = () => {
    if (location) {
      navigate('/diary/new', {
        state: {
          locationId: location.id,
          locationName: location.name,
          lat: location.lat,
          lng: location.lng,
        },
      });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!location) {
    return (
      <div className="h-screen flex items-center justify-center bg-sand-50 page-enter">
        <div className="text-center">
          <p className="text-sand-600 mb-4">未找到该地点</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-sand-600 text-white rounded-lg hover:bg-sand-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-sand-50 page-enter">
      <header className="flex-shrink-0 glass-card border-b border-sand-200/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-sand-200/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-sand-700" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-earth-500" />
                <h1 className="font-display text-2xl font-bold text-sand-800">
                  {location.name}
                </h1>
              </div>
              <p className="text-sm text-sand-500 mt-1">
                共 {allDiaries.length} 篇日记
              </p>
            </div>
          </div>
          
          <button
            onClick={handleNewDiary}
            className="flex items-center gap-2 px-5 py-2.5 bg-sand-600 text-white rounded-xl hover:bg-sand-700 hover-lift transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">写日记</span>
          </button>
        </div>
        
        <LoadingBar isLoading={isLoading} />
      </header>

      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          {allDiaries.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="font-display text-xl font-semibold text-sand-700 mb-2">
                这里还没有日记
              </h2>
              <p className="text-sand-500 mb-6">
                记录你在{location.name}的第一篇旅行故事吧
              </p>
              <button
                onClick={handleNewDiary}
                className="px-6 py-3 bg-sand-600 text-white rounded-xl hover:bg-sand-700 transition-colors"
              >
                开始写日记
              </button>
            </div>
          ) : (
            <div
              className="relative"
              style={{ height: Math.ceil(visibleItems.length / 2) * 340 }}
            >
              <div className="absolute left-0 right-1/2 pr-3">
                {leftColumn.map(({ item, index, offsetTop }) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      top: offsetTop,
                      left: 0,
                      right: 12,
                      height: 320,
                      contentVisibility: 'auto',
                    }}
                  >
                    <DiaryCard
                      diary={item}
                      index={index}
                      onClick={handleDiaryClick}
                    />
                  </div>
                ))}
              </div>
              
              <div className="absolute left-1/2 right-0 pl-3">
                {rightColumn.map(({ item, index, offsetTop }) => (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      top: offsetTop,
                      left: 12,
                      right: 0,
                      height: 320,
                      contentVisibility: 'auto',
                    }}
                  >
                    <DiaryCard
                      diary={item}
                      index={index + 1}
                      onClick={handleDiaryClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-3 border-sand-300 border-t-sand-600 rounded-full animate-spin" />
            </div>
          )}
          
          {!isLoading && displayCount < allDiaries.length && (
            <div className="text-center py-6">
              <p className="text-sm text-sand-500">
                向下滚动加载更多...
              </p>
            </div>
          )}
          
          {displayCount >= allDiaries.length && allDiaries.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-sand-400">
                — 已经到底啦 —
              </p>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
