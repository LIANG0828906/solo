import React, { useEffect, useState, useRef } from 'react';
import {
  countWords,
  countParagraphs,
  countSentences,
  estimateReadingTime,
  fleschKincaid,
} from '../utils/textStats';

interface StatsPanelProps {
  content: string;
}

interface Stats {
  words: number;
  paragraphs: number;
  sentences: number;
  readingTime: number;
  readability: number;
}

const AnimatedNumber: React.FC<{ value: number; duration?: number; suffix?: string }> = ({
  value,
  duration = 500,
  suffix = '',
}) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const startTime = performance.now();

    if (start === end) return;

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * easeOut));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatsPanel: React.FC<StatsPanelProps> = ({ content }) => {
  const [stats, setStats] = useState<Stats>({
    words: 0,
    paragraphs: 0,
    sentences: 0,
    readingTime: 0,
    readability: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const start = performance.now();
      const text = content;
      const words = countWords(text);
      const paragraphs = countParagraphs(text);
      const sentences = countSentences(text);
      const readingTime = estimateReadingTime(text);
      const readability = fleschKincaid(text);
      const elapsed = performance.now() - start;
      if (elapsed > 10) {
        console.warn(`Readability calc took ${elapsed}ms`);
      }
      setStats({ words, paragraphs, sentences, readingTime, readability });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content]);

  const isLowReadability = stats.readability > 0 && stats.readability < 30;

  const getReadabilityLabel = (score: number): string => {
    if (score === 0) return '无数据';
    if (score >= 90) return '非常容易';
    if (score >= 80) return '容易';
    if (score >= 70) return '较容易';
    if (score >= 60) return '中等';
    if (score >= 50) return '较难';
    if (score >= 30) return '困难';
    return '非常困难';
  };

  const getReadabilityColor = (score: number): string => {
    if (score === 0) return 'text-gray-400';
    if (score >= 70) return 'text-success';
    if (score >= 30) return 'text-primary-500';
    return 'text-warning';
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-3">
        写作统计
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">总字数</div>
          <div className="text-xl font-bold text-white">
            <AnimatedNumber value={stats.words} />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">段落</div>
          <div className="text-xl font-bold text-white">
            <AnimatedNumber value={stats.paragraphs} />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">句子</div>
          <div className="text-xl font-bold text-white">
            <AnimatedNumber value={stats.sentences} />
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-white/60 mb-1">预计阅读</div>
          <div className="text-xl font-bold text-white">
            <AnimatedNumber value={stats.readingTime} suffix=" 分钟" />
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg p-4 border transition-all duration-300 ${
          isLowReadability
            ? 'bg-gradient-to-r from-warning/30 to-warning/10 border-warning animate-pulse-warning'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <div className="text-xs text-white/60 mb-2">可读性评分 (Flesch-Kincaid)</div>
        <div className="flex items-baseline gap-3">
          <div
            className={`text-3xl font-bold ${getReadabilityColor(stats.readability)} ${
              isLowReadability ? 'animate-pulse-warning' : ''
            }`}
          >
            <AnimatedNumber value={stats.readability} />
          </div>
          <div className="text-sm text-white/70">/ 100</div>
        </div>
        <div
          className={`text-sm mt-1 font-medium ${
            isLowReadability ? 'text-warning' : 'text-white/70'
          }`}
        >
          {isLowReadability && <span className="mr-1">⚠️</span>}
          {getReadabilityLabel(stats.readability)}
          {isLowReadability && <span className="ml-1">(建议简化表达)</span>}
        </div>

        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isLowReadability
                ? 'bg-gradient-to-r from-warning to-warning-light animate-pulse-warning'
                : stats.readability >= 70
                ? 'bg-gradient-to-r from-success to-success-light'
                : 'bg-gradient-to-r from-primary-300 to-accent'
            }`}
            style={{ width: `${stats.readability}%` }}
          ></div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 text-xs text-white/50 space-y-1">
        <div className="flex justify-between">
          <span>0-30</span>
          <span className="text-warning">需改进</span>
        </div>
        <div className="flex justify-between">
          <span>30-60</span>
          <span className="text-primary-300">一般</span>
        </div>
        <div className="flex justify-between">
          <span>60-100</span>
          <span className="text-success">良好</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
