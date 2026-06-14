import { useMemo, useState, useEffect } from 'react';
import { useStore } from './store';
import { highlightKeywords, type ScoringPoint } from './ScoringRule';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function ProgressBar({ label, value, max, color }: ProgressBarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const barColor = percent >= 80 ? '#22c55e' : percent >= 40 ? '#eab308' : '#f87171';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-800 font-semibold">
          {value} / {max}
        </span>
      </div>
      <div
        className="w-full rounded-full bg-slate-100 overflow-hidden"
        style={{ height: '12px', borderRadius: '6px' }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
            borderRadius: '6px',
          }}
        />
      </div>
    </div>
  );
}

interface ScoringTagProps {
  point: ScoringPoint;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ScoringTag({ point, checked, onChange }: ScoringTagProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 select-none whitespace-nowrap"
      style={{
        backgroundColor: checked ? '#dbeafe' : '#f1f5f9',
        color: checked ? '#1e40af' : '#475569',
        borderRadius: '8px',
        border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
        cursor: 'pointer',
      }}
    >
      {point.description}
    </button>
  );
}

export default function ReviewPanel() {
  const { selectedId, assignments, updateScoringPoint, submitReview } = useStore();
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignment = useMemo(
    () => assignments.find((a) => a.id === selectedId),
    [assignments, selectedId]
  );

  useEffect(() => {
    setIsVisible(false);
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
    return () => cancelAnimationFrame(timer);
  }, [selectedId]);

  const highlightedSegments = useMemo(() => {
    if (!assignment) return [];
    const keywords = assignment.scoringPoints
      .filter((p) => p.checked)
      .map((p) => p.keyword);
    return highlightKeywords(assignment.studentAnswer, keywords);
  }, [assignment]);

  const wordCount = assignment?.studentAnswer.length ?? 0;

  const handleSubmit = () => {
    if (!assignment || assignment.status === 'reviewed') return;
    setIsSubmitting(true);
    setTimeout(() => {
      submitReview(assignment.id);
      setIsSubmitting(false);
    }, 200);
  };

  if (!assignment) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        请从左侧选择一道题目进行批阅
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col gap-6 p-6 overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">
            第 {assignment.index} 题：{assignment.question}
          </h2>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: assignment.status === 'reviewed' ? '#dcfce7' : '#f1f5f9',
              color: assignment.status === 'reviewed' ? '#166534' : '#64748b',
            }}
          >
            {assignment.status === 'reviewed' ? '已批阅' : '未批阅'}
          </span>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 rounded-lg p-5 overflow-y-auto"
        style={{
          backgroundColor: '#f8fafc',
          fontSize: '14px',
          lineHeight: '1.6',
          border: '1px solid #e2e8f0',
        }}
      >
        <div className="text-slate-700">
          {highlightedSegments.map((seg, i) =>
            seg.highlighted ? (
              <mark
                key={i}
                style={{
                  backgroundColor: '#fef08a',
                  color: '#854d0e',
                  padding: '0 2px',
                  borderRadius: '2px',
                }}
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">关键词匹配（评分点）</h3>
          <span className="text-xs text-slate-500">字数：{wordCount}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {assignment.scoringPoints.map((point) => (
            <ScoringTag
              key={point.id}
              point={point}
              checked={point.checked}
              onChange={(checked) => updateScoringPoint(assignment.id, point.id, checked)}
            />
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 bg-white rounded-lg p-5 border border-slate-200">
        <div className="flex items-end gap-6 mb-5">
          <div>
            <div className="text-xs text-slate-500 mb-1">总分</div>
            <div
              className="font-bold leading-none"
              style={{ fontSize: '32px', color: '#1e293b' }}
            >
              {assignment.score.totalScore}
              <span className="text-base font-normal text-slate-400 ml-1">
                / {assignment.score.maxTotalScore}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <ProgressBar
            label="内容分"
            value={assignment.score.contentScore}
            max={assignment.score.maxContentScore}
            color="#22c55e"
          />
          <ProgressBar
            label="表达分"
            value={assignment.score.expressionScore}
            max={assignment.score.maxExpressionScore}
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="flex-shrink-0 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={assignment.status === 'reviewed'}
          style={{
            width: '120px',
            height: '40px',
            backgroundColor: assignment.status === 'reviewed' ? '#94a3b8' : '#3b82f6',
            color: 'white',
            fontSize: '16px',
            fontWeight: 500,
            borderRadius: '8px',
            border: 'none',
            cursor: assignment.status === 'reviewed' ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease, transform 0.2s ease',
            transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (assignment.status !== 'reviewed') {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (assignment.status !== 'reviewed') {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }
          }}
          onMouseDown={(e) => {
            if (assignment.status !== 'reviewed') {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            if (assignment.status !== 'reviewed') {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {assignment.status === 'reviewed' ? '已提交' : '提交批阅'}
        </button>
      </div>
    </div>
  );
}
