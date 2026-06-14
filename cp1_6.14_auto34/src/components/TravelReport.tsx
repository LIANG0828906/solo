import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, MapPin, Clock, Footprints, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReportDayData, LocationNode } from '@/types';

interface TravelReportProps {
  reportData: ReportDayData[];
  onClose: () => void;
}

const CARD_HEIGHT = 280;
const CARD_GAP = 20;
const ITEM_HEIGHT = CARD_HEIGHT + CARD_GAP;
const OVERSCAN = 2;

export const TravelReport: React.FC<TravelReportProps> = ({ reportData, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }
    return `${minutes}分钟`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} 公里`;
    }
    return `${meters.toFixed(0)} 米`;
  };

  const totalHeight = reportData.length * ITEM_HEIGHT;

  const visibleRange = useMemo(() => {
    const containerHeight = 600;
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const end = Math.min(
      reportData.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN + 1
    );
    return { start, end };
  }, [scrollTop, reportData.length]);

  const handleNext = useCallback(() => {
    if (isAnimating || activeIndex >= reportData.length - 1) return;
    setIsAnimating(true);
    setActiveIndex((prev) => prev + 1);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: (activeIndex + 1) * ITEM_HEIGHT, behavior: 'smooth' });
    }
    setTimeout(() => setIsAnimating(false), 400);
  }, [activeIndex, isAnimating, reportData.length]);

  const handlePrev = useCallback(() => {
    if (isAnimating || activeIndex <= 0) return;
    setIsAnimating(true);
    setActiveIndex((prev) => prev - 1);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: (activeIndex - 1) * ITEM_HEIGHT, behavior: 'smooth' });
    }
    setTimeout(() => setIsAnimating(false), 400);
  }, [activeIndex, isAnimating]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    const newActive = Math.round(newScrollTop / ITEM_HEIGHT);
    if (newActive !== activeIndex && newActive >= 0 && newActive < reportData.length) {
      setActiveIndex(newActive);
    }
  }, [activeIndex, reportData.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  const scrollToIndex = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex(index);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    }
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating]);

  const renderNodeCard = (node: LocationNode, idx: number) => (
    <div
      key={node.id}
      className="bg-[#FAF7F2] rounded-lg p-3 border border-[#E8DCC4]"
      style={{ animation: `fadeSlideIn 0.4s ease-out ${idx * 0.08}s both` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-semibold text-[#4A3728] text-sm">{node.name}</div>
          <div className="text-xs text-[#8B7355] mt-0.5 line-clamp-2">{node.description}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-[#6B7F5E]">
            <Clock size={10} />
            <span>{formatDuration(node.estimatedDuration)}</span>
          </div>
          <div className="text-xs text-[#A08060] mt-0.5">
            {node.lat.toFixed(4)}°N, {node.lng.toFixed(4)}°E
          </div>
        </div>
      </div>
    </div>
  );

  const renderDayCard = (dayData: ReportDayData, index: number) => {
    const isActive = index === activeIndex;
    const offset = index - activeIndex;

    return (
      <div
        key={dayData.dayNumber}
        className="absolute left-6 right-6 transition-all duration-500 ease-out"
        style={{
          top: index * ITEM_HEIGHT,
          height: CARD_HEIGHT,
          opacity: isActive ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.25),
          transform: `scale(${isActive ? 1 : Math.max(0.92, 1 - Math.abs(offset) * 0.04)}) translateX(${offset * 20}px)`,
          zIndex: 100 - Math.abs(offset),
        }}
      >
        <div
          className="h-full rounded-2xl shadow-xl overflow-hidden flex flex-col"
          style={{
            background: `linear-gradient(135deg, ${dayData.gradientStart}15 0%, ${dayData.gradientEnd}08 100%)`,
            border: `2px solid ${dayData.gradientStart}40`,
          }}
        >
          <div
            className="px-5 py-3 flex items-center justify-between flex-shrink-0"
            style={{
              background: `linear-gradient(90deg, ${dayData.gradientStart} 0%, ${dayData.gradientEnd} 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-white/90" />
              <div>
                <h3 className="text-white font-bold text-lg" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  第 {dayData.dayNumber} 天
                </h3>
                <p className="text-white/80 text-xs">共 {dayData.nodes.length} 个景点</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-1">
                <Footprints size={14} />
                <span className="text-sm font-medium">{formatDistance(dayData.totalDistance)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span className="text-sm font-medium">{formatDuration(dayData.totalDuration)}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            <div className="space-y-2">
              {dayData.nodes.map((node, idx) => renderNodeCard(node, idx))}
            </div>
          </div>

          <div className="px-4 py-2 bg-white/50 border-t border-[#E8DCC4] flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-[#6B7F5E] truncate">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">{dayData.nodes.map((n) => n.name).join(' → ')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const visibleItems = reportData.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div
        className="relative w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.4s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E8DCC4] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#4A3728]" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              旅行路线报告
            </h2>
            <p className="text-sm text-[#8B7355] mt-1">
              共 {reportData.length} 天行程 · 使用 ← → 键切换
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#E8DCC4] flex items-center justify-center text-[#4A3728] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 bg-[#F5F0E8] overflow-hidden relative min-h-0">
          {reportData.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-[#8B7355]">
              <div className="text-center">
                <MapPin size={48} className="mx-auto mb-3 opacity-50" />
                <p>暂无行程数据</p>
                <p className="text-sm mt-1">请先在时间轴中安排您的行程</p>
              </div>
            </div>
          ) : (
            <>
              <div
                ref={containerRef}
                className="h-full overflow-y-auto py-4"
                onScroll={handleScroll}
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="relative" style={{ height: totalHeight }}>
                  {visibleItems.map((dayData, i) => {
                    const actualIndex = visibleRange.start + i;
                    return renderDayCard(dayData, actualIndex);
                  })}
                </div>
              </div>

              {reportData.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-[#4A3728] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={activeIndex === reportData.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-[#4A3728] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {reportData.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'w-8' : 'w-2 hover:w-4'
                    }`}
                    style={{ backgroundColor: reportData[i].gradientStart }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
