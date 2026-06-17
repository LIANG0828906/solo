import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useScoringStore } from '../scoring/ScoringStore';
import type { InterviewMeta, ScoreRecord, DimensionConfig } from '@/types';

const DIMENSION_COLORS: Record<string, string> = {
  techDepth: '#4CAF50',
  expression: '#2196F3',
  logic: '#FFC107',
  adaptability: '#9C27B0',
};

const DIMENSION_LABELS: Record<string, string> = {
  techDepth: '技术深度',
  expression: '表达能力',
  logic: '逻辑思维',
  adaptability: '应变能力',
};

const DIMENSIONS: DimensionConfig[] = [
  { key: 'techDepth', label: '技术深度', color: '#4CAF50' },
  { key: 'expression', label: '表达能力', color: '#2196F3' },
  { key: 'logic', label: '逻辑思维', color: '#FFC107' },
  { key: 'adaptability', label: '应变能力', color: '#9C27B0' },
];

interface InterviewCardProps {
  meta: InterviewMeta;
  scores: ScoreRecord[];
  isExpanded: boolean;
  onToggle: () => void;
}

function InterviewCard({ meta, scores, isExpanded, onToggle }: InterviewCardProps) {
  const avgScores = useMemo(() => {
    if (scores.length === 0) return { techDepth: 0, expression: 0, logic: 0, adaptability: 0 };
    const sum = scores.reduce(
      (acc, s) => ({
        techDepth: acc.techDepth + s.techDepth,
        expression: acc.expression + s.expression,
        logic: acc.logic + s.logic,
        adaptability: acc.adaptability + s.adaptability,
      }),
      { techDepth: 0, expression: 0, logic: 0, adaptability: 0 }
    );
    return {
      techDepth: Math.round((sum.techDepth / scores.length) * 10) / 10,
      expression: Math.round((sum.expression / scores.length) * 10) / 10,
      logic: Math.round((sum.logic / scores.length) * 10) / 10,
      adaptability: Math.round((sum.adaptability / scores.length) * 10) / 10,
    };
  }, [scores]);

  return (
    <div
      className="border border-gray-100 rounded-lg overflow-hidden
        hover:border-gray-200 transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-gray-700">
            {meta.interviewId.slice(0, 8)}
          </span>
          <span className="text-xs text-gray-400">{meta.date}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dim.color }}
                title={`${dim.label}: ${avgScores[dim.key]}`}
              />
              <span className="text-xs text-gray-500">{avgScores[dim.key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? '600px' : '0' }}
      >
        <div className="px-3 pb-3 border-t border-gray-100 pt-2">
          {scores.map((score, idx) => (
            <div key={score.questionId} className="py-2 border-b border-gray-50 last:border-0">
              <div className="text-xs text-gray-500 mb-1">题目 {idx + 1}</div>
              <div className="grid grid-cols-2 gap-1">
                {DIMENSIONS.map((dim) => (
                  <div key={dim.key} className="flex items-center gap-1 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: dim.color }}
                    />
                    <span className="text-gray-500">
                      {DIMENSION_LABELS[dim.key]}
                    </span>
                    <span className="font-medium text-gray-700">
                      {score[dim.key] as number}
                    </span>
                  </div>
                ))}
              </div>
              {score.comment && (
                <p className="text-xs text-gray-500 mt-1 pl-3 italic">
                  {score.comment}
                </p>
              )}
            </div>
          ))}
          {scores.length === 0 && (
            <div className="text-xs text-gray-400 py-2">暂无评分记录</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlaybackPanel() {
  const { interviews, getScoresByInterview } = useScoringStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const filteredInterviews = useMemo(() => {
    const sorted = [...interviews].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (!debouncedSearch) return sorted;
    return sorted.filter((i) =>
      i.interviewId.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [interviews, debouncedSearch]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-base font-semibold text-gray-700 mb-3 px-1">面试记录</h2>

      <div className="mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索面试ID..."
          className="w-[200px] px-4 py-2 text-sm rounded-full border border-[#BDBDBD]
            focus:outline-none focus:border-[#2196F3] transition-colors duration-200"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredInterviews.map((meta) => (
          <InterviewCard
            key={meta.interviewId}
            meta={meta}
            scores={getScoresByInterview(meta.interviewId)}
            isExpanded={expandedId === meta.interviewId}
            onToggle={() => handleToggle(meta.interviewId)}
          />
        ))}

        {debouncedSearch && filteredInterviews.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-8">未找到匹配记录</div>
        )}

        {interviews.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-8">暂无面试记录</div>
        )}
      </div>
    </div>
  );
}
