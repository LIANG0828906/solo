import { useState, useCallback } from 'react';
import { useScoringStore } from './ScoringStore';
import type { DimensionConfig, ScoreRecord } from '@/types';

const DIMENSIONS: DimensionConfig[] = [
  { key: 'techDepth', label: '技术深度', color: '#4CAF50' },
  { key: 'expression', label: '表达能力', color: '#2196F3' },
  { key: 'logic', label: '逻辑思维', color: '#FFC107' },
  { key: 'adaptability', label: '应变能力', color: '#9C27B0' },
];

interface ScoringPanelProps {
  interviewId: string | null;
  questionId: string | null;
}

export default function ScoringPanel({ interviewId, questionId }: ScoringPanelProps) {
  const { scores, addScore } = useScoringStore();
  const [values, setValues] = useState<Record<string, number>>({
    techDepth: 5,
    expression: 5,
    logic: 5,
    adaptability: 5,
  });
  const [comment, setComment] = useState('');

  const existingRecord = scores.find(
    (s) => s.interviewId === interviewId && s.questionId === questionId && s.submitted
  );

  const isFrozen = !!existingRecord;

  const handleSliderChange = useCallback((key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!interviewId || !questionId || isFrozen) return;

    const record: ScoreRecord = {
      interviewId,
      questionId,
      timestamp: Date.now(),
      techDepth: values.techDepth,
      expression: values.expression,
      logic: values.logic,
      adaptability: values.adaptability,
      comment,
      submitted: true,
    };
    addScore(record);
  }, [interviewId, questionId, isFrozen, values, comment, addScore]);

  const displayValues = isFrozen && existingRecord
    ? {
        techDepth: existingRecord.techDepth,
        expression: existingRecord.expression,
        logic: existingRecord.logic,
        adaptability: existingRecord.adaptability,
      }
    : values;

  const displayComment = isFrozen && existingRecord ? existingRecord.comment : comment;

  if (!interviewId || !questionId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        等待面试开始...
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-700">评分面板</h3>
        {isFrozen && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">已提交</span>
        )}
      </div>

      <div className="space-y-3">
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-16 shrink-0">{dim.label}</span>
            <div className="relative w-[180px]">
              <input
                type="range"
                min={1}
                max={10}
                value={displayValues[dim.key]}
                onChange={(e) => handleSliderChange(dim.key, Number(e.target.value))}
                disabled={isFrozen}
                className="slider-input w-full"
                style={{
                  color: dim.color,
                }}
              />
            </div>
            <span
              className="font-bold text-[18px] min-w-[28px] text-center"
              style={{ color: dim.color }}
            >
              {displayValues[dim.key]}
            </span>
          </div>
        ))}
      </div>

      <textarea
        value={displayComment}
        onChange={(e) => setComment(e.target.value)}
        disabled={isFrozen}
        placeholder="输入对该题的详细评价..."
        className="w-full h-[120px] mt-4 p-3 bg-[#FAFAFA] rounded-lg border border-gray-200
          text-sm text-gray-700 resize-none focus:outline-none focus:border-[#2196F3]
          disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-200"
      />

      {!isFrozen && (
        <button
          onClick={handleSubmit}
          className="mt-3 w-full py-2.5 bg-[#2196F3] text-white rounded-lg font-medium
            hover:bg-[#1976D2] active:scale-[0.98] transition-all duration-200"
        >
          提交评分
        </button>
      )}
    </div>
  );
}
